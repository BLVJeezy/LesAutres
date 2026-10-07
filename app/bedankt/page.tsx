import Link from "next/link";
import { cookies, headers } from "next/headers";
import { DICTS, LANG_COOKIE, detectLang, isLang } from "@/lib/i18n";
import { money } from "@/lib/catalog";
import { shippingLabel } from "@/lib/shipping";
import { confirmOrder, orderIdForPayment, orderSummary } from "@/lib/shop";
import { ClearCart } from "./clear-cart";

export const metadata = { title: "Bedankt — Les Autres", robots: "noindex" };

async function load(orderId: string | undefined) {
  if (!orderId) return null;
  try {
    return (await confirmOrder(orderId)) ? await orderSummary(orderId) : null;
  } catch (error) {
    console.error("Confirming order failed", error);
    return null;
  }
}

export default async function Bedankt({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; _rp_oid?: string; rp_oid?: string }>;
}) {
  const params = await searchParams;
  const revolutId = params._rp_oid ?? params.rp_oid;
  const order = params.order ?? (revolutId ? (await orderIdForPayment(revolutId).catch(() => null)) ?? undefined : undefined);
  const summary = await load(order);
  const saved = (await cookies()).get(LANG_COOKIE)?.value;
  const d = DICTS[isLang(saved) ? saved : detectLang((await headers()).get("accept-language"))];
  const t = d.thanks;
  const { free, bundleDiscount: bundle, total } = d;
  return (
    <main className="thanks">
      <Link href="/" className="wordmark thanks-mark" aria-label="Les Autres, home">
        Les<br />
        <span>Autres</span>
      </Link>
      {summary ? (
        <>
          <ClearCart />
          <p className="micro">{t.confirmed(String(summary.number))}</p>
          <h1>
            {t.title[0]}
            <br />
            {t.title[1]}<span>Les Autres.</span>
          </h1>
          <p className="thanks-lead">
            {t.lead("")[0]}
            <b>{summary.order.email}</b>
            {t.lead("")[2]}
          </p>
          <ul className="thanks-lines">
            {summary.lines.map((l, i) => (
              <li key={i}>
                {l.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.image} alt="" width={72} height={72} />
                )}
                <div>
                  <b>{l.name}</b>
                  <span>
                    {t.size} {l.size} · {l.qty}×
                  </span>
                </div>
                <span>{money(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          {summary.order.discount > 0 && (
            <p className="thanks-total thanks-ship">
              <span>{bundle}</span>
              <span>−{money(summary.order.discount)}</span>
            </p>
          )}
          <p className="thanks-total thanks-ship">
            <span>{t.shipping} · {shippingLabel(summary.order.shippingMethod).toUpperCase()}</span>
            <span>{summary.order.shippingFee ? money(summary.order.shippingFee) : free}</span>
          </p>
          <p className="thanks-total">
            <span>{total}</span>
            <b>{money(summary.order.total)}</b>
          </p>
          <Link href="/" className="buy thanks-ok">
            {t.ok} <span aria-hidden="true">↗</span>
          </Link>
        </>
      ) : (
        <>
          <p className="micro">{t.payment}</p>
          <h1>{t.notFound}</h1>
          <p className="thanks-lead">
            {t.notFoundLead}
          </p>
          <Link href="/#drop" className="buy thanks-ok">
            {t.back} <span aria-hidden="true">↗</span>
          </Link>
        </>
      )}
    </main>
  );
}
