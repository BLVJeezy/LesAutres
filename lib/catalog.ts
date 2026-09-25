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
export const price = 65; // Preview price. Replace with approved catalogue before launch.
export const money = (value: number) =>
  new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
export function availability(
  color: string,
  size: Size,
): {
  kind: "stock" | "preorder" | "soldout";
  quantity: number;
  shipping?: string;
} {
  // Deliberately labeled preview data in the UI. Replace with authoritative server inventory.
  if (size === "XS" || size === "XXL") return { kind: "soldout", quantity: 0 };
  if (size === "XL")
    return {
      kind: "preorder",
      quantity: 20,
      shipping: "Verzenddatum wordt bevestigd vóór de lancering",
    };
  return {
    kind: "stock",
    quantity: color === "white-black" && size === "M" ? 3 : 8,
  };
}
export type CartItem = { color: string; size: Size; quantity: number };
export function addItem(cart: CartItem[], item: CartItem): CartItem[] {
  if (
    !sizes.includes(item.size) ||
    !Number.isInteger(item.quantity) ||
    item.quantity <= 0
  )
    return cart;
  const stock = availability(item.color, item.size);
  if (stock.kind === "soldout" || !colors.some((c) => c.id === item.color))
    return cart;
  const existing = cart.find(
    (c) => c.color === item.color && c.size === item.size,
  );
  if (existing)
    return cart.map((c) =>
      c === existing
        ? {
            ...c,
            quantity: Math.min(c.quantity + item.quantity, stock.quantity),
          }
        : c,
    );
  return [
    ...cart,
    { ...item, quantity: Math.min(item.quantity, stock.quantity) },
  ];
}
