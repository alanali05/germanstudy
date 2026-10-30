# Plan: English as a second learning language

Spec: `docs/superpowers/specs/2026-10-30-english-learning-language-design.md`

## Header

- **Goal:** Students learn German or English (chosen by the teacher, changeable on the profile). Each learning language has its own library of stories, words and quizzes. The interface is Kurdish plus the learning language (the teacher gets all three).
- **Architecture:**
  - Content documents carry `lang: "de" | "en"` and use neutral field names (`title`, `segments[].text`, `word`, `sentence`, `question`).
  - Documents are normalized on load (old shape tolerated).
  - The store groups content as `content[lang][col][level]`. Student pages read through `useLibrary()`, which is bound to `user.learnLang`.
  - Dashboard texts use `tr(de, ku, en)`.
  - A temporary Node script exports, migrates and imports content.
- **Tech stack:** React 19, react-router 6, Firebase 12 (Auth + Firestore), Vitest, Node 24 for the script.
- **Global constraints:**
  - Firestore is the only source of truth. No content in the repo (the English JSON and the export stay outside it).
  - The user does all git work: no commits.
  - Lint must stay at the 4 known errors (context files), and the tests and the build must pass after every task.
  - New Kurdish texts are marked `// KU: review`.
  - The dashboard follows the app language (ku | de | en).

## File structure

- **Create:**
  - `src/data/languages.js`: learning languages, names, `learnLangOf(user)`, allowed UI languages.
  - `src/data/contentShape.js`: pure `toNewShape(col, data)` (old → new fields, adds `lang`), used by the store and the script.
  - `src/data/contentShape.test.js`
  - `src/data/useLibrary.js`: hook with the content getters for the logged-in user's learning language.
  - `src/i18n.test.js`: completeness test.
  - `scripts/content-tool.mjs`: temporary export / migrate / import (deleted after use).
- **Modify:**
  - Data: `src/config.js`, `src/data/storyBundle.js` (+ test), `src/data/stories.js`, `src/data/students.js`.
  - Contexts and helpers: `src/context/AuthContext.jsx`, `src/context/LangContext.jsx`, `src/i18n.js`, `src/utils/speak.js`.
  - Components: `src/components/LangSwitch.jsx`, `StoryReader.jsx`, `QuestionCard.jsx`, `WordRow.jsx`, `StoryCard.jsx`.
  - Student pages: `src/pages/Home.jsx`, `Profile.jsx`, `stories/*`, `words/*`, `quiz/*`.
  - Dashboard: `src/pages/dashboard/**` (`bi.js` → `tr`), `src/routes/*` where needed.
  - Rules and docs: `firestore.rules`, `docs/CODEBASE.md`, `docs/CLAUDE.md`.

## Tasks

### Task 1: Learning languages module
Files: `src/data/languages.js`, `src/config.js`
Interface: produces `LEARN_LANGS`, `LANG_NAME`, `learnLangOf(user)`, `uiLangsFor(user)`, `SPEECH_LANGS`.
- [ ] `src/data/languages.js`:
```js
// Languages a student can learn, and the interface languages each user may pick
export const LEARN_LANGS = ["de", "en"];
// Name of a language, written in that language (used in toggles and pickers)
export const LANG_NAME = { ku: "کوردی", de: "Deutsch", en: "English" };
// The learning language of a profile; profiles from before English learn German
export const learnLangOf = (user) => (LEARN_LANGS.includes(user?.learnLang) ? user.learnLang : "de");
// Students: Kurdish + their learning language. The owner: all three.
export const uiLangsFor = (user) => (user?.role === "owner" ? ["ku", "de", "en"] : ["ku", learnLangOf(user)]);
```
- [ ] `src/config.js`: replace `SPEECH_LANG` with `export const SPEECH_LANGS = { de: "de-DE", en: "en-GB" }; // read-aloud voice per learning language`.
- [ ] Run `npm run build`. Expected to fail until Task 7 updates `speak.js` (the only `SPEECH_LANG` import); do Task 7 in the same sitting.

