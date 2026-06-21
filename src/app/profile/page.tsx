"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type SavedItinerary = {
  id: string;
  title: string;
  destinations: string[];
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  created_at: string;
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [itineraries, setItineraries] = useState<SavedItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    const res = await fetch(`/api/itineraries/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItineraries((prev) => prev.filter((it) => it.id !== id));
    }
    setDeleting(null);
  }

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");// redirect to home if not logged in
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/itineraries")
      .then((res) => res.json())
      .then((data) => setItineraries(data.itineraries ?? []))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 px-8 py-4 flex items-center justify-between">
        <div>
          <Link href="/">
            <h1
              className="text-xl font-light tracking-[0.15em] text-primary uppercase cursor-pointer"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Next Stop
            </h1>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {session?.user?.email}
          </p>
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
            Sign out
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold">Your Itineraries</h2>
          <Button onClick={() => router.push("/plan")} size="sm">
            +
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading itineraries…
          </p>
        ) : itineraries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              No saved itineraries yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {itineraries.map((it) => (
              <div
                key={it.id}
                className="group relative border border-border rounded-lg p-4 hover:border-primary/40 transition-colors"
              >
                <button
                  onClick={() => handleDelete(it.id)}
                  disabled={deleting === it.id}
                  className="absolute -top-2.5 -right-2.5 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-full border border-destructive bg-background text-destructive text-xs font-medium hover:bg-destructive/10"
                >
                  ×
                </button>{/*delete button for each itinerary*/}

                <Link href={`/itinerary/${it.id}`} className="block">
                  <h3 className="font-medium text-foreground mb-1.5">
                    {it.title}
                  </h3>
                  <div className="flex items-center text-xs text-muted-foreground/70">{/*dates of each itinerary*/}
                    {it.start_date && it.end_date && (
                      <span>
                        {new Date(it.start_date).toLocaleDateString()} –{" "}
                        {new Date(it.end_date).toLocaleDateString()}
                      </span>
                    )}
                    {it.start_date && it.end_date && it.budget && (
                      <span className="mx-2 text-muted-foreground/30">●</span>
                    )}
                    {it.budget && <span>${it.budget}/day</span>}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
