# Netlify Life Hub v61

Target: https://inspiring-paprenjak-0cfbca.netlify.app/

This is the Finance integration for the actually deployed AKB Life Hub (v43), not the separate Align Living/GitHub Pages app at the repository root.

The deployable working directory is ../akb-netlify-upgrade relative to the repository directory. Deployment uses the complete static bundle prepared as akb-netlify-finance-v61.zip, retaining the deployed app assets and original cloud configuration. Do not deploy the GitHub repository root over Netlify.

Review: host-integration.patch modifies the deployed v43 index.html, app.js and sw.js. Copy the budget*.js and budget.css files alongside them. Tests run from the deployed app directory. New code is included here without copying the existing app's financial seed values or cloud configuration into public Git history. The private XLSX and exported ledgers are never in this bundle or repository.

Finance opens from the existing Money tile. Previous Money tools and history are retained in a clearly separate drawer and retain their original shared state. Finance writes only akb-finance-v1, never the existing shared finance state or Fitness keys. Imports stay on device. Browser-local data does not synchronize across devices or browsers. JSON backup/restore transfers Finance manually.

The supplied workbook is detected by its Balance Sheet and Action Plan layout. Review the snapshot date and identify which generically named credit card is Visa; new Visa starts at $0. The importer reads budget allocations, fractional APRs and split-month payment amounts. First/second-half amounts use the 1st/16th as assumed planning dates. Mortgage is a debt, excluded from living costs to avoid double reservation. Forecast sheets are not payment records. Existing balances and history survive updated imports; changed statement balances must be reconciled. Matching uses normalized names. Missing budget categories remain until manually zeroed. APR changes are dated. Editing a split-month schedule replaces it with the chosen single recurring schedule.

Validation: budget calculation suite; synthetic and attached-workbook browser tests; the deployed app's Fitness/Home/follow-up/Learning regression suite; old-cache update and offline tests, including Finance. These run in isolated browser profiles with cloud requests disabled. The workflow geometry checks wait for layout after viewport resize. Private-workbook totals are compared in memory and never logged.

Deployment remains pending explicit approval. Keep the existing site URL; do not clear browser storage. Roll back by republishing the previously published Netlify deploy if necessary. No production data migration is performed.

## Multiple income sources (v45)

Add a named income source for each household pay stream (employment, partner pay, business, benefits). Each has its own anchor date, optional expected amount and recurrence: every N days, monthly on the chosen calendar day, twice monthly on the 1st/16th, or one planned date. Dates are entered by the user; no official benefit-payment dates are assumed. Pause/resume keeps history. The existing v44 schedule appears as Household pay until renamed or edited; no stored record is discarded.

Actual pay records keep a source ID and source-name snapshot. Different sources can be paid on the same date; duplicate source/date records are blocked. The next household payday across all active sources defines the default budget period. Expected future income never becomes spendable cash. Same-day actual pay is combined into a single replacement household allocation plan rather than repeating the full budget against each paycheck. Users can override the planning end date when there is no next known payday.

Tests cover same-day sources, deduplication, migration, month-end recurrence, one-off pay, pause/resume, backup round trips and live form interactions. v47 was published with explicit approval. This v50 update is pending approval.

## What If goal dates (v46)

The new What If section compares current and scenario dates for every workbook debt, the total debt-free date, and one selected savings goal. Users supply the current monthly surplus after living costs and scheduled debt payments, the debt/savings split, and optional savings-goal amounts. Existing non-debt goals from previous Money tools can be copied into assumptions without modifying those goals.

Decisions support more/less take-home income, more/less monthly spending, a different debt/savings split or priority, one-time debt/savings contributions, and a one-time withdrawal from the savings goal. Changes can start today or in the future. Comparisons report days earlier/later, projected interest, desired savings date checks, cash shortfalls, and unavailable dates when a goal is not reached within 50 years. A savings withdrawal must be funded; unfunded withdrawals do not receive optimistic completion dates.

