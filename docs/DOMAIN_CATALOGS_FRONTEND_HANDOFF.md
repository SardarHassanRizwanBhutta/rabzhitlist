# Frontend handoff: domain catalogs + Technical Aspect Types JSON

Handoff for the frontend agent after backend converted **Vertical Domain**, **Horizontal Domain**, **Technical Domain**, and **Technical Aspect** from Postgres/C# enums into master tables, and aligned **Technical Aspect Type** list JSON with Benefit.

JSON uses ASP.NET Core default **camelCase**.

**Do not hardcode catalog ids.** Always read `id` from the list GET for the environment you are calling. Seed **names** below are for QA only.

This document does **not** cover other recent backend work (for example work-experience `employerLocationId`).

---

## 1. What changed (breaking)

| Area | Before | After |
|------|--------|--------|
| Domain list GET | `{ value, label }[]` (enum ordinal + PascalCase or similar) | `{ id, name }[]` — same shape as Benefit |
| Domain list values | 0-based enum integers | Catalog table primary keys (`bigint`) |
| Project GET/create/update fields `verticalDomains`, `horizontalDomains`, `technicalDomains`, `technicalAspects` | Enum integers | Same JSON names; values are catalog **ids** from the list GET |
| Project / candidate / employer **filters** for those four fields | Enum integers | Catalog **ids** |
| `GET /api/TechnicalAspectTypes` | `{ value, label }[]` | `{ id, name }[]` (`id` is the same integer that used to be `value`) |
| Horizontal options | 12 enum values | 16 catalog rows (4 extra names; see §5) |
| C# enums `VerticalDomain`, `HorizontalDomain`, `TechnicalDomain`, `TechnicalAspect` | Used by API | **Removed.** Do not call them from FE maps |

**Not an enum, not converted in this work:** `TechnicalAspectType` is table `technical_aspect_types` (tech-stack grouping). See §6.

**Still enums (unchanged):** `projectTypes` / `type`, `projectStatuses` / `status`, `publishPlatforms`, etc.

---

## 2. Two different “aspect” APIs (do not mix)

| UI | Table | List endpoint | Ids used for |
|----|--------|---------------|----------------|
| Project **Technical Aspects** (project form / filters) | `technical_aspects` | `GET /api/TechnicalAspects` | `technicalAspects` on projects; filter `TechnicalAspects` |
| **Technical Aspect Types** (group tech stacks, then select/create stacks) | `technical_aspect_types` | `GET /api/TechnicalAspectTypes` | `technicalAspectTypeId` / `technicalAspectTypeIds`; `CreateTechStackDto.technicalAspectTypeIds` |

There is **no** tech-stack join to `technical_aspects`. Stacks join only to **aspect types** via `technical_aspect_type_tech_stacks`. That join was **not** changed by the domain-catalog migration.

---

## 3. Catalog list endpoints (GET-only)

Same JSON as Benefit: `{ "id": <number>, "name": "<display text>" }`.

No POST / PUT / DELETE / GET-by-id for these catalogs.

| Method | Route | Order | Notes |
|--------|--------|--------|--------|
| GET | `/api/VerticalDomains` | `id` ascending | All seeded rows |
| GET | `/api/HorizontalDomains` | `id` ascending | All seeded rows, including 4 new names |
| GET | `/api/TechnicalDomains` | `id` ascending | All seeded rows |
| GET | `/api/TechnicalAspects` | `id` ascending | All seeded rows |
| GET | `/api/TechnicalAspectTypes` | `sortOrder`, then `displayName` | **Active rows only** (`is_active`). `name` = `display_name` |

Example:

```json
[
  { "id": 1, "name": "Banking" }
]
```

Use `id` as the control value and `name` as the label. Drop local enum ordinal → label maps for these five lists.

---

## 4. Projects

Routes unchanged: `GET/POST /api/Projects`, `GET/PUT/DELETE /api/Projects/{id}`.

### 4.1 GET project (list item and by id)

Fields (camelCase):

