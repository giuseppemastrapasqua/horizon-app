# Attivazione alloggi e strategia di lancio

Routes: `/activation` and `/activation/[id]`. Only SUPER_ADMIN and MANAGER; detail reads and writes also require property MANAGER access. Owner navigation remains the approved five entries.

## Included

- Preparation checklist, assigned tasks and deadlines, channel-specific Italian/English drafts, existing property photos, manual publication verification, 3/7/14/30-day launch reviews.
- Saved versioned configuration per property and transactional audit snapshots. A stale edit is rejected rather than overwriting another operator's work.
- Daily proposals default from today's **Europe/Rome** calendar date through the same day two months later, inclusive. `23/10–23/12` contains 62 daily rows. The separate 60-day shortcut ends at start +59 days. Month-end dates clamp to the last day of the destination month. Maximum custom window: 93 rows.
- Configurable base occupancy, extra guests, floor/ceiling, minimum stay, channel effective commission and verified combined promotions, launch dates and explicit discount. Profiles identify new/established/relaunch; selecting a profile never silently enables discounts.
- Simulates actual nightly proposals over the selected stay, with cleaning deducted once. Booked/blocked/past dates are consultative only. No existing booking, rate plan, override, contract or report is changed.

## Economics and limits

Reference/floor/ceiling are final nightly amounts **including cleaning** for base occupancy, before channel markup. The launch reduction applies before the floor; occupancy supplements are then added. Per-channel list prices are reconstructed to preserve the intended after-channel revenue despite the configured promotion. List and final prices are displayed separately; discounts must be verified on the portal, including eligibility and stacking.

The simulator reuses `calculateFinanceFormula`: subtract OTA commission from gross, subtract cleaning once, calculate management on the remaining amount (including any additional VAT), then subtract other configured stay costs. The output is **before personal taxes**. No fixed cedolare-secca rate is assumed. Existing report-specific formula choices are not automatically inherited; operators must confirm the projection's settings and any contractual date changes. A monthly objective is an objective, not an occupancy or revenue forecast.

The existing daily engine supplies declared internal heuristics. Local/mock market data, unverified events, reviews and competitor prices do not become authoritative inputs. Confidence remains explicitly low. Calendar reductions require both calendar confirmations. Negative net proposals are highlighted and prevent a complete readiness result. This first version provides decision support, not guaranteed pricing performance.

Launch checkpoints are manual records, not scheduled notifications or automated market analytics. OTA publication and price distribution are manual until a verified integration exists. The "Verifica attivazione" button only evaluates readiness; it cannot publish.

## Deployment and verification

Apply `20261023110000_property_activation` to an **isolated preview database first**. Configure preview-only `DATABASE_URL` and run `npx prisma migrate deploy` there before opening the new routes. Never point preview migration tests at production. Generate Prisma Client before type checking/building. No migration has been applied by editing these files.

Checks: `npx tsc --noEmit`, focused financial/date/auth/action tests, ESLint, existing finance/daily regression suites. CI also applies all migrations to disposable PostgreSQL, compares schema drift, and round-trips activation configuration with audit and stale-write checks. Production release remains subject to review of the preview and explicit approval.
