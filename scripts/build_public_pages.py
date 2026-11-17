"""Package ONLY public Observatory UI and approved JSON feeds for GitHub Pages."""
from pathlib import Path
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'build/site'
OUT = ROOT / 'build/public-pages'
if not SRC.is_dir():
    raise SystemExit('Run python scripts/build_site.py before packaging')
if OUT.exists():
    shutil.rmtree(OUT)
shutil.copytree(SRC, OUT)
feeds = ('cases.json','routes.json','publications.json','papers.json',
         'news.json','reports-weekly.json','reports-semiannual.json',
         'reports-annual.json','reports-institutional.json')
for name in feeds:
    src = ROOT / name
    if not src.is_file():
        raise SystemExit('Required public feed missing: '+name)
    json.loads(src.read_text())
    shutil.copy2(src, OUT/name)
# Published case images are an expressly public image directory (no private records).
media = ROOT / 'media'
if media.is_dir():
    shutil.copytree(media, OUT/'media')
(OUT / '.nojekyll').touch()
files = [f.relative_to(OUT).as_posix() for f in OUT.rglob('*') if f.is_file()]
for name in files:
    if name.startswith(('.github/', 'firebase/', 'docs/', 'scripts/', 'cases/',
                        'reports/internal/', 'audits/', 'triage/', 'imports/',
                        'pending_imports/', 'batches/', 'tmp/', 'archives/')):
        raise SystemExit('Forbidden path in GitHub Pages artifact: '+name)
    if name == 'reports-internal.json':
        raise SystemExit('Restricted report catalog must never be public')
print('PASS curated Pages artifact: %d files, %d bytes. No source, backend, or internal report catalog.' %
      (len(files), sum((OUT/f).stat().st_size for f in files)))
