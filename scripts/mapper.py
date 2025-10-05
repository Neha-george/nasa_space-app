#!/usr/bin/env python3
"""
Map extracted rows to the BioQuest schema and output `data/projects.json`.
Usage: python scripts/mapper.py scripts/out.json
"""
import sys
import json
from pathlib import Path


def map_row_to_project(row, next_id):
    return {
        'id': next_id,
        'title': row.get('Title') or row.get('title') or row.get('Project Title') or 'Untitled',
        'piName': row.get('PI') or row.get('Principal Investigator') or row.get('pi') or '',
        'institution': row.get('Institution') or row.get('Org') or row.get('institution') or '',
        'topic': row.get('Topic') or row.get('Research Area') or row.get('topic') or 'Unspecified',
        'year': int(row.get('Year')) if row.get('Year') and str(row.get('Year')).isdigit() else None,
        'description': row.get('Description') or row.get('Abstract') or row.get('Notes') or ''
    }


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python scripts/mapper.py path/to/extracted.json')
        sys.exit(1)
    inpath = Path(sys.argv[1])
    rows = json.loads(inpath.read_text(encoding='utf-8'))
    projects = []
    next_id = 1
    if Path('data/projects.json').exists():
        existing = json.loads(Path('data/projects.json').read_text(encoding='utf-8'))
        if existing:
            next_id = max([p.get('id',0) for p in existing]) + 1
            projects = existing
    for r in rows:
        proj = map_row_to_project(r, next_id)
        next_id += 1
        projects.append(proj)
    Path('data').mkdir(exist_ok=True)
    Path('data/projects.json').write_text(json.dumps(projects, indent=2, ensure_ascii=False), encoding='utf-8')
    print('Wrote data/projects.json with', len(projects), 'items')
