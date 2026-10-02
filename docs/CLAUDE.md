# CLAUDE.md

Guidance for Claude Code when working in this repository. For the full architecture, read [CODEBASE.md](CODEBASE.md).

## What this is

**LinguaSchool** — a frontend-only React SPA for teaching **German to Kurdish (Badini dialect, Arabic script) speakers**. Students log in with a personal code and work through content grouped by CEFR level (A1, A2, B1, B2):

- **Stories** — German sentences with Kurdish translations, tap-a-word meanings, text-to-speech.
- **Words** — vocabulary lists (German ↔ Kurdish with example sentences).
- **Quiz** — multiple-choice question sets.
- **Dashboard** (owner/teacher only) — CRUD for stories, word topics, quizzes, students, a home-page announcement, and JSON import/export.

There is **no backend**. Auth is fake, and all owner edits are saved to `localStorage` in the owner's own browser only.

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # production build -> dist/
npm run preview   # serve the build
npm run lint      # ESLint (flat config)
```

- There are no tests and no test runner.
- `npm run lint` currently reports **7 errors that were already there** (`no-empty` catches, `react-hooks/set-state-in-effect` in AuthContext, `react-refresh/only-export-components` in the three context files). Don't treat them as caused by your change. Fix them only if asked.
- `npm run build` passes.
- Platform is Windows. The Bash tool runs Git Bash and PowerShell is also available.

## Stack

- React 19, react-router-dom v6 (`BrowserRouter`), Vite 8, plain **JavaScript/JSX (no TypeScript)**.
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

`src/data/stories.js` is a **module-level mutable singleton** (`let content = load()`) holding three collections, each keyed by level:

```js
{ version: 2,
  stories:    { a1: [Story], a2: [], b1: [], b2: [] },
  wordTopics: { a1: [{ id, titleDe, titleKu, storyId?, words: [...] }], ... },
  quizzes:    { a1: [{ id, titleDe, titleKu, storyId?, questions: [...] }], ... } }
```

- `load()` reads `localStorage["ls-content-v2"]`, then the legacy `"ls-content-v1"`, and only if neither exists falls back to `builtIn()`.
- `builtIn()` converts the hard-coded stories in `src/data/storyFiles/storydata.js` from the v1 shape (a story carrying its own `vocabulary` + `quiz`) using `fromStoryMap`.
- ⚠️ **If you edit `storydata.js`, a browser that already has `ls-content-v2` saved will not show the change.** To see it, clear that key or use Dashboard → Sicherung → "Auf Standard zurücksetzen".
- ⚠️ A story's **level is the collection key it sits under**, not its `level` string field. That field (for example `"A1 (Anfänger)"`) is display-only.
- To add a built-in story: export it from `storydata.js` in the v1 shape (`id, titleDe, titleKu, level, readTime, coverImage, segments[{de,ku}], vocabulary[{wordDe,wordKu,sentenceDe,sentenceKu}], quiz[{questionDe,questionKu,options[],correctAnswer(index)}]`), import it in `stories.js`, and add it to the right level array in `builtIn()`.
- `storyId` links a word topic or quiz to a story. Linked words become tappable in `StoryReader` (longest-match regex), and linked topics and quizzes appear as buttons under the story.
- Mutations follow this pattern: `const data = clone(getContent()); …mutate…; saveContent(data); refresh();`. Pages read content during render through getter functions. Nothing in the data layer is reactive, so the Dashboard forces a re-render with a `useReducer` counter called `refresh`.

## Auth

- `src/services/api.js` → `loginWithCode(code)` is a **temporary fake**. It upper-cases the code and looks it up in `getStudents()` (built-in plus dashboard-created students). It returns `token: "fake-token"`.
- The built-in owner code is **`OWNER-2026`** (`role: "owner"`), defined in `src/data/students.js`.
- Dashboard-created students get codes like `NAME-1234` and are stored in `localStorage["ls-students-v1"]`.
- `AuthContext` stores `{user, token}` in `localStorage["auth"]`. Avatars are stored per user under `avatar:<code>` as a 320px JPEG data URL.
- Routes: `ProtectedRoute` redirects to `/login` when there's no user. `OwnerOnly` (inside `AppRoutes.jsx`) guards `/dashboard`.

## localStorage / sessionStorage keys

| Key | Owner | Contents |
|---|---|---|
| `auth` | AuthContext | `{ user, token }` |
| `avatar:<code>` | AuthContext | profile picture data URL |
| `lang` | LangContext | `"ku"` / `"de"` |
| `theme` | ThemeContext + index.html | `"dark"` / `"light"` |
| `ls-content-v2` (`-v1` legacy) | data/stories.js | all content |
| `ls-students-v1` | data/students.js | dashboard-created students |
| `ls-announcement-v1` | data/settings.js | home-page announcement |
| `welcomed` (session) | Welcome.jsx | shows the welcome splash once per session |

Wrap storage access in `try/catch`, as the existing code does.

## Known quirks / tech debt (don't "fix" unless asked)

- `src/data/stories.js` contains a stray no-op block `{"put stories here"}`. It's a placeholder marker.
- `a2PersoenlicheInformationenStory` is named "a2" but sits in the **a1** array in `builtIn()`, and its `level` says A1.
- `index.html` loads the Inter and Roboto Google fonts, but the CSS actually uses Figtree and Noto Sans Arabic (imported in `index.css`).
- `package.json` is named `"react"` and `README.md` is the unchanged Vite template.
- `env.prod` (empty, untracked) and `docs/` (empty) exist in the working tree. No environment variables are used in the code.
- `TopicCard` uses `text-white` on the accent-colored number badge, unlike the theme-token approach used elsewhere.
- Speech uses the browser `speechSynthesis` API with `de-DE` (`src/utils/speak.js`, `SPEECH_LANG` in `src/config.js`).

## Code style

- Function components, default exports, hooks. No PropTypes or TS types.
- Comments are short and in plain English. Keep the existing small-file, low-abstraction style.
- Double quotes and semicolons in most files. Match the file you're editing.
