# Dashboard Metrics API Contract

API contract for the **home dashboard** productivity metrics. Frontend implementation: `src/lib/services/dashboard-api.ts` (mock until backend ships).

**Switch to live API:** set `NEXT_PUBLIC_DASHBOARD_USE_MOCK=false` in `.env.local`.

---

## Endpoint

```http
GET /api/dashboard/metrics
```

### Query parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `from` | `string` (YYYY-MM-DD) | Yes | Start of reporting window (inclusive), in `timezone` |
| `to` | `string` (YYYY-MM-DD) | Yes | End of reporting window (inclusive), in `timezone` |
| `timezone` | `string` (IANA) | No | Default `Asia/Karachi` — calendar-day boundaries for counts and progress deltas |

### Example

```http
GET /api/dashboard/metrics?from=2026-06-17&to=2026-06-23&timezone=Asia/Karachi
```

### Success `200`

```json
{
  "generatedAt": "2026-06-23T14:30:00.000Z",
  "timezone": "Asia/Karachi",
  "range": {
    "from": "2026-06-17",
    "to": "2026-06-23"
  },
  "summary": {
    "today": {
      "newCandidates": 12,
      "newEmployers": 3,
      "newProjects": 5,
      "progressPointsGained": 142,
      "candidatesImproved": 38
    },
    "totals": {
      "candidates": 4287,
      "employers": 312,
      "projects": 891,
      "avgDataProgress": 61.4,
      "avgDataProgressDelta": 0.8
    }
  },
  "daily": [
    {
      "date": "2026-06-17",
      "newCandidates": 9,
      "newEmployers": 2,
      "newProjects": 4,
      "progressPointsGained": 118,
      "candidatesImproved": 31
    }
  ]
}
```

### Errors

| Status | When |
|---|---|
| `400` | Invalid `from`/`to` or `timezone` |
| `500` | Server error |

---

## Field definitions

### `summary.today`

Metrics for the **current calendar day** in `timezone` (not necessarily the last row in `daily` if `to` is in the past).

| Field | Definition |
|---|---|
| `newCandidates` | `COUNT(candidates)` where `createdAt` falls on today |
| `newEmployers` | `COUNT(employers)` where `createdAt` falls on today |
| `newProjects` | `COUNT(projects)` where `createdAt` falls on today |
| `progressPointsGained` | See [Progress points gained](#progress-points-gained) |
| `candidatesImproved` | Candidates with progress delta &gt; 0 today |

### `summary.totals`

Fleet-wide snapshot (not limited to `from`/`to`).

| Field | Definition |
|---|---|
| `candidates` | Total non-deleted candidates |
| `employers` | Total non-deleted employers |
| `projects` | Total non-deleted projects |
| `avgDataProgress` | `AVG(dataProgressPercentage)` across candidates (0–100) |
| `avgDataProgressDelta` | `avgDataProgress` today minus yesterday (optional) |

### `daily[]`

One row per calendar day between `from` and `to` (inclusive), sorted ascending by `date`.

| Field | Definition |
|---|---|
| `date` | `YYYY-MM-DD` in `timezone` |
| `newCandidates` | Records created that day |
| `newEmployers` | Records created that day |
| `newProjects` | Records created that day |
| `progressPointsGained` | Sum of positive progress deltas that day |
| `candidatesImproved` | Count of candidates with delta &gt; 0 that day |

---

## Progress points gained

Candidate `dataProgressPercentage` is a **0–100 point total** (see `docs/candidate_data_progress_frontend_update_handoff.md`).

**Requires backend history** — one of:

1. **Nightly snapshot table** `candidate_progress_snapshots (candidate_id, snapshot_date, progress_percentage)`  
2. **Event log** when `dataProgressPercentage` is recomputed

**Daily formula:**

```text
progressPointsGained(day) =
  SUM over candidates c of MAX(0, progress_c(day) - progress_c(day - 1))

candidatesImproved(day) =
  COUNT candidates c where progress_c(day) - progress_c(day - 1) > 0
```

- Only **positive** deltas count toward productivity (no penalty for regressions in the headline KPI).
- Optional v2: expose `progressPointsLost` separately for audit.

**First day after snapshot rollout:** treat missing prior snapshot as `0` or exclude from delta sum (document chosen rule).

---

## Backend implementation checklist

- [ ] `GET /api/dashboard/metrics` with `from`, `to`, `timezone`
- [ ] Intake counts from `createdAt` on `candidates`, `employers`, `projects` (respect soft-delete if applicable)
- [ ] Nightly job: snapshot `dataProgressPercentage` per candidate
- [ ] Compute daily `progressPointsGained` and `candidatesImproved` from snapshots
- [ ] `summary.totals` fleet counts + current average progress
- [ ] `summary.today` for current calendar day in requested timezone
- [ ] Return contiguous `daily[]` rows (zeros for days with no activity)

---

## Frontend mapping

| UI | Source |
|---|---|
| Range tabs (Today / 7d / 30d) | Client sets `from`/`to`; aggregates `daily[]` for KPIs when range &gt; 1 day |
| Intake KPI cards | Sum of `newCandidates`, `newEmployers`, `newProjects` over range |
| Progress KPI cards | Sum of `progressPointsGained`, `candidatesImproved`; `totals.avgDataProgress` |
| Intake trend chart | Stacked bars from `daily[]` |
| Progress chart | Bars from `daily[].progressPointsGained` |
| Day-by-day table | `daily[]` descending by date |

---

## TypeScript types

See `src/types/dashboard.ts` — `DashboardMetricsResponse` must match this contract.

---

## Related docs

- `docs/candidate_data_progress_frontend_update_handoff.md` — scoring model
- `docs/CANDIDATE-API-REFERENCE.md` — `createdAt`, `dataProgressPercentage` on list items
