# Plan: School Setup Wizard + Printable PDF Guide

Two deliverables in one go:
1. **In-app Setup Wizard** — a guided, step-by-step flow at `/setup-wizard` that walks the Chairman through populating a brand-new school (Steps 1–10).
2. **Printable PDF Guide** — a polished PDF version of the complete app guide, downloadable from the wizard and saved to `/mnt/documents/`.

---

## Part A — In-App Setup Wizard

### Where it lives
- New route: `/setup-wizard` (Owner-only, protected)
- Entry points:
  - "Setup Wizard" card on the Owner Dashboard (shown when key tables are empty)
  - "Setup Wizard" link in the sidebar (visible only to Owner)
  - Auto-redirect prompt on first Chairman login if no classes exist (dismissible)

### Layout
- Left rail: vertical stepper (10 steps) with Done / Current / Locked states
- Right pane: the active step's form, helper text, and a live "what you've added so far" mini-list
- Footer: Back / Skip / Save & Continue
- Progress bar at the top + percentage complete
- Each step is independently saveable; user can leave and resume anytime (progress derived from the database, not local state)

### The 10 steps

| # | Step | What the form does |
|---|------|--------------------|
| 1 | **Subjects** | Add subjects in bulk (name + code). Pre-filled suggestions: Math, English, Science, Social Studies, Hindi, Computer, PE. User can add/remove rows. |
| 2 | **Classes** | Add grade levels with academic year. Pre-filled suggestions: Nursery → 12th. Multi-add. |
| 3 | **Sections** | For each class created in Step 2, quick-add sections (A, B, C…) with capacity. |
| 4 | **Staff** | Create teachers, accounts, non-teaching. Reuses existing Create Staff form, but allows adding multiple in a session with a running list. |
| 5 | **Assign Teachers to Sections** | Grid: rows = sections, columns = subjects, dropdown = teacher. Mark one teacher per section as Class Teacher. |
| 6 | **Students** | Bulk-friendly student entry (one at a time with quick "Add another"). Section dropdown populated from Step 3. |
| 7 | **Timetable** | Per section, weekly grid (Mon–Sat × time slots). Pick subject + teacher per cell. Allow "Copy from another section". |
| 8 | **Holidays** | Calendar input + name + recurring toggle. Multi-add. |
| 9 | **Fee Types** | Name + amount + frequency. Pre-filled suggestions: Tuition, Transport, Library, Exam. |
| 10 | **Assign Fees to Students** | Bulk-assign: pick a fee type + due date + select students (by section or all). Generates fee records. |

Final screen: "Setup Complete" summary (counts of everything created) + button to download the PDF guide.

### Step gating
- Each step checks the database for prerequisite data:
  - Step 3 locked until Step 2 has ≥1 class
  - Step 5 locked until Step 4 has ≥1 teacher AND Step 3 has ≥1 section
  - Step 6 locked until Step 3 has ≥1 section
  - Step 7 locked until Steps 3, 4, and 1 are done
  - Step 10 locked until Steps 6 and 9 are done
- Steps the user already completed earlier (e.g., subjects already exist) auto-mark as Done with a "Manage" button instead of a form.

### Technical pieces

**New files:**
- `src/pages/SetupWizard.tsx` — main wizard shell, route handler
- `src/components/wizard/WizardStepper.tsx` — left rail stepper
- `src/components/wizard/WizardLayout.tsx` — shared layout (header, footer, progress)
- `src/components/wizard/steps/Step1Subjects.tsx`
- `src/components/wizard/steps/Step2Classes.tsx`
- `src/components/wizard/steps/Step3Sections.tsx`
- `src/components/wizard/steps/Step4Staff.tsx`
- `src/components/wizard/steps/Step5TeacherAssignments.tsx`
- `src/components/wizard/steps/Step6Students.tsx`
- `src/components/wizard/steps/Step7Timetable.tsx`
- `src/components/wizard/steps/Step8Holidays.tsx`
- `src/components/wizard/steps/Step9FeeTypes.tsx`
- `src/components/wizard/steps/Step10AssignFees.tsx`
- `src/components/wizard/steps/StepComplete.tsx`
- `src/hooks/useWizardProgress.ts` — single hook that queries counts from each table to determine completion state
- `src/hooks/useSubjects.ts` — new (currently no subjects hook exists)
- `src/hooks/useSectionTeachers.ts` — new (for Step 5)

**Edited files:**
- `src/App.tsx` — register `/setup-wizard` route inside the protected layout
- `src/components/layout/DashboardLayout.tsx` — add "Setup Wizard" sidebar entry, Owner-only
- `src/components/dashboard/OwnerDashboard.tsx` — add "Setup Wizard" CTA card when school is empty

**Reused:**
- All existing mutations (`useCreateStudent`, `useCreateStaff`, `useClasses`, `useFees`, `useTimetable`, etc.)
- Existing `create-user` edge function for staff/student auth account creation
- Existing role-based permissions and RLS policies (no DB changes needed)

**No database migrations required.** All tables, RLS, and the `create-user` function already exist.

---

## Part B — Printable PDF Guide

### What's in it
A polished, branded PDF (~6–8 pages) with:
1. Cover page — School Management System User Guide
2. Table of contents
3. App overview & 5 user roles (with role permission matrix)
4. Module overview (all 13 modules, one-line description each)
5. Data relationship diagram (ASCII-style or simple boxes)
6. **The 10-step setup checklist** (matches the in-app wizard exactly)
7. Daily operations (steps 11–15)
8. Test credentials reference table
9. Quick reference cheat sheet (last page, designed for printing)

### Where it lives
- Generated to `/mnt/documents/school-setup-guide.pdf`
- Downloadable from:
  - The wizard's "Setup Complete" screen
  - A "Download Guide" button on the Owner Dashboard
- The button links directly to the PDF artifact (no on-the-fly generation in the app)

### How it's generated
- Python script using **reportlab** (Platypus) — already covered by the PDF skill
- Letter size, 1-inch margins, clean typography (Helvetica)
- Tables for the role matrix and credentials
- Page numbers in footer
- After generation: convert to JPEG with `pdftoppm` and visually QA every page before delivery
- Saved as a `<lov-artifact>` so the user can preview/download immediately

---

## Order of execution

1. Generate the PDF guide first (independent, instant value)
2. Build the wizard scaffolding (route, layout, stepper, progress hook)
3. Build steps 1–3 (Subjects, Classes, Sections)
4. Build step 4 (Staff) reusing existing form
5. Build step 5 (Teacher↔Section assignments) — most novel piece
6. Build steps 6–10
7. Add sidebar entry + dashboard CTA + completion screen with PDF download
8. Manual smoke test: log in as Chairman, walk through the wizard end-to-end on a fresh-feeling school

---

## Out of scope (call out for clarity)
- No new database tables, no schema changes, no RLS edits
- No bulk CSV import (could be a follow-up)
- No "reset/clear school data" button
- Wizard does not delete or modify existing data — only adds
