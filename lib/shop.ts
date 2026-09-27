import { cache } from "react";
import Stripe from "stripe";
import { firestore } from "./firebase";
import {
  emptyStock,
  MAX_IMAGES,
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

const PRODUCTS = "products";
const SEED_ID = "baddies-tee";

type ProductDoc = {
  name: string;
  description: string;
  price: number;
  cost: number;
  images: string[];
  stock: Record<string, number>;
  active: boolean;
  order: number;
  updatedAt?: number;
};

function toShopProduct(id: string, d: ProductDoc): ShopProduct {
  const images = Array.isArray(d.images) ? d.images.filter((u) => typeof u === "string").slice(0, MAX_IMAGES) : [];
  return {
    id,
    name: d.name ?? "",
    description: d.description ?? "",
    price: Math.max(0, Math.round(Number(d.price) || 0)),
    cost: Math.max(0, Math.round(Number(d.cost) || 0)),
    image: images[0] ?? "",
    images,
    stock: parseStock(JSON.stringify(d.stock ?? {})),
    active: Boolean(d.active),
    order: Number(d.order) || 0,
  };
}

export async function listProducts(
  opts: { includeInactive?: boolean } = {},
): Promise<ShopProduct[]> {
  const db = firestore();
  if (!db) return [previewProduct];
  const snap = await db.collection(PRODUCTS).get();
  return snap.docs
    .map((doc) => toShopProduct(doc.id, doc.data() as ProductDoc))
    .filter((p) => opts.includeInactive || p.active)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function getProduct(id: string): Promise<ShopProduct | null> {
  const db = firestore();
  if (!db) return id === previewProduct.id ? draftProduct : null;
  if (!/^[\w-]{1,100}$/.test(id)) return null;
  const doc = await db.collection(PRODUCTS).doc(id).get();
  return doc.exists ? toShopProduct(doc.id, doc.data() as ProductDoc) : null;
}

/** The first product before anything is saved: no cost or stock yet, offline. */
export const draftProduct: ShopProduct = {
  ...previewProduct,
  cost: 0,
  stock: emptyStock(),
  active: false,
};

/** Creates the Baddies Tee (offline, empty cost/stock) the first time the shop has no products. */
export async function ensureSeedProduct() {
  const db = firestore();
  if (!db) return;
  const any = await db.collection(PRODUCTS).limit(1).get();
  if (!any.empty) return;
  await db
    .collection(PRODUCTS)
    .doc(SEED_ID)
    .create({
      name: draftProduct.name,
      description: draftProduct.description,
      price: draftProduct.price,
      cost: 0,
      images: draftProduct.images,
      stock: draftProduct.stock,
      active: false,
      order: 0,
      updatedAt: Date.now(),
    } satisfies ProductDoc)
    .catch(() => {});
}

export async function adminProducts(): Promise<ShopProduct[]> {
  if (!firestore()) return [draftProduct];
  await ensureSeedProduct();
  return listProducts({ includeInactive: true });
}

/** Strip server-only fields before sending products to the browser. */
export const publicProduct = (p: ShopProduct): ShopProduct => ({ ...p, cost: 0 });

export type ProductInput = {
  name: string;
  description: string;
  price: number;
  cost: number;
  images: string[];
  stock: Record<Size, number>;
  active: boolean;
  order: number;
};

const docFor = (input: ProductInput): ProductDoc => ({ ...input, updatedAt: Date.now() });

export async function createProduct(input: ProductInput): Promise<string> {
  const db = firestore();
  if (!db) throw new Error("Firebase is niet geconfigureerd.");
  const ref = await db.collection(PRODUCTS).add(docFor(input));
  return ref.id;
}

export async function updateProduct(id: string, input: ProductInput) {
  const db = firestore();
  if (!db) throw new Error("Firebase is niet geconfigureerd.");
  const ref = db.collection(PRODUCTS).doc(id);
  if (!(await ref.get()).exists) throw new Error("Onbekend product.");
  await ref.set(docFor(input));
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
  const db = firestore();
  if (!db) return;
  const byProduct = new Map<string, OrderLine[]>();
  for (const l of lines) byProduct.set(l[0], [...(byProduct.get(l[0]) ?? []), l]);
  for (const [id, productLines] of byProduct) {
    const ref = db.collection(PRODUCTS).doc(id);
    await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      if (!doc.exists) return;
      const stock = parseStock(JSON.stringify((doc.data() as ProductDoc).stock ?? {}));
      for (const [, size, qty] of productLines)
        stock[size] = Math.max(0, stock[size] + direction * qty);
      tx.update(ref, { stock, updatedAt: Date.now() });
    });
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

const ORDERS = "orders";
const SESSION_EXPAND = ["payment_intent.latest_charge.balance_transaction"];

/** Builds an Order from a Checkout Session expanded with payment_intent.latest_charge.balance_transaction. */
export function orderFromSession(session: Stripe.Checkout.Session): Order | null {
  if (session.payment_status !== "paid" || session.metadata?.shop !== SHOP_TAG) return null;
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
  return {
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
  };
}

async function stripeOrders(sinceUnix?: number): Promise<Order[]> {
  const s = stripe();
  if (!s) return [];
  const orders: Order[] = [];
  for await (const session of s.checkout.sessions.list({
    status: "complete",
    limit: 100,
    ...(sinceUnix ? { created: { gte: sinceUnix } } : {}),
    expand: SESSION_EXPAND.map((e) => `data.${e}`),
  })) {
    const order = orderFromSession(session);
    if (order) orders.push(order);
  }
  return orders;
}

/** Firestore has no nested arrays, so lines are stored as objects. */
type OrderDoc = Omit<Order, "lines" | "shippedAt"> & {
  lines: { productId: string; size: Size; qty: number; price: number; cost: number }[];
  shippedAt?: number | null;
  updatedAt: number;
};

function toDoc(o: Order): Omit<OrderDoc, "shippedAt"> {
  const { shippedAt: _ignored, lines, ...rest } = o;
  void _ignored;
  return {
    ...rest,
    lines: lines.map(([productId, size, qty, price, cost]) => ({ productId, size, qty, price, cost })),
    updatedAt: Date.now(),
  };
}

function fromDoc(d: OrderDoc): Order {
  return {
    ...d,
    lines: (d.lines ?? []).map((l) => [l.productId, l.size, l.qty, l.price, l.cost] as OrderLine),
    shippedAt: d.shippedAt ?? null,
  };
}

/** Stores a paid session as an order. Returns true when it was new (first time seen). */
export async function recordPaidSession(sessionId: string): Promise<boolean> {
  const s = stripe();
  const db = firestore();
  if (!s || !db) return false;
  const session = await s.checkout.sessions.retrieve(sessionId, { expand: SESSION_EXPAND });
  const order = orderFromSession(session);
  if (!order) return false;
  try {
    await db.collection(ORDERS).doc(order.id).create({ ...toDoc(order), shippedAt: order.shippedAt });
    return true;
  } catch {
    await db.collection(ORDERS).doc(order.id).set(toDoc(order), { merge: true });
    return false;
  }
}

/** Refreshes refund/fee data of the order paid with this PaymentIntent. */
export async function refreshOrderByPaymentIntent(paymentIntentId: string) {
  const s = stripe();
  const db = firestore();
  if (!s || !db) return;
  const snap = await db.collection(ORDERS).where("paymentIntent", "==", paymentIntentId).limit(1).get();
  const id = snap.docs[0]?.id;
  if (id) await recordPaidSession(id);
}

/** Imports paid Stripe orders that are not in Firestore yet; keeps shipping status of existing ones. */
export async function syncOrdersFromStripe(): Promise<number> {
  const db = firestore();
  if (!db) return 0;
  const existing = new Set((await db.collection(ORDERS).select().get()).docs.map((d) => d.id));
  let added = 0;
  for (const order of await stripeOrders()) {
    if (existing.has(order.id)) continue;
    await db.collection(ORDERS).doc(order.id).set({ ...toDoc(order), shippedAt: order.shippedAt });
    added++;
  }
  return added;
}

export async function setOrderShipped(orderId: string, shipped: boolean) {
  const db = firestore();
  if (!db) return false;
  const ref = db.collection(ORDERS).doc(orderId);
  if (!(await ref.get()).exists) return false;
  await ref.update({ shippedAt: shipped ? Math.floor(Date.now() / 1000) : null, updatedAt: Date.now() });
  return true;
}

export const listOrders = cache(async (sinceUnix?: number): Promise<Order[]> => {
  const db = firestore();
  if (!db) return stripeOrders(sinceUnix);
  let q = db.collection(ORDERS).orderBy("created", "desc");
  if (sinceUnix) q = q.where("created", ">=", sinceUnix);
  const snap = await q.get();
  return snap.docs.map((d) => fromDoc(d.data() as OrderDoc));
});

/** Shopify-style order numbers: #1001 for the first paid order, counting up by date. */
export function orderNumbers(orders: Order[]): Map<string, number> {
  const sorted = [...orders].sort((a, b) => a.created - b.created);
  return new Map(sorted.map((o, i) => [o.id, 1001 + i]));
}

export type OrderStatus = "refunded" | "shipped" | "open";
export const orderStatus = (o: Order): OrderStatus =>
  o.refunded >= o.total && o.total > 0 ? "refunded" : o.shippedAt ? "shipped" : "open";
