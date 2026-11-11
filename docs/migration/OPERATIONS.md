# Maintenance, staging and cutover

## Build and validation

```sh
python scripts/case_store.py validate --root cases
python scripts/build_site.py
python scripts/check_migration.py
node --test web/restricted/tests/restricted-period-export.test.mjs web/restricted/tests/explorer-viewport.test.mjs web/restricted/tests/scientific-format.test.mjs
node firebase/tests/graph-mail.test.cjs
```

`build/site` is the ONLY publish directory. Never deploy the repository root. The build copies the original HTML/JS/CSS and static assets without bundling or changing map algorithms. Canonical data continue to update through existing Actions; a frontend rebuild is not required for new cases/routes. Existing `cache: no-store`/refresh behavior is preserved. Netlify headers revalidate public assets and disable caching for restricted pages.

The `Validate independent Observatory` workflow builds a reviewable artifact without publishing. `Validate preserved Firebase authorization` runs the existing access tests against an isolated emulator project, never production. Historical test scripts in `tests/legacy-observatory` are retained for provenance; some refer to old Sites Git commits or a `dist/` working directory and are not all portable. They must not be represented as a passing CI gate without adaptation.

## Complete staging

All four WCS image destinations were authorized by the owner and restored. Continue with independent staging configuration below.

1. In the already-created Netlify project, link `acarvalho-wcs/wildlife-trafficking-data` to branch `migration/github-independent-20261111`, using the root `netlify.toml`. Retain team-only staging access. Do not link the existing live production sites or change DNS.
2. Alternatively, configure a narrowly scoped `NETLIFY_AUTH_TOKEN` in the GitHub `observatory-staging` environment and use the draft deployment workflow. Never paste secrets into chat or commit them. Workflow dispatch availability depends on GitHub's default-branch workflow registration; Git linking can deploy the migration branch without merging it into main.
3. Review Firebase's actually deployed rules/functions and authorized domains. Prepare an exact-origin addition for the chosen stable staging URL; obtain approval before changing production access infrastructure. Preserve existing GitHub origin and users.
4. Compare MAP/GLOBE, filters, quantities, dates, routes, methodology, publications, reports, research and journalism in PT/EN/ES against the original. Include desktop and mobile, dark/light, WebGL failure and slow/offline feed recovery.
5. Test anonymous, unverified, pending, approved, administrator and report-granted/revoked scenarios. Use a separate Firebase test project for write workflows or explicitly authorized test records. Do not approve real requests or send notification emails merely to test migration.
6. In a browser, block all `*.chatgpt.site` and Sites API/asset traffic. Exercise every page and download, export a sanitized network report, and confirm zero requests to Sites. Static scanning is necessary but not sufficient.

## Production approval gate

The migration is not accepted until browser parity, real authorization, report classification, external integrations, independent staging and zero-Sites runtime traffic have been demonstrated. Record exact source/deploy IDs and test results. Present that evidence to the owner and obtain explicit cutover approval. There is deliberately no automatic production deployment workflow in this branch.

After approval, connect the production host to the reviewed branch/commit with protected production environment approvals; choose and configure the final domain; verify Firebase exact origins and notification callback links; then release. Preserve old links via redirects where ownership permits. A `chatgpt.site` URL cannot remain the independent site's address if the old platform is removed. Keep the original project available until validation and separate deletion authorization.

## Rollback

Before cutover, the existing production system is the fallback and has not changed. After an approved release, revert only the application/configuration commit and redeploy the previously validated code as a new atomic deployment. Do not reset the entire repository to an older SHA: that could roll back newly ingested canonical data. Keep `cases/`, `cases.json`, `routes.json`, manifests and later data commits intact. Firebase rules, functions and domain changes require their own reviewed rollback plan; frontend rollback does not restore server permissions. Do not remove users or revoke integrations as part of application rollback.

## Source ownership after acceptance

Edit public UI in `web/observatory`, research in `web/research`, journalism in `web/reportage`, restricted UI in `web/restricted`, and trusted server code/rules in `firebase`. Content repos remain authoritative. Freeze/deprecate duplicate frontend maintenance in `nimf-site` only after acceptance, and update this inventory. Until then, concurrent edits in the original repositories must be reconciled before cutover.
