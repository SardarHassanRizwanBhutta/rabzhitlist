# Backend Task: `matchedCertifications` on the Candidates List Response

This document is a ready-to-forward brief + prompt for the backend AI agent. It
explains the goal, the existing contract that must not change, the new response
structure, and the exact semantics. Hand the **"Prompt to forward"** section to
the backend agent verbatim.

Reference integration guide: `docs/CandidateFilterIntegration copy 8.md` (Certification
filters table). After implementation, add a **`matchedCertifications`** response
section there mirroring `matchedEducations`.

---

## 1. Background / Why

The candidates **Cards View** (and Table match summary) shows a per-candidate
**"Certifications"** match category when Professional Certification filters are
active (certification catalog id, issuing body, certification level).

For each qualifying **candidate certification row**, the UI renders the
**certification name** as the item heading with matched values as **badges**
beneath it (e.g. certification name, issuing body, level).

The backend already filters the candidate list correctly via certification-related
query params (see §2), but the list response carries **no per-candidate
certification match data**. The list mapper sets `certifications: []`, so the
frontend cannot show *which* certification rows caused the match.

We need the backend to return **matched values, grouped by candidate certification
row**, mirroring `matchedProjects`, `matchedEmployers`, `matchedWorkExperiences`,
and `matchedEducations`.

This is a **lean "matched values only"** payload (not full certification graphs),
**one entry per matching candidate certification row** (not deduped by catalog
`certificationId` — a candidate may hold the same cert twice with different
issue/expiry dates).

---

## 2. Existing contract — DO NOT CHANGE

- **Endpoint:** `GET /api/candidates` (paged list). Response: `PagedResult<CandidateListItemDto>`.
- **Certification filtering already works** and must remain unchanged:

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `certificationId` | `long?` | has value | candidate has any certification row with this `CertificationId` |
| `issuingBodyIds` | `long[]?` | length > 0 | candidate has any certification whose `Certification.IssuerId` is in array |
| `certificationLevels` | `CertificationLevel[]?` | length > 0 | candidate has any certification whose `Level` is non-null and in array |

- **Frontend wiring today** (`src/components/candidates-page-client.tsx`):
  - Filter dialog stores catalog ids in `certificationNames[]`; API sends **one**
    `certificationId` (first numeric id). URL chip `?certificationId=` is merged
    into that array for match summary.
  - `certificationIssuingBodies[]` (issuer **names** in UI) → resolved to
    `issuingBodyIds` via issuer lookup.
  - `certificationLevels[]` (DB keys: `foundation`, `associate`, …) → enum ints
    on the query string.

- **`CertificationLevel` enum** (same integers as create/update; frontend index order):
  `0` Foundation, `1` Associate, `2` Professional, `3` Expert, `4` Master.

- Keep all existing list-item fields exactly as they are. The change below is **purely
  additive**.

---

## 3. UI contract (Cards View)

- **Category:** `Certifications` (orange panel, Award icon in Cards View).
- **One item per matching candidate certification row** — heading =
  **`certificationName`** (catalog display name).
- **Badges** (only for active driver filters with non-empty intersection on that row):

| Badge type (frontend) | Label | When shown |
|-----------------------|-------|------------|
| `certification` | Certification | `certificationId` filter active **and** this row matched via catalog id (`matchedByCertificationId: true`) |
| `issuingBody` | Issuing Body | `issuingBodyIds` filter active **and** `issuingBody != null` on item |
| `level` | Certification Level | `certificationLevels` filter active **and** `level != null` on item |

- **Context (table / future use, not filter-driven badges):** `issueDate`, `expiryDate`
  on the row when present (ISO `DateOnly`). Cards View may show these later; include
  them on the DTO for parity with the legacy mock.

---

## 4. What to add — `matchedCertifications`

Add a new field to each candidate **list item**:

```jsonc
"matchedCertifications": [
  {
    "candidateCertificationId": 1201,
    "certificationId": 55,
    "certificationName": "AWS Solutions Architect – Associate",
    "matchedByCertificationId": true,
    "issuingBody": { "id": 3, "label": "Amazon Web Services" },
    "level": { "id": 1, "label": "Associate" },
    "issueDate": "2022-03-15",
    "expiryDate": "2025-03-15"
  }
]
```

### Field meaning

