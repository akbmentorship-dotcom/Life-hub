# Life Hub as a household CFO workspace

The household should see its next focus first, then open the information needed to make a decision. Money remains part of Life Hub alongside existing tasks, follow-ups, relationships, learning and fitness. No existing records are replaced.

## Primary workflow: stay focused when life changes

The user's priority is focus and rapid decision impact, rather than a growing collection of reports. Next focus remains first. A prominent “Before we decide” check accepts a decision type, amount, funding source where relevant and optional start date. It compares against a saved current monthly plan so the user need not rebuild assumptions for every idea. Show the next focus date change first, then total debt freedom, a selected savings goal, estimated interest and dated payoff risks.

The decision log stores considering/chosen/passed ideas without writing actual transactions. Rechecks use current balances and the current saved plan. Separate saved decisions do not stack automatically; users must update their current-plan assumptions when the real budget changes. Safe automatic adoption/combined commitments is future work requiring a distinction between proposed choices, recurring budget settings and actual transactions.

CFO check-ins, account records and reports are supporting drawers. Future features should earn their place by making a decision quicker or more reliable. Cash/spending reconciliation is useful because it establishes whether a purchase can be funded; detailed dashboards are secondary.

## Paycheque operating loop (v50)

The other primary workflow is actual income to completed action: enter a variable take-home amount, see a recommendation based on received money, log what was actually paid/saved/earmarked and see updated debt and real-goal progress. Recommendations and forecasts remain separate from actual records. Same-day sources share obligations without losing individual receipt caps.

Real savings goals can use existing workbook savings allocations rather than adding another allocation for the same purpose. Linking a real goal to quick decision checks keeps its recorded balance current. Future dates remain conditional forecasts, not guaranteed future pay.

## Decisions the hub should support

| Question | Current capability | Next useful addition |
| --- | --- | --- |
| What should we focus on next? | Deadline-first debt milestone card, then APR/balance priority | Deadline feasibility against actual cash and funded reserves |
| What is coming in and due? | Independent pay rules, expected amounts, budget/debt recurrences, 30-day CFO check-in | Separate cash accounts and a 30/60/90-day running cash forecast |
| What can we spend or pay extra? | Actual-pay recommendations, receipt-level actions, paid/reserved bills and real-goal progress | Actual spending ledger, paid-bill tracking, protected reserves and reconciled cash before showing a safe-to-spend figure |
| Will a decision delay our goals? | Read-only debt/savings What If comparison | Multiple real savings/sinking-fund goals with dedicated contributions |
| Are we missing something? | Overdue milestone, missing income/payment settings, unconfirmed/aging statement flags | Annual renewals, subscriptions, insurance and household tax reminders |
| Are we improving? | Debt balances, payments, interest estimates and weekly CFO review notes | Monthly budget-versus-actual close and net-worth history |
| Can both partners use it? | Browser-local persistence and manual private backup transfer | Explicitly designed authenticated shared Finance store and conflict handling, subject to separate approval |

Business income should mean money available to the household after business obligations. Future cash-account work should identify household, business and protected/tax cash separately. Credit limits are not cash. Proposed payments are not completed transactions. Lender-confirmed statements remain distinct from estimates, particularly for promotional/deferred-interest loans.

## Open-source review — November 11, 2026

Primary repositories inspected:

| Project | Relevant strengths | Fit for this app |
| --- | --- | --- |
| [Actual Budget](https://github.com/actualbudget/actual) | Local-first budgeting, envelope approach, synchronization architecture; repository lists MIT license | Strongest reference for budgeting and eventual import/reconciliation workflows. It is a full NodeJS-based application, so embedding the whole project would introduce another application/data model. Evaluate individual components against their exact license and dependencies before reuse. |
| [Firefly III](https://github.com/firefly-iii/firefly-iii) | Recurring transactions, double-entry accounting, income/expense reporting and savings goals; repository lists AGPL-3.0 | Useful reference for ledger integrity and reporting. Its server deployment and separate data model do not fit the current static Netlify app as a drop-in component. |
| [Maybe](https://github.com/maybe-finance/maybe) | Broad personal-finance product scope | The upstream repository is archived. Prefer maintained projects when choosing dependencies. |

This release reuses Life Hub's Finance engine and UI conventions. These repositories are research references, not bundled dependencies or copied implementations. Preserve source attribution and applicable license notices for any future code actually reused. Do not upload household data to third-party demos or test instances.

## Implementation order

1. Complete and reconcile the existing private workbook, pay rules and photographed payoff milestones on the browser the household uses. Keep lender terms explicit.
2. Quick decision impact (v49) is the primary next release; keep the v48 CFO check-in supporting it. CFO check-in: expose planned incoming/outgoing money, upcoming obligations, missing/stale records and a weekly review. Keep Next focus first.
3. Cash accounts and broader actuals: add bank-account snapshots, transfers and general spending to the v50 receipt/action and bill/payment matching ledger. This is the prerequisite for reliable cash forecasts and a safe-to-spend calculation. Design import deduplication before bank CSV support.
4. Protected pots and calendar: emergency fund, annual bills, household projects and business/tax reserves. Combine deadline needs without counting the same cash twice.
5. Monthly close: budget-versus-actual, debt reduction, interest, savings, net-worth trend and the decisions made.
6. Shared access: decide which devices/people need the same ledger before introducing a backend. Existing browser-local data does not automatically synchronize, even when both partners open the same URL.

The 30-day check-in deliberately reports a scheduled-income-minus-obligations plan rather than cash availability. It does not include current bank cash, unrecorded spending, paid-bill status or overdue budget bills. Treat missing inputs as incomplete rather than zero-cost certainty. Weekly review completion is only an acknowledgement and never a payment, reconciliation or claim that all bills are paid.
