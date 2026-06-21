import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function GET(
  //fetches a single itinerary by id from Supabase "itineraries" table
  //NOTE: does not require auth
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("itineraries")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return Response.json({ error: "Itinerary not found" }, { status: 404 });
  }

  return Response.json({ itinerary: data });
}

export async function DELETE(
  //delete an existing itinerary by id from Supabase "itineraries" table
  //only if the user_id matches the logged in user's email
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await supabase
    .from("itineraries")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.email);

  if (error) {
    console.error("Supabase delete error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
