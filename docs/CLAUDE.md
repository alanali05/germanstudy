# CLAUDE.md

Guidance for Claude Code when working in this repository. For the full architecture, read [CODEBASE.md](CODEBASE.md).

## What this is

**LinguaSchool** — a frontend-only React SPA for teaching **German to Kurdish (Badini dialect, Arabic script) speakers**. Students log in with a personal code and work through content grouped by CEFR level (A1, A2, B1, B2):

- **Stories** — German sentences with Kurdish translations, tap-a-word meanings, text-to-speech.
- **Words** — vocabulary lists (German ↔ Kurdish with example sentences).
- **Quiz** — multiple-choice question sets.
- **Dashboard** (owner/teacher only) — CRUD for stories, word topics, quizzes, students, a home-page announcement, and JSON import/export.

The backend is **Firebase**, used directly from the browser with no server of our own:
- **Firebase Auth** (Email/Password) handles login codes.
- **Cloud Firestore** stores content, students, the announcement, and avatars.
- `firestore.rules` controls who can read and write what.

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # production build -> dist/
npm run preview   # serve the build
npm run lint      # ESLint (flat config)
```

- There are no tests and no test runner.
- `npm run lint` currently reports **4 known errors** (one `no-empty` in LangContext, and `react-refresh/only-export-components` in the three context files). Don't treat them as caused by your change. Fix them only if asked.
- `npm run build` passes, with a warning about chunks over 500 kB caused by the Firebase SDK.
- **Firebase config** comes from `.env.local` (git-ignored, `VITE_FIREBASE_*` keys) and from the same variables in Vercel. Never print the values.
- **`firestore.rules` is not deployed automatically.** There's no Firebase CLI setup. After you edit the file, tell the user to paste it into Firebase console → Firestore Database → Rules → Publish.
- Platform is Windows. The Bash tool runs Git Bash and PowerShell is also available.

## Stack

- React 19, react-router-dom v6 (`BrowserRouter`), Vite 8, plain **JavaScript/JSX (no TypeScript)**.
- Firebase JS SDK v12 (modular imports: `firebase/app`, `firebase/auth`, `firebase/firestore`). It's set up in `src/lib/firebase.js`, which exports `app`, `auth`, `db`, and `firebaseConfig`. Firestore is created with `ignoreUndefinedProperties: true`.
- Spark (free) plan: no Cloud Functions and no Firebase Storage.
- Tailwind CSS v4 through `@tailwindcss/vite`. There is no `tailwind.config`; theme tokens live in `src/index.css` (`@theme inline`).
- `lucide-react` for some icons (ThemeToggle, Dashboard). Most icons use the custom `src/components/Icon.jsx` (an inline SVG map).
- Deployed on Vercel. `vercel.json` rewrites every path to `/index.html` so the SPA routes work.

## Key conventions

### Bilingual UI: German (`de`) and Kurdish (`ku`)
- All student-facing UI text goes through `src/i18n.js` (`dict`) and `useLang()`:
  - `t(key, vars)` interpolates `{name}`-style placeholders and falls back to `de`, then to the key.
  - `tn(key, n)` picks the `key.one` entry when `n === 1`.
- **When adding UI text, add both `de` and `ku` to `dict`.** The Kurdish text should be checked by a native speaker; the file comment says so.
- **Exception:** `src/pages/Dashboard.jsx` does not use `dict`. It hard-codes both languages side by side with `bi(de, ku)` (an inline string with Unicode bidi isolates) and `<Bi de ku />` (stacked block). Keep that pattern there. The Dashboard has **no English** by design.
- Default language is `ku`. `LangContext` sets `<html lang dir>`, and `ku` makes the page **RTL**.
- Content fields come in pairs: `titleDe`/`titleKu`, `wordDe`/`wordKu`, `sentenceDe`/`sentenceKu`, `questionDe`/`questionKu`, segment `{ de, ku }`.

### RTL-safe styling
- Use logical Tailwind utilities (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `border-s`, `text-start`) and `rtl:` variants (for example `rtl:rotate-180` on chevron and back icons). Don't use `ml-`/`mr-`/`left-`/`right-` for layout.
- Set explicit `dir="ltr" lang="de"` on German text and `dir="rtl" lang="ku"` on Kurdish text, whatever the page direction is.

### Theming
- Colors are CSS variables in `src/index.css`: `--bg --card --fg --muted --faint --line --soft --brand --on-brand --link --ok --okbg --bad --badbg --hl`. They are exposed to Tailwind as `text-fg`, `bg-card`, `border-line`, `bg-soft`, `bg-brand`, `text-on-brand`, `text-link`, `text-muted`, `text-faint`.
- Use these tokens, not raw Tailwind palette colors, so light and dark themes both work.
- The theme is set by `html[data-theme]`. An inline script in `index.html` applies it before React loads so there's no flash. The default is `dark`.
- Reusable component classes are defined in `index.css`: `.glass`/`.paper` (cards), `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.btn-mini`, `.chip` (needs `--c`), `.field`, `.opt*` (quiz options), `.tap-word`, `.level-card`, `.level-badge`, `.accent-card` (needs `--accent`), `.page-in` (entry animation), `.meaning-card`.
- Level colors are passed in as CSS variables: `style={{ "--accent": lv.color }}` or `style={{ "--c": level.color }}`.

### Levels
- `src/data/levels.js`: ids are **lowercase** (`a1`…`b2`) and used in routes and content keys. `title` is uppercase (`A1`).
- `getLevel(id)` falls back to A1 for unknown ids.
- A student's `level` field is **uppercase** (`"A1"`), so code calls `.toLowerCase()` before `getLevel`.

## Data layer (important)

### Firestore collections

| Path | Shape | Read | Write |
|---|---|---|---|
| `stories/{id}` | `{ level: "a1", order, titleDe, titleKu, readTime?, coverImage?, segments[{de,ku}] }` | members | owner |
| `wordTopics/{id}` | `{ level, order, titleDe, titleKu, storyId?, words[{wordDe,wordKu,sentenceDe,sentenceKu}] }` | members | owner |
| `quizzes/{id}` | `{ level, order, titleDe, titleKu, storyId?, questions[{questionDe,questionKu,options[],correctAnswer}] }` | members | owner |
| `settings/announcement` | `{ text }` | members | owner |
| `students/{uid}` | `{ code, name, className, level: "A1" }` | owner, or the student themself | owner |
| `avatars/{uid}` | `{ dataUrl }` (320px JPEG, < 400 kB) | the user themself or owner | the user themself or owner |

A **member** is the owner, or an account that has a `students/{uid}` document. Deleting that document cuts off the student's access.

### Content store: `src/data/stories.js`
- `startContentSync()` opens `onSnapshot` listeners on the three collections plus the announcement. It rebuilds an in-memory copy in the **same v2 shape as before**, grouped by level and sorted by `order`:
  ```js
  { version: 2, stories: { a1: [...], a2, b1, b2 }, wordTopics: {...}, quizzes: {...} }
  ```
  The getters (`getContent`, `storiesOf`, `findStory`, `wordTopicsOf`, `quizzesOf`, `linked*`, `getAnnouncement`) stay **synchronous**.
- `ProtectedRoute` starts and stops the sync when `user.uid` changes, and shows "Loading…" until the first snapshot (`ready`).
- `useContent()` is a `useSyncExternalStore` hook. **`AppRoutes` calls it so every page re-renders when content changes.** That's why pages can keep using the plain getters.
- Writes are owner-only and async:
  - `saveItem(col, item)` does a full `setDoc`. `item.id` becomes the document id and is not stored. The item needs `level`; `order` defaults to `Date.now()`.
  - `removeItem(col, id)` deletes one document.
  - `setAnnouncement(text)` saves the announcement; empty text deletes it.
  - `replaceAllContent(v2)` deletes every document in the three collections, then writes new ones in batches of 450. Import, reset and migration use it.
- To edit topic items, clone the topic, change its `words` or `questions` array, then `saveItem` the whole topic.
- The **level is the `level` field** (lowercase id). The old display-only `level` text from the seed data is overwritten when content is written.
- `builtIn()` converts the stories in `src/data/storyFiles/storydata.js` from the v1 shape using `fromStoryMap`. It is **only a seed**. Editing `storydata.js` changes nothing live until the owner clicks Dashboard → Übersicht "Eingebauten Inhalt laden" (shown when the database is empty) or Sicherung → "Auf Standard zurücksetzen". Both replace **all** content.
- To add a built-in story: export it from `storydata.js` in the v1 shape (`id, titleDe, titleKu, readTime, coverImage, segments, vocabulary, quiz`), import it in `stories.js`, and add it to the right level array in `builtIn()`.
- `coverImage` URLs are saved to Firestore, so local images must live in `public/` (for example `/images/hallo.png`). Don't import them from `src/`; Vite's hashed URLs would break after the next build.
- `storyId` links a word topic or quiz to a story. Linked words become tappable in `StoryReader`, and linked topics and quizzes appear as buttons under the story.
- `readLocalContent()` / `clearLocalContent()` read and clear the old `ls-content-v2`/`v1` browser data. The Dashboard's one-time "Einrichtung" box offers to upload it.

## Auth

Login is **code only**. Google sign-in is deliberately not enabled; it may be added later for teachers or students.

- **Each code is a Firebase Email/Password account.**
  - Email = `<code lowercase>@linguaschool.app` (`codeToEmail`, `CODE_EMAIL_DOMAIN` in `src/config.js`).
  - Password = the code in UPPERCASE.
- `loginWithCode(code)` in `src/services/api.js` signs in and maps errors to `INVALID_CODE`, `TOO_MANY` or `NETWORK`. It also rejects accounts whose `students` document was deleted.
- `AuthContext` listens with `onAuthStateChanged`. It loads the profile with `loadProfile` (in `data/students.js`): the `students/{uid}` document, plus `role`, plus the avatar. Its value is `{ user, loading, logout, setAvatar }`. There is no `login()` function; Login just calls `loginWithCode`, and the listener sets `user`.
- **Owner** = the Auth user `OWNER_UID`. It's in `src/config.js` **and** hard-coded in `firestore.rules`; **keep the two in sync**. `role` is computed from the uid and never stored. On the owner's first login, `loadProfile` creates the owner's `students` document.
- The owner code is private. Only the user knows it. Never ask for it or write it anywhere.
- **Creating a student** (`createStudent` in `data/students.js`):
  - It uses a **second Firebase app** (`"student-creator"`, in-memory persistence) so the owner stays logged in.
  - It retries if the generated code (`NAME-1234`) is already taken.
  - An existing code can be passed in; migration uses this.
- **Deleting a student** removes their `students` and `avatars` documents, which revokes access. The Auth account itself can only be deleted in the console, because the client SDK can't delete other users.
- Routes: `ProtectedRoute` redirects to `/login` when there's no user. `OwnerOnly` (inside `AppRoutes.jsx`) guards `/dashboard`.

## localStorage / sessionStorage keys

The Firebase SDK keeps the login session in IndexedDB on its own. Our app's keys are:

| Key | Owner | Contents |
|---|---|---|
| `lang` | LangContext | `"ku"` / `"de"` |
| `theme` | ThemeContext + index.html | `"dark"` / `"light"` |
| `welcomed` (session) | Welcome.jsx | shows the welcome splash once per session |
| `ls-content-v2`/`-v1`, `ls-students-v1` | data/stories.js, data/students.js | **legacy**, pre-Firebase data. Only read for the one-time migration. |

Legacy keys that are no longer used: `auth`, `avatar:<code>`, `ls-announcement-v1`.

Wrap storage access in `try/catch`, as the existing code does.

## Known quirks / tech debt (don't "fix" unless asked)

- `a2PersoenlicheInformationenStory` is named "a2" but sits in the **a1** array in `builtIn()`, and its `level` says A1.
- `index.html` loads the Inter and Roboto Google fonts, but the CSS actually uses Figtree and Noto Sans Arabic (imported in `index.css`).
- `package.json` is named `"react"` and `README.md` is the unchanged Vite template.
- Student codes (`NAME` + 4 digits) are short. Firebase Auth's rate limiting is the only brute-force protection.
- Deleting a student leaves an unused Firebase Auth account behind.
- `replaceAllContent` isn't atomic beyond 450 operations per batch.
- `TopicCard` uses `text-white` on the accent-colored number badge, unlike the theme-token approach used elsewhere.
- Speech uses the browser `speechSynthesis` API with `de-DE` (`src/utils/speak.js`, `SPEECH_LANG` in `src/config.js`).

## Code style

- Function components, default exports, hooks. No PropTypes or TS types.
- Comments are short and in plain English. Keep the existing small-file, low-abstraction style.
- Double quotes and semicolons in most files. Match the file you're editing.
