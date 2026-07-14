import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Prefer cookie session; fall back to service role for scripts / background jobs. */
async function supabaseStorageClient() {
  try {
    return await createClient();
  } catch {
    return createAdminClient();
  }
}

/** Logical folders (former Supabase bucket names) under the single S3 bucket. */
const PUBLIC_BUCKETS = new Set([
  "welder-photos",
  "generated-pdfs",
  "org-assets",
]);

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function storageDriver(): "s3" | "supabase" {
  const explicit = process.env.STORAGE_DRIVER?.trim().toLowerCase();
  if (explicit === "s3") return "s3";
  if (explicit === "supabase") return "supabase";
  if (
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET
  ) {
    return "s3";
  }
  return "supabase";
}

function s3Config() {
  const bucket = process.env.S3_BUCKET?.trim();
  const region = process.env.AWS_REGION?.trim() || "ap-south-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "S3 storage is enabled but AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, or S3_BUCKET is missing",
    );
  }
  return { bucket, region, accessKeyId, secretAccessKey };
}

let cachedS3: S3Client | null = null;

function s3Client(): S3Client {
  if (cachedS3) return cachedS3;
  const { region, accessKeyId, secretAccessKey } = s3Config();
  cachedS3 = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cachedS3;
}

function s3Key(logicalBucket: string, path: string): string {
  return `${logicalBucket}/${path}`.replace(/\/+/g, "/");
}

async function fileToBuffer(file: File): Promise<Buffer> {
  return Buffer.from(await file.arrayBuffer());
}

async function s3ObjectExists(key: string): Promise<boolean> {
  const { bucket } = s3Config();
  try {
    await s3Client().send(
      new HeadObjectCommand({ Bucket: bucket, Key: key }),
    );
    return true;
  } catch (err: unknown) {
    const status =
      err && typeof err === "object" && "$metadata" in err
        ? (err as { $metadata?: { httpStatusCode?: number } }).$metadata
            ?.httpStatusCode
        : undefined;
    const name = err && typeof err === "object" && "name" in err
      ? String((err as { name: string }).name)
      : "";
    if (status === 404 || name === "NotFound" || name === "NoSuchKey") {
      return false;
    }
    throw err;
  }
}

async function resolveSupabaseUrl(
  bucket: string,
  path: string,
  expiresIn: number,
): Promise<string | null> {
  const supabase = await supabaseStorageClient();
  if (PUBLIC_BUCKETS.has(bucket)) {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

/**
 * Uploads a File (from a Server Action FormData) to a logical bucket.
 * Returns the stored object path, or null if no usable file was provided.
 */
export async function uploadFile(
  bucket: string,
  file: File | null | undefined,
  folder: string,
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${folder}/${Date.now()}-${safeName(
    file.name.replace(/\.[^.]+$/, ""),
  )}.${ext}`;

  if (storageDriver() === "s3") {
    const { bucket: s3Bucket } = s3Config();
    const body = await fileToBuffer(file);
    await s3Client().send(
      new PutObjectCommand({
        Bucket: s3Bucket,
        Key: s3Key(bucket, path),
        Body: body,
        ContentType: file.type || undefined,
        CacheControl: "3600",
      }),
    );
    return path;
  }

  const supabase = await supabaseStorageClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw new Error(`Upload failed (${bucket}): ${error.message}`);
  return path;
}

/** Upload multiple files from a FormData field. */
export async function uploadFiles(
  bucket: string,
  files: File[],
  folder: string,
): Promise<string[]> {
  const paths: string[] = [];
  for (const file of files) {
    if (!file || file.size === 0) continue;
    const path = await uploadFile(bucket, file, folder);
    if (path) paths.push(path);
  }
  return paths;
}

/** Upload raw bytes (e.g. generated PDF buffer) to a logical bucket. */
export async function uploadBytes(
  bucket: string,
  path: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<void> {
  if (storageDriver() === "s3") {
    const { bucket: s3Bucket } = s3Config();
    await s3Client().send(
      new PutObjectCommand({
        Bucket: s3Bucket,
        Key: s3Key(bucket, path),
        Body: body,
        ContentType: contentType,
        CacheControl: "3600",
      }),
    );
    return;
  }

  const supabase = await supabaseStorageClient();
  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`Upload failed (${bucket}): ${error.message}`);
}

export async function publicUrl(
  bucket: string,
  path: string | null,
): Promise<string | null> {
  return resolveUrl(bucket, path);
}

/**
 * Resolves a viewable URL for a stored object.
 * S3: presigned GetObject (with Supabase fallback when the object is missing).
 * Supabase: public URL for public buckets, else signed URL.
 */
export async function resolveUrl(
  bucket: string,
  path: string | null,
  expiresIn = 3600,
): Promise<string | null> {
  if (!path) return null;

  if (storageDriver() === "s3") {
    const { bucket: s3Bucket } = s3Config();
    const key = s3Key(bucket, path);
    try {
      const exists = await s3ObjectExists(key);
      if (exists) {
        return getSignedUrl(
          s3Client(),
          new GetObjectCommand({ Bucket: s3Bucket, Key: key }),
          { expiresIn },
        );
      }
    } catch (err) {
      console.error("S3 resolveUrl head failed, trying Supabase fallback:", err);
    }
    return resolveSupabaseUrl(bucket, path, expiresIn);
  }

  return resolveSupabaseUrl(bucket, path, expiresIn);
}

/** Delete one or more objects from a logical bucket. */
export async function removeObjects(
  bucket: string,
  paths: (string | null | undefined)[],
): Promise<void> {
  const clean = paths.filter((p): p is string => Boolean(p?.trim()));
  if (clean.length === 0) return;

  if (storageDriver() === "s3") {
    const { bucket: s3Bucket } = s3Config();
    await s3Client().send(
      new DeleteObjectsCommand({
        Bucket: s3Bucket,
        Delete: {
          Objects: clean.map((path) => ({ Key: s3Key(bucket, path) })),
          Quiet: true,
        },
      }),
    );
    // Best-effort cleanup of legacy Supabase copies (ignore errors).
    try {
      const supabase = await supabaseStorageClient();
      await supabase.storage.from(bucket).remove(clean);
    } catch {
      /* ignore */
    }
    return;
  }

  const supabase = await supabaseStorageClient();
  const { error } = await supabase.storage.from(bucket).remove(clean);
  if (error) throw new Error(`Remove failed (${bucket}): ${error.message}`);
}

/** Download object bytes from a logical bucket (S3 first, then Supabase). */
export async function downloadObject(
  bucket: string,
  path: string,
): Promise<{ body: Buffer; contentType: string | null }> {
  if (storageDriver() === "s3") {
    const { bucket: s3Bucket } = s3Config();
    const key = s3Key(bucket, path);
    try {
      const exists = await s3ObjectExists(key);
      if (exists) {
        const res = await s3Client().send(
          new GetObjectCommand({ Bucket: s3Bucket, Key: key }),
        );
        const bytes = await res.Body?.transformToByteArray();
        if (!bytes) throw new Error(`Empty download (${bucket}/${path})`);
        return {
          body: Buffer.from(bytes),
          contentType: res.ContentType ?? null,
        };
      }
    } catch (err) {
      console.error("S3 download failed, trying Supabase fallback:", err);
    }
  }

  const supabase = await supabaseStorageClient();
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) {
    throw new Error(
      `Download failed (${bucket}/${path}): ${error?.message ?? "not found"}`,
    );
  }
  return {
    body: Buffer.from(await data.arrayBuffer()),
    contentType: data.type || null,
  };
}
