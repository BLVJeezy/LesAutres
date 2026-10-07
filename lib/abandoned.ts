import { firestore } from "./firebase";
import { abandonedEmail, mailConfigured, sendMail } from "./mail";
import { getRevolutOrder } from "./revolut";
import { getSetting, setSettings } from "./settings";
import { confirmOrder, fromDoc, getProduct, type OrderDoc } from "./shop";

const WAIT_MS = 60 * 60 * 1000; // remind after 1 hour
const MAX_AGE_MS = 48 * 60 * 60 * 1000; // never remind about checkouts older than 2 days
const SWEEP_EVERY_MS = 10 * 60 * 1000;

/**
 * Sends one reminder per unpaid checkout older than an hour. Skips it when the customer paid
 * meanwhile (this or another order). Throttled so it can run on regular traffic.
 */
export async function sweepAbandoned(force = false) {
  const db = firestore();
  if (!db || !mailConfigured()) return 0;
  const now = Date.now();
  if (!force) {
    const last = await getSetting("lastAbandonedSweep");
    if (last && now - last < SWEEP_EVERY_MS) return 0;
  }
  await setSettings({ lastAbandonedSweep: now });

  const snap = await db.collection("orders").where("status", "==", "pending").get();
  let sent = 0;
  for (const doc of snap.docs) {
    const d = { ...(doc.data() as OrderDoc), id: doc.id };
    const age = now - d.created * 1000;
    if (d.reminderSentAt || age < WAIT_MS || age > MAX_AGE_MS || !d.email) continue;

    // Paid after all? Then confirm instead of reminding.
    if (d.paymentId) {
      const remote = await getRevolutOrder(d.paymentId).catch(() => null);
      if (remote && (remote.state === "completed" || remote.state === "authorised")) {
        await confirmOrder(d.id).catch(() => false);
        continue;
      }
    }
    const paidSince = await db
      .collection("orders")
      .where("email", "==", d.email)
      .get()
      .then((s) => s.docs.some((o) => o.data().status === "paid" && o.data().created >= d.created));
    await doc.ref.update({ reminderSentAt: now });
    if (paidSince) continue;

    const order = fromDoc(d);
    const lines = await Promise.all(
      order.lines.map(async ([pid, size, qty, price]) => {
        const p = await getProduct(pid);
        return { name: p?.name ?? "Artikel", size, qty, price, image: p?.image ?? "" };
      }),
    );
    try {
      if (await sendMail(order.email, abandonedEmail(order, lines, d.checkoutUrl ?? null), process.env.ORDER_NOTIFY_EMAIL))
        sent++;
    } catch (error) {
      console.error("Abandoned cart e-mail failed", error);
    }
  }
  return sent;
}
