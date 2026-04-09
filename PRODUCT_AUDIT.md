# Chaptered — Full Product Audit
> Current State → Proposed Changes
> Perspective: 🎓 Student (Aaryana) + 👨‍👩‍👧 Parent

---

## The Core Problem

The app was built feature-by-feature over time. Each addition made sense in isolation but the whole is now cluttered: **13 sidebar items**, duplicate entry points for the same data, and zero subject-centric thinking. A student opens the app and has to visit 5 different pages to understand where she stands on a single subject.

---

## 1. Navigation / Sidebar

| Current (13 items) | Proposed (6 items) | Rationale |
|---|---|---|
| Dashboard | ✅ Keep — redesign | Today hub |
| Subjects | ✅ Keep — make it a Subject Hub | Core feature |
| Planner | ❌ Remove | Absorbed into Calendar (week view) |
| Calendar | ✅ Keep — absorbs Planner | All date-based things live here |
| Homework | ✅ Keep standalone | High daily use, deserves its own spot |
| Doubt Bank | ❌ Remove from nav | Moves inside Subject Hub |
| Focus Timer | ✅ Keep standalone | Utility, used in isolation |
| Exams | ❌ Remove from nav | Exams = Calendar events + Subject Hub section |
| Analytics | ❌ Remove from nav | Folds into Dashboard as a Stats section |
| Revision Plan | ❌ Remove from nav | Becomes a button inside Calendar |
| Mock Exam | ❌ Remove from nav | Moves into Subject Hub → Practice section |
| Attendance | ✅ Keep — redesign | New important feature |
| Settings | ✅ Keep | Reorganised |
| Parent Dashboard | ❌ Remove from nav | Becomes a separate PIN-locked URL/mode |

**13 → 6 items: Dashboard · Subjects · Calendar · Homework · Attendance · Focus · Settings**

---

## 2. Dashboard

| Current | Proposed |
|---|---|
| Greeting + streak + study time | ✅ Keep greeting + streak — motivational |
| Homework due today (list) | ✅ Keep — most important daily widget |
| Today's schedule (calendar events) | ✅ Keep |
| Subject progress cards grid | ❌ Remove — belongs in Subjects page |
| Mood tracker (7 days) | ✅ Keep — daily habit |
| Pending attendance widget | ✅ Keep — with confirmation popup fix |
| Recent doubts widget | ❌ Remove — too detailed for dashboard |
| Onboarding empty state | ✅ Keep |
| — | ➕ ADD: Smart alert banner — "Physics exam in 2 days · only 35% syllabus done" |
| — | ➕ ADD: Weekly study bar (Mon–Sun hours) — tiny, replaces Analytics nav item |
| — | ➕ ADD: Quick-start timer button with subject picker |
| — | ➕ ADD: "This week" summary: study hours, homework done, doubts logged |

**🎓 Student view:** Open app → see what needs doing today, get a nudge if an exam is close, log mood, start a study session. No scrolling through subject cards they didn't ask for.

**👨‍👩‍👧 Parent view:** Not their page — they have Parent Mode (see §10).

---

## 3. Subjects Page (list view)

| Current | Proposed |
|---|---|
| Grid of subject cards showing % progress | ✅ Keep as entry point |
| Click card → chapter list only | ❌ Expand into full Subject Hub (see §4) |
| Add/Edit/Delete subject modal | ✅ Keep |
| Online class toggle + schedule in edit modal | ✅ Keep + fix (per-day timing, start date) |
| Weekly Schedule as separate nav item | ❌ Remove — already in Subject Edit |

---

## 4. Subject Hub (click a subject) — NEW DESIGN

| Current | Proposed |
|---|---|
| Just a chapter list with status chips | Full hub with sections |
| — | **Header:** subject name, colour, overall progress bar, next exam countdown chip |
| Chapter list | ✅ Keep — simplified, status dots, expandable for sub-chapters |
| — | ➕ **Exams section:** linked exams for this subject, readiness %, add exam button |
| — | ➕ **Homework section:** pending HW for this subject only, quick-add |
| — | ➕ **Doubts section:** open doubts for this subject, quick-add, resolve inline |
| — | ➕ **Practice section:** Flashcard quiz, Mock Exam (absorbed from nav) |
| — | ➕ **Attendance section:** if online class, this month's mini attendance summary |
| — | ➕ **Test Marks section:** scores over time (chart from Exams page absorbed here) |

