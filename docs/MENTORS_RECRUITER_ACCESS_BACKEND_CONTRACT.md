# Backend contract: Mentors, including Recruiter access

**Status:** Implemented. Migration `20260930142800_AddMentors` adds `mentors` and `candidate_mentor_links`. Apply with `dotnet ef database update`. The frontend already calls the routes and JSON names below (2026-09-30). No further frontend change is required for this contract.

**Roles:** Super Admin `0`, Admin `1`, Recruiter `2`.

Question generation and call-notes extract do **not** read or write mentors. Do not add mentor fields to those payloads.

There is no action that turns a mentor into a candidate.

Relationship and reasoning are **not** editable from the mentor person. They change only through the candidate link routes, and only for Super Admin and Admin.

---

## 1. Locked decisions

| # | Topic | Decision |
|---|--------|----------|
| **M1** | Person vs link | A mentor is one person: `name`, `designation`, `employerId`. A link is one candidate plus one mentor: `relationship`, `reasoning`. |
| **M2** | Duplicate names | The same name may exist on more than one mentor. Do not use name as a unique key. Create always inserts a new person. |
| **M3** | One link | A candidate cannot be linked to the same mentor twice. |
| **M4** | Organization | `employerId` is an employer. Required on create and update of a person. |
| **M5** | Optional text | `designation`, `relationship`, and `reasoning` are optional. Blank, omit, or `null` stores `null`. Reads return `null`, not `""`. |
| **M6** | Required text | `name` is required. Trim. Empty or whitespace → **400**. |
| **M7** | Recruiter person access | Recruiter uses the same mentor person routes as Super Admin and Admin: list, get, search, create, update, delete. |
| **M8** | Recruiter candidate read | Recruiter `GET /api/candidates/{id}` includes `mentors` with the same keys as Admin. Do not omit the array or the keys. |
| **M9** | Recruiter link writes | Recruiter `POST`, `PUT`, and `DELETE` on `/api/candidates/{id}/mentors` and `/api/candidates/{id}/mentors/{linkId}` → **403** when the candidate is not owned by the caller. When `CreatedByUserId` equals the authenticated Recruiter, link writes are allowed (`CANDIDATE_RECRUITER_OWN_MUTATION_BACKEND_CONTRACT.md` **RO7**). |
| **M10** | Candidate list | `GET /api/candidates` items do **not** include `mentors`. |
| **M11** | Candidate create/update body | `POST /api/candidates` and `PUT /api/candidates/{id}` do not create, update, or delete mentors or links. If `mentors` is present, ignore it. |
| **M12** | Delete person | Delete removes that person from list, search, and every candidate detail. `GET /api/mentors/{id}` then returns **404**. Deleting an employer also deletes every mentor at that employer, and those mentors’ links. `employerId` is required, and employers are removed rather than marked deleted. |
| **M13** | Delete link | Delete of a link removes only that candidate–mentor connection. The person remains. |
| **M14** | Verification | Checkboxes on the candidate form are UI-only. Do not persist them. |
| **M15** | Audit | Do not add `createdBy` or `updatedBy` on mentors or links. The UI does not read them. |
| **M16** | Length | The frontend does not enforce a maximum length. Do not return **400** because a string is long. |
| **M17** | Filters | No candidate-list filter by mentor. |

---

## 2. Who can call what

| Method | Path | Super Admin / Admin | Recruiter |
|--------|------|---------------------|-----------|
| `GET` | `/api/mentors` | 200 | 200 |
| `GET` | `/api/mentors/{id}` | 200 | 200 |
| `GET` | `/api/mentors/search` | 200 | 200 |
| `POST` | `/api/mentors` | 201 | 201 |
| `PUT` | `/api/mentors/{id}` | 200 | 200 |
| `DELETE` | `/api/mentors/{id}` | 204 | 204 |
| `GET` | `/api/candidates/{id}` (`mentors` on the body) | 200 | 200 |
| `POST` | `/api/candidates/{id}/mentors` | 201 | **403** if not candidate owner; **201** if owner (**M9**) |
| `PUT` | `/api/candidates/{id}/mentors/{linkId}` | 200 | **403** if not owner; **200** if owner |
| `DELETE` | `/api/candidates/{id}/mentors/{linkId}` | 204 | **403** if not owner; **204** if owner |

Unauthenticated calls stay **401**, same as the other modules.

Recruiter **403** body, same shape as the other forbidden responses:

```json
{
  "status": 403,
  "message": "You do not have permission to perform this action."
}
```

Unknown or deleted mentor id, candidate id, or link id → **404**.

---

## 3. Mentor person

### JSON

```json
{
  "id": 10,
  "name": "Sara Khan",
  "designation": "Engineering Manager",
  "employerId": 4,
  "employerName": "Northbay",
  "linkedCandidates": [
    {
      "candidateId": 42,
      "candidateName": "Ayesha Khan",
      "relationship": "Manager",
      "reasoning": "She coached me through the first release."
    }
  ]
}
```

| Field | Type |
|-------|------|
| `id` | number |
| `name` | string, trimmed, non-empty |
| `designation` | string or `null` |
| `employerId` | number |
| `employerName` | string. Current name of that employer. |
| `linkedCandidates` | array. Empty array when nobody is linked. Not `null`. |

