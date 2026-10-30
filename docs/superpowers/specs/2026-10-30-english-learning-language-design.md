# English as a second learning language — design

Date: 2026-10-30 · Status: draft for review

## Goal

LinguaSchool teaches German to Badini Kurdish speakers. Add **English** as a second learning language:

- The teacher picks **German or English** for each student when creating the account (and can change it later).
- A student sees only the stories, words and quizzes of their learning language. The interface toggle shows **Kurdish + their learning language** (کوردی / Deutsch, or کوردی / English), working exactly like today's toggle.
- A student can change their learning language on the **Profile** page, after a confirmation dialog.
- The English library starts as a translation of the current German library (17 stories with their word lists and quizzes).

Decisions taken with the owner:

| Topic | Decision |
|---|---|
| English vs German content | **Separate libraries.** English starts as translated copies (same covers, same Kurdish where the meaning is the same) but is independent afterwards. |
| Dashboard interface | Kurdish, German **and English** (three-way toggle for the teacher). |
| English variety | **British** spelling, `en-GB` read-aloud voice. |
| Getting content into Firestore | A **temporary Node script** in the repo (logs in as the teacher), deleted after use. No content is stored in code. |
| Data model | One set of collections with a **`lang` field**; the German-named fields get **neutral names**; existing documents are migrated once. |

## 1. Data model (Firestore)

Content collections stay `stories`, `wordTopics`, `quizzes`. Every document gets `lang: "de" | "en"`, and the German-specific field names become neutral:

| Collection | Before | After |
|---|---|---|
| stories | `titleDe`, `segments: [{ de, ku }]` | `lang`, `title`, `segments: [{ text, ku }]` |
| wordTopics | `titleDe`, `words: [{ wordDe, wordKu, sentenceDe, sentenceKu }]` | `lang`, `title`, `words: [{ word, wordKu, sentence, sentenceKu }]` |
| quizzes | `titleDe`, `questions: [{ questionDe, questionKu, options, correctAnswer }]` | `lang`, `title`, `questions: [{ question, questionKu, options, correctAnswer }]` |

Unchanged: `level`, `order`, `titleKu`, `readTime`, `coverImage`, `storyId`, all `…Ku` fields, `options`, `correctAnswer`.

Students: `students/{uid}` gets `learnLang: "de" | "en"`. A missing value means `"de"` (all existing students keep learning German without a migration). The owner's own profile has it too, so the owner can preview either library as a student.

**Old-shape tolerance.** The content store normalizes every document when it is loaded (`title ?? titleDe`, `text ?? de`, `lang ?? "de"`, …) in one small pure function. The new code therefore works before and after the migration, so deploy and migration don't have to happen at the same second. The fallback can be removed once the migration has run.

## 2. Learning language and interface language

- **`learnLang`** comes from the logged-in profile (`user.learnLang ?? "de"`). Student pages read content only for that language: `storiesOf(lang, level)`, `findStory(lang, level, id)`, etc. The store keeps everything grouped by language and level: `content[lang].stories[level]`.
- **Interface language** (`LangContext.lang`) becomes `"ku" | "de" | "en"`.
  - Students can pick `ku` or their `learnLang`. The owner can pick all three.
  - If the saved choice is not allowed (for example the student switched from German to English while the UI was in German), it switches to the new learning language.
  - `LangSwitch` shows the allowed options: کوردی · Deutsch, کوردی · English, or all three for the owner.
- **Texts.** Every entry in `i18n.js` gets an `en` text. Texts that name the learning language ("auf Deutsch", "ئەلمانی") take it as a parameter (`{language}`) instead of saying German.
- **Dashboard texts.** `bi(de, ku)` becomes `tr(de, ku, en)` (hook `useTr`), and all ~140 calls get an English text. The `[de, ku]` message pairs become triples.

## 3. Learning-language-specific behaviour

- **Read-aloud.** `config.js` gets `SPEECH_LANGS = { de: "de-DE", en: "en-GB" }`. `speak(text, lang)` picks a voice for that language, cached per language.
- **Markup.** `lang="de"` in components becomes the learning language (`lang={learnLang}`), so screen readers and the browser's hyphenation use the right language.
- **Quiz.** `QuestionCard`'s "German only" read-aloud filter becomes a generic "learning-language only" filter: it leaves out the Kurdish (Arabic-script) parts, whatever the learning language is.
- **Quiz generator.** `generateQuestions` uses a template per language:
  - German: `Was bedeutet 'X'?`
  - English: `What does 'X' mean?`
  - The Kurdish question `رامانا 'X' چییە؟` is the same for both.

