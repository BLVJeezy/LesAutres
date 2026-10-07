import { firestore } from "./firebase";

/** Small key/value store in Firestore (settings/shop) for values set up from the admin. */
type Settings = { revolutWebhookSecret?: string; revolutWebhookUrl?: string; lastAbandonedSweep?: number };

export async function getSetting<K extends keyof Settings>(key: K): Promise<Settings[K] | undefined> {
  const db = firestore();
  if (!db) return undefined;
  const snap = await db.collection("settings").doc("shop").get();
  return (snap.data() as Settings | undefined)?.[key];
}

export async function setSettings(values: Settings) {
  const db = firestore();
  if (!db) return;
  await db.collection("settings").doc("shop").set(values, { merge: true });
}
