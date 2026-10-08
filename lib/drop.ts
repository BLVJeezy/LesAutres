import { BUNDLE_PRODUCTS } from "./bundles";
import { firestore } from "./firebase";
import { listOrders } from "./shop";

/** Drop 001 is a limited run: this many tees in total, all sizes together. */
export const DROP_LIMIT = 30;
/**
 * Stock count: how many tees were physically left at a given moment (unix seconds).
 * Paid webshop orders after that moment are subtracted, so the counter keeps counting down.
 */
export const STOCK_COUNT = { left: 5, at: 1791485359 };
/** How long tees in someone's bag stay reserved for them. */
export const RESERVATION_MS = 10 * 60 * 1000;

const RESERVATIONS = "reservations";
export const isCartId = (v: unknown): v is string => typeof v === "string" && /^[a-zA-Z0-9-]{8,64}$/.test(v);

/** Tees of the drop sold in paid, not refunded orders since the last stock count. */
async function soldUnits() {
  const orders = await listOrders();
  return orders
    .filter((o) => !o.test && o.refunded < o.total && o.created >= STOCK_COUNT.at)
    .reduce((n, o) => n + o.lines.filter((l) => BUNDLE_PRODUCTS.includes(l[0])).reduce((m, l) => m + l[2], 0), 0);
}

async function reservedUnits(excludeCartId?: string) {
  const db = firestore();
  if (!db) return 0;
  const snap = await db.collection(RESERVATIONS).where("expiresAt", ">", Date.now()).get();
  return snap.docs.filter((d) => d.id !== excludeCartId).reduce((n, d) => n + (Number(d.data().qty) || 0), 0);
}

/** Real availability: limit minus sold minus other people's active reservations. */
export async function dropStatus(cartId?: string) {
  if (!firestore()) return { limit: DROP_LIMIT, remaining: STOCK_COUNT.left, sold: DROP_LIMIT - STOCK_COUNT.left };
  const [since, reserved] = await Promise.all([soldUnits(), reservedUnits(cartId)]);
  const left = Math.max(0, STOCK_COUNT.left - since);
  return { limit: DROP_LIMIT, sold: DROP_LIMIT - left, remaining: Math.max(0, left - reserved) };
}

/** Reserves `qty` tees for this bag for 10 minutes. Returns false when not enough are left. */
export async function reserve(cartId: string, qty: number) {
  const db = firestore();
  const status = await dropStatus(cartId);
  if (qty > status.remaining) return { ok: false as const, ...status };
  const expiresAt = Date.now() + RESERVATION_MS;
  if (db) {
    const ref = db.collection(RESERVATIONS).doc(cartId);
    if (qty <= 0) await ref.delete();
    else await ref.set({ qty, expiresAt, updatedAt: Date.now() });
  }
  return { ok: true as const, ...status, remaining: status.remaining - Math.max(0, qty), expiresAt: qty > 0 ? expiresAt : null };
}

export async function releaseReservation(cartId: string | undefined) {
  const db = firestore();
  if (db && isCartId(cartId)) await db.collection(RESERVATIONS).doc(cartId).delete().catch(() => {});
}
