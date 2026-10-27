# CLAUDE.md

Guidance for Claude Code when working in this repository. For the full architecture, read [CODEBASE.md](CODEBASE.md).

## What this is

**LinguaSchool** — a frontend-only React SPA for teaching **German to Kurdish (Badini dialect, Arabic script) speakers**. Students log in with a personal code and work through content grouped by CEFR level (A1, A2, B1, B2):

- **Stories** — German sentences with Kurdish translations, tap-a-word meanings, text-to-speech.
- **Words** — vocabulary lists (German ↔ Kurdish with example sentences).
- **Quiz** — multiple-choice question sets.
- **Dashboard** (owner/teacher only) — CRUD for stories, word topics, quizzes, students, and a home-page announcement.

The backend is **Firebase**, used directly from the browser:
- **Firebase Auth** (Email/Password) handles login codes.
- **Cloud Firestore** stores content, students, the announcement, and avatar links.
- `firestore.rules` controls who can read and write what.
- **Cloudflare R2** stores the image files (profile pictures, story covers). Firestore only keeps their URLs.

The only server code is **one Vercel function, `api/uploads/sign.js`**. It exists only because the R2 keys must stay secret. Everything else talks to Firebase directly, so don't add API routes for normal features. If there are ever more than about 8–10 functions, merge them into one router function (Vercel Hobby limits the number of functions).

## Commands

```bash
npm run dev       # Vite dev server; also serves api/*.js (apiDev plugin in vite.config.js), no `vercel dev` needed
npm run build     # production build -> dist/
npm run preview   # serve the build
npm run lint      # ESLint (flat config)
npm test          # Vitest unit tests (src/data/storyBundle.test.js)
```

