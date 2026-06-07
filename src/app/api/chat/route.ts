import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import type { ChatRequest, TravelItinerary, Activity, ItineraryDay } from "@/lib/types";

const ai = new GoogleGenAI({});

const SYSTEM_PROMPT = `You are an expert travel planner. Respond ONLY with valid JSON — no markdown, no code fences, no prose outside the JSON object.

## Multi-destination trips
- Distribute days across destinations proportionally to how much there is to see, not simply equally.
- Order destinations to minimize geographic backtracking.
- On any day the traveler moves between cities, reduce activities to account for transit time and schedule only activities in the city where they will sleep that night.

## Daily scheduling
- 3–5 activities per day; leave realistic gaps for transit between sites, meals, and rest.
- Sequence activities by time of day: morning → afternoon → evening.
- Cluster activities geographically within each day — avoid placing back-to-back activities on opposite sides of the city.
- Respect realistic opening hours: most museums open at 9–10 AM; lunch service runs 12–2 PM; dinner is typically 7–9 PM in Europe, earlier in North America and Asia.

## Budget
- estimatedCost is the USD cost per person for that specific activity (entrance fee, meal, tour price, etc.).
- The sum of estimatedCost values across all activities in a single day must not exceed the stated daily budget.

## Interests
- Emphasize activities that match the stated interests, but maintain variety — a food-focused trip should still include a cultural or historical experience, for example.

## Tips
- Include 3–5 practical tips covering a mix of: advance booking requirements, local etiquette or customs, transportation advice, and any seasonal or timing considerations for the specific destinations.

## JSON schema — return ONLY this object:
{
  "summary": "2-3 sentence overview of the full trip",
  "totalDays": <number>,
  "dailyBudget": <number>,
  "days": [
    {
      "date": "YYYY-MM-DD",
      "location": "City, Country",
      "activities": [
        {
          "time": "HH:MM AM/PM",
          "title": "activity name",
          "description": "1-2 sentences",
          "category": "history" | "food" | "lifestyle" | "nature" | "other",
          "estimatedCost": <USD per person>
        }
      ]
    }
  ],
  "tips": ["tip"]
}`;

function isActivity(a: unknown): a is Activity {
  if (typeof a !== "object" || a === null) return false;
  const obj = a as Record<string, unknown>;
  return (
    typeof obj.time === "string" &&
    typeof obj.title === "string" &&
    typeof obj.description === "string" &&
    ["history", "food", "lifestyle", "nature", "other"].includes(obj.category as string) &&
    typeof obj.estimatedCost === "number"
  );
}

function isItineraryDay(d: unknown): d is ItineraryDay {
  if (typeof d !== "object" || d === null) return false;
  const obj = d as Record<string, unknown>;
  return (
    typeof obj.date === "string" &&
    typeof obj.location === "string" &&
    Array.isArray(obj.activities) &&
    obj.activities.every(isActivity)
  );
}

function validateItinerary(data: unknown): data is TravelItinerary {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.summary === "string" &&
    typeof obj.totalDays === "number" &&
    typeof obj.dailyBudget === "number" &&
    Array.isArray(obj.days) &&
    obj.days.every(isItineraryDay) &&
    Array.isArray(obj.tips) &&
    obj.tips.every((t: unknown) => typeof t === "string")
  );
}

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();
    const { destinations, startDate, endDate, interests, budget, additionalContext } = body;

    if (!destinations?.length) {
      return NextResponse.json({ error: "At least one destination is required" }, { status: 400 });
    }
    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Travel dates are required" }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return NextResponse.json({ error: "Start date must be today or in the future" }, { status: 400 });
    }
    if (end < start) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }

    const totalDays =
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const userPrompt = [
      `Plan a ${totalDays}-day trip:`,
      `Destinations: ${destinations.join(", ")}`,
      `Dates: ${startDate} to ${endDate}`,
      `Interests: ${interests.length ? interests.join(", ") : "general sightseeing"}`,
      `Daily budget per person: $${budget}`,
      additionalContext ? `Additional context: ${additionalContext}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json({ error: "No response from model" }, { status: 500 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Model returned invalid JSON" }, { status: 500 });
    }

    if (!validateItinerary(parsed)) {
      return NextResponse.json(
        { error: "Model response did not match expected schema" },
        { status: 500 }
      );
    }

    return NextResponse.json({ result: parsed });
    } catch (error: any) {
        console.error("Gemini API Error:", error);

        let message = "Failed to generate itinerary";
        let code = 500;

        try {
            if (error.message && typeof error.message === 'string') {
                const jsonStart = error.message.indexOf('{');
                if (jsonStart !== -1) {
                    const jsonString = error.message.substring(jsonStart);
                    const parsedError = JSON.parse(jsonString);

                    if (parsedError?.error) {
                        code = parsedError.error.code || 503;
                        message = parsedError.error.message || message;
                    }
                }
            } 
            else if (error.code || error.status) {
                code = error.code === 'UNAVAILABLE' || error.code === 503 ? 503 : 500;
                message = error.message || message;
            }
        } catch (parseError) { console.error("Failed to parse inner API error payload:", parseError);}

        return NextResponse.json({success: false, error: message}, {status: code});
    }
}   