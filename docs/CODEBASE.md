# CODEBASE.md — LinguaSchool architecture

LinguaSchool is a React single-page app for learning German, built for speakers of Kurdish (Badini, Arabic script). There is no server of our own. The browser talks directly to **Firebase**:
- **Auth** (Email/Password) for login codes.
- **Cloud Firestore** for content, students, the announcement, and avatars.

Access is enforced by `firestore.rules`.

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
                 │                            ▲ onSnapshot           │ saveItem etc.  │
                 │ Dashboard ──writes─────────┼──────────────────────┘ (owner only)   │
                 │ Login ─▶ services/api.js ─▶ signInWithEmailAndPassword             │
                 └────────────────────────────┼───────────────────────────────────────┘
                                              ▼
              Firebase:  Auth (code accounts)   Firestore: stories, wordTopics, quizzes,
                                                settings, students, avatars  (+ firestore.rules)
 Hosting: Vercel static build (dist/), every path rewritten to /index.html
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
| Speech | Web Speech API (`speechSynthesis`, `de-DE`) |
| Lint | ESLint 10 flat config: `js.recommended`, `react-hooks`, `react-refresh/vite` |
| Deploy | Vercel (`vercel.json` SPA rewrite) |
| Tests | none |

---

## 3. Directory layout

```
germanstudy/
├── index.html                 # entry HTML; theme bootstrap script; title "LinguaSchool"
├── vite.config.js             # plugins: tailwindcss(), react()
├── eslint.config.js
├── vercel.json                # rewrites /(.*) → /index.html
├── firestore.rules            # Firestore security rules (paste into the console to deploy)
├── .env.local                 # VITE_FIREBASE_* config (git-ignored)
├── docs/                      # CLAUDE.md, CODEBASE.md
├── public/                    # favicon.svg, icons.svg, images/hallo.png (seed story cover)
└── src/
    ├── main.jsx               # provider tree + router
    ├── App.jsx                # renders <AppRoutes/>
    ├── config.js              # APP_NAME, SPEECH_LANG, OWNER_UID, CODE_EMAIL_DOMAIN
    ├── i18n.js                # dict: { key: { de, ku } } for all student UI text
    ├── index.css              # theme tokens, component classes, animations
    ├── lib/firebase.js        # initializeApp, auth, db (Firestore), firebaseConfig
    ├── context/
    │   ├── ThemeContext.jsx   # theme state + toggle
    │   ├── LangContext.jsx    # lang state, t(), tn(), RTL handling
    │   └── AuthContext.jsx    # Firebase session → profile, logout, setAvatar
    ├── routes/
    │   ├── AppRoutes.jsx      # route table + OwnerOnly guard; subscribes to content
    │   └── ProtectedRoute.jsx # redirect to /login; starts content sync; waits for it
    ├── services/api.js        # loginWithCode() → Firebase Auth
    ├── utils/speak.js         # speak(text, onEnd), stopSpeaking()
    ├── data/
    │   ├── levels.js          # A1..B2 metadata + getLevel()
    │   ├── stories.js         # CONTENT STORE: Firestore sync, getters, writes, seed, migration
    │   ├── storyFiles/storydata.js  # built-in story seed data (v1 shape)
    │   ├── students.js        # profiles, avatars, student accounts (create/update/delete)
    │   └── settings.js        # re-exports announcement get/set from stories.js
    ├── components/
    │   ├── layout/Layout.jsx  # sidebar (desktop), top bar + bottom tabs (mobile)
    │   ├── Welcome.jsx        # full-screen greeting, once per session
    │   ├── PageHeader.jsx     # back link, optional LevelBadge, title, subtitle
    │   ├── LevelCard.jsx      # large level tile used on the *Levels pages
    │   ├── LevelBadge.jsx     # colored "A1" square (sm | lg)
    │   ├── StoryCard.jsx      # story list row (cover, number, titles, read time)
    │   ├── TopicCard.jsx      # word-topic / quiz list row
    │   ├── StoryReader.jsx    # story text, tap-word meanings, listen, KU toggle
    │   ├── QuestionCard.jsx   # one quiz question with option states
    │   ├── WordRow.jsx        # DE | KU vocabulary row with listen button
    │   ├── EmptyState.jsx     # "nothing here" card with link
    │   ├── Avatar.jsx         # image or initials circle
    │   ├── Icon.jsx           # inline SVG icon map
    │   ├── LangSwitch.jsx     # کوردی / Deutsch segmented toggle
    │   └── ThemeToggle.jsx    # sun/moon button
    └── pages/
        ├── Login.jsx, Home.jsx, Profile.jsx, NotFound.jsx, Dashboard.jsx
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
| `/dashboard` | `Dashboard` | Protected + Layout + `OwnerOnly` (`user.role === "owner"`) |
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
- `{ lang, setLang, t, tn }`.
- `t(key, vars)`: looks up `dict[key][lang]`, falls back to `.de`, then to the key itself. Replaces every `{var}`.
- `tn(key, n)`: uses `key.one` when `n === 1` and that key exists, and passes `{ n }`.

### AuthContext (`useAuth`)
- `{ user, loading, logout(), setAvatar(dataUrl|null) }`.
- `user` = `{ uid, code, name, className, level: "A1"…, role: "owner"|"student", avatar }`.
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
| `stories/{id}` | `level` (a1…b2), `order`, `titleDe`, `titleKu`, `readTime?`, `coverImage?`, `segments[{de,ku}]` | member | owner |
| `wordTopics/{id}` | `level`, `order`, `titleDe`, `titleKu`, `storyId?`, `words[{wordDe,wordKu,sentenceDe,sentenceKu}]` | member | owner |
| `quizzes/{id}` | `level`, `order`, `titleDe`, `titleKu`, `storyId?`, `questions[{questionDe,questionKu,options[],correctAnswer}]` | member | owner |
| `settings/announcement` | `text` | member | owner |
| `students/{uid}` | `code`, `name`, `className`, `level` ("A1"…) | owner, or the student themself | owner |
| `avatars/{uid}` | `dataUrl` (string < 400 kB) | the user themself or owner (if member) | the user themself or owner (if member) |

- **owner** = `request.auth.uid == OWNER_UID`. The uid is hard-coded in `firestore.rules` and must match `src/config.js`.
- **member** = the owner, or a signed-in user whose `students/{uid}` document exists. Deleting that document revokes access.
- The rules are deployed by pasting them into Firebase console → Firestore → Rules. There is no CLI setup.

### 7.1 Levels — `data/levels.js`
```js
levels = [ {id:"a1",title:"A1",color:"#4ade80"}, {id:"a2",…"#38bdf8"}, {id:"b1",…"#facc15"}, {id:"b2",…"#fb923c"} ]
getLevel(id) // unknown id → levels[0]
```
Level descriptions and names live in i18n (`level.a1`, `level.a1.desc`, …).

### 7.2 Content store — `data/stories.js`

**v2 shape.** This is the in-memory copy, and also the format used for export and import:
```js
{
  version: 2,
  stories:    { a1: Story[],     a2, b1, b2 },
  wordTopics: { a1: WordTopic[], a2, b1, b2 },
  quizzes:    { a1: Quiz[],      a2, b1, b2 },
}
Story     = { id, titleDe, titleKu, readTime?, coverImage?, segments: [{ de, ku }] }   // + level, order from Firestore
WordTopic = { id, titleDe, titleKu, storyId?, words: [{ wordDe, wordKu, sentenceDe, sentenceKu }] }
Quiz      = { id, titleDe, titleKu, storyId?, questions: [{ questionDe, questionKu, options: string[], correctAnswer: number }] }
```

**v1 shape (legacy and seed format):** `{ a1: [StoryWithExtras], … }`, where each story also carries `vocabulary` (the words) and `quiz` (the questions). `fromStoryMap()` splits each v1 story into a Story, a WordTopic, and a Quiz that share the story's `id` and are linked through `storyId`.

**Lifecycle:**
```
startContentSync()            (called by ProtectedRoute when user.uid is set; returns stop())
  onSnapshot(stories | wordTopics | quizzes | settings/announcement)
    → rebuild(): group docs by `level`, sort by `order`  → state = { content, announcement, ready }
    → notify useContent() subscribers (AppRoutes re-renders everything)
