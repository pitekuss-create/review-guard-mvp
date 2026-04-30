import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { storeId } = body;
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!storeId) {
    return NextResponse.json({ error: "storeId is required" }, { status: 400 });
  }

  const { data: store, error: findError } = await supabase
    .from("stores")
    .select("id")
    .eq("user_id", user.id)
    .eq("id", storeId)
    .single();

  if (findError || !store) {
    return NextResponse.json({ error: "Store not found for this user" }, { status: 404 });
  }

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("stores")
    .update({ name })
    .eq("id", store.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, name });
}
