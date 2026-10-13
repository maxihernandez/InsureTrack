"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isUuid } from "@/lib/validation";

export async function addGoogleReview(_previous: { ok: boolean; message: string }, form: FormData) {
  const actor = await getCurrentUser();
  if (!actor) return { ok: false, message: "Sign in to add a review." };
  const requestedUserId = String(form.get("user_id") ?? "");
  const userId = actor.role === "manager" && isUuid(requestedUserId) ? requestedUserId : actor.id;
  const reviewedOn = String(form.get("reviewed_on") ?? "");
  const rating = Number(form.get("rating"));
  const excerpt = String(form.get("excerpt") ?? "").trim();
  const reviewUrl = String(form.get("review_url") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewedOn) || !Number.isInteger(rating) || rating < 1 || rating > 5 || excerpt.length > 1000 || reviewUrl.length > 2048) return { ok: false, message: "Check the review details." };
  if (reviewUrl) { try { const url = new URL(reviewUrl); if (url.protocol !== "https:") return { ok: false, message: "The review link must use HTTPS." }; } catch { return { ok: false, message: "Enter a valid review link." }; } }
  await getDb()`insert into policyboard.google_reviews (user_id, reviewed_on, rating, excerpt, review_url, created_by) values (${userId}, ${reviewedOn}::date, ${rating}, ${excerpt || null}, ${reviewUrl || null}, ${actor.id})`;
  revalidatePath("/");
  return { ok: true, message: "Google review recorded." };
}

export async function removeGoogleReview(_previous: { ok: boolean; message: string }, form: FormData) {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== "manager") return { ok: false, message: "Only managers can remove reviews." };
  const reviewId = String(form.get("review_id") ?? "");
  if (!isUuid(reviewId)) return { ok: false, message: "The review could not be removed." };

  const removed = await getDb()<{ id: string }[]>`delete from policyboard.google_reviews where id = ${reviewId}::uuid returning id`;
  if (!removed.length) return { ok: false, message: "The review no longer exists." };
  revalidatePath("/");
  return { ok: true, message: "Google review removed." };
}
