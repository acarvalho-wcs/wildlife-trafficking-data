"""Prepare a Pages candidate without changing live publication or canonical records."""
from pathlib import Path
import argparse
import shutil
import json

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--data-root', required=True, type=Path)
args = parser.parse_args()
data = args.data_root.resolve()
out = ROOT / 'build/pages'
if out.exists():
    shutil.rmtree(out)
out.mkdir(parents=True)
shutil.copytree(ROOT / 'build/site', out / 'migration-preview')
for name in ('cases.json', 'routes.json', 'metadata.json', 'publications.json'):
    source = data / name
    json.loads(source.read_text())
    shutil.copy2(source, out / name)
for name in ('cases', 'media'):
    if (data / name).is_dir():
        shutil.copytree(data / name, out / name)
(out / '.nojekyll').touch()
assert not (out / 'firebase').exists()
assert not (out / 'migration-preview/firebase').exists()
print('Prepared Pages candidate: preview interface plus existing canonical feed paths. NOT DEPLOYED.')
