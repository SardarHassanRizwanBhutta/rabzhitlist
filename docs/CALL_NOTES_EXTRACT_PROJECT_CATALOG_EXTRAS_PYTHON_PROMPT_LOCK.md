# Call Notes Extract — Project catalog extras Python prompt lock

**Status:** Locked (2026-09-04). Updated 2026-09-04 — CNE19 domain `value` stays spoken; Link / Platforms / Published / Download Count stay locked out of extract.  
**Audience:** AI agent updating **`POST /api/call-notes/extract`** in the Python QG FastAPI app (`:8002`).  
**Related:** [`CALL_NOTES_EXTRACT_PROJECT_PYTHON_PROMPT_LOCK.md`](./CALL_NOTES_EXTRACT_PROJECT_PYTHON_PROMPT_LOCK.md) (name / description / contribution).  
**HTTP:** accept `averageTeamSize`, `clientLocations`, `verticalDomains`, `horizontalDomains`, and `technicalDomains` on extract when they appear on the whitelist (already QG keys). Do **not** add `projectLink`, `isPublished`, `publishPlatforms`, or `downloadCount` to extract or generate-questions.

This lock is **extract HTTP allowlist + prompt + post-process**. Do **not** invent keys absent from `allowedEmptyFields` (CNE1).

---

## 0. Agent prompt (copy-paste)

```text
You are updating Call Notes Extract in the existing Python QG FastAPI app (port 8002).

READ FIRST:
1. docs/CALL_NOTES_EXTRACT_PROJECT_CATALOG_EXTRAS_PYTHON_PROMPT_LOCK.md (this file)
2. docs/CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md §4–§6.4, §9 Step 2–4
3. docs/CALL_NOTES_EXTRACT_PROJECT_PYTHON_PROMPT_LOCK.md

PROBLEM:
Notes include team size, client location, and domain tokens (gaming, ERP, AI,
ML, Devops). Extract must return those when the keys are on the whitelist.
Notes may also mention a URL, Play/App Store, published, or download/active-user
count. Those four fields stay locked out of extract (same as QG §5). Do not
allowlist them. Do not return mappings for them.

Analyze Notes review displays extractions[].value. Domain rows must keep the
spoken tokens (ERP, AI), not catalog labels (ERP (Enterprise Resource Planning)).

DELIVER (extract-api only):
- Accept on extract (when present on the whitelist):
  work_experience_{i}_project_{j}_averageTeamSize
  work_experience_{i}_project_{j}_clientLocations
  work_experience_{i}_project_{j}_verticalDomains
  work_experience_{i}_project_{j}_horizontalDomains
  work_experience_{i}_project_{j}_technicalDomains
- Reject on extract (400 if present on allowedEmptyFields; never emit):
  work_experience_{i}_project_{j}_projectLink
  work_experience_{i}_project_{j}_isPublished
  work_experience_{i}_project_{j}_publishPlatforms
  work_experience_{i}_project_{j}_downloadCount
- Prompt mappings in §1–§2
- Post-process PX2 (clientLocations) and PX5 (domains) — do not drop unmatched
  spoken items; do not rewrite domain items to catalog labels
- Tests T-PX1, T-PX2, T-PX3, T-PX4
- Echo exact fieldPath and apiFieldName from the whitelist

Do not: persist data, rewrite rawNotes, add these keys to generate-questions
(already QG keys). Do not map Link / Platforms / Published / Download Count
even when those phrases appear in notes.
```

---

## 1. Locked rules (extract)

