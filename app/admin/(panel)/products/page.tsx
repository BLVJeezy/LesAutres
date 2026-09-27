import { requireAdmin } from "@/lib/admin-auth";
import { adminProducts, stripe } from "@/lib/shop";
import { ProductManager } from "./product-manager";

export default async function Products() {
  await requireAdmin();
  const products = await adminProducts();
  return (
    <ProductManager
      products={products}
      connected={Boolean(stripe())}
      canUpload={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
    />
  );
}
