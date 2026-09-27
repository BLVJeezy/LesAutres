"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin, login, logout } from "@/lib/admin-auth";
import { emptyStock, MAX_IMAGES, sizes } from "@/lib/catalog";

const IMAGE_URL = /^(\/[\w\-./]+|https:\/\/[^\s"'<>]+)$/;
import { createProduct, stripe, updateProduct, type ProductInput } from "@/lib/shop";

export type FormState = { error?: string; ok?: string; savedId?: string };

async function guard() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const ok = await login(String(form.get("password") ?? ""));
  if (!ok) {
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Onjuist wachtwoord." };
  }
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

function euros(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim().replace(/\s|€/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  return Math.round(Number(text) * 100);
}

function parseProduct(form: FormData): ProductInput | string {
  const name = String(form.get("name") ?? "").trim();
  if (!name || name.length > 120) return "Geef een naam op (max. 120 tekens).";
  const description = String(form.get("description") ?? "").trim().slice(0, 1000);
  const price = euros(form.get("price"));
  if (price === null || price < 50) return "Verkoopprijs is ongeldig (minimaal € 0,50).";
  const cost = euros(form.get("cost"));
  if (cost === null) return "Kostprijs is ongeldig.";
  let images: unknown;
  try {
    images = JSON.parse(String(form.get("images") || "[]"));
  } catch {
    return "Afbeeldingen zijn ongeldig.";
  }
  if (
    !Array.isArray(images) ||
    images.length > MAX_IMAGES ||
    !images.every((u) => typeof u === "string" && IMAGE_URL.test(u))
  )
    return `Afbeeldingen moeten een pad (/images/…) of https-link zijn, max. ${MAX_IMAGES}.`;
  const stock = emptyStock();
  for (const s of sizes) {
    const n = Number(form.get(`stock_${s}`) || 0);
    if (!Number.isInteger(n) || n < 0 || n > 100000) return `Voorraad ${s} is ongeldig.`;
    stock[s] = n;
  }
  const order = Number(form.get("order") || 0);
  return {
    name,
    description,
    price,
    cost,
    images: images as string[],
    stock,
    active: form.get("active") === "on",
    order: Number.isInteger(order) ? order : 0,
  };
}

export async function saveProductAction(_: FormState, form: FormData): Promise<FormState> {
  await guard();
  const input = parseProduct(form);
  if (typeof input === "string") return { error: input };
  const id = String(form.get("id") ?? "");
  let savedId = id;
  try {
    if (id) await updateProduct(id, input);
    else savedId = await createProduct(input);
  } catch (error) {
    console.error("Saving product failed", error);
    return { error: "Opslaan mislukt. Controleer de Stripe-configuratie en probeer opnieuw." };
  }
  revalidatePath("/");
  revalidatePath("/admin", "layout");
  return { ok: id ? "Opgeslagen." : "Product aangemaakt.", savedId };
}

export async function toggleShippedAction(form: FormData) {
  await guard();
  const s = stripe();
  const pi = String(form.get("paymentIntent") ?? "");
  if (!s || !pi.startsWith("pi_")) return;
  const shipped = form.get("shipped") === "1";
  await s.paymentIntents.update(pi, {
    metadata: { shipped_at: shipped ? String(Math.floor(Date.now() / 1000)) : "" },
  });
  revalidatePath("/admin", "layout");
}
