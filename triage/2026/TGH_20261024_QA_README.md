# TG-H 2026 — Readiness audit for 25 October 2026

**Countries:** Peru, Colombia, Ecuador and Bolivia. **Event scope:** 1 Jan to 24 Oct 2026; historical publication-only items require exclusion. **Status:** 38 prepared TRILINGUAL drafts, all **NOT PUBLISHED**.

## File inventory

- `prepared_cards_20261024_part1.json` — 7 cases
- `prepared_cards_20261024_part2.json` — 7 cases
- `prepared_cards_20261024_part3.json` — 9 cases
- `prepared_cards_20261024_part4.json` — 10 cases
- `prepared_cards_20261024_part5.json` — 5 cases
- `TGH_20261024_PREPARATION_MANIFEST.json` — per-record status and source file

**38 drafts:** Peru 9, Colombia 18, Ecuador 3, Bolivia 8. PT, EN and ES fields verified present in every draft; no duplicate draft IDs. Nine records have case-specific scientific [S] contextualization with DOI, in all three languages. No exact source URL or ID collisions in the canonical 1,211-record snapshot (blob `d2bff70a45eac0bb63dcf228bbc3a9892901d5b3`), but semantic/locality/date dedup is still required. The source snapshot is dated 10 October 2026, so this absence is **not** proof that more recent records are missing from the current live dashboard.

## Stop-the-line issues

1. **Green Shield, Montería, July 22:** Official police headline says 22 animals, but 10 categories sum to 23. **HOLD** until source reconciliation; do not publish either as exact, and prevent double counting with Green Shield II. Source: https://oas.policia.gov.co/noticia/operacion-green-shield-permitio-recuperacion-22-ejemplares-fauna-silvestre-en-monteria
2. **Bogotá university (Aug 2):** University disputes police description of preventive seizure and describes coordinated voluntary handover. **HOLD** outside proven trafficking until resolved. Source: https://cambiocolombia.com/medio-ambiente/articulo/2026/8/hallan-23-animales-silvestres-en-universidad-en-bogota-incautan-15-boas-y-8-tortugas-por-irregularidades-en-su-tenencia
3. **Machalilla Ecuador (Sep 11):** Illegal fishing within a protected area, not an established wildlife-trafficking shipment. **HOLD for Observatory scope**; record products by pounds, not animals. Source: https://noticias.policia.gob.ec/policia-nacional-del-ecuador-aprehendio-a-seis-sujetos-por-el-presunto-delito-contra-la-flora-y-fauna/
4. **Ecuador May 25:** Report pools four interventions across three provinces, 15 live animals plus three mammal heads. Do not map as a single point or sum heads as live animals.
5. **Colombia multi-site cases:** Bogotá (Feb 25, four districts), Cundinamarca/Gualivá (June 1, four municipalities; one voluntary surrender) and Escudo Silvestre (July 27, two municipalities) require split or explicitly aggregate flag with excluded totals for any child cases.
6. **Tomasiri Peru (June, report Sep 17):** Date of event known only to month. `event_date=null`, `event_date_precision=month`, `event_month=2026-06`. Do not put 17 September as event date. Destination Tacna documented, source city unknown; future transfer to Iquitos is rehabilitation.
7. **Cali Colombia (June 12):** From Bahía Solano by completed air journey to Alfonso Bonilla Aragón airport; origin slaughter site unverified. Potential route segment supported. Cartagena May/June shipments to Dominican Republic were **attempted**, not completed; do not render as completed routes.
8. **Ecuador Santa Elena (July 24):** 549 organisms/items and additional 36 kg of coral fragments; no 549 live-animal claim.
9. **Bogotá Jan 15:** Seven native 'pericos bronceados' are wildlife. Separate headline about domestic animals contains internal arithmetic discrepancy; exclude domestic animals from wildlife totals.
10. **Bolivia El Alto Feb 8:** 58 turtles confirmed in local report, unknown species, two news sources. Do not use unspecified count.

## Scientific contextualization (not proof of involvement)

- Peru parrot supply/demand and markets: https://doi.org/10.1016/j.gecco.2022.e02161 and https://doi.org/10.1111/csp2.12936
- Peru *Psittacara* identification in Apurímac (2015-21), directly pertinent to Andahuaylas: https://doi.org/10.35626/sapientia.6.3.51
- Peru primate trade/household possession: https://doi.org/10.1002/ajp.22516
- Colombia seized parrots and rehabilitation: https://doi.org/10.59517/oc.e373
- Colombia small felid seizures (2015-21): https://doi.org/10.1016/j.biocon.2025.111639
- Colombia psittacine molecular identification: https://doi.org/10.1002/ece3.73335
- Global seahorse seizure reporting, relevant to Ecuador marine wildlife: https://doi.org/10.1111/cobi.70047

**Method:** Cite each source only where it materially illuminates a specific case. Prior studies DO NOT establish that people, supply routes or criminal networks in historical samples were involved in 2026 events.

## Morning publication gates

- Confirm the current (not 10 October snapshot) `cases.json` and `routes.json` state and commit hash before deduplication.
- Reconfirm source articles, event dates and exact localities. Mark [O] official, [N] journalism and [S] scientific; each claim must match the source.
- Validate species names (in italics) and false-friend translation risks (e.g. guagua = paca; paraba = macaw; ardilla = esquilo; babilla = caiman).
- Separate live and dead animals from eggs, feathers, meat (kg/lb), taxidermies and shell/coral parts.
- Review three languages independently; do not paste translated text into wrong language field.
- Deduplicate **semantically** on event, date, people, location, quantities and official operation; do not just compare URLs.
- Add route lines only if explicit origin/destination AND actual movement status are evidence-based.
- After approve, adapt staging records to the canonical `cases.json` schema and update totals and visualization in dashboard. Do not auto-publish this worklist.

**Overnight cycles should continue source review and literature enrichment, not recreate these same 38 cases.**