- `verticalDomains`: `number[]` — catalog ids from `GET /api/VerticalDomains`
- `horizontalDomains`: `number[]` — catalog ids from `GET /api/HorizontalDomains`
- `technicalDomains`: `number[]` — catalog ids from `GET /api/TechnicalDomains`
- `technicalAspects`: `number[]` — catalog ids from `GET /api/TechnicalAspects`

These are **ids only**, not `{ id, name }`. Resolve labels from the list GET (or a map built from it).

Unrelated to this change (still present): `techStacks` is `string[]` (names); `aspectTypeLabels` is `string[]` (aspect-**type** display names derived from the project’s tech stacks).

### 4.2 POST create / PUT update body

JSON property names **unchanged**. Types are catalog ids:

```json
{
  "name": "Example",
  "verticalDomains": [1, 4],
  "horizontalDomains": [1],
  "technicalDomains": [1],
  "technicalAspects": [1, 6],
  "techStackIds": [12]
}
```

Omit or send `[]` / `null` when empty (same as other optional id arrays).

Do **not** send old enum ordinals (e.g. Banking used to be `0`; it is **not** `0` anymore).

### 4.3 GET `/api/Projects` filters

Query parameters (repeat for multi-value OR), values = catalog ids:

- `VerticalDomains`
- `HorizontalDomains`
- `TechnicalDomains`
- `TechnicalAspects`

Example: `GET /api/Projects?VerticalDomains=1&VerticalDomains=4`

`TechStackIds` is unchanged (tech stack catalog ids).

---

## 5. Seed display names (QA only — not a substitute for GET)

Inserted by migration `20260907040000_ConvertDomainEnumsToCatalogTables`. Existing project join rows were remapped; they were not dropped.

### Vertical (`name`)

Banking; Financial Services; Insurance; Healthcare; Retail; E-commerce; Telecommunications; Manufacturing; Automotive; Real Estate / Property Management; Travel & Hospitality; Logistics & Supply Chain; Energy & Utilities; Education; Government / Public Sector; Media & Entertainment; Agriculture; Aviation; Pharma / Life Sciences; Gaming; Legal; Fitness & Wellness; Sports; Facilities Management; Cross-Industry / Enterprise; Information Technology / Software; Transportation; Non-Profit & NGOs.

### Horizontal (`name`)

CRM (Customer Relationship Management); ERP (Enterprise Resource Planning); HR / HRMS; Finance & Accounting; Identity & Access Management; Document Management; Payment Processing; Analytics & Business Intelligence; Marketing Automation; Customer Support / Helpdesk; Notification Systems; Workflow / BPM;

**New (were not in the old enum):**

- Smart Parking Management System (SPMS)
- Quotation Management System (QMS)
- Ticket Management System
- Order Management System (OMS)

### Technical domain (`name`)

Cloud Computing; Artificial Intelligence (AI); Machine Learning (ML); Data Science & Analytics; Big Data; Cybersecurity; DevOps; Internet of Things (IoT); Blockchain; Robotic Process Automation (RPA); API Management & Integration; Microservices Architecture; Containerization & Orchestration; Edge Computing; Augmented Reality (AR); Virtual Reality (VR); Mixed Reality (MR); Digital Transformation; Low-Code / No-Code Platforms; Enterprise Integration Platforms; Identity & Access Management; Data Governance & Compliance; Quantum Computing (Emerging); 5G & Advanced Networking.

### Technical aspect (`name`) — project catalog, `GET /api/TechnicalAspects`

Software Development; Frontend Development; Backend Development; Mobile App Development; Cloud Infrastructure; DevOps & CI/CD; Containerization & Orchestration; Database Management; Data Engineering; Data Analytics & BI; AI/ML Implementation; Cybersecurity Implementation; API Development & Integration; Networking & System Administration; Enterprise Systems (ERP/CRM); Quality Assurance & Testing; UI/UX Design & Implementation; Monitoring & Logging; IT Operations & Support; Automation & RPA; Blockchain Development; IoT Development; AR/VR Development; Authentication & Authorization; Real-Time Communication & Messaging.

---

## 6. Technical Aspect Types + tech stacks (mostly unchanged)

Table `technical_aspect_types` + join `technical_aspect_type_tech_stacks`. **Not** a Postgres enum.

### 6.1 List JSON (breaking keys only)

