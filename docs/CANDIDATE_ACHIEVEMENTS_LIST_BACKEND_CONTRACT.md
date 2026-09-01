# Backend contract: global candidate-achievements list (browse)

Handoff for a **read-only** paged list of **every** `candidate_achievements` row, so recruiters can discover existing names (e.g. “Recognized for being the top .NET Developer”) and jump to that **one** candidate.

This is **not** a shared catalog like certifications or universities. It is an index of **instance rows**. Create / update / delete stay on `GET|POST|PUT|DELETE /api/candidates/{candidateId}/achievements`.

**Frontend (after this API ships):** page `/achievements`, one table row per item, candidate control → `/candidates?candidateId={id}` (see §6).

---

## 1. Locked product decisions

Confirmed **2026-08-31**:

| # | Topic | Decision |
|---|--------|----------|
| **L1** | Row grain | **One JSON item per `candidate_achievements` row.** Same display name on two candidates → two items. |
| **L2** | Click target | Candidates **list** page, **that person only** (`candidateId`), not “all candidates whose achievement name contains this string”. |
| **L3** | Mutability | **Browse only.** No POST/PUT/DELETE on this collection. |
| **L4** | Scope | This ticket: `GET /api/achievements` **and** `GET /api/candidates?candidateId=`. Nested achievement CRUD under a candidate is **unchanged**. |
| **L5** | Soft delete | Omit rows whose parent `candidates.deleted_at` is not null. If achievement rows themselves are soft-deleted, omit those too. |
| **L6** | JSON enums | `type` is **integer** `AchievementType` (`0`–`7`), same as candidate create/list. Never enum name strings. |
| **L7** | Pagination | Same `PagedResult<T>` as other lists (`pageNumber`, `pageSize`, `items`, `totalCount`, `totalPages`, `hasPrevious`, `hasNext`). `pageSize` default **20**, cap **100**. |
| **L8** | Default sort | `CreatedAt` **descending**, then `Id` **descending**. |
| **L9** | Candidate identity | Each item includes `candidateId` and `candidateName` so the UI can render the candidate control and build the candidates URL. **No photo URL** (candidate list DTO has none; UI may use initials). |
| **L10** | Click-through API | **`GET /api/candidates?candidateId=`** (exact id) ships in the **same backend ticket** as `GET /api/achievements`. |

---

## 2. Enum (`type`)

Same as `docs/CANDIDATE-API-REFERENCE.md`:

| Int | C# / meaning |
|-----|----------------|
| `0` | Competition |
| `1` | OpenSource |
| `2` | Award |
| `3` | Medal |
| `4` | Publication |
| `5` | Certification |
| `6` | Recognition |
| `7` | Other |

`null` = type not set.

---

## 3. Endpoints (this ticket)

| Method | Path | Behavior |
|--------|------|----------|
| **GET** | `/api/achievements` | Paged, filtered achievement-instance list. Missing route → **404**. Empty data → `items: []`, `totalCount: 0`. |
| **GET** | `/api/candidates` | Existing list. **Add** query `candidateId` (see §6). |

Do **not** add POST/PUT/DELETE on `/api/achievements`.

Existing nested routes stay:

| Method | Path |
|--------|------|
| GET/POST | `/api/candidates/{candidateId}/achievements` |
| GET/PUT/DELETE | `/api/candidates/{candidateId}/achievements/{id}` |

---

## 4. Query parameters

All filters **AND** together. Omit / empty = filter off.

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `pageNumber` | `int` | always | 1-based. Default `1`. |
| `pageSize` | `int` | always | Default `20`, max `100`. |
| `name` | `string?` | non-empty after trim | Achievement `Name` contains substring, case-insensitive (`ILIKE %value%`). |
| `types` | `AchievementType[]?` | length > 0 | Row `Type` is **not null** and is **any** of the ints (`types=0&types=6`). |
| `candidateId` | `long?` | has value, `> 0` | Only rows for that candidate. Invalid id → `400`. |

**Out of v1 (do not implement unless product asks):** year range, ranking, URL, candidate name substring, sort override.

**400** when `types` contains an int outside `0`–`7`.

---

## 5. Response

`PagedResult<CandidateAchievementListItemDto>`.

### `CandidateAchievementListItemDto`

| JSON field | Type | Notes |
|------------|------|--------|
| `id` | `number` | `candidate_achievements.id` (stable row key). |
| `candidateId` | `number` | Parent candidate; required. |
| `candidateName` | `string` | Parent candidate display name. |
| `name` | `string` | Achievement title (required on write; never null here). |
| `type` | `number \| null` | `AchievementType` int. |
| `ranking` | `string \| null` | |
| `year` | `number \| null` | |
| `url` | `string \| null` | |
| `description` | `string \| null` | Included so the table can show a snippet later without a second call. |
| `createdAt` | `string` | ISO datetime. |
| `updatedAt` | `string` | ISO datetime. |

Example:

```json
{
  "items": [
    {
      "id": 801,
      "candidateId": 42,
      "candidateName": "Ayesha Khan",
      "name": "Recognized for being the top .NET Developer",
      "type": 6,
      "ranking": null,
      "year": 2024,
      "url": null,
      "description": null,
      "createdAt": "2024-11-02T10:15:00Z",
      "updatedAt": "2024-11-02T10:15:00Z"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 1,
  "totalPages": 1,
  "hasPrevious": false,
  "hasNext": false
}
```

Do **not** emit `"Recognition"` on `type`. Do **not** collapse duplicate names.

---

## 6. Click-through: one candidate on the Candidates page

Existing catalog links (`certificationId`, `universityId`, `employerId`, `projectId`) mean **any candidate related to that catalog id**. That is **wrong** here: the row is already tied to one person.

**FE URL (after list exists):**

```
/candidates?candidateId={candidateId}
```

**This ticket — add to `GET /api/candidates`:**

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `candidateId` | `long?` | has value, `> 0` | **Exact** `candidates.id` match. At most one row (or empty `items` if missing/soft-deleted). **AND** with every other active candidate filter. Invalid (`≤ 0`) → **400**. |

Do **not** reuse `achievementName` for this click: that would return every candidate whose achievement name **contains** the same substring.

---

## 7. What this is not

- Not a catalog with its own create dialog.
- Not grouped-by-name with multiple candidate icons on one row.
- Not `GET /api/candidates/{id}/achievements` reused as the global list (that is still per-candidate).
- Not changing candidate-list filters `achievementName` / `achievementTypes` (those stay for “I already know the string / type”).

---

## 8. Acceptance

1. Two candidates each have an achievement named `"Foo"` → list returns **two** items with different `id` / `candidateId`.
2. Soft-deleted candidate → their achievement rows **do not** appear; `totalCount` excludes them.
3. `name=top%20.NET` returns rows whose name contains that substring, case-insensitive.
4. `types=0` returns only competition rows with non-null type `0`.
5. `GET /api/achievements` with no body mutations; POST to this path is **405** or **404** (not a create).
6. Nested `POST /api/candidates/{id}/achievements` still creates a row that then appears on this list.
7. `GET /api/candidates?candidateId=42` returns at most that candidate (soft-deleted / unknown id → empty page, not the unfiltered list).
8. `GET /api/candidates?candidateId=0` → **400**.

---

## 9. Frontend follow-up (not this backend ticket)

- Route `/achievements`, sidebar item, table + name/type filters, pagination.
- Candidate control: link to `/candidates?candidateId={candidateId}` (candidates page reads that query and calls `GET /api/candidates?candidateId=`).
- No add/edit/delete on this page.
- Keep Candidates filter `achievementName` / `achievementTypes` as they are.
