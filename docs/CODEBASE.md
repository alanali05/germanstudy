# CODEBASE.md — LinguaSchool architecture

LinguaSchool is a React single-page app for learning German or English (each student has one learning language), built for speakers of Kurdish (Badini, Arabic script). The browser talks directly to **Firebase**:
- **Auth** (Email/Password) for login codes.
- **Cloud Firestore** for content, students, the announcement, and avatar links.

Access is enforced by `firestore.rules`. Image files live in **Cloudflare R2**. The only server code is one Vercel function, `api/uploads/sign.js`, which hands out short-lived upload URLs so the R2 keys never reach the browser.

---

## 1. High-level picture

```
                 ┌──────────────────────────── Browser ─────────────────────────────┐
 index.html ───▶ │ inline script: sets html[data-theme] from localStorage (no flash)  │
                 │                                                                    │
 src/main.jsx ─▶ │ <BrowserRouter>                                                    │
                 │   <ThemeProvider>      theme: dark|light  → html[data-theme]       │
                 │     <LangProvider>     lang: ku|de        → html[lang,dir]  t()/tn()│
                 │       <AuthProvider>   onAuthStateChanged → user (profile), logout  │
                 │         <App> → <AppRoutes>   useContent() → re-render on changes  │
                 │                                                                    │
                 │ Pages ──sync getters──▶ data/stories.js (live in-memory copy)      │
                 │                            ▲ onSnapshot           │ saveBundle etc.│
                 │ Dashboard ──writes─────────┼──────────────────────┘ (owner only)   │
                 │ Login ─▶ services/api.js ─▶ signInWithEmailAndPassword             │
                 │ Profile/Dashboard ─▶ services/upload.js (toJpeg → uploadImage)     │
                 └──────────────┬─────────────┼────────────────────────┬──────────────┘
                                │             ▼                        │ 1. POST + ID token
                                │  Firebase:  Auth (code accounts)     ▼
                                │  Firestore: stories, wordTopics,   Vercel fn api/uploads/sign.js
                                │  quizzes, settings, students,      (verifies token, checks member,
                                │  avatars (+ firestore.rules)        returns presigned PUT URL)
                                │ 2. PUT JPEG
                                ▼
              Cloudflare R2 bucket linguaschool-images: avatars/{uid}.jpg, covers/*.jpg
              (served publicly from R2_PUBLIC_BASE_URL)
 Hosting: Vercel static build (dist/) + api/ functions; every non-/api path rewritten to /index.html
```

---

## 2. Tech stack

| Concern | Choice |
|---|---|
| UI | React 19 (function components and hooks), JSX, no TypeScript |
| Routing | react-router-dom 6 (`BrowserRouter`, nested routes, `<Outlet>`) |
| Build | Vite 8 with `@vitejs/plugin-react` and `@tailwindcss/vite` |
| Styling | Tailwind CSS v4 plus custom CSS classes and CSS variables in `src/index.css` |
| Icons | Custom `Icon.jsx` SVG set, and `lucide-react` (ThemeToggle, Dashboard) |
| Backend | Firebase JS SDK v12: Auth (Email/Password) and Cloud Firestore (`europe-west3`), Spark (free) plan |
| Images | Cloudflare R2 (`linguaschool-images`, Western Europe), public r2.dev URL; uploads signed by one Vercel function (`jose`, `aws4fetch`) |
| Speech | Web Speech API (`speechSynthesis`, `de-DE` / `en-GB`) |
| Lint | ESLint 10 flat config: `js.recommended`, `react-hooks`, `react-refresh/vite` |
| Deploy | Vercel (`vercel.json` SPA rewrite, `api/` functions) |
| Tests | none |

---

## 3. Directory layout

