import { BUNDLE_PRODUCTS } from "./bundles";
import { firestore } from "./firebase";
import { listOrders } from "./shop";

/** Drop 001 is a limited run: this many tees in total, all sizes together. */
export const DROP_LIMIT = 30;
/** Tees of the drop already sold outside the webshop (in person, DM); counted as sold. */
export const SOLD_OFFLINE = 7;
/** How long tees in someone's bag stay reserved for them. */
export const RESERVATION_MS = 10 * 60 * 1000;

const RESERVATIONS = "reservations";
export const isCartId = (v: unknown): v is string => typeof v === "string" && /^[a-zA-Z0-9-]{8,64}$/.test(v);

/** Tees of the drop sold in paid, not refunded orders. */
async function soldUnits() {
  const orders = await listOrders();
  return orders
    .filter((o) => o.refunded < o.total)
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
  if (!firestore()) return { limit: DROP_LIMIT, remaining: DROP_LIMIT - SOLD_OFFLINE, sold: SOLD_OFFLINE };
  const [online, reserved] = await Promise.all([soldUnits(), reservedUnits(cartId)]);
  const sold = online + SOLD_OFFLINE;
  return { limit: DROP_LIMIT, sold, remaining: Math.max(0, DROP_LIMIT - sold - reserved) };
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
