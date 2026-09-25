import Store from "@/components/store";
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "Les Autres — The Baddies Tee",
            description:
              "Drop 001. Boxy oversized T-shirt, 100% katoen, 240 GSM.",
            brand: { "@type": "Brand", name: "Les Autres" },
            material: "100% katoen",
            image: "/images/drop-001-product.jpeg",
          }),
        }}
      />
      <Store />
    </>
  );
}
