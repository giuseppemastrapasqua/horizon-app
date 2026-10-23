# La mia attività — contabilità forfettaria

Route `/business-accounting?year=2026`. SUPER_ADMIN only, each authenticated user sees and writes only their own annual ledger. OWNER navigation remains unchanged. Annual configuration stored in BusinessAccounting with a user/year unique constraint, optimistic version and atomic audit snapshot. No owner reports, contractual fees or invoice logic changed.

## Automatic document sources

The page now loads sources directly on every visit and Refresh from Horizon. No imports or copied movement rows are persisted, so source edits update totals and cannot accumulate duplicate ledger entries. Uses referenceMonth for invoices and owner reports; checkout month for collaborator cleaning costs.

- Compensation: current non-archived COMMISSION_INVOICE documents, snapshot commission.taxableBase; VAT and invoice total displayed separately. Drafts are included because these are generated-document totals and are explicitly subtotaled. Not proof of cash receipt. Archived documents and version history are excluded. Duplicate property/month documents use the most recently updated document and raise a warning.
- Portfolio gross and owner settlements: saved FinanceReport grossRevenue and finalAmount plus adjustments. Owner OTA/F24/cleaning from saved per-booking breakdown snapshots; legacy fallback only to saved rule categories, never recalculation with current rates. Missing/malformed values are shown as incomplete and suspend the overall net tile. Missing invoices also produce warnings. Non-EUR documents are excluded with a visible warning.
- Collaborators: the repo currently has no separate saved collaborator settlement model. /reports/cleaning derives one cleaning per qualifying checkout at current property.cleaningCost, excluding pending/cancelled bookings. Automatic business accounting uses exactly that same source/criteria, once per stay regardless of operator assignment. Clearly labeled expected cost, not proof of execution/payment.

User operational margin = invoice compensation excluding VAT minus expected collaborator costs minus optional additional activity expenses. Portfolio OTA/F24 are contextual totals, not a second deduction from compensation, nor the operator’s own tax payments. Cleaning charged on owner reports is displayed independently to make cost coverage inspectable. Source invoices with VAT raise an alert because the supplied fiscal profile is flat-rate.

Tax and INPS projections remain subject to confirmed annual settings; generated invoices are a document-based simulation, not cash-basis filing data. No fabricated receipt dates or inferred F24 execution. The original manual own-income rows remain saved/visible but are excluded from automatic calculations to avoid duplication. Optional extra expense, own INPS and own tax movements remain available; users must not reenter source costs.

## Optional adjustments and calculations

The optional supplemental cash ledger does not infer payments from invoices or reports. Positive amounts, explicit movement direction/type, payment/due date, paid status, category, document/property reference. Edits and reversible archival require Save; server audit retains the prior saved versions. CSV exports the current filtered register, including unsaved edits if present.

In the supplemental ledger, income means own taxable receipts explicitly classified by the administrator, not total OTA payouts; legacy manual income is not included in the automatic overview. Third-party funds and personal contributions/withdrawals affect cash only. Their legal classification depends on the actual mandate and invoices: no automatic blanket exclusion of OTA receipts.

Default profile supplied by user: ATECO 55.20.42, substitute tax 15%, Gestione Separata. Proposed coefficient 40% is editable and requires annual confirmation of applicability; pension classification and annual INPS estimate must be confirmed independently. There is no guessed INPS rate or assumption that ATECO implies a pension scheme.

All amounts stored/calculated as integer EUR cents. Taxable base = max(0, paid own income × coefficient − actually paid mandatory contributions explicitly marked deductible). Costs reduce actual profit, not the flat-rate base. Net estimate = own paid income − actual paid costs − annual INPS estimate entered − current-year tax estimate. Actual tax/INPS payments affect cash; amounts allocated to current fiscal year reduce corresponding reserves, never net a second time. Prior-year payments remain visible. Available cash = recorded balance − positive remaining third-party funds − residual current-year tax/INPS reserves. Not a bank reconciliation or a full future F24 forecast; unpaid expenses shown separately.

The automatic monthly table shows source document totals; optional movements use cash dates. No monthly fiscal assessment is invented. No automatic carry-forward of opening balances. Previous-year tax debts and next-year advances not entered in the register are not projected. Null INPS is distinct from explicitly entered zero. Fiscal/net estimates disabled until confirmed; flat-rate calculation disabled above 100k recorded income; alert above 85k. These alerts do not certify all eligibility requirements. Multi-ATECO, ordinary VAT and regime-exit tax calculation are outside this profile.

## Sources checked 23 October 2026

- ISTAT ATECO 2025: https://www.istat.it/wp-content/uploads/2025/03/Struttura-ATECO-2025-italiano.pdf
- Agenzia Entrate flat-rate rules: https://www.agenziaentrate.gov.it/portale/regime-forfetario-le-regole-2020-/infogen-regime-forfetario-le-regole-2020-
- MEF coefficient table: https://def.finanze.it/DocTribFrontend/getPrassiDetail.do?id=%7BD4140375-DB3C-41E3-8FED-87B81B871C3D%7D
- Legislative decree 81/2025 art.1 (transitional ATECO mapping): https://www.normattiva.it/eli/id/2025/06/12/25G00090/CONSOLIDATED/20260330
- INPS 2026: https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.gestione-separata-le-aliquote-contributive-per-il-2026.html

## Deployment

Migration: prisma/migrations/20261023140000_business_accounting/migration.sql. Build only generates Prisma client; it does not apply migrations. Test migrations on isolated PostgreSQL via CI before production. Preview database horizon_v1_preview had no Prisma migration ledger as of this session; PropertyActivation was previously applied directly. Do not blindly run all historical migrations there: baseline/reconcile first. Missing BusinessAccounting table shows a setup message instead of breaking the page. Production remains unchanged until release.

## Verification

`npx tsc --noEmit`
`npx vitest run lib/business-accounting app/business-accounting/actions.test.ts`
`npx eslint app/business-accounting lib/business-accounting`
`npm run build`

Manual preview QA: login as admin, configure fiscal settings/INPS, add an income/cost/third-party receipt and prior-year tax payment; save/reload; check expected net/cash and annual isolation; edit/archive/restore; CSV; confirm other roles cannot enter.

Automatic-source verification: aggregation and no repeated OTA/F24 deduction, invoice VAT separation, saved booking snapshots, legacy category completeness, duplicate invoices, admin-only loading, annual source criteria, and one collaborator cleaning cost per booking. The automatic page requires authenticated preview QA with representative saved documents.
