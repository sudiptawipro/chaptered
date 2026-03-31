# Antigravity Task Prompt: Chaptered App Feature Completion & Refactoring

Hello Antigravity. Please read this prompt carefully. Your overall objective is to execute a series of 15 requested changes/fixes to the `Chaptered` application codebase, prioritizing a fully offline-first local storage architecture. 

Currently, the React app (`src/` in the active workspace) tracks state under `AppContext.tsx`. You need to implement the following changes efficiently, migrating the app to robust `localStorage` (via `localforage` for asset handling) and fixing several features and UI/UX bugs in the application. Let's break down the requirements step-by-step.

## 1. Storage & Architecture Shift (Local Only)
1. **Local Storage Everywhere:** Strip out any external backend integration logic (like Supabase or Firebase, if it exists). The app must purely use local device storage.
   - **Action:** Install and integrate `localforage` (or a similar IndexedDB wrapper). Update `AppContext.tsx` so that `AppState` is loaded from and persisted to IndexedDB seamlessly.
2. **Media Support Guidelines:** Implement robust support for handling rich media (text, images, video). Base64 encode images/videos selected by the user, and store them in the new IndexedDB schema. Ensure UI components handle these Data URIs correctly.
3. **No Deployment (Local Run):** The app must not depend on external deployed APIs, except for the Gemini API (which should read its key directly from a local settings input or `.env.local`). It will be run locally via `npm run dev` or a local static HTML build.
4. **Google Drive Sync (Export/Import):** Add "Export Data" and "Import Data" buttons in the Settings page. "Export Data" should download the entire `localforage` state as a `chaptered_backup.json` file. The user will place this in their Google Drive folder manually. "Import Data" will let the user upload this `.json` file to restore their data on a different laptop.
5. **Reset Data:** Add a "Reset App Data" button in Settings. It should drop all IndexedDB local data after a strict confirmation modal. It will not touch the Google Drive JSON backup because that file is managed externally by the user.

## 2. Planner & Calendar Enhancements
6. **Outlook-Style Series for Daily Planner:** Update the Add Event/Block modal in `src/pages/Planner.tsx`. Instead of capturing just one time slot, the modal must include **"Start Date"** and **"End Date"** inputs (with time). The logic must generate a series of calendar/planner blocks over those multiple days/weeks into the context state.
7. **Better Daily Planner Pop-up:** The current Planner pop-up (for adding/editing blocks) has a poor UI and looks untidy. Redesign this overlay into a clean, modern modal: dark background, neat padding, legible form labels, and properly aligned save/delete buttons.

## 3. Settings & Data Customization
8. **Configurable Dropdowns:** In `src/pages/Settings.tsx`, add a "Configurations" tab. Allow the user to define and manage dynamic string lists for: 
   - `Exam Types` (e.g., Unit Test, Final)
   - `Event Types` (e.g., School, Online, Self-Study)
   - `Doubt Categories` (e.g., Concept, Formula) 
   Update all app forms to map over these dynamic arrays from `AppContext` instead of hardcoded arrays.
9. **Settings Buttons Fix:** In `src/pages/Settings.tsx` (or `Profile`), you must fix the save buttons which are currently not responding. Wire them up correctly to update `AppContext` and show a success toast on click.

## 4. Academic Features
10. **Marks Capture & Progression:** Introduce a new data module in AppState called `TestMarks`. 
    - The user needs to log test marks for a Subject/Chapter (e.g. Type: Mid Term, Marks: 45/50). 
    - Provide a new UI section (perhaps in the Subject Detail page) to visualize this using `recharts`. Display a line chart showing percentage performance tracking over time for these exams to visualize improvement.
11. **Quiz Generation & Mark History:** In `src/pages/Quiz.tsx`, add the AI Quiz Question Generation flow as outlined in `FEATURES.md`. 
    - Track the score of every quiz taken. 
    - Display a "Quiz Marks History" list that shows previous scores out of total for that chapter.
12. **Fix Missing Flashcards:** In `src/pages/ChapterDetail.tsx` (Flashcards tab) or the Quiz page, the cards are currently not rendering securely. The `FlipCard` array logic is broken. Fix the rendering logic to properly pass questions and answers to the `FlipCard` component so they show up.

## 5. UI/UX Tweaks
13. **Doubt Bank Color Override:** Modify the Doubt Bank styling to replace the current "violet" accent color with something different (e.g., Amber, Teal, or Blue, depending on the theme schema). Change borders, tags, and icon colors referencing violet.
14. **Clean Doubt Pop-up:** Redesign the current Doubt / Ask AI result pop-up. The pop-up is not looking good. The result should be displayed in a neat way formatting the 4-part AI response (Simple Answer, Explanation, Example, Remember) with excellent readability.
15. **Focus Timer Music Support:** In `src/pages/Timer.tsx`, only the "Lo-fi" music stream is working. Review the YouTube embed URLs for the "Nature Sounds" and "Chill Beats" options. Fix the string formats to `https://www.youtube.com/embed/VIDEO_ID?autoplay=1&loop=1` or whichever is appropriate so all streams play correctly.

## Verification Steps
- Please test the complete integration of `localforage`. Verify that large arrays of media do not hit quota issues.
- Validate that the data Export file outputs correct JSON format, and test the Import data ingestion.
- Remember: the user wants to be wowed. Create excellent modern UI interfaces for the redesigned popups and graphs. Check and test every single feature upon completion.

**Start your execution by examining `src/context/AppContext.tsx` for the data model, and proceed feature by feature.**
