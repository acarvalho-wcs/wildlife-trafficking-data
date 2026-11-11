# Report-level authorization model (restricted area only)

The public HTML and GitHub Pages **must never contain report names, confidential report PDFs, investigative notes, or report access lists**.

## Authorization layers

1. Access to the restricted dashboard requires Firebase authentication, verified email, and an admin-managed `access/{uid}` document with `approved: true`.
2. Report navigation stays completely hidden until the current user has at least one valid grant with an accessible `intelligence_reports/{reportId}` document.
3. Each case-specific report/subsection is represented by an opaque report ID; permissions are independent. Administrators must grant `report_grants/{uid}/items/{reportId}` with `allowed: true`, using privileged server credentials (never browser or GitHub Pages).
4. Report metadata `intelligence_reports/{reportId}` must contain localized `title_pt`, `title_en`, `title_es` and optionally corresponding descriptions, but may be read only via matching grants. Non-granted names and counts must not be listed.
5. This frontend does not expose static report URLs, because direct public URLs would bypass Firestore rules. Any future PDF delivery requires an authenticated backend that re-checks the report-specific entitlement for **every download**, generates short-lived URLs where applicable, and logs access.

## Security prerequisites

- The `firestore.rules` changes MUST be deployed and tested with Firebase emulator before provisioning grants. Committing rules to GitHub does not automatically deploy them.
- Firebase client code cannot create grants or report metadata. Use a trusted server-side admin workflow with auditable logging.
- Revoke grants by changing `allowed` to false or deleting the grant document; the backend download route must check current permission even if the UI is already open.
- Role separation should be audited, and authorization should default to deny if network access, metadata, or rules are unavailable.
- Do not place classified reports, attachments, informant or investigative information into this public repository.

## Testing matrix

1. Unauthenticated: no access to report metadata or grants.
2. Verified but not dashboard-approved: no access to reports.
3. Dashboard-approved, no report grants: menu hidden and all report documents denied.
4. Approved, one grant: only that report card appears; opening other report ID is denied.
5. Revoked grant: metadata and file download become inaccessible.
6. PT/EN/ES and dark/light: only translated granted report cards are displayed.
