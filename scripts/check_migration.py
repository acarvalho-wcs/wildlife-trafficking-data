"""Check source parity, local links, public build boundary and Sites independence."""
from pathlib import Path
import hashlib
import json
import re
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / 'docs/migration/source-manifest.json').read_text())
changed = set(manifest['url_only_changes'])
sanitized = {x['path']: x['sha256'] for x in manifest.get('image_metadata_changes', [])}
for entry in manifest['files']:
    path = ROOT / entry['path']
    assert path.is_file(), f'Missing source: {path}'
    if entry['path'] in sanitized:
        assert hashlib.sha256(path.read_bytes()).hexdigest() == sanitized[entry['path']], f'Sanitized asset changed: {path}'
    elif entry['path'] not in changed:
        assert hashlib.sha256(path.read_bytes()).hexdigest() == entry['sha256'], f'Source changed: {path}'
out = ROOT / 'build/site'
assert out.is_dir(), 'Run scripts/build_site.py first'
allowed = {p.relative_to(ROOT / 'web/observatory') for p in (ROOT / 'web/observatory').rglob('*') if p.is_file()}
for name in ('restricted', 'research', 'reportage'):
    allowed.update(Path(name) / p.relative_to(ROOT / 'web' / name) for p in (ROOT / 'web' / name).rglob('*') if p.is_file() and 'tests' not in p.relative_to(ROOT / 'web' / name).parts)
actual = {p.relative_to(out) for p in out.rglob('*') if p.is_file()}
assert actual == allowed, f'Unexpected build payload: {actual ^ allowed}'
for p in out.rglob('*'):
    if not p.is_file() or p.suffix not in ('.html','.js','.css','.json','.svg'):
        continue
    text = p.read_text()
    assert not re.search(r'chatgpt\.site|git\.chatgpt|oaiusercontent\.com|/api/connector', text), f'Sites dependency: {p}'
    assert not re.search(r'-----BEGIN (?:RSA |EC )?PRIVATE KEY-----|"private_key"\s*:|gh[pousr]_[A-Za-z0-9]{20,}', text), f'Credential pattern: {p}'
    if p.suffix == '.html':
        for link in re.findall(r'(?:src|href)=["\']([^"\']+)', text):
            u = urlsplit(link)
            if u.scheme or u.netloc or not u.path:
                continue
            target = (out / unquote(u.path).lstrip('/')) if u.path.startswith('/') else (p.parent / unquote(u.path))
            assert target.resolve().is_relative_to(out.resolve()), f'Escaping local URL: {p}: {link}'
            assert target.exists(), f'Broken local URL: {p}: {link}'
print(f'PASS: {len(manifest["files"])} imported assets; unchanged non-navigation source; {len(actual)} public files; local links; no Sites host in build.')
