import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "la_admin";
const MAX_AGE = 60 * 60 * 12;

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export const adminConfigured = () => Boolean(process.env.ADMIN_PASSWORD);

export async function isAdmin(): Promise<boolean> {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const [expires, mac] = raw.split(".");
  if (!expires || !mac || Number(expires) < Date.now()) return false;
  return safeEqual(mac, sign(`admin:${expires}`, secret));
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function login(password: string): Promise<boolean> {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || !safeEqual(sign(password, "pw"), sign(secret, "pw"))) return false;
  const expires = String(Date.now() + MAX_AGE * 1000);
  (await cookies()).set(COOKIE, `${expires}.${sign(`admin:${expires}`, secret)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return true;
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}
