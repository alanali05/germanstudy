// POST /api/uploads/sign: the only server code of the app (Vercel function).
// It exists because the R2 keys must stay secret. The browser sends its Firebase login token and
// { kind, size }; this checks who is asking and returns a short-lived presigned PUT URL. The browser
// then uploads the JPEG straight to R2 and saves publicUrl in Firestore.
//   kind "avatar": any member, always the same key per user (a new picture replaces the old one)
//   kind "cover":  owner only, a new key per upload
// Env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_BASE_URL, VITE_FIREBASE_PROJECT_ID
// Locally `npm run dev` serves this file too (see vite.config.js).
import { AwsClient } from "aws4fetch";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { OWNER_UID } from "../../src/config.js";

const MAX_BYTES = { avatar: 1024 * 1024, cover: 3 * 1024 * 1024 };
const CONTENT_TYPE = "image/jpeg"; // the app turns every picture into a JPEG before uploading

const googleKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

function env(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

// Firebase login token -> uid, or null if it is missing, fake or expired
async function verifyToken(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");
  if (!token) return null;
  const projectId = env("VITE_FIREBASE_PROJECT_ID");
  try {
    const { payload } = await jwtVerify(token, googleKeys, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    return { uid: payload.sub, token };
  } catch {
    return null;
  }
}

// Same "member" idea as firestore.rules: the owner, or an account with a students/{uid} profile.
// Asks Firestore with the user's own token, so no Firebase admin key is needed.
async function isMember({ uid, token }) {
  if (uid === OWNER_UID) return true;
  const url = `https://firestore.googleapis.com/v1/projects/${env("VITE_FIREBASE_PROJECT_ID")}/databases/(default)/documents/students/${uid}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.ok;
}

const randomId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 12);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const user = await verifyToken(req);
    if (!user) return res.status(401).json({ error: "Not logged in" });
    if (!(await isMember(user))) return res.status(403).json({ error: "Not allowed" });

    const { kind, size } = req.body || {};
    if (!MAX_BYTES[kind]) return res.status(400).json({ error: "Unknown kind" });
    if (kind === "cover" && user.uid !== OWNER_UID) return res.status(403).json({ error: "Not allowed" });
    if (!Number.isInteger(size) || size <= 0 || size > MAX_BYTES[kind]) return res.status(400).json({ error: "Bad size" });

    const key = kind === "avatar" ? `avatars/${user.uid}.jpg` : `covers/${randomId()}.jpg`;

    const r2 = new AwsClient({
      accessKeyId: env("R2_ACCESS_KEY_ID"),
      secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
      service: "s3",
      region: "auto",
    });
    const url = new URL(`https://${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com/${env("R2_BUCKET_NAME")}/${key}`);
    url.searchParams.set("X-Amz-Expires", "120");
    // allHeaders: the Content-Type is part of the signature, so only a JPEG can be uploaded with this URL
    const signed = await r2.sign(new Request(url, { method: "PUT", headers: { "Content-Type": CONTENT_TYPE } }), {
      aws: { signQuery: true, allHeaders: true },
    });

    // ?v= makes browsers load a replaced avatar instead of the cached old one
    const publicUrl = `${env("R2_PUBLIC_BASE_URL").replace(/\/+$/, "")}/${key}?v=${Date.now()}`;
    return res.status(200).json({ uploadUrl: signed.url, publicUrl });
  } catch (err) {
    console.error("uploads/sign:", err);
    return res.status(500).json({ error: "Could not create upload URL" });
  }
}
