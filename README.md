# wildlife-trafficking-data

Public data layer for the **Illegal Wildlife Trafficking Global Observatory** / **Observatório Global de Tráfico de Animais**.

## Files

- `cases.json` — case records. **Currently a staging migration feed; do not use for dashboard cutover yet.**
- `routes.json` — audited documented routes.
- `metadata.json` — migration/data status.
- `schemas/case.schema.json` — case schema.
- `archives/` — lossless source snapshots used during migration.

## Migration status

The current dashboard remains the production source while the existing case base is reconciled into GitHub. Cutover should occur only after coordinates, original source URLs and PT/EN/ES fields have been checked and the rendered dashboard matches the current public site.

Public base: https://acarvalho-wcs.github.io/wildlife-trafficking-data/
