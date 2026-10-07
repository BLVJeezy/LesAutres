import Store from "@/components/store";
import { previewProduct } from "@/lib/catalog";
import { firebaseConfigured } from "@/lib/firebase";
import { listProducts, publicProduct } from "@/lib/shop";
import { siteUrl } from "@/lib/site";
import { withUnlimitedStock } from "@/lib/bundles";

export const revalidate = 60;

export default async function Home() {
  let products = firebaseConfigured()
    ? await listProducts().catch((error) => {
        console.error("Loading products failed", error);
        return [];
      })
    : [];
  const live = products.length > 0;
  if (!live) products = [previewProduct];
  products = products.map(withUnlimitedStock);
  const site = siteUrl();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Les Autres",
              url: site,
              logo: `${site}/icon.svg`,
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Les Autres",
              url: site,
              inLanguage: "nl-BE",
            },
            ...products.map((p) => ({
              "@context": "https://schema.org",
              "@type": "Product",
              name: p.name,
              description: p.description,
              brand: { "@type": "Brand", name: "Les Autres" },
              sku: p.id,
              image: (p.images.length ? p.images : [p.image || "/images/baddies-tee-front.jpg"]).map((i) =>
                i.startsWith("/") ? `${site}${i}` : i,
              ),
              offers: {
                "@type": "Offer",
                url: `${site}/#drop`,
                priceCurrency: "EUR",
                price: (p.price / 100).toFixed(2),
                itemCondition: "https://schema.org/NewCondition",
                availability: Object.values(p.stock).some((n) => n > 0)
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
                shippingDetails: {
                  "@type": "OfferShippingDetails",
                  shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "EUR" },
                  shippingDestination: ["BE", "NL", "LU", "FR", "DE", "ES"].map((c) => ({
                    "@type": "DefinedRegion",
                    addressCountry: c,
                  })),
                },
                hasMerchantReturnPolicy: {
                  "@type": "MerchantReturnPolicy",
                  applicableCountry: "BE",
                  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
                  merchantReturnDays: 14,
                  returnMethod: "https://schema.org/ReturnByMail",
                  returnFees: "https://schema.org/ReturnShippingFees",
                },
              },
            })),
          ]).replace(/</g, "\\u003c"),
        }}
      />
      <Store products={products.map(publicProduct)} live={live} />
    </>
  );
}
