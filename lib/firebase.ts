import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

type ServiceAccount = { project_id: string; client_email: string; private_key: string };

function serviceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const json = JSON.parse(raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8"));
    if (!json.project_id || !json.client_email || !json.private_key) return null;
    return json;
  } catch {
    return null;
  }
}

export const firebaseConfigured = () =>
  Boolean(serviceAccount() || process.env.FIRESTORE_EMULATOR_HOST);

let app: App | null = null;
function firebaseApp(): App | null {
  if (app) return app;
  const sa = serviceAccount();
  const projectId = sa?.project_id ?? process.env.GCLOUD_PROJECT ?? "demo-les-autres";
  if (!sa && !process.env.FIRESTORE_EMULATOR_HOST) return null;
  app =
    getApps()[0] ??
    initializeApp({
      ...(sa && {
        credential: cert({
          projectId: sa.project_id,
          clientEmail: sa.client_email,
          privateKey: sa.private_key.replace(/\\n/g, "\n"),
        }),
      }),
      projectId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
    });
  return app;
}

export function firestore(): Firestore | null {
  const a = firebaseApp();
  return a ? getFirestore(a) : null;
}

export function bucket() {
  const a = firebaseApp();
  return a ? getStorage(a).bucket() : null;
}
