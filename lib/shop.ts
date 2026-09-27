import Stripe from "stripe";
import {
  parseStock,
  previewProduct,
  sizes,
  VAT_RATE,
  type CartItem,
  type ShopProduct,
  type Size,
} from "./catalog";

export const SHOP_TAG = "les-autres";

let client: Stripe | null = null;
export function stripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // STRIPE_API_BASE points the SDK at a local stripe-mock; leave unset in production.
  const base = process.env.STRIPE_API_BASE ? new URL(process.env.STRIPE_API_BASE) : null;
  client ??= new Stripe(key, {
    timeout: 10_000,
    maxNetworkRetries: 1,
    ...(base && {
      host: base.hostname,
      port: Number(base.port) || undefined,
      protocol: base.protocol.replace(":", "") as "http" | "https",
    }),
  });
  return client;
}

function toShopProduct(p: Stripe.Product): ShopProduct {
  const price = p.default_price as Stripe.Price | null;
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    price: price?.unit_amount ?? 0,
    cost: Math.max(0, Number(p.metadata.cost) || 0),
    image: p.images[0] ?? "",
    stock: parseStock(p.metadata.stock),
    active: p.active,
    order: Number(p.metadata.order) || 0,
  };
}

export async function listProducts(
  opts: { includeInactive?: boolean } = {},
): Promise<ShopProduct[]> {
  const s = stripe();
  if (!s) return [previewProduct];
  const found: ShopProduct[] = [];
  for await (const p of s.products.list({
    limit: 100,
    expand: ["data.default_price"],
    ...(opts.includeInactive ? {} : { active: true }),
  })) {
    if (p.metadata.shop === SHOP_TAG) found.push(toShopProduct(p));
  }
  return found.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function getProduct(id: string): Promise<ShopProduct | null> {
  const s = stripe();
  if (!s) return null;
  try {
    const p = await s.products.retrieve(id, { expand: ["default_price"] });
    return p.metadata.shop === SHOP_TAG ? toShopProduct(p) : null;
  } catch {
    return null;
  }
}

/** Strip server-only fields before sending products to the browser. */
export const publicProduct = (p: ShopProduct): ShopProduct => ({ ...p, cost: 0 });

export type ProductInput = {
  name: string;
  description: string;
  price: number;
  cost: number;
  image: string;
  stock: Record<Size, number>;
  active: boolean;
  order: number;
};

function metadataFor(input: ProductInput) {
  return {
    shop: SHOP_TAG,
    cost: String(input.cost),
    stock: JSON.stringify(input.stock),
    order: String(input.order),
  };
}

export async function createProduct(input: ProductInput): Promise<string> {
  const s = stripe();
  if (!s) throw new Error("Stripe is niet geconfigureerd.");
  const product = await s.products.create({
    name: input.name,
    description: input.description || undefined,
    images: input.image ? [input.image] : [],
    active: input.active,
    metadata: metadataFor(input),
    default_price_data: { currency: "eur", unit_amount: input.price },
  });
  return product.id;
}

export async function updateProduct(id: string, input: ProductInput) {
  const s = stripe();
  if (!s) throw new Error("Stripe is niet geconfigureerd.");
  const current = await s.products.retrieve(id, { expand: ["default_price"] });
  if (current.metadata.shop !== SHOP_TAG) throw new Error("Onbekend product.");
  const oldPrice = current.default_price as Stripe.Price | null;
  let defaultPrice: string | undefined;
  if (!oldPrice || oldPrice.unit_amount !== input.price) {
    const price = await s.prices.create({
      product: id,
      currency: "eur",
      unit_amount: input.price,
    });
    defaultPrice = price.id;
  }
  await s.products.update(id, {
    name: input.name,
    description: input.description || "",
    images: input.image ? [input.image] : [],
    active: input.active,
    metadata: metadataFor(input),
    ...(defaultPrice ? { default_price: defaultPrice } : {}),
  });
  if (defaultPrice && oldPrice) await s.prices.update(oldPrice.id, { active: false });
}

/** Line snapshot stored on the Checkout Session: [productId, size, qty, unitPrice, unitCost]. */
export type OrderLine = [string, Size, number, number, number];

export function encodeLines(cart: CartItem[], products: ShopProduct[]): OrderLine[] {
  return cart.map((c) => {
    const p = products.find((x) => x.id === c.productId)!;
    return [c.productId, c.size, c.quantity, p.price, p.cost];
  });
}

export function decodeLines(raw: string | undefined): OrderLine[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (l): l is OrderLine =>
        Array.isArray(l) &&
        typeof l[0] === "string" &&
        sizes.includes(l[1]) &&
        Number.isInteger(l[2]) &&
        Number.isInteger(l[3]) &&
        Number.isInteger(l[4]),
    );
  } catch {
    return [];
  }
}

