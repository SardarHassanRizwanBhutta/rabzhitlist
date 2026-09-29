# Entity detail `createdBy` / `updatedBy` — frontend integration (AI agent handover)

**Status:** Backend **shipped**. Apply migration `20260928190000_AddUpdatedByUserId` and restart the API before calling these fields. FE integration is **not** in this repository (Next.js app is separate — discover paths there before editing).  
**Audience:** AI agent (or developer) on the **Next.js** frontend.  
**Prerequisites:** Bearer auth on `/api/**` ([`AUTH_LOGIN_FRONTEND_INTEGRATION.md`](./AUTH_LOGIN_FRONTEND_INTEGRATION.md)), role guards and **403** parsing ([`RBAC_FRONTEND_INTEGRATION.md`](./RBAC_FRONTEND_INTEGRATION.md)).

This document is only the audit fields on the five parent records. It does not change contribution counts ([`USER_CONTRIBUTIONS_FRONTEND_INTEGRATION.md`](./USER_CONTRIBUTIONS_FRONTEND_INTEGRATION.md)), the list query `createdByUserId` ([`CONTRIBUTION_LIST_FILTER_BACKEND_HANDOFF.md`](./CONTRIBUTION_LIST_FILTER_BACKEND_HANDOFF.md)), or `createdByFullName` on `GET /api/users/{id}/contributions` ([`USER_CREATED_BY_BACKEND_HANDOFF.md`](./USER_CREATED_BY_BACKEND_HANDOFF.md)).

---

## 1. Executive summary

| Item | Detail |
|------|--------|
| **Feature** | Show who created and who last updated a **candidate, employer, project, university, or certification** |
| **Where the keys exist** | Parent **detail**, and the **create / update / patch responses that already return that same detail object** |
| **Where the keys do not exist** | Paged lists, search, data-progress, nested child resources, `GET /api/achievements` |
| **Who can see them** | Every role that can already call that detail GET, **including Recruiter** |
| **JSON** | `createdBy` and `updatedBy`. Each is `null` or `{ "id", "fullName", "email" }` |
| **Client does not send them** | The server sets them from the signed-in user. Request bodies are unchanged |
| **UX** | Placement, labels, and whether to show email are **frontend-owned** |

---

## 2. Product scope

### 2.1 In scope

- Read `createdBy` and `updatedBy` from the five parent detail payloads below.
- After a parent save whose response **is** that detail payload, use the returned object (it already has the new values).
- After a nested write whose response is **not** the parent detail, treat the open parent as stale and load the parent detail again before showing `updatedBy`.
- Keep list and search types **without** these keys.

### 2.2 Out of scope — do not implement

| Item | Reason |
|------|--------|
| `createdBy` / `updatedBy` on list rows, search rows, or table columns fed by list APIs | Those JSON bodies do not include the keys |
| `createdBy` / `updatedBy` on locations, layoffs, achievements, work experiences, educations, call notes, or resumes | Those records have no such columns |
| Sending `createdBy` or `updatedBy` on POST, PUT, or PATCH | Server ignores them and writes the signed-in user |
| Backfill UI for old rows | No backfill. Old rows stay `createdBy: null` until they were created after `created_by_user_id` existed |
| Hiding the fields from Recruiters | Recruiters receive the same two keys on candidate detail |
| Treating admin recalculate as an update | Those endpoints do not change `updatedBy` |

### 2.3 UX (frontend-owned)

The API does not specify screens, components, or copy. The frontend decides where the two people appear, whether email is visible, and what to show when a value is `null`.

Hard requirements:

| Requirement | Detail |
|-------------|--------|
| **Null is valid** | A missing creator or editor is `null`, not omitted. Do not crash on `null` |
| **Do not derive one from the other** | `createdBy` can be `null` while `updatedBy` is set. `updatedAt` can stay unchanged when `updatedBy` changes |
| **Identity** | `id` is the user id. Display text comes from `fullName` and, if the UI wants it, `email` |
| **Soft-deleted users** | Still returned as `{ id, fullName, email }` using the user’s current name and email |
| **Stale parent** | Child save responses listed in §6 do not contain the parent’s new `updatedBy` |