stop() (logout) → listeners closed, state reset to empty / not ready
```
`builtIn()` is now **only a seed**. It never loads automatically. The owner applies it from the Dashboard ("Eingebauten Inhalt laden" when the database is empty, or "Auf Standard zurücksetzen").

**API:**
| Function | Purpose |
|---|---|
| `getContent()`, `getStories()` | whole store / stories map |
| `storiesOf(lv)`, `findStory(lv, id)` | stories by level |
| `wordTopicsOf(lv)`, `findWordTopic(lv, id)` | word topics by level |
| `quizzesOf(lv)`, `findQuiz(lv, id)` | quizzes by level |
| `linkedWords(storyId)` | all words from every topic linked to a story (any level) |
| `linkedWordTopics(storyId)`, `linkedQuizzes(storyId)` | linked non-empty topics and quizzes, each with `level` added |
| `getAnnouncement()` | current announcement text |
| `useContent()` | `useSyncExternalStore` hook that returns `{ content, announcement, ready }` |
| `startContentSync()` | opens the listeners and returns the stop function |
| `normalizeContent(d)` | validates and upgrades v1/v2 input (used by Import and migration) |
| `builtIn()` | the seed content (v2) built from `storydata.js` |
| `saveItem(col, item)` | `setDoc` of the whole item. `id` becomes the document id; `order` defaults to `Date.now()` |
| `removeItem(col, id)` | `deleteDoc` |
| `setAnnouncement(text)` | sets `settings/announcement`, or deletes it when the text is empty |
| `replaceAllContent(v2)` | deletes all content documents, then writes the new ones in batches of 450 |
| `readLocalContent()`, `clearLocalContent()` | the old `ls-content-v2`/`v1` browser data, kept for one-time migration |

### 7.3 Seed content — `data/storyFiles/storydata.js`
Two v1-shape stories:
- `a1GreetingsStory` (`ein-tag-mit-freunden`): greetings. The cover is `/images/hallo.png` from `public/`. It's kept there because cover URLs are saved in Firestore, and Vite's hashed `src/` asset URLs change with every build.
- `a2PersoenlicheInformationenStory` (`persoenliche-informationen`): personal info at registration, Unsplash cover. Despite the name, it is placed in **a1**.

### 7.4 Students — `data/students.js`
- **Code accounts.**
  - Code `SARA-4821` ⇄ Auth email `sara-4821@linguaschool.app` with password `SARA-4821` (`codeToEmail`, `CODE_EMAIL_DOMAIN`).
  - Users only ever type the code.
- `loadProfile(fbUser)` reads `students/{uid}` and `avatars/{uid}`, and returns the profile with `role`, or `null` if the account isn't a member. On the owner's first login it creates the owner's `students` document.
- `saveAvatar(uid, dataUrl|null)`: sets or deletes `avatars/{uid}`.
- `useStudents()`: a live `onSnapshot` list of all students except the owner, sorted by name. Owner only.
- `createStudent({name, className, level}, code?)`:
  - Creates the Auth account through a **second Firebase app** (`"student-creator"`, `inMemoryPersistence`), so the owner's own session isn't replaced.
  - Then writes `students/{uid}`.
  - Without a `code` it generates `FIRSTNAME-####` and retries if that code is taken. It returns the code.