| ID | Rule |
|----|------|
| **PX1** | `averageTeamSize` (`number`): “Team size is 15” / average team size N → integer `15`. |
| **PX2** | `clientLocations` (`multiselect`): “Client is located in USA” → array including the spoken location (e.g. `["USA"]`). Empty `options` is **not** an enum drop. If options exist, map to a matching `options[].value` when possible; otherwise return the spoken string. Do **not** synonym-map `USA` → `United States`. |
| **PX3** | Same nested `project_{j}` slot as name/description (PN6–PN7). Do not skip these keys because other project fields already filled. |
| **PX4** | **Locked out:** never accept or emit `projectLink`, `isPublished`, `publishPlatforms`, or `downloadCount`. Notes that mention a URL, Play Store / App Store, published, or download/active-user count are **not** extract evidence for those keys. |
| **PX5** | `verticalDomains` / `horizontalDomains` / `technicalDomains` (`multiselect`): return the **spoken tokens** from notes (e.g. `["gaming"]`, `["ERP"]`, `["AI","ML","Devops"]`). **Do not** rewrite to catalog labels (`Gaming`, `ERP (Enterprise Resource Planning)`, `Artificial Intelligence (AI)`). **Do not** drop items that fail enum membership when `options` is non-empty. **Do not** drop the whole row because some items miss `options`. FE maps to catalog on Apply / + Create New Project. Review shows `extractions[].value` (CNE19). |

---

## 2. Prompt text to add (extract module only)

```text
Nested project catalog extras (only if the key is on the whitelist):
- averageTeamSize: integer from team size / average team size.
- clientLocations: spoken client location(s) as a string array. Empty options is normal; do not drop the row. Do not rewrite USA to United States.
- verticalDomains / horizontalDomains / technicalDomains: spoken tokens as a string array (gaming, ERP, AI, ML, Devops). Do not expand to catalog labels. Do not drop tokens that are not exact option matches.
- Never extract projectLink, isPublished, publishPlatforms, or downloadCount. A URL, “published on Play Store / App Store”, or a download/user count in the notes is not a mapping for those fields.
```

---

## 3. Worked example (must pass)

Notes (abridged):

```text
Working on Jazz Project.
Team size is 15
Client is located in USA
Here's the link: https://www.google.com
The App is Published on Play Store and App Store
It has 350000 active users
Vertical Domain is gaming
Horizontal Domain is ERP
Technical Domain is AI, ML, Devops
```

Whitelist includes `averageTeamSize`, `clientLocations`, `verticalDomains`, `horizontalDomains`, and `technicalDomains` for `work_experience_0_project_0_*`. It does **not** include Link / Platforms / Published / Download Count. Domain rows may have empty `options` or a full catalog `options` list — **PX5 is the same either way**.

**Required extractions (minimum when those keys are on the whitelist):**

| Key | `value` |
|-----|---------|
| `averageTeamSize` | `15` |
| `clientLocations` | array containing `USA` |
| `verticalDomains` | array containing spoken `gaming` (not `Gaming`) |
| `horizontalDomains` | array containing spoken `ERP` (not `ERP (Enterprise Resource Planning)`) |
| `technicalDomains` | array containing spoken `AI`, `ML`, `Devops` (not the long catalog labels) |

**Forbidden:** any `apiFieldName` ending in `_projectLink`, `_isPublished`, `_publishPlatforms`, or `_downloadCount`.

---

## 4. Tests (add in QG repo)

| # | Fixture | Expected |
|---|---------|----------|
| **T-PX1** | Notes above; `averageTeamSize` and `clientLocations` on whitelist | Those two rows present with the values in §3; the four locked keys absent |
| **T-PX2** | Same notes; `averageTeamSize` / `clientLocations` **omitted** from whitelist | Neither of those `apiFieldName`s emitted (CNE1) |
| **T-PX3** | Same notes; any of `projectLink` / `isPublished` / `publishPlatforms` / `downloadCount` on the request whitelist | `400` (not extract-allowlisted) |
| **T-PX4** | Notes above; three domain keys on whitelist with **catalog `options`** (full labels) | Domain rows present; `value` keeps spoken tokens; items not dropped for membership |

---

## 5. Out of scope

| Out | Why |
|-----|-----|
| Link / Platforms / Published / Download Count | CNE18 lock-out; same as QG §5 |
| Country synonym map (USA → United States) | Return spoken text unless it matches an option value |
| Domain catalog rewrite in extract | CNE19 / PX5 — FE maps spoken → catalog on Apply / + Create New Project |
| FE apply | Writes `averageTeamSize`, `clientLocations`, and spoken domain arrays when extract returns them (`deferCatalogLinking`); FE then maps domains to catalog labels |