### Task 2: Content shape (pure, TDD)
Files: `src/data/contentShape.js`, `src/data/contentShape.test.js`
Interface: `toNewShape(col, data) -> data` in the new shape, with legacy keys removed and `lang` defaulting to `"de"`. `isNewShape(col, data) -> boolean`.
- [ ] Test first (`contentShape.test.js`):
  - A legacy story `{titleDe, segments:[{de, ku}]}` becomes `{lang:"de", title, segments:[{text, ku}]}` with no `titleDe` left.
  - A legacy wordTopic's words become `{word, wordKu, sentence, sentenceKu}`.
  - A legacy quiz's questions become `{question, questionKu, options, correctAnswer}`.
  - A new-shape doc comes back equal (idempotent).
  - An existing `lang:"en"` is kept.
  - Unknown fields (`number`, `storyId`, `order`) are kept.
  - `isNewShape` is false for legacy and true after conversion.
- [ ] Run `npm test`. Expected: the new tests fail (module missing).
- [ ] Implement:
```js
// Content documents: neutral field names + lang. Old documents (German-only app) used titleDe, segments[].de,
// wordDe/sentenceDe and questionDe. toNewShape converts both shapes to the new one (old keys removed).
const pick = (a, b) => (typeof a === "string" ? a : typeof b === "string" ? b : "");
const ITEM = {
  stories: ["segments", (s) => ({ text: pick(s.text, s.de), ku: pick(s.ku) })],
  wordTopics: ["words", (w) => ({ word: pick(w.word, w.wordDe), wordKu: pick(w.wordKu), sentence: pick(w.sentence, w.sentenceDe), sentenceKu: pick(w.sentenceKu) })],
  quizzes: ["questions", (q) => ({ question: pick(q.question, q.questionDe), questionKu: pick(q.questionKu), options: (q.options || []).map((o) => pick(o)), correctAnswer: Number.isInteger(q.correctAnswer) ? q.correctAnswer : 0 })],
};
export function toNewShape(col, data) {
  const { titleDe, ...rest } = data;
  const [listKey, fix] = ITEM[col];
  return { ...rest, lang: data.lang === "en" ? "en" : "de", title: pick(data.title, titleDe), [listKey]: (data[listKey] || []).map(fix) };
}
export const isNewShape = (col, data) => JSON.stringify(toNewShape(col, data)) === JSON.stringify(data);
```
- [ ] Run `npm test`. Expected: all pass.

### Task 3: storyBundle with neutral fields and lang (TDD)
Files: `src/data/storyBundle.js`, `src/data/storyBundle.test.js`
Interface:
- `emptyBundle(lang = "de")` includes `lang`.
- `loadBundle(content, storyId)` takes the store shape `{ de: {stories, wordTopics, quizzes}, en: {…} }`, finds the story in any language, and links word lists and quizzes from the same language only.
- Bundle fields: `title`, `titleKu`, `segments[{text, ku}]`, `words[{word, wordKu, sentence, sentenceKu}]`, `questions[{question, questionKu, options, correctAnswer}]`, `lang`.
- Validation codes: `title`, `cover`, `segments`, `segmentText`, `word`, `questionText`, `questionOptions`, `questionCorrect`.
- `bundleToDocs` writes `lang` into all three docs (`head = { lang, level, title, titleKu }`).
- `storyHealth` uses `text`.
- `parsePaste(targetText, kuText)` returns `{ segments:[{text, ku}], targetCount, kuCount, unmatched }`.
- `generateQuestions(words, existing, { pool = [], lang = "de", rng = Math.random } = {})` uses `QUESTION_TEMPLATE = { de: (w) => \`Was bedeutet '${w}'?\`, en: (w) => \`What does '${w}' mean?\` }`. The Kurdish is `رامانا '${w}' چییە؟`, and the "already asked" check looks for `'${w}'` in the existing `question` texts.
- [ ] Update the tests first:
  - Rename the fields in the fixtures.
  - The `content()` helper builds `{ de: {stories, wordTopics, quizzes by level}, en: {…} }` from items with `lang` (default `"de"`).
  - New tests:
    - `loadBundle` finds an English story and ignores a German word list with the same `storyId`.
    - `bundleToDocs` writes `lang: "en"` into all three docs.
    - `generateQuestions(..., { lang: "en" })` gives `"What does 'apple' mean?"`.
    - `emptyBundle("en").lang === "en"`.
