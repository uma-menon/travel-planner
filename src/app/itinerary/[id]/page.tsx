//same as plan except: no save button, no editing
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import type { TravelItinerary } from "@/lib/types";
import { TravelCalendar } from "@/components/TravelCalendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

type ItineraryRecord = {
  id: string;
  title: string;
  destinations: string[];
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  interests: string[];
  result: TravelItinerary;
  created_at: string;
};

export default function ItineraryPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [record, setRecord] = useState<ItineraryRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  useEffect(() => {//fetches saved itinerary by id
    fetch(`/api/itineraries/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setRecord(data.itinerary);
      })
      .catch(() => setError("Failed to load itinerary."));
  }, [id]);

  if (error && !record) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Link href="/plan" className="text-primary text-sm underline">
          Plan your own trip
        </Link>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading itinerary…
        </p>
      </div>
    );
  }

  const result = record.result;
  const dateRange =
    record.start_date && record.end_date
      ? {
          from: new Date(record.start_date + "T00:00:00"),
          to: new Date(record.end_date + "T00:00:00"),
        }
      : undefined;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="shrink-0 border-b border-border/40 flex items-center justify-between px-6 py-3">
        <Link href="/" className="flex flex-col items-start">
          <h1
            className="text-2xl font-light tracking-[0.15em] text-primary uppercase"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Next Stop
          </h1>
          <p className="text-[10px] tracking-widest text-muted-foreground/60 uppercase mt-0.5">
            Personalized, AI-powered travel planning and itinerary generation
          </p>
        </Link>
        <div className="flex items-center gap-3">
          {session ? (
            <Link
              href="/profile"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {session.user?.email}
            </Link>
          ) : (
            <Link href="/">
              <Button variant="outline" size="sm">Sign in</Button>
            </Link>
          )}
        </div>
      </header>

      <div className="px-6 pt-4 pb-0 flex items-center justify-between shrink-0">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {result.totalDays} days · ${result.dailyBudget}/day per person
          </p>
          <p className="text-[12px] font-medium text-muted-foreground/50 mt-0.5">
            Next Stop uses Retrieval-Augmented Generation (RAG). Real data from WikiVoyage is retrieved and grounded into every itinerary, reducing hallucinations and ensuring your itinerary reflects what actually exists.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
            {(["calendar", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-wider transition-colors",
                  view === v
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "calendar" && dateRange && (
        <div className="flex-1 min-h-0">
          <TravelCalendar result={result} dateRange={dateRange} />
        </div>
      )}

      {view === "list" && (
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 max-w-2xl mx-auto w-full">
          {result.days.map((day) => (
            <div key={day.date}>
              <p className="font-medium text-primary">
                {day.date} — {day.location}
              </p>
              <ul className="mt-2 space-y-2">
                {day.activities.map((activity, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">
                      {activity.time} · {activity.title}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}— {activity.description}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}(${activity.estimatedCost})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {result.tips.length > 0 && (
            <div>
              <p className="font-medium">Tips</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
                {result.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {view === "calendar" && !dateRange && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No date range available. Switch to list view.
          </p>
        </div>
      )}
    </div>
  );
}
