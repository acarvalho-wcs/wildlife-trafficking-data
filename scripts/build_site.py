"""Build only audited frontend assets; never publish repository root or Firebase files."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'build/site'
if OUT.exists():
    shutil.rmtree(OUT)
shutil.copytree(ROOT / 'web/observatory', OUT)
for name in ('restricted', 'research', 'reportage'):
    shutil.copytree(ROOT / 'web' / name, OUT / name, ignore=shutil.ignore_patterns('tests'))
print(f'Built {sum(p.is_file() for p in OUT.rglob("*"))} files in {OUT}')
