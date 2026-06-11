# Backend Task: `matchedAchievements` on the Candidates List Response

This document is a ready-to-forward brief for the backend AI agent. Reference:
`docs/CandidateFilterIntegration copy 9.md` (Achievement filters).

---

## 1. Goal

Add **`matchedAchievements`** to each `CandidateListItemDto` on `GET /api/candidates` so
the Cards/Table match summary can show which **achievement rows** caused the list match
when Achievement filters are active — mirroring `matchedCertifications`, `matchedEducations`,
etc.

The list mapper sets no achievement graph on list items today; the frontend cannot show
*which* achievements matched without this payload.

**Legacy `competitionPlatforms` filter is removed from the frontend** — only
`achievementTypes` and `achievementName` remain as drivers.

---

## 2. Existing contract — DO NOT CHANGE

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `achievementTypes` | `AchievementType[]?` | length > 0 | any achievement with non-null `Type` in array |
| `achievementName` | `string?` | non-empty after trim | any achievement `name` contains substring (case-insensitive) |

**AchievementType** enum (same integers as create/update):

| `id` | Value |
|------|-------|
| `0` | competition |
| `1` | openSource |
| `2` | award |
| `3` | medal |
| `4` | publication |
| `5` | certification |
| `6` | recognition |
| `7` | other |

Keep filtering behavior unchanged. Change is **additive** only.

---

## 3. UI contract (Cards View)

- **Category:** `Achievements` (`type: 'competitions'` in frontend, purple panel, Trophy icon).
- **One item per matching achievement row** — heading = **`name`**.
- **Badges** (intersection with active filters only):

| Badge type | Label | When shown |
|------------|-------|------------|
| `achievementType` | Achievement Type | `achievementTypes` filter active and row has matched `achievementType` |
| `achievementName` | Achievement Name | `achievementName` filter active and row matched via name substring |

- **Context (Cards):** `ranking` and `year` shown as muted text under badges (existing UI).
- **`url`:** mapped for future use; not a filter badge today.

---

## 4. Payload shape

```jsonc
"matchedAchievements": [
  {
    "achievementId": 801,
    "name": "Kaggle Grandmaster",
    "matchedByAchievementName": true,
    "achievementType": { "id": 0, "label": "Competition" },
    "ranking": "Top 1%",
    "year": 2023,
    "url": "https://kaggle.com/example"
  }
]
```

| Field | Type | Notes |
|-------|------|-------|
| `achievementId` | `number` | Stable id of `candidate_achievements`; one entry per matching row. |
| `name` | `string \| null` | Achievement display name (Cards heading). |
| `matchedByAchievementName` | `boolean` | `true` only when `achievementName` filter active and this row's name satisfied the substring filter. |
| `achievementType` | `{ id: number, label: string } \| null` | Intersection with requested `achievementTypes` filter. Enum `id` = query param integer. |
| `ranking` | `string \| null` | Row ranking for contextual display; not filter-driven. |
| `year` | `number \| null` | Row year for contextual display; not filter-driven. |
| `url` | `string \| null` | Row URL when present; contextual only. |

---

## 5. When to compute

Compute when **any** of these filters is active:

- `achievementTypes`
- `achievementName`

Otherwise → `matchedAchievements: []` (never `null`).

---

## 6. Row inclusion semantics

**List filter (unchanged):** AND across filter types at candidate level (each uses `.Any(...)`).

**`matchedAchievements` (per row):**

- Include a row only if it matched **≥1 active driver** (OR across type and name filters).
- When **both** filters active, a row can appear because it matched type only, name only, or both.
- Each field holds only the **intersection** with its filter; inactive sub-filters → `null` /
  `matchedByAchievementName: false`.
- Items ordered by `achievementId` ascending.
- Not deduped by name.

---

## 7. Samples

### Type only

```
GET /api/candidates?achievementTypes=0&achievementTypes=1
```

```json
{
  "matchedAchievements": [
    {
      "achievementId": 801,
      "name": "Kaggle Grandmaster",
      "matchedByAchievementName": false,
      "achievementType": { "id": 0, "label": "Competition" },
      "ranking": "Top 1%",
      "year": 2023,
      "url": null
    }
  ]
}
```

### Name substring only

```
GET /api/candidates?achievementName=kaggle
```

```json
{
  "matchedAchievements": [
    {
      "achievementId": 801,
      "name": "Kaggle Grandmaster",
      "matchedByAchievementName": true,
      "achievementType": null,
      "ranking": "Top 1%",
      "year": 2023,
      "url": "https://kaggle.com/example"
    }
  ]
}
```

### Both filters

Row appears when it matched type **or** name (or both). Fields populated per intersection:

```
GET /api/candidates?achievementTypes=0&achievementName=grandmaster
```

---

## 8. Frontend mapping (implemented)

| Layer | File |
|-------|------|
| Type | `MatchedAchievementDto` + `Candidate.matchedAchievements` in `candidate.ts` |
| Mapper | `mapMatchedAchievements()` in `candidates-api.ts` |
| Match summary | `appendBackendMatchedAchievementItems()` in `candidate-matches.ts` |
| Legacy removed | `competitionPlatforms` filter + mock `candidate.competitions` loop |

List filtering is wired in `candidates-page-client.tsx` → `fetchCandidatesPage`.

---

## 9. Prompt to forward

> Add `matchedAchievements` to each `CandidateListItemDto` on `GET /api/candidates` when
> `achievementTypes` and/or `achievementName` filters are active. Do not change existing
> filter behavior. Return `[]` when no achievement drivers are active.
>
> Per row: `achievementId`, `name`, `matchedByAchievementName`, `achievementType`
> (`{ id, label }` or null), `ranking`, `year`, `url`. Matched-only semantics; OR across
> drivers for row inclusion; ordered by `achievementId` ascending.
>
> Add **`matchedAchievements`** section to the front-end integration guide under Achievement filters.
