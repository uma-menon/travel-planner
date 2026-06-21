# Next Stop

> AI-powered travel itinerary generator grounded in real destination data.

**Check it out here → [https://travel-planner-umamenon.vercel.app](https://travel-planner-umamenon.vercel.app)**

<img width="496" height="310" alt="Screenshot 2026-06-21 at 3 47 35 PM" src="https://github.com/user-attachments/assets/6dfc86f0-85e6-4d11-96ec-e5edc94d7b63" />
<img width="496" height="310" alt="Screenshot 2026-06-21 at 4 00 22 PM" src="https://github.com/user-attachments/assets/f84d52bf-60d3-496d-8197-bd0edd35e3d4" />
<img width="496" height="310" alt="Screenshot 2026-06-21 at 3 56 19 PM" src="https://github.com/user-attachments/assets/65106ea5-f1db-42d8-9253-c08f76d1067b" />
<img width="496" height="310" alt="Screenshot 2026-06-21 at 4 00 03 PM" src="https://github.com/user-attachments/assets/300ddbfd-ef02-418a-849d-a7427882ae0d" />

## Why I Built This

My family planned a trip last year using an AI chatbot, but unfortunately had to come up with a new plan on the spot on Day 2 of the trip.

The issue was that chatbot's plan looked great until we were actually there: a botanical garden listed for Monday was closed on Mondays, a highly rated restaurant didn't exist, a museum with $5 tickets was only $5 for students, and activities on opposite sides of the city were listed back-to-back without consideration of travel time. We didn't expect to have to manually check each item was real, open, and reachable.

Next Stop first asks *you* questions, then fetches live WikiVoyage articles at generation time and uses RAG to ground the itinerary in real destination and activity data. Activities include cost estimates that sum to your daily budget, and the calendar view makes time allocation visible so you can ensure it's your perfect amount of vacation dead time. Multi-destination trips are sequenced to minimize backtracking, and everything exports to your favorite calendar app with timezone-adjusted times.

## Features

- **4-step guided wizard** — destination picker → interests → daily budget → optional notes, with inline validation at each step
- **RAG-grounded itineraries** — every itinerary is anchored to live WikiVoyage articles, not just model priors (see `Architecture` below)
- **Multi-destination sequencing** — days distributed proportionally, cities ordered to minimize geographic backtracking
- **Dual itinerary views** — calendar view with color-coded time-of-day events, or a compact list view
- **ICS export** — import your full itinerary, timezone-adjusted, into any calendar app
- **Budget-aware scheduling** — per-activity cost estimates that sum to the stated daily budget
- **Google login** — sign in with Google OAuth to save itineraries, or continue as a guest
- **Saved itineraries** — save generated trips to your profile dashboard, view them anytime, and delete when done
- **Shareable links** — each saved itinerary has a unique URL anyone can open to view the full trip

## Architecture

```mermaid
flowchart TD
    subgraph Browser["Browser — Next.js App Router"]
        Login[Login / Guest]
        W[4-step Wizard]
        C[Calendar View]
        L[List View]
        Profile[Profile Dashboard]
    end

    subgraph Auth["Authentication & Storage"]
        NA[NextAuth — Google OAuth]
        SB[(Supabase — itineraries table)]
    end

    subgraph API["Next.js API Route  /api/chat"]
        direction TB
        F["① Fetch WikiVoyage HTML\n(Next.js 24 h cache)"]
        P["② Parse & chunk by section\n(Overview · Do · Eat · See · Sleep …)"]
        E["③ Batch embed  chunks + query\ngemini-embedding-001"]
        R["④ Cosine similarity rank → top 8 chunks"]
        G["⑤ Generate structured JSON\ngemini-flash-latest  ›  fallback chain"]
        V["⑥ Validate against TypeScript schema"]
    end

    subgraph Ext["External Services"]
        WV[(WikiVoyage\nMediaWiki API)]
        GE[Gemini Embedding API]
        GG[Gemini Generation API]
    end

    Login --> W
    W -- "destinations · dates\ninterests · budget" --> API
    Login <--> NA
    C -- "Save Itinerary" --> SB
    Profile <--> SB
    F <--> WV
    F --> P --> E
    E <--> GE
    E --> R --> G
    G <--> GG
    G --> V
    V --> C
    V --> L
```

### Data flow

1. User's destinations hit `/api/chat`.
2. Server fetches each destination's WikiVoyage article, parses the HTML into section chunks (Overview, Do, Eat, Sleep, etc.), and caches responses for 24 hours via Next.js `fetch` revalidation.
3. All chunks **plus** the user's query are embedded together in a single batched call to `gemini-embedding-001`.
4. Computes cosine similarity between the query vector and every chunk vector, and the top 8 chunks are then selected.
5. Selected 8 chunks appended to the system prompt as grounded context before generation.
6. `gemini-flash-latest` (currently 3.5-Flash) generates a validated JSON itinerary. If it returns a 503 due to model overload, the server retries with `gemini-flash-lite-latest` (currently 3.1-Flash-Lite).
7. The response is validated against the TypeScript `TravelItinerary` schema before being returned to the client.


### JSON schema

The model is constrained to return only this object:

```ts
{
  summary:     string          // 2-3 sentence trip overview
  totalDays:   number
  dailyBudget: number          // USD per person per day
  days: [{
    date:       string         // YYYY-MM-DD
    location:   string         // City, Country
    timezone:   string         // IANA identifier, e.g. "America/New_York"
    activities: [{
      time:          string    // HH:MM AM/PM
      title:         string
      description:   string
      category:      "history" | "food" | "lifestyle" | "nature" | "other"
      estimatedCost: number    // USD per person
    }]
  }]
  tips: string[]               // 3-5 practical travel tips
}
```


## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui |
| Calendar | @calendarjs/ce |
| AI / Embeddings | Google Gemini API (`@google/genai`) |
| Auth | NextAuth (Google OAuth) |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel |
| Data source | WikiVoyage MediaWiki API |



## Local Setup

```bash
git clone https://github.com/uma-menon/travel-planner
cd travel-planner
npm install
```

Create `.env`:

```env
# LLM and embeddings
GEMINI_API_KEY=

# Google OAuth Credentials
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# NextAuth credentials
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Database credentials
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

```bash
npm run dev # → http://localhost:3000
```

## Currently working on...
- **Saved itineraries** – add shared itineraries to your itinerary dashboard, and make changes to your saved itineraries
- **RAG evals** — build an evaluation harness to measure retrieval quality (precision/recall of relevant chunks) and generation quality (factual accuracy, hallucination rate)
- **Map view** — integrate a maps API to render alongside the calendar and list views
