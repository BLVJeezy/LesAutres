import { requireAdmin } from "@/lib/admin-auth";
import { adminProducts, listOrders, orderNumbers } from "@/lib/shop";
import { ExportPicker, type PickOrder } from "./picker";

export default async function ExportOrders({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  await requireAdmin();
  const { type } = await searchParams;
  const [orders, products] = await Promise.all([listOrders(), adminProducts()]);
  const numbers = orderNumbers(orders);
  const name = (id: string) => products.find((p) => p.id === id)?.name ?? "Artikel";
  const list: PickOrder[] = orders
    .filter((o) => !o.test && o.refunded < o.total)
    .map((o) => ({
      id: o.id,
      number: numbers.get(o.id) ?? 0,
      created: o.created,
      shippedAt: o.shippedAt,
      name: o.name || o.email,
      city: o.address.split(", ").slice(-2, -1)[0] ?? "",
      items: o.lines.map(([pid, size, qty]) => `${qty}× ${name(pid)} ${size}`).join(", "),
      units: o.lines.reduce((n, l) => n + l[2], 0),
    }));
  const lastShipped = Math.max(0, ...orders.map((o) => o.shippedAt ?? 0));
  return <ExportPicker orders={list} lastShipped={lastShipped || null} initialType={type === "orders" ? "orders" : "labels"} />;
}