- [ ] Run `npm test`. Expected: storyBundle tests fail.
- [ ] Implement the renames and the new parameters in `storyBundle.js` (`STORY_KEYS` gets `lang`, `title`; `allOf(content, col)` iterates `content[lang]` for both languages and adds `lang`).
- [ ] Run `npm test`. Expected: all pass.

### Task 4: Content store by language
Files: `src/data/stories.js`, `src/data/useLibrary.js`
Interface:
- `useContent()` → `{ content: { de: {stories, wordTopics, quizzes}, en: {…} }, announcement, ready }`.
- `libraryOf(content, lang)` → `{ storiesOf, findStory, wordTopicsOf, findWordTopic, quizzesOf, findQuiz, linkedWords, linkedQuizzes, linkedWordTopics, all: {stories, wordTopics, quizzes} }`.
- `useLibrary()` → `libraryOf(content, learnLangOf(user))`.
- `deleteBundle(storyId)` looks in all languages.
- [ ] In `rebuild()`, every doc goes through `toNewShape(col, data)` and is grouped by `x.lang` then `x.level`. `emptyContent()` becomes `{ de: emptyLib(), en: emptyLib() }`.
- [ ] Replace the module-level getters (`getContent`, `storiesOf`, …) with `libraryOf(content, lang)` (pure, same logic per language). Keep `getAnnouncement`.
- [ ] `src/data/useLibrary.js`:
```js
import { useAuth } from "../context/AuthContext";
import { learnLangOf } from "./languages";
import { libraryOf, useContent } from "./stories";

// Stories, words and quizzes of the logged-in user's learning language
export function useLibrary() {
  const { user } = useAuth();
  const { content } = useContent();
  const lang = learnLangOf(user);
  return { lang, ...libraryOf(content, lang) };
}
```
- [ ] Run `npm run build`. It fails at the student pages and the dashboard until Tasks 8 and 11; continue straight on.

### Task 5: Students with a learning language + rules
Files: `src/data/students.js`, `src/context/AuthContext.jsx`, `firestore.rules`
Interface:
- `createStudent({ name, className, level, learnLang })`; `updateStudent` unchanged.
- `setOwnLearnLang(uid, lang)`.
- `AuthContext` exposes `setLearnLang(lang)` (updates Firestore, then the user object).
- [ ] `createStudent` stores `learnLang` (`LEARN_LANGS.includes(x) ? x : "de"`). The owner's first-login profile gets `learnLang: "de"`.
- [ ] `export const setOwnLearnLang = (uid, learnLang) => updateDoc(doc(db, "students", uid), { learnLang });`
- [ ] AuthContext: `const setLearnLang = async (lang) => { await setOwnLearnLang(user.uid, lang); setUser((u) => ({ ...u, learnLang: lang })); };` and add it to the context value.
- [ ] `firestore.rules`, students block:
```
match /students/{uid} {
  allow read: if isOwner() || (signedIn() && request.auth.uid == uid);
  allow write: if isOwner();
  // A student may change only their own learning language
  allow update: if signedIn() && request.auth.uid == uid
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(["learnLang"])
    && request.resource.data.learnLang in ["de", "en"];
}
```
- [ ] Also mention `lang` in the content comment of the rules (nothing to enforce).

