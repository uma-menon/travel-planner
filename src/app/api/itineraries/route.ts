import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  //insert new row into Supabase "itineraries" table with the itinerary data and user email
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {//logged in?
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();//get data from request body
  const { title, destinations, startDate, endDate, budget, interests, result } =
    body;//validate required fields

  if (!result) {
    return Response.json(
      { error: "Missing itinerary result" },
      { status: 400 },
    );
  }

  //insert into Supabase
  const { data, error } = await supabase
    .from("itineraries")
    .insert({
      user_id: session.user.email,
      title: title || `Trip to ${destinations?.[0] || "Unknown"}`,
      destinations: destinations || [],
      start_date: startDate || null,
      end_date: endDate || null,
      budget: budget || null,
      interests: interests || [],
      result,
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ itinerary: data });
}

export async function GET() {
  //return all itineraries for the logged in user from Supabase "itineraries" table, ordered by created_at descending
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("itineraries")
    .select("*")
    .eq("user_id", session.user.email)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ itineraries: data });
}