Calculations are pure: no payments, balances, income schedules or actual goals are changed. Up to 20 named scenarios save only assumptions in the Finance backup. Reopening a scenario recalculates against current projected balances and rebases a past start date to today. Monthly allocations use today's day of month; scheduled debt payments retain their real configured recurrence. Freed debt payments roll to the remaining debt and then the selected savings goal. This is a goal-timing model, not a bank cash-flow schedule; lender-specific compounding, future rate changes, fees and new borrowing are excluded. Expected income is never automatically counted as available cash.

Validation adds deterministic debt/savings dates, financial tradeoffs, future decisions, interest, rollover, one-time withdrawals, shortfalls, unreachable goals, immutability and saved-scenario restore checks. Mobile UI tests verify comparison, save/reload, safe goal text, and widths down to 320px. The complete v46 ZIP includes the multiple-payday work from v45. Production is v47. v50 publishing requires explicit approval.

## Guided pay rules and next focus (v47)

Finance opens with one next-focus card. The total and full debt list are in a collapsed disclosure. Household payday tools are collapsed until needed. A focus shows remaining amount, progress, next scheduled payment and either an entered payoff deadline or a scheduled-payment forecast. Full account/statement details and settings are expandable.

Dated debt portions take priority, earliest deadline first; once cleared, focus advances automatically. General debt priorities remain highest APR or smallest balance. An optional general-debt pin cannot hide an outstanding dated milestone. Milestone amounts are portions of a debt and never increase total debt. Payday allocations reserve budget and scheduled payments first, then fund dated portions, then normal extra debt payments. What If uses the same dated-portion ordering. The target pace divides remaining principal by distinct active household pay dates up to the deadline plus today; it includes minimums and is an estimate rather than a guarantee. Expected income is never available cash.

Multiple promotions may share an account and even a deadline. Their remaining amounts are snapshots; later recorded payments reduce them in earliest-deadline order as an explicit estimate. Previously counted payments are excluded by ID; re-entered snapshots do not double-count them. Account reconciliation caps estimated milestone portions but cannot prove lender allocation. Confirm actual promotion balances, rates, deferred-interest terms and processing times with the lender. No penalty or deferred-interest amount is inferred. Deadline lists can be edited/retired without deleting transactions.

Guided income setup supports weekly, every two weeks, N-day intervals, chosen monthly date/last day, custom twice-monthly dates, ordinal/last weekday, Nth-last business day and one planned irregular date. Business days exclude weekends and payer-entered closure dates; no regional holiday calendar is assumed. Users choose keep/earlier/later handling and can move individual scheduled dates without shifting the recurrence. The editor previews upcoming dates before saving, and preserves IDs, expected amounts and pay history on edits.

A private JSON setup import previews source/debt matching. It updates selected schedules and milestone snapshots only, preserving account balances, payment/reconciliation history, budgets, scenarios and unrelated storage. Users can skip items and must map milestones to existing debts. Reapplying the same setup does not add transactions. Unselected old schedules remain and may be paused by the user. The user's personal schedule and photographed promotion values are held in an uncommitted private file, excluded from both the deployment ZIP and GitHub. The release does not ship personal defaults.

Tests cover month ends and leap years, weekday and business-day rules, closure/weekend adjustments across month boundaries, specific date moves, old-state compatibility, focus progression, milestone snapshots and caps, deadline allocation and simulation consistency, reviewed setup preservation, responsive mobile forms and backup validation. Existing Home/Fitness/Learning/follow-up flows and offline cache upgrades are checked.

## Household CFO check-in (v48, pending approval)

v47 is published. v48 adds an expandable 30-day CFO check-in below Next focus: expected income, scheduled obligations, upcoming calendar, dated payoff portions, missing schedule/amount/payment warnings, unconfirmed or aging lender snapshots and a weekly review note/date. Its difference is explicitly a plan, not a bank balance or safe-to-spend amount. Unknown income amounts withhold the planned difference. Completed receipts and matching debt payments are not reserved twice; payoff portions never increase total debt. Review completion does not confirm statements or create payments. Data remains in the existing Finance key and backup.

