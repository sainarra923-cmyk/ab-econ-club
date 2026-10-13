import { NextResponse } from "next/server";
import { getOfficer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const officer = await getOfficer();
  if (!officer?.profile.is_admin) return new NextResponse("Not allowed", { status: 403 });

  const { data } = await createAdminClient()
    .from("subscribers")
    .select("email, created_at")
    .is("unsubscribed_at", null)
    .order("created_at");

  const rows = ["email,signed_up", ...(data ?? []).map((s) => `"${s.email.replace(/"/g, '""')}",${s.created_at}`)];
  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ab-econ-subscribers.csv"',
    },
  });
}
