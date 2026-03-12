# Test Coverage Analysis

## Current State

**This codebase has zero test coverage.** There are 172 source files (components, pages, services,
contexts, hooks, and utilities) and not a single test file exists. No test framework is configured,
and there are no `test` scripts in `package.json`.

This is the most important finding: every feature described below is entirely untested.

---

## Recommended Testing Stack

Before writing any tests, the following tooling should be added:

```bash
npm install --save-dev vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom
```

Add to `vite.config.js` (or a separate `vitest.config.js`):

```js
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: './src/test/setup.js',
  coverage: {
    provider: 'v8',
    reporter: ['text', 'html'],
  },
}
```

Add to `package.json`:

```json
"test": "vitest",
"test:coverage": "vitest run --coverage"
```

Vitest is the natural choice because it shares the existing Vite configuration — no extra bundler
setup required.

---

## Priority 1 — Business-Critical Service Logic

These are the highest-value areas to test first. They contain complex branching and data
transformation logic where a silent bug can corrupt financial records, expose client data to the
wrong supplier, or deadlock an approval workflow.

### `src/services/approvalService.js` — Multi-Step Approval Workflows

The `makeDecision` function (`approvalService.js:86`) orchestrates a multi-step approval chain
across several database writes. The branching is complex:

- `decision === 'rejected'` → mark request as `rejected`
- `decision === 'approved'` → look up remaining steps; advance to next step (`in_progress`) or mark
  as fully `approved` if there are no more steps
- `decision === 'delegated'` → reassign the approver on the current step

A bug in the "approved but more steps remain" vs "approved and it's the final step" logic would
either prematurely approve a procurement request or silently stall it. The in-memory filtering in
`fetchMyPendingApprovals` (`approvalService.js:66`) joins step assignments to pending requests and
is also untested.

**Suggested test cases:**

```
makeDecision — approved, non-final step → advances current_step, sets status to 'in_progress'
makeDecision — approved, final step     → sets status to 'approved'
makeDecision — rejected                 → sets status to 'rejected', skips step lookup
makeDecision — delegated                → updates approver_id, does not change request status
fetchMyPendingApprovals — user has no steps        → returns empty array
fetchMyPendingApprovals — user assigned to step 2  → returns only requests on step 2
```

### `src/services/bidService.js` — Bid Award Transaction

`awardBid` (`bidService.js:57`) performs a multi-step operation: it marks one bid as `awarded`,
marks all competing bids as `rejected`, updates the order with a new supplier and a generated job
ID, creates a `job_updates` record, and fires a Slack notification. There is no database
transaction wrapping this — if any step fails partway through, the data is left in an inconsistent
state.

Additionally, the job ID generated here (`RZ-${year}-${Math.floor(1000 + Math.random() * 9000)}`)
uses random numbers with no collision check. This is distinct from the sequential `generateRZJobId`
utility and could produce duplicate IDs.

**Suggested test cases:**

```
awardBid — happy path → awarded bid is 'awarded', other bids are 'rejected', order gets supplier_id and AWARDED status
awardBid — first database call fails → throws, no subsequent writes attempted
openOrderForBidding — with deadline → sets bid_deadline in the update payload
openOrderForBidding — without deadline → does not include bid_deadline in payload
```

### `src/services/spendAnalyticsService.js` — Spend Aggregation

All four functions (`fetchSpendBySupplier`, `fetchSpendByMaterial`, `fetchSpendOverTime`,
`fetchSpendSummary`, `fetchBidSavings`) follow the same pattern: fetch raw rows, then compute
aggregates in JavaScript. The aggregation logic is pure (no further I/O) once you mock the
Supabase call, making these ideal candidates for unit tests.

Bugs here produce incorrect numbers on the admin analytics dashboard — hard to spot and directly
affect business decisions.

**Suggested test cases:**

```
fetchSpendBySupplier — multiple orders, same supplier   → totals are summed, sorted descending
fetchSpendBySupplier — buy_price is null string         → coerces to 0 without NaN
fetchSpendSummary — mix of active, delivered, other     → counts and totals are correct
fetchBidSavings — awarded bid is not the lowest         → saving calculated against highest, not average
fetchBidSavings — only one bid per order                → no saving recorded (bids.length check)
fetchSpendOverTime — orders in same month               → grouped under one key
```

### `src/lib/generateRZJobId.js` — Sequential ID Generation

The ID-generation logic (`generateRZJobId.js:20-30`) parses the last stored ID and increments it.
The parsing (`lastId.split('-')`, `parts.length === 4`) and formatting (`padStart(3, '0')`) are
pure operations that should be tested in isolation. A mistake here results in duplicate or
malformed job IDs that break the entire tracking system.

**Suggested test cases:**

```
no existing IDs → returns 'RZ-JOB-<year>-001'
last ID is 'RZ-JOB-2026-009' → returns 'RZ-JOB-2026-010'
last ID is 'RZ-JOB-2026-099' → returns 'RZ-JOB-2026-100' (no zero-padding truncation)
malformed last ID (wrong number of parts) → falls back to 001
database error → propagates the error
```

---

## Priority 2 — Authentication and Access Control

Bugs here either lock users out entirely or grant the wrong access level.

### `src/contexts/AuthContext.jsx` — Auth State Machine

`AuthContext` manages the entire session lifecycle. Several behaviours are critical and currently
untested:

- **Fail-closed on missing profile** (`AuthContext.jsx:49`): if `fetchProfileByUserId` returns no
  `role`, the user is immediately signed out. This is a security-critical path.
- **Loading flag lifecycle**: `loading` must be `false` after initialisation completes regardless
  of success or error, otherwise the app hangs on a spinner forever.
