import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const dashboardUrl = new URL("/dashboard", request.url);
  const errorUrl = new URL("/dashboard?clickup=error", request.url);
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(errorUrl);
  }

  const response = await fetch("https://api.clickup.com/api/v2/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.CLICKUP_CLIENT_ID,
      client_secret: process.env.CLICKUP_CLIENT_SECRET,
      code,
    }),
  });

  if (!response.ok) {
    console.error(
      `ClickUp token exchange failed with ${response.status}`,
      await response.text().catch(() => ""),
    );
    return NextResponse.redirect(errorUrl);
  }

  const { access_token } = (await response.json()) as { access_token?: string };

  if (!access_token) {
    console.error("ClickUp token exchange succeeded but returned no access token");
    return NextResponse.redirect(errorUrl);
  }

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    privateMetadata: { clickupAccessToken: access_token },
  });

  return NextResponse.redirect(dashboardUrl);
}