- `updateStudent(uid, data)` updates the profile.
- `deleteStudent(uid)` deletes `students/{uid}` and `avatars/{uid}`. The Auth account stays and can only be removed in the console.
- `readLocalStudents()`, `clearLocalStudents()`: the old `ls-students-v1` browser data, kept for one-time migration.

### 7.5 Settings — `data/settings.js`
- Re-exports `getAnnouncement` and `setAnnouncement` from `stories.js`. The announcement lives in `settings/announcement`, is synced with the content, and is shown on Home.

### 7.6 Auth service — `services/api.js`
`loginWithCode(raw)`:
1. Trims and upper-cases the code.
2. Calls `signInWithEmailAndPassword(codeToEmail(code), code)`.
3. Maps Firebase errors to `INVALID_CODE`, `TOO_MANY` or `NETWORK`.
4. Signs out again and throws `INVALID_CODE` if the account has no `students` document (except the owner).

It returns nothing. `AuthContext`'s listener picks up the new session.

---

## 8. Feature walkthroughs

### Login (`pages/Login.jsx`)
- Two columns on desktop: a large colored "A1 A2 B1 B2" panel, and the code form. On mobile it shows the form with level chips.
- The input upper-cases as you type. It awaits `loginWithCode()`, shows the right error for invalid code, too many tries, or no network, and once `AuthContext` has the user, `<Navigate>` sends them to `from`.
- Code login only. Google sign-in isn't enabled yet; it may be added later.