- **Auth state change handler**: the `onAuthStateChange` callback drives the running session; its
  behaviour on `SIGNED_OUT` vs session expiry vs new sign-in needs verification.

**Suggested test cases:**

```
login — success → currentUser set, userRole set, loading is false
login — wrong password → returns { data: null, error }, state unchanged
fetchUserProfile — profile has no role → signs out, clears state, returns false
fetchUserProfile — Supabase returns error → signs out, clears state, returns false
initializeAuth — no session → currentUser is null, loading is false
initializeAuth — valid session → sets user and role, loading is false
logout — clears currentUser, userRole, isDemo
```

---

## Priority 3 — Data Integrity Utilities

### `src/lib/auditLogger.js` — Audit Log Payload

`createAuditLog` (`auditLogger.js:3`) constructs a payload that populates both `user_id` and
`admin_id` with the same value (a known workaround, see the comment). It also serialises `details`
to JSON when it is an object. If `details` is already a string, it should remain a string — a
double-serialisation bug would corrupt audit records.

The function deliberately swallows errors (`console.warn` rather than `throw`) so that audit
failures never block the main action. This non-throwing contract should be explicitly verified.

**Suggested test cases:**

```
details is an object → payload.details is a JSON string
details is already a string → payload.details is the same string (no double-encode)
Supabase insert fails → function returns false, does not throw
Supabase insert succeeds → function returns true
userId is undefined → early return, no insert attempted (logActivity guard in AuthContext)
```

### `src/lib/aiScrubber.js` — AI Document Scrubbing

`scrubDrawingWithAI` (`aiScrubber.js:15`) builds a `FormData` payload from `clientInfo` fields,
making conditional `append` calls for each field. The conditional logic should be tested to confirm
that `null` or `undefined` values are not appended (which would send the literal string "null" to
the edge function).

The error-handling path also parses the response JSON to extract an error message but silently
ignores JSON parse errors — worth verifying the fallback message is correct.

**Suggested test cases:**

```
clientInfo with all fields → FormData contains all five entries
clientInfo with null email → FormData does NOT contain 'email' entry
HTTP 500 response with JSON error body → throws with the error message from the body
HTTP 500 response with non-JSON body → throws with generic 'AI scrubbing failed (500)' message
HTTP 200 response → returns { blob, report } with decoded X-Redaction-Report header
```

---

## Priority 4 — React Components and Routing

These are harder to set up but protect against regressions in user-facing flows.

### Protected Route / Role-Based Routing (`src/App.jsx`)

The app has 70+ routes gated by `ProtectedRoute` and role checks. A regression here could expose
admin pages to client or supplier users. Smoke tests with `@testing-library/react` and a mocked
`AuthContext` would catch the most critical cases.

**Suggested test cases:**

```
unauthenticated user → redirected to /login
authenticated admin → can access /admin/... routes
authenticated client → redirected away from /admin/... routes
authenticated supplier → can access /supplier/... routes, not /client/... routes
```

### `src/features/auth/` — Login Flow

The `LoginContainer` (`src/features/auth/containers/LoginContainer.jsx`) handles the login form
submission. Tests should verify the interaction between the form, the `AuthContext.login` call, and
the resulting navigation or error display.

**Suggested test cases:**

```
submitting valid credentials → calls login(), navigates to role-appropriate dashboard
submitting invalid credentials → shows error message, stays on login page
submitting empty form → shows validation errors, does not call login()
```

### `src/services/orderService.js` — `clearWithdrawnOrders`

This function (`orderService.js:40`) uses `Promise.allSettled` to bulk-clear orders and counts only
the fulfilled, error-free results. The counting logic (`reduce` over settled results) is worth
testing with a mix of successes and failures.

**Suggested test cases:**

```
all orders clear successfully → returns the total count
some orders fail → returns only the count of successes
all orders fail → returns 0
empty array → returns 0 without making any calls
```

---

## Summary Table

| Area | File(s) | Risk if Untested | Effort to Test |
|---|---|---|---|
| Approval workflow decisions | `approvalService.js` | Incorrect approvals / stalled workflows | Medium |
| Bid award transaction | `bidService.js` | Inconsistent order/bid state | Medium |
| Spend analytics aggregation | `spendAnalyticsService.js` | Wrong financial figures in dashboard | Low |
| Job ID generation | `generateRZJobId.js` | Duplicate or malformed IDs | Low |
| Auth context state machine | `AuthContext.jsx` | Wrong access levels, infinite loading | Medium |
| Audit log payload construction | `auditLogger.js` | Corrupted audit records | Low |
| AI scrubber error handling | `aiScrubber.js` | Silent failures, PII leakage | Low |
| Protected route / role gating | `App.jsx` | Unauthorised page access | Medium |
| Login form flow | `features/auth/` | Login regressions go undetected | Medium |
| Bulk order clearing | `orderService.js` | Incorrect cleared-order count | Low |

---

## Recommended First Steps

1. **Install Vitest and Testing Library** as described above — this has zero impact on the
   production build.
2. **Start with the pure logic** in `spendAnalyticsService.js`, `auditLogger.js`, and
   `generateRZJobId.js`. These require only simple Supabase mocks and give fast confidence.
3. **Add `makeDecision` tests** in `approvalService.js` — this is the highest business-risk
   function and the branching logic is straightforward to mock.
4. **Add `AuthContext` tests** using `@testing-library/react`'s `renderHook`. These protect the
   most critical security invariant (fail-closed on missing profile).
5. **Add a CI workflow** (`.github/workflows/test.yml`) that runs `npm test` on every pull
   request, so coverage does not regress.