See FAMILY-CFO.md for the product direction, current gaps and open-source review. No third-party project code or new service/dependency is introduced by this release; the check-in reuses the existing Finance calculations.

## Focused decision impact (v49, supersedes unpublished v48)

Next focus links to a prominent Before we decide checker. Users save current monthly surplus, debt allocation and an optional savings goal once. A decision then needs a type and amount, plus purchase funding and optional name/date. Types cover one-time purchase, recurring cost/reduction, more/less monthly take-home and an extra debt payment from additional cash. The detailed What If form begins with the saved current-plan assumptions. The main debt forecast also uses the saved monthly plan, keeping the focus and quick comparison consistent.

Results lead with the next focus, then total debt-free and selected savings dates, interest through payoff when both forecasts complete, and individual milestone completion dates against entered requirements. A scenario can expose a newly missed promotion date. A purchase from extra money replaces one monthly allocation and must fit that source; savings withdrawals must be funded. Required debt minimums remain modeled. The checker does not prove cash availability or model a new loan, taxes, changing rates, lender fees or deferred-interest penalties.

Decision log entries are considering/chosen/passed assumptions with a reviewed date and baseline snapshot. They do not write real payments, change balances or apply choices to the budget. Each is compared independently; saved choices do not stack automatically. Update the current-plan assumptions as the real budget changes. Reopening recalculates against current balances/current plan and rebases a past date to today. Up to 100 entries are included in Finance backup/restore. State extensions remain optional for existing users.

Validation covers one-time allocation diversion, recurring changes, funded/unfunded sources, newly missed milestones, immutable actual data, restore validation, mobile quick entry and save/reload/recheck, detailed scenario regression, and offline inclusion of the new script. Production remains v47; v49 requires explicit publishing approval.

## Actual paycheque loop and real savings goals (v50)

v50 includes unpublished v48/v49 work. Enter actual received pay, preview and save its plan, then record what was actually done. The selected paycheque shows received, assigned and unassigned totals and a retained action history. Variable expected income is never available cash. Same-day sources share household recommendations but keep separate receipt caps. Planning end dates are saved on each receipt rather than drifting as later pay is entered. Take-home corrections retain from/to/date history and cannot reduce a receipt below assigned actions.

Actions include debt payments, reserved/paid budget money, actual goal contributions and a kept cash buffer. A reserved bill becomes paid in the same entry without assigning cash twice; releasing an earmark restores its receipt's unassigned amount. New debt actions create one linked payment. Existing payments may be attributed in portions across receipts without adding transactions or exceeding the original payment. Target-card payments can use the same funding linkage. Explicit due-date attribution discounts an instalment paid early from recommendations, forecasts and the CFO calendar.

Mistake corrections retain entries. Correcting a payment created by this workflow voids that tracker payment and recalculates balances. Correcting an attribution to a pre-existing payment only removes the receipt attribution, preserving that payment. These are tracker corrections, not bank reversals/refunds. Lender and savings statements remain authoritative snapshots; confirm balances if needed.

Real savings goals have opening snapshots, targets, optional desired dates and per-household-pay-date commitments. Actual contributions update recorded progress; dated goal confirmations reset the recorded balance without creating income. Snapshot contribution IDs prevent a later contribution on the same day from disappearing into an earlier confirmation. Link existing workbook savings categories (including split-month categories) to a goal so those amounts become goal recommendations rather than duplicated bill/per-pay allocations. Linked category amounts replace that goal's standalone per-pay commitment. Other per-pay commitments are funded once per household pay date. After debt is cleared, the next unfunded real goal appears in focus.

The recommendation order is living costs and required debt instalments, debt milestone pace, then all extra to prioritized debt. Optional linked savings-budget/per-pay commitments wait until debt is fully allocated; only the debt-free remainder funds savings. Actual prior actions reduce amounts still required. Recording the estimated deadline pace does not request that same pace repeatedly. Suggestions never become actual actions automatically. Goal contributions refresh a linked saved decision plan's actual starting balance; future dates still depend on explicit monthly forecast assumptions rather than assuming variable future pay or all per-pay contributions arrive. Existing opening snapshots should start before the first new contribution/payment being recorded; statements can align the current recorded balance without adding income.

