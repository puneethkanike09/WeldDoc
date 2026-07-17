import { describe, expect, it } from "vitest";
import {
  MAX_CONTINUITY_DOCS_PER_QUAL,
  MAX_DOC_BYTES,
  continuityDateFromFilename,
  isCertificateFilename,
  isNumberedContinuityFilename,
  matchCertificatesToWelders,
  matchContinuityDocsToWelders,
  planImportDocuments,
  plantIdFromDocFilename,
  type DocFile,
} from "./match-import-docs";

function pdf(name: string, size = 10): DocFile {
  return {
    filename: name,
    bytes: Buffer.alloc(size, 1),
    mime: "application/pdf",
  };
}

describe("plantIdFromDocFilename", () => {
  it("normalizes W#14, W14, W#014", () => {
    expect(plantIdFromDocFilename("W#14.pdf")).toBe("W#14");
    expect(plantIdFromDocFilename("W14.pdf")).toBe("W#14");
    expect(plantIdFromDocFilename("W#014.pdf")).toBe("W#14");
  });

  it("reads plant id from dated and numbered continuity names", () => {
    expect(plantIdFromDocFilename("W#14_2025-08-02.pdf")).toBe("W#14");
    expect(plantIdFromDocFilename("W#02_cont_1.pdf")).toBe("W#02");
    expect(plantIdFromDocFilename("W#2_cont-3.pdf")).toBe("W#02");
  });

  it("returns null for unrelated names", () => {
    expect(plantIdFromDocFilename("certificate.pdf")).toBeNull();
    expect(plantIdFromDocFilename("photo.jpg")).toBeNull();
  });
});

describe("isCertificateFilename", () => {
  it("accepts exact plant PDF names only", () => {
    expect(isCertificateFilename("W#14.pdf")).toBe(true);
    expect(isCertificateFilename("W14.pdf")).toBe(true);
    expect(isCertificateFilename("W#14_2025-08-02.pdf")).toBe(false);
    expect(isCertificateFilename("W#14_cont_1.pdf")).toBe(false);
    expect(isCertificateFilename("W#14.jpg")).toBe(false);
  });
});

describe("continuityDateFromFilename / numbered", () => {
  it("parses ISO date from filename", () => {
    expect(continuityDateFromFilename("W#14_2025-08-02.pdf")).toBe(
      "2025-08-02",
    );
    expect(continuityDateFromFilename("W#14_cont_1.pdf")).toBeNull();
  });

  it("rejects invalid calendar dates", () => {
    expect(continuityDateFromFilename("W#14_2025-13-40.pdf")).toBeNull();
  });

  it("detects numbered continuity filenames", () => {
    expect(isNumberedContinuityFilename("W#14_cont_1.pdf")).toBe(true);
    expect(isNumberedContinuityFilename("W#14_cont-2.pdf")).toBe(true);
    expect(isNumberedContinuityFilename("W#14_2025-08-02.pdf")).toBe(false);
  });
});

describe("matchCertificatesToWelders", () => {
  it("matches exact certificate PDF by plant id", () => {
    const { matches, results } = matchCertificatesToWelders(
      ["W#14"],
      [pdf("W#14.pdf")],
    );
    expect(matches.get("W#14")?.filename).toBe("W#14.pdf");
    expect(results[0].status).toBe("ready");
  });

  it("marks missing when no certificate file", () => {
    const { results } = matchCertificatesToWelders(["W#14"], []);
    expect(results[0].status).toBe("missing");
  });

  it("ignores dated/cont names in certificate list", () => {
    const { matches, results } = matchCertificatesToWelders(
      ["W#14"],
      [pdf("W#14_2025-08-02.pdf"), pdf("W#14_cont_1.pdf")],
    );
    expect(matches.size).toBe(0);
    expect(results[0].status).toBe("missing");
  });

  it("flags duplicate exact certificate files", () => {
    const { results } = matchCertificatesToWelders(
      ["W#14"],
      [pdf("W#14.pdf"), pdf("W14.pdf")],
    );
    expect(results[0].status).toBe("duplicate");
  });

  it("flags too_large certificates", () => {
    const { results } = matchCertificatesToWelders(
      ["W#14"],
      [pdf("W#14.pdf", MAX_DOC_BYTES + 1)],
    );
    expect(results[0].status).toBe("too_large");
  });

  it("dedupes plant ids across multiple import rows", () => {
    const { results } = matchCertificatesToWelders(
      ["W#14", "W#14", "W14"],
      [pdf("W#14.pdf")],
    );
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("ready");
  });

  it("does not require certificate for excel-only import (missing is ok)", () => {
    const { matches, results } = matchCertificatesToWelders(["W#99"], []);
    expect(matches.size).toBe(0);
    expect(results[0].status).toBe("missing");
  });
});

