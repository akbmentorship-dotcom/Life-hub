# Netlify Finance v47

Target: https://inspiring-paprenjak-0cfbca.netlify.app/

This is the Finance integration for the actually deployed AKB Life Hub (v43), not the separate Align Living/GitHub Pages app at the repository root.

The deployable working directory is ../akb-netlify-upgrade relative to the repository directory. Deployment uses the complete static bundle prepared as akb-netlify-finance-v47.zip, retaining the deployed app assets and original cloud configuration. Do not deploy the GitHub repository root over Netlify.

Review: host-integration.patch modifies the deployed v43 index.html, app.js and sw.js. Copy the budget*.js and budget.css files alongside them. Tests run from the deployed app directory. New code is included here without copying the existing app's financial seed values or cloud configuration into public Git history. The private XLSX and exported ledgers are never in this bundle or repository.

Finance opens from the existing Money tile. Previous Money tools and history are retained in a clearly separate drawer and retain their original shared state. Finance writes only akb-finance-v1, never the existing shared finance state or Fitness keys. Imports stay on device. Browser-local data does not synchronize across devices or browsers. JSON backup/restore transfers Finance manually.

The supplied workbook is detected by its Balance Sheet and Action Plan layout. Review the snapshot date and identify which generically named credit card is Visa; new Visa starts at $0. The importer reads budget allocations, fractional APRs and split-month payment amounts. First/second-half amounts use the 1st/16th as assumed planning dates. Mortgage is a debt, excluded from living costs to avoid double reservation. Forecast sheets are not payment records. Existing balances and history survive updated imports; changed statement balances must be reconciled. Matching uses normalized names. Missing budget categories remain until manually zeroed. APR changes are dated. Editing a split-month schedule replaces it with the chosen single recurring schedule.

Validation: budget calculation suite; synthetic and attached-workbook browser tests; the deployed app's Fitness/Home/follow-up/Learning regression suite; old-cache update and offline tests, including Finance. These run in isolated browser profiles with cloud requests disabled. The workflow geometry checks wait for layout after viewport resize. Private-workbook totals are compared in memory and never logged.

Deployment remains pending explicit approval. Keep the existing site URL; do not clear browser storage. Roll back by republishing the previously published Netlify deploy if necessary. No production data migration is performed.

## Multiple income sources (v45)

Add a named income source for each household pay stream (employment, partner pay, business, benefits). Each has its own anchor date, optional expected amount and recurrence: every N days, monthly on the chosen calendar day, twice monthly on the 1st/16th, or one planned date. Dates are entered by the user; no official benefit-payment dates are assumed. Pause/resume keeps history. The existing v44 schedule appears as Household pay until renamed or edited; no stored record is discarded.

Actual pay records keep a source ID and source-name snapshot. Different sources can be paid on the same date; duplicate source/date records are blocked. The next household payday across all active sources defines the default budget period. Expected future income never becomes spendable cash. Same-day actual pay is combined into a single replacement household allocation plan rather than repeating the full budget against each paycheck. Users can override the planning end date when there is no next known payday.

Tests cover same-day sources, deduplication, migration, month-end recurrence, one-off pay, pause/resume, backup round trips and live form interactions. v46 was published with explicit approval. This v47 update is pending approval.

## What If goal dates (v46)

The new What If section compares current and scenario dates for every workbook debt, the total debt-free date, and one selected savings goal. Users supply the current monthly surplus after living costs and scheduled debt payments, the debt/savings split, and optional savings-goal amounts. Existing non-debt goals from previous Money tools can be copied into assumptions without modifying those goals.

Decisions support more/less take-home income, more/less monthly spending, a different debt/savings split or priority, one-time debt/savings contributions, and a one-time withdrawal from the savings goal. Changes can start today or in the future. Comparisons report days earlier/later, projected interest, desired savings date checks, cash shortfalls, and unavailable dates when a goal is not reached within 50 years. A savings withdrawal must be funded; unfunded withdrawals do not receive optimistic completion dates.

Calculations are pure: no payments, balances, income schedules or actual goals are changed. Up to 20 named scenarios save only assumptions in the Finance backup. Reopening a scenario recalculates against current projected balances and rebases a past start date to today. Monthly allocations use today's day of month; scheduled debt payments retain their real configured recurrence. Freed debt payments roll to the remaining debt and then the selected savings goal. This is a goal-timing model, not a bank cash-flow schedule; lender-specific compounding, future rate changes, fees and new borrowing are excluded. Expected income is never automatically counted as available cash.

Validation adds deterministic debt/savings dates, financial tradeoffs, future decisions, interest, rollover, one-time withdrawals, shortfalls, unreachable goals, immutability and saved-scenario restore checks. Mobile UI tests verify comparison, save/reload, safe goal text, and widths down to 320px. The complete v46 ZIP includes the multiple-payday work from v45. Production is v46. v47 publishing requires explicit approval.

## Guided pay rules and next focus (v47)

Finance opens with one next-focus card. The total and full debt list are in a collapsed disclosure. Household payday tools are collapsed until needed. A focus shows remaining amount, progress, next scheduled payment and either an entered payoff deadline or a scheduled-payment forecast. Full account/statement details and settings are expandable.

Dated debt portions take priority, earliest deadline first; once cleared, focus advances automatically. General debt priorities remain highest APR or smallest balance. An optional general-debt pin cannot hide an outstanding dated milestone. Milestone amounts are portions of a debt and never increase total debt. Payday allocations reserve budget and scheduled payments first, then fund dated portions, then normal extra debt payments. What If uses the same dated-portion ordering. The target pace divides remaining principal by distinct active household pay dates up to the deadline plus today; it includes minimums and is an estimate rather than a guarantee. Expected income is never available cash.

Multiple promotions may share an account and even a deadline. Their remaining amounts are snapshots; later recorded payments reduce them in earliest-deadline order as an explicit estimate. Previously counted payments are excluded by ID; re-entered snapshots do not double-count them. Account reconciliation caps estimated milestone portions but cannot prove lender allocation. Confirm actual promotion balances, rates, deferred-interest terms and processing times with the lender. No penalty or deferred-interest amount is inferred. Deadline lists can be edited/retired without deleting transactions.

Guided income setup supports weekly, every two weeks, N-day intervals, chosen monthly date/last day, custom twice-monthly dates, ordinal/last weekday, Nth-last business day and one planned irregular date. Business days exclude weekends and payer-entered closure dates; no regional holiday calendar is assumed. Users choose keep/earlier/later handling and can move individual scheduled dates without shifting the recurrence. The editor previews upcoming dates before saving, and preserves IDs, expected amounts and pay history on edits.

A private JSON setup import previews source/debt matching. It updates selected schedules and milestone snapshots only, preserving account balances, payment/reconciliation history, budgets, scenarios and unrelated storage. Users can skip items and must map milestones to existing debts. Reapplying the same setup does not add transactions. Unselected old schedules remain and may be paused by the user. The user's personal schedule and photographed promotion values are held in an uncommitted private file, excluded from both the deployment ZIP and GitHub. The release does not ship personal defaults.

Tests cover month ends and leap years, weekday and business-day rules, closure/weekend adjustments across month boundaries, specific date moves, old-state compatibility, focus progression, milestone snapshots and caps, deadline allocation and simulation consistency, reviewed setup preservation, responsive mobile forms and backup validation. Existing Home/Fitness/Learning/follow-up flows and offline cache upgrades are checked.
