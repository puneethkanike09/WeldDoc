"""One-off: extract TOC and key excerpts from standards PDFs."""
import re
from pathlib import Path

import fitz

STANDARDS = [
    "standards/BS_EN_ISO_9606-1-2017.pdf",
    "standards/AWS_D1.1_2025.pdf",
    "standards/ASME_BPVC_Section_IX_2025 (1).pdf",
    "standards/ISO 14732-2025 Operator.pdf",
]

KEYWORDS = [
    "qualification",
    "revalidation",
    "continuity",
    "QW-",
    "welder",
    "operator",
    "WPS",
    "performance",
    "9606",
    "14732",
]

root = Path(__file__).resolve().parents[1]

out_path = root / "scripts" / "standards-extract.txt"
lines: list[str] = []

def log(s: str = "") -> None:
    lines.append(s)

for rel in STANDARDS:
    p = root / rel
    log("\n" + "=" * 80)
    log(f"{p.name} | {p.stat().st_size // 1024} KB")
    log("=" * 80)
    doc = fitz.open(str(p))
    pages = doc.page_count
    log(f"Pages: {pages}")

    toc = doc.get_toc(simple=True)
    if toc:
        log("TOC (first 60 entries):")
        for level, title, page in toc[:60]:
            log(f"  {'  ' * (level - 1)}{title} ... p{page}")

    for i in range(min(2, pages)):
        text = doc.load_page(i).get_text()
        text = re.sub(r"\n{3,}", "\n\n", text.strip())
        log(f"\n--- Page {i + 1} excerpt ---")
        log(text[:1500])

    hits = []
    for i in range(pages):
        t = doc.load_page(i).get_text().lower()
        if any(k.lower() in t for k in KEYWORDS):
            hits.append(i + 1)
    log(f"\nKeyword pages: {hits[:40]} ... ({len(hits)} total)")

    doc.close()

out_path.write_text("\n".join(lines), encoding="utf-8")
print(f"Wrote {out_path}")
