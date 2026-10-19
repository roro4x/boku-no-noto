"""Import vocabulary from an Anki package. Requires Node.js 24 for Zstandard."""
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import zipfile
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parent.parent

class PlainText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
    def handle_data(self, data):
        self.parts.append(data)
    def handle_starttag(self, tag, attrs):
        if tag in ('br', 'p', 'div'): self.parts.append('\n')

def plain(value):
    parser = PlainText()
    parser.feed(value)
    return '\n'.join(line.strip() for line in ''.join(parser.parts).splitlines() if line.strip())

package = Path(sys.argv[1])
with tempfile.TemporaryDirectory() as temporary:
    database = Path(temporary) / 'collection.sqlite'
    with zipfile.ZipFile(package) as archive:
        name = next(name for name in ('collection.anki21b', 'collection.anki21', 'collection.anki2') if name in archive.namelist())
        data = archive.read(name)
    if name.endswith('b'):
        data = subprocess.run([os.environ.get('NODE_BINARY', 'node'), '-e',
            "const fs=require('node:fs');process.stdout.write(require('node:zlib').zstdDecompressSync(fs.readFileSync(0)))"],
            input=data, capture_output=True, check=True).stdout
    database.write_bytes(data)
    connection = sqlite3.connect(database)
    connection.create_collation('unicase', lambda a,b: (a.casefold()>b.casefold())-(a.casefold()<b.casefold()))
    models = {}
    for model, ordinal, field in connection.execute('select ntid, ord, name from fields'):
        models.setdefault(model, {})[field] = ordinal
    words = []
    rows = connection.execute('select n.id,n.mid,n.flds from notes n join cards c on c.nid=n.id group by n.id order by min(c.due),n.id')
    for note_id, model, fields in rows:
        values = fields.split('\x1f')
        def field(name):
            return plain(values[models[model][name]])
        words.append(dict(id=f'kaishi-{note_id}', order=len(words)+1,
            term=field('Word'), reading=field('Word Reading'), meaningsRu=[field('Word Meaning (Russian)')],
            sentence=field('Sentence'), sentenceMeaningRu=field('Sentence Meaning (Russian)'),
            notesRu=field('Notes (Russian)')))
    assert len(words) == 1500, f'Expected 1500 notes, got {len(words)}'
    assert all(w['term'] and w['reading'] and w['meaningsRu'][0] for w in words)
    assert len({w['id'] for w in words}) == len(words)
    target = ROOT / 'public/data/kaishi'
    target.mkdir(parents=True, exist_ok=True)
    (target/'vocabulary.json').write_text(json.dumps(words, ensure_ascii=False, indent=2)+'\n')
    (target/'source.json').write_text(json.dumps(dict(title='Kaishi 1.5k Russian', file=package.name,
        sha256=hashlib.sha256(package.read_bytes()).hexdigest(), count=len(words),
        description='Imported from the user-provided Anki package. Russian translations and examples preserved; HTML converted to plain text. Media not imported.'), ensure_ascii=False, indent=2)+'\n')
    print(f'Imported {len(words)} words to {target}')
