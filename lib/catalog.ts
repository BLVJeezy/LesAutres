export const sizes = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export type Size = (typeof sizes)[number];
export const colors = [
  {
    id: "white-black",
    name: "Off-white / roze & zwart",
    fabric: "#e8e5dd",
    ink: "#20201f",
    accent: "#bf657b",
  },
] as const;
export type Colorway = (typeof colors)[number];

export const VAT_RATE = 0.21;
export const MAX_CART_LINES = 10;
export const MAX_IMAGES = 8;

export type ShopProduct = {
  id: string;
  name: string;
  description: string;
  /** Price per unit in cents, incl. VAT. */
  price: number;
  /** Purchase cost per unit in cents, excl. VAT. Server/admin only; 0 on the storefront. */
  cost: number;
  /** Main image (first of `images`). */
  image: string;
  images: string[];
  stock: Record<Size, number>;
  active: boolean;
  order: number;
};

export type CartItem = { productId: string; size: Size; quantity: number };

export const money = (cents: number) =>
  new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(cents / 100);

export function emptyStock(): Record<Size, number> {
  return Object.fromEntries(sizes.map((s) => [s, 0])) as Record<Size, number>;
}

export function parseStock(raw: string | undefined): Record<Size, number> {
  const stock = emptyStock();
  if (!raw) return stock;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    for (const s of sizes) {
      const n = Number(data[s]);
      if (Number.isInteger(n) && n > 0) stock[s] = n;
    }
  } catch {}
  return stock;
}

export const totalStock = (p: ShopProduct) =>
  sizes.reduce((n, s) => n + p.stock[s], 0);

export function stockFor(
  products: ShopProduct[],
  productId: string,
  size: Size,
): number {
  const product = products.find((p) => p.id === productId && p.active);
  return product ? product.stock[size] : 0;
}

export function addItem(
  cart: CartItem[],
  item: CartItem,
  products: ShopProduct[],
): CartItem[] {
  if (
    !sizes.includes(item.size) ||
    !Number.isInteger(item.quantity) ||
    item.quantity <= 0
  )
    return cart;
  const available = stockFor(products, item.productId, item.size);
  if (available <= 0) return cart;
  const existing = cart.find(
    (c) => c.productId === item.productId && c.size === item.size,
  );
  if (existing)
    return cart.map((c) =>
      c === existing
        ? { ...c, quantity: Math.min(c.quantity + item.quantity, available) }
        : c,
    );
  if (cart.length >= MAX_CART_LINES) return cart;
  return [...cart, { ...item, quantity: Math.min(item.quantity, available) }];
}

/** Shown when Stripe is not configured, so the storefront still renders. */
export const previewProduct: ShopProduct = {
  id: "preview-baddies-tee",
  name: "The Baddies Tee",
  description:
    "Geen grenzen. Geen uitleg nodig.\nEén statement, vier landen. Voor de anderen.",
  price: 6500,
  cost: 0,
  image: "/images/baddies-duo.jpg",
  images: ["/images/baddies-duo.jpg", "/images/baddies-her.jpg", "/images/baddies-him.jpg"],
  stock: { XS: 0, S: 8, M: 3, L: 8, XL: 8, XXL: 0 },
  active: true,
  order: 0,
};
