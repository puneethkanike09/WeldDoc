"""Extract key qualification sections from standards PDFs."""
from pathlib import Path

import fitz

root = Path(__file__).resolve().parents[1]
out = root / "scripts" / "standards-key-sections.txt"
lines: list[str] = []

def dump(doc: fitz.Document, name: str, page_nums: list[int]) -> None:
    lines.append(f"\n{'#' * 80}\n# {name}\n{'#' * 80}")
    for pn in page_nums:
        if 1 <= pn <= doc.page_count:
            text = doc.load_page(pn - 1).get_text()
            lines.append(f"\n--- {name} page {pn} ---\n{text[:8000]}")

# ISO 9606-1: scope, essential variables, validity, certificate, annex A
iso = fitz.open(str(root / "standards/BS_EN_ISO_9606-1-2017.pdf"))
dump(iso, "ISO 9606-1 §1 Scope", [11])
dump(iso, "ISO 9606-1 §5 Essential variables", [16, 17, 18, 19, 20, 21, 22, 23, 24, 25])
dump(iso, "ISO 9606-1 §9 Period of validity", [34, 35])
dump(iso, "ISO 9606-1 §10-11 Certificate & designation", [35, 36])
dump(iso, "ISO 9606-1 Annex A certificate", [37, 38, 39, 40])
iso.close()

# AWS D1.1: find welder qualification clause via TOC
aws = fitz.open(str(root / "standards/AWS_D1.1_2025.pdf"))
toc = aws.get_toc(simple=True)
lines.append("\n# AWS D1.1 TOC — qualification-related")
for level, title, page in toc:
    t = title.lower()
    if any(k in t for k in ("qualif", "welder", "weld procedure", "performance", "wps", "part c", "clause 6", "clause 8")):
        lines.append(f"  {'  '*(level-1)}{title} ... p{page}")
# Common D1.1 welder qual is Part C / Clause 6 area — sample pages around keyword hits
for pn in [1, 2, 3, 4, 5]:
    t = aws.load_page(pn - 1).get_text().lower()
    if "welder qualification" in t or "performance qualification" in t:
        dump(aws, f"AWS D1.1 early hit p{pn}", [pn])
# Search first 100 pages for "Part C" or "Clause 6"
for i in range(min(150, aws.page_count)):
    t = aws.load_page(i).get_text()
    tl = t.lower()
    if "part c" in tl and "welder" in tl:
        dump(aws, f"AWS D1.1 Part C area", [i + 1, i + 2, i + 3])
        break
aws.close()

# ASME IX: QW/QB articles
asme = fitz.open(str(root / "standards/ASME_BPVC_Section_IX_2025 (1).pdf"))
toc = asme.get_toc(simple=True)
lines.append("\n# ASME IX TOC — QW/QB articles (first 80 qual-related)")
count = 0
for level, title, page in toc:
    t = title.lower()
    if any(k in t for k in ("qw-", "qb-", "welder", "welding operator", "performance", "qualification", "wps", "pqr")):
        lines.append(f"  {'  '*(level-1)}{title} ... p{page}")
        count += 1
        if count >= 80:
            break
for pn in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]:
    t = asme.load_page(pn - 1).get_text().lower()
    if "article i" in t or "qw-100" in t or "scope" in t[:500]:
        dump(asme, "ASME IX front matter", [pn])
        break
# QW-350 welder qualification variables
for i in range(asme.page_count):
    t = asme.load_page(i).get_text()
    if "QW-350" in t or "QW-403" in t:
        dump(asme, "ASME IX QW-350 area", [i + 1, i + 2])
        break
asme.close()

# ISO 14732 operator qualification
op = fitz.open(str(root / "standards/ISO 14732-2025 Operator.pdf"))
toc = op.get_toc(simple=True)
lines.append("\n# ISO 14732 TOC (first 60)")
for level, title, page in toc[:60]:
    lines.append(f"  {'  '*(level-1)}{title} ... p{page}")
dump(op, "ISO 14732 scope/start", [1, 2, 3, 4, 5])
for i in range(op.page_count):
    t = op.load_page(i).get_text().lower()
    if "period of validity" in t or "revalidation" in t:
        dump(op, "ISO 14732 validity", [i + 1, i + 2])
        break
op.close()

out.write_text("\n".join(lines), encoding="utf-8")
print(f"Wrote {out} ({len(lines)} sections)")
