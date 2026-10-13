"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOfficer } from "@/lib/auth";
import { easternToIso } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export type EventFormState = { error?: string };

export async function saveEvent(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  await requireOfficer();
  const id = String(formData.get("id") ?? "") || undefined;
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  const location = String(formData.get("location") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  let link = String(formData.get("link") ?? "").trim() || null;

  if (!title) return { error: "Add a title." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(start)) return { error: "Pick a date and start time." };
  if (end && !/^\d{2}:\d{2}$/.test(end)) return { error: "The end time isn't valid." };
  if (end && end <= start) return { error: "The end time has to be after the start time." };
  if (link && !/^https?:\/\//i.test(link)) link = `https://${link}`;

  const row = {
    title,
    location,
    description,
    link,
    starts_at: easternToIso(date, start),
    ends_at: end ? easternToIso(date, end) : null,
  };

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("events").update(row).eq("id", id)
    : await supabase.from("events").insert(row);
  if (error) return { error: `Couldn't save: ${error.message}` };

  revalidatePath("/", "layout");
  redirect(`/admin/events?done=${id ? "updated" : "added"}`);
}

export async function deleteEvent(formData: FormData) {
  await requireOfficer();
  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", String(formData.get("id") ?? ""));
  revalidatePath("/", "layout");
  redirect("/admin/events?done=deleted");
}