```
germanstudy/
├── index.html                 # entry HTML; theme bootstrap script; title "LinguaSchool"
├── vite.config.js             # plugins: tailwindcss(), react(), apiDev() (serves api/ in npm run dev)
├── eslint.config.js           # browser globals; Node globals for api/ and vite.config.js
├── vercel.json                # rewrites every non-/api path → /index.html
├── firestore.rules            # Firestore security rules (paste into the console to deploy)
├── .env.local                 # VITE_FIREBASE_* + R2_* (git-ignored)
├── api/uploads/sign.js        # the only Vercel function: presigned R2 upload URLs
├── docs/                      # CLAUDE.md, CODEBASE.md
├── public/                    # favicon.svg, icons.svg
└── src/
    ├── main.jsx               # provider tree + router
    ├── App.jsx                # renders <AppRoutes/>
    ├── config.js              # APP_NAME, SPEECH_LANGS, OWNER_UID, CODE_EMAIL_DOMAIN
    ├── i18n.js                # dict: { key: { de, ku, en } } for all student UI text (i18n.test.js checks completeness)
    ├── index.css              # theme tokens, component classes, animations
    ├── lib/firebase.js        # initializeApp, auth, db (Firestore), firebaseConfig
    ├── context/
    │   ├── ThemeContext.jsx   # theme state + toggle
    │   ├── LangContext.jsx    # lang state (ku|de|en, limited to the allowed ones), t(), tn(), RTL handling
    │   └── AuthContext.jsx    # Firebase session → profile, logout, setAvatar
    ├── routes/
    │   ├── AppRoutes.jsx      # route table + OwnerOnly guard; subscribes to content
    │   └── ProtectedRoute.jsx # redirect to /login; starts content sync; waits for it
    ├── services/api.js        # loginWithCode() → Firebase Auth
    ├── services/upload.js     # toJpeg() (shrink in browser), uploadImage() (sign → PUT to R2)
    ├── utils/speak.js         # speak(text, onEnd), stopSpeaking()
    ├── data/
    │   ├── levels.js          # A1..B2 metadata + getLevel()
    │   ├── stories.js         # CONTENT STORE: Firestore sync, getters, writes
    │   ├── storyBundle.js     # pure: story + word list + quiz as one editable "bundle" (+ .test.js, Vitest)
    │   ├── students.js        # profiles, avatars, student accounts (create/update/delete)
    │   └── settings.js        # re-exports announcement get/set from stories.js
    ├── components/
    │   ├── layout/Layout.jsx  # sidebar (desktop), top bar + bottom tabs (mobile)
    │   ├── Welcome.jsx        # full-screen greeting, once per session
    │   ├── PageHeader.jsx     # back link, optional LevelBadge, title, subtitle
    │   ├── LevelCard.jsx      # large level tile used on the *Levels pages
    │   ├── LevelBadge.jsx     # colored "A1" square (sm | lg)
    │   ├── StoryCard.jsx      # story list row (cover, number, titles, read time); on phones the number sits on the cover
    │   ├── TopicCard.jsx      # word-topic / quiz list row
    │   ├── StoryReader.jsx    # story text, tap-word meanings, read-aloud with highlight + floating controls, KU toggle
    │   ├── QuestionCard.jsx   # one quiz question with option states and listen buttons
    │   ├── ConfirmDialog.jsx  # <ConfirmProvider>: the app's "are you sure?" dialog (useConfirm in context/ConfirmContext.js)
    │   ├── WordRow.jsx        # DE | KU vocabulary row with listen button
    │   ├── EmptyState.jsx     # "nothing here" card with link
    │   ├── Avatar.jsx         # image or initials circle
    │   ├── Icon.jsx           # inline SVG icon map
    │   ├── LangSwitch.jsx     # interface language toggle: کوردی + learning language (owner: all three)
    │   └── ThemeToggle.jsx    # sun/moon button
    └── pages/
        ├── Login.jsx, Home.jsx, Profile.jsx, NotFound.jsx
        ├── dashboard/  DashboardLayout.jsx, LibraryPage.jsx, LibraryCard.jsx, StudentsPage.jsx, SettingsPage.jsx,
        │               bi.js (useTr, byLang + messages), ui.jsx (Field, Box, Row, Msg, SearchBox, AutoText, Tr …)
        │   └── editor/ StoryEditorPage.jsx, SectionTabs, DetailsSection, SentencesSection, BulkPaste,
        │               WordsSection, QuizSection, SaveBar
        ├── stories/  StoriesLevels.jsx → StoriesList.jsx → StoryDetail.jsx
        ├── words/    WordsLevels.jsx   → WordsTopics.jsx → WordsList.jsx
        └── quiz/     QuizLevels.jsx    → QuizTopics.jsx  → QuizPlay.jsx
```

---

## 4. Boot sequence

1. `index.html` runs an inline script that reads `localStorage.theme` (default `"dark"`) and sets `document.documentElement.dataset.theme` before any CSS paints.
2. `src/main.jsx` renders `StrictMode > BrowserRouter > ThemeProvider > LangProvider > AuthProvider > App`.
3. `ThemeProvider` starts from the existing `data-theme` and saves changes.
4. `LangProvider` reads `localStorage.lang` (default `"ku"`). It sets `<html lang>` and `<html dir>` (`rtl` for `ku`) and saves changes.
5. `src/lib/firebase.js` initializes the Firebase app, Auth, and Firestore from the `VITE_FIREBASE_*` env vars. This happens on import.
6. `AuthProvider` subscribes to `onAuthStateChanged`. Firebase restores the saved session from IndexedDB, then `loadProfile` reads `students/{uid}` and `avatars/{uid}`. Until then `loading=true`, and `ProtectedRoute` shows "Loading…".
7. Once there is a user, `ProtectedRoute` calls `startContentSync()`. It keeps showing "Loading…" until all four Firestore listeners have sent their first snapshot (`ready`).
8. `AppRoutes` renders the matching route. Because it calls `useContent()`, any later Firestore change re-renders the routes.

