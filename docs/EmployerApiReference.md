# Employer APIs — reference for front-end integration

This document describes all **Employer**-related HTTP APIs in this solution, with emphasis on **how to create, update, and delete locations** for an **existing** employer.

---

## Important: locations are **not** updated via `PUT /api/employers/{id}`

`UpdateEmployerDto` **does not include** a `locations` field. `EmployerService.UpdateAsync` only updates employer **scalar** fields plus **types**, **statuses**, **tags**, **time support zones**, and **benefits** via `IEmployerRepository.UpdateAsync`.

**Implication:** If the front-end only calls **`PUT /api/employers/{id}`** expecting to add or change locations, **nothing will happen to locations**. That is expected server behavior, not a bug.

| Operation | Correct API |
|-----------|-------------|
| Add a new location to an existing employer | **`POST /api/employers/{employerId}/locations`** |
| Change an existing location row | **`PUT /api/employers/{employerId}/locations/{locationId}`** |
| Remove a location | **`DELETE /api/employers/{employerId}/locations/{locationId}`** |
| Set initial locations when **creating** the employer | **`POST /api/employers`** with `locations` in **`CreateEmployerDto`** |

---

## Base URL and JSON

- API hosts vary by environment (e.g. `https://localhost:7xxx`).
- JSON property names follow typical **ASP.NET Core** **camelCase** serialization unless your project configures otherwise.

---

## 1. Employers — `EmployersController`

**Route prefix:** `api/employers` (controller name `Employers`; URLs are usually case-insensitive).

| Method | Path | Description |
|--------|------|-------------|
| **GET** | `/api/employers` | Paged, filtered list (`EmployerFilterRequest` query string). Returns `PagedResult<EmployerListItemDto>`. |
| **GET** | `/api/employers/search` | Lightweight name search (`search`, `limit`). |
| **GET** | `/api/employers/{id}` | Full employer **`EmployerDto`** including nested `locations`, benefits, tags, etc. |
| **POST** | `/api/employers` | Create employer + optional nested data (see **`CreateEmployerDto`**). **Returns `201`** with `Location` header. |
| **PUT** | `/api/employers/{id}` | Update employer **without** locations (see **`UpdateEmployerDto`**). **Returns `200`** or **`404`**. |
| **DELETE** | `/api/employers/{id}` | Soft-delete (or hard per repository). **Returns `204`** or **`404`**. |

### `POST /api/employers` — create (includes initial locations)

Body: **`CreateEmployerDto`** — includes optional **`locations`**: array of **`CreateEmployerLocationDto`**.

Each location item:

| JSON field | Type | Notes |
|------------|------|--------|
| `countryId` | number | FK to country (DTO uses `long`; stored as `smallint` on entity). |
| `city` | string | Required. |
| `address` | string \| null | Optional. |
| `isHeadquarters` | boolean | Per-row HQ flag. |

Locations are created **together** with the employer in one `CreateAsync` call.

### `PUT /api/employers/{id}` — update (no locations)

Body: **`UpdateEmployerDto`** — includes:

- Core: `name`, `websiteUrl`, `linkedInUrl`, `foundedYear`, `workMode`, `shiftType`, `isDplCompetitor`, `ranking`, `salaryPolicy`, `minEmployees`, `maxEmployees`
- Joins: `types`, `status`, `tagIds`, `timeSupportZoneIds`, `benefits`

**There is no `locations` property.** Use the **locations** sub-API below for any location change after create.

### `GET /api/employers/{id}` — read full graph

Response **`EmployerDto`** includes **`locations`**: array of **`EmployerLocationDto`** (each with nested **`country`**, `city`, `address`, `isHeadquarters`, `createdAt`, etc.). Use returned **`id`** on each location as **`locationId`** for `PUT`/`DELETE`.

---

## 2. Employer locations — `EmployerLocationsController`

**Route prefix:** **`/api/employers/{employerId}/locations`**

Use the **same** `employerId` as the employer’s primary key from `GET /api/employers` or `GET /api/employers/{id}`.