### Task 6: Interface language: three languages + completeness test (TDD)
Files: `src/i18n.js`, `src/i18n.test.js`, `src/context/LangContext.jsx`, `src/components/LangSwitch.jsx`, `src/main.jsx` (provider order)
Interface:
- `LangContext` → `{ lang, setLang, t, tn, allowed }`. `lang ∈ allowed`. `t` falls back to `de`.
- `useLang()` stays the same for callers.
- [ ] `src/i18n.test.js`: every key has non-empty `de`, `ku`, `en`, and the set of `{placeholders}` is the same in all three. Run `npm test`. Expected: fails.
- [ ] Add `en` (British English) to every entry in `i18n.js`. Replace German-specific wording with a `{language}` placeholder where a text names the learning language. Add these keys:
  - `profile.learning` ("Learning language")
  - `profile.switchTo` ("Learn {language}")
  - `profile.switchAsk` ("Switch to {language}?")
  - `profile.switchText` ("You will see the {language} stories, words and quizzes. You can switch back at any time.")
  - `profile.switchFail`
  - `lang.de`, `lang.en` (the language names in each interface language, e.g. ku: ئەلمانی / ئنگلیزی)
- [ ] Update the header comment of `i18n.js` (`en` = English).
- [ ] LangContext:
  - It keeps `allowed` in state (default `["ku", "de", "en"]`) and exposes `setAllowed` in the context.
  - `AuthProvider`, which is rendered inside `LangProvider`, calls `setAllowed(uiLangsFor(user))` in an effect whenever `user` changes. When logged out, everything is allowed.
  - If `lang` is not in `allowed`, it is set to `allowed[1]` (the learning language) when that was a learning language, else `"ku"`.
  - `document.documentElement.dir` stays `rtl` only for `ku`.
- [ ] LangSwitch maps `allowed` to buttons with `LANG_NAME`.
- [ ] Run `npm test`. Expected: the i18n test passes.

### Task 7: Read-aloud per language
Files: `src/utils/speak.js`
Interface: `speak(text, lang, onEnd)`; `stopSpeaking()`.
- [ ] Cache a voice per BCP-47 tag (`voices = {}`). `pickVoice(tag)` uses the same matching as today (exact tag, then same base language). It is refreshed on `voiceschanged`. The utterance `lang` is `SPEECH_LANGS[lang]`.
- [ ] Callers are updated in Task 8.

### Task 8: Student pages read the user's library
Files:
- `src/pages/Home.jsx`
- `stories/StoriesLevels.jsx`, `StoriesList.jsx`, `StoryDetail.jsx`
- `words/WordsLevels.jsx`, `WordsTopics.jsx`, `WordsList.jsx`
- `quiz/QuizLevels.jsx`, `QuizTopics.jsx`, `QuizPlay.jsx`
- `src/components/StoryReader.jsx`, `QuestionCard.jsx`, `WordRow.jsx`, `StoryCard.jsx`

Interface: consumes `useLibrary()`.
- [ ] Each page gets its getters from `const lib = useLibrary()` (`lib.storiesOf(level)`, …). Home counts from `lib.all`.
- [ ] Field renames:
  - `titleDe` → `title`, `seg.de` → `seg.text`
  - `wordDe` → `word`, `sentenceDe` → `sentence`
  - `questionDe` → `question` (props of `QuestionCard`: `question`, `questionKu`)
