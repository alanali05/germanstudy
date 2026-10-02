# CODEBASE.md — LinguaSchool architecture

LinguaSchool is a client-only React single-page app for learning German, built for speakers of Kurdish (Badini, Arabic script). It has no server, database, or API. All data is either bundled into the JS or kept in the browser's `localStorage`.

---

## 1. High-level picture

```
                 ┌──────────────────────────── Browser ─────────────────────────────┐
 index.html ───▶ │ inline script: sets html[data-theme] from localStorage (no flash)  │
                 │                                                                    │
 src/main.jsx ─▶ │ <BrowserRouter>                                                    │
                 │   <ThemeProvider>      theme: dark|light  → html[data-theme]       │
                 │     <LangProvider>     lang: ku|de        → html[lang,dir]  t()/tn()│
                 │       <AuthProvider>   user, login, logout, setAvatar              │
                 │         <App> → <AppRoutes>                                        │
                 │                                                                    │
                 │ Pages ──read──▶ data/stories.js (mutable singleton) ◀──write── Dashboard
                 │                     │                                              │
                 │                     ├─ builtIn(): data/storyFiles/storydata.js     │
                 │                     └─ localStorage "ls-content-v2"                │
                 │ Login ─▶ services/api.js ─▶ data/students.js (+ localStorage)      │
                 └────────────────────────────────────────────────────────────────────┘
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
├── public/                    # favicon.svg, icons.svg
└── src/
    ├── main.jsx               # provider tree + router
    ├── App.jsx                # renders <AppRoutes/>
    ├── config.js              # APP_NAME, SPEECH_LANG
    ├── i18n.js                # dict: { key: { de, ku } } for all student UI text
    ├── index.css              # theme tokens, component classes, animations
    ├── images/hallo.png       # cover image for the built-in A1 story
    ├── context/
    │   ├── ThemeContext.jsx   # theme state + toggle
    │   ├── LangContext.jsx    # lang state, t(), tn(), RTL handling
    │   └── AuthContext.jsx    # user session, avatar storage
    ├── routes/
    │   ├── AppRoutes.jsx      # route table + OwnerOnly guard
    │   └── ProtectedRoute.jsx # redirect to /login when logged out
    ├── services/api.js        # loginWithCode() — fake, local lookup
    ├── utils/speak.js         # speak(text, onEnd), stopSpeaking()
    ├── data/
    │   ├── levels.js          # A1..B2 metadata + getLevel()
    │   ├── stories.js         # CONTENT STORE (stories, wordTopics, quizzes)
    │   ├── storyFiles/storydata.js  # built-in story seed data (v1 shape)
    │   ├── students.js        # built-in owner + dashboard students
    │   └── settings.js        # announcement get/set
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
5. `AuthProvider` restores `localStorage.auth` in an effect. While that runs, `loading=true`, so `ProtectedRoute` shows "Loading…".
6. `AppRoutes` renders the matching route.

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
- `{ user, loading, login(student, token), logout(), setAvatar(dataUrl|null) }`.
- `user` is a student record `{ code, name, className, level: "A1".., role? }` with `avatar` merged in from `localStorage["avatar:<code>"]`.
- `logout` clears `auth` and the session `welcomed` flag.

---

## 7. Data layer

There is no fetching. Pages import plain functions from `src/data/*` and call them during render.

### 7.1 Levels — `data/levels.js`
```js
levels = [ {id:"a1",title:"A1",color:"#4ade80"}, {id:"a2",…"#38bdf8"}, {id:"b1",…"#facc15"}, {id:"b2",…"#fb923c"} ]
getLevel(id) // unknown id → levels[0]
```
Level descriptions and names live in i18n (`level.a1`, `level.a1.desc`, …).

### 7.2 Content store — `data/stories.js`

**v2 shape (current):**
```js
{
  version: 2,
  stories:    { a1: Story[],     a2, b1, b2 },
  wordTopics: { a1: WordTopic[], a2, b1, b2 },
  quizzes:    { a1: Quiz[],      a2, b1, b2 },
}
Story     = { id, titleDe, titleKu, level /*display text*/, readTime?, coverImage?, segments: [{ de, ku }] }
WordTopic = { id, titleDe, titleKu, storyId?, words: [{ wordDe, wordKu, sentenceDe, sentenceKu }] }
Quiz      = { id, titleDe, titleKu, storyId?, questions: [{ questionDe, questionKu, options: string[], correctAnswer: number }] }
```

**v1 shape (legacy and seed format):** `{ a1: [StoryWithExtras], … }`, where each story also carries `vocabulary` (the words) and `quiz` (the questions). `fromStoryMap()` splits each v1 story into a Story, a WordTopic, and a Quiz that share the story's `id` and are linked through `storyId`.

**Lifecycle:**
```
module load → load():
   localStorage "ls-content-v2" → normalizeContent()
   else "ls-content-v1"         → normalizeContent()  (v1 → v2)
   else builtIn()               → fromStoryMap({ a1: [a1GreetingsStory, a2PersoenlicheInformationenStory], a2:[], b1:[], b2:[] })
