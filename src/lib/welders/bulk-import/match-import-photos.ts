export type PhotoMatchStatus = "ready" | "missing" | "duplicate" | "invalid_type";

export interface PhotoMatchResult {
  plantWelderId: string;
  filename: string | null;
  status: PhotoMatchStatus;
}

export type PhotoFile = {
  filename: string;
  bytes: Buffer;
  mime: string;
};

const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export function matchPhotosToWelders(
  rows: Array<{ welder: { plantWelderId: string; photoFilename: string | null } }>,
  files: PhotoFile[],
): { matches: Map<string, PhotoFile>; results: PhotoMatchResult[] } {
  const byName = new Map<string, PhotoFile[]>();
  for (const f of files) {
    const key = f.filename.toLowerCase();
    const list = byName.get(key) ?? [];
    list.push(f);
    byName.set(key, list);
  }

  const matches = new Map<string, PhotoFile>();
  const results: PhotoMatchResult[] = [];

  for (const row of rows) {
    const plantId = row.welder.plantWelderId;
    if (!plantId || results.some((r) => r.plantWelderId === plantId)) continue;

    const candidates: PhotoFile[] = [];
    if (row.welder.photoFilename) {
      const hit = byName.get(row.welder.photoFilename.toLowerCase());
      if (hit) candidates.push(...hit);
    } else {
      for (const ext of IMAGE_EXT) {
        const hit = byName.get(`${plantId.toLowerCase()}${ext}`);
        if (hit) candidates.push(...hit);
      }
    }

    if (candidates.length > 1) {
      results.push({ plantWelderId: plantId, filename: null, status: "duplicate" });
      continue;
    }
    if (candidates.length === 1) {
      const f = candidates[0];
      if (f.bytes.length > MAX_PHOTO_BYTES || !ALLOWED_MIME.has(f.mime)) {
        results.push({
          plantWelderId: plantId,
          filename: f.filename,
          status: "invalid_type",
        });
        continue;
      }
      matches.set(plantId, f);
      results.push({ plantWelderId: plantId, filename: f.filename, status: "ready" });
    } else {
      results.push({ plantWelderId: plantId, filename: null, status: "missing" });
    }
  }

  return { matches, results };
}
