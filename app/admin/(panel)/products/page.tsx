import { requireAdmin } from "@/lib/admin-auth";
import { firebaseConfigured } from "@/lib/firebase";
import { adminProducts } from "@/lib/shop";
import { ProductManager } from "./product-manager";

export default async function Products() {
  await requireAdmin();
  const products = await adminProducts();
  return (
    <ProductManager
      products={products}
      connected={firebaseConfigured()}
      canUpload={firebaseConfigured()}
    />
  );
}
