import JSZip from "jszip";
import type { PhotoFile } from "./match-import-photos";

const MAX_ZIP_BYTES = 50 * 1024 * 1024;
const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp"];

export type ExtractedImportUpload = {
  excel: File | null;
  photos: PhotoFile[];
  fileError?: string;
};

function mimeFromFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
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

function isUnderPhotosFolder(path: string): boolean {
  const normalized = path.replace(/\\/g, "/").toLowerCase();
  return normalized.includes("/photos/") || normalized.startsWith("photos/");
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
      fileError: "Could not read ZIP file.",
    };
  }

  let excelEntry: JSZip.JSZipObject | null = null;
  const photoEntries: Array<{ path: string; entry: JSZip.JSZipObject }> = [];

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    if (path.startsWith("__MACOSX/") || basename(path).startsWith(".")) continue;

    const name = basename(path);
    if (name.toLowerCase().endsWith(".xlsx") && !excelEntry) {
      excelEntry = entry;
      continue;
    }

    if (isImageFilename(name) && isUnderPhotosFolder(path)) {
      photoEntries.push({ path, entry });
    }
  }

  if (!excelEntry) {
    return {
      excel: null,
      photos: [],
      fileError: "ZIP must contain an Excel (.xlsx) file.",
    };
  }

  const excelBuf = await excelEntry.async("nodebuffer");
  const excelName = basename(excelEntry.name);
  const excel = new File([excelBuf], excelName, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const photos: PhotoFile[] = [];
  for (const { path, entry } of photoEntries) {
    const bytes = await entry.async("nodebuffer");
    photos.push({
      filename: basename(path),
      bytes,
      mime: mimeFromFilename(path),
    });
  }

  return { excel, photos };
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
      fileError: "Select an Excel file to upload.",
    };
  }

  const photos: PhotoFile[] = [];
  for (const entry of formData.getAll("photos")) {
    if (entry instanceof File && entry.size > 0) {
      photos.push(await fileToPhotoFile(entry));
    }
  }

  return { excel: excelField, photos };
}

/** Photos (or ZIP photos/) for commit — rows travel separately as JSON. */
export async function extractPhotosFromFormData(
  formData: FormData,
): Promise<PhotoFile[]> {
  const zipField = formData.get("zip");
  if (zipField instanceof File && zipField.size > 0) {
    const { photos } = await extractFromZip(zipField);
    return photos;
  }

  const photos: PhotoFile[] = [];
  for (const entry of formData.getAll("photos")) {
    if (entry instanceof File && entry.size > 0) {
      photos.push(await fileToPhotoFile(entry));
    }
  }
  return photos;
}
