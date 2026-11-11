# Netlify Finance v45

Target: https://inspiring-paprenjak-0cfbca.netlify.app/

This is the Finance integration for the actually deployed AKB Life Hub (v43), not the separate Align Living/GitHub Pages app at the repository root.

The deployable working directory is ../akb-netlify-upgrade relative to the repository directory. Deployment uses the complete static bundle prepared as akb-netlify-finance-v45.zip, retaining the deployed app assets and original cloud configuration. Do not deploy the GitHub repository root over Netlify.

Review: host-integration.patch modifies the deployed v43 index.html, app.js and sw.js. Copy the budget*.js and budget.css files alongside them. Tests run from the deployed app directory. New code is included here without copying the existing app's financial seed values or cloud configuration into public Git history. The private XLSX and exported ledgers are never in this bundle or repository.

Finance opens from the existing Money tile. Previous Money tools and history are retained in a clearly separate drawer and retain their original shared state. Finance writes only akb-finance-v1, never the existing shared finance state or Fitness keys. Imports stay on device. Browser-local data does not synchronize across devices or browsers. JSON backup/restore transfers Finance manually.

The supplied workbook is detected by its Balance Sheet and Action Plan layout. Review the snapshot date and identify which generically named credit card is Visa; new Visa starts at $0. The importer reads budget allocations, fractional APRs and split-month payment amounts. First/second-half amounts use the 1st/16th as assumed planning dates. Mortgage is a debt, excluded from living costs to avoid double reservation. Forecast sheets are not payment records. Existing balances and history survive updated imports; changed statement balances must be reconciled. Matching uses normalized names. Missing budget categories remain until manually zeroed. APR changes are dated. Editing a split-month schedule replaces it with the chosen single recurring schedule.

Validation: budget calculation suite; synthetic and attached-workbook browser tests; the deployed app's Fitness/Home/follow-up/Learning regression suite; old-cache update and offline tests, including Finance. These run in isolated browser profiles with cloud requests disabled. The workflow geometry checks wait for layout after viewport resize. Private-workbook totals are compared in memory and never logged.

Deployment remains pending explicit approval. Keep the existing site URL; do not clear browser storage. Roll back by republishing the previously published Netlify deploy if necessary. No production data migration is performed.

## Multiple income sources (v45)

Add a named income source for each household pay stream (employment, partner pay, business, benefits). Each has its own anchor date, optional expected amount and recurrence: every N days, monthly on the chosen calendar day, twice monthly on the 1st/16th, or one planned date. Dates are entered by the user; no official benefit-payment dates are assumed. Pause/resume keeps history. The existing v44 schedule appears as Household pay until renamed or edited; no stored record is discarded.

Actual pay records keep a source ID and source-name snapshot. Different sources can be paid on the same date; duplicate source/date records are blocked. The next household payday across all active sources defines the default budget period. Expected future income never becomes spendable cash. Same-day actual pay is combined into a single replacement household allocation plan rather than repeating the full budget against each paycheck. Users can override the planning end date when there is no next known payday.

Tests cover same-day sources, deduplication, migration, month-end recurrence, one-off pay, pause/resume, backup round trips and live form interactions. v44 is currently deployed; v45 publishing awaits approval.
