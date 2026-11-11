"""Generate GitHub Pages files from web/ without touching canonical data."""
from pathlib import Path
import argparse
import subprocess
import shutil
ROOT = Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser()
p.add_argument('--check', action='store_true')
a = p.parse_args()
subprocess.run(['python3', str(ROOT/'scripts/build_site.py')], check=True)
subprocess.run(['python3', str(ROOT/'scripts/check_migration.py')], check=True)
for src in sorted((ROOT/'build/site').rglob('*')):
    if not src.is_file():
        continue
    relative = src.relative_to(ROOT/'build/site')
    assert relative.parts[0] not in {'cases','media','firebase','cases.json','routes.json','metadata.json','publications.json'}
    dst = ROOT/relative
    if a.check:
        assert dst.is_file() and dst.read_bytes() == src.read_bytes(), f'Regenerate publication: {relative}'
    else:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
print('Published frontend matches web/; canonical files untouched.')
