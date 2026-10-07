import { FieldPath, FieldValue } from "firebase-admin/firestore";
import { firestore } from "./firebase";

/** Funnel steps counted anonymously per day (Europe/Brussels), only for visitors who accepted analytics. */
export const TRACKED = ["page_view", "view_product", "select_size", "size_advice", "add_to_cart", "begin_checkout"] as const;
export type Tracked = (typeof TRACKED)[number];

const day = (ms = Date.now()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" }).format(new Date(ms));

export async function countEvent(name: Tracked) {
  const db = firestore();
  if (!db) return;
  await db.collection("analytics").doc(day()).set({ [name]: FieldValue.increment(1) }, { merge: true });
}

/** Sums the counters for the days between the two dates (inclusive, YYYY-MM-DD). */
export async function funnel(from: string, to: string): Promise<Record<Tracked, number>> {
  const totals = Object.fromEntries(TRACKED.map((t) => [t, 0])) as Record<Tracked, number>;
  const db = firestore();
  if (!db) return totals;
  const snap = await db.collection("analytics").where(FieldPath.documentId(), ">=", from).where(FieldPath.documentId(), "<=", to).get();
  for (const d of snap.docs) for (const t of TRACKED) totals[t] += Number(d.data()[t]) || 0;
  return totals;
}
