# Dashboard redesign: Library + one-page story editor

Status: draft for review · Date: 2026-10-27 · Branch: `edit/dashboard-page`
Mockups: https://claude.ai/artifact/CdqPnYrE7YQcUJEhXqKZ4o (option 2: "Story library" and "One-page editor")

## 1. Goal

Make the owner dashboard simple to use, especially for stories, without losing any current function.

Problems this fixes (confirmed with the owner):
1. One story is split across three tabs (Geschichten, Wörter, Quiz) that are linked by hand.
2. Sentences are typed into one `Deutsch || Kurdisch` textarea with mixed text directions.
3. Form on top and list below, so editing scrolls away from the list.
4. No way to see a story the way students see it, and no overview of what is missing.

Constraints that were decided:
- Every word list and quiz belongs to a story. There are no standalone topics.
- The owner works mainly on a laptop. Phone must still work, with sections stacked.
- Content arrives both typed by hand and pasted in bulk.

## 2. Scope

In scope:
- A new dashboard with three sections: **Geschichten** (library + editor), **Schüler**, **Einstellungen**.
- A one-page story editor that edits the story, its word list and its quiz together and saves them in one go.
- Splitting `src/pages/Dashboard.jsx` (801 lines) into small files under `src/pages/dashboard/`.

Out of scope:
- Changing the Firestore data model.
- Changing student pages.
- Drafts (stories hidden from students until published). The owner decided against them: every save publishes immediately, as today.
- Reordering stories by drag and drop (that was option 4).
- Moving images from R2 to Firebase Storage.
- Cleaning up old cover files in R2.

## 3. Screens

All labels stay bilingual DE/KU through `bi(de, ku)`, as today. The page follows the app direction (RTL for Kurdish).

### 3.1 Dashboard shell
- Header: "Dashboard" plus a section switch with **Geschichten · Schüler · Einstellungen**.
- One summary line under the header: `17 Geschichten · 155 Wörter · 111 Fragen · N Schüler`. This replaces the four stat tiles and the Übersicht tab.

### 3.2 Library (`/dashboard`)
- Level filter chips: `Alle · 17`, `A1 · 7`, `A2 · 5`, `B1 · 5`, `B2 · 0`.
- A search box matching the German or Kurdish title.
- A card grid with a "Neue Geschichte" card first, then stories sorted by level and then `order`.
- Each card shows:
  - the cover image, or a placeholder tinted by level if there is no cover
  - a level badge
  - the German and Kurdish titles
  - three health chips:
    - green `✓ 7 Sätze` / `✓ 5 Wörter` / `✓ 3 Fragen` when present
    - orange `Wörter fehlen` / `Quiz fehlt` when empty
    - orange `2 ohne Übersetzung` when some sentences have no Kurdish
- Clicking a card opens the editor. An empty filter result shows an EmptyState with a "Neue Geschichte" button.

### 3.3 Story editor (`/dashboard/stories/:storyId`, `/dashboard/stories/new`)
- A back link "← Alle Geschichten", the titles as the page heading, and a "Wie Schüler es sehen" link. That link opens `/stories/:level/:id` in a new tab and only shows for saved stories.
- A jump menu on the left (it stacks above the content on a phone): Details ✓ · Sätze n · Wörter n · Quiz n. It uses anchor links and is not sticky.
- **Details:**
  - The cover, with a "Titelbild ändern" button. It uses the same upload flow as today (`toJpeg` → `uploadImage("cover")`).
  - German title, Kurdish title, reading time.
  - Level as four toggle buttons (A1 A2 B1 B2) instead of a select.
- **Sätze:**
  - One row per sentence: number, German input (LTR), Kurdish input (RTL), and buttons to move up, move down and delete.
  - "+ Satz hinzufügen".
  - "Viele Sätze einfügen" opens the bulk paste panel (§5.3).
- **Wörter:**
  - One row per word: German word, Kurdish meaning, and a "Beispiel ▾" toggle that reveals the German and Kurdish example sentences, plus delete.
  - "+ Wort hinzufügen".
  - A hint that these words become tappable in the story.