### Layout (`components/layout/Layout.jsx`)
- Desktop (`lg+`): a fixed 18rem sidebar on the **start** side, with nav links, LangSwitch and ThemeToggle, a user card, and logout.
- Mobile: a top bar (app name, toggles) and a fixed bottom tab bar. Its column count equals the number of links, so it has 6 columns when the owner's Dashboard link is shown.
- Renders `<Welcome/>`, a full-screen greeting that closes itself after 3 s and appears once per session.

### Home (`pages/Home.jsx`)
- Shows a greeting, the announcement (if set), the user's level badge and class, CTAs linking straight to the user's level for each section, and three panels with global counts of stories, questions, and words.

### Stories
- `StoriesLevels`: four `LevelCard`s with story counts, or "coming soon".
- `StoriesList`: `StoryCard`s numbered 1..n. The number is passed through `Link state={{ index }}`.
- `StoryDetail`: level and read-time chips, number plus German title, Kurdish title, then `StoryReader`, then buttons for linked word topics and quizzes.
- **`StoryReader`**:
  - Builds a `Map` from lowercase `wordDe` to entry using `linkedWords(story.id)`, plus one Unicode-aware regex. Phrases are sorted longest-first and multi-word phrases match any whitespace.
  - Splits each `seg.de` with the capturing regex. Odd parts are matches and render as `.tap-word` buttons.
  - Clicking a word opens a **meaning card**, portaled to `document.body` so parent transforms and animations don't move it. It shows the DE word with a listen button, the KU meaning, and example sentences. Escape closes it.
  - "Listen" reads the whole story aloud. A toggle shows or hides the Kurdish lines. Speech stops on unmount.

### Words
- `WordsLevels` (total word counts) → `WordsTopics` (`TopicCard` list) → `WordsList`, which has a search box filtering on `wordDe + wordKu` and shows `WordRow`s (German on the left with a listen button, Kurdish on the right).

### Quiz
- `QuizLevels` → `QuizTopics` → `QuizPlay`.
- `QuizPlay` keeps local state: `index`, `selected`, `score`, `finished`. `QuestionCard` locks after the first choice and marks options as right, wrong, or dimmed.
- A progress bar fills as questions are answered. The result screen shows an SVG score ring, a message for ≥80%, ≥50%, or lower, and confetti at ≥80%. It offers retry and back to the list.

### Profile
- Upload an avatar: it is validated (image type, ≤ 8 MB), center-cropped to a 320×320 canvas, and saved as a JPEG data URL to `avatars/{uid}` with `setAvatar`. It can be removed.
- Shows the student code, level chip, and class. Has a logout button.

### Dashboard (owner only) — `pages/Dashboard.jsx`
One large file. The whole page is `dir="ltr" lang="de"`. All labels are bilingual inline through `bi()` and `<Bi>`. Stat tiles at the top show counts of stories, words, questions, and students. Tabs:

| Tab | What it does |
|---|---|
| **Übersicht** (overview) | `SetupBox` (one-time; see below), quick-action buttons that switch tabs, a per-level content bar chart, and the announcement editor |
| **Geschichten** (stories) | Add or edit a story. The story text uses **one sentence per line, `German \|\| Kurdish`**. Lists stories with search, edit, and delete. Changing the level changes the story's `level` field. |
| **Wörter** (words) | Generic `TopicTab` with `CFG.words`. Pick an existing topic or "create new" (level, titles, optional story link), then add, edit, or delete words. Topic details (level, titles, `storyId`) can be edited separately. |
| **Quiz** | The same `TopicTab` with `CFG.quiz`. Answers are entered one per line; the correct answer is a **1-based** number in the form and stored as a 0-based `correctAnswer`. |
| **Schüler** (students) | The live list from `useStudents()`. Adding a student creates a Firebase account plus profile and shows the new `FIRSTNAME-####` code. Edit changes name, class, or level (the code stays the same). Delete revokes access. |
| **Sicherung** (backup) | Export the content as `lingua-content.json`. Import JSON (validated through `normalizeContent`, accepts v1 or v2, asks for confirmation) or reset to the built-in content. Both import and reset use `replaceAllContent`, so they replace **everything for all students**. |

