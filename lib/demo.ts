import { VAT_RATE, type Size } from "./catalog";
import type { Order } from "./shop";

/** Deterministic fake orders for the admin demo mode (≈ €10k–30k profit per month). Never stored. */
const SIZES: Size[] = ["S", "M", "M", "L", "L", "XL"];
const NAMES = ["Sara", "Yassine", "Lotte", "Mehdi", "Emma", "Noah", "Ines", "Lucas", "Amira", "Jonas", "Nora", "Adam"];
const CITIES = ["Antwerpen", "Gent", "Brussel", "Leuven", "Rotterdam", "Amsterdam", "Lille", "Keulen"];

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export function demoOrders(productId: string, price = 4495, unitCost = 900, now = Math.floor(Date.now() / 1000)): Order[] {
  const rand = rng(20240901);
  const orders: Order[] = [];
  const today = Math.floor(now / 86400);
  for (let d = 364; d >= 0; d--) {
    const day = today - d;
    // Monthly level between ~€10k and ~€30k profit, with weekend peaks and daily noise.
    const month = Math.floor(day / 30);
    const level = 12 + ((Math.sin(month * 1.7) + 1) / 2) * 20;
    const weekday = new Date(day * 86400 * 1000).getUTCDay();
    const perDay = Math.max(2, Math.round(level * (weekday === 0 || weekday === 6 ? 1.3 : 0.9) * (0.7 + rand() * 0.6)));
    for (let i = 0; i < perDay; i++) {
      const created = day * 86400 + Math.floor(rand() * 86400);
      if (created > now) continue;
      const qty = rand() < 0.75 ? 1 : rand() < 0.8 ? 2 : 3;
      const subtotal = qty * price;
      const shippingFee = subtotal >= 5000 ? 0 : 595;
      const total = subtotal + shippingFee;
      const refunded = rand() < 0.03 ? total : 0;
      const net = total - refunded;
      const vat = net - Math.round(net / (1 + VAT_RATE));
      const cost = refunded ? 0 : qty * unitCost;
      const name = NAMES[Math.floor(rand() * NAMES.length)];
      orders.push({
        id: `DEMO-${day}-${i}`,
        paymentId: null,
        created,
        email: `${name.toLowerCase()}@voorbeeld.be`,
        name: `${name} Demo`,
        phone: "",
        address: `Demostraat ${1 + Math.floor(rand() * 90)}, ${CITIES[Math.floor(rand() * CITIES.length)]}`,
        lines: [[productId, SIZES[Math.floor(rand() * SIZES.length)], qty, price, unitCost]],
        shippingMethod: "bpost",
        shippingFee,
        total,
        refunded,
        fee: 0,
        cost,
        vat,
        profit: net - vat - cost,
        shippedAt: d > 2 ? created + 86400 : null,
      });
    }
  }
  return orders.sort((a, b) => b.created - a.created);
}