Each `linkedCandidates` item:

| Field | Type |
|-------|------|
| `candidateId` | number |
| `candidateName` | string |
| `relationship` | string or `null` |
| `reasoning` | string or `null` |

Include a candidate only when that candidate is still returned by the candidate list. Omit soft-deleted candidates.

`employerName` is not sent on write. The client sends `employerId` only.

### `GET /api/mentors`

Query: `name` (optional), `pageNumber`, `pageSize`. Dialog filters are specified separately in `docs/MENTORS_LIST_FILTERS_BACKEND_CONTRACT.md`.

`name` is a case-insensitive substring match on the mentor **name** only. The page placeholder is “Search by name...”. Blank or omitted `name` returns the full page. Paging fields match `GET /api/employers`. Items are ordered by `name`, then `id`.

```json
{
  "items": [],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 0,
  "totalPages": 0,
  "hasPrevious": false,
  "hasNext": false
}
```

Each item is the mentor person JSON above, including `linkedCandidates`.

### `GET /api/mentors/{id}`

One mentor person, including `linkedCandidates`. Deleted or unknown → **404**.

### `GET /api/mentors/search`

Query: `search`, `limit`.

`search` uses the same name match as `name` on the list. Results are ordered by `name`, then `id`. `limit` is from 1 to 20. The client sends at most 20.

Response is a JSON array, not a paged object. Each element:

```json
{
  "id": 10,
  "name": "Sara Khan",
  "designation": "Engineering Manager",
  "employerId": 4,
  "employerName": "Northbay"
}
```

Do not include `linkedCandidates` on search hits. The client does not read it there.

### `POST /api/mentors` and `PUT /api/mentors/{id}`

```json
{
  "name": "Sara Khan",
  "designation": null,
  "employerId": 4
}
```

| Rule | Result |
|------|--------|
| `name` missing, blank, or not a string | **400** |
| `employerId` missing, not a positive integer, or not an existing employer | **400** |
| `designation` omitted, `null`, or blank | store `null` |
| Name matches an existing mentor | still **201** with a new `id` |
| Update | replaces `name`, `designation`, and `employerId` only. Does not change links, relationship, or reasoning. |

Success body is the mentor person JSON (list shape), including `linkedCandidates`.

### `DELETE /api/mentors/{id}`

**204.** The person no longer appears in list, search, or any candidate `mentors` array. A later get is **404**. Every link to that person is removed in the same operation.

Deleting an employer removes that employer and also deletes every mentor whose `employerId` is that employer, plus those mentors’ candidate links. Employers are removed rather than marked deleted. `employerId` cannot be left empty.

---

## 4. Candidate links

These routes are how Super Admin and Admin attach a person and edit relationship and reasoning. The Recruiter UI does not call them. The API still returns **403** for Recruiter.

Do not accept links inside `POST /api/candidates` or `PUT /api/candidates/{id}` (**M11**).

### On `GET /api/candidates/{id}`

Admin detail and Recruiter detail both include:

```json
{
  "mentors": [
    {
      "id": 7,
      "mentorId": 10,
      "name": "Sara Khan",
      "designation": "Engineering Manager",
      "employerId": 4,
      "employerName": "Northbay",
      "relationship": "Manager",
      "reasoning": null
    }
  ]
}
```

`id` is the **link** id. `mentorId` is the person id.

Always include `mentors`. No links → `[]`, not `null`, and not an omitted key. The array is ordered by link `id`.

`name`, `designation`, `employerId`, and `employerName` come from the mentor person. `relationship` and `reasoning` come from the link.

### `POST /api/candidates/{id}/mentors`

Super Admin and Admin only.

```json
{
  "mentorId": 10,
  "relationship": "Manager",
  "reasoning": null
}
```

| Rule | Result |
|------|--------|
| Recruiter | **403** |
| Candidate missing or deleted | **404** |
| `mentorId` missing, not a positive integer, or not an existing non-deleted mentor | **400** |
| That mentor is already linked to this candidate | **400** with message `This mentor is already linked.` |
| `relationship` or `reasoning` omitted, `null`, or blank | store `null` |

**201.** Body is the link object in the `mentors[]` item shape above.

### `PUT /api/candidates/{id}/mentors/{linkId}`

Super Admin and Admin only. Body is only:

```json
{
  "relationship": null,
  "reasoning": "She coached me through the first release."
}
```

Does not change the person (`name`, `designation`, `employerId`) and does not change `mentorId`.

Recruiter → **403**. Unknown link → **404**. Success **200** with the link object.

### `DELETE /api/candidates/{id}/mentors/{linkId}`

Super Admin and Admin only. **204.** The person remains. Recruiter → **403**. Unknown link → **404**.

---

## 5. Out of scope

- Question generation.
- Call-notes extract and apply.
- Editing relationship or reasoning on `PUT /api/mentors/{id}`.
- Recruiter add, edit, or remove of a candidate link.
- `mentors` on the candidate list.
- A candidate-list filter by mentor.
- Turning a mentor into a candidate.
- `createdBy` / `updatedBy`.
