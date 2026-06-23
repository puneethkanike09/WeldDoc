import fitz
from pathlib import Path

root = Path(__file__).resolve().parents[1]


def find_pages(path: str, needles: list[str]) -> dict[str, int]:
    doc = fitz.open(str(root / path))
    found: dict[str, int] = {}
    for i in range(doc.page_count):
        t = doc.load_page(i).get_text()
        for n in needles:
            if n in t and n not in found:
                found[n] = i + 1
    doc.close()
    return found


aws_hits = find_pages(
    "standards/AWS_D1.1_2025.pdf",
    ["6.17 General", "6.21 Essential Variables", "Period of Effectiveness"],
)
asme_hits = find_pages(
    "standards/ASME_BPVC_Section_IX_2025 (1).pdf",
    ["QW-350", "QW-322", "QW-304", "Period of more than"],
)
print("AWS:", aws_hits)
print("ASME:", asme_hits)

out = root / "scripts" / "standards-welder-qual-extract.txt"
lines: list[str] = []

for label, path, page in [
    ("AWS D1.1 §6.17", "standards/AWS_D1.1_2025.pdf", aws_hits.get("6.17 General")),
    ("AWS D1.1 §6.21", "standards/AWS_D1.1_2025.pdf", aws_hits.get("6.21 Essential Variables")),
    ("ASME IX QW-350", "standards/ASME_BPVC_Section_IX_2025 (1).pdf", asme_hits.get("QW-350")),
    ("ASME IX QW-322", "standards/ASME_BPVC_Section_IX_2025 (1).pdf", asme_hits.get("QW-322")),
]:
    if not page:
        continue
    doc = fitz.open(str(root / path))
    for pn in range(page, min(page + 3, doc.page_count + 1)):
        text = doc.load_page(pn - 1).get_text()
        lines.append(f"\n{'#' * 60}\n# {label} page {pn}\n{'#' * 60}\n{text[:7000]}")
    doc.close()

out.write_text("\n".join(lines), encoding="utf-8")
print(f"Wrote {out}")
