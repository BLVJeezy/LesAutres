import { MAX_CART_LINES, sizes, type CartItem, type ShopProduct } from "./catalog";
import { BUNDLE_PRODUCTS, withUnlimitedStock } from "./bundles";
import { DROP_LIMIT, dropStatus } from "./drop";
import { listProducts } from "./shop";

export function parseCart(input: unknown): CartItem[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_CART_LINES)
    return null;
  const cart: CartItem[] = [];
  for (const raw of input) {
    const item = raw as Partial<CartItem>;
    if (
      typeof item.productId !== "string" ||
      !sizes.includes(item.size as CartItem["size"]) ||
      !Number.isInteger(item.quantity) ||
      (item.quantity as number) <= 0 ||
      cart.some((c) => c.productId === item.productId && c.size === item.size)
    )
      return null;
    cart.push({
      productId: item.productId,
      size: item.size as CartItem["size"],
      quantity: item.quantity as number,
    });
  }
  return cart;
}

/** Checks drop availability and stock for a cart; returns the live products or a customer-facing error. */
export async function checkCart(
  cart: CartItem[],
  cartId: string | undefined,
): Promise<{ products: ShopProduct[] } | { error: string }> {
  const products = (await listProducts()).map(withUnlimitedStock);
  const dropQty = cart.filter((c) => BUNDLE_PRODUCTS.includes(c.productId)).reduce((n, c) => n + c.quantity, 0);
  if (dropQty > 0) {
    const { remaining } = await dropStatus(cartId);
    if (dropQty > remaining)
      return {
        error: remaining
          ? `Er zijn nog maar ${remaining} van de ${DROP_LIMIT} tees beschikbaar. Pas je winkelmand aan.`
          : "Drop 001 is uitverkocht.",
      };
  }
  for (const item of cart) {
    const p = products.find((x) => x.id === item.productId);
    if (!p || p.price <= 0 || p.stock[item.size] < item.quantity)
      return {
        error: p
          ? `${p.name} in maat ${item.size} is niet meer (voldoende) op voorraad.`
          : "Een product in je winkelmand is niet meer beschikbaar.",
      };
  }
  return { products };
}