**🎓 Student view:** "I have a Maths exam coming" → click Maths → see chapters, see 3 open doubts, see I'm at 60% syllabus, see my last test was 72%. Everything in one place. No bouncing between pages.

---

## 5. Calendar (absorbs Planner + Revision Plan trigger)

| Current | Proposed |
|---|---|
| Month grid + separate day panel | ✅ Keep month grid |
| Separate Planner page (hour timeline) | ❌ Remove Planner — Calendar gets a **Week/Day view** toggle |
| Add Event from 3 different places | ❌ → **Single entry point:** click a day → panel → Add Event |
| Event types in a modal | ✅ Keep |
| Exams show as dots on calendar | ✅ Keep — exams become first-class calendar objects |
| Revision Plan (separate nav) | ❌ Remove nav item → "Generate Revision Plan" button lives inside Calendar |
| Weekly Schedule (separate section) | ❌ Remove → class schedule shows as recurring events on calendar (read-only, sourced from Subject Edit) |
| — | ➕ Day-click right panel: events + homework due + exams + online classes for that day |
| — | ➕ Exam creation directly from Calendar day panel |

---

## 6. Homework

| Current | Proposed |
|---|---|
| Filter by priority / date range | ✅ Keep |
| Subject filter | ✅ Keep |
| Create / Edit / Delete / Toggle done | ✅ Keep |
| Appears on Dashboard | ✅ Keep |
| Appears in Subject Hub | ➕ Add (filtered by subject) |
| — | ➕ ADD: Overdue count badge on sidebar nav item (already exists — keep) |
| — | ➕ ADD: Quick-add from Dashboard (no need to navigate away) |

---

## 7. Attendance (redesign)

| Current | Proposed |
|---|---|
| Flat log list | ❌ Replace with **monthly calendar grid** — colour-coded dots per subject per day |
| Subject summary cards (monthly counts) | ✅ Keep as a summary strip above the calendar |
| Subject filter | ✅ Keep as dropdown above calendar grid |
| Log Class modal | ✅ Keep — also accessible from Dashboard widget |
| Schedule lives only in Subject Edit | ✅ Correct (move Weekly Schedule here) |
| One `time` for all days | ❌ Fix → per-day time map (Mon: 7pm, Wed: 8pm) |
| No start date → wrong pending calc | ❌ Fix → schedule start date field in Subject Edit |
| Dashboard one-tap silent tag | ❌ Fix → confirmation popup before writing log |
| Delete log on hover | ✅ Keep |

---

## 8. Focus Timer

| Current | Proposed |
|---|---|
| Circular timer with focus/break modes | ✅ Keep |
| Music selection (Lo-Fi, Rain, Café…) | ✅ Keep — students love this |
| Study session logging with subject | ✅ Keep |
| Weekly/monthly study charts | ❌ Remove from Timer page → move to Dashboard stats section |
| Session summary stats | ✅ Keep inline after session ends |

---

## 9. Analytics (remove as separate page)

| Current | Proposed |
|---|---|
| Standalone Analytics page in sidebar | ❌ Remove from sidebar |
| Total study time, daily average | ➕ Move mini version to Dashboard "This Week" section |
| Weekly study heatmap | ➕ Move to Dashboard |
| Study distribution by subject (pie) | ➕ Move to Subject Hub header |
| Test score trends | ➕ Move to Subject Hub → Test Marks section |
| Neglected subjects warning | ➕ Move to Dashboard as smart alert |
| Homework completion % | ➕ Already visible from Homework page |

**Why:** Nobody navigates to an Analytics page voluntarily. Surface insights where they're relevant — in context.

---

## 10. Parent Mode (replaces Parent Dashboard nav item)

| Current | Proposed |
|---|---|
| Parent Dashboard as a sidebar nav item | ❌ Remove from sidebar |
| PIN-locked settings page (0000) | ✅ Keep PIN concept |
| Settings → Overview tab (exam readiness) | ❌ Move to Parent Mode |
| Study time, homework, mood charts | ✅ Keep in Parent Mode |
| Separate analytics nav item | ❌ Absorbed here |
| — | ➕ Access via: Settings icon → "Parent View" button (PIN-protected) |
| — | ➕ Parent Mode shows: exam readiness, study hours this week, homework done %, mood trend, attendance %, open doubts count |
| — | ➕ ADD: Weekly PDF/text summary export for parent ("Share this week's report") |

