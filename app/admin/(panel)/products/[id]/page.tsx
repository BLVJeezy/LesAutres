import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { firebaseConfigured } from "@/lib/firebase";
import { getProduct } from "@/lib/shop";
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
      <div className="admin-head">
        <div className="admin-title-row">
          <Link href="/admin/products" className="admin-back" aria-label="Terug naar producten">
            <ArrowLeft size={18} />
          </Link>
          <h1>{product.name}</h1>
        </div>
      </div>
      {saved && <p className="admin-ok">Product aangemaakt.</p>}
      {!firebaseConfigured() && (
        <p className="admin-alert">
          Opslaan kan zodra Firebase gekoppeld is.
        </p>
      )}
      <ProductForm product={product} canUpload={firebaseConfigured()} />
    </>
  );
}
