# GitHub-only maintenance and publication

The owner's chosen destination is GitHub Pages, with existing Firebase Authentication, Firestore, Storage and Cloud Functions retained. No new hosting provider is part of this migration.

## Validation

```sh
python scripts/case_store.py validate --root cases
python scripts/build_site.py
python scripts/check_migration.py
python scripts/test_site.py
```

Frontend source is under `web/`; trusted backend source and rules are under `firebase/`. Never publish the repository root or private records. The canonical store and its existing build workflow remain unchanged. The original runtime feed refresh/cache behavior remains unchanged. GitHub Pages does not provide the custom response-header configuration of other hosts; do not claim server `no-store` headers have been configured there.

## Pages preparation

`prepare-pages.yml` produces an artifact only. It builds the original frontend under `migration-preview/`, and copies the currently validated public cases/routes feeds and associated public assets to their existing paths. A separate checkout of main supplies these feeds to avoid publishing stale data from the migration branch. It neither compiles nor writes back canonical records. Firebase functions and rules are never copied into the artifact.

The existing Pages workflow publishes main from the repository root (verified in build logs). Homologation was published additively under migration-preview/ at commit 0b34710811616fe807ee5e05fa0623c919874f93, from application source fb9f7c9dfc6f03b1c3665c7e46255a88c6930b46. Every pre-existing main path remains unchanged. Do not replace this whole publication with a frontend-only artifact. The production switch still requires explicit owner approval. Until the source PR is merged, maintain frontend changes on the migration branch and regenerate the preview from that exact source; do not hand-edit generated preview assets.

## Acceptance pending

Test the independent Pages publication against the original in PT/EN/ES, desktop/mobile, MAP/GLOBE, routes, quantities, filters, reports and all restricted workflows. Check deployed Firebase rules and test real authorized users. The Pages hostname keeps the existing GitHub origin; do not change CORS or access rules unnecessarily. Block Sites hosts during runtime testing and verify no dependencies. Review which internal reports may remain publicly downloadable.

## Rollback

Before cutover, production remains unchanged. After approval and publication, revert only application/configuration changes and republish the last validated interface. Preserve all later canonical cases/routes commits. Backend permission changes require their own reviewed rollback; a frontend revert does not restore backend rules. Keep the original Sites project until independent validation and separate deletion authorization.