---

## 5. Routing

Defined in `src/routes/AppRoutes.jsx`:

| Path | Element | Guard |
|---|---|---|
| `/login` | `Login` | public (redirects to `state.from` or `/` if already logged in) |
| `/` | `Home` | Protected + Layout |
| `/profile` | `Profile` | Protected + Layout |
| `/dashboard` | `DashboardLayout` → `LibraryPage` | Protected + Layout + `OwnerOnly` (`user.role === "owner"`) |
| `/dashboard/stories/new`, `/dashboard/stories/:storyId` | `StoryEditorPage` | 〃 |
| `/dashboard/students` | `StudentsPage` | 〃 |
| `/dashboard/settings` | `SettingsPage` | 〃 |
| `/stories` | `StoriesLevels` | Protected + Layout |
| `/stories/:level` | `StoriesList` | 〃 |
| `/stories/:level/:storyId` | `StoryDetail` | 〃 |
| `/quiz` | `QuizLevels` | 〃 |
| `/quiz/:level` | `QuizTopics` | 〃 |
| `/quiz/:level/:topicId` | `QuizPlay` | 〃 |
| `/words` | `WordsLevels` | 〃 |
| `/words/:level` | `WordsTopics` | 〃 |
| `/words/:level/:topicId` | `WordsList` | 〃 |
| `*` | `NotFound` | public |

- `:level` is a lowercase level id (`a1`…`b2`).
- `ProtectedRoute` → `Layout` → page is a nesting of layout routes. `Layout` re-keys `<Outlet>` on `pathname` so the `.page-in` animation replays, and it scrolls to the top on every navigation.

All three learning sections follow the same **three-step drill-down: Levels → Topics/Stories in a level → Item**.

---

## 6. Global state (React contexts)

### ThemeContext (`useTheme`)
- `{ theme, toggle }`. Writes `html[data-theme]` and `localStorage.theme`.

### LangContext (`useLang`)
- `{ lang, setLang, allowed, setAllowed, t, tn }`. `allowed` comes from `AuthContext` (`uiLangsFor(user)`): Kurdish + the learning language for students, all three for the owner and when logged out. A saved `lang` that isn't allowed falls back to the learning language.
- `t(key, vars)`: looks up `dict[key][lang]`, falls back to `.de`, then to the key itself. Replaces every `{var}`.
- `tn(key, n)`: uses `key.one` when `n === 1` and that key exists, and passes `{ n }`.

### AuthContext (`useAuth`)
- `{ user, loading, logout(), askLogout(), setAvatar(url|null), setLearnLang(lang) }`.
- `user` = `{ uid, code, name, className, level: "A1"…, learnLang?: "de"|"en", role: "owner"|"student", avatar }` (`learnLangOf(user)` defaults to `de`).
  - It's built by `loadProfile(fbUser)` in `data/students.js`.
  - `role` is computed by comparing `uid` to `OWNER_UID`; it is not stored.
  - If an account has no `students` document (a deleted student), it is signed out again.
- `logout` clears the session `welcomed` flag and calls `signOut(auth)`.
- `setAvatar` updates the user in state right away, then writes `avatars/{uid}`. It returns a promise so Profile can show an error if the write fails.

---

## 7. Data layer

Pages import plain **synchronous** getter functions from `src/data/*` and call them during render. The getters read an in-memory copy that Firestore `onSnapshot` listeners keep up to date (see 7.2).

### 7.0 Firestore collections and rules

| Path | Fields | Read | Write |
|---|---|---|---|
| `stories/{id}` | `lang` (de, en), `level` (a1…b2), `order`, `title`, `titleKu`, `readTime?`, `coverImage?`, `segments[{text,ku}]` | member | owner |
| `wordTopics/{id}` | `lang`, `level`, `order`, `title`, `titleKu`, `storyId?`, `words[{word,wordKu,sentence,sentenceKu}]` | member | owner |
| `quizzes/{id}` | `lang`, `level`, `order`, `title`, `titleKu`, `storyId?`, `questions[{question,questionKu,options[],correctAnswer}]` | member | owner |
| `settings/announcement` | `text` | member | owner |
| `students/{uid}` | `code`, `name`, `className`, `level` ("A1"…), `learnLang` ("de"/"en", missing = de) | owner, or the student themself | owner; the student only their own `learnLang` |
| `avatars/{uid}` | `url` (https string < 500 chars, points to R2) | the user themself or owner (if member) | the user themself or owner (if member) |

