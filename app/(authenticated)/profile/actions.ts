"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { uploadAvatar } from "@/lib/avatar-storage";

export async function saveAvatar(_previous: { ok: boolean; message: string }, form: FormData) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sign in to update your profile." };
  const file = form.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose an image first." };
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) return { ok: false, message: "Use a JPG, PNG, or WebP image up to 2 MB." };
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = header[0] === 0xff && header[1] === 0xd8;
  const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
  const isWebp = String.fromCharCode(...header.slice(0, 4)) === "RIFF" && String.fromCharCode(...header.slice(8, 12)) === "WEBP";
  if (!isJpeg && !isPng && !isWebp) return { ok: false, message: "The selected file is not a valid image." };
  try { const path = await uploadAvatar(user.id, file); await getDb()`update policyboard.profiles set avatar_path = ${path}, updated_at = now() where user_id = ${user.id}`; }
  catch { return { ok: false, message: "The private photo storage is not configured yet." }; }
  revalidatePath("/"); revalidatePath("/profile");
  return { ok: true, message: "Profile photo saved." };
}
