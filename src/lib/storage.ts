import { createClient } from "@/lib/supabase/server";

const PUBLIC_BUCKETS = new Set(["welder-photos", "generated-pdfs", "org-assets"]);

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Uploads a File (from a Server Action FormData) to a bucket.
 * Returns the stored object path, or null if no usable file was provided.
 */
export async function uploadFile(
  bucket: string,
  file: File | null | undefined,
  folder: string,
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const supabase = await createClient();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${folder}/${Date.now()}-${safeName(
    file.name.replace(/\.[^.]+$/, ""),
  )}.${ext}`;

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

export async function publicUrl(
  bucket: string,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Resolves a viewable URL for a stored object: public URL for public buckets,
 * a time-limited signed URL for private buckets.
 */
export async function resolveUrl(
  bucket: string,
  path: string | null,
  expiresIn = 3600,
): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  if (PUBLIC_BUCKETS.has(bucket)) {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}
