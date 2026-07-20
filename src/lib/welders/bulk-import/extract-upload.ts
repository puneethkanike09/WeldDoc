import JSZip from "jszip";
import type { DocFile } from "./match-import-docs";
import type { PhotoFile } from "./match-import-photos";

const MAX_ZIP_BYTES = 50 * 1024 * 1024;
const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp"];

export type ExtractedImportUpload = {
  excel: File | null;
  photos: PhotoFile[];
  certificates: DocFile[];
  continuity: DocFile[];
  fileError?: string;
};

function mimeFromFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".pdf")) return "application/pdf";
  return "image/jpeg";
}

function basename(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  return normalized.split("/").pop() ?? path;
}

function isZipFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return (
    lower.endsWith(".zip") ||
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed"
  );
}

function isImageFilename(name: string): boolean {
  const lower = name.toLowerCase();
  return IMAGE_EXT.some((ext) => lower.endsWith(ext));
}

// Phase 2 docs temporarily disabled:
// function isPdfFilename(name: string): boolean {
//   return name.toLowerCase().endsWith(".pdf");
// }

function isUnderFolder(path: string, folder: string): boolean {
  const normalized = path.replace(/\\/g, "/").toLowerCase();
  const f = folder.toLowerCase();
  return normalized.includes(`/${f}/`) || normalized.startsWith(`${f}/`);
}

async function fileToPhotoFile(file: File): Promise<PhotoFile> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime =
    file.type && file.type.startsWith("image/")
      ? file.type
      : mimeFromFilename(file.name);
  return { filename: basename(file.name), bytes, mime };
}

async function extractFromZip(zipFile: File): Promise<ExtractedImportUpload> {
  if (zipFile.size > MAX_ZIP_BYTES) {
    return {
      excel: null,
      photos: [],
      certificates: [],
      continuity: [],
      fileError: "ZIP file is too large (max 50 MB).",
    };
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(await zipFile.arrayBuffer());
  } catch {
    return {
      excel: null,
      photos: [],
      certificates: [],
      continuity: [],
      fileError: "Could not read ZIP file.",
    };
  }

  let excelEntry: JSZip.JSZipObject | null = null;
  const photoEntries: Array<{ path: string; entry: JSZip.JSZipObject }> = [];
  // Phase 2 docs temporarily disabled:
  // const certEntries: Array<{ path: string; entry: JSZip.JSZipObject }> = [];
  // const continuityEntries: Array<{ path: string; entry: JSZip.JSZipObject }> = [];

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    if (path.startsWith("__MACOSX/") || basename(path).startsWith(".")) continue;

    const name = basename(path);
    if (name.toLowerCase().endsWith(".xlsx") && !excelEntry) {
      excelEntry = entry;
      continue;
    }

    if (isImageFilename(name) && isUnderFolder(path, "photos")) {
      photoEntries.push({ path, entry });
      continue;
    }

    // Phase 2 docs temporarily disabled — Excel + photos only.
    // if (isPdfFilename(name) && isUnderFolder(path, "certificates")) {
    //   certEntries.push({ path, entry });
    //   continue;
    // }
    // if (isPdfFilename(name) && isUnderFolder(path, "continuity")) {
    //   continuityEntries.push({ path, entry });
    // }
  }

  if (!excelEntry) {
    return {
      excel: null,
      photos: [],
      certificates: [],
      continuity: [],
      fileError: "ZIP must contain an Excel (.xlsx) file.",
    };
  }

  const excelBytes = new Uint8Array(await excelEntry.async("arraybuffer"));
  const excelName = basename(excelEntry.name);
  const excel = new File([excelBytes], excelName, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const photos: PhotoFile[] = [];
  for (const { path, entry } of photoEntries) {
    const bytes = Buffer.from(await entry.async("arraybuffer"));
    photos.push({
      filename: basename(path),
      bytes,
      mime: mimeFromFilename(path),
    });
  }

  // Phase 2 docs temporarily disabled — always empty.
  // const certificates: DocFile[] = []; ...
  // const continuity: DocFile[] = []; ...
  const certificates: DocFile[] = [];
  const continuity: DocFile[] = [];

  return { excel, photos, certificates, continuity };
}

export async function extractImportUpload(
  formData: FormData,
): Promise<ExtractedImportUpload> {
  const zipField = formData.get("zip");
  if (zipField instanceof File && zipField.size > 0) {
    return extractFromZip(zipField);
  }

  const fileField = formData.get("file");
  if (fileField instanceof File && fileField.size > 0 && isZipFile(fileField)) {
    return extractFromZip(fileField);
  }

  const excelField = formData.get("excel") ?? formData.get("file");
  if (!(excelField instanceof File) || excelField.size === 0) {
    return {
      excel: null,
      photos: [],
      certificates: [],
      continuity: [],
      fileError: "Select an Excel file to upload.",
    };
  }

  const photos: PhotoFile[] = [];
  for (const entry of formData.getAll("photos")) {
    if (entry instanceof File && entry.size > 0) {
      photos.push(await fileToPhotoFile(entry));
    }
  }

  // Excel-only / Excel+photos path: no certificate or continuity files.
  return { excel: excelField, photos, certificates: [], continuity: [] };
}

/** Photos (or ZIP photos/) for commit — rows travel separately as JSON. */
export async function extractPhotosFromFormData(
  formData: FormData,
): Promise<PhotoFile[]> {
  const extracted = await extractImportUpload(formData);
  return extracted.photos;
}

/** Full ZIP/excel extraction for commit (photos + docs). */
export async function extractImportAssetsFromFormData(
  formData: FormData,
): Promise<Pick<ExtractedImportUpload, "photos" | "certificates" | "continuity">> {
  const extracted = await extractImportUpload(formData);
  return {
    photos: extracted.photos,
    certificates: extracted.certificates,
    continuity: extracted.continuity,
  };
}
