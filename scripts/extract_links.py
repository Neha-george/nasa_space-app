#!/usr/bin/env python3
"""
Extract hyperlinks (URI) from a PDF and print JSON array of {page, uri}.
Usage: python scripts/extract_links.py path/to/file.pdf
"""
import sys
import json
import argparse
try:
    from pypdf import PdfReader
except Exception:
    print("Error: missing Python dependency 'pypdf'.\nInstall with: python -m pip install pypdf")
    sys.exit(2)


def extract_links(pdf_path):
    reader = PdfReader(pdf_path)
    links = []
    for i, page in enumerate(reader.pages):
        annots = page.get('/Annots')
        if not annots:
            continue
        for a in annots:
            try:
                obj = a.get_object()
                if '/A' in obj:
                    action = obj['/A']
                    uri = action.get('/URI')
                    if uri:
                        links.append({'page': i+1, 'uri': uri})
            except Exception:
                continue
    return links


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Extract hyperlinks from a PDF')
    parser.add_argument('pdf', help='Path to PDF')
    parser.add_argument('--out', '-o', help='Optional output file to write JSON to')
    args = parser.parse_args()
    path = args.pdf
    out = extract_links(path)
    if args.out:
        p = args.out
        with open(p, 'w', encoding='utf-8') as fh:
            json.dump(out, fh, indent=2, ensure_ascii=False)
        print('Wrote', p)
    else:
        print(json.dumps(out, indent=2))
