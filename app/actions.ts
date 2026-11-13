"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

// DB error codes (raised by the Postgres functions) → friendly copy.
function friendly(raw: string) {
  const [code, a, b] = raw.split(":");
  const map: Record<string, string> = {
    INSUFFICIENT_POINTS: `You need ${+a - +b} more points for this.`,
    OUT_OF_STOCK: `${a} just went out of stock. Remove it to continue.`,
    REWARD_INACTIVE: "One item is no longer available. Remove it to continue.",
    REWARD_NOT_FOUND: "One item is no longer available. Remove it to continue.",
    INVALID_QUANTITY: "Please check your cart quantities.",
    CART_TOO_LARGE: "Please check your cart quantities.",
    EMPTY_CART: "Your cart is empty.",
    FORBIDDEN: "You don't have permission to do that.",
    ORDER_NOT_PENDING: "This order was already processed.",
    INVALID_POINTS: "Points must be between 1 and 10,000.",
    INVALID_MESSAGE: "Message must be 1–280 characters.",
    RECIPIENT_NOT_EMPLOYEE: "Pick an employee.",
  };
  if (!map[code]) console.error("db error", raw);
  return map[code] ?? "Something went wrong. Please try again.";
}

type Result = { ok: true; order?: number } | { ok: false; error: string } | undefined;

// ---------- Employee ----------
const Items = z.array(z.object({ reward_id: z.uuid(), quantity: z.number().int().min(1).max(10) })).min(1).max(20);

/** Only ids + quantities go to the DB; it prices, checks stock/balance and dedupes by key. */
export async function redeem(items: unknown, key: unknown): Promise<Result> {
  const p = Items.safeParse(items), k = z.uuid().safeParse(key);
  if (!p.success || !k.success) return { ok: false, error: "Please check your cart quantities." };
  const { data, error } = await (await supabase()).rpc("redeem_cart", { p_items: p.data, p_idempotency_key: k.data });
  return error ? { ok: false, error: friendly(error.message) } : { ok: true, order: data.order_number };
}

// ---------- Admin (the DB re-checks the admin role on every call) ----------
const Award = z.object({ recipient: z.uuid(), points: z.coerce.number().int().min(1).max(10000), message: z.string().trim().min(1).max(280) });

export async function awardPoints(_: Result, form: FormData): Promise<Result> {
  const p = Award.safeParse(Object.fromEntries(form));
  if (!p.success) return { ok: false, error: "Pick an employee, 1–10,000 points, and a message." };
  const { error } = await (await supabase()).rpc("award_points", { p_recipient: p.data.recipient, p_points: p.data.points, p_message: p.data.message });
  if (error) return { ok: false, error: friendly(error.message) };
  refresh();
  return { ok: true };
}

const Reward = z.object({
  id: z.union([z.uuid(), z.literal("")]),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(600),
  category: z.string().trim().max(40),
  price_points: z.coerce.number().int().min(1).max(1_000_000),
  stock: z.coerce.number().int().min(0).max(100_000),
});
const IMAGE_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

export async function saveReward(_: Result, form: FormData): Promise<Result> {
  const p = Reward.safeParse(Object.fromEntries(form));
  if (!p.success) return { ok: false, error: "Check the fields: name 2–80 chars, price 1–1,000,000, stock 0 or more." };
  const sb = await supabase();
  const { id, ...fields } = p.data;
  const row: Record<string, unknown> = { ...fields, category: fields.category || null, is_active: form.get("is_active") === "on" };

  const file = form.get("image");
  if (file instanceof File && file.size) {
    const ext = IMAGE_TYPES[file.type];
    if (!ext || file.size > 2 * 1024 * 1024) return { ok: false, error: "Image must be PNG, JPG or WEBP, 2MB max." };
    const path = `${crypto.randomUUID()}.${ext}`;
    const up = await sb.storage.from("reward-images").upload(path, file, { contentType: file.type });
    if (up.error) return { ok: false, error: friendly(up.error.message) };
    row.image_url = sb.storage.from("reward-images").getPublicUrl(path).data.publicUrl;
  }

  const { error } = id ? await sb.from("rewards").update(row).eq("id", id) : await sb.from("rewards").insert(row);
  if (error) return { ok: false, error: friendly(error.message) };
  refresh();
  return { ok: true };
}

export async function updateOrder(form: FormData) {
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) return;
  const sb = await supabase();
  const reason = String(form.get("reason") ?? "").trim().slice(0, 280) || null;
  const { error } = form.get("op") === "cancel"
    ? await sb.rpc("cancel_order", { p_order_id: id.data, p_reason: reason })
    : await sb.rpc("fulfill_order", { p_order_id: id.data });
  if (error) friendly(error.message);
  refresh();
}
