import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise, { connectToDatabase } from "@/lib/mongodb";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

import { verifyAccessToken } from "@/lib/auth/jwt";

const nextAuthResult = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectToDatabase();

        const email = credentials.email.toString().toLowerCase().trim();
        const user = await User.findOne({ email });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password.toString(),
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role || "user",
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      if (token.email) {
        try {
          await connectToDatabase();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            token.role = dbUser.role || "user";
            token.id = dbUser._id.toString();
            // Ensure wallet exists for legacy / existing users
            const { getOrCreateUserWallet } = await import("@/lib/wallet");
            await getOrCreateUserWallet(dbUser._id);
          }
        } catch (err) {
          console.warn("Auth token wallet sync error:", err);
        }
      }
      return token;
    },
  },
});

export const { handlers, signIn, signOut } = nextAuthResult;

const baseAuth = nextAuthResult.auth;

export const auth: typeof baseAuth = ((...args: any[]) => {
  // If invoked as a route handler wrapper: export const GET = auth(async (req) => { ... })
  if (typeof args[0] === "function") {
    const handler = args[0];
    return baseAuth(async (req: any, ctx: any) => {
      if (!req.auth?.user?.id) {
        // Fallback to Mobile Bearer Token authentication
        const authHeader = req.headers?.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.substring(7).trim();
          try {
            const decoded = verifyAccessToken(token);
            req.auth = {
              user: {
                id: decoded.userId,
                email: decoded.email,
                role: decoded.role,
              },
            };
          } catch {
            // Invalid or expired token
          }
        }
      }
      return handler(req, ctx);
    });
  }

  // Direct call: await auth()
  return (baseAuth as any)(...args);
}) as any;
