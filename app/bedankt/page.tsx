import Link from "next/link";
import { confirmOrder } from "@/lib/shop";
import { ClearCart } from "./clear-cart";

export const metadata = { title: "Bedankt — Les Autres", robots: "noindex" };

async function paid(orderId: string | undefined) {
  if (!orderId) return false;
  try {
    return await confirmOrder(orderId);
  } catch (error) {
    console.error("Confirming order failed", error);
    return false;
  }
}

export default async function Bedankt({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  const ok = await paid(order);
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
