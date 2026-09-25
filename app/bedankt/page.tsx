import Link from "next/link";
import Stripe from "stripe";
import { ClearCart } from "./clear-cart";

export const metadata = { title: "Bedankt — Les Autres", robots: "noindex" };

async function paid(sessionId: string | undefined) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !sessionId) return false;
  try {
    const session = await new Stripe(key).checkout.sessions.retrieve(sessionId);
    return session.payment_status === "paid";
  } catch {
    return false;
  }
}

export default async function Bedankt({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const ok = await paid(session_id);
  return (
    <main className="legal">
      <Link href="/">← LES AUTRES</Link>
      {ok ? (
        <>
          <ClearCart />
          <h1>Bedankt. Je bent één van de anderen.</h1>
          <p>
            Je betaling is gelukt. Je krijgt een bevestiging per e-mail met je
            bestelgegevens.
          </p>
        </>
      ) : (
        <>
          <h1>We vinden je betaling niet terug.</h1>
          <p>
            Als je wel betaald hebt, krijg je binnen enkele minuten een
            bevestiging per e-mail. Anders kun je het opnieuw proberen vanuit
            je winkelmand.
          </p>
        </>
      )}
    </main>
  );
}