export async function adjustStock(lines: OrderLine[], direction: -1 | 1) {
  const s = stripe();
  if (!s) return;
  const byProduct = new Map<string, OrderLine[]>();
  for (const l of lines) byProduct.set(l[0], [...(byProduct.get(l[0]) ?? []), l]);
  for (const [id, productLines] of byProduct) {
    const p = await s.products.retrieve(id);
    const stock = parseStock(p.metadata.stock);
    for (const [, size, qty] of productLines)
      stock[size] = Math.max(0, stock[size] + direction * qty);
    await s.products.update(id, { metadata: { stock: JSON.stringify(stock) } });
  }
}

export type Order = {
  id: string;
  paymentIntent: string | null;
  created: number;
  email: string;
  name: string;
  address: string;
  lines: OrderLine[];
  total: number;
  refunded: number;
  fee: number;
  cost: number;
  vat: number;
  profit: number;
  shippedAt: number | null;
};

const exVat = (cents: number) => Math.round(cents / (1 + VAT_RATE));

function formatAddress(a: Stripe.Address | null | undefined) {
  if (!a) return "";
  return [a.line1, a.line2, `${a.postal_code ?? ""} ${a.city ?? ""}`.trim(), a.country]
    .filter(Boolean)
    .join(", ");
}

export async function listOrders(sinceUnix?: number): Promise<Order[]> {
  const s = stripe();
  if (!s) return [];
  const orders: Order[] = [];
  for await (const session of s.checkout.sessions.list({
    status: "complete",
    limit: 100,
    ...(sinceUnix ? { created: { gte: sinceUnix } } : {}),
    expand: ["data.payment_intent.latest_charge.balance_transaction"],
  })) {
    if (session.payment_status !== "paid" || session.metadata?.shop !== SHOP_TAG)
      continue;
    const pi = session.payment_intent as Stripe.PaymentIntent | null;
    const charge = pi?.latest_charge as Stripe.Charge | null | undefined;
    const bt = charge?.balance_transaction as Stripe.BalanceTransaction | null | undefined;
    const lines = decodeLines(session.metadata?.lines);
    const total = session.amount_total ?? 0;
    const refunded = charge?.amount_refunded ?? 0;
    const fullyRefunded = total > 0 && refunded >= total;
    const net = total - refunded;
    const cost = fullyRefunded ? 0 : lines.reduce((n, l) => n + l[2] * l[4], 0);
    const fee = bt?.fee ?? 0;
    const vat = net - exVat(net);
    const shipping = session.collected_information?.shipping_details;
    orders.push({
      id: session.id,
      paymentIntent: pi?.id ?? null,
      created: session.created,
      email: session.customer_details?.email ?? "",
      name: shipping?.name ?? session.customer_details?.name ?? "",
      address: formatAddress(shipping?.address ?? session.customer_details?.address),
      lines,
      total,
      refunded,
      fee,
      cost,
      vat,
      profit: net - vat - fee - cost,
      shippedAt: Number(pi?.metadata?.shipped_at) || null,
    });
  }
  return orders;
}
