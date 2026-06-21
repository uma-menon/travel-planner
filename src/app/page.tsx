//landing = login page
"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.replace("/profile");// redirect to profile if already logged in
  }, [session, router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
      <h1
        className="text-4xl font-light tracking-[0.15em] text-primary uppercase mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Next Stop
      </h1>
      <p className="text-sm text-muted-foreground mb-10">
        Personalized, AI-powered travel planning and itinerary generation
      </p>

      <div className="flex flex-col gap-3 w-72">
        <Button
          size="lg"
          onClick={() => signIn("google", { callbackUrl: "/profile" })}// sign in with Google, redirect to profile on success
          className="w-full"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" aria-hidden>
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push("/plan")}// continue as guest, redirect to new itinerary page
          className="w-full"
        >
          Continue as Guest
        </Button>
      </div>

      <p className="text-sm text-muted-foreground/50 mt-8 max-w-xs text-center">
        Sign in to save itineraries.
      </p>
    </div>
  );
}
