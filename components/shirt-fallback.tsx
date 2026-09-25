import Image from "next/image";
import type { Colorway } from "@/lib/catalog";
/** The approved product photograph is also used in the cart and as a loading fallback. */
export function ShirtFallback({ color }: { color: Colorway }) {
  return (
    <Image
      className="shirt-fallback"
      src="/images/drop-001-product.jpeg"
      alt={`Drop 001 T-shirt in ${color.name}`}
      width={1085}
      height={992}
      sizes="(max-width: 700px) 90vw, 600px"
    />
  );
}
