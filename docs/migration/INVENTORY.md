# Observatory migration inventory — 11 November 2026

Status: source migration prepared in an isolated branch; NOT approved for production cutover.

**Logo upload resolved:** the owner explicitly authorized both WCS logos on 11 November 2026. All four destination assets are now included; no logo substitution was made.

## Verified source baseline

The exact source commits and SHA-256 of each imported frontend asset are in `source-manifest.json`. The Observatory source HEAD matches saved Sites version 95 (`05916d1fe3d1f2384dce73d6fff7b225e606f48e`). Sources were recovered from the three Sites Git repositories, not recreated from screenshots or JSON feeds. All three applications are static HTML/CSS/JavaScript. No framework conversion is required.

Destination base: `47097819901d5d2178af17430102f4730bceb06d`. At this snapshot the canonical feed contains 1,609 cases and 366 routes. These are a dated baseline, not fixed future counts. The existing README's 110-case statement describes an old data migration and does not certify application migration.

| Component | Existing source/runtime | Migrated source | Remaining verification |
|---|---|---|---|
| Dashboard, events, species, sources, filters, search, cards, CSV, PT/EN/ES | Observatory Sites static dist | `web/observatory/` | Browser and visual comparison |
| MAP, GLOBE, CARTO styles, route arrows/symbols, polar exceptions | Original JS/CSS in Sites | Same files, byte-identical | Real WebGL and mobile rendering |
| Temporal comparisons and growth history | Original JS; GitHub history API | Same files, byte-identical | Browser parity and API availability |
| Methodology and publications pages | Sites static pages/assets | `web/observatory/` | Navigation/UI parity |
| Research repository UI | Separate wildlife-research Site | `web/research/` | PT/EN/ES and live papers feed |
| Journalism repository UI | Separate fauna-reportagens Site | `web/reportage/` | PT/EN/ES and live news feed |
| Restricted login, registration, permissions UI | `acarvalho-wcs/nimf-site` | `web/restricted/` | Real authorized-user testing on staging |
| Explorer, advertisements, platforms, fairs, physical vendors, intake, contributions, history, Aurum map points, exports | `nimf-site` + Firestore | Original frontend modules | Role-by-role workflow testing without production writes |
| Firebase configuration | Public web app identifiers | `web/restricted/firebase-config.js` | Authorized domains; deployed settings audit |
| Firestore/Storage access rules | `nimf-site` versioned rules | `firebase/firestore.rules`, `firebase/storage.rules` | Compare with rules actually deployed |
| Approval, access notification and protected report delivery | Firebase Cloud Functions | `firebase/functions/` | Deployed versions, secrets availability, exact-origin CORS |
| Internal report catalog | Public reports repo plus separately authorized report metadata | Existing integrations preserved | Classification of every report; effective file access |
| Canonical cases, routes and validation | Existing destination repo | Unmodified | Existing Actions remain authoritative |

## External dependencies intentionally retained

- Firebase project `fir-console-61443`: Authentication, Firestore, Storage and Cloud Functions. No users, grants or private documents were exported or copied. Browser Firebase configuration is public application identification, not an Admin SDK credential.
- `wildlife-trafficking-data`: `cases/`, manifest, compiled `cases.json`, `routes.json`, `publications.json`, schemas and ingestion workflows.
- `wildlife-trafficking-reports`: report catalogs and existing public documents. Its routes copy remains obsolete and is not introduced as a fallback.
- `wildlife-trafficking-research/main/papers.json` and `wildlife-trafficking-news/main/news.json`: retained public collections.
- Private report delivery references an existing private GitHub repository through a server-side secret. No private repository contents or secret values were copied.
- Firebase Functions' Microsoft Graph notification integration remains server-side. No notifications were triggered.
- Leaflet, MapLibre 5.10.0, CARTO/OpenStreetMap, Google Analytics, scientific/source sites and source photograph URLs retain their existing behavior.

The Observatory Sites runtime query returned no environment entries and no D1 bindings/tables. This is evidence for that Site only, not a Firebase audit. No custom domains were registered. The current public URL is under `chatgpt.site`; that provider-owned hostname cannot be assumed portable to independent hosting.

## Access classification and production blockers

The public reports repository contains files under `reports/internal/`, and the restricted frontend downloads part of its catalog directly from public GitHub URLs. The catalog does not supply an authoritative access classification. A restricted menu cannot protect those public files. No PDFs were replicated into this migration; no existing files were removed or made private without approval. Document owners must identify which reports can remain public. Documents requiring confidentiality need authenticated storage/download delivery, and prior public history/exposure needs a separate remediation decision.

Versioned Firestore rules require verified accounts and an approved access document. They implement administrative checks and separate report grants. Versioned functions verify Firebase ID tokens server-side. This does NOT prove the same rules/functions are deployed. The existing generic private report endpoint authorizes approved users for its fixed report; report-specific grants are a distinct model and must be tested separately.

Current function CORS permits `https://acarvalho-wcs.github.io`. Netlify staging therefore requires an exact staging origin to be authorized, plus Firebase Authentication authorized-domain review. Do not widen to all origins or disable checks. These production-affecting configuration changes have not been applied.

## Destination decision

| Option | Fit | Constraint |
|---|---|---|
| GitHub Pages + existing Firebase | Supports the static applications; same GitHub origin already allowed by functions | Staging must not replace canonical feed publishing; limited headers/control |
| Netlify + existing Firebase | Static build, separate staging, explicit cache headers, Git-based deploys | Requires Git connection/deploy credential and exact Firebase origin configuration |
| Cloudflare Pages + existing Firebase | Technically compatible with static output | No configured connection was available; adds onboarding work without a runtime benefit |

Netlify is the proposed staging host, keeping Firebase intact. An isolated project `iwt-observatory-staging` was created (ID `c3c10b88-1e65-4967-99b2-b8b26976c885`), with team-login protection reported by Netlify. It is not yet deployed. The connector lacks Git-link/upload operations, there is no local Netlify credential, and the browser panel requires sign-in. A project shell is not a functioning homologation environment.

## Deliberate migration changes

Only inter-application navigation URLs and the corresponding analytics URL recognition changed in the imported frontend. `source-manifest.json` enumerates those six files. Seven PNG assets had non-rendering metadata removed after visual inspection and public-upload review; decoded RGBA pixels and color-profile chunks were preserved. All remaining imported frontend assets retain exact source hashes. New build tooling publishes only these frontend assets, excluding backend code, rules, tests, repository history and data inventories. Runtime continues to read the existing canonical feeds, so no parallel data store is created.

No DNS, live Sites publication, Firebase configuration, user permission, production data, canonical feed or existing workflow has been changed.