State: version-1 records load unchanged. Writing the actual-action/goal ledger uses Finance version 2; old clients that cannot interpret corrected payments reject it rather than silently calculating those records incorrectly. Use the updated app before restoring version-2 backups. Refresh/reopen after deployment, keeping site data, and close/refresh old running tabs. New writes reject stale local-storage snapshots. Explicit restore offers a backup of the latest stored Finance. Rollback requires retaining/exporting version-2 data and returning to a compatible client; publishing old v47 code is not a data migration. Shared/legacy Money and Fitness storage is untouched.

Browser-local persistence does not synchronize between devices/browsers. JSON backup/restore includes paycheques, actions, goals, confirmations, corrections and decisions. No workbook, ledger or private household setup is in Git or the release.

Validation adds paychecks.cjs and paycheck-browser.cjs for variable amounts, same-day sources, linking/splitting payments, bill reserves, corrections, goal progress, same-day statements, linked decision goals, workbook category mapping, take-home corrections, real-goal focus, stale writes and mobile layout. Existing calculation, What If, workbook/UI, Life Hub/Fitness regression and offline-upgrade suites pass. Production remains v47; v50 requires explicit publishing approval.

## Debt-first priority and voice drafts (v52)

All extra actual-pay money targets debt after living costs and required payments. This overrides old saved debt/savings percentages in operational recommendations and current-plan forecasts. Dated milestones are paced first, then extra follows the existing debt priority. Optional linked savings categories and standalone per-pay goals no longer divert money before debt payoff. Recorded savings and all actual history remain unchanged. What If scenarios can still explore another allocation.

Talk to LifeHub provides optional single-request browser speech recognition with a typed/dictated fallback. Explicit supported commands draft actual received pay, completed debt payments, a purchase What If or open next focus. It parses digit amounts and matches existing names, requires explicit account selection and opens the regular form for review. Voice never saves ledger records, initiates bank payments, or sends financial amounts in the launch URL. Unsupported phrases/dates must be edited manually. Speech runs only after the microphone button, stops on request/end/page hide, and may use the browser/OS provider's remote speech service. No audio/transcripts are retained by LifeHub.

The #lifehub-voice link opens the existing Money/Finance voice section. iPhone wake phrase setup is manual: create an Apple Shortcut opening this URL, then use Accessibility Vocal Shortcuts to train Hey LifeHub, or invoke the shortcut through Siri. This is not website background listening or speaker authentication. Physical iPhone microphone/wake phrase behavior still needs user-device verification. No additional backend, dependency or AI service was introduced.

Validation: eight suites, including voice parser coverage and isolated mobile voice draft tests proving no automatic ledger mutations. Existing Finance, Fitness/Life Hub and offline upgrade tests pass. Production remains v47; this package is not yet published.

## App simplification (v53)

Daily navigation is four destinations plus More, replacing ten competing tabs. Secondary screens retain their original IDs and role visibility. More closes after choosing a destination, outside click or Escape. The current secondary destination highlights More. Home tiles remain the main entry points; all ten sections remain reachable.

Relationship/customer creation forms open only when needed. Optional owner/notes and customer metadata stay under a disclosure. Customer edits now use one prefilled form (including name and order history), one Save or Cancel instead of four prompt dialogs. Existing customer IDs and extra fields survive edits. Cancelling does not mutate records. Forms close after save.

Quick financial decisions and Advanced What If share one section. Recorded savings progress has one home under real goals rather than a duplicate panel per paycheque. Debt-first allocation, next focus, statements, paycheque actions, scenarios and legacy Money records retain their behavior and storage. Learning notes no longer repeat their column category on every card. Fitness omits the last-session comparison when it is the same session already shown under Last week; distinct comparisons remain. Settings no longer requires opening another nested Settings drawer, and workspace backup controls explicitly state which records they include. Screenshot file fields now fit narrow phones.