**SetupBox** appears only when it's needed:
- If the database has no content, it offers "Eingebauten Inhalt laden" (`replaceAllContent(builtIn())`).
- If the browser still has pre-Firebase data, it offers to upload `ls-content-*`, and to move `ls-students-v1` students. Moved students are created with their **existing codes**, and codes that are already taken are skipped.

Write pattern used throughout:
- Build the full document. For topics, `clone(current)`, then change the `words` or `questions` array.
- `await saveItem(col, doc)` or `removeItem(col, id)`, and show `SAVE_FAIL` if it fails.
- There is no manual refresh. The `onSnapshot` listener updates the in-memory copy, and `AppRoutes` re-renders.
- IDs come from `uid(title)` (a slug plus 4 random chars) and are used as Firestore document ids. Deletes ask for `window.confirm`.

> Note: export and import cover **content only**. Students, avatars, and the announcement are not included.

---

## 9. Internationalisation and direction

- `src/i18n.js` holds roughly 100 keys grouped by prefix: `nav.*`, `common.*`, `level.*`, `count.*`, `login.*`, `home.*`, `stories.*`, `story.*`, `quiz.*`, `words.*`, `profile.*`, `theme.*`, `welcome.*`, `notFound.*`.
- The page direction follows the UI language, but **content text always declares its own direction**: German is `dir="ltr" lang="de"` and Kurdish is `dir="rtl" lang="ku"`. Level badges use `dir="ltr"`.
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
| Firestore | `avatars/{uid}` | Profile (each user) via AuthContext.setAvatar |
| Firebase Auth | one Email/Password account per code | Firebase console (owner); `createStudent` (students) |
| IndexedDB | Firebase Auth session | Firebase SDK |
| localStorage | `theme` | ThemeContext |
| localStorage | `lang` | LangContext |
| sessionStorage | `welcomed` | Welcome.jsx (cleared on logout) |
| localStorage (legacy) | `ls-content-v2`/`v1`, `ls-students-v1` | no longer written. Read once for migration, then cleared. (`auth`, `avatar:*`, `ls-announcement-v1` are no longer used at all.) |

Owner edits are shared: every logged-in student sees them live.

---

## 12. Extension points

- **Google sign-in (planned, optional)**:
  1. Enable the Google provider in Firebase Auth.
  2. For students, link it to an existing code account with `linkWithPopup` on the Profile page, so their `students/{uid}` document keeps working.
  3. For a teacher Google account, extend `isOwner()` in the rules and `OWNER_UID` in config (for example to a list).
- **New Firestore collection**: add a `match` block to `firestore.rules` and ask the user to publish it. Without a rule, all access is denied.
- **New content field**: just add it in the Dashboard form and in `saveItem`. Firestore is schemaless, and `ignoreUndefinedProperties` skips optional fields left empty.
- **Progress tracking (future)**: for example `progress/{uid}/quizzes/{quizId}`, with a rule letting each user write their own documents.
- **New level**: add it to `levels.js`, `LEVEL_IDS`/`empty()` in `stories.js`, the i18n `level.<id>` and `level.<id>.desc` keys, and check the Dashboard bar chart.
- **New UI text**: add a `dict` entry with both `de` and `ku`.
- **New built-in story**: see CLAUDE.md, "Data layer".

---

## 13. Known issues / quirks

- ESLint reports 4 known errors (one empty `catch {}` in LangContext, and the fast-refresh rule on the three context files that export hooks).
- The production bundle is about 870 kB (about 260 kB gzipped), mostly the Firebase SDK. Vite warns about chunk size.
- Seed story naming and level mismatch (`a2Persoenliche…` lives in a1).
- Unused Inter and Roboto fonts in `index.html`. `package.json` is named `"react"`. The README is the Vite template.
- Student codes are short (`NAME` + 4 digits). Firebase Auth rate limiting is the only brute-force protection.
- Deleting a student leaves an orphan Auth account, which has to be removed manually in the console.
- `replaceAllContent` commits in batches of 450, so a failure partway through can leave content half-replaced. Re-run import or reset to fix it.
- `firestore.rules` must be published by hand, and the owner uid is duplicated between the rules and `src/config.js`.
