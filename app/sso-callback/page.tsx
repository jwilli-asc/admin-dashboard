"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Google sign-in could not be completed. Please try again.";
}

export default function SSOCallbackPage() {
  const clerk = useClerk();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void clerk
      .handleRedirectCallback({
        signInForceRedirectUrl: "/dashboard",
        signUpForceRedirectUrl: "/dashboard",
      })
      .catch((callbackError: unknown) => {
        console.error("Google sign-in callback failed", callbackError);
        setError(getErrorMessage(callbackError));
      });
  }, [clerk]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      {error ? (
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-semibold">Google sign-in failed</h1>
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
          <Link
            href="/"
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-secondary"
          >
            Return to sign in
          </Link>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Completing sign-in…</p>
      )}
    </main>
  );
}