- **Quiz:**
  - A compact list ("question · Richtig: X · n Antworten") with "Bearbeiten".
  - Editing expands the question in place: German and Kurdish question inputs, then answer rows each with a radio button for the correct answer, plus "+ Antwort" and delete.
  - "+ Frage hinzufügen".
  - "Fragen aus den Wörtern erstellen" (§5.4).
- **Save bar:** sticky at the bottom, and only visible when something changed. It shows "● Nicht gespeicherte Änderungen", **Verwerfen** and **Speichern**. Saving makes the changes visible to students immediately.
- **Danger zone** at the end of the page: "Geschichte löschen". It deletes the story with its word list and quiz, after a confirmation.

### 3.4 Schüler (`/dashboard/students`)
The current Students tab moves here with the same behaviour: create a student and show the code, edit, delete, search.

### 3.5 Einstellungen (`/dashboard/settings`)
- **Ankündigung:** the current announcement box.
- **Sicherung:** export, import, "Neue eingebaute Inhalte hinzufügen", "Titelbilder in den Speicher verschieben", reset. Same behaviour and confirmations as today.
- **Einrichtung:** the current SetupBox. It shows only when needed, as today. The library also shows a short pointer to it when the database is empty.

## 4. Routes

Nested under the existing owner-only route in `AppRoutes.jsx`:

```
/dashboard                      Library
/dashboard/stories/new          Editor, empty story
/dashboard/stories/:storyId     Editor
/dashboard/students             Schüler
/dashboard/settings             Einstellungen
```

URL routes give a working browser back button and links you can share.

## 5. Data and behaviour

### 5.1 The story bundle
The editor works on one plain object, the bundle. It is built from the three collections:

```
StoryBundle = {
  id, level, order?,
  titleDe, titleKu, readTime, coverImage,
  segments:  [{ de, ku }],
  words:     [{ wordDe, wordKu, sentenceDe, sentenceKu }],
  questions: [{ questionDe, questionKu, options: string[], correctAnswer }],
  wordTopicId: string | null,   // existing linked doc ids, null if none yet
  quizId:      string | null,
}
```

**Loading:**
- Take the story, plus the word topic and the quiz linked to it by `storyId`.
- If there are several, prefer the one whose id equals the story id, otherwise take the first.
- If the story has more linked word lists or quizzes, the editor shows a small notice ("2 weitere verknüpfte Wortlisten bleiben unverändert") and leaves them alone.

**Saving** is one Firestore `writeBatch`, so the three documents are always saved together:
- `stories/{id}`: the story fields. `order` is kept for existing stories.
- `wordTopics/{wordTopicId ?? id}`: `{ level, titleDe, titleKu, storyId: id, words }`. The doc is deleted if `words` is empty.
- `quizzes/{quizId ?? id}`: `{ level, titleDe, titleKu, storyId: id, questions }`. The doc is deleted if `questions` is empty.

Level and titles are copied from the story to its topic and quiz on every save, so they can't drift apart as they can today.

**New stories** get an id from the German title (the existing `uid()` helper) at their first save. The URL then changes from `/new` to `/:storyId` with `replace`.

**Deleting** is one batch that removes the story and every word topic and quiz with `storyId === id`.

### 5.2 Validation
- **Saving** needs a German title, a cover and at least one sentence with German text (the same rules as today).
- Every quiz question needs German question text, at least two non-empty answers and one marked correct.
- Missing Kurdish translations, no words or no quiz are **warnings** shown on the card. They don't block saving.
- Errors are shown next to the field, and the page scrolls to the first one.

### 5.3 Bulk paste ("Viele Sätze einfügen")
- An inline panel with two textareas: Deutsch (LTR) and Kurdisch (RTL), one sentence per line, paired by line number.
- **Old format:** if every non-empty line in the German box contains `||`, the lines are split as in the old format. That keeps old copy-paste habits working.
- **Live preview:** "7 deutsche, 6 kurdische Zeilen". Lines without a partner are listed in orange.
- **Actions:** "Anhängen" (append) and "Alle Sätze ersetzen" (replace all, with a confirmation).
- **Implementation:** a pure function `parsePaste(deText, kuText) → { segments, unmatched }`.