describe("matchContinuityDocsToWelders", () => {
  it("keys dated files for supporting_doc match", () => {
    const bundle = matchContinuityDocsToWelders(
      ["W#14"],
      [pdf("W#14_2025-08-02.pdf")],
    );
    expect(bundle.byDate.get("W#14|2025-08-02")?.filename).toBe(
      "W#14_2025-08-02.pdf",
    );
    expect(bundle.legacyByPlant.size).toBe(0);
  });

  it("puts numbered files into legacy list", () => {
    const bundle = matchContinuityDocsToWelders(
      ["W#14"],
      [pdf("W#14_cont_1.pdf"), pdf("W#14_cont_2.pdf")],
    );
    expect(bundle.legacyByPlant.get("W#14")?.map((f) => f.filename)).toEqual([
      "W#14_cont_1.pdf",
      "W#14_cont_2.pdf",
    ]);
  });

  it("caps at MAX_CONTINUITY_DOCS_PER_QUAL and warns", () => {
    const files = Array.from({ length: MAX_CONTINUITY_DOCS_PER_QUAL + 3 }, (_, i) =>
      pdf(`W#14_cont_${i + 1}.pdf`),
    );
    const bundle = matchContinuityDocsToWelders(["W#14"], files);
    expect(bundle.legacyByPlant.get("W#14")).toHaveLength(
      MAX_CONTINUITY_DOCS_PER_QUAL,
    );
    expect(
      bundle.warnings.some((w) => w.includes("capped at")),
    ).toBe(true);
  });

  it("counts dated + numbered toward the same cap", () => {
    const files = [
      pdf("W#14_2024-01-01.pdf"),
      ...Array.from({ length: MAX_CONTINUITY_DOCS_PER_QUAL }, (_, i) =>
        pdf(`W#14_cont_${i + 1}.pdf`),
      ),
    ];
    const bundle = matchContinuityDocsToWelders(["W#14"], files);
    const dated = bundle.byDate.size;
    const legacy = bundle.legacyByPlant.get("W#14")?.length ?? 0;
    expect(dated + legacy).toBe(MAX_CONTINUITY_DOCS_PER_QUAL);
  });

  it("warns on unknown W# and non-PDF", () => {
    const bundle = matchContinuityDocsToWelders(
      ["W#14"],
      [
        pdf("W#99_cont_1.pdf"),
        {
          filename: "W#14_cont_1.png",
          bytes: Buffer.from("x"),
          mime: "image/png",
        },
      ],
    );
    expect(bundle.warnings.some((w) => w.includes("unknown W#"))).toBe(true);
    expect(bundle.warnings.some((w) => w.includes("not PDF"))).toBe(true);
  });

  it("keeps first on duplicate dated files", () => {
    const bundle = matchContinuityDocsToWelders(
      ["W#14"],
      [
        { ...pdf("W#14_2025-08-02.pdf"), bytes: Buffer.from("first") },
        { ...pdf("W#14_2025-08-02_copy.pdf"), bytes: Buffer.from("second") },
      ],
    );
    expect(bundle.byDate.get("W#14|2025-08-02")?.bytes.toString()).toBe("first");
    expect(bundle.warnings.some((w) => w.includes("Duplicate continuity date"))).toBe(
      true,
    );
  });

  it("ignores files for plants not in the import", () => {
    const bundle = matchContinuityDocsToWelders(
      ["W#02"],
      [pdf("W#14_cont_1.pdf")],
    );
    expect(bundle.legacyByPlant.size).toBe(0);
  });
});

describe("planImportDocuments", () => {
  it("combines dual-process plant with cert + dated + numbered continuity", () => {
    const plan = planImportDocuments(
      ["W#14", "W#14"], // two Excel rows, same W#
      [pdf("W#14.pdf")],
      [
        pdf("W#14_2025-08-02.pdf"),
        pdf("W#14_cont_1.pdf"),
      ],
    );
    expect(plan.certificateByPlant.has("W#14")).toBe(true);
    expect(plan.continuityByDate.has("W#14|2025-08-02")).toBe(true);
    expect(plan.legacyByPlant.get("W#14")).toHaveLength(1);
    expect(plan.certificateResults).toHaveLength(1);
  });

  it("excel-only (no docs) still plans with missing certs and empty continuity", () => {
    const plan = planImportDocuments(["W#01"], [], []);
    expect(plan.certificateByPlant.size).toBe(0);
    expect(plan.continuityByDate.size).toBe(0);
    expect(plan.legacyByPlant.size).toBe(0);
    expect(plan.certificateResults[0].status).toBe("missing");
  });
});