No data migration or automatic ledger writes. Existing storage keys, historical financial ledgers, partner records and Fitness data are unchanged. New simplicity.cjs exercises real navigation, customer create/edit/cancel, person capture, role switches, all ten screens at 320/390/760px, reload and unrelated ledger preservation. Existing Finance/browser, paycheck/browser, Life Hub/Fitness and offline-cache tests pass.

Review includes cumulative v43 host changes and the styles.css delta against the previous v52 package. v53 is prepared for review, not deployed. The v52 publishing attempt stalled at Netlify upload; production was still v47 at the last verified check.

## Target payment clarity (v54)

The next-focus card shows the funded recommendation from the latest active actual household pay period, including its extra-debt component. Recurring payment on file is moved into plan details and is explicitly separate from extra allocations. Without current actual pay, the card asks for take-home pay instead of inventing an extra amount. Expired periods are excluded. Completed-payment forms start blank rather than defaulting to the recurring amount. Existing minimums, schedules, balances and actual history are unchanged. Regression cases include a $50 recurring payment with a $700 total funded recommendation ($650 extra), missing/expired pay, UI display and blank actual-payment entry. Pure paycheque and Finance/paycheque browser tests pass.

Transfer to AKB was verified; v53 is live at the original URL. v54 is the next reviewed correction. No paid plan was added.

## Debt progress and private pay calendar (v55)

A mobile SVG graph shows full-account balance history for the current debt focus, opening/current amounts and net reduction. The line is calculated from actual recorded events with estimated interest; gold squares mark lender statement checkpoints, and the green endpoint remains a projection. Milestone focus is explicitly distinguished from its full-account graph. Balance reduction includes interest/reconciliations rather than claiming all reduction was a payment.

Optional private pay-calendar JSON links a reviewed snapshot of timed Work shifts to an income source. Fourteen-day payroll periods end inclusively at cutoff; the cutoff-to-pay lag is configurable. Whole overnight shifts belong to their local start date. Per-shift unpaid minutes, gross hourly rate and approximate take-home percentage are explicit assumptions. Without rate/percentage, dollar estimates remain unset. Duplicate shift IDs, invalid timestamps, overlapping shifts and incomplete coverage cannot silently produce dollar estimates. Expected income remains distinct from actual received pay and cannot fund debt allocations.

The calendar is a private runtime snapshot, not ongoing iCloud synchronization. The chat calendar connector does not grant website credentials; no backend or Apple credential/public calendar URL was introduced. Refresh snapshots as shifts change or coverage ends. Snapshot data and assumptions are included in private Finance backups and validated on restore. The combined private schedule importer can map its calendar income ID onto an existing source, preserving IDs, actual pay, transactions and balances. No work schedule or household-specific dates/financial values are committed or deployed.

A corrected private household schedule import was prepared separately from source: CCB on the 19th, variable biweekly Wednesday pay anchored to the user-confirmed date, with a matching calendar cutoff. It must be reviewed/imported in the browser/device holding the ledger. Existing unrelated income remains active; whether business income should be paused is awaiting user clarification. Payroll rates/break/deduction assumptions also await confirmation.

Validation: planning.cjs covers cutoff boundaries, overnight start-date assignment, breaks, gross/net calculations, incomplete coverage, overlaps/dedup, weekday rules, linked imports and graph statement history. planning-browser.cjs verifies mobile graph, reviewed snapshot import, settings, backup-ready persistence and unchanged actual financial records. Existing pure budget/paycheque/scenario and Finance/paycheque/offline browser regressions pass. Current live release before this change: v54 under AKB; v55 prepared for review.

## Local-time shift premiums (v56)

Calendar estimate assumptions now support editable hourly premium windows, including overnight windows. Work is segmented by local clock minutes; start is inclusive and end exclusive. Users explicitly choose highest-only or stacked overlap treatment. Base pay plus premiums is calculated before the approximate net percentage. Without timed breaks, nonzero unpaid minutes are prorated across rate windows; zero means all breaks paid. Missing premium endpoints or an unset overlap rule disable monetary estimates until completed. Calendar refresh/import retains or explicitly updates supplied assumptions instead of silently dropping incoming rates.

