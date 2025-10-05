PDF helper scripts

Prerequisites
- Python 3.10+ on PATH
- Install packages:

```cmd
python -m pip install pypdf pdfplumber pdf2image pytesseract pillow
```

Optional (for OCR):
- Install Poppler for Windows: https://blog.alivate.com.au/poppler-windows/
- Install Tesseract OCR: https://github.com/tesseract-ocr/tesseract

Usage
- Extract links:

```cmd
python scripts\extract_links.py path\to\file.pdf
```

- Convert PDF tables/text to JSON:

```cmd
python scripts\pdf_to_json.py path\to\file.pdf
# result: scripts\out.json
```

- Map extracted rows to `data/projects.json`:

```cmd
python scripts\mapper.py scripts\out.json
# result: data\projects.json
```

Notes
- Table extraction works best on PDFs with consistent table layouts. For scanned PDFs, run OCR first.
- The mapper uses heuristics; review `data/projects.json` after mapping and clean up as needed.
