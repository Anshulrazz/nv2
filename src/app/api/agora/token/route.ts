import { NextRequest, NextResponse } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-token";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channelName, uid, role } = await req.json();

    if (!channelName) {
      return NextResponse.json({ error: "Channel name is required" }, { status: 400 });
    }

    // Get environment variables
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      console.error("Agora App ID or Certificate is missing from environment variables.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Set token expiration time to 1 hour (3600 seconds)
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Determine role (1 = publisher, 2 = subscriber)
    let userRole = RtcRole.SUBSCRIBER;
    if (role === "publisher") {
      userRole = RtcRole.PUBLISHER;
    }

    // Use string account-based token since we are likely dealing with MongoDB ObjectIDs
    let token;
    if (uid) {
      // Convert to string safely to ensure format compatibility
      token = RtcTokenBuilder.buildTokenWithUserAccount(
        appId,
        appCertificate,
        channelName,
        String(uid),
        userRole,
        privilegeExpiredTs
      );
    } else {
      // Fallback for auto-assigned uids (use 0 as fallback uid for anonymous joining)
      token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        0,
        userRole,
        privilegeExpiredTs
      );
    }

    return NextResponse.json({ token, channelName });
  } catch (error) {
    console.error("Error generating Agora token:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
