import { connectToDatabase } from "@/lib/mongodb";
import { User, IUser } from "@/models/User";

export interface PremiumVerificationResult {
  isPremium: boolean;
  user: IUser | null;
}

export async function verifyPremiumUser(userId?: string): Promise<PremiumVerificationResult> {
  if (!userId) {
    return { isPremium: false, user: null };
  }

  try {
    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) {
      return { isPremium: false, user: null };
    }

    const isPremium = Boolean(user.isPremiumUser || user.role === "admin");
    return { isPremium, user };
  } catch (error) {
    console.error("Error verifying premium user:", error);
    return { isPremium: false, user: null };
  }
}
