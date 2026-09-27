import Store from "@/components/store";
import { previewProduct } from "@/lib/catalog";
import { listProducts, publicProduct, stripe } from "@/lib/shop";

export const revalidate = 60;

export default async function Home() {
  let products = stripe()
    ? await listProducts().catch((error) => {
        console.error("Loading products failed", error);
        return [];
      })
    : [];
  const live = products.length > 0;
  if (!live) products = [previewProduct];
  const featured = products[0];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: `Les Autres — ${featured.name}`,
            description: featured.description,
            brand: { "@type": "Brand", name: "Les Autres" },
            image: featured.image || "/images/drop-001-product.jpeg",
            offers: {
              "@type": "Offer",
              priceCurrency: "EUR",
              price: (featured.price / 100).toFixed(2),
            },
          }).replace(/</g, "\\u003c"),
        }}
      />
      <Store products={products.map(publicProduct)} live={live} />
    </>
  );
}
