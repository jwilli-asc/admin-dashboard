import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { GoogleSignInButton } from "@/components/google-sign-in-button";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-12 px-8">
      <Image
        src="/asc-logo.png"
        alt="Austin STEM Center logo"
        width={320}
        height={323}
        priority
        className="h-auto w-full max-w-80"
      />
      <GoogleSignInButton />
    </div>
  );
}
