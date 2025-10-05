#!/usr/bin/env python3
"""
Convert PDF tables/text to JSON. Usage: python scripts/pdf_to_json.py path/to/file.pdf
Outputs: scripts/out.json
"""
import sys
import json
from pathlib import Path
import re
try:
    import pdfplumber
except Exception:
    print("Error: missing Python dependency 'pdfplumber'.\nInstall with: python -m pip install pdfplumber")
    sys.exit(2)


def tables_to_records(pdf_path):
    records = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                if not table or len(table) < 2:
                    continue
                headers = [ (h or '').strip() for h in table[0] ]
                for row in table[1:]:
                    obj = {}
                    for k,v in zip(headers, row):
                        obj[k] = (v or '').strip()
                    records.append(obj)
    return records


def text_to_record(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        text = "\n".join([p.extract_text() or "" for p in pdf.pages])
    rec = {}
    m = re.search(r"Title[:\s]+(.+)", text)
    if m: rec['title'] = m.group(1).strip()
    m = re.search(r"Year[:\s]+(\d{4})", text)
    if m: rec['year'] = int(m.group(1))
    rec['raw_text'] = text[:4000]
    return [rec]


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python scripts/pdf_to_json.py path/to/file.pdf')
        sys.exit(1)
    pdf = sys.argv[1]
    rows = tables_to_records(pdf)
    if not rows:
        rows = text_to_record(pdf)
    out = Path('scripts/out.json')
    out.write_text(json.dumps(rows, indent=2, ensure_ascii=False))
    print('Wrote', out)