- **owner** = `request.auth.uid == OWNER_UID`. The uid is hard-coded in `firestore.rules` and must match `src/config.js`.
- **member** = the owner, or a signed-in user whose `students/{uid}` document exists. Deleting that document revokes access.
- Field names are neutral: `title`, `segments[].text`, `word`, `sentence` and `question` hold the **learning language** (German or English, see `lang`); the `…Ku` fields hold Kurdish. Older documents (`titleDe`, `segments[].de`, `wordDe`, `sentenceDe`, `questionDe`, no `lang`) are converted on load by `toNewShape` in `data/contentShape.js`.
- The rules are deployed by pasting them into Firebase console → Firestore → Rules. There is no CLI setup.

### 7.1 Levels — `data/levels.js`
```js
levels = [ {id:"a1",title:"A1",color:"#4ade80"}, {id:"a2",…"#38bdf8"}, {id:"b1",…"#facc15"}, {id:"b2",…"#fb923c"} ]
getLevel(id) // unknown id → levels[0]
```
Level descriptions and names live in i18n (`level.a1`, `level.a1.desc`, …).

### 7.2 Content store — `data/stories.js`

Firestore is the **single source of truth** for content. There are no story files or seed data in the code; stories are created in the dashboard editor.

**Shape of the in-memory copy** (by learning language, then level):
```js
{
  de: { stories: { a1: Story[], a2, b1, b2 }, wordTopics: { a1: WordTopic[], … }, quizzes: { a1: Quiz[], … } },
  en: { …same… },
}
Story     = { id, lang, title, titleKu, readTime?, coverImage?, segments: [{ text, ku }] }   // + level, order from Firestore
WordTopic = { id, lang, title, titleKu, storyId?, words: [{ word, wordKu, sentence, sentenceKu }] }
Quiz      = { id, lang, title, titleKu, storyId?, questions: [{ question, questionKu, options: string[], correctAnswer: number }] }
```

**Lifecycle:**
```
startContentSync()            (called by ProtectedRoute when user.uid is set; returns stop())
  onSnapshot(stories | wordTopics | quizzes | settings/announcement)
    → rebuild(): toNewShape each doc, group by `lang` then `level`, sort by `order`  → state = { content, announcement, ready }
    → notify useContent() subscribers (AppRoutes re-renders everything)
stop() (logout) → listeners closed, state reset to empty / not ready
```

**API:**
| Function | Purpose |
|---|---|
| `libraryOf(content, lang)` | the getters for one language: `all` ({stories, wordTopics, quizzes}, each item with `level`), `storiesOf(lv)`, `findStory(lv, id)`, `wordTopicsOf(lv)`, `findWordTopic(lv, id)`, `quizzesOf(lv)`, `findQuiz(lv, id)`, `linkedWords(storyId)`, `linkedWordTopics(storyId)`, `linkedQuizzes(storyId)` |
| `useLibrary()` (`data/useLibrary.js`) | `libraryOf` for the logged-in user's learning language, plus `lang`. For the owner it follows the language toggle (Deutsch/English; on Kurdish their profile learning language), and `?lang=` overrides that |
| `getAnnouncement()` | current announcement text |
| `useContent()` | `useSyncExternalStore` hook that returns `{ content, announcement, ready }` |
| `startContentSync()` | opens the listeners and returns the stop function |
| `saveBundle(bundle)` | one `writeBatch` with the writes from `bundleToDocs` (story, word list, quiz; empty ones are deleted) |
| `deleteBundle(storyId)` | one `writeBatch` deleting the story and every word topic / quiz with that `storyId` (any language) |
| `setAnnouncement(text)` | sets `settings/announcement`, or deletes it when the text is empty |

### 7.3 Story bundles — `data/storyBundle.js`
Pure functions (no Firebase) that the dashboard editor uses: `emptyBundle(lang)`, `loadBundle`, `cleanBundle`, `validateBundle`, `bundleToDocs`, `storyHealth`, `moveItem`, `parsePaste`, `generateQuestions(words, existing, { pool, lang })`, `slugId`. A bundle has the story's `lang`; `loadBundle(content, id)` finds the story in any language and links the word list and quiz of that language only; `bundleToDocs` writes `lang` into all three documents. Unit-tested in `storyBundle.test.js` (`npm test`). Details: section 8, Dashboard.