---

## 3. Access

All `/api/**` routes require a Bearer token (fallback policy). These two fields do not add a new permission check.

| Role | Candidate detail | Employer, project, university, certification detail |
|------|------------------|-----------------------------------------------------|
| **0** SuperAdmin | Full candidate detail, including both fields | Both fields |
| **1** Admin | Full candidate detail, including both fields | Both fields |
| **2** Recruiter | Recruiter candidate detail (no candidate salary), **including both fields** | Both fields on the same detail objects as Admin |

Candidate **PUT** and candidate section writes stay **AdminOnly** (`403` for Recruiter), as they are today. Recruiter **GET** ` /api/candidates/{id}` and recruiter **POST** `/api/candidates` still return the recruiter detail shape, now with the two extra keys.

---

## 4. Payload

Both keys are always present on the objects in §5. Values use camelCase.

```json
"createdBy": null,
"updatedBy": null
```

```json
"createdBy": {
  "id": 12,
  "fullName": "Aisha Khan",
  "email": "aisha.khan@example.com"
},
"updatedBy": {
  "id": 4,
  "fullName": "Omar Ali",
  "email": "omar.ali@example.com"
}
```

| Field | Type | Notes |
|-------|------|--------|
| `id` | number | User id. Present only when the parent object is non-null |
| `fullName` | string | Current name, including when that user is soft-deleted |
| `email` | string | Current email, including when that user is soft-deleted |

There is no `role` on this object.

### 4.1 How the server fills them

| Action | `createdBy` | `updatedBy` |
|--------|-------------|-------------|
| `POST` of a candidate, employer, project, university, or certification | Signed-in user | Signed-in user (same person on that first save) |
| Later parent `PUT` or `PATCH` that changes the parent | Unchanged | Signed-in user |
| Nested writes in §6 | Unchanged | Signed-in user on the **parent** row |
| `PATCH /api/universities/{id}` when every sent field is already the stored value | Unchanged | Unchanged |
| Admin recalculate endpoints in §7 | Unchanged | Unchanged |
| Rows created before a creator was stored | `null` | `null` until a later edit sets `updatedBy` only |

`POST /api/candidates` only **links** existing employer, project, university, certification, and location ids. It does not create those records and does not set **their** `createdBy`. Creating those records is still their own `POST`.

---

## 5. Responses that include the keys

Appended after `updatedAt`. Every other property on these objects is unchanged.

### 5.1 Candidates

| Call | Who | Body |
|------|-----|------|
| `GET /api/candidates/{id}` | Admin, SuperAdmin | Existing candidate detail **plus** `createdBy`, `updatedBy` |
| `GET /api/candidates/{id}` | Recruiter | Existing recruiter detail (no candidate salary; work experiences without compensation) **plus** `createdBy`, `updatedBy` |
| `POST /api/candidates` | Admin, SuperAdmin | **201** and the same detail object as Admin GET |
| `POST /api/candidates` | Recruiter | **201** and the same recruiter detail object as Recruiter GET |
| `PUT /api/candidates/{id}` | Admin, SuperAdmin (`AdminOnly`) | **200** and the Admin detail object |

`GET /api/candidates` (paged list, both role shapes) does **not** include the keys. Do not add them to list item types.

### 5.2 Employers, universities, certifications

Detail, create, and update use one object per module. List and search use other objects and are unchanged.

| Call | Status | Keys |
|------|--------|------|
| `GET /api/employers/{id}` | 200 | Yes |
| `POST /api/employers` | 201 | Yes |
| `PUT /api/employers/{id}` | 200 | Yes |
| `GET /api/universities/{id}` | 200 | Yes |
| `POST /api/universities` | 201 | Yes |
| `PUT /api/universities/{id}` | 200 | Yes |
| `PATCH /api/universities/{id}` | 200 | Yes. `updatedBy` changes only when at least one scalar actually changes |
| `GET /api/certifications/{id}` | 200 | Yes |
| `POST /api/certifications` | 201 | Yes |
| `PUT /api/certifications/{id}` | 200 | Yes |

