import json, unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from case_store import validate_new_case_localization,CARD_PRESENTATION_FIELDS,CARD_LANGUAGES
class TestLocale(unittest.TestCase):
 def setUp(self):
  self.tmp=TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
  self.base=Path(self.tmp.name)/"baseline.json"
  self.base.write_text(json.dumps({"baseline_case_count":1,"legacy_paths":["2026/01/older.json"]}))
  self.record={"id":"new","localization_schema_version":1}
  for stem in CARD_PRESENTATION_FIELDS:
   for lang in CARD_LANGUAGES:self.record[f"{stem}_{lang}"]=f"Translated {stem} {lang}"
 def check(self,record,path="2026/11/new.json"):
  return validate_new_case_localization([record],[path],self.base)
 def test_complete(self):self.assertEqual([],self.check(self.record))
 def test_missing_schema(self):
  r=dict(self.record);r.pop("localization_schema_version");self.assertTrue(self.check(r))
 def test_missing_english(self):
  r=dict(self.record);r.pop("fauna_label_en");self.assertTrue(any("fauna_label_en" in v for v in self.check(r)))
 def test_missing_spanish(self):
  r=dict(self.record);r["modal_label_es"]=" ";self.assertTrue(any("modal_label_es" in v for v in self.check(r)))
 def test_existing_not_changed(self):self.assertEqual([],self.check({"id":"old"},"2026/01/older.json"))
if __name__=="__main__":unittest.main()
