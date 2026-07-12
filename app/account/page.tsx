import Link from "next/link";
import { UserProfile } from "@clerk/nextjs";

import { GOOGLE_WORKSPACE_OAUTH_SCOPES } from "@/lib/google-workspace";

export default function AccountPage() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Link
          href="/dashboard"
          className="w-fit text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to dashboard
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Account settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reconnect Google here to allow the dashboard to show your calendar events and Drive file metadata.
          </p>
        </div>
        <UserProfile
          additionalOAuthScopes={{ google: GOOGLE_WORKSPACE_OAUTH_SCOPES }}
        />
      </div>
    </main>
  );
}
