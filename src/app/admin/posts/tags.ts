import "server-only";
import { createClient } from "@/lib/supabase/server";

const STARTER_TAGS = ["Macro", "Micro", "Markets", "Policy", "Club News"];

export async function getKnownTags(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("posts").select("tags");
  const counts = new Map<string, number>();
  for (const t of STARTER_TAGS) counts.set(t, 0);
  for (const row of data ?? []) for (const t of row.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
}
