import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/server";

// One-click unsubscribe used by Gmail and other mail apps (List-Unsubscribe-Post).
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (/^[0-9a-f-]{36}$/i.test(token) && isSupabaseConfigured) {
    await createAdminClient()
      .from("subscribers")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("token", token);
  }
  return new NextResponse(null, { status: 200 });
}
