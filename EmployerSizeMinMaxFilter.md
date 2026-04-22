# Employer list filters — `SizeMin` and `SizeMax`

This note summarizes how **`sizeMin`** and **`sizeMax`** work on **`GET /api/employers`** for the paginated employer list.

---

## Data model

Company size is stored on the **`employers`** row (not on individual locations):

| Column / property | Type | Meaning |
|-------------------|------|--------|
| `MinEmployees` | `int?` | Lower end of the employer’s stated headcount range (nullable). |
| `MaxEmployees` | `int?` | Upper end of the employer’s stated headcount range (nullable). |

See `MyApp.Domain/Entities/Employer` and `EmployerFilterRequest` / `EmployerListFilter` (`SizeMin`, `SizeMax`).

---

## API parameters

| Query (camelCase) | DTO property | Type | When it applies |
|-------------------|--------------|------|-----------------|
| `sizeMin` | `SizeMin` | `int?` | When the value is present (`HasValue`). |
| `sizeMax` | `SizeMax` | `int?` | When the value is present (`HasValue`). |

They are **independent**: you can send one, the other, or both. With both, both predicates must pass (**AND**).

---

## Repository logic

Implemented in `EmployerRepository.GetFilteredAsync` (`MyApp.Infrastructure/Repositories/EmployerRepository.cs`):

**`SizeMin` (lower bound on “size” for matching):**

- Keeps employers where  
  **`(MaxEmployees ?? MinEmployees ?? 0) >= SizeMin`**

**`SizeMax` (upper bound on “size” for matching):**

- Keeps employers where  
  **`(MinEmployees ?? MaxEmployees ?? 0) <= SizeMax`**

So each filter compares **one derived integer per employer** against the threshold:

| Filter | Derived value used |
|--------|---------------------|
| `SizeMin` | Prefer **`MaxEmployees`**; if null, use **`MinEmployees`**; if both null, use **`0`**. |
| `SizeMax` | Prefer **`MinEmployees`**; if null, use **`MaxEmployees`**; if both null, use **`0`**. |

This is **not** the same as “the employer’s entire **[MinEmployees, MaxEmployees]** interval must lie inside **[SizeMin, SizeMax]**”. It is a **compacting** rule: each side of the filter uses whichever stored bound is available (with a fixed preference order) to produce a single number, then compares that number to `SizeMin` / `SizeMax`.

---

## Behaviour examples (mental model)

- **`MinEmployees = 10`**, **`MaxEmployees = 50`**:  
  - `SizeMin`: uses **50** (max of the range) — employer passes if **50 ≥ sizeMin** (i.e. the “top” of their range meets the floor).  
  - `SizeMax`: uses **10** (min of the range) — employer passes if **10 ≤ sizeMax** (i.e. the “bottom” of their range meets the cap).

- **Only `MinEmployees` set** (e.g. 100, `MaxEmployees` null):  
  - `SizeMin` uses **100**.  
  - `SizeMax` also uses **100** (same value, because `MinEmployees ?? MaxEmployees` collapses to `MinEmployees`).

- **Both null**: derived value is **0** for both expressions → employer matches any **`SizeMin ≤ 0`** (unusual) and any **`SizeMax ≥ 0`** (almost always true for non-negative caps).

---

## Relation to other filters

`SizeMin` / `SizeMax` are combined with all other active employer filters with **logical AND** (same query pipeline as name, city, salary policy, etc.).

---

## Source references

| Piece | Location |
|-------|-----------|
| Query DTO | `MyApp.Application/DTOs/EmployerFilterRequest.cs` |
| Domain filter model | `MyApp.Domain/Models/EmployerListFilter.cs` |
| Predicate implementation | `MyApp.Infrastructure/Repositories/EmployerRepository.cs` (`GetFilteredAsync`) |
| Mapping DTO → filter | `MyApp.Application/Services/EmployerService.cs` |

---

*This document describes the implementation as coded; if product intent is strict interval overlap between `[MinEmployees, MaxEmployees]` and `[SizeMin, SizeMax]`, the repository predicates would need to be changed explicitly.*
