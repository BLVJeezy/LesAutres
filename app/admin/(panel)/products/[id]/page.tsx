import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getProduct, stripe } from "@/lib/shop";
import { ProductForm } from "../product-form";

export default async function EditProduct({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const product = await getProduct(id);
  if (!product) notFound();
  return (
    <>
      <Link href="/admin/products">← Producten</Link>
      <h1>{product.name}</h1>
      {saved && <p className="admin-ok">Product aangemaakt.</p>}
      {!stripe() && (
        <p className="admin-alert">
          Opslaan kan zodra Stripe gekoppeld is. Daarna staat dit product
          automatisch klaar; vul dan kostprijs en voorraad in en zet het online.
        </p>
      )}
      <ProductForm product={product} canUpload={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} />
    </>
  );
}
