# Resume Parser API — Documentation

HTTP API for uploading a resume file, extracting text, structuring it with OpenAI, and optionally syncing to Microsoft Excel / SharePoint.

**Base URL:** Configure per environment (e.g. `http://localhost:5000` in development, or your deployed host).

**Content type:** JSON for JSON responses. File upload uses `multipart/form-data`.

---

## Table of contents

1. [Integration overview (Next.js & external apps)](#1-integration-overview-nextjs--external-apps)
2. [CORS and environment variables](#2-cors-and-environment-variables)
3. [Endpoints](#3-endpoints)
   - [GET `/api/health`](#get-apihealth)
   - [POST `/api/parse-resume`](#post-apiparse-resume)
4. [Response conventions](#4-response-conventions)
5. [Structured resume schema (`openai_parsed`)](#5-structured-resume-schema-openai_parsed)
6. [Error and edge cases](#6-error-and-edge-cases)
7. [Example: Next.js client](#7-example-nextjs-client)

---

## 1. Integration overview (Next.js & external apps)

| Topic | Detail |
|--------|--------|
| **Browser → API** | Use `fetch` or axios with `FormData` for `POST /api/parse-resume`. Do not set `Content-Type` manually when using `FormData` (the browser sets the boundary). |
| **Same-origin vs cross-origin** | If the Next.js app and this API are on different origins (different host/port), CORS must allow your frontend origin (see below). |
| **Authentication** | The API does **not** implement API keys or JWT in this codebase. If you expose the API publicly, add a reverse proxy, API gateway, or app-level auth. The `Authorization` header is allowed by CORS for future use. |
| **HTTPS** | Use HTTPS in production for both the frontend and this API. |

---

## 2. CORS and environment variables

### `CORS_ORIGINS`

- **Default:** `*` — any origin may call `/api/*` (simple for local dev).
- **Production:** set a comma-separated allowlist, for example:
  ```bash
  set CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000
  ```
  (Linux/macOS: `export CORS_ORIGINS=...`)

Preflight `OPTIONS` requests to `/api/*` are handled automatically.

### Other relevant settings (server / `config.yaml`)

| Variable / config | Purpose |
|-------------------|---------|
| `OPENAI_API_KEY` / `config.yaml` | Required for structured parsing. |
| `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` | Microsoft Graph / Excel insert (`excelSheet.py`). |
| `MAX_CONTENT_LENGTH` | Hard-coded in `app.py` to **10 MB** (10485760 bytes). |

---

## 3. Endpoints

### GET `/api/health`

Liveness check. **No authentication.**

#### Request

- **Method:** `GET`
- **Headers:** none required
- **Body:** none

#### Success response

- **HTTP status:** `200 OK`
- **Body (JSON):**

```json
{
  "status": "healthy",
  "message": "Resume Parser API is running"
}
```

---

### POST `/api/parse-resume`

Upload a resume file. The server extracts text, calls OpenAI for structured JSON, and attempts to insert rows into Excel / SharePoint.

#### Request

- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Field name (required):** `resume` — the file input **must** use this exact field name.

**Allowed file extensions:** `pdf`, `doc`, `docx`, `txt`, `rtf`

| Extension | Behavior |
|-----------|----------|
| `pdf` | Text extracted via PyMuPDF. |
| `txt`, `rtf` | Read as UTF-8 (invalid bytes ignored). |
| `doc`, `docx` | **Not implemented** — returns `success: false` with an error message (HTTP `200` with error in body; see below). |

**Max upload size:** 10 MB. Larger uploads receive **413** (see [Response codes](#response-codes)).

#### Example: cURL

```bash
curl -X POST "http://localhost:5000/api/parse-resume" \
  -F "resume=@/path/to/resume.pdf"
```

#### Success path — HTTP status

- **HTTP status:** `200 OK` for almost all outcomes that return a JSON body from this handler (including many failure modes that are expressed inside JSON — see [Response conventions](#4-response-conventions)).
- **Exceptions:** `400` for bad multipart input; `413` for oversized file; `500` for unhandled server exceptions.

#### Success path — response body shape

The top-level object always includes at least `success` (boolean) when returned by the parser path.

**A) Text extraction + OpenAI succeeded**

```json
{
  "success": true,
  "text": "<full extracted plain text>",
  "pages": 2,
  "page_breakdown": [
    { "page": 1, "text": "..." },
    { "page": 2, "text": "..." }
  ],
  "openai_parsed": { },
  "openai_usage": {
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "total_tokens": 0
  },
  "excel_insertion": {
    "success": true,
    "message": "Data inserted into Excel successfully"
  }
}
```

- `page_breakdown` may be omitted or differ slightly for non-PDF text files (`pages` often `1`).
- `openai_parsed` matches the schema in [§5](#5-structured-resume-schema-openai_parsed).
- `excel_insertion` is present when the Excel step ran; it may be `{ "success": false, "error": "..." }` if Graph/SharePoint fails (OpenAI result is still returned).

**B) Text extraction succeeded, OpenAI failed**

HTTP `200`, `success: true` for extraction, plus error detail:

```json
{
  "success": true,
  "text": "...",
  "pages": 1,
  "openai_error": "Invalid JSON response: ..."
}
```

**C) Text extraction failed (e.g. corrupt PDF) or unsupported type**

HTTP `200`:

```json
{
  "success": false,
  "error": "Error message from parser"
}
```

**D) Client errors**

| Condition | HTTP status | Example body |
|-----------|-------------|----------------|
| Missing `resume` field | `400` | `{"success": false, "error": "No file provided"}` |
| Empty filename | `400` | `{"success": false, "error": "No file selected"}` |
| Disallowed extension | `400` | `{"success": false, "error": "File type not allowed"}` |
| File larger than 10 MB | `413` | `{"success": false, "error": "File too large", "max_size_bytes": 10485760}` |
| Unhandled exception | `500` | `{"success": false, "error": "<message>"}` |

---

## 4. Response conventions

1. **Prefer checking HTTP status first** for `400`, `413`, `500`.
2. For **`200`** responses, always read **`success`** on the root object for text extraction.
3. If `success` is `true` and `openai_parsed` is missing, check **`openai_error`**.
4. **`excel_insertion`** reflects SharePoint/Excel only; it does not cancel the parsed JSON in the same response when OpenAI succeeded.

---

## 5. Structured resume schema (`openai_parsed`)

The model is instructed to return a single JSON object. Top-level keys:

| Key | Type | Description |
|-----|------|-------------|
| `basic_information` | object | `name`, `cnic`, `current_salary`, `expected_salary`, `residential_city_or_full_address`, `number`, `email_address`, `linkedin_url`, `github_url` (each may be `null`). |
| `technical_skills` | array of strings | Global skills section. |
| `work_experience` | array | Each item: `employer`, `job_title`, `start_date`, `end_date`, `tech_stacks` (array), `shift_type`, `work_mode`, `projects` (array of `project_name`, `contribution_notes`). |
| `standalone_projects` | array | Projects not tied to an employer; includes optional `project_link`, `description`, domains, etc. |
| `education` | array | `university`, `degree`, `major`, `start_year`, `end_year`, `topper`, `grades`. |
| `certifications` | array | Certification fields including URLs and issuing body. |
| `achievements` | array | Achievements / awards / hackathons, etc. |

Exact nullability and enums (e.g. `shift_type`, `work_mode`) follow the system prompt in `app.py`. Arrays may be empty.

---

## 6. Error and edge cases

| Scenario | What the client sees |
|----------|----------------------|
| OpenAI returns truncated JSON (`finish_reason: length`) | `openai_error` or nested error in OpenAI helper; may include `raw_response`. |
| OpenAI returns invalid JSON | `openai_error` with parse details; possibly `raw_response`. |
| Excel / Graph failure | `excel_insertion.success === false` and `excel_insertion.error`; `openai_parsed` may still be present. |
| DOC/DOCX | `success: false`, `error` explains conversion to PDF is needed. |

---

## 7. Example: Next.js client

```typescript
// app/actions/uploadResume.ts or client component — adjust API_BASE for your deployment
const API_BASE = process.env.NEXT_PUBLIC_RESUME_PARSER_URL ?? "http://localhost:5000";

export async function parseResume(file: File) {
  const formData = new FormData();
  formData.append("resume", file); // field name must be "resume"

  const res = await fetch(`${API_BASE}/api/parse-resume`, {
    method: "POST",
    body: formData,
    // do not set Content-Type header — browser sets multipart boundary
  });

  const data = await res.json();

  if (res.status === 413) {
    throw new Error(`File too large (max ${data.max_size_bytes} bytes)`);
  }
  if (res.status === 400 || res.status === 500) {
    throw new Error(data.error ?? "Request failed");
  }

  if (!data.success) {
    throw new Error(data.error ?? "Could not read resume file");
  }

  if (data.openai_error) {
    throw new Error(data.openai_error);
  }

  return {
    parsed: data.openai_parsed,
    usage: data.openai_usage,
    excel: data.excel_insertion,
    rawText: data.text,
  };
}
```

**Environment variable in Next.js:** e.g. `.env.local`:

```env
NEXT_PUBLIC_RESUME_PARSER_URL=https://api.yourdomain.com
```

---

## Changelog (backend updates for external frontends)

- **CORS:** Scoped to `/api/*`, configurable via `CORS_ORIGINS`; allows `Content-Type` and `Authorization` headers; supports `GET`, `POST`, `OPTIONS`.
- **413:** JSON body for uploads exceeding `MAX_CONTENT_LENGTH`.
- **Upload lifecycle:** Temporary file is removed in a `finally` block after processing so **SharePoint resume upload** receives a valid path during `insert_resume_to_excel`.

---

*Generated for the `resume-parser` Flask service. Update this file if routes or schemas change.*
