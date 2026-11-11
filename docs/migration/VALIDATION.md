# Validation evidence — 11 November 2026

This report distinguishes source/emulator checks from live acceptance. It does not certify a production migration.

Results below apply to the complete local staging source. Four WCS image destinations are blocked from public upload by automatic approval review. Consequently, the GitHub draft cannot yet pass the complete asset/build check. Do not confuse local test success with a deployable remote branch.

| Check | Result | Scope |
|---|---|---|
| Canonical validator | PASS, 1,609 unique valid records | Existing data, no writes |
| Imported frontend manifest | PASS, 108 source assets; six declared navigation/analytics edits | Seven PNG metadata-only sanitizations; remaining imported frontend bytes preserved |
| Build boundary and local links | PASS, 108 published files | Backend/rules/tests/data snapshots excluded |
| Sites dependency scan | PASS | No Sites host/API/asset references in generated frontend; runtime network audit still required |
| JS syntax | PASS | All frontend and Firebase function JavaScript |
| Restricted date/export, explorer viewport, scientific formatting | PASS, 16 tests | Preserved unit tests |
| Microsoft Graph transport | PASS, mocked | No mail sent |
| Firestore emulator | PASS, 48 assertions | Isolated `demo-nimf-access-tests`; does not prove deployed rules |
| MapLibre view adapter | PASS | Mocked renderer, route direction/symbol behavior |
| GLOBE adapter | PASS | Shared filtering, coincident anchors, occlusion logic, languages, route gates |
| Temporal history | PASS | Manaus boundaries, historical baseline and clipping |
| Temporal integration | PASS | 1,609 cases, combined filters, quantities, A/B, MAP/GLOBE route selection, translations |
| Real browser/WebGL/visual parity | BLOCKED locally | Playwright browser download failed; installed Chromium cannot create required socket in executor |
| Real authenticated staging workflows | NOT RUN | No staging deploy or authenticated Firebase test session |
| Deployed Firebase rules/functions match | NOT VERIFIED | No Firebase administrative session available |
| Storage rules tests | NOT RUN | Firestore emulator does not test Storage |
| Public/internal report classification | PENDING | Public catalog is not an authoritative classification |

The map/globe/temporal tests ran against recovered original assets; hash checks establish that their corresponding migrated assets are identical. `scripts/test_site.py` also runs the portable upstream checks directly against `web/observatory` via a temporary test working directory. Historical scripts referencing unavailable Sites commit history remain preserved separately; they are not claimed as passing gates.

Before cutover, record independent staging URL, deployment ID, exact commit, authorized user scenarios, sanitized zero-Sites network evidence, screenshots at desktop/mobile widths, and the reviewed report-access classifications. No acceptance criterion should be marked complete based solely on the source inventory or this static scan.
