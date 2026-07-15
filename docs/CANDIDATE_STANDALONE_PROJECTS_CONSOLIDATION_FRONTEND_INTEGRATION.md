# Candidate Standalone Projects Consolidation — Frontend Integration

**Status:** Phase 1 (UI + resume + API client + data-progress) implemented against local API. Prod cutover not done yet. Phase 2 (Cold caller / QG / empty-fields / matches) deferred.  
**Audience:** Frontend / Next.js AI agent.  
**Scope:** Remove standalone Projects UI; remap resume `standalone_projects` into orphan Work Experiences; stop sending/reading top-level `projects[]`.

**Backend contract:** [`CANDIDATE_STANDALONE_PROJECTS_CONSOLIDATION_BACKEND_HANDOFF.md`](./CANDIDATE_STANDALONE_PROJECTS_CONSOLIDATION_BACKEND_HANDOFF.md)  
**Deploy order (locked):** Backend first → then this FE work.  
**Cutover:** No candidate creates during ship — no dual-write on the API.

---

## 1. Summary

| Area | Change |
|------|--------|
| Create Candidate | **Remove** top-level **Projects** section entirely |
| Edit Candidate | Same — no standalone projects |
| Candidate Details | Same — no standalone projects UI / edit |
| Resume parse → Apply | `openai_parsed.standalone_projects` → **new orphan WE** (`employerId` null, `jobTitle` empty/null) with those projects nested under `workExperiences[].projects` |
| API payload | Do **not** send top-level `projects` on create/update; do **not** read top-level `projects` on GET |
| Catalog linking | Unresolved “standalone project” prefill anchors → WE project anchors only |
| Data progress | Drop `independentProjects` from section order; rely on backend WE-only scoring |

**Do not** change resume **parser** schema; only remap on the FE.

---

## 2. Locked decisions (FE-relevant)

| # | Decision |
|---|----------|
| **CSP1–CSP8** | See backend handoff — WE-only storage; hard-remove `projects[]` |
| **CSP3–CSP4** | One orphan WE holds all remapped standalone projects (create flow / resume apply) |
| **CSP7** | Empty/null employer + job title allowed on WE rows |
| **CSP10** | No FE exclusion logic for tenure |
| **UI** | Remove from Create, Edit, **and** Details |
| **Orphan label** | Leave employer/job title blank/empty; no “Projects (no employer)” placeholder |

---

## 3. Resume → form mapping

Update [`src/lib/candidate/resume-to-candidate-form.ts`](../src/lib/candidate/resume-to-candidate-form.ts):

### 3.1 Stop filling `partial.projects`

Remove (or no-op) mapping into top-level `CandidateFormData.projects`.

### 3.2 Remap `standalone_projects`

When `standalone_projects` (and aliases) is a non-empty array:

1. Map each item to a **WE nested project** row (same field aliases as today: `project_name`, `contribution_notes`, etc.) with `projectId: null` until user links catalog.
2. Append **one** new `WorkExperience` to `partial.workExperiences`:

```typescript
{
  id: crypto.randomUUID(),
  employerId: null,
  employerName: "",          // blank — no synthetic employer label
  jobTitle: "",
  projects: [ /* all standalone mapped projects */ ],
  startDate: undefined,
  endDate: undefined,
  techStacks: [],
  shiftType: "",
  workMode: "",
  timeSupportZones: [],
  benefits: [],
}
```

3. If both `work_experience` and `standalone_projects` exist, append the orphan WE **after** mapped employer WEs (order: employment first, then orphan block).

### 3.3 Preview ([`resume-parser-dialog.tsx`](../src/components/resume-parser-dialog.tsx))

- Show orphan WE inside the Work experience card (empty title/employer, projects list filled).
- No separate top-level “Projects” card.

---

## 4. UI removal checklist

| File / area | Action | Phase 1 |
|-------------|--------|---------|
| `candidate-creation-dialog.tsx` | Remove Projects collapsible section, nav item, validation, verification progress, standalone combobox helpers used only there | Done |
| Form type `CandidateFormData.projects` | Remove field; fix `initialFormData` / empty factories / merge prefill | Done |
| `mergeCandidatePrefill` / `hasPrefillContent` / `collectUnresolvedCatalogRefs` | Drop top-level `projects` | Done |
| `candidates-api.ts` | Stop mapping/sending top-level `projects`; map GET without expecting `projects` | Done |
| `candidate-details-modal.tsx` | Remove standalone projects display/edit | Done |
| `candidate-data-progress.ts` | Remove `independentProjects` from `DATA_PROGRESS_SECTION_ORDER` | Done |
| Cold caller / QG / empty-fields / matches | Drop standalone `projects` branching | **Phase 2** |

**Validation:** Employer/job title may be empty when `projects.length > 0` on that WE (orphan).

---

## 5. API client

| Call | Change |
|------|--------|
| Create / update candidate | Omit `projects`; only `workExperiences[].projects[{ projectId, contribution }]` |
| GET by id | Expect no top-level `projects`; use `workExperiences[].projects` only |
| Nested `/candidates/{id}/projects` | Do not call |

---

## 6. Frontend checklist

- [x] Backend smoke (migration + null jobTitle/employerId) confirmed on **local** API
- [ ] Prod cutover (backend migrate + hard-remove) — not done yet
- [x] Remove Projects section from Create / Edit / Details
- [x] Types + API client: no top-level `projects` on create/update; GET maps `projects: []`
- [x] Resume map: `standalone_projects` → orphan WE + nested projects
- [x] Preview aligned with Work experience (no separate form-section implication)
- [x] Prefill “link catalog” list: WE projects only
- [x] Candidate data-progress section order (no `independentProjects`)
- [x] Build / typecheck pass
- [ ] Manual QA §7 (local)
- [ ] Phase 2: Cold caller / QG / empty-fields / matches

---

## 7. Manual QA

1. Parse resume with `standalone_projects` only → preview shows orphan WE with project(s); Apply opens Create with those under Work Experience, **no** Projects section.
2. Parse resume with WE + standalone → both employer WEs and one orphan WE.
3. Create candidate with orphan WE (empty employer/title + linked project) succeeds against new API.
4. Edit / Details: no standalone projects block; former standalone data appears under orphan WE after backend migration.
5. Regression: normal WE with employer + nested projects still works.
6. Data Progress panel: no Independent Projects section (backend + FE order).

---

## 8. Agent prompt (frontend)

```
Implement Candidate Standalone Projects Consolidation FE per
docs/CANDIDATE_STANDALONE_PROJECTS_CONSOLIDATION_FRONTEND_INTEGRATION.md
after backend handoff is live.

Remove standalone Projects from Create, Edit, and Details. Stop sending/reading
top-level projects[]. Remap resume standalone_projects into one orphan work
experience (null/empty employer + job title) with nested projects.
Also update candidate data-progress helpers (drop independentProjects from section order).
Keep parser schema unchanged. Leave orphan WE labels blank.
Defer cold caller / QG / empty-fields / matches to phase 2.
```

---

## 9. Related documents

| Document | Purpose |
|----------|---------|
| [`CANDIDATE_STANDALONE_PROJECTS_CONSOLIDATION_BACKEND_HANDOFF.md`](./CANDIDATE_STANDALONE_PROJECTS_CONSOLIDATION_BACKEND_HANDOFF.md) | Migration + API |
| [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) | Resume `standalone_projects` shape |
| [`CANDIDATE_DATA_QUESTION_SERVICE_PAYLOAD.md`](./CANDIDATE_DATA_QUESTION_SERVICE_PAYLOAD.md) | Drop standalone projects in QG payload (phase 2) |
