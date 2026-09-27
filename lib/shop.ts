import { cache } from "react";
import { randomBytes } from "node:crypto";
import { customerEmail, mailConfigured, sendMail, shopEmail, type MailLine } from "./mail";
import { createRevolutOrder, getRevolutOrder, type NewOrder } from "./revolut";
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
  paymentId: string | null;
  created: number;
  email: string;
  name: string;
  phone: string;
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
const ORDERS = "orders";

/** Firestore has no nested arrays, so lines are stored as objects. */
type OrderDoc = Omit<Order, "lines"> & {
  status: "pending" | "paid";
  lines: { productId: string; size: Size; qty: number; price: number; cost: number }[];
  updatedAt: number;
};

function fromDoc(d: OrderDoc): Order {
  const lines = (d.lines ?? []).map((l) => [l.productId, l.size, l.qty, l.price, l.cost] as OrderLine);
  const net = (d.total ?? 0) - (d.refunded ?? 0);
  const fullyRefunded = d.total > 0 && net <= 0;
  const cost = fullyRefunded ? 0 : lines.reduce((n, l) => n + l[2] * l[4], 0);
  const fee = d.fee ?? 0;
  const vat = net - exVat(net);
  return {
    id: d.id,
    paymentId: d.paymentId ?? (d as { paymentIntent?: string }).paymentIntent ?? null,
    created: d.created,
    email: d.email ?? "",
    name: d.name ?? "",
    phone: d.phone ?? "",
    address: d.address ?? "",
    lines,
    total: d.total ?? 0,
    refunded: d.refunded ?? 0,
    fee,
    cost,
    vat,
    profit: net - vat - fee - cost,
    shippedAt: d.shippedAt ?? null,
  };
}

export type Checkout = {
  lines: OrderLine[];
  customer: NewOrder["customer"];
  shipping: NewOrder["shipping"];
  description: string;
  origin: string;
};

/** Stores a pending order in Firestore, opens a Revolut order for it and returns the payment page URL. */
export async function startCheckout(c: Checkout): Promise<string> {
  const db = firestore();
  if (!db) throw new Error("Firebase is niet geconfigureerd.");
  const id = `LA-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const total = c.lines.reduce((n, l) => n + l[2] * l[3], 0);
  const s = c.shipping;
  const doc: OrderDoc = {
    id,
    status: "pending",
    paymentId: null,
    created: Math.floor(Date.now() / 1000),
    email: c.customer.email,
    name: c.customer.full_name,
    phone: c.customer.phone ?? "",
    address: [s.street_line_1, s.street_line_2, `${s.postcode} ${s.city}`, s.country_code].filter(Boolean).join(", "),
    lines: c.lines.map(([productId, size, qty, price, cost]) => ({ productId, size, qty, price, cost })),
    total,
    refunded: 0,
    fee: 0,
    cost: 0,
    vat: 0,
    profit: 0,
    shippedAt: null,
    updatedAt: Date.now(),
  };
  await db.collection(ORDERS).doc(id).set(doc);
  const order = await createRevolutOrder({
    amount: total,
    reference: id,
    description: c.description,
    redirectUrl: `${c.origin}/bedankt?order=${id}`,
    customer: c.customer,
    shipping: c.shipping,
  });
  await db.collection(ORDERS).doc(id).update({ paymentId: order.id, updatedAt: Date.now() });
  if (!order.checkout_url) throw new Error("Revolut gaf geen betaalpagina terug.");
  return order.checkout_url;
}

/**
 * Marks the order paid once Revolut confirms it, and lowers stock exactly once.
 * Safe to call repeatedly (webhook + thank-you page). Returns true when the order is paid.
 */
export async function confirmOrder(id: string): Promise<boolean> {
  const db = firestore();
  if (!db || !/^[\w-]{1,64}$/.test(id)) return false;
  const ref = db.collection(ORDERS).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  const d = snap.data() as OrderDoc;
  if (d.status === "paid") return true;
  if (!d.paymentId) return false;
  const remote = await getRevolutOrder(d.paymentId);
  const paid =
    (remote.state === "completed" || remote.state === "authorised") &&
    remote.amount === d.total &&
    remote.currency?.toUpperCase() === "EUR";
  if (!paid) return false;
  const first = await db.runTransaction(async (tx) => {
    const cur = (await tx.get(ref)).data() as OrderDoc;
    if (cur.status === "paid") return false;
    tx.update(ref, { status: "paid", created: Math.floor(Date.now() / 1000), updatedAt: Date.now() });
    return true;
  });
  if (first) {
    await adjustStock(fromDoc(d).lines, -1);
    await sendOrderEmails(id).catch((error) => console.error("Order e-mails failed", error));
  }
  return true;
}

/** Order with display number and product names/photos, for the thank-you page and e-mails. */
export async function orderSummary(id: string) {
  const db = firestore();
  if (!db || !/^[\w-]{1,64}$/.test(id)) return null;
  const snap = await db.collection(ORDERS).doc(id).get();
  if (!snap.exists || (snap.data() as OrderDoc).status !== "paid") return null;
  const order = fromDoc({ ...(snap.data() as OrderDoc), id });
  const numbers = orderNumbers(await listOrders());
  const products = new Map<string, ShopProduct | null>();
  for (const [pid] of order.lines) if (!products.has(pid)) products.set(pid, await getProduct(pid));
  const lines: MailLine[] = order.lines.map(([pid, size, qty, price]) => {
    const p = products.get(pid);
    return { name: p?.name ?? "Artikel", size, qty, price, image: p?.image ?? "" };
  });
  return { order, number: `#${numbers.get(id) ?? ""}`, lines };
}