### 7.3b Learning languages — `data/languages.js`, `data/contentShape.js`
- `LEARN_LANGS` (`["de", "en"]`), `LANG_NAME` (each language's own name), `learnLangOf(user)` (default `de`), `uiLangsFor(user)`.
- `toNewShape(col, data)` / `isNewShape(col, data)`: old → new field names (tested in `contentShape.test.js`).
- Students get their learning language from the teacher (Schüler form) and can switch it on the Profile page (confirm dialog → `setLearnLang`, allowed for their own document by `firestore.rules`).
- On 2026-10-30 every existing document was migrated to the new field names (`lang: "de"`) and the English library (17 stories with word lists and quizzes, translated from the German ones) was imported, with a one-off script that has since been removed.

### 7.4 Students — `data/students.js`
- **Code accounts.**
  - Code `SARA-4821` ⇄ Auth email `sara-4821@linguaschool.app` with password `SARA-4821` (`codeToEmail`, `CODE_EMAIL_DOMAIN`).
  - Users only ever type the code.
- `loadProfile(fbUser)` reads `students/{uid}` and `avatars/{uid}`, and returns the profile with `role`, or `null` if the account isn't a member. On the owner's first login it creates the owner's `students` document.
- `saveAvatar(uid, url|null)`: sets `avatars/{uid}` to `{ url }` or deletes it.
- `useStudents()`: a live `onSnapshot` list of all students except the owner, sorted by name. Owner only.
- `createStudent({name, className, level, learnLang})`:
  - Creates the Auth account through a **second Firebase app** (`"student-creator"`, `inMemoryPersistence`), so the owner's own session isn't replaced.
  - Then writes `students/{uid}`.
  - It generates `FIRSTNAME-####` and retries if that code is taken. It returns the code.
- `updateStudent(uid, data)` updates the profile.
- `deleteStudent(uid)` deletes `students/{uid}` and `avatars/{uid}`. The Auth account stays and can only be removed in the console.

### 7.5 Settings — `data/settings.js`
- Re-exports `getAnnouncement` and `setAnnouncement` from `stories.js`. The announcement lives in `settings/announcement`, is synced with the content, and is shown on Home.

### 7.6 Auth service — `services/api.js`
`loginWithCode(raw)`:
1. Trims and upper-cases the code.
2. Calls `signInWithEmailAndPassword(codeToEmail(code), code)`.
3. Maps Firebase errors to `INVALID_CODE`, `TOO_MANY` or `NETWORK`.
4. Signs out again and throws `INVALID_CODE` if the account has no `students` document (except the owner).

It returns nothing. `AuthContext`'s listener picks up the new session.

### 7.7 Image uploads — `services/upload.js` + `api/uploads/sign.js`
- `toJpeg(file, { size, square })`: draws the picture on a canvas (white background) and returns a JPEG Blob (quality 0.85). `square` crops the middle to size×size; otherwise the longer side is scaled down to `size`. Rejects with `OPEN_FAIL`.
- `uploadImage(kind, blob)`: POSTs `{ kind, size }` with the Firebase ID token to `/api/uploads/sign`, PUTs the blob to the returned `uploadUrl`, and returns `publicUrl`. Throws `UPLOAD_FAIL`.
- `api/uploads/sign.js` (Vercel function, Node):
  1. Verifies the ID token with `jose` against Google's public keys (issuer/audience = the Firebase project).
  2. Checks membership like the rules do: owner uid, or `students/{uid}` readable through the Firestore REST API with the user's own token.
  3. `avatar`: any member, key `avatars/{uid}.jpg`, ≤ 1 MB. `cover`: owner only, key `covers/<random>.jpg`, ≤ 3 MB.
  4. Signs a PUT URL with `aws4fetch` (valid 120 s, `Content-Type: image/jpeg` signed) and returns it with `publicUrl` = `R2_PUBLIC_BASE_URL/key?v=<timestamp>`.
- In `npm run dev`, the `apiDev` plugin in `vite.config.js` loads all `.env.local` vars into `process.env` and serves `/api/<path>` from `api/<path>.js` with a tiny `res.status().json()` shim.

---

## 8. Feature walkthroughs

### Login (`pages/Login.jsx`)
- Two columns on desktop: a large colored "A1 A2 B1 B2" panel, and the code form. On mobile it shows the form with level chips.
- The input upper-cases as you type. It awaits `loginWithCode()`, shows the right error for invalid code, too many tries, or no network, and once `AuthContext` has the user, `<Navigate>` sends them to `from`.
- Code login only. Google sign-in isn't enabled yet; it may be added later.

### Layout (`components/layout/Layout.jsx`)
- Desktop (`lg+`): a fixed 18rem sidebar on the **start** side, with the app name and ThemeToggle at the top, nav links, a full-width LangSwitch (`full`), a user card, and logout.
- Mobile: a top bar (app name, toggles) and a fixed bottom tab bar. Its column count equals the number of links, so it has 6 columns when the owner's Dashboard link is shown.
- Renders `<Welcome/>`, a full-screen greeting that closes itself after 3 s and appears once per session.

### Home (`pages/Home.jsx`)
- Shows a greeting, the announcement (if set), the user's level badge and class, CTAs linking straight to the user's level for each section, and three panels with global counts of stories, questions, and words.

### Stories
- `StoriesLevels`: four `LevelCard`s with story counts, or "coming soon".
- `StoriesList`: `StoryCard`s numbered 1..n. The number is passed through `Link state={{ index }}`.
- `StoryDetail`: level and read-time chips, number plus German title, Kurdish title, then `StoryReader`, then buttons for linked word topics and quizzes.
- **`StoryReader`**:
  - Builds a `Map` from lowercase `word` to entry using the `words` prop (`linkedWords(story.id)` from StoryDetail), plus one Unicode-aware regex. Phrases are sorted longest-first and multi-word phrases match any whitespace.
  - Splits each `seg.de` with the capturing regex. Odd parts are matches and render as `.tap-word` buttons.
  - Clicking a word opens a **meaning card**, portaled to `document.body` so parent transforms and animations don't move it. It shows the DE word with a listen button, the KU meaning, and example sentences. Escape closes it.
  - "Listen" reads the story aloud sentence by sentence (one utterance each, so long stories don't cut off) and highlights the sentence being read, scrolling it into view. The button turns into pause/resume, with a stop button next to it. When those controls are scrolled out of view while reading, floating controls (previous, play/pause, next, "3/17", stop) appear at the bottom (hidden while a word card is open). A toggle shows or hides the Kurdish lines. Speech stops on unmount.

### Words
- `WordsLevels` (total word counts) → `WordsTopics` (`TopicCard` list) → `WordsList`, which has a search box filtering on `word + wordKu` and shows `WordRow`s (learning language on the left with a listen button, Kurdish on the right).

### Quiz
- `QuizLevels` → `QuizTopics` → `QuizPlay`.
- `QuizPlay` keeps local state: `index`, `selected`, `score`, `finished`. `QuestionCard` locks after the first choice and marks options as right, wrong, or dimmed. A speaker button reads the question (Kurdish parts left out) and each answer in the learning language aloud. After answering, the page scrolls the "next" button into view (on phones it is otherwise under the tab bar); the next question scrolls back up.
- A progress bar fills as questions are answered. The result screen shows an SVG score ring, a message for ≥80%, ≥50%, or lower, and confetti at ≥80%. It offers retry and back to the list.

### Profile
- Upload an avatar: it is validated (image type, ≤ 8 MB), center-cropped to a 320×320 JPEG (`toJpeg`), uploaded to R2 as `avatars/{uid}.jpg` (`uploadImage`), and its link is saved to `avatars/{uid}` with `setAvatar`. Removing it deletes only the Firestore link; the file is overwritten by the next upload.
- Shows the student code, level chip, and class. Has a logout button.
- Logout (here and in the sidebar, via `askLogout` from `AuthContext`) and removing the photo ask first in the confirm dialog; students are reminded of their code. The sidebar shows the student code under the name ("Owner" for the owner).

### Dashboard (owner only) — `pages/dashboard/`
Design: `docs/superpowers/specs/2026-10-27-dashboard-library-editor-design.md`. All labels are written in German, Kurdish and English inline, but only the current app language is shown (`useTr()` → `tr(de, ku, en)`, `<Tr>`), and the page follows the app direction (RTL for Kurdish). The owner's toggle has all three languages.

`DashboardLayout` shows a one-line summary (stories · words · questions · students) and a section switch. It passes `{ students, setDirty }` to the sections through the Outlet context.

| Section | What it does |
|---|---|
| **Geschichten** (`/dashboard`, `LibraryPage`) | A Deutsch · English switch (with story counts; remembered as `dashLibrary`) picks the library; the summary line counts it too. Every story of that library as a card (cover, level, German/Kurdish title) with chips for what is there or missing (sentences, sentences without Kurdish, words, quiz). Level filter chips with counts, title search, and a "Neue Geschichte" card that creates a story in that library (`stories/new?lang=en`). |
| **Story editor** (`/dashboard/stories/:id`, `/new`) | The story, its word list and its quiz, as four tabs (only one section is shown at a time; all stay mounted, so a tab switch keeps unsaved input; the open tab is kept in the URL hash, e.g. `#quiz`): **Details** (cover upload, titles, level buttons, reading time), **Sätze** (one card per sentence: number and buttons on top, German and Kurdish text boxes that grow with the text, move up/down, delete (rows, words and questions with text ask first); "Viele Sätze einfügen" pairs a German box and a Kurdish box line by line, and also reads the old `Deutsch \|\| Kurdisch` lines), **Wörter** (one card per word: word + meaning, example sentences behind "Beispiel"), **Quiz** (compact list; one question opens with answer rows and a radio button for the correct answer; "Fragen aus den Wörtern erstellen" adds "Was bedeutet …?" questions). The tab column stays in view while scrolling (a 2×2 grid above the content on phones), shows counts, and marks tabs that have validation errors; failed saves open the first tab with an error. Every change can be undone step by step ("Rückgängig"; typing in one place within a second is one step, up to 100 steps; saving clears the history, discarding can be undone). Save/undo/discard: a sticky bar on wide screens, round floating buttons above the tab bar on phones and tablets. Long texts (sentences, example sentences, quiz questions and answers) use `AutoText` from `ui.jsx`, a textarea that grows with its text and keeps it on one line (Enter and pasted line breaks become spaces). "Geschichte löschen" (under Details) removes the story with its word list and quiz. |
| **Schüler** (`StudentsPage`) | The form has a **Lernsprache** select (Deutsch / English); the list shows each student's language. The live list from `useStudents()`. Adding a student creates a Firebase account plus profile and shows the new `FIRSTNAME-####` code. Edit changes name, class, or level (the code stays the same). Delete revokes access. |
| **Einstellungen** (`SettingsPage`) | The announcement editor only. The former setup box (load built-in content, pre-Firebase migration) and **Sicherung** box (export/import, add missing built-in content, move covers, reset) were removed on purpose: Firestore is the only source of truth, and there is no in-app backup of content. |

How the editor reads and writes (`data/storyBundle.js`, pure and unit-tested):
- `loadBundle(content, storyId)` builds one object from the story plus its linked word topic and quiz. It prefers the doc whose id equals the story id, else the first with that `storyId`. Others are counted and left alone. Unknown story fields are kept in `extra`.
- The form edits its own copy. Live Firestore updates don't overwrite it. Unsaved changes = JSON compare with the last saved copy. They trigger a `beforeunload` warning and a confirm dialog on the dashboard's own links. The app uses `BrowserRouter`, so `useBlocker` isn't available and leaving through the main sidebar isn't caught.
- The editor shows the story's language as a badge; labels name it ("Englischer Satz" …, `byLang`), and the quiz generator uses its template ("Was bedeutet …?" / "What does … mean?").
- `validateBundle` blocks saving without a title, a cover, or a sentence with text in the learning language; with a word without meaning; or with a question without text, with fewer than 2 answers, or without a correct answer. Errors are listed at the top and link to their section.
- `saveBundle` (in `stories.js`) writes everything in one `writeBatch`. Level and titles are copied to the word list and quiz. An empty word list or quiz deletes its document. Existing `order` values are kept, and new documents get `Date.now()`. New stories get their id from `slugId(title)` (slug + 4 random chars), and the URL then changes to `/dashboard/stories/<id>`.
- Covers are still required and can only be uploaded (shrunk to ≤ 1600 px JPEG, R2 `covers/`).


---

## 9. Internationalisation and direction

- `src/i18n.js` holds roughly 100 keys grouped by prefix: `nav.*`, `common.*`, `level.*`, `count.*`, `login.*`, `home.*`, `stories.*`, `story.*`, `quiz.*`, `words.*`, `profile.*`, `theme.*`, `welcome.*`, `notFound.*`.
- `dict` entries have `de`, `ku` and `en`; `src/i18n.test.js` checks that every key has all three with the same placeholders.
- The page direction follows the UI language, but **content text always declares its own direction**: German/English is `dir="ltr" lang={learning language}` and Kurdish is `dir="rtl" lang="ku"`. Level badges use `dir="ltr"`.
- Layout uses logical properties (`start/end`, `ms/me`, `ps/pe`, `border-inline-start`) and flips arrow icons with `rtl:rotate-180`.

---

## 10. Styling system (`src/index.css`)

- **Fonts**: Figtree for Latin text and Noto Sans Arabic for Kurdish, both imported in CSS. `index.html` also preloads Inter and Roboto, which are not used.
- **Tokens**: light and dark palettes on `html[data-theme=…]`. Dark is the default (`:root`). They are mapped into Tailwind with `@theme inline` as `fg, muted, faint, line, soft, card, brand, on-brand, link`.
- **Background**: two radial "glow" gradients over `--bg`, fixed in place.
- **Component classes**:
  - Cards: `glass`, `paper`, `panel(-stories|-quiz|-words)`, `accent-card`.
  - Buttons: `btn-primary` (green gradient), `btn-ghost`, `btn-danger`, `btn-mini`.
  - Forms: `field`, `chip`.
  - Quiz: `opt`, `opt-right`, `opt-wrong`, `opt-dim`, `bar-fill`, `ring`, `confetti`.
  - Reader: `tap-word`, `meaning-card`.
  - Levels: `level-card`, `level-ghost`, `level-go`, `level-pill`, `level-badge (lb-sm|lb-lg)`, `steps`.
  - Welcome: `welcome`, `welcome-card`, `wave`, `drain`.
  - Motion: `page-in` (staggered children), `stagger`, `rise`, `cta-pulse`.
- Per-element color is passed in through CSS variables: `--accent` (level color on cards and pages) and `--c` (chips and badges).
- Animations are disabled when the user prefers reduced motion (`prefers-reduced-motion`).

---

## 11. Persistence summary

| Storage | Key / path | Written by |
|---|---|---|
| Firestore | `stories`, `wordTopics`, `quizzes`, `settings/announcement` | Dashboard (owner) via data/stories.js |
| Firestore | `students/{uid}` | Dashboard (owner) via data/students.js, plus the owner's own profile on first login |
| Firestore | `avatars/{uid}` (link) | Profile (each user) via AuthContext.setAvatar |
| Cloudflare R2 | `avatars/{uid}.jpg`, `covers/<random>.jpg` | services/upload.js through presigned URLs from api/uploads/sign.js |
| Firebase Auth | one Email/Password account per code | Firebase console (owner); `createStudent` (students) |
| IndexedDB | Firebase Auth session | Firebase SDK |
| localStorage | `theme` | ThemeContext |
| localStorage | `lang` | LangContext |
| localStorage | `dashLibrary` | DashboardLayout (de / en library) |
| sessionStorage | `welcomed` | Welcome.jsx (cleared on logout) |
| localStorage (legacy) | `ls-content-v2`/`v1`, `ls-students-v1` | pre-Firebase leftovers; nothing reads them any more (same for `auth`, `avatar:*`, `ls-announcement-v1`). |

Owner edits are shared: every logged-in student sees them live.

---

## 12. Extension points

- **Google sign-in (planned, optional)**:
  1. Enable the Google provider in Firebase Auth.
  2. For students, link it to an existing code account with `linkWithPopup` on the Profile page, so their `students/{uid}` document keeps working.
  3. For a teacher Google account, extend `isOwner()` in the rules and `OWNER_UID` in config (for example to a list).
- **New Firestore collection**: add a `match` block to `firestore.rules` and ask the user to publish it. Without a rule, all access is denied.
- **New content field**: add it to the bundle in `data/storyBundle.js` (`emptyBundle`, `loadBundle`, `cleanBundle`, `bundleToDocs`, plus tests) and to the matching editor section. Firestore is schemaless, and `ignoreUndefinedProperties` skips optional fields left empty.
- **Progress tracking (future)**: for example `progress/{uid}/quizzes/{quizId}`, with a rule letting each user write their own documents.
- **New level**: add it to `levels.js`, `LEVEL_IDS`/`empty()` in `stories.js`, the i18n `level.<id>` and `level.<id>.desc` keys, and the dashboard level filter / level buttons (they read `levels.js`).
- **New UI text**: add a `dict` entry with both `de` and `ku`.
- **New built-in story**: see CLAUDE.md, "Data layer".

---

## 13. Known issues / quirks

- ESLint reports 3 known errors (the fast-refresh rule on the three context files that export hooks).
- The production bundle is about 870 kB (about 260 kB gzipped), mostly the Firebase SDK. Vite warns about chunk size.
- Unused Inter and Roboto fonts in `index.html`. `package.json` is named `"react"`. The README is the Vite template.
- Student codes are short (`NAME` + 4 digits). Firebase Auth rate limiting is the only brute-force protection.
- Deleting a student leaves an orphan Auth account, which has to be removed manually in the console.
- There is no in-app content backup (the export/import box was removed). Deleted or overwritten content can't be restored from the app.
- Replaced or deleted story covers stay in R2 (no cleanup yet). Deleting a student leaves their avatar file in R2.
- The r2.dev public URL is rate-limited by Cloudflare. Connect a custom domain to the bucket before traffic grows, then update `R2_PUBLIC_BASE_URL` (existing links keep the old domain).
- `firestore.rules` must be published by hand, and the owner uid is duplicated between the rules and `src/config.js`.
