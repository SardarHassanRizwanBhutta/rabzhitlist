# Call Notes — Analyze Notes (User Guide)

**For:** Recruiters using Cold Caller mode  
**Version:** 1 (planned)  
**Last updated:** August 2026

This guide explains how to turn your phone-call notes into candidate profile fields — in plain language, step by step.

---

## What is this feature?

During a cold call, you often write everything in one place: salary, employer name, tech stacks, benefits, project details, and so on.

**Analyze Notes** reads those notes and **suggests** values for empty fields on the candidate profile. **You always review and approve** before anything is filled in. Nothing is saved to the profile until **you** save the candidate afterward.

Your written notes stay **exactly as you typed them**. The system does not rewrite or “clean up” your notes.

---

## Where you use it

1. Open a candidate in **Cold Caller** mode.  
2. Switch to the **Call Notes** view (the unstructured notes area — not the field-by-field “Fields” view).  
3. Type or paste what was said on the call in the **Call Notes** box.

That is the only place this feature lives for now. Call notes are not shown on the main candidate details screen elsewhere in the app.

---

## The two buttons (existing candidates)

When the candidate **already exists** in the system, you will see:

| Button | What it does |
|--------|----------------|
| **Save Notes** | Saves your call notes text so they are kept on file for this candidate. Use this when you want to store the notes themselves. |
| **Analyze Notes** | Reads the text currently in the box (even if you have **not** saved yet) and opens a **review screen** with suggested profile values. |

These work **independently**. You can analyze first and save notes later, or save first and analyze later.

---

## How a typical call works (existing candidate)

### Step 1 — Write your notes

Type naturally during or after the call. For example:

```text
Current salary is 150,000. At Swipbox he worked on .NET and Azure.
Shift was morning, remote. He gets paid leaves and matrimonial leave.
```

You do not need to fill individual form fields during the call.

### Step 2 — Optional: Save Notes

Click **Save Notes** if you want the notes stored on the candidate record.  
You can skip this and go straight to Analyze Notes if you only want to fill profile fields first.

### Step 3 — Analyze Notes

Click **Analyze Notes**.

- The button is available when there is text in the notes box and there is at least **one empty profile field** the feature can fill.  
- If every relevant field is already filled, Analyze will not run — there is nothing empty to suggest.  
- While analysis is running, wait for the review screen to open.

### Step 4 — Review suggestions (required)

A **review screen** opens (separate step — not hidden inside the notes box). For each suggestion you may see:

- **Which field** it would fill (e.g. Current Salary, Tech Stacks)  
- **Suggested value**  
- **Which part of your notes** it came from  
- A **confidence** indicator (how sure the system is)

**You must review everything.** Nothing is applied automatically.

For some fields (e.g. employer or project names), you may need to **pick the correct match** from a list or confirm creating a new entry — same idea as elsewhere in Cold Caller.

- **Uncheck** any suggestion you do not want.  
- Fix or skip anything that looks wrong.

### Step 5 — Apply Selected

Click **Apply Selected** to fill in the profile fields you kept checked.

Important rules:

- **Only empty fields** are filled. If a field already has a value, it will **not** be overwritten.  
- Your **Call Notes text does not change** when you apply.  
- Applying does **not** save the candidate profile yet — it only prepares the form.

### Step 6 — Save the profile

Open the candidate form (Edit mode) and check the filled values. When you are satisfied, use **Update & Verify** (or your usual save flow) to save the profile to the system.

---

## New candidates (draft / before create)

If you opened Cold Caller from **Auto-Profiler** and the person is **not created yet**:

- There is **no Save Notes** button — notes stay on your device until you create the candidate.  
- You still have **Analyze Notes** and **Apply to Create Candidate**.

### Draft flow

1. Write call notes in the box.  
2. Click **Analyze Notes** → review → **Apply Selected**.  
3. Suggested values are placed into the **Create Candidate** form (empty fields only).  
4. Click **Apply to Create Candidate** (or continue in Create) and complete creation as usual.  
5. If your notes are not empty, they are **still saved with the new candidate** when you create them — same as today.

