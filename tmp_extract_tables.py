from pypdf import PdfReader
import re
import sys

def scan_pdf(path, label):
    r = PdfReader(path)
    print(f"=== {label} === pages: {len(r.pages)}")
    tables = {}
    for i, page in enumerate(r.pages):
        text = page.extract_text() or ""
        for m in re.finditer(r"Table\s+(\d+[A-Za-z]?)\s*[—\-–:]", text):
            tnum = m.group(1)
            start = max(0, m.start() - 80)
            end = min(len(text), m.end() + 250)
            snippet = " ".join(text[start:end].split())
            if tnum not in tables:
                tables[tnum] = {"pages": [], "snippets": []}
            if i + 1 not in tables[tnum]["pages"]:
                tables[tnum]["pages"].append(i + 1)
            if len(tables[tnum]["snippets"]) < 2:
                tables[tnum]["snippets"].append(snippet[:350])
    for t in sorted(tables.keys(), key=lambda x: (int(re.match(r"(\d+)", x).group(1)) if re.match(r"(\d+)", x) else 999, x)):
        info = tables[t]
        print(f"Table {t} -> pages {info['pages']}")
        for s in info["snippets"]:
            print(f"  {s}")
        print()
    return tables

def extract_pages(path, pages, label):
    r = PdfReader(path)
    print(f"\n===== {label} FULL TEXT =====")
    for p in pages:
        if 1 <= p <= len(r.pages):
            text = r.pages[p - 1].extract_text() or ""
            print(f"\n--- Page {p} ---\n{text}")

if __name__ == "__main__":
    tr_path = r"d:\projects\Weldoc-claude-4.8\CEN-ISO-TR-20172-2021-en.pdf"
    iso_path = r"d:\projects\Weldoc-claude-4.8\standards\BS_EN_ISO_9606-1-2017.pdf"
    scan_pdf(tr_path, "TR 20172")
    scan_pdf(iso_path, "ISO 9606-1")
    # Extract ISO tables 1-10 pages (approx from standards-reference)
    extract_pages(iso_path, list(range(11, 24)), "ISO 9606-1 Tables region")
