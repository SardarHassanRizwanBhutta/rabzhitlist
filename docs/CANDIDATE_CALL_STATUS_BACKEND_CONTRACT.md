# Backend contract: candidate Call Status

Handoff for a **scalar Call Status** on each candidate. Recruiters track whether a cold call is still needed, done, or waiting on a follow-up.

This is **not** pipeline `status` (`sourced`, interview, etc.). JSON name is **`callStatus`**. Do **not** reuse `status`.

**Frontend (after this API ships):** Candidates table column “Call Status”, Candidates filter (multi-value OR), Edit Candidate dialog select. Create form does **not** show the field; create sends Pending.

---

## 1. Locked product decisions

Confirmed during frontend mock (2026-09-01):

| # | Topic | Decision |
|---|--------|----------|
| **L1** | Grain | **One current value per candidate.** No call-attempt history in v1. |
| **L2** | Values (UI labels) | **Done**, **Pending**, **Follow-up**. |
| **L3** | JSON / storage | Integer enum. **Never** emit `"Pending"` / `"Done"` strings. |
| **L4** | Distinct from `status` | Pipeline `status` is unchanged. |
| **L5** | Existing rows | **Migration sets every existing `candidates` row to Done.** |
| **L6** | New rows | **Pending** when omitted/null on POST. |
| **L7** | Mutability | Recruiter sets it **manually** (Edit Candidate). Saving Cold Caller / call-notes extract does **not** change `callStatus`. |
| **L8** | List | Column + filter on Candidates **table**. Filter allows **several** values (e.g. Pending + Follow-up). |
| **L9** | Required after migrate | Column is **NOT NULL**. GET list/detail always include `callStatus`. |

---

## 2. Enum (`callStatus`)

C# name suggestion: `CallStatus`.

| Int | C# | UI label |
|-----|-----|----------|
| `0` | `Pending` | Pending |
| `1` | `Done` | Done |
| `2` | `FollowUp` | Follow-up |

Invalid int (not in `0`–`2`) on write or list filter → **400**.

---

## 3. Database

- Add `call_status` (or equivalent) on `candidates`, type matching the enum, **NOT NULL**.
- **Existing rows:** `UPDATE` all current rows to **Done (`1`)** in the same migration.
- **New inserts:** default **Pending (`0`)** when the column is not supplied.
- Soft-deleted rows: still set to Done in the backfill so a restore does not leave a NULL.

No other tables. Nested achievement/WE/etc. routes unchanged.

---

## 4. JSON field

| Field | Type | Where |
|-------|------|--------|
| `callStatus` | `number` (`0`–`2`) | List item, GET by id, POST body, PUT body |

Do **not** use `coldCallStatus`. Do **not** put this on `status`.

---

## 5. Endpoints

### `GET /api/candidates` (list)

Each `items[]` element includes `callStatus`.

**New query (repeatable, OR within this field, AND with every other active candidate filter):**

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `callStatus` | `CallStatus[]?` | length > 0 | Row `callStatus` is **any** of the ints (`callStatus=0&callStatus=2`). |

Omit / empty = filter off.

Invalid value in the set → **400**.

Do not client-filter a single page; this must apply in SQL so `totalCount` / paging are correct.

### `GET /api/candidates/{id}`

Include `callStatus`.

### `POST /api/candidates`

| Body | Behavior |
|------|----------|
| omit / `null` | Persist **Pending (`0`)**. |
| `0` / `1` / `2` | Persist that value. |
| other | **400**. |

### `PUT /api/candidates/{id}` (basic info)

Same full replacement of basic-info scalars as today. **Always include `callStatus`.**

| Body | Behavior |
|------|----------|
| `0` / `1` / `2` | Replace stored value. |
| omit / `null` / other | **400**. |

---

## 6. Example (list item fragment)

```json
{
  "id": 42,
  "name": "Ayesha Khan",
  "status": "sourced",
  "callStatus": 0
}
```

`status` stays the pipeline string. `callStatus` is `0` (Pending).

---

## 7. Acceptance

1. After migrate, a candidate that already existed has `callStatus: 1` (Done) until someone edits it.
2. `POST` without `callStatus` → stored Pending (`0`); GET returns `0`.
3. `PUT` with `"callStatus": 2` → Follow-up; list badge/filter see Follow-up.
4. `GET /api/candidates?callStatus=0&callStatus=2` returns only Pending and Follow-up, ANDed with other filters; `totalCount` matches that set.
5. `GET /api/candidates?callStatus=9` → **400**.
6. `status` filter/values unchanged.
7. Soft-deleted candidates stay omitted from the list; their backfilled Done does not leak into the list.

---

## 8. Frontend (already mocked; switch to this API)

- List query: `callStatus` repeated ints from selected labels (Done=1, Pending=0, Follow-up=2).
- Edit PUT: `callStatus` int.
- Create POST: `0` (field hidden).
- Display ints with labels Done / Pending / Follow-up. Missing/invalid → em dash until a valid int is present.
