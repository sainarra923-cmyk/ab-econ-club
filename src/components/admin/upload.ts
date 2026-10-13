"use client";
import { createClient } from "@/lib/supabase/client";

const ALLOWED = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

/** Uploads an image to the shared "images" bucket and returns its public URL. */
export async function uploadImage(file: File, userId: string): Promise<string> {
  if (!ALLOWED.includes(file.type)) throw new Error("Use a PNG, JPG, GIF, or WebP image.");
  if (file.size > MAX_BYTES) throw new Error("That image is over 8 MB. Try a smaller one.");

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const supabase = createClient();
  const { error } = await supabase.storage.from("images").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return supabase.storage.from("images").getPublicUrl(path).data.publicUrl;
}
