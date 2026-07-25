import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET() {
  const pubId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID?.replace("ca-pub-", "") || "1957290146491296";
  const content = `google.com, pub-${pubId}, DIRECT, f08c47fec0942fa0\n`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