Alberta Time uses UTC-06 year-round from November 1, 2026. The formatter normalizes this rule even on clients with older timezone databases; other zones use their browser timezone rules. Source: https://www.alberta.ca/albertas-new-time-system-abt . User payroll figures and calendar shifts remain in private runtime files only.

Tests cover premium boundaries, midnight/overnight work, overlapping-window replacement/stacking, unpaid-minute proration, spring/fall transitions in a zone that still observes them, incomplete rules, subtotal breakdown and net-after-premiums. Browser coverage verifies adding, editing, saving and restoring premium assumptions, importing private calendar data and preserving actual records. Existing paycheque and Finance browser suites pass. Before this update v55 is live; v56 contains the premium support.

## Quick access to pay estimates (v57)

A Pay & estimates card appears immediately after the main debt focus, showing the next three scheduled income items with calendar-estimated take-home distinguished from other expected amounts. One button opens calendar estimates, and another opens the existing private setup picker without digging through household settings. The #pay-estimates deep link opens the existing Money view and its calendar section. No financial values are encoded in the URL.

Browser tests cover direct navigation/deep-link reload, setup-picker import, mapping existing income without duplicates and unchanged debt/payment/paycheque records. Both available desktop Chrome profiles were inspected through the normal UI and had zero Finance accounts; no personal setup was applied to those empty profiles. The browser holding the user's ledger must still perform the private runtime import. Data is still browser-local, not silently synchronized or packaged with private setup.

## Money simplification (v58)

Money has three primary areas: next debt goal with one progress graph, This payday with actual-pay planning and recording, and Before we spend for quick decisions. Debt balances, setup, schedules, calendar estimates, histories, imports, backups and archived records live under Manage Money. Voice opens from small microphone buttons.

Standalone CFO, legacy Money, advanced scenario and savings dashboards no longer compete with the daily workflow. Historical records and advanced scenario assumptions remain available in read-only archives and exports. No ledger migration or deletion occurs. Existing local storage keys, calculations and other Life Hub features are preserved.

The isolated money-layout test verifies three primary areas, one graph, actual pay and payment recording, voice dialog, archives, unique IDs, persistence and narrow mobile widths. Browser regressions cover Finance, paycheck actions, calendar planning, unrelated app workflows and offline upgrades. Private financial data is excluded from source and deployment.

## Next calendar pay (v59)

This payday keeps the linked calendar income’s next pay visible, even when another household income comes first. The compact card shows estimated take-home, pay date, scheduled hours and snapshot refresh date, with one button to reveal the matching cutoff/premium breakdown. Missing coverage, overlapping shifts and cycle mismatches show review prompts instead of an unsupported dollar estimate. The matching date is omitted from the generic list to avoid duplication. No private household values are embedded in source. Calendar data remains a reviewed snapshot, not live sync.

Planning browser coverage verifies visibility alongside an earlier household payday, changed-shift recalculation, one-tap breakdown, unchanged actual ledger, reload and mobile widths. Money layout and offline cache regressions pass.

## Workout exercise editing (v60)

Each Fitness exercise has a compact Edit exercise disclosure with one name field and Save/Cancel. Substitutions apply to that workout draft only and preserve all set weights, counts and completion flags. The saved workout and future history comparisons use the substituted name, preventing a replacement from being presented as the original movement. The base program and previous sessions remain unchanged. Customized empty drafts also survive program-start changes.

fitness-edit.cjs verifies cancellation, blank-name validation, completed-set preservation, per-date scope, reload, finished history and mobile widths. Existing Fitness/app workflow and offline-cache tests pass.

## Add workout sets (v61)

An Add set button at the bottom of each exercise appends a blank, unchecked weight/reps row and focuses its weight field. Existing entries and completion flags are preserved. Extra sets belong to the current workout, persist across reload and appear in finished history. Customized empty drafts survive program-start changes. Exercise editing and offline-cache tests cover added-set persistence and completion.
