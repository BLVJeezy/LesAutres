import { createHash } from "node:crypto";
import { firestore } from "./firebase";

const SUBSCRIBERS = "subscribers";

export type Subscriber = {
  id: string;
  email: string;
  type: "drop" | "restock";
  size: string | null;
  color: string | null;
  createdAt: number;
};

/** One document per email + list (+ size for restocks), so repeat sign-ups don't duplicate. */
export async function addSubscriber(input: Omit<Subscriber, "id" | "createdAt">): Promise<boolean> {
  const db = firestore();
  if (!db) return false;
  const email = input.email.trim().toLowerCase();
  const id = createHash("sha256")
    .update(`${email}|${input.type}|${input.size ?? ""}|${input.color ?? ""}`)
    .digest("hex")
    .slice(0, 32);
  await db
    .collection(SUBSCRIBERS)
    .doc(id)
    .set({ ...input, email, createdAt: Date.now() }, { merge: true });
  return true;
}

export async function listSubscribers(): Promise<Subscriber[]> {
  const db = firestore();
  if (!db) return [];
  const snap = await db.collection(SUBSCRIBERS).orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Subscriber, "id">) }));
}

export async function deleteSubscriber(id: string) {
  const db = firestore();
  if (!db || !/^[a-f0-9]{32}$/.test(id)) return;
  await db.collection(SUBSCRIBERS).doc(id).delete();
}