- [ ] `lang="de"` → `lang={lib.lang}` (or a `lang` prop), and `speak(x)` → `speak(x, lib.lang)`.
- [ ] `QuestionCard`: rename `germanOnly` to `withoutKurdish` and `KURDISH` to `KURDISH_SCRIPT`. It takes a `lang` prop for `speak` and the `lang=` attributes.
- [ ] `StoryReader` gets the linked words via `lib.linkedWords(story.id)` (passed as a prop from StoryDetail to keep it pure: `words`), and `lang`.
- [ ] Run `npm run build` (the dashboard may still fail; it's fixed in Task 11). Then `npm test`.

### Task 9: Profile: learning language card
Files: `src/pages/Profile.jsx`
- [ ] A card under the main card shows:
  - `t("profile.learning")`
  - the current language name (`t("lang." + learnLang)`)
  - a button `t("profile.switchTo", { language: t("lang." + other) })`
- [ ] The button opens `confirm({ title: t("profile.switchAsk", …), text: t("profile.switchText", …), ok: t("profile.switchTo", …) })`. On `ok`: `await setLearnLang(other)`; on failure show `t("profile.switchFail")`. The interface language follows automatically through Task 6.
- [ ] The owner sees the same card (it changes the owner's own preview library).

### Task 10: Dashboard texts in three languages
Files: `src/pages/dashboard/bi.js` (→ exports `useTr`, triples), and every dashboard file that calls `bi(` (counts: StoryEditorPage 18, QuizSection 21, WordsSection 15, StudentsPage 13, SentencesSection 12, ui 9, BulkPaste 8, DetailsSection 8, LibraryCard 7, SaveBar 6, LibraryPage 5, SettingsPage 5, DashboardLayout 4, SectionTabs 2)
Interface: `const tr = useTr(); tr(de, ku, en)`.
- [ ] `bi.js`:
  - `useTr = () => { const { lang } = useLang(); return (de, ku, en) => ({ de, ku, en }[lang] ?? de); }`
  - `OPT`, `SAVE_FAIL`, `WAIT`, `UPLOAD_FAIL`, `NOT_IMAGE` gain an `en` text.
  - `LEAVE(tr)` gets `en` texts.
  - `Msg` renders `m.text ?? tr(m.de, m.ku, m.en)`, and every `{ ok, de, ku }` message object gets `en`.
  - `<Bi de ku>` → `<Tr de ku en>`.
- [ ] Convert file by file (`bi(` → `tr(` with an English third argument). The `ERROR_TEXT` pairs in StoryEditorPage become triples.
- [ ] Run `npx eslint src` and `npm run build` after each file group.
- [ ] Check: `grep -rn "useBi\|bi(" src/pages/dashboard` returns nothing.

### Task 11: Dashboard: libraries, editor language, students' learning language
Files: `DashboardLayout.jsx`, `LibraryPage.jsx`, `LibraryCard.jsx`, `editor/StoryEditorPage.jsx`, `editor/DetailsSection.jsx`, `editor/SentencesSection.jsx`, `editor/BulkPaste.jsx`, `editor/WordsSection.jsx`, `editor/QuizSection.jsx`, `StudentsPage.jsx`
- [ ] **DashboardLayout:**
  - Holds `library` (`"de" | "en"`), remembered in `localStorage` key `dashLibrary` (try/catch).
  - Passes `{ students, setDirty, library, setLibrary }` in the Outlet context.
  - The summary counts `content[library]`.
- [ ] **LibraryPage:**
  - A segmented switch `Deutsch · N` / `English · N` above the level filters.
  - Stories come from `content[library]`, and "Neue Geschichte" links to `stories/new?lang=<library>`.
- [ ] **LibraryCard:** `title`, `lang={story.lang}`.
- [ ] **StoryEditorPage:**
  - A new story uses `emptyBundle(searchParams.get("lang") === "en" ? "en" : "de")`.
  - The header shows a language badge (`LANG_NAME[bundle.lang]`).
  - `pool` = `content[bundle.lang].wordTopics[bundle.level]` meanings.
  - Uses the renamed fields and validation codes (`title`, `segmentText`).
  - The `ERROR_TEXT` German/English/Kurdish wording names the story language where it says "German".
- [ ] **Sections** get a `lang` prop (`bundle.lang`):
  - Labels say "Deutscher Satz" / "English sentence" via a `langName` triple: `tr("Deutsch", "ئەلمانی", "German")` or `tr("Englisch", "ئنگلیزی", "English")`.
  - `lang`/`dir` attributes use it.
  - `generateQuestions(words, questions, { pool, lang })`.
  - BulkPaste uses `targetCount`.
- [ ] **StudentsPage:**
  - The form gets a `learnLang` select (`Deutsch` / `English`, default `de`), sent to `createStudent` / `updateStudent`.
  - The row sub-line adds `LANG_NAME[learnLangOf(s)]`, and the search matches it.
- [ ] Run `npx eslint src`, `npm test` and `npm run build`. Expected: 4 known lint errors, all tests pass, the build succeeds.

### Task 12: Temporary content tool
Files: `scripts/content-tool.mjs` (temporary), `eslint.config.js` (Node globals for `scripts/**`)
Interface: `node scripts/content-tool.mjs <export <file> | migrate [--dry-run] | import <file> [--dry-run]>`
- [ ] Reads `VITE_FIREBASE_*` with `process.loadEnvFile(".env.local")`.
- [ ] Asks for the **teacher code** with hidden input (readline with muted output). It signs in with `signInWithEmailAndPassword(auth, codeToEmailLocal(code), code)` and checks that `uid === OWNER_UID` (both imported from `src/config.js`; `codeToEmail` is re-implemented locally to avoid importing browser modules).
- [ ] `export <file>`: reads the three collections (`getDocs`) and writes `{ stories: [{id, ...}], wordTopics: [...], quizzes: [...] }` as JSON. It refuses a path inside the repo.
- [ ] `migrate`: for every doc where `!isNewShape(col, data)`, writes `toNewShape(col, data)` with `set` (full replace, so the old keys disappear), in batches of 400. `--dry-run` prints the ids and counts.
- [ ] `import <file>`: the file has the same shape as the export, with `lang: "en"` and new ids. For each doc it checks `isNewShape` and `lang === "en"`, refuses ids that already exist, and writes in batches. `--dry-run` prints.
- [ ] `eslint.config.js`: add `'scripts/**/*.mjs'` to the Node globals block.
- [ ] Run `node scripts/content-tool.mjs` with no arguments. Expected: it prints usage.

### Task 13: Docs
Files: `docs/CODEBASE.md`, `docs/CLAUDE.md`
- [ ] Describe:
  - the learning languages and data model (fields, `lang`, `learnLang`)
  - `useLibrary`, `tr`, the three-language interface rules
  - the profile switch, the rules change
  - the dashboard library switch
  - the content tool (temporary, with its order of steps)
- [ ] Verify: `npx eslint src` (4 known errors), `npm test` (all pass), `npm run build` (succeeds).

### Task 14: English content (after the owner runs `export`)
Files: outside the repo only, in the scratchpad: `content-de.json` (the export), `content-en.json`, `kurdish-review.md`.
- [ ] Translate every story, word list and quiz as the spec's translation rules say:
  - New ids are `slugId(englishTitle)`.
  - `storyId` is remapped to the English story ids.
  - `lang: "en"`, the same `level`, `order`, `coverImage`, `readTime`.
- [ ] Validate each bundle with `validateBundle` and `toNewShape` / `isNewShape` (a small Node check in the scratchpad), and compare counts (stories / words / questions) against the German export.
- [ ] List every new or changed Kurdish text in `kurdish-review.md`.
- [ ] The owner runs, in order:
  1. `migrate --dry-run`
  2. `migrate`
  3. `import <file> --dry-run`
  4. `import <file>`
  5. publish `firestore.rules`
  6. delete `scripts/content-tool.mjs` and its eslint entry

## Self-review

- **Requirements to tasks:**
  - Teacher picks the language: Tasks 5 and 11.
  - Student toggle Kurdish + learning language: Task 6.
  - Profile switch with dialog: Tasks 5 and 9.
  - English content: Tasks 12 and 14.
  - Three-language dashboard: Task 10.
  - British voice: Tasks 1 and 7.
  - Rules: Task 5.
  - Old-shape tolerance: Tasks 2 and 4.
  - Docs: Task 13.
- **No placeholders:** the English UI texts are written during Tasks 6 and 10 (they are content of those tasks, not deferred).
- **Names used across tasks:**
  - `toNewShape`, `isNewShape`, `libraryOf`, `useLibrary`, `learnLangOf`, `uiLangsFor`, `LANG_NAME`, `SPEECH_LANGS`
  - `useTr` / `tr`, `setLearnLang`, `setOwnLearnLang`
  - Bundle fields `title`, `text`, `word`, `sentence`, `question`
  - Validation codes `title`, `segmentText`
