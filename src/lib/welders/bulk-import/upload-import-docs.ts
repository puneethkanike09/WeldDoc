import type { DocFile, ImportDocPaths, ImportDocPlan } from "./match-import-docs";
import { emptyImportDocPaths } from "./match-import-docs";
import { uploadFile } from "@/lib/storage";

function docFileAsUpload(doc: DocFile): File {
  return new File([Uint8Array.from(doc.bytes)], doc.filename, {
    type: doc.mime || "application/pdf",
  });
}

/** Upload matched ZIP docs to storage; returns paths for commit / worker payload. */
export async function uploadImportDocPlan(
  orgId: string,
  plan: Pick<
    ImportDocPlan,
    "certificateByPlant" | "continuityByDate" | "legacyByPlant"
  >,
): Promise<{ paths: ImportDocPaths; uploaded: Array<{ bucket: string; path: string }> }> {
  const paths = emptyImportDocPaths();
  const uploaded: Array<{ bucket: string; path: string }> = [];

  for (const [plant, file] of plan.certificateByPlant) {
    const path = await uploadFile(
      "generated-pdfs",
      docFileAsUpload(file),
      orgId,
    );
    if (path) {
      paths.certificates[plant] = path;
      uploaded.push({ bucket: "generated-pdfs", path });
    }
  }

  for (const [key, file] of plan.continuityByDate) {
    const path = await uploadFile("ndt-reports", docFileAsUpload(file), orgId);
    if (path) {
      paths.continuityByDate[key] = path;
      uploaded.push({ bucket: "ndt-reports", path });
    }
  }

  for (const [plant, files] of plan.legacyByPlant) {
    const list: string[] = [];
    for (const file of files) {
      const path = await uploadFile("legacy-docs", docFileAsUpload(file), orgId);
      if (path) {
        list.push(path);
        uploaded.push({ bucket: "legacy-docs", path });
      }
    }
    if (list.length) paths.legacyByPlant[plant] = list;
  }

  return { paths, uploaded };
}
