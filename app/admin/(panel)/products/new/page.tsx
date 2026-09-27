import { requireAdmin } from "@/lib/admin-auth";
import { emptyStock } from "@/lib/catalog";
import { ProductForm } from "../product-form";

export default async function NewProduct() {
  await requireAdmin();
  return (
    <>
      <h1>Nieuw product</h1>
      <ProductForm
        product={{
          id: "",
          name: "",
          description: "",
          price: 0,
          cost: 0,
          image: "",
          stock: emptyStock(),
          active: true,
          order: 0,
        }}
      />
    </>
  );
}
