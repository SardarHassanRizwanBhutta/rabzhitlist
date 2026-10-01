# Backend contract: Mentors list filters

**Status:** Not implemented. The Mentors page already sends these query parameters. Filtering by them works after this contract is applied. Until then, `GET /api/mentors` may ignore the new parameters and return the unfiltered page.

**Roles:** Super Admin `0`, Admin `1`, Recruiter `2`. Recruiter uses the same list filters as Super Admin and Admin. These parameters do not return **403**.

This extends `GET /api/mentors` only. Do not change `GET /api/mentors/search`, `GET /api/mentors/{id}`, create, update, delete, or candidate link routes. List item JSON is unchanged. Order stays `name`, then `id`.

The page search box and the Filters dialog Name field are separate. Both can be set. A mentor must match every parameter that is present.

---

## 1. Locked decisions

| # | Topic | Decision |
|---|--------|----------|
| **F1** | Search box | Existing query `name`. Case-insensitive substring on mentor `name`. Unchanged. |
| **F2** | Dialog Name | New query `filterName`. Case-insensitive substring on mentor `name`. Independent of `name`. |
| **F3** | Organization | New query `employerIds`, repeated. Match mentor `employerId` exactly. A mentor matches if their organization is **any** selected id. |
| **F4** | Designation | New query `designation`. Case-insensitive substring on mentor `designation`. A null or blank designation does not match a filled filter. |
| **F5** | Combine | AND across `name`, `filterName`, `employerIds`, and `designation`. A missing parameter adds no constraint. OR only inside `employerIds`. |
| **F6** | Paging | `pageNumber` and `pageSize` stay as they are. `totalCount` is the count after these filters. The client returns to page 1 when the dialog is applied or cleared. |
| **F7** | Click-through | `mentorFilter` and `mentorId` are frontend URL only. Do not read them. |

---

## 2. `GET /api/mentors`

| Query | Type | When omitted or blank |
|-------|------|------------------------|
| `name` | string | No search-box constraint. |
| `filterName` | string | No dialog-name constraint. |
| `employerIds` | repeated integer | No organization constraint. |
| `designation` | string | No designation constraint. |
| `pageNumber` | integer | Unchanged. |
| `pageSize` | integer | Unchanged. |

Trim `name`, `filterName`, and `designation`. After trim, empty or whitespace is the same as omitted.

`employerIds` is repeated, the same way as `employerIds` on `GET /api/candidates`:

```http
GET /api/mentors?name=Ali&filterName=Khan&employerIds=4&employerIds=9&designation=Manager&pageNumber=1&pageSize=20
```

That request returns mentors whose name contains both `Ali` and `Khan`, whose `employerId` is 4 or 9, and whose designation contains `Manager`.

Examples:

| Stored mentor | `name=Sara` | `filterName=Khan` | `employerIds=4` | `designation=Manager` | Matches all four |
|---------------|-------------|-------------------|-----------------|----------------------|------------------|
| Sara Khan, employer 4, designation Engineering Manager | yes | yes | yes | yes | yes |
| Sara Ali, employer 4, designation Engineering Manager | yes | no | yes | yes | no |
| Sara Khan, employer 9, designation Engineering Manager | yes | yes | no | yes | no |
| Sara Khan, employer 4, designation null | yes | yes | yes | no | no |

Substring match is case-insensitive. `manager` matches `Engineering Manager`.

---

## 3. Validation

| Case | Result |
|------|--------|
| `employerIds` value is missing, not an integer, or not greater than 0 | **400** `{ "status": 400, "message": "employerIds must be integers greater than 0." }` |
| Duplicate `employerIds` | Treat as one id. Do not **400**. |
| Unknown employer id | That id matches no mentor. The list stays **200**. Do not **404**. |
| `name`, `filterName`, or `designation` omitted, blank, or whitespace | Ignore that parameter. |
| Very long strings | Do not **400** because a string is long. |

Unauthenticated calls stay **401**. The response shape, including an empty `items` array, stays the same as the current paged list.
