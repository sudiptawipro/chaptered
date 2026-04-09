# Chaptered — Product Backlog

> Add items below. Format: **[AREA] Title** → description. Priority: 🔴 High / 🟡 Medium / 🟢 Low

---

## 🎓 Attendance

**[ATT-1] Fix data model — per-day timing** 🔴
Current `ClassSchedule` stores one time for all days. Need a day→time map so e.g. Maths Monday 7pm, Wednesday 8pm is supported.

**[ATT-2] Add schedule start date** 🔴
Without a start date anchor, pending class calculation looks back 60 days and shows false "missed" classes for any new subject. Each subject schedule needs a start date.

**[ATT-3] Move Weekly Schedule into Subject Edit** 🔴
Weekly Schedule page/section is redundant. All schedule config (days, per-day time, start date) moves into Subject Edit only. Weekly Schedule nav item removed.

**[ATT-4] Dashboard pending attendance — confirmation popup** 🟡
One-tap silent tagging is risky. A mis-tap logs the wrong status permanently. Should show a small confirm popup (or inline undo toast) before writing the attendance log.

**[ATT-5] Attendance tab — calendar view** 🟡
Replace the flat log list with a monthly calendar grid. Each day cell shows subject + status as a colour dot/badge. Subject filter dropdown above the grid. Flat log moves to a secondary "History" section below.

---

## 📅 Calendar & Planner

**[CAL-1] Kill Planner as a separate page** 🟡
Planner is just a filtered view of Calendar data. Remove it from the sidebar. Its functionality (day detail, homework, exams) absorbed into the Calendar day-click panel.

**[CAL-2] Calendar — day-click inline panel** 🟡
Clicking a day on the month grid opens a right-side drawer on the same page showing: events that day, homework due, upcoming exams (next 7 days), online classes from subject schedule. Add Event lives inside this panel — no separate page.

**[CAL-3] Single event-creation entry point** 🔴
Currently events can be added from 3 places (Calendar, Planner, Weekly Schedule). After CAL-1 + CAL-2 + ATT-3 land, the only place to add calendar events is the Calendar day panel.

---

## 🧪 Tech / Quality

**[TECH-1] Tests for new attendance model** 🟡
Once ATT-1 and ATT-2 land, update reducer tests to cover per-day timing and start date logic.

---

<!-- Add new items below this line -->