**👨‍👩‍👧 Parent view:** I don't live in the app. I open it once a week, enter PIN, see the summary, done. I don't need it in the main sidebar.

---

## 11. Settings (reorganise)

| Current Tab | Proposed |
|---|---|
| Overview (exam readiness, study hours) | ❌ Remove tab → moves to Parent Mode |
| Appearance (theme, sounds) | ✅ Keep |
| Profile (name, avatar, curriculum) | ✅ Keep |
| AI Settings (Gemini, OpenAI, Anthropic keys) | ✅ Keep — rename "AI & Integrations" |
| Configurations (exam types, event types, doubt cats, block types) | ✅ Keep — rename "Customise" |
| Data & Sync (cloud code, JSON export, reset) | ✅ Keep |
| — | ➕ ADD: "Parent View" entry point with PIN prompt |

**Also fix:** PIN is hardcoded as `0000` with the hint shown on screen. Let parent set their own PIN.

---

## 12. Quiz (remove standalone page)

| Current | Proposed |
|---|---|
| Standalone Quiz page in sidebar | ❌ Remove from sidebar |
| Subject + chapter selector | ➕ Lives inside Subject Hub → Practice section |
| Flashcard flip mode | ✅ Keep |
| AI flashcard generation | ✅ Keep — inside chapter detail |
| Score tracking | ✅ Keep inline |

---

## 13. Mock Exam (remove standalone page)

| Current | Proposed |
|---|---|
| Standalone Mock Exam page in sidebar | ❌ Remove from sidebar |
| PDF upload + AI question generation | ➕ Moves to Subject Hub → Practice section |
| Exam-taking interface | ✅ Keep |
| Manual marking | ✅ Keep |
| Results history | ➕ Shows in Subject Hub → Test Marks section |

---

## 14. Revision Planner (remove standalone page)

| Current | Proposed |
|---|---|
| Standalone Revision Plan page in sidebar | ❌ Remove from sidebar |
| Auto-generate sessions from exams/chapters | ➕ Becomes a "Generate Revision Plan" button inside Calendar |
| Push to calendar button | ✅ Keep — same logic, different trigger point |
| Session duration config | ✅ Keep inline |

---

## 15. Doubts (remove standalone page)

| Current | Proposed |
|---|---|
| Standalone Doubt Bank nav item | ❌ Remove from nav |
| Log a doubt | ➕ Quick-add from Subject Hub + from Chapter Detail |
| Resolve / unresolve | ✅ Keep |
| Filter by subject / resolved | ➕ Subject-level view in Subject Hub |
| Global doubt list | ➕ Keep accessible via Subject Hub "All Subjects" view or Dashboard widget (if open doubts > 0) |

---

## 16. New Things Worth Adding

| Feature | Why |
|---|---|
| **Smart exam alert** | "Chemistry exam in 3 days — you've covered 4/9 chapters. Study now?" on Dashboard |
| **Quick capture button** | Floating `+` on every page — log homework, doubt, or note without navigating away |
| **Weekly goal** | Student sets "I want to study X hours this week" — Dashboard shows progress ring |
| **Parent PIN customisation** | Currently hardcoded `0000` — parent should set their own |
| **Weekly report export** | One-tap export of the week's summary as text/PDF for parent |
| **Rescheduled class follow-up** | When a class is marked "Rescheduled", prompt to log the new date in attendance |
| **Chapter revision flag** | Inside chapter detail — "Flag for revision" so it surfaces in the revision planner |

---

## Summary Scorecard

| Category | Current | Proposed |
|---|---|---|
| Sidebar items | 13 | 6 |
| Event entry points | 3 (Calendar, Planner, Weekly Schedule) | 1 (Calendar) |
| Pages to see everything about one subject | 5–6 | 1 (Subject Hub) |
| Parent access | Sidebar nav item | PIN-gated mode from Settings |
| Analytics surfacing | Separate page nobody opens | Inline in Dashboard + Subject Hub |
| Practice (quiz + mock) | 2 separate pages | 1 section inside Subject Hub |
| Attendance model issues | 3 known bugs | All fixed |
| Revision planning | Separate page | Button inside Calendar |
| Doubts | Separate page | Inside Subject Hub |
