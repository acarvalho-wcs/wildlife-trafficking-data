# wildlife-trafficking-data

Public data layer for the **Illegal Wildlife Trafficking Global Observatory** / **Observatório Global de Tráfico de Animais**.

## Files

- cases.json` — 110 validated case records, complete in PT/EN/ES, with reconciled source URLs and numeric geodata.
- `routes.json` — audited documented routes.
- `metadata.json` — migration/data status and canonical feed URLs.
- `schemas/case.schema.json` — case schema.
- `archives/` — lossless source snapshots used during migration.

## Migration status

**READY FOR CUTOVER.**

The 110-case dataset has completed source reconciliation, PT/EN/ES text parity, geodata/precision classification, route matching and aggregate/deduplication safeguards.

The live dashboard can now switch its case layer to:

`https://acarvalho-wcs.github.io/wildlife-trafficking-data/cases.json`

## Canonical documented routes

Route ingestion and the live MAP/GLOBE layer use the same source:

`https://acarvalho-wcs.github.io/wildlife-trafficking-data/routes.json`

Add documented routes only to this repository's `routes.json`. The copy under `wildlife-trafficking-reports/routes.json` is obsolete and is not a synchronized feed. Do not write new routes there or use it as a dashboard fallback.

For each ingestion batch, check for a documented origin/destination or partial segment; link the route unambiguously to its case using `event_match`, preferably `event_id`. Preserve multilingual evidence, original source URLs, endpoint precision, exclusions and network-context separation. Before confirming publication, verify the public route feed and the shared MAP/GLOBE selection. Cases with no documented movement must remain without inferred routes.

Canonical data base:

`https://acarvalho-wcs.github.io/wildlife-trafficking-data/`

## Quantity layer

From schema 1.2, each case includes structured lower-dashboard fields: `quantity_count`, `quantity_qualifier`, `quantity_kind`, `quantity_by_group`, `quantity_unassigned` and `quantity_note_pt`.

Only countable animals or wildlife items are numeric. Weights, volumes and packaging units are never converted into animal counts.

### Brazil 2026 batch

On 22 September 2026, 18 validated Brazilian cases were added with PT/EN/ES text, structured quantities, geodata, evidence-limited case context, source-image references where resolvable, and eight documented/attributed route records. Total case count: 110.


## Ingestion rule

Search windows such as 24 h, 48 h or 20 days are discovery windows only. Any validated wildlife event found during a sweep that is not already present in the canonical case store should be considered for inclusion regardless of the event date, publication date, missing event time or whether it falls outside the nominal search window. Deduplication, source validation and evidence limits still apply.

## Safe chat / GitHub ingestion

Add or update individual records under `cases/YYYY/MM/`. Do not replace the compiled `cases.json` or remove records from the manifest. The build validates the complete store before publishing the feed; a rejected batch leaves the last published feed intact.

Every record needs explicit boolean `aggregate_operation` and `exclude_from_totals`. Assess these controls before inclusion; do not infer them from a missing field. Also supply numeric coordinates and precision, original source URL, VALIDATED status, PT/EN/ES title/card/context, fauna groups, country, transport mode, and both dates (`null` when unknown). Missing translations or uncertain facts must be reviewed, never fabricated to pass validation.

Before publishing, run `python scripts/case_store.py validate --root cases`. Errors identify the case ID and missing/invalid field. After pushing, check that **Build canonical cases feed** succeeds and that `cases.json` has the expected IDs and count.
