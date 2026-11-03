# AKB Life Hub

Single-file app: open `index.html` in a browser. Fitness opens directly to today's scheduled workout, using the device's local calendar date.

## Fitness

- Monday Upper A; Tuesday Lower A; Thursday Upper B; Friday Lower B. Wednesday/Saturday cardio or recovery; Sunday rest.
- Change the workout or date directly. Under **Program settings & reschedule**, swap two scheduled days or change the program start date.
- Every working set has weight, reps (or seconds), and a completion button. Use weight 0 for unweighted exercises. Side/leg prescriptions mean the entered count is per side/leg.
- Inputs and completion save automatically. Finish Workout saves a session; incomplete sessions require confirmation. One finished session per workout type per date prevents accidental duplicates.
- Summary shows the Monday–Sunday count, editable starting/goal body weights, dated weigh-ins, strength history, workout details, and simple rep-target progression guidance. Rest entries do not count as workouts.

### Phase defaults

The supplied program specifies phases but not reduced set counts. Weeks 1–2 therefore use one fewer set per exercise (minimum one). Week 7 uses half the normal sets, rounded up, with a reminder to lower effort. Weeks 3–6 and 8–12 use full prescribed volume. Pogo hops begin in week 3. Week 12 is a controlled assessment. Change the start date to align with your current program week. Dates before the start use week 1; dates after week 12 retain week 12.

Untouched drafts update when the start date changes. Drafts with entered data retain their original prescription. Rescheduling swaps future date assignments; it does not move existing drafts or completed sessions. Units are labels, not automatic conversions; previous sessions and weigh-ins retain their saved unit.

### Storage and preservation

Fitness reuses the existing `load`/`save` utilities and writes only to the new `akb-fitness-v1` key. Existing `workout-sessions` records are displayed as legacy history and never rewritten. Other app keys and sections are preserved. The pre-existing invalid smart-quote JavaScript delimiters were normalized so the application can execute.

**Browser-local storage does not automatically synchronize across devices.** Use the same browser and origin to retain data. Clearing browser/site data removes it. A visible warning appears if storage fails; in that case changes remain only in memory. There are no new runtime dependencies.

## Browser regression tests

With Node, Playwright, and its Chromium browser available:

```sh
node tests/fitness.cjs
```

For an existing Chrome installation, set `CHROME_PATH` to its executable. `PLAYWRIGHT_MODULE` may point to an existing Playwright module. Tests use an isolated browser context and do not touch your normal browser profile or real user data.