## 4. Teacher (dashboard)

- **Schüler / Students.**
  - The add/edit form gets a required **Lernsprache / Learning language** select (Deutsch · English, default Deutsch).
  - The list shows the language next to code, class and level, and the search matches it.
  - Changing it in the edit form is allowed.
- **Library.**
  - A language switch at the top (Deutsch · English, with story counts) chooses which library is shown. It is remembered per browser.
  - Level filters, search and "Neue Geschichte" work inside the chosen library, and a new story gets that `lang`.
  - The summary line counts the chosen library.
- **Editor.**
  - The story's language is shown as a badge and can't be changed (a story belongs to one library).
  - Labels follow it ("Deutscher Satz" / "English sentence"), the quiz generator uses its template, and the "other stories" answer pool only uses stories of the same language and level.

## 5. Student profile

- A **Learning language** card shows the current language, plus a button to switch to the other one.
- Switching opens the confirm dialog, for example: *"Switch to English? You will see the English stories, words and quizzes. You can switch back at any time."* (the text is in the current interface language).
- On confirm it updates `students/{uid}.learnLang`, updates the logged-in user in `AuthContext`, and adjusts the interface language if needed. There is no progress tracking in the app today, so nothing is lost by switching.
- **Rules.** Students may update **only** `learnLang` on **their own** profile, and only to `"de"` or `"en"`:

```
allow update: if signedIn() && request.auth.uid == uid
  && request.resource.data.diff(resource.data).affectedKeys().hasOnly(["learnLang"])
  && request.resource.data.learnLang in ["de", "en"];
```

(The owner rule stays `allow write: if isOwner()`.) `firestore.rules` is updated in the repo, and the owner pastes it into the Firebase console.

## 6. English content and migration (temporary script)

`scripts/content-tool.mjs` is a Node script using the Firebase client SDK (the same config as the app). It asks for the teacher's email and password when it runs (hidden input, never saved) and has three commands:

1. **`export <file>`** writes all stories, word lists and quizzes to a JSON file **outside the repo**.
2. **`migrate`** rewrites every existing content document to the new field names and adds `lang: "de"`. It is safe to run twice (already-migrated documents are skipped). `--dry-run` prints what would change.
3. **`import <file>`** writes the English bundles. Each one gets a new id from its English title. `--dry-run` is supported.

The script is deleted after use, and the English JSON never enters the repo.

Translation rules (I do the translation from the export):

- **Stories:** natural British English at the same CEFR level, same structure (same sentences in the same order where possible), same cover, same reading time. Kurdish lines are reused where the meaning is the same; where the English sentence has to differ, the Kurdish is adapted.
- **Words:** the English equivalent of each German entry, with the same Kurdish meaning and translated example sentences.
  - German-only details (articles, plural forms like "Das Öl Öle") become plain English entries.
  - Where an English word needs a different Kurdish meaning, it is adapted.
- **Quizzes:** the same number of questions.
  - "Was bedeutet …?" becomes "What does … mean?", and German answers are translated.
  - Questions about German grammar (articles, cases) are replaced with English questions of the same level and type.
- **Kurdish review:** every Kurdish text I write or change is listed in a review file next to the JSON, so a native speaker can check it before import.

**Order of steps:**
1. Merge and deploy the code (it reads both shapes).
2. `export`
3. I translate, and you review.
4. `migrate`
5. `import`
6. Publish the new rules.
7. Delete the script.

## 7. Units and testing

- **Pure, unit-tested:**
  - `normalizeDoc` (old and new shape → new)
  - `storyBundle.js` with the new field names and `lang` (load, clean, validate, `bundleToDocs` writing `lang`)
  - `generateQuestions` per language
  - an **i18n completeness test**: every key has `de`, `ku` and `en`, and `{placeholders}` match across languages.
- **Script:** a pure `migrateDoc(col, data)` with tests; the Firestore I/O is a thin layer around it.
- **Manual checklist:**
  1. A German student sees only German, with the کوردی/Deutsch toggle.
  2. An English student sees only English, with the کوردی/English toggle and the British voice.
  3. Profile switch: the dialog appears, content and toggle change, and it survives a reload.
  4. Teacher: create a student with English, switch libraries, create and edit an English story, and use the three-way dashboard toggle.
  5. The rules reject a student changing anything but `learnLang`.

## Out of scope

- Progress tracking or scores per language.
- Linking German and English versions of a story.
- A third learning language. The model allows it later: a new `lang` value, `SPEECH_LANGS` entry, generator template and interface texts.
- Restricting students in the rules to reading only their own language (both libraries are readable by members, as today).
