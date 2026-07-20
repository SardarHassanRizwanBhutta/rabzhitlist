# Remove Employer Tags + Layoff Source — Frontend Integration

**Status:** Backend hard-remove **implemented** (2026-07-17). Deploy backend + EF first, then FE.  
**Audience:** Frontend / Next.js AI agent.  
**Scope:** Remove Tags catalog/UI and all employer tag linking; remove layoff `source` everywhere. Do not invent replacements.

**Backend:**
- Dropped tables `employer_tags` and `tags`; removed `/api/tags`
- Dropped column `employer_layoffs.source`
- Employer create/update/GET/list: no `tagIds` / `tags`
- List filter `tags` removed
- Layoff create/update/GET: no `source`
- Data progress: Work Mode **7.5** (was 5; +2.5 from Tags); section key `workArrangements` (was `workArrangementsAndTags`); Reason **5** (was 2.5; +2.5 from Source); no Tags/Source missing fields

---

## 1. API contract changes

| Area | Before | After |
|------|--------|--------|
| GET/POST/PUT employer | `tags` / `tagIds` | **Omitted** |
| List filter `?tags=` | Supported | **Removed** |
| `/api/tags` | Catalog CRUD | **Gone** (404) |
| Layoff DTOs | `source` | **Omitted** |
| Data-progress section | `workArrangementsAndTags` + Tags | `workArrangements` only; Work Mode worth more |
| Layoffs progress | Source missing field / weight | Reason worth more; no Source |

---

## 2. Files / areas to update (typical)

| Area | Action |
|------|--------|
| Employer create/edit/details | Remove Tags multi-select / chips / display |
| Employer list table + filters | Remove Tags column and `tags` query param |
| Tags admin / catalog pages | Remove if only used for employers |
| Layoff forms / details | Remove Source field |
| API client types | Drop `tagIds`, `tags`, layoff `source` |
| Data-progress UI | Accept `workArrangements`; map Work Mode / Reason weights; stop showing Tags/Source |

---

## 3. Checklist

- [x] Backend deployed + migration `RemoveEmployerTagsAndLayoffSource` applied
- [x] Recalculate employer data progress after migrate
- [x] Types/API: no tags / tagIds / layoff source
- [x] UI: no Tags or Source controls
- [x] Progress breakdown uses new section key / weights
- [x] Build / typecheck pass

---

## 4. Agent prompt (frontend)

```
Remove employer tags and layoff source per
docs/REMOVE_EMPLOYER_TAGS_AND_LAYOFF_SOURCE_FRONTEND_INTEGRATION.md.

Backend dropped tags catalog, employer tag links, and layoff source.
Update types, API clients, and UI. Progress: workArrangements (Work Mode 7.5);
Reason 5 pts; no Tags/Source. Do not invent replacements.
```
