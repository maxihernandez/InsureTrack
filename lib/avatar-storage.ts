import "server-only";
import { createClient } from "@supabase/supabase-js";

const bucket = "marianela-team-board";

function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Private avatar storage is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function uploadAvatar(userId: string, file: File) {
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `avatars/${userId}/profile-${Date.now()}.${extension}`;
  const { error } = await client().storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("Unable to save the profile photo.");
  return path;
}

export async function signedAvatarUrl(path: string | null) {
  if (!path) return null;
  try { const { data, error } = await client().storage.from(bucket).createSignedUrl(path, 60 * 60); return error ? null : data.signedUrl; }
  catch { return null; }
}
