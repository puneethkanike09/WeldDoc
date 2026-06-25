"""Extract ISO/TR 20173:2018 Table 1 (ferrous) into JSON for WeldDoc lookup."""
from __future__ import annotations

import json
import re
from pathlib import Path

import pypdf

PDF = Path(__file__).resolve().parents[1] / "ISO-TR_20173_2018-07_e.pdf"
OUT = Path(__file__).resolve().parents[1] / "src" / "lib" / "materials" / "tr20173-steel.json"

SKIP = re.compile(
    r"^(ISO/TR 20173|Table 1|Standard Specification|Group$|No\.$|ISO/TR 15608|"
    r"P/ M-No|Nominal composition|B55EB|Normen-Download|rights reserved|\s*$)",
    re.I,
)

def build_designation(spec: str, number: str, type_grade: str) -> str:
    parts = [spec.strip(), number.strip()]
    tg = type_grade.strip()
    if tg:
        parts.append(tg)
    return " ".join(p for p in parts if p)


ROW_TAIL = re.compile(
    r"^(.+?)\s+(\d+[A-Z]?)\s+(\d+)\s+(\d+(?:\.\d+)?[A-Z]?)\s+(.+)$"
)


def parse_row(line: str) -> dict | None:
    line = re.sub(r"\s+", " ", line.strip())
    if not line or SKIP.search(line):
        return None

    m = ROW_TAIL.match(line)
    if not m:
        return None

    front, p_no, american_group, iso_group, composition = m.groups()
    tokens = front.split()
    if len(tokens) < 3:
        return None

    standard = tokens[0]
    specification = tokens[1]
    number = tokens[2]
    rest = tokens[3:]

    uns = ""
    if rest and re.match(r"^K\d{5}$", rest[0]):
        uns = rest[0]
        rest = rest[1:]

    type_grade = " ".join(rest)
    designation = build_designation(specification, number, type_grade)

    return {
        "standard": standard,
        "specification": specification,
        "number": number,
        "typeGrade": type_grade,
        "uns": uns,
        "designation": designation,
        "group": iso_group,
        "americanGroup": american_group,
        "pNo": p_no,
        "composition": composition,
    }


def main() -> None:
    reader = pypdf.PdfReader(str(PDF))
    entries: list[dict] = []
    seen: set[tuple[str, str]] = set()

    # Table 1 spans roughly pages 7–72 (0-indexed 6–71).
    for page_idx in range(6, 72):
        text = reader.pages[page_idx].extract_text() or ""
        for raw_line in text.split("\n"):
            row = parse_row(raw_line)
            if not row:
                continue
            key = (row["standard"], row["designation"])
            if key in seen:
                continue
            seen.add(key)
            entries.append(row)

    entries.sort(key=lambda e: (e["standard"], e["designation"]))
    OUT.write_text(json.dumps(entries, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(entries)} entries to {OUT}")
    standards = sorted({e["standard"] for e in entries})
    print(f"Standards ({len(standards)}):", ", ".join(standards[:12]), "...")


if __name__ == "__main__":
    main()
