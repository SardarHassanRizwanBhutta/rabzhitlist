# Backend contract: nested `project` on candidate work-experience links

Handoff for **`GET /api/candidates/{id}`** only. Each `workExperiences[].projects[]` item may include a trimmed, **live** `project` object for domain badges and team size without a separate `GET /api/projects/{id}`.

---

## 1. Nested DTO

**Path:** `workExperiences[].projects[].project` (optional)

| Property | Type | Source |
|----------|------|--------|
| `verticalDomains` | `string[]` | Project vertical domain catalog ids → **display names** |
| `horizontalDomains` | `string[]` | Project horizontal domain catalog ids → **display names** |
| `averageTeamSize` | `number \| null` | Same field as `GET /api/projects/{id}` |

**Not included:** `id`, `name`, `type`, `techStacks`, `technicalDomains`, `technicalAspects`, etc.

**Unchanged junction fields:** `workExperienceId`, `projectId`, `projectName`, `type`, `contribution`, `isMainContribution`.

---

## 2. vs full project GET

| Endpoint | Domain fields |
|----------|----------------|
| `GET /api/projects/{id}` | `verticalDomains` / `horizontalDomains` as **`number[]`** (catalog ids) |
| `GET /api/candidates/{id}` → `projects[].project` | Same domains as **`string[]`** (display names only) |

---

## 3. When `project` is present

**Serialization rule:** If there is no nested catalog payload, the **`project` property is omitted entirely**. The API never returns `"project": null`.

| Condition | `project` in JSON |
|-----------|-------------------|
| `projectId` set, project row exists, **`deleted_at` is null** | Object with three fields |
| Project **soft-deleted** | **Property omitted** (not `null`) |
| Missing project row (orphan `project_id`) | **Property omitted** (not `null`) |
| Other endpoints (e.g. `GET /api/candidates/{id}/work-experiences/{weId}`) | **Property omitted** (no batched load on those routes) |

Empty domain lists are **`[]`**, not `null`. `averageTeamSize` is `null` when the project has no value (same as project GET).

Domain name order: **`vertical_domain_id` / `horizontal_domain_id` ascending** on the project join rows (stable; matches id list order for typical assignments).

---

## 4. Performance

`GetByIdAsync` collects distinct `projectId`s across all work experiences, then **one batched query** (`GetLinkedCatalogSummariesByIdsAsync`) — no per-link N+1.

---

## 5. QA

- Candidate **192**, WE **453**, project **138**: `project.horizontalDomains` has three names for catalog ids 3, 5, 11; `project.averageTeamSize === 5`.
- Edit project domains in admin → **candidate GET updates** without saving the candidate.
- Soft-deleted project: junction row still returned; **`project` omitted**.

---

## 6. Frontend

`parseLinkedProjectCatalogFromApi` reads `raw.project.verticalDomains`, `horizontalDomains`, `averageTeamSize` as **`string[]`** / number. No client catalog fetch required for these badges.

**Candidate details modal:** loads `GET /api/candidates/{id}` only (no `enrichWorkExperiencesWithProjectCatalog` on open/refresh). Cold Caller may still enrich sparse payloads separately.