| Field | Type | Required on item | Notes |
|-------|------|------------------|-------|
| `candidateCertificationId` | `long` | Yes | Stable id of `candidate_certifications` (or equivalent join row). **One entry per matching row.** |
| `certificationId` | `long \| null` | Yes | Catalog `CertificationId` on the row when present. |
| `certificationName` | `string \| null` | Yes | Catalog display name — **Cards heading**. Fallback allowed server-side from catalog. |
| `matchedByCertificationId` | `boolean` | Yes | `true` only when **`certificationId`** query filter is active **and** this row's catalog id equals the requested id. Otherwise `false`. |
| `issuingBody` | `{ id: long, label: string } \| null` | Yes | Intersection with requested **`issuingBodyIds`** filter (issuer catalog id + name). `null` when issuer filter inactive or no match on this row. |
| `level` | `{ id: int, label: string } \| null` | Yes | Intersection with requested **`certificationLevels`** filter. `null` when level filter inactive or row level null / no match. Enum `id` = same integer as query param. |
| `issueDate` | `string \| null` | Yes | ISO `DateOnly` from row; contextual display. |
| `expiryDate` | `string \| null` | Yes | ISO `DateOnly` from row; contextual display. |

Each matched enum/catalog value uses `{ id, label }`:

- `id` — the **same integer** the corresponding query-param filter accepts.
- `label` — server-normalized display text (issuer name, level display name, etc.).

---

## 5. When to compute

Compute when **any** of these query filters is active:

- `certificationId`
- `issuingBodyIds`
- `certificationLevels`

Otherwise → `matchedCertifications: []` (**never** `null`).

Certification driver filters should trigger **`matchedCertifications`** on the list
response (add a note in `CandidateFilterIntegration copy 8.md` under Certification
filters, same as education drivers → `matchedEducations`).

---

## 6. Row inclusion semantics

**List filter (unchanged):** active filters combine with **logical AND** at the
candidate level (each filter type uses `.Any(...)` on related rows).

**`matchedCertifications` (per row):** include a candidate certification row only
if it satisfies the **frontend mock row rules** below (preserves current Cards
View design in `src/lib/utils/candidate-matches.ts`):

Let:

- `needCert` = `certificationId` filter active
- `needIssuer` = `issuingBodyIds` filter active
- `needLevel` = `certificationLevels` filter active
- `certMatch` = row's catalog id equals requested `certificationId`
- `issuerMatch` = row's issuer id ∈ requested `issuingBodyIds`
- `levelMatch` = row's level ∈ requested `certificationLevels`

**Name / issuer group** (`certIssuerOk`):

| needCert | needIssuer | certIssuerOk |
|----------|------------|--------------|
| false | false | `true` |
| true | false | `certMatch` |
| false | true | `issuerMatch` |
| true | true | `certMatch \|\| issuerMatch` |

**Row included when:**

```
certIssuerOk && (!needLevel || levelMatch)
```

Examples:

- Level only → rows with matching level.
- Cert id only → rows with matching catalog id.
- Cert id + level → rows matching **both** cert id **and** level.
- Cert id + issuer (both active) → rows matching cert id **or** issuer (either suffices for the name/issuer group); level still ANDed when level filter active.

**Matched-only fields:** each scalar/array field on the item holds only the
**intersection** with its filter. Inactive sub-filters → `null` /
`matchedByCertificationId: false` as documented.

**Ordering:** items ordered by `candidateCertificationId` ascending.

**Deduping:** do **not** dedupe by `certificationId`; repeated rows stay distinct.

---

## 7. Samples

### Certification id only (URL chip)

```
GET /api/candidates?certificationId=55
```

```json
{
  "matchedCertifications": [
    {
      "candidateCertificationId": 1201,
      "certificationId": 55,
      "certificationName": "AWS Solutions Architect – Associate",
      "matchedByCertificationId": true,
      "issuingBody": null,
      "level": null,
      "issueDate": "2022-03-15",
      "expiryDate": "2025-03-15"
    }
  ]
}
```

### Issuing body + level

```
GET /api/candidates?issuingBodyIds=3&certificationLevels=1&certificationLevels=2
```

```json
{
  "matchedCertifications": [
    {
      "candidateCertificationId": 1201,
      "certificationId": 55,
      "certificationName": "AWS Solutions Architect – Associate",
      "matchedByCertificationId": false,
      "issuingBody": { "id": 3, "label": "Amazon Web Services" },
      "level": { "id": 1, "label": "Associate" },
      "issueDate": "2022-03-15",
      "expiryDate": "2025-03-15"
    }
  ]
}
```

### All three drivers (cert id + issuer + level)

Row appears when `(certMatch || issuerMatch) && levelMatch`. Fields populated only
for intersections:

```
GET /api/candidates?certificationId=55&issuingBodyIds=3&certificationLevels=1
```

