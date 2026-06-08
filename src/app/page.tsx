"use client";

import * as React from "react";
import { type DateRange } from "react-day-picker";
import { CalendarRange } from "@/components/CalendarRange";
import { CheckboxGroup } from "@/components/CheckboxGroup";
import { DestinationPicker, type Destination } from "@/components/DestinationPicker";
import { TextareaButton } from "@/components/TextareaButton";
import { FieldSlider } from "@/components/FieldSlider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TravelItinerary } from "@/lib/types";
import { TravelCalendar } from "@/components/TravelCalendar";

const STEPS = [
  { id: "destination", label: "Where & When" },
  { id: "interests", label: "Interests" },
  { id: "budget", label: "Budget" },
  { id: "notes", label: "Finalize" },
];

export default function Home() {
  const [destinations, setDestinations] = React.useState<Destination[]>([]);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [interests, setInterests] = React.useState<string[]>([]);
  const [budget, setBudget] = React.useState(200);
  const [additionalContext, setAdditionalContext] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<TravelItinerary | null>(null);
  const [step, setStep] = React.useState(0);
  const [view, setView] = React.useState<'calendar' | 'list'>('calendar');

  const hasResult = result !== null;

  function validateStep(): string | null {
    if (step === 0) {
      if (destinations.length === 0) return "Please select at least one destination.";
      if (!dateRange?.from || !dateRange?.to) return "Please select a travel date range.";
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dateRange.from < today) return "Start date must be today or in the future.";
      if (dateRange.to < dateRange.from) return "End date must be after start date.";
    }
    return null;
  }

  function handleNext() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => s + 1);
  }

  function handleBack() {
    setError(null);
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (destinations.length === 0) { setError("Please select at least one destination."); return; }
    if (!dateRange?.from || !dateRange?.to) { setError("Please select a travel date range."); return; }
    if (dateRange.from < today) { setError("Start date must be today or in the future."); return; }
    if (dateRange.to < dateRange.from) { setError("End date must be after start date."); return; }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinations: destinations.map((d) => d.label),
          startDate: dateRange!.from!.toISOString().split("T")[0],
          endDate: dateRange!.to!.toISOString().split("T")[0],
          interests,
          budget,
          additionalContext: additionalContext.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setResult(data.result);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Full-width header strip */}
      <header className="shrink-0 border-b border-border/40 flex items-center justify-center py-3.5">
        <h1
          className="text-2xl font-light tracking-[0.15em] text-primary uppercase"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Travel Planner{/* tracking-[0.25em] */}
        </h1>
      </header>

      {/* Main two-column layout */}
      <div className="flex flex-1 overflow-hidden">

      {/* Left panel */}
      <aside className="w-[500px] shrink-0 border-r border-border flex flex-col h-full overflow-y-auto">
        <div className="px-8 pt-5 pb-4 border-b border-border/50 shrink-0">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Enter your destination, dates, interests, and budget to generate a day-by-day itinerary.
          </p>
        </div>
        <div className="flex-1 flex flex-col px-8 py-6">
          {hasResult ? (
            /* Stacked layout after first itinerary */
            <div className="space-y-8">
              <DestinationPicker destinations={destinations} setDestinations={setDestinations} />
              <CalendarRange dateRange={dateRange} setDateRange={setDateRange} />
              <CheckboxGroup interests={interests} setInterests={setInterests} />
              <FieldSlider value={budget} setValue={setBudget} />
              <TextareaButton
                value={additionalContext}
                onChange={setAdditionalContext}
                onSubmit={handleSubmit}
                disabled={loading}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          ) : (
            /* Wizard mode */
            <div className="flex flex-col flex-1">
              {/* Step indicator dots */}
              <div className="flex items-center gap-1.5 mb-5">
                {STEPS.map((s, i) => (
                  <React.Fragment key={s.id}>
                    <div
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        i === step
                          ? "w-6 bg-[oklch(0.72_0.18_50)]"
                          : i < step
                          ? "w-3 bg-primary/60"
                          : "w-3 bg-border"
                      )}
                    />
                    {i < STEPS.length - 1 && (
                      <div className="h-px w-5 bg-border/50" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Step label */}
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                {step + 1} / {STEPS.length} — {STEPS[step].label}
              </p>

              {/* Step content — key remounts on step change to replay fade-in */}
              <div
                key={step}
                className="animate-in fade-in-0 slide-in-from-bottom-3 duration-300 ease-out space-y-4"
              >
                {step === 0 && (
                  <>
                    <DestinationPicker destinations={destinations} setDestinations={setDestinations} />
                    <CalendarRange dateRange={dateRange} setDateRange={setDateRange} />
                  </>
                )}
                {step === 1 && (
                  <CheckboxGroup interests={interests} setInterests={setInterests} />
                )}
                {step === 2 && (
                  <FieldSlider value={budget} setValue={setBudget} />
                )}
                {step === 3 && (
                  <TextareaButton
                    value={additionalContext}
                    onChange={setAdditionalContext}
                    onSubmit={handleSubmit}
                    onBack={handleBack}
                    disabled={loading}
                  />
                )}
              </div>

              {/* Validation error */}
              {error && <p className="text-sm text-destructive mt-3">{error}</p>}

              {/* Back / Next nav (steps 0–2 only; step 3 has its own buttons) */}
              {step < STEPS.length - 1 && (
                <div className="flex gap-2 mt-6">
                  {step > 0 && (
                    <Button variant="outline" size="sm" onClick={handleBack} className="flex-1">
                      Back
                    </Button>
                  )}
                  <Button size="sm" onClick={handleNext} className="flex-1">
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Right: itinerary calendar */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {!hasResult && !loading && (
          <div className="flex items-center justify-center h-full select-none">
            <p className="text-xs text-muted-foreground/40 tracking-wide">
              Your itinerary will appear here.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground animate-pulse">Planning your trip…</p>
          </div>
        )}

        {result && (
          <div className="flex flex-col h-full">
            {/* Top bar: meta + view toggle */}
            <div className="px-6 pt-4 pb-0 flex items-center justify-between shrink-0">
              <p className="text-sm font-medium text-muted-foreground">
                {result.totalDays} days · ${result.dailyBudget}/day per person
              </p>
              <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
                {(['calendar', 'list'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      "px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-wider transition-colors",
                      view === v
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar view */}
            {view === 'calendar' && (
              <div className="flex-1 min-h-0">
                <TravelCalendar result={result} dateRange={dateRange!} />
              </div>
            )}

            {/* List view */}
            {view === 'list' && (
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
          </div>
        )}
      </main>

      </div>{/* end flex flex-1 overflow-hidden */}
    </div>
  );
}