let content = …   // singleton, mutated only through saveContent/resetContent
```

**API:**
| Function | Purpose |
|---|---|
| `getContent()`, `getStories()` | whole store / stories map |
| `storiesOf(lv)`, `findStory(lv, id)` | stories by level |
| `wordTopicsOf(lv)`, `findWordTopic(lv, id)` | word topics by level |
| `quizzesOf(lv)`, `findQuiz(lv, id)` | quizzes by level |
| `linkedWords(storyId)` | all words from every topic linked to a story (any level) |
| `linkedWordTopics(storyId)`, `linkedQuizzes(storyId)` | linked non-empty topics and quizzes, each with `level` added |
| `normalizeContent(d)` | validates and upgrades v1/v2 input (used by load and Import) |
| `saveContent(next)` | replaces the singleton and saves it |
| `resetContent()` | goes back to `builtIn()` and removes both storage keys |

> The store is **not reactive**. Student pages read it on each render, which is fine because content only changes from the Dashboard. The Dashboard re-renders itself after each write with `useReducer` (`refresh`).

### 7.3 Seed content — `data/storyFiles/storydata.js`
Two v1-shape stories:
- `a1GreetingsStory` (`ein-tag-mit-freunden`): greetings, local cover image `images/hallo.png`.
- `a2PersoenlicheInformationenStory` (`persoenliche-informationen`): personal info at registration, Unsplash cover. Despite the name, it is placed in **a1**.

### 7.4 Students — `data/students.js`
- `students`: built-in list. Currently only `{ code: "OWNER-2026", name: "Teacher", className: "Owner", level: "B2", role: "owner" }`.
- `getCustomStudents()` / `saveCustomStudents()` read and write `localStorage["ls-students-v1"]`.
- `getStudents()` returns built-in plus custom students.

### 7.5 Settings — `data/settings.js`
- `getAnnouncement()` / `setAnnouncement(text)` use `localStorage["ls-announcement-v1"]`. An empty value removes it. The announcement is shown on Home.

### 7.6 Auth service — `services/api.js`
`loginWithCode(raw)` trims and upper-cases the code, waits 500 ms, and finds it in `getStudents()`. It returns `{ student, token: "fake-token" }` or throws an error with `code: "INVALID_CODE"`. **This is the seam where a real backend `fetch` should go.**

---

## 8. Feature walkthroughs

### Login (`pages/Login.jsx`)
- Two columns on desktop: a large colored "A1 A2 B1 B2" panel, and the code form. On mobile it shows the form with level chips.
- The input upper-cases as you type. On success it calls `login()`, and `<Navigate>` sends the user to `from`.

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
- Upload an avatar: it is validated (image type, ≤ 8 MB), center-cropped to a 320×320 canvas, saved as a JPEG data URL with `setAvatar`, and can be removed.
- Shows the student code, level chip, and class. Has a logout button.

### Dashboard (owner only) — `pages/Dashboard.jsx`
One large file. The whole page is `dir="ltr" lang="de"`. All labels are bilingual inline through `bi()` and `<Bi>`. Stat tiles at the top show counts of stories, words, questions, and students. Tabs:

| Tab | What it does |
|---|---|
| **Übersicht** (overview) | Quick-action buttons that switch tabs, a per-level content bar chart, and the announcement editor |
| **Geschichten** (stories) | Add or edit a story. The story text uses **one sentence per line, `German \|\| Kurdish`**. Lists stories with search, edit, and delete. Changing the level moves the story to another level array. |
| **Wörter** (words) | Generic `TopicTab` with `CFG.words`. Pick an existing topic or "create new" (level, titles, optional story link), then add, edit, or delete words. Topic details (level, titles, `storyId`) can be edited separately. |
| **Quiz** | The same `TopicTab` with `CFG.quiz`. Answers are entered one per line; the correct answer is a **1-based** number in the form and stored as a 0-based `correctAnswer`. |
| **Schüler** (students) | Add or edit students (name, class, level). Codes are generated as `FIRSTNAME-####`. Built-in students are read-only. |
| **Sicherung** (backup) | Export the content as `lingua-content.json`, import JSON (validated through `normalizeContent`, accepts v1 or v2), or reset to the built-in content. |