| Method | Path | Description |
|--------|------|-------------|
| **GET** | `/api/employers/{employerId}/locations` | List all locations for that employer. |
| **GET** | `/api/employers/{employerId}/locations/{id}` | Get one location by **location** `id`. |
| **POST** | `/api/employers/{employerId}/locations` | **Create** a new location row. **`201 Created`**. |
| **PUT** | `/api/employers/{employerId}/locations/{id}` | **Update** that location row. **`200`** or **`404`**. |
| **DELETE** | `/api/employers/{employerId}/locations/{id}` | **Delete** that location row. **`204`** or **`404`**. |

### `POST /api/employers/{employerId}/locations` — add a location

**Body:** **`CreateEmployerLocationDto`** (same shape as each element in create-employer `locations`):

```json
{
  "countryId": 1,
  "city": "Karachi",
  "address": "Plot 123",
  "isHeadquarters": false
}
```

- **`employerId`** in the URL is written onto the new row as **`EmployerId`**.
- Response body: **`EmployerLocationDto`**; **`201`** includes **`Location`** header pointing to `GET .../locations/{id}`.

### `PUT /api/employers/{employerId}/locations/{id}` — edit a location

**Body:** **`UpdateEmployerLocationDto`**:

| JSON field | Type |
|------------|------|
| `countryId` | number (`short` in model) |
| `city` | string |
| `address` | string \| null |
| `isHeadquarters` | boolean |

**`id`** is the **location row’s** primary key (from list or from `GET` employer’s `locations[].id`).

**Note:** `UpdateAsync` in the service/repository updates **by location id only**; it does **not** verify that the location belongs to `employerId` in the URL. The front-end should still pass the correct pair; mismatched ids could update another employer’s row if ids are guessed.

### `DELETE /api/employers/{employerId}/locations/{id}`

Deletes the row with that **`id`**. **`204`** on success.

### Database uniqueness (common front-end error)

The EF model enforces a **unique index** on **`(employerId, city, address)`** (see `AppDbContext` / migrations). Duplicate **city + address** for the same employer will fail on insert/update with a database error unless your API maps it to a friendly validation message.

---

## 3. Employer layoffs — `EmployerLayoffsController`

**Route prefix:** **`/api/employers/{employerId}/layoffs`**

| Method | Path | Description |
|--------|------|-------------|
| **GET** | `/api/employers/{employerId}/layoffs` | List layoffs for employer. |
| **GET** | `/api/employers/{employerId}/layoffs/{id}` | Get one layoff. |
| **POST** | `/api/employers/{employerId}/layoffs` | Create layoff. |
| **PUT** | `/api/employers/{employerId}/layoffs/{id}` | Update layoff. |
| **DELETE** | `/api/employers/{employerId}/layoffs/{id}` | Delete layoff. |

DTOs: **`CreateEmployerLayoffDto`**, **`UpdateEmployerLayoffDto`** (see `EmployerDto.cs` / layoff DTO files and `EmployerLayoffService`).

---

## 4. Source files (maintenance)

| Area | Path |
|------|------|
| Employers routes | `MyApp.API/Controllers/EmployersController.cs` |
| Locations routes | `MyApp.API/Controllers/EmployerLocationController.cs` |
| Layoffs routes | `MyApp.API/Controllers/EmployerLayoffsController.cs` |
| Employer DTOs | `MyApp.Application/DTOs/EmployerDto.cs` |
| Location DTOs | `MyApp.Application/DTOs/EmployerLocationDto.cs` |
| Employer service | `MyApp.Application/Services/EmployerService.cs` |
| Location service | `MyApp.Application/Services/EmployerLocationService.cs` |
| List filters doc | `docs/EmployerFilterIntegration.md` |

---

## 5. Front-end checklist for “edit locations”

1. Load employer: **`GET /api/employers/{id}`** → read **`locations`** and each **`id`**.
2. **Edit one row:** **`PUT /api/employers/{id}/locations/{locationId}`** with **`UpdateEmployerLocationDto`**.
3. **Add a row:** **`POST /api/employers/{id}/locations`** with **`CreateEmployerLocationDto`** (do **not** send a client-generated `id`).
4. **Remove a row:** **`DELETE /api/employers/{id}/locations/{locationId}`**.
5. Do **not** rely on **`PUT /api/employers/{id}`** to persist location changes.

---

*Generated from the repository layout and service code. If your deployment uses auth, document tokens/CORS separately.*
