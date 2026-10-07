import Link from "next/link";
import { money } from "@/lib/catalog";
import { shippingLabel } from "@/lib/shipping";
import { confirmOrder, orderSummary } from "@/lib/shop";
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
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  const summary = await load(order);
  return (
    <main className="thanks">
      <Link href="/" className="wordmark thanks-mark" aria-label="Les Autres, home">
        Les<br />
        <span>Autres</span>
      </Link>
      {summary ? (
        <>
          <ClearCart />
          <p className="micro">BESTELLING {summary.number} · BEVESTIGD</p>
          <h1>
            Bedankt,
            <br />
            je bent één van <span>Les Autres.</span>
          </h1>
          <p className="thanks-lead">
            Je betaling is gelukt. Je krijgt zo een bevestiging op{" "}
            <b>{summary.order.email}</b>. Zodra je pakket vertrekt, volgt er een
            trackinglink.
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
                    MAAT {l.size} · {l.qty}×
                  </span>
                </div>
                <span>{money(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          {summary.order.discount > 0 && (
            <p className="thanks-total thanks-ship">
              <span>BUNDELKORTING</span>
              <span>−{money(summary.order.discount)}</span>
            </p>
          )}
          <p className="thanks-total thanks-ship">
            <span>VERZENDING · {shippingLabel(summary.order.shippingMethod).toUpperCase()}</span>
            <span>{summary.order.shippingFee ? money(summary.order.shippingFee) : "Gratis"}</span>
          </p>
          <p className="thanks-total">
            <span>TOTAAL</span>
            <b>{money(summary.order.total)}</b>
          </p>
          <Link href="/" className="buy thanks-ok">
            JA, OKÉ <span aria-hidden="true">↗</span>
          </Link>
        </>
      ) : (
        <>
          <p className="micro">BETALING</p>
          <h1>We vinden je betaling niet terug.</h1>
          <p className="thanks-lead">
            Als je wel betaald hebt, krijg je binnen enkele minuten een bevestiging
            per e-mail. Anders kun je het opnieuw proberen vanuit je winkelmand.
          </p>
          <Link href="/#drop" className="buy thanks-ok">
            TERUG NAAR DE SHOP <span aria-hidden="true">↗</span>
          </Link>
        </>
      )}
    </main>
  );
}
