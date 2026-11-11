"""Run portable upstream integration tests against the migrated frontend."""
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='observatory-tests-') as tmp:
    work = Path(tmp)
    (work / 'dist').symlink_to(ROOT / 'web/observatory', target_is_directory=True)
    (work / 'scripts').symlink_to(ROOT / 'tests/legacy-observatory', target_is_directory=True)
    for script, args in [
        ('check-maplibre.cjs', []),
        ('check-globe.cjs', [ROOT / 'cases.json']),
        ('check-temporal-history.cjs', []),
        ('check-temporal.cjs', [ROOT / 'cases.json', ROOT / 'routes.json']),
    ]:
        subprocess.run(['node', '--max-old-space-size=512', str(work / 'scripts' / script), *map(str,args)], cwd=work, check=True, timeout=600)