`GET /api/TechnicalAspectTypes`

```json
[
  { "id": 1, "name": "Software Development" }
]
```

- `id` = same catalog PK previously sent as `value` (and as `technicalAspectTypeIds` / `technicalAspectTypeId`).
- `name` = same text previously sent as `label` (`display_name`).
- Inactive types are omitted.

### 6.2 Filter stacks by type

`GET /api/TechStacks?technicalAspectTypeId={id}`  
(also accepts `TechnicalAspectTypeId`)

Unchanged except the id now comes from `{ id }` not `{ value }`.

### 6.3 Create / update stack under types

`POST /api/TechStacks` body still:

```json
{
  "name": "React",
  "technicalAspectTypeIds": [1]
}
```

`PUT` may send `technicalAspectTypeIds` the same way. Ids are `technical_aspect_types.id`.

Candidate list filter `technicalAspectTypeIds` is **unchanged** (still aspect-**type** ids, via project tech stacks).

---

## 7. Candidate list filters

`GET /api/Candidates`

| Query param | Value | Source list |
|-------------|--------|-------------|
| `VerticalDomains` | catalog id(s) | `/api/VerticalDomains` |
| `HorizontalDomains` | catalog id(s) | `/api/HorizontalDomains` |
| `TechnicalDomains` | catalog id(s) | `/api/TechnicalDomains` |
| `TechnicalAspects` | catalog id(s) | `/api/TechnicalAspects` |
| `TechnicalAspectTypeIds` | aspect-**type** id(s) | `/api/TechnicalAspectTypes` |
| `TechStackIds` | tech stack id(s) | `/api/TechStacks` |

OR within each array; AND across different params (existing behavior).

### `matchedProjects` on list items

When project-expertise filters are active, each matched project still has:

- `verticalDomains` / `horizontalDomains` / `technicalDomains`: `{ id, label }[]`
  - `id` = **catalog id** (same as the filter)
  - `label` = catalog **display name** (no longer PascalCase enum `.ToString()`)
- `technicalAspectTypes`: `{ id, label }[]` — aspect-**type** catalog id + display name
- `techStacks`: `{ id, label }[]` — tech stack id + name

There is **no** `technicalAspects` array on `matchedProjects` (project Technical Aspect catalog). Filtering by `TechnicalAspects` still filters candidates; chips for that field are not on this DTO.

`status` / `projectType` on matched projects remain enum-based `{ id, label }` (unchanged).

---

## 8. Employer list filters

`GET /api/Employers`

Query params `VerticalDomains`, `HorizontalDomains`, `TechnicalDomains`, `TechnicalAspects`: send **catalog ids**, same as projects. `TechStacks` remains tech stack ids.

---

## 9. Frontend implementation checklist

- [ ] Replace hardcoded enum ordinal maps for vertical / horizontal / technical domain / technical aspect with data from the four domain list GETs (`id` + `name`).
- [ ] Switch `GET /api/TechnicalAspectTypes` parsing from `value`/`label` to `id`/`name`; keep using that `id` for stack filter/create and `technicalAspectTypeIds`.
- [ ] Project create/update/GET: treat domain/aspect arrays as catalog ids; show names via the list GET.
- [ ] Project, candidate, and employer filters: send catalog ids, not `0, 1, 2, …` enum ordinals.
- [ ] Add UI options for the four new horizontal names after they appear on `GET /api/HorizontalDomains`.
- [ ] Update `matchedProjects` domain chips to use `label` as display text (catalog name) and `id` as catalog id.
- [ ] Do not point tech-stack grouping at `GET /api/TechnicalAspects`.
- [ ] Confirm the target API environment has applied migration `20260907040000_ConvertDomainEnumsToCatalogTables` (local already has). Old API + new FE or new API + old FE will mismatch ids.

---

## 10. Out of scope / unchanged

- Benefit / Degree CRUD and `{ id, name }` (already the pattern).
- Tech stack ↔ aspect-**type** rows (not dropped by the domain migration).
- ProjectType, ProjectStatus, PublishedPlatform, and other remaining enums.
- Catalog write APIs (none for these domain/aspect tables).
