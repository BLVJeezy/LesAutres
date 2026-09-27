import { money } from "./catalog";
import type { Order } from "./shop";

// Order e-mails via Resend. RESEND_API_BASE points at a local mock in tests; leave unset in production.
export const mailConfigured = () => Boolean(process.env.RESEND_API_KEY);

export type MailLine = { name: string; size: string; qty: number; price: number; image: string };

export function siteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
  return raw.replace(/\/$/, "");
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const absolute = (src: string) => (src.startsWith("/") ? `${siteUrl()}${src}` : src);

function linesTable(lines: MailLine[]) {
  return lines
    .map(
      (l) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #34362f;width:96px;vertical-align:top">
          ${l.image ? `<img src="${esc(absolute(l.image))}" width="84" height="84" alt="${esc(l.name)}" style="display:block;width:84px;height:84px;object-fit:cover;border-radius:2px;background:#1e211a">` : ""}
        </td>
        <td style="padding:14px 0 14px 14px;border-bottom:1px solid #34362f;vertical-align:top">
          <div style="font:bold 14px Arial,Helvetica,sans-serif;color:#efeee8;text-transform:uppercase">${esc(l.name)}</div>
          <div style="font:12px monospace;color:#989a92;margin-top:6px">MAAT ${esc(l.size)} · ${l.qty}×</div>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid #34362f;vertical-align:top;text-align:right;font:13px monospace;color:#efeee8;white-space:nowrap">
          ${money(l.price * l.qty)}
        </td>
      </tr>`,
    )
    .join("");
}

function layout(preheader: string, body: string) {
  return `<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"></head>
<body style="margin:0;padding:0;background:#101110">
<div style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#101110">
  <tr><td align="center" style="padding:32px 16px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
      <tr><td style="padding-bottom:28px;font:bold 22px/0.95 Arial,Helvetica,sans-serif;color:#efeee8;text-transform:uppercase;letter-spacing:-0.5px">
        Les<br><span style="color:#d595a4">Autres</span>
      </td></tr>
      ${body}
      <tr><td style="padding-top:36px;font:10px monospace;letter-spacing:1px;color:#989a92">
        SAME PEOPLE. DIFFERENT PERSPECTIVE.<br>LES AUTRES · BELGIUM, WORLDWIDE.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function totals(order: Order) {
  return `
      <tr><td style="padding-top:16px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font:12px monospace;color:#989a92">TOTAAL <span style="font-size:10px">(INCL. BTW)</span></td>
            <td style="text-align:right;font:bold 16px monospace;color:#efeee8">${money(order.total)}</td>
          </tr>
        </table>
      </td></tr>`;
}

export function customerEmail(order: Order, number: string, lines: MailLine[]) {
  const first = order.name.split(" ")[0] || "jij";
  const html = layout(
    `Bedankt voor je bestelling ${number}. We maken ze klaar.`,
    `
      <tr><td style="font:bold 30px/1 Arial,Helvetica,sans-serif;color:#efeee8;text-transform:uppercase;letter-spacing:-1px">
        Bedankt, ${esc(first)}.<br><span style="color:#d595a4">Je bent één van Les Autres.</span>
      </td></tr>
      <tr><td style="padding-top:18px;font:15px/1.55 Arial,Helvetica,sans-serif;color:#efeee8">
        Je betaling is gelukt en je bestelling <b>${esc(number)}</b> is bevestigd. We pakken ze met zorg in.
        Zodra je pakket vertrekt, sturen we je een <b>trackinglink</b> zodat je kunt volgen waar het is.
      </td></tr>
      <tr><td style="padding-top:28px;font:10px monospace;letter-spacing:1px;color:#989a92">JOUW BESTELLING</td></tr>
      <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${linesTable(lines)}</table></td></tr>
      ${totals(order)}
      <tr><td style="padding-top:28px;font:10px monospace;letter-spacing:1px;color:#989a92">VERZENDEN NAAR</td></tr>
      <tr><td style="padding-top:8px;font:14px/1.5 Arial,Helvetica,sans-serif;color:#efeee8">
        ${esc(order.name)}<br>${esc(order.address)}
      </td></tr>
      <tr><td style="padding-top:28px;font:13px/1.55 Arial,Helvetica,sans-serif;color:#989a92">
        Vragen over je bestelling? Antwoord gewoon op deze e-mail.
      </td></tr>
      <tr><td style="padding-top:24px">
        <a href="${siteUrl()}" style="display:inline-block;background:#e7e8dd;color:#14160f;padding:16px 22px;font:bold 11px monospace;letter-spacing:1px;text-decoration:none">TERUG NAAR LES AUTRES ↗</a>
      </td></tr>`,
  );
  const text = [
    `Bedankt, ${first}. Je bent één van Les Autres.`,
    ``,
    `Je bestelling ${number} is bevestigd. Zodra je pakket vertrekt, sturen we je een trackinglink.`,
    ``,
    ...lines.map((l) => `- ${l.name}, maat ${l.size} × ${l.qty}: ${money(l.price * l.qty)}`),
    `Totaal (incl. btw): ${money(order.total)}`,
    ``,
    `Verzenden naar: ${order.name}, ${order.address}`,
  ].join("\n");
  return { subject: `Bedankt voor je bestelling ${number} — Les Autres`, html, text };
}

export function shopEmail(order: Order, number: string, lines: MailLine[]) {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 0;font:11px monospace;color:#989a92;width:110px;vertical-align:top">${k}</td><td style="padding:6px 0;font:14px Arial,Helvetica,sans-serif;color:#efeee8">${v}</td></tr>`;
  const html = layout(
    `Nieuwe bestelling ${number}: ${money(order.total)}`,
    `
      <tr><td style="font:bold 26px/1 Arial,Helvetica,sans-serif;color:#efeee8;text-transform:uppercase">
        Nieuwe bestelling <span style="color:#d595a4">${esc(number)}</span>
      </td></tr>
      <tr><td style="padding-top:20px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row("KLANT", esc(order.name))}
        ${row("E-MAIL", `<a href="mailto:${esc(order.email)}" style="color:#d595a4">${esc(order.email)}</a>`)}
        ${order.phone ? row("TELEFOON", esc(order.phone)) : ""}
        ${row("ADRES", esc(order.address))}
        ${row("BETAALD", money(order.total))}
      </table></td></tr>
      <tr><td style="padding-top:22px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${linesTable(lines)}</table></td></tr>
      ${totals(order)}
      <tr><td style="padding-top:24px">
        <a href="${siteUrl()}/admin/orders/${encodeURIComponent(order.id)}" style="display:inline-block;background:#e7e8dd;color:#14160f;padding:16px 22px;font:bold 11px monospace;letter-spacing:1px;text-decoration:none">OPEN IN ADMIN ↗</a>
      </td></tr>`,
  );
  const text = [
    `Nieuwe bestelling ${number}: ${money(order.total)}`,
    `Klant: ${order.name} <${order.email}>${order.phone ? `, ${order.phone}` : ""}`,
    `Adres: ${order.address}`,
    ...lines.map((l) => `- ${l.name}, maat ${l.size} × ${l.qty}`),
    `${siteUrl()}/admin/orders/${order.id}`,
  ].join("\n");
  return { subject: `Nieuwe bestelling ${number} — ${money(order.total)} — ${order.name}`, html, text };
}

export async function sendMail(to: string, mail: { subject: string; html: string; text: string }, replyTo?: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const res = await fetch(`${process.env.RESEND_API_BASE ?? "https://api.resend.com"}/emails`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM ?? "Les Autres <onboarding@resend.dev>",
      to: [to],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      ...(replyTo && { reply_to: replyTo }),
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return true;
}
