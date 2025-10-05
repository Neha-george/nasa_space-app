#!/usr/bin/env python3
"""
Build a simple projects JSON by pairing extracted links (scripts/extracted_links.json)
with the OCR/text extraction (scripts/out.json).

Usage:
  python scripts\build_projects_from_pdf.py

This reads scripts/extracted_links.json and scripts/out.json and creates data/projects.json
with objects: {id,title,piName,institution,topic,year,description,sourceUrl}
"""
import json
from pathlib import Path
import re


def load_links(path=Path('scripts/extracted_links.json')):
    if not path.exists():
        print('No', path)
        return []
    return json.loads(path.read_text(encoding='utf-8'))


def load_text(path=Path('scripts/out.json')):
    if not path.exists():
        print('No', path)
        return ''
    # try utf-8, fallback to latin-1 if needed
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except UnicodeDecodeError:
        try:
            with open(path, 'r', encoding='latin-1') as f:
                data = json.load(f)
        except Exception as e:
            print('Failed to read', path, 'with utf-8 and latin-1:', e)
            return ''
    except Exception as e:
        print('Failed to parse JSON from', path, ':', e)
        return ''
    if isinstance(data, list) and len(data)>0:
        return data[0].get('raw_text','')
    return ''


def find_entry_for_uri(raw_text, uri):
    # find the uri in text, then capture a few lines before as title/authors
    i = raw_text.find(uri)
    if i==-1:
        # try DOI suffix
        m = re.search(r"(10\.\d{4,9}/[\w\.\-\/_]+)", uri)
        if m:
            doi = m.group(1)
            i = raw_text.find(doi)
    if i==-1:
        return None
    # get preceding 400 characters and split into lines
    start = max(0, i-400)
    snippet = raw_text[start:i+len(uri)]
    lines = [l.strip() for l in re.split(r'\n+', snippet) if l.strip()]
    # heuristics: last 3 non-empty lines before the uri are likely title/authors/year
    # find the line index that contains the uri or doi
    for idx,l in enumerate(lines[::-1]):
        if uri in l or re.search(r'10\.\d{4,9}/', l):
            # take up to previous 4 lines as context
            rev_index = len(lines)-1 - idx
            start_idx = max(0, rev_index-4)
            ctx = lines[start_idx:rev_index+1]
            return '\\n'.join(ctx)
    # fallback: return first 200 chars
    return snippet[:200]


def extract_year(text):
    m = re.search(r'(19|20)\d{2}', text)
    if m:
        return int(m.group(0))
    return None


def extract_first_author(text):
    # simple heuristic: first line may contain authors 'Last FM, Last FM.'
    lines = text.split('\n')
    if not lines: return ''
    first = lines[0]
    # take before period
    first = first.split('.')[0]
    # take first author up to comma
    if ',' in first:
        return first.split(',')[0].strip()
    return first.strip()


def main():
    links = load_links()
    raw = load_text()
    projects = []
    next_id = 1
    for l in links:
        uri = l.get('uri')
        context = find_entry_for_uri(raw, uri) or ''
        title = ''
        pi = ''
        year = extract_year(context)
        # try to split context lines to find title and authors
        parts = [p for p in context.split('\n') if p.strip()]
        if parts:
            # if first part looks like authors (contains last names and initials), try second as title
            if len(parts)>1 and re.search(r'[A-Z][a-z]+\s+[A-Z]\.', parts[0]):
                pi = extract_first_author(parts[0])
                title = parts[1]
            else:
                # try to find a line with journal year pattern and take line(s) above as title
                title = parts[0]
        proj = {
            'id': next_id,
            'title': title or uri,
            'piName': pi,
            'institution': '',
            'topic': '',
            'year': year,
            'description': context,
            'sourceUrl': uri
        }
        projects.append(proj)
        next_id += 1

    Path('data').mkdir(exist_ok=True)
    outp = Path('data/projects.json')
    outp.write_text(json.dumps(projects, indent=2, ensure_ascii=False), encoding='utf-8')
    print('Wrote', outp, 'with', len(projects), 'entries')


if __name__ == '__main__':
    main()