- Unit tests: Vitest, only for the pure story-bundle logic in `src/data/storyBundle.js`. The UI is checked manually.
- `npm run lint` currently reports **4 known errors** (one `no-empty` in LangContext, and `react-refresh/only-export-components` in the three context files). Don't treat them as caused by your change. Fix them only if asked.
- `npm run build` passes, with a warning about chunks over 500 kB caused by the Firebase SDK.
- **Env vars** live in `.env.local` (git-ignored) and the same variables in Vercel. Never print the values.
  - `VITE_FIREBASE_*` (6): Firebase web config, inlined into the browser build.
  - `R2_ACCOUNT_ID` (just the 32-character ID, not the endpoint URL), `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` (`linguaschool-images`), `R2_PUBLIC_BASE_URL` (the bucket's `https://pub-….r2.dev`, no trailing slash): server-only, used by `api/uploads/sign.js`.
- **R2 bucket settings** (CORS policy, public r2.dev URL) are set in the Cloudflare dashboard, not in the repo. CORS allows `PUT` with `Content-Type` from `localhost:5173`, `localhost:3000` and the production domain.
- **`firestore.rules` is not deployed automatically.** There's no Firebase CLI setup. After you edit the file, tell the user to paste it into Firebase console → Firestore Database → Rules → Publish.
- Platform is Windows. The Bash tool runs Git Bash and PowerShell is also available.

## Stack

- React 19, react-router-dom v6 (`BrowserRouter`), Vite 8, plain **JavaScript/JSX (no TypeScript)**.
- Firebase JS SDK v12 (modular imports: `firebase/app`, `firebase/auth`, `firebase/firestore`). It's set up in `src/lib/firebase.js`, which exports `app`, `auth`, `db`, and `firebaseConfig`. Firestore is created with `ignoreUndefinedProperties: true`.
- Spark (free) plan: no Cloud Functions and no Firebase Storage (images go to R2 instead).
- `api/uploads/sign.js` uses `jose` (verifies the Firebase ID token against Google's public keys, so no Firebase admin key is needed) and `aws4fetch` (signs the R2 URL).
- Tailwind CSS v4 through `@tailwindcss/vite`. There is no `tailwind.config`; theme tokens live in `src/index.css` (`@theme inline`).
- `lucide-react` for some icons (ThemeToggle, Dashboard). Most icons use the custom `src/components/Icon.jsx` (an inline SVG map).
- Deployed on Vercel. `vercel.json` rewrites every path except `/api/*` to `/index.html` so the SPA routes work.

## Key conventions

### Bilingual UI: German (`de`) and Kurdish (`ku`)
- All student-facing UI text goes through `src/i18n.js` (`dict`) and `useLang()`:
  - `t(key, vars)` interpolates `{name}`-style placeholders and falls back to `de`, then to the key.
  - `tn(key, n)` picks the `key.one` entry when `n === 1`.
- **When adding UI text, add both `de` and `ku` to `dict`.** The Kurdish text should be checked by a native speaker; the file comment says so.
- **Exception:** the dashboard (`src/pages/dashboard/`) does not use `dict`. It writes both languages inline and shows **only the current app language** (the DE/KU switch):
  - Every component calls `const bi = useBi();` (from `dashboard/bi.js`) and uses `bi("German", "Kurdish")`. `<Bi de={…} ku={…} />` (from `dashboard/ui.jsx`) does the same for JSX.
  - Texts defined outside components (`OPT`, `SECTIONS`, the editor's `ERROR_TEXT`) are `[de, ku]` pairs shown with `bi(...pair)`. Fixed messages are `{ ok, de, ku }` objects that `<Msg>` translates.
  - Kurdish strings added with the 2026-10 redesign carry a `// KU: review` comment until a native speaker has checked them.
  - The page follows the app's `dir` (RTL in Kurdish). Inputs for German/Kurdish content keep their own `lang`/`dir`.
  - The Dashboard has **no English** by design.
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
| `avatars/{uid}` | `{ url }` (link to `avatars/{uid}.jpg` in R2, with `?v=` for cache busting) | the user themself or owner | the user themself or owner |

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
  - `saveBundle(bundle)` writes a story with its word list and quiz in one `writeBatch` (see `storyBundle.js`). `deleteBundle(storyId)` deletes all three.
  - `setAnnouncement(text)` saves the announcement; empty text deletes it.
- Content is edited as story bundles: `loadBundle` → edit → `validateBundle` → `saveBundle`. Don't write word topics or quizzes separately.
- The **level is the `level` field** (lowercase id).
- **Firestore is the single source of truth for content.** There are no story files, seed data or fallback copies in the code (the old `src/data/storyFiles/`, `builtIn()`, the "load built-in content" / backup buttons and the pre-Firebase localStorage migration were removed on purpose in 2026-10). New stories are created in the dashboard editor. Don't add content to the code. There is no in-app backup; use Firebase's own export tools if one is needed.
- **Every story cover lives in the R2 bucket.** A story needs a cover, and it can only be uploaded (Dashboard → Geschichten → a story → Details → "Bild hochladen"). There is no link field. Firestore stores the full public URL (`R2_PUBLIC_BASE_URL/covers/…`). If the bucket gets a custom domain, existing stories keep their old URLs.
- **Image uploads** (`src/services/upload.js`): `toJpeg(file, { size, square })` shrinks in the browser, then `uploadImage(kind, blob)` asks `/api/uploads/sign` for a presigned URL and PUTs the JPEG straight to R2. `kind` is `"avatar"` (any member, fixed key `avatars/{uid}.jpg`, ≤ 1 MB) or `"cover"` (owner only, `covers/<random>.jpg`, ≤ 3 MB). The signature includes `Content-Type: image/jpeg`, so nothing else can be uploaded with it.
- Replaced or deleted covers stay in R2. Nothing cleans them up yet.
- `storyId` links a word topic or quiz to a story. Linked words become tappable in `StoryReader`, and linked topics and quizzes appear as buttons under the story.

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
- **Deleting a student** removes their `students` and `avatars` documents, which revokes access. The Auth account itself can only be deleted in the console, because the client SDK can't delete other users.
- Routes: `ProtectedRoute` redirects to `/login` when there's no user. `OwnerOnly` (inside `AppRoutes.jsx`) guards `/dashboard`.

## localStorage / sessionStorage keys

The Firebase SDK keeps the login session in IndexedDB on its own. Our app's keys are:

| Key | Owner | Contents |
|---|---|---|
| `lang` | LangContext | `"ku"` / `"de"` |
| `theme` | ThemeContext + index.html | `"dark"` / `"light"` |
| `welcomed` (session) | Welcome.jsx | shows the welcome splash once per session |

Legacy keys from the pre-Firebase version that nothing reads any more: `ls-content-v2`/`-v1`, `ls-students-v1`, `auth`, `avatar:<code>`, `ls-announcement-v1`.

Wrap storage access in `try/catch`, as the existing code does.

## Known quirks / tech debt (don't "fix" unless asked)

- `index.html` loads the Inter and Roboto Google fonts, but the CSS actually uses Figtree and Noto Sans Arabic (imported in `index.css`).
- `package.json` is named `"react"` and `README.md` is the unchanged Vite template.
- Student codes (`NAME` + 4 digits) are short. Firebase Auth's rate limiting is the only brute-force protection.
- Deleting a student leaves an unused Firebase Auth account behind.
- `TopicCard` uses `text-white` on the accent-colored number badge, unlike the theme-token approach used elsewhere.
- Speech uses the browser `speechSynthesis` API with `de-DE` (`src/utils/speak.js`, `SPEECH_LANG` in `src/config.js`).

## Code style

- Function components, default exports, hooks. No PropTypes or TS types.
- Comments are short and in plain English. Keep the existing small-file, low-abstraction style.
- Double quotes and semicolons in most files. Match the file you're editing.
