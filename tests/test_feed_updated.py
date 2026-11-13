"""Run: python -m unittest discover -s tests -p 'test_feed_updated.py'."""
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import case_store


class FeedUpdatedTests(unittest.TestCase):
    def test_legacy_marker_preserves_historical_audit(self):
        manifest = {"top_level":"object", "records_key":"cases",
                    "passthrough":{"updated_at":"2026-11-06T23:38:52Z",
                    "audit_status":{"updated_at":"2026-10-10T11:32:58Z",
                                    "audited_records":383}}}
        stamp = "2026-11-12T23:00:00Z"
        result = case_store.compose(manifest, [], stamp)
        self.assertEqual(result["feed_updated_at"], stamp)
        self.assertEqual(result["updated_at"], stamp)
        self.assertEqual(result["audit_status"]["updated_at"], stamp)
        self.assertEqual(result["audit_status"]["last_full_audit_at"], "2026-10-10T11:32:58Z")
        self.assertEqual(result["audit_status"]["audited_records"], 383)
        self.assertEqual(manifest["passthrough"]["audit_status"]["updated_at"], "2026-10-10T11:32:58Z")

    def test_same_records_preserve_timestamp(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "cases.json"
            event = {"id":"A","event_date":"2026-11-11","publication_date":"2026-11-12"}
            stamp = "2026-11-12T23:00:00Z"
            output.write_text(json.dumps({"feed_updated_at":stamp,
                                          "cases":[case_store.enrich_temporal_fields(event)]}), encoding="utf-8")
            self.assertEqual(case_store.feed_timestamp(output, [event]), stamp)
            changed = {**event, "publication_date":"2026-11-13"}
            self.assertNotEqual(case_store.feed_timestamp(output, [changed]), stamp)

    def test_old_audit_never_becomes_feed_timestamp(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "cases.json"
            output.write_text(json.dumps({"audit_status":{"updated_at":"2026-10-10T11:32:58Z"},
                                          "cases":[]}), encoding="utf-8")
            self.assertNotEqual(case_store.feed_timestamp(output, []), "2026-10-10T11:32:58Z")


if __name__ == "__main__":
    unittest.main()