async function sendOrderEmails(id: string) {
  if (!mailConfigured()) return;
  const s = await orderSummary(id);
  if (!s) return;
  const shop = process.env.ORDER_NOTIFY_EMAIL;
  const jobs = [sendMail(s.order.email, customerEmail(s.order, s.number, s.lines), shop)];
  if (shop) jobs.push(sendMail(shop, shopEmail(s.order, s.number, s.lines), s.order.email));
  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === "rejected") console.error("Sending order e-mail failed", r.reason);
}

/** Looks up our order by the Revolut order id (used by the webhook). */
export async function confirmByPaymentId(paymentId: string): Promise<boolean> {
  const db = firestore();
  if (!db) return false;
  const snap = await db.collection(ORDERS).where("paymentId", "==", paymentId).limit(1).get();
  const id = snap.docs[0]?.id;
  return id ? confirmOrder(id) : false;
}

export async function setOrderShipped(orderId: string, shipped: boolean) {
  const db = firestore();
  if (!db) return false;
  const ref = db.collection(ORDERS).doc(orderId);
  if (!(await ref.get()).exists) return false;
  await ref.update({ shippedAt: shipped ? Math.floor(Date.now() / 1000) : null, updatedAt: Date.now() });
  return true;
}

export async function setOrderRefunded(orderId: string, refunded: boolean) {
  const db = firestore();
  if (!db) return false;
  const ref = db.collection(ORDERS).doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) return false;
  const d = snap.data() as OrderDoc;
  if (d.status !== "paid" || (d.refunded >= d.total) === refunded) return false;
  await ref.update({ refunded: refunded ? d.total : 0, updatedAt: Date.now() });
  await adjustStock(fromDoc(d).lines, refunded ? 1 : -1);
  return true;
}

export const listOrders = cache(async (sinceUnix?: number): Promise<Order[]> => {
  const db = firestore();
  if (!db) return [];
  let q = db.collection(ORDERS).orderBy("created", "desc");
  if (sinceUnix) q = q.where("created", ">=", sinceUnix);
  const snap = await q.get();
  return snap.docs
    .map((d) => ({ ...(d.data() as OrderDoc), id: d.id }))
    .filter((d) => d.status !== "pending")
    .map(fromDoc);
});

/** Shopify-style order numbers: #1001 for the first paid order, counting up by date. */
export function orderNumbers(orders: Order[]): Map<string, number> {
  const sorted = [...orders].sort((a, b) => a.created - b.created);
  return new Map(sorted.map((o, i) => [o.id, 1001 + i]));
}

export type OrderStatus = "refunded" | "shipped" | "open";
export const orderStatus = (o: Order): OrderStatus =>
  o.refunded >= o.total && o.total > 0 ? "refunded" : o.shippedAt ? "shipped" : "open";