Unchanged (no keys): `GET /api/employers`, `GET /api/universities`, `GET /api/certifications`, and their `/search` routes.

`PATCH /api/universities/{universityId}/locations/{locationId}` returns the **university** detail, so that body **does** include `createdBy` and `updatedBy`. See §6 for when `updatedBy` moves.

### 5.3 Projects — split the list type and the detail type

List and detail are no longer the same JSON object.

| Call | Object |
|------|--------|
| `GET /api/projects` | Existing project list item. **No** `createdBy` or `updatedBy`. Do not add optional null keys |
| `GET /api/projects/search` | `{ "id", "name" }` only |
| `GET /api/projects/{id}` | Existing project detail **plus** `createdBy`, `updatedBy` |
| `POST /api/projects` | **201** and that same detail object |
| `PUT /api/projects/{id}` | **200** and that same detail object |

If the frontend currently uses one TypeScript type for project list and project detail, split it. Parsing a list item as the detail type will see `createdBy` and `updatedBy` as missing.

---

## 6. Nested writes that change the parent’s `updatedBy`

These do **not** change the parent’s `createdBy`. They do **not** add audit fields to the child JSON. Except for the one university location PATCH in the table, the response is not the parent, so refetch `GET` of the parent before showing `updatedBy`.

`updatedAt` on the parent is **not** a signal for this. Some of these writes change `updatedBy` without changing the parent’s `updatedAt`.

### 6.1 Candidate

Refetch `GET /api/candidates/{id}` (recruiter or admin shape, matching the signed-in role).

| Write | Response the client already gets | Parent `updatedBy` |
|-------|----------------------------------|--------------------|
| `POST /api/candidates/{candidateId}/work-experiences` | Work experience | Set |
| `PUT /api/candidates/{candidateId}/work-experiences/{id}` | Work experience | Set |
| `DELETE /api/candidates/{candidateId}/work-experiences/{id}` | **204** | Set |
| Work-experience time-support zones, benefits, tech stacks, and projects (`POST`, `PUT`, `DELETE` under `.../work-experiences/{id}/...`) | Child object or **204** | Set. Includes employer, employer location, start date, and end date on the work-experience PUT |
| `POST /api/candidates/{candidateId}/educations` | Education | Set |
| `PUT /api/candidates/{candidateId}/educations/{id}` | Education | Set |
| `DELETE /api/candidates/{candidateId}/educations/{id}` | **204** | Set |
| `PUT /api/candidates/{candidateId}/certifications` | Candidate–certification link | Set. This does **not** set `updatedBy` on `GET /api/certifications/{certificationId}` |
| `DELETE /api/candidates/{candidateId}/certifications/{certificationId}` | **204** | Set on the **candidate** |
| `POST /api/candidates/{candidateId}/achievements` | Achievement | Set |
| `PUT /api/candidates/{candidateId}/achievements/{id}` | Achievement | Set |
| `DELETE /api/candidates/{candidateId}/achievements/{id}` | **204** | Set |
| `POST /api/candidates/{candidateId}/tech-stacks` | Tech stack link | Set |
| `DELETE /api/candidates/{candidateId}/tech-stacks/{techStackId}` | **204** | Set |
| `PATCH /api/candidates/{candidateId}/call-notes` | `{ "callNotes" }` | Set |
| `POST /api/candidates/{candidateId}/resume/confirm` | Resume metadata | Set |
| `DELETE /api/candidates/{candidateId}/resume` | **204** | Set when a resume was deleted |

Does **not** set `updatedBy`:

- `POST /api/candidates/{candidateId}/resume/upload-url`
- `GET /api/candidates/{candidateId}/resume/open-url`
- `GET /api/candidates/{id}/data-progress`

Changing the employer **on a work experience** updates the **candidate**. It does not update that employer’s `updatedBy`.

### 6.2 Employer

Refetch `GET /api/employers/{id}` after location and layoff writes. `PUT /api/employers/{id}` already returns the employer detail, including the new `updatedBy`.

