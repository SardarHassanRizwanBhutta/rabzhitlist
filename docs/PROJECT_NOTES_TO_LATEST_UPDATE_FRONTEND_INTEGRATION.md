# Project Notes → Latest Update — Frontend Integration

**Status:** Backend **implemented** (2026-07-20). Deploy API + apply EF migration `RenameProjectNotesToLatestUpdate` (column rename — **data preserved**), then FE.  
**Audience:** Frontend / Next.js AI agent.

**Backend:**
- C# / API: `notes` → `latestUpdate`
- DB: `projects.notes` → `projects.latest_update` via **rename** (existing values kept)
- Data progress missing field: `"Latest Update"` (was `"Notes"`); weight still **1**

---

## 1. API contract changes

| Area | Before | After |
|------|--------|--------|
| Project GET/POST/PUT | `notes` | **`latestUpdate`** |
| Data-progress `missingFields` | `Notes` | **`Latest Update`** |

No other project fields change.

---

## 2. Files / areas to update (typical)

| Area | Action |
|------|--------|
| Project create/edit/details | Rename Notes control/label to Latest Update; bind `latestUpdate` |
| Types / API clients | `notes` → `latestUpdate` |
| Data-progress UI | Map missing field `Latest Update` |
| Any forms copying project payload | Stop sending `notes` |

---

## 3. Checklist

- [ ] Migration `RenameProjectNotesToLatestUpdate` applied (local + prod)
- [ ] Backend deployed
- [x] Types/UI use `latestUpdate`
- [x] Progress UI shows Latest Update (backend `missingFields` key)
- [ ] Typecheck / smoke create-edit-reload with existing text still present

---

## 4. Agent prompt (frontend)

```
Rename project notes to latestUpdate per
docs/PROJECT_NOTES_TO_LATEST_UPDATE_FRONTEND_INTEGRATION.md.

API field latestUpdate; progress missingFields "Latest Update".
Existing DB values are preserved after backend rename migration.
```
