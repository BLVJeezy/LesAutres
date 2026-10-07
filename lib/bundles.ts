import type { CartItem, ShopProduct } from "./catalog";

/** While true, every size is always available: no sold-out, no stock caps, stock is not lowered. */
export const UNLIMITED_STOCK = true;
export const UNLIMITED = 999;

export const withUnlimitedStock = (p: ShopProduct): ShopProduct =>
  UNLIMITED_STOCK
    ? { ...p, stock: Object.fromEntries(Object.keys(p.stock).map((s) => [s, UNLIMITED])) as ShopProduct["stock"] }
    : p;

/** Bundle prices in cents incl. VAT for the Baddies Tee: 2 or 3 tees, any sizes mixed. */
export const BUNDLE_PRODUCTS = ["baddies-tee", "preview-baddies-tee"];
export const BUNDLES = [
  { qty: 1, label: "1 tee", price: null },
  { qty: 2, label: "2 tees", price: 7995 },
  { qty: 3, label: "3 tees", price: 10995 },
] as const;

/** Best price for `qty` units of a bundle product: as many 3-packs as possible, then a 2-pack, then single. */
export function bundleTotal(qty: number, unit: number) {
  const [, two, three] = BUNDLES;
  let total = Math.floor(qty / 3) * three.price;
  const rest = qty % 3;
  total += rest === 2 ? two.price : rest === 1 ? unit : 0;
  return Math.min(total, qty * unit);
}

export const bundlePriceFor = (qty: number, unit: number) => (qty === 1 ? unit : bundleTotal(qty, unit));

/** Discount in cents that bundles give on this cart (0 when no bundle applies). */
export function cartDiscount(cart: Pick<CartItem, "productId" | "quantity">[], unitPrice: (id: string) => number) {
  let discount = 0;
  for (const id of BUNDLE_PRODUCTS) {
    const qty = cart.filter((c) => c.productId === id).reduce((n, c) => n + c.quantity, 0);
    if (qty < 2) continue;
    const unit = unitPrice(id);
    discount += qty * unit - bundleTotal(qty, unit);
  }
  return Math.max(0, discount);
}
