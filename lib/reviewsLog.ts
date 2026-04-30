import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export type ReviewLogPayload = {
  store_id: string;
  test_type: number;
  rating: number;
  selected_tags: string;
  generated_text: string;
  is_copied?: boolean;
};

export async function insertReviewLog(
  payload: ReviewLogPayload,
): Promise<{ id: string } | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("reviews_log")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    console.error("[reviews_log insert]", error.message);
    return null;
  }

  return data;
}

export async function markReviewLogCopied(id: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("reviews_log")
    .update({ is_copied: true })
    .eq("id", id);

  if (error) {
    console.error("[reviews_log update is_copied]", error.message);
    return false;
  }

  return true;
}