### 5.4 "Fragen aus den Wörtern erstellen"
- For each word that has a Kurdish meaning and no question yet that contains `'<wordDe>'`, it adds a question:
  - question: `Was bedeutet '<wordDe>'?` / `رامانا '<wordDe>' چییە؟`
  - answers: the correct `wordKu` plus up to 3 other `wordKu` values, shuffled
- **Distractors** come from this story's other words first, then from other stories at the same level.
- **Too few answers:** a word is skipped if fewer than 2 answers are possible.
- **Questions go in unsaved.** They are added to the editor, and the owner reviews them before saving.
- **Implementation:** a pure function `generateQuestions(words, existingQuestions, distractorPool, rng)`.

### 5.5 Unsaved changes
- **Dirty check:** the bundle is compared with the version loaded from the store (JSON compare).
- **Browser close and reload:** while there are unsaved changes, a `beforeunload` prompt warns before the page closes.
- **In-app navigation:** "← Alle Geschichten" and the dashboard section switch ask "Änderungen verwerfen?" when there are unsaved changes.
- **Limitation:** the app uses `BrowserRouter`, so `useBlocker` isn't available. Leaving through the main app sidebar while there are unsaved changes is not intercepted. This is accepted for now.
- **Edits on another device:** while the editor is open, live updates to the same story from elsewhere don't overwrite the form. The last save wins, as today.

## 6. Code structure

```
src/data/storyBundle.js          pure: loadBundle, bundleToDocs, validateBundle, parsePaste,
                                 generateQuestions, storyHealth (for the card chips)
src/data/stories.js              + saveBundle(bundle), deleteBundle(id)
src/pages/dashboard/
  DashboardLayout.jsx            header, summary line, section switch, <Outlet/>
  ui.jsx                         useBi, Bi, Field, Msg, SearchBox, LevelToggle, SectionCard (moved from Dashboard.jsx)
  LibraryPage.jsx                filters, search, card grid
  LibraryCard.jsx
  editor/StoryEditorPage.jsx     loads the bundle, owns state, dirty check, save, delete
  editor/JumpNav.jsx
  editor/DetailsSection.jsx
  editor/SentencesSection.jsx
  editor/BulkPaste.jsx
  editor/WordsSection.jsx
  editor/QuizSection.jsx         list plus the in-place question editor
  editor/SaveBar.jsx
  StudentsPage.jsx               moved StudentsTab
  SettingsPage.jsx               announcement, backup, setup (moved code)
src/pages/Dashboard.jsx          deleted
src/routes/AppRoutes.jsx         nested dashboard routes
docs/CODEBASE.md, docs/CLAUDE.md updated for the new structure and the test command
```

Each editor section receives `value` and `onChange` for its own part of the bundle, and owns no Firestore logic. `StoryEditorPage` is the only component that reads from or writes to the store.

## 7. Testing and verification

- Add **Vitest** (dev dependency only, `npm test`) and unit-test the pure functions in `storyBundle.js`:
  - loading with zero, one or several linked topics
  - `bundleToDocs` deleting empty word lists and quizzes
  - validation rules for stories and quiz questions
  - `parsePaste` with the two-box and `||` inputs and mismatched line counts
  - `generateQuestions` with a seeded rng and its distractor fallback
- `npm run lint`: there should be no new errors beyond the 4 known ones.
- A manual check in `npm run dev` as the owner:
  1. Create a story with sentences, words and a quiz. Confirm it appears for students with its tappable words and its quiz.
  2. Check that saving without a title, cover or sentence shows the errors and saves nothing.
  3. Edit sentences, words and the quiz of a built-in story, and confirm the student pages show the changes.
  4. Delete the story, and confirm its word list and quiz are gone too.
  5. Check that Schüler and Einstellungen still do everything the old tabs did.
  6. Check the layout at phone width and in Kurdish (RTL).

## 8. Decisions and notes

1. **Drafts:** not included (owner's decision). Every save publishes.
2. **Tests:** Vitest is added for the pure logic (owner's decision).
3. **Kurdish labels:** new interface labels need Kurdish (Badini) text. Existing strings are reused where they fit. New Kurdish strings are marked with a `// KU: review` comment so the owner can check them.