| Write | Response | Parent `updatedBy` |
|-------|----------|--------------------|
| `POST /api/employers/{employerId}/locations` | Location | Set |
| `PUT /api/employers/{employerId}/locations/{id}` | Location | Set |
| `DELETE /api/employers/{employerId}/locations/{id}` | **204** | Set |
| `POST /api/employers/{employerId}/layoffs` | Layoff | Set |
| `PUT /api/employers/{employerId}/layoffs/{id}` | Layoff | Set |
| `DELETE /api/employers/{employerId}/layoffs/{id}` | **204** | Set |

Locations and layoffs sent **inside** `POST /api/employers` are part of that first save. The **201** employer body already has both audit fields. Do not expect those new location rows to have their own `createdBy`.

### 6.3 University

| Write | Response | What to do |
|-------|----------|------------|
| `PATCH /api/universities/{id}` | University detail | Use the response. If nothing changed, `updatedBy` is the previous value |
| `PATCH /api/universities/{universityId}/locations/{locationId}` | **University** detail | Use the response. `updatedBy` is the signed-in user when the location patch writes or recalculates progress (`city`, `address`, or `isMainCampus`) |
| `POST /api/universities/{universityId}/locations` | Location | Refetch `GET /api/universities/{universityId}` |
| `PUT /api/universities/{universityId}/locations/{id}` | Location | Refetch the university |
| `DELETE /api/universities/{universityId}/locations/{id}` | **204** | Refetch the university |

Location objects still have no `createdBy` or `updatedBy`.

### 6.4 Projects and certifications

No nested controllers. Only their own `PUT` sets `updatedBy`, and that `PUT` returns the detail object. Linking a project from a candidate work experience updates the **candidate**, not the project.

---

## 7. Writes that must not move `updatedBy`

Do not refresh the audit display as if these were user edits. They leave both columns unchanged.

| Call |
|------|
| `POST /api/admin/candidates/recalculate-data-progress` |
| `POST /api/admin/candidates/recalculate-total-experience` |
| `POST /api/admin/candidates/recalculate-derived-fields` |
| `POST /api/admin/employers/recalculate-data-progress` |
| `POST /api/admin/projects/recalculate-data-progress` |
| `POST /api/admin/universities/recalculate-data-progress` |
| `POST /api/admin/certifications/recalculate-data-progress` |

`GET .../data-progress` responses are unchanged and do not include `createdBy` or `updatedBy`.

---

## 8. Frontend agent checklist

1. Discover the existing API client and detail screens in the Next.js repo. Do not invent file paths from this backend repo.
2. Add a shared user-audit type: `{ id: number; fullName: string; email: string } | null`.
3. Add `createdBy` and `updatedBy` only to the five **detail** types, including the recruiter candidate detail type.
4. Split the project **list** type from the project **detail** type. List stays without the keys.
5. Leave list, search, data-progress, achievement list (`GET /api/achievements`), and nested child types unchanged.
6. On parent POST, PUT, and university PATCH, read the keys from the response body.
7. On the nested writes in §6 whose body is not the parent, refetch the parent detail before rendering `updatedBy`.
8. Render `null` as unknown. Do not substitute the current user, and do not hide the field only because the viewer is a Recruiter.
9. Do not add the keys to contribution-count screens or to the `createdByUserId` list filter.

---

## 9. Quick verification

| Step | Expected |
|------|----------|
| `GET` an old parent created before creators were stored | `200`, both keys `null`, list payload for that module unchanged |
| `POST` any of the five parents as a signed-in user | `201` detail includes that user on **both** keys |
| `PUT` that parent as a different user | `createdBy` stays the first user; `updatedBy` is the editor |
| Recruiter `GET /api/candidates/{id}` | Recruiter detail, no candidate salary, both keys present |
| `GET /api/projects` versus `GET /api/projects/{id}` | List items have no audit keys; detail has both |
| Confirm a resume, then `GET` the candidate | Candidate `updatedBy` is the confirming user; confirm response itself has no audit keys |
| `POST /api/admin/candidates/recalculate-derived-fields`, then `GET` a candidate | `updatedBy` unchanged |
