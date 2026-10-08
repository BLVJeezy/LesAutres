import { randomBytes } from "node:crypto";
import { company } from "./company";
import { firestore } from "./firebase";
import { ORDER_NOTIFY, sendMail } from "./mail";

export type Withdrawal = {
  name: string;
  email: string;
  orderNumber: string;
  items: string;
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

export const formatWhen = (ms: number) =>
  new Date(ms).toLocaleString("nl-BE", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Brussels" });

/** Stores the withdrawal and sends the acknowledgement (durable medium) plus a notice to the shop. */
export async function recordWithdrawal(w: Withdrawal) {
  const at = Date.now();
  const id = `H-${at.toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;
  const db = firestore();
  if (db) await db.collection("withdrawals").doc(id).set({ ...w, createdAt: at });

  const when = formatWhen(at);
  const summary = [
    `Referentie: ${id}`,
    `Ontvangen op: ${when}`,
    `Naam: ${w.name}`,
    `E-mail: ${w.email}`,
    `Bestelnummer: ${w.orderNumber}`,
    `Artikelen: ${w.items || "de volledige bestelling"}`,
  ];
  const html = (intro: string) =>
    `<div style="font:15px/1.6 Arial,Helvetica,sans-serif;color:#111">${intro}<p>${summary.map(esc).join("<br>")}</p></div>`;
  const shop = ORDER_NOTIFY.length ? ORDER_NOTIFY : company.email;
  const jobs = [
    sendMail(
      w.email,
      {
        subject: `Ontvangstbevestiging herroeping ${w.orderNumber} — Les Autres`,
        html: html(
          `<p>Hallo ${esc(w.name)},</p><p>We hebben je herroeping goed ontvangen. Stuur het artikel binnen 14 dagen terug; zodra we het ontvangen hebben, betalen we je terug. Alle info vind je op onze pagina Retour &amp; herroeping.</p>`,
        ),
        text: `We hebben je herroeping goed ontvangen.\n\n${summary.join("\n")}`,
      },
    ),
  ];
  if (shop)
    jobs.push(
      sendMail(
        shop,
        {
          subject: `Herroeping ontvangen: ${w.orderNumber} — ${w.name}`,
          html: html("<p>Er is een herroeping ingediend via de website.</p>"),
          text: summary.join("\n"),
        },
        w.email,
      ),
    );
  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === "rejected") console.error("Withdrawal e-mail failed", r.reason);
  const mailed = results[0].status === "fulfilled" && results[0].value === true;
  return { id, at, mailed, stored: Boolean(db) };
}