```json
{
  "matchedCertifications": [
    {
      "candidateCertificationId": 1201,
      "certificationId": 55,
      "certificationName": "AWS Solutions Architect – Associate",
      "matchedByCertificationId": true,
      "issuingBody": { "id": 3, "label": "Amazon Web Services" },
      "level": { "id": 1, "label": "Associate" },
      "issueDate": "2022-03-15",
      "expiryDate": "2025-03-15"
    }
  ]
}
```

---

## 8. Frontend mapping (after backend ships)

| Layer | File | Planned behavior |
|-------|------|------------------|
| Type | `src/lib/types/candidate.ts` | `MatchedCertificationDto` + `Candidate.matchedCertifications` |
| Mapper | `src/lib/services/candidates-api.ts` | `mapMatchedCertifications()` in list DTO → `Candidate` |
| Match summary | `src/lib/utils/candidate-matches.ts` | `hasBackendMatchedCertificationFilterDrivers()`, `appendBackendMatchedCertificationItems()` — skip mock `candidate.certifications` loop when backend payload present |
| Cards colors | `src/components/candidates-cards-view.tsx` | Criterion types already defined: `certification`, `issuingBody`, `level` |
| URL chip | `candidates-page-client.tsx` | `certificationNames[]` + `certificationFilter` merge already wired |

List filtering for certification drivers is **already wired** in
`src/components/candidates-page-client.tsx` → `fetchCandidatesPage`.

---

## 9. Prompt to forward

> We have an existing paged endpoint `GET /api/candidates` returning
> `PagedResult<CandidateListItemDto>`. It already supports Professional Certification
> filtering (`certificationId`, `issuingBodyIds`, `certificationLevels`). That
> filtering works correctly. **Do not change the existing query-param contract or
> filtering behavior.**
>
> **Task (additive only):** Add a new field `matchedCertifications` to each item in
> the candidates list response so the frontend can show which certification rows
> caused the match in the Cards View "Certifications" summary (mirroring
> `matchedProjects`, `matchedEmployers`, `matchedWorkExperiences`, and
> `matchedEducations`).
>
> **Shape (per candidate list item):**
> ```jsonc
> "matchedCertifications": [
>   {
>     "candidateCertificationId": 1201,
>     "certificationId": 55,
>     "certificationName": "AWS Solutions Architect – Associate",
>     "matchedByCertificationId": true,
>     "issuingBody": { "id": 3, "label": "Amazon Web Services" },
>     "level": { "id": 1, "label": "Associate" },
>     "issueDate": "2022-03-15",
>     "expiryDate": "2025-03-15"
>   }
> ]
> ```
>
> **Semantics:**
> 1. **Drivers:** compute when any of `certificationId`, `issuingBodyIds`,
>    `certificationLevels` is active. Otherwise `"matchedCertifications": []`
>    (never null).
> 2. **One entry per candidate certification row** — not deduped by catalog
>    `certificationId`.
> 3. **Row inclusion** (match frontend mock):
>    - `certIssuerOk` = if both cert id and issuer filters active, row matches if
>      catalog id matches **or** issuer matches; else match the single active filter.
>    - Row included when `certIssuerOk && (!levelFilterActive || levelMatches)`.
> 4. **Per-field intersection:** `matchedByCertificationId`, `issuingBody`, `level`
>    hold only values intersecting the **requested** filter for that field. Inactive
>    sub-filters → `null` / `false` as documented.
> 5. **`issueDate` / `expiryDate`:** include row dates when present (ISO DateOnly);
>    not filter-driven.
> 6. Enum/catalog objects: `{ id, label }` where `id` is the same integer as the
>    query-param value.
> 7. Items ordered by `candidateCertificationId` ascending. Additive and
>    backwards-compatible.
> 8. Implement efficiently — no N+1, no full certification graphs on list items.
>
> Update `CandidateListItemDto`, mapping in `CandidateService`, and repository
> projection. Add a **`matchedCertifications`** section to the front-end integration
> guide (`CandidateFilterIntegration`) under Certification filters.

---

## 10. Open questions for backend (optional)

1. **Stable row id name:** confirm `candidateCertificationId` maps to
   `candidate_certifications.id` (or preferred property name in DTO).
2. **Multi certification id in UI:** filter dialog allows multiple catalog ids in
   state, but API currently sends a single `certificationId`. Future `certificationIds[]`
   would extend drivers; `matchedByCertificationId` remains per-row boolean for the
   active single-id filter today.
3. **Deleted / inactive catalog rows:** confirm list filter excludes invalid certs;
   matched payload should use the same eligibility rules.