Write pattern used throughout: `clone(getContent())` → mutate → `saveContent()` → `refresh()`. IDs come from `uid(title)` (a slug plus 4 random chars). Deletes ask for `window.confirm`.

> Note: export and import cover **content only**. Students and the announcement are not included.

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

| Storage | Key | Written by |
|---|---|---|
| localStorage | `theme` | ThemeContext |
| localStorage | `lang` | LangContext |
| localStorage | `auth` | AuthContext.login/logout |
| localStorage | `avatar:<code>` | AuthContext.setAvatar |
| localStorage | `ls-content-v2` (reads legacy `ls-content-v1`) | data/stories.js |
| localStorage | `ls-students-v1` | data/students.js |
| localStorage | `ls-announcement-v1` | data/settings.js |
| sessionStorage | `welcomed` | Welcome.jsx (cleared on logout) |

Everything is per browser. Students on other devices **never see** owner edits unless content is exported and imported, or a backend is added.

---

## 12. Extension points and future backend

- **Auth**: replace the body of `services/api.js#loginWithCode` with a `fetch`, and store a real token in `AuthContext`.
- **Content**: put the getter and setter functions in `data/stories.js` behind an API. Pages already go only through those functions, but they call them synchronously during render, so async loading would need state, Suspense, or a data context.
- **Students and announcement**: same idea, using `data/students.js` and `data/settings.js`.
- **New level**: add it to `levels.js`, `LEVEL_IDS`/`empty()` in `stories.js`, the i18n `level.<id>` and `level.<id>.desc` keys, and check the Dashboard bar chart.
- **New UI text**: add a `dict` entry with both `de` and `ku`.
- **New built-in story**: see CLAUDE.md, "Data layer".

---

## 13. Known issues / quirks

- ESLint reports 7 errors that were already there (empty `catch {}` blocks, `setState` inside an effect in AuthContext, and the fast-refresh rule on context files exporting hooks).
- The stray `{"put stories here"}` block statement in `data/stories.js` is a placeholder and does nothing.
- Seed story naming and level mismatch (`a2Persoenliche…` lives in a1).
- Unused Inter and Roboto fonts in `index.html`. `package.json` is named `"react"`. The README is the Vite template.
- Untracked empty `env.prod` and an empty `docs/` folder.
- Login security is placeholder only: codes are visible in the client bundle and in localStorage.
