# wildlife-trafficking-data

Public data layer for the **Illegal Wildlife Trafficking Global Observatory** / **Observatório Global de Tráfico de Animais**.

## Files

- `cases.json` — 91 validated case records, complete in PT/EN/ES, with reconciled source URLs and numeric geodata.
- `routes.json` — audited documented routes.
- `metadata.json` — migration/data status and canonical feed URLs.
- `schemas/case.schema.json` — case schema.
- `archives/` — lossless source snapshots used during migration.

## Migration status

**READY FOR CUTOVER.**

The 91-case dataset has completed source reconciliation, PT/EN/ES text parity, geodata/precision classification, route matching and aggregate/deduplication safeguards.

The live dashboard can now switch its case layer to:

`https://acarvalho-wcs.github.io/wildlife-trafficking-data/cases.json`

For backward compatibility, the documented-routes layer remains available at:

`https://acarvalho-wcs.github.io/wildlife-trafficking-reports/routes.json`

Canonical data base:

`https://acarvalho-wcs.github.io/wildlife-trafficking-data/`
