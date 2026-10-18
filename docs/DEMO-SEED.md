# Demo data plan

Target: `prod:intent-seahorse-820` (confirmed from the deploy key; the frontend URL points to the same deployment).

Production deployment and seed completed after explicit user approval on 18 October 2026. The seed inserted exactly 120 records; local tests confirm an immediate rerun adds zero duplicates.

## Prepared content

| Content | Records |
| --- | ---: |
| Bounties | 8 |
| Gig listings | 8 |
| Forum threads | 6 |
| Community posts | 6 |
| Sample opportunities | 6 |
| Investor/business directory entries | 6 |
| Fictional authors | 4 |
| Demo profile, onboarding, role, skills, and portfolio records | 28 |
| Demonstration applications/proposals | 16 |
| Comments | 12 |
| Reactions/votes | 20 |
| **Total** | **120** |

Public content is clearly labeled fictional demo content. Budget and reward values are illustrative. Existing accounts and records are preserved; the seed only creates or fills its own demo records. Personal activity is not fabricated for a real account. The business finder continues to use real place data.

`convex/seed.ts` exports an internal mutation, `seed:presentable`. Rerunning it does not duplicate its records. Tests check idempotency, relationship counters, and preservation of existing account data.

## Checks

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `node scripts/convex-demo.mjs check` (deployment dry run)

## Applying after explicit production approval

```powershell
node scripts/convex-demo.mjs deploy --confirm-production intent-seahorse-820
node scripts/convex-demo.mjs seed --confirm-production intent-seahorse-820
```

The wrapper reads the existing server environment file without printing its deploy key and verifies that the key and deployment URL name match. `deploy` activates the current Convex schema/functions, including the pending community and MCP functionality. `seed` inserts demo records. Both commands reject production writes unless the target name is explicitly supplied.
