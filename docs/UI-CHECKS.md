# UI and deployment verification

Checked on 18 October 2026.

## Public landing page

- `/` now presents the platform; the dashboard Overview is `/overview`.
- Get started links to `/sign-in` for visitors and `/overview` for an existing session. Sign-in and sign-up both explicitly finish at `/overview`.
- Profile setup remains accessible from the dashboard without automatically redirecting new users away from Overview.
- Checked widths of 320, 390, 768, 1024, and 1440px: no horizontal document overflow or overflowing heading/paragraph text.
- Verified rounded CSS `clip-path` shapes, section anchors, completed GSAP reveals, and the existing-session Get started handoff in Chrome.
- Animations are scoped to the landing page, cleaned up on navigation, and disabled when reduced motion is preferred. Content is visible before animation JavaScript loads.
- Fresh account creation was not performed during QA.

## Automated checks

- Production standalone Next.js build passed.
- TypeScript checks for the web app and Convex passed.
- ESLint passed.
- Both seed tests passed: relational data/idempotency and preservation of existing records.
- `go test ./...` passed; the current Go packages contain no test files, so this confirms compilation.
- Docker Compose configuration validation and `git diff --check` passed.
- The standalone server returned HTTP 200 for the new SVG favicon and included SVG/Apple icon metadata.

## Browser checks

- Ten dashboard routes checked at 320, 768, 1024, and 1440px without horizontal document overflow.
- Loaded local business search checked at all four widths, including map markers, empty results, directions links, and pitch dialog.
- Bounty filters/search/reset, gig and forum dialogs, investor search/details, and B2B listing dialog checked.
- Shared popup forms keep scrolling inside their rounded boundaries at 320 × 560px. Escape closes dialogs.
- Overview artwork, real account profile fields, and desktop/mobile MCP shortcuts checked.
- MCP app selection, setup steps, configuration preview, and read-only server connection check verified. The deployed access-key query loads successfully.
- Production seed verified through live queries and the browser: bounty board and six community posts load. Seed includes 120 fictional records across listings, demo authors, directories, comments, applications, and reactions.

## Limits

- Docker Desktop's Linux engine was unavailable. Container images have not been built or run; the generated Next.js standalone server was run directly instead.
- QA did not publish, apply, upload files, create/revoke credentials, or edit the signed-in user's profile. Those account mutations were not exercised end to end.
- Sample opportunity saves/applications and directory pitch drafts remain local device activity, as labelled in the UI.
- Public hosting has not been provisioned. Follow [DEPLOYMENT.md](DEPLOYMENT.md) for host settings and required environment variables.
