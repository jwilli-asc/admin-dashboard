import { NextRequest, NextResponse } from "next/server";

import { getClickUpAuthorizeUrl, isClickUpConfigured } from "@/lib/clickup";

export function GET(request: NextRequest) {
  if (!isClickUpConfigured()) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const redirectUri = new URL("/api/clickup/callback", request.url).toString();
  return NextResponse.redirect(getClickUpAuthorizeUrl(redirectUri));
}
