/**
 * Where processed logos live. Production: a public Tigris bucket (S3 API) — the app only ever PUTs
 * random keys; nothing is deletable or overwritable through the site. Local dev / tests: a folder,
 * both served by GET /api/launch/image/[key] (same-origin fallback URL for any stored key).
 */
import "server-only";
import { get, put } from "@vercel/blob";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { imageUrlFor } from "./images";

type Store = { kind: "blob"; publicBase: string } | { kind: "s3"; client: S3Client; bucket: string; publicBase: string } | { kind: "local"; dir: string; publicBase: string } | { kind: "off" };

let cached: Store | null = null;

function config(): Store {
  if (cached) return cached;
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const site = (process.env.NEXT_PUBLIC_SITE_URL || (host ? "https://" + host : "http://localhost:3000")).replace(/\/+$/, "");
  const publicBase = process.env.IMAGE_PUBLIC_BASE || site + "/api/launch/image";
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL) {
    cached = { kind: "blob", publicBase };
    return cached;
  }
  const bucket = process.env.BUCKET_NAME || process.env.IMAGE_BUCKET;
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const key = process.env.AWS_ACCESS_KEY_ID;
  const secret = process.env.AWS_SECRET_ACCESS_KEY;
  if (bucket && endpoint && key && secret) {
    cached = { kind: "s3", client: new S3Client({ region: process.env.AWS_REGION || "auto", endpoint, forcePathStyle: false, credentials: { accessKeyId: key, secretAccessKey: secret } }), bucket, publicBase };
  } else if (process.env.IMAGE_STORE === "local") {
    cached = { kind: "local", dir: path.join(process.cwd(), ".uploads"), publicBase };
  } else cached = { kind: "off" };
  return cached;
}
export function imagePublicBase(): string | null {
  const c = config();
  return c.kind === "off" ? null : c.publicBase;
}

/**
 * The hero coin wears a new launch's picture unless HERO_COIN_PICTURES=off (a Fly secret: setting it restarts the app, no
 * deploy). The coin's rules are speed bumps (hero-coin.ts), so this is the switch for a day a creator's picture should not
 * be on the front page. Off, the caption still reacts and the coin stays plain.
 */
export function coinPicturesEnabled(): boolean {
  return process.env.HERO_COIN_PICTURES?.trim().toLowerCase() !== "off";
}

export function imageUploadsEnabled(): boolean {
  return config().kind !== "off";
}

/** Store a processed WebP under `key`; returns its public URL. */
export async function putImage(key: string, body: Buffer): Promise<string> {
  const c = config();
  if (c.kind === "off") throw new Error("image uploads are not configured");
  if (c.kind === "blob") {
    await put(key, body, { access: "public", contentType: "image/webp", cacheControlMaxAge: 31536000, addRandomSuffix: false, allowOverwrite: false });
    return imageUrlFor(c.publicBase, key);
  }
  if (c.kind === "s3") {
    await c.client.send(new PutObjectCommand({ Bucket: c.bucket, Key: key, Body: body, ACL: "public-read", ContentType: "image/webp", CacheControl: "public, max-age=31536000, immutable", ContentDisposition: "inline" }));
    return imageUrlFor(c.publicBase, key);
  }
  const file = path.join(c.dir, key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
  return imageUrlFor(c.publicBase, key);
}
const READ_TIMEOUT_MS = 3_000;
type ObjectClient = Pick<S3Client, "send">;

/**
 * One bucket read that gives up after `timeoutMs`: the abort signal cancels the request, and the race also covers a body
 * that stalls after the headers arrive. A timeout is a miss (null), like any other failed read, and never throws.
 */
export async function readObject(client: ObjectClient, bucket: string, key: string, timeoutMs = READ_TIMEOUT_MS): Promise<Buffer | null> {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);
  try {
    const read = (async () => {
      const r = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }), { abortSignal: abort.signal });
      const bytes = await r.Body?.transformToByteArray();
      return bytes ? Buffer.from(bytes) : null;
    })().catch(() => null);
    const timedOut = new Promise<null>((resolve) => abort.signal.addEventListener("abort", () => resolve(null), { once: true }));
    return await Promise.race([read, timedOut]);
  } finally {
    clearTimeout(timer);
  }
}

const KEY_RE = /^t\/[0-9a-f]{48}\.webp$/;

/**
 * Read a stored logo by key (served by GET /api/launch/image/[...key]). Works for both stores, so a logo
 * is always reachable on our own domain even if the bucket's public access is misconfigured.
 * Only keys of the exact shape we mint are ever looked up.
 */
export async function readImage(key: string): Promise<Buffer | null> {
  const c = config();
  if (c.kind === "off" || !KEY_RE.test(key)) return null;
  try {
    if (c.kind === "local") return await readFile(path.join(c.dir, key));
    if (c.kind === "blob") {
      const result = await get(key, { access: "public" });
      if (!result || result.statusCode !== 200 || !result.stream) return null;
      return Buffer.from(await new Response(result.stream).arrayBuffer());
    }
    return await readObject(c.client, c.bucket, key);
  } catch { return null; }
}