You can also use **Apply to Create Candidate** **without** analyzing, if you only want to carry the notes forward and fill the form yourself.

---

## Which profile fields can be filled?

Analyze Notes focuses on the **same high-value Cold Caller fields** you already collect in that mode — not every field on the full create form.

**Can be suggested (when empty):**

- **Basic:** LinkedIn URL (resume attachment is not filled from notes alone)  
- **Preferences:** Current salary, expected salary  
- **Work experience — role:** Job title, start date, shift type, work mode, tech stacks, time support zones, benefits  
- **Work experience — employer:** Employer name, headcount, company type, founded year, salary policy, status, LinkedIn, office locations, layoff history  
- **Work experience — projects:** Project name, dates, status, description, contribution notes, tech stacks, domains, team size, client locations, latest update, and related project details  
- **Certifications:** Name, issuing body, issue date, expiry date  
- **Achievements:** Name, year, description, type, ranking, URL  

**Not filled by Analyze Notes (version 1):**

- Top-level independent tech stacks (not shown in Cold Caller Call Notes)  
- Education  
- CNIC, personality type, posting title, and other create-only fields outside Cold Caller  
- Any field that **already has a value**  
- Replacing or editing your call notes text  

---

## What the feature will **not** do

| Behavior | Detail |
|----------|--------|
| Auto-run on save | Analysis only starts when **you** click **Analyze Notes**. |
| Auto-apply | You must open the review screen and click **Apply Selected**. |
| Overwrite existing data | Only **empty** fields receive suggestions. |
| Change your notes | Notes change only when **you** edit them or click **Save Notes**. |
| Guarantee every empty field | Only **high-confidence** matches are shown. You may get few or no suggestions. |
| Fill education or non–Cold Caller fields | See list above. |

---

## When Analyze Notes is unavailable

The button may be disabled if:

- The notes box is **empty**  
- There are **no empty fields** left that Analyze Notes supports  
- Analysis is **already running**  
- The feature is **not yet enabled** in your environment (early rollout)

Short messages on screen will explain which case applies.

---

## If something goes wrong

- **“No high-confidence values found”** — The system did not find clear enough matches in your notes for empty fields. You can edit the notes and try again, or fill fields manually.  
- **Analysis failed / timed out** — Try **Analyze Notes** again. Your notes are unchanged.  
- **Wrong employer or project match** — In the review screen, pick the correct match or skip that row before applying.  
- **Applied but profile not updated in the system** — Remember: after **Apply Selected**, you still need **Update & Verify** (existing candidate) or **Create Candidate** (new candidate).

---

## Good practices

1. **Write clearly** — Mention employer names, numbers, and dates in full sentences; better notes give better suggestions.  
2. **Review every suggestion** — Treat Analyze Notes as a helper, not a final answer.  
3. **Save notes when they matter** — For existing candidates, use **Save Notes** so the conversation is on record even if you do not apply suggestions.  
4. **Save the profile after apply** — Applied values are not permanent until you update or create the candidate.  
5. **Re-analyze if needed** — You can run **Analyze Notes** again after editing notes or after filling some fields manually (only remaining empty fields will be considered).

---

## Quick reference

| I want to… | Do this |
|------------|---------|
| Keep call notes on file (existing candidate) | **Save Notes** |
| Turn notes into profile suggestions | **Analyze Notes** → review → **Apply Selected** |
| Save profile changes | **Update & Verify** or **Create Candidate** |
| Start create form with notes only (no AI) | **Apply to Create Candidate** (draft mode) |
| Fill fields without overwriting | Automatic — only empty fields are targeted |

---

## Summary

Analyze Notes lets you **talk on the phone, write once, review once, and fill many empty Cold Caller fields** — while **you** stay in control of what is saved and your original notes stay untouched.

For technical implementation details, see the internal product documentation (not required for day-to-day use).
