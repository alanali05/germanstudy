# Plan: Dashboard redesign — Library + one-page story editor

## Header
- **Goal:** Replace the tabbed owner dashboard with three sections: Geschichten (a library and a one-page story editor that edits a story, its word list and its quiz together), Schüler and Einstellungen. No current function is lost.
- **Spec:** `docs/superpowers/specs/2026-10-27-dashboard-library-editor-design.md`
- **Architecture:**
  - Pure functions in `src/data/storyBundle.js` turn the content store into a *story bundle* and back into Firestore writes. They are unit-tested with Vitest.
  - `stories.js` gets `saveBundle` and `deleteBundle`, each a single `writeBatch`.
  - The UI lives in `src/pages/dashboard/`. These are nested routes under `/dashboard`, and the layout passes `{ students, setDirty }` through the Outlet context.
- **Tech stack:** React 19, react-router-dom 6 (`BrowserRouter`), Tailwind 4, Firebase 12 (Firestore), lucide-react, Vitest 5 (new, dev only).
- **Global constraints:**
  - No change to the Firestore data model, `firestore.rules` or the student pages. No drafts.
  - All labels go through `bi(de, ku)`. Every new Kurdish string carries a `// KU: review` comment on its line.
  - `npm run lint` must show only the 4 known errors.
  - Don't commit unless the owner asks.

## File Structure
- Create: `src/data/storyBundle.js`: pure bundle logic.
- Create: `src/data/storyBundle.test.js`: Vitest unit tests.
- Create: `src/pages/dashboard/bi.js`: the `useBi` hook and the shared message pairs.
- Create: `src/pages/dashboard/ui.jsx`: `Bi`, `Field`, `Box`, `Row`, `SubmitRow`, `Msg`, `SearchBox`.
- Create: `src/pages/dashboard/DashboardLayout.jsx`: header, summary line, section switch, Outlet.
- Create: `src/pages/dashboard/LibraryPage.jsx` and `src/pages/dashboard/LibraryCard.jsx`.
- Create: `src/pages/dashboard/StudentsPage.jsx`: the old StudentsTab.
- Create: `src/pages/dashboard/SettingsPage.jsx`: announcement, setup and backup (moved code).
- Create: `src/pages/dashboard/editor/StoryEditorPage.jsx`, `JumpNav.jsx`, `DetailsSection.jsx`, `SentencesSection.jsx`, `BulkPaste.jsx`, `WordsSection.jsx`, `QuizSection.jsx`, `SaveBar.jsx`.
- Modify: `package.json`: the `vitest` devDependency and a `test` script.
- Modify: `src/data/stories.js`: add `saveBundle` and `deleteBundle`.
- Modify: `src/routes/AppRoutes.jsx`: nested dashboard routes.
- Modify: `docs/CLAUDE.md` and `docs/CODEBASE.md`: test command, dashboard structure.
- Delete: `src/pages/Dashboard.jsx`.

## Tasks

### Task 1: Add Vitest
Files: `package.json`
Interface: produces `npm test`, which runs `vitest run`.
Steps:
- [ ] Run: `npm install -D vitest@^5.0.5`
- [ ] In `package.json` → `scripts`, add `"test": "vitest run"` after `"lint"`.
- [ ] Run: `npx vitest run --passWithNoTests`
- [ ] Verify: it exits with code 0 and prints "No test files found".

### Task 2: Write the failing tests for the story bundle
Files: `src/data/storyBundle.test.js`
Interface: consumes `src/data/storyBundle.js`, which doesn't exist yet, with these exports: `bundleToDocs, cleanBundle, emptyBundle, generateQuestions, loadBundle, moveItem, parsePaste, slugId, storyHealth, validateBundle`.
Steps:
- [ ] Create the test file:

```js file=src/data/storyBundle.test.js
import { describe, expect, it } from "vitest";
import {
  bundleToDocs, cleanBundle, emptyBundle, generateQuestions, loadBundle, moveItem, parsePaste, slugId, storyHealth, validateBundle,
} from "./storyBundle";

const levels = () => ({ a1: [], a2: [], b1: [], b2: [] });
// Content store shape (grouped by level), like getContent() returns
function content({ stories = [], wordTopics = [], quizzes = [] } = {}) {
  const c = { stories: levels(), wordTopics: levels(), quizzes: levels() };
  Object.entries({ stories, wordTopics, quizzes }).forEach(([col, list]) => list.forEach((x) => c[col][x.level].push(x)));
  return c;
}
const story = {
  id: "s1", level: "a2", order: 5, number: 3, titleDe: "Kochen", titleKu: "چێشتکرن", readTime: "4 min",
  coverImage: "https://img.test/c.jpg", segments: [{ de: "Hallo.", ku: "سڵاو." }],
};
const topic = {
  id: "s1", level: "a2", order: 6, storyId: "s1", titleDe: "Kochen",
  words: [{ wordDe: "Gemeinsam", wordKu: "پێکڤە", sentenceDe: "", sentenceKu: "" }],
};
const quiz = {
  id: "s1", level: "a2", order: 7, storyId: "s1", titleDe: "Kochen",
  questions: [{ questionDe: "Was?", questionKu: "", options: ["a", "b"], correctAnswer: 1 }],
};
const validBundle = () => ({
  ...emptyBundle(), id: "s1", titleDe: "Titel", coverImage: "https://img.test/c.jpg", segments: [{ de: "Satz.", ku: "رستە." }],
});
const w = (wordDe, wordKu) => ({ wordDe, wordKu, sentenceDe: "", sentenceKu: "" });
const codes = (errors) => errors.map((e) => (e.n ? `${e.code}:${e.n}` : e.code));
const first = () => 0; // deterministic "random"

describe("loadBundle", () => {
  it("returns null for an unknown story", () => {
    expect(loadBundle(content(), "nope")).toBeNull();
  });

  it("loads the story with its word list and quiz", () => {
    const { bundle, otherWordTopics, otherQuizzes } = loadBundle(content({ stories: [story], wordTopics: [topic], quizzes: [quiz] }), "s1");
    expect(bundle).toMatchObject({
      id: "s1", level: "a2", order: 5, titleDe: "Kochen", titleKu: "چێشتکرن", readTime: "4 min",
      wordTopicId: "s1", wordTopicOrder: 6, quizId: "s1", quizOrder: 7, extra: { number: 3 },
    });
    expect(bundle.segments).toEqual([{ de: "Hallo.", ku: "سڵاو." }]);
    expect(bundle.words).toEqual(topic.words);
    expect(bundle.questions).toEqual(quiz.questions);
    expect([otherWordTopics, otherQuizzes]).toEqual([0, 0]);
  });

  it("works for a story without word list or quiz", () => {
    const { bundle } = loadBundle(content({ stories: [story] }), "s1");
    expect(bundle).toMatchObject({ words: [], questions: [], wordTopicId: null, quizId: null });
  });

  it("prefers the linked document with the story's id and counts the others", () => {
    const other = { ...topic, id: "older", words: [w("Alt", "کەڤن")] };
    const r = loadBundle(content({ stories: [story], wordTopics: [other, topic] }), "s1");
    expect(r.bundle.wordTopicId).toBe("s1");
    expect(r.otherWordTopics).toBe(1);
  });

  it("falls back to the first linked document", () => {
    const other = { ...topic, id: "older" };
    expect(loadBundle(content({ stories: [story], wordTopics: [other] }), "s1").bundle.wordTopicId).toBe("older");
  });
});

describe("cleanBundle", () => {
  it("trims text and drops empty rows", () => {
    const c = cleanBundle({
      ...validBundle(), titleDe: "  T ",
      segments: [{ de: " a ", ku: "" }, { de: " ", ku: " " }],
      words: [w("", "")],
      questions: [{ questionDe: "", questionKu: "", options: ["", ""], correctAnswer: 0 }],
    });
    expect(c.titleDe).toBe("T");
    expect(c.segments).toEqual([{ de: "a", ku: "" }]);
    expect(c.words).toEqual([]);
    expect(c.questions).toEqual([]);
  });

  it("drops empty answers and keeps correctAnswer on its answer", () => {
    const c = cleanBundle({ ...validBundle(), questions: [{ questionDe: "Q", questionKu: "", options: ["", "x", " y "], correctAnswer: 2 }] });
    expect(c.questions[0]).toEqual({ questionDe: "Q", questionKu: "", options: ["x", "y"], correctAnswer: 1 });
  });
});

describe("validateBundle", () => {
  it("accepts a complete story", () => {
    expect(validateBundle(validBundle())).toEqual([]);
  });

  it("needs a German title, a cover and a sentence", () => {
    expect(codes(validateBundle(emptyBundle()))).toEqual(["titleDe", "cover", "segments"]);
  });

  it("flags a sentence without German text", () => {
    const b = { ...validBundle(), segments: [{ de: "Satz.", ku: "" }, { de: "", ku: "تەنێ کوردی" }] };
    expect(codes(validateBundle(b))).toEqual(["segmentDe:2"]);
  });

  it("flags a word without meaning", () => {
    expect(codes(validateBundle({ ...validBundle(), words: [w("Haus", "")] }))).toEqual(["word:1"]);
  });

  it("checks quiz questions", () => {
    const b = {
      ...validBundle(),
      questions: [
        { questionDe: "", questionKu: "", options: ["a", "b"], correctAnswer: 0 },
        { questionDe: "Q2", questionKu: "", options: ["a", ""], correctAnswer: 0 },
        { questionDe: "Q3", questionKu: "", options: ["a", "b", ""], correctAnswer: 2 },
      ],
    };
    expect(codes(validateBundle(b))).toEqual(["questionText:1", "questionOptions:2", "questionCorrect:3"]);
  });
});

describe("bundleToDocs", () => {
  it("writes story, word list and quiz with shared level, titles and storyId", () => {
    const { bundle } = loadBundle(content({ stories: [story], wordTopics: [topic], quizzes: [quiz] }), "s1");
    const { sets, deletes } = bundleToDocs({ ...bundle, level: "b1", titleDe: " Neu " }, 999);
    const head = { level: "b1", titleDe: "Neu", titleKu: "چێشتکرن" };
    expect(deletes).toEqual([]);
    expect(sets).toEqual([
      ["stories", "s1", { number: 3, ...head, order: 5, readTime: "4 min", coverImage: "https://img.test/c.jpg", segments: [{ de: "Hallo.", ku: "سڵاو." }] }],
      ["wordTopics", "s1", { ...head, order: 6, storyId: "s1", words: topic.words }],
      ["quizzes", "s1", { ...head, order: 7, storyId: "s1", questions: quiz.questions }],
    ]);
  });

  it("deletes an emptied word list and quiz", () => {
    const b = { ...validBundle(), wordTopicId: "old-topic", quizId: null };
    expect(bundleToDocs(b, 1).deletes).toEqual([["wordTopics", "old-topic"], ["quizzes", "s1"]]);
  });

  it("gives new documents the order 'now'", () => {
    const { sets } = bundleToDocs({ ...validBundle(), words: [w("A", "B")] }, 1234);
    expect(sets[0][2].order).toBe(1234);
    expect(sets[1]).toEqual(["wordTopics", "s1", expect.objectContaining({ order: 1234, storyId: "s1" })]);
  });
});

describe("parsePaste", () => {
  it("pairs German and Kurdish lines and skips blank lines", () => {
    expect(parsePaste("Eins.\n\n Zwei. \n", "ئێک.\nدوو.")).toEqual({
      segments: [{ de: "Eins.", ku: "ئێک." }, { de: "Zwei.", ku: "دوو." }], deCount: 2, kuCount: 2, unmatched: [],
    });
  });

  it("reports rows without a partner", () => {
    const r = parsePaste("Eins.\nZwei.\nDrei.", "ئێک.");
    expect(r.segments).toHaveLength(3);
    expect(r.unmatched).toEqual([1, 2]);
  });

  it("reads the old 'Deutsch || Kurdisch' format", () => {
    expect(parsePaste("Hallo. || سڵاو.\nJa || بەلێ || باشە", "").segments).toEqual([
      { de: "Hallo.", ku: "سڵاو." }, { de: "Ja", ku: "بەلێ || باشە" },
    ]);
  });
});

describe("generateQuestions", () => {
  const words = [w("Gemeinsam", "پێکڤە"), w("Der Nachtisch", "شرینی"), w("Das Öl", "روون"), w("Die Zutat", "پێکهاتە")];

  it("asks for the meaning, with the right answer among 4 different options", () => {
    const qs = generateQuestions(words, [], [], first);
    expect(qs).toHaveLength(4);
    const q = qs[0];
    expect(q.questionDe).toBe("Was bedeutet 'Gemeinsam'?");
    expect(q.questionKu).toBe("رامانا 'Gemeinsam' چییە؟");
    expect(q.options).toHaveLength(4);
    expect(new Set(q.options).size).toBe(4);
    expect(q.options[q.correctAnswer]).toBe("پێکڤە");
  });

  it("skips words that already have a question or have no meaning", () => {
    const existing = [{ questionDe: "Was bedeutet 'Gemeinsam'?", questionKu: "", options: [], correctAnswer: 0 }];
    const qs = generateQuestions([...words, w("Leer", "")], existing, [], first);
    expect(qs.map((q) => q.questionDe)).toEqual([
      "Was bedeutet 'Der Nachtisch'?", "Was bedeutet 'Das Öl'?", "Was bedeutet 'Die Zutat'?",
    ]);
  });

  it("fills wrong answers from the pool when the story has few words", () => {
    const [q] = generateQuestions([w("Haus", "خانی")], [], ["ئاڤ", "نان", "خانی"], first);
    expect([...q.options].sort()).toEqual(["ئاڤ", "خانی", "نان"].sort());
    expect(q.options[q.correctAnswer]).toBe("خانی");
  });

  it("skips a word when no wrong answer exists", () => {
    expect(generateQuestions([w("Haus", "خانی")], [], [], first)).toEqual([]);
  });
});

describe("moveItem", () => {
  it("moves an item", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
  });

  it("ignores moves past the ends", () => {
    const list = ["a", "b"];
    expect(moveItem(list, 0, -1)).toBe(list);
    expect(moveItem(list, 1, 2)).toBe(list);
  });
});

describe("slugId", () => {
  it("makes an id from the title", () => {
    expect(slugId("Kochen mit Freunden!", () => 0.5)).toBe("kochen-mit-freunden-i");
    expect(slugId("!!", () => 0.5)).toBe("item-i");
  });
});

describe("storyHealth", () => {
  it("counts sentences, missing translations, words and questions", () => {
    const b = { ...validBundle(), segments: [{ de: "A", ku: "ب" }, { de: "B", ku: " " }, { de: "", ku: "" }], words: [w("x", "y")] };
    expect(storyHealth(b)).toEqual({ sentences: 2, missingKu: 1, words: 1, questions: 0 });
  });
});
```

- [ ] Run: `npm test`
- [ ] Verify: it FAILS because `./storyBundle` cannot be resolved.

### Task 3: Implement the story bundle
Files: `src/data/storyBundle.js`
Interface: produces the exports listed in Task 2. `bundleToDocs(bundle, now)` returns `{ sets: [col, id, data][], deletes: [col, id][] }`.
Steps:
- [ ] Create the module:

```js file=src/data/storyBundle.js
// Story bundle: one story together with its word list and quiz. This is what the dashboard
// editor works on. Pure functions only (no Firebase), so they can be unit-tested;
// saving and deleting live in stories.js (saveBundle, deleteBundle).
//
// In Firestore a bundle is up to three documents linked by storyId:
//   stories/{id}, wordTopics/{wordTopicId ?? id}, quizzes/{quizId ?? id}

export const LEVEL_IDS = ["a1", "a2", "b1", "b2"];

// Story fields the editor handles; any other field of a story document is kept as it is ("extra")
const STORY_KEYS = ["id", "level", "order", "titleDe", "titleKu", "readTime", "coverImage", "segments"];
const str = (v) => (typeof v === "string" ? v : "");
const trim = (v) => str(v).trim();

// Document id from a title: "Kochen mit Freunden" -> "kochen-mit-freunden-x7k2"
export const slugId = (title, rand = Math.random) =>
  `${trim(title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item"}-${rand().toString(36).slice(2, 6)}`;

export const emptyBundle = () => ({
  id: null, level: "a1", order: undefined, extra: {},
  titleDe: "", titleKu: "", readTime: "", coverImage: "",
  segments: [], words: [], questions: [],
  wordTopicId: null, wordTopicOrder: undefined, quizId: null, quizOrder: undefined,
});

// All items of a collection as one list, each with its level
const allOf = (content, col) => LEVEL_IDS.flatMap((l) => (content?.[col]?.[l] || []).map((x) => ({ ...x, level: l })));

// The linked document the editor edits (the one with the story's id, else the first) and how many others exist
function pickLinked(list, storyId) {
  const mine = list.filter((x) => x.storyId === storyId);
  const main = mine.find((x) => x.id === storyId) || mine[0] || null;
  return { main, others: Math.max(0, mine.length - 1) };
}

// Builds the bundle for a story from the content store (getContent() shape).
// Returns { bundle, otherWordTopics, otherQuizzes }, or null if the story doesn't exist.
export function loadBundle(content, storyId) {
  const story = allOf(content, "stories").find((s) => s.id === storyId);
  if (!story) return null;
  const topic = pickLinked(allOf(content, "wordTopics"), storyId);
  const quiz = pickLinked(allOf(content, "quizzes"), storyId);
  return {
    bundle: {
      id: story.id,
      level: story.level,
      order: story.order,
      extra: Object.fromEntries(Object.entries(story).filter(([k]) => !STORY_KEYS.includes(k))),
      titleDe: str(story.titleDe),
      titleKu: str(story.titleKu),
      readTime: str(story.readTime),
      coverImage: str(story.coverImage),
      segments: (story.segments || []).map((x) => ({ de: str(x.de), ku: str(x.ku) })),
      words: (topic.main?.words || []).map((x) => ({
        wordDe: str(x.wordDe), wordKu: str(x.wordKu), sentenceDe: str(x.sentenceDe), sentenceKu: str(x.sentenceKu),
      })),
      questions: (quiz.main?.questions || []).map((q) => ({
        questionDe: str(q.questionDe),
        questionKu: str(q.questionKu),
        options: (q.options || []).map(str),
        correctAnswer: Number.isInteger(q.correctAnswer) ? q.correctAnswer : 0,
      })),
      wordTopicId: topic.main?.id ?? null,
      wordTopicOrder: topic.main?.order,
      quizId: quiz.main?.id ?? null,
      quizOrder: quiz.main?.order,
    },
    otherWordTopics: topic.others,
    otherQuizzes: quiz.others,
  };
}

// Trimmed copy without empty rows. Empty answers are dropped and correctAnswer follows its answer
// (-1 if the marked answer was empty).
export function cleanBundle(b) {
  return {
    ...b,
    titleDe: trim(b.titleDe),
    titleKu: trim(b.titleKu),
    readTime: trim(b.readTime),
    coverImage: trim(b.coverImage),
    segments: b.segments.map((x) => ({ de: trim(x.de), ku: trim(x.ku) })).filter((x) => x.de || x.ku),
    words: b.words
      .map((x) => ({ wordDe: trim(x.wordDe), wordKu: trim(x.wordKu), sentenceDe: trim(x.sentenceDe), sentenceKu: trim(x.sentenceKu) }))
      .filter((x) => x.wordDe || x.wordKu || x.sentenceDe || x.sentenceKu),
    questions: b.questions
      .map((q) => {
        const kept = q.options.map((text, i) => ({ text: trim(text), i })).filter((o) => o.text);
        return {
          questionDe: trim(q.questionDe),
          questionKu: trim(q.questionKu),
          options: kept.map((o) => o.text),
          correctAnswer: kept.findIndex((o) => o.i === q.correctAnswer),
        };
      })
      .filter((q) => q.questionDe || q.questionKu || q.options.length),
  };
}

// Problems that block saving, as { code, n? } (n = 1-based row number after cleaning). The UI turns codes into text.
export function validateBundle(b) {
  const c = cleanBundle(b);
  const errors = [];
  if (!c.titleDe) errors.push({ code: "titleDe" });
  if (!c.coverImage) errors.push({ code: "cover" });
  if (!c.segments.some((x) => x.de)) errors.push({ code: "segments" });
  else c.segments.forEach((x, i) => !x.de && errors.push({ code: "segmentDe", n: i + 1 }));
  c.words.forEach((x, i) => (!x.wordDe || !x.wordKu) && errors.push({ code: "word", n: i + 1 }));
  c.questions.forEach((q, i) => {
    if (!q.questionDe) errors.push({ code: "questionText", n: i + 1 });
    if (q.options.length < 2) errors.push({ code: "questionOptions", n: i + 1 });
    else if (q.correctAnswer < 0) errors.push({ code: "questionCorrect", n: i + 1 });
  });
  return errors;
}

// The Firestore writes for a bundle (it must have an id): sets [collection, id, data], deletes [collection, id].
// Level and titles are copied to the word list and quiz; an empty word list or quiz deletes its document.
// "now" is the order for documents that have none yet.
export function bundleToDocs(b, now) {
  const c = cleanBundle(b);
  const head = { level: c.level, titleDe: c.titleDe, titleKu: c.titleKu };
  const topicId = c.wordTopicId ?? c.id;
  const quizId = c.quizId ?? c.id;
  const sets = [["stories", c.id, {
    ...c.extra, ...head, order: c.order ?? now, readTime: c.readTime, coverImage: c.coverImage, segments: c.segments,
  }]];
  const deletes = [];
  if (c.words.length) sets.push(["wordTopics", topicId, { ...head, order: c.wordTopicOrder ?? now, storyId: c.id, words: c.words }]);
  else deletes.push(["wordTopics", topicId]);
  if (c.questions.length) sets.push(["quizzes", quizId, { ...head, order: c.quizOrder ?? now, storyId: c.id, questions: c.questions }]);
  else deletes.push(["quizzes", quizId]);
  return { sets, deletes };
}

// Numbers for the library card chips
export const storyHealth = (b) => ({
  sentences: b.segments.filter((x) => trim(x.de)).length,
  missingKu: b.segments.filter((x) => trim(x.de) && !trim(x.ku)).length,
  words: b.words.length,
  questions: b.questions.length,
});

// Copy of the list with the item at "from" moved to "to"; a "to" past either end returns the list unchanged
export function moveItem(list, from, to) {
  if (to < 0 || to >= list.length) return list;
  const out = [...list];
  out.splice(to, 0, out.splice(from, 1)[0]);
  return out;
}

// Pasted sentences: German lines and Kurdish lines, paired by line (blank lines skipped).
// If every German line contains "||", the old one-box format "Deutsch || Kurdisch" is used instead.
// unmatched = indexes of rows where one side is missing.
export function parsePaste(deText, kuText) {
  const lines = (t) => str(t).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const de = lines(deText);
  let segments;
  let kuCount;
  if (de.length && de.every((l) => l.includes("||"))) {
    segments = de.map((l) => {
      const [d, ...rest] = l.split("||");
      return { de: d.trim(), ku: rest.join("||").trim() };
    });
    kuCount = segments.filter((x) => x.ku).length;
  } else {
    const ku = lines(kuText);
    segments = Array.from({ length: Math.max(de.length, ku.length) }, (_, i) => ({ de: de[i] || "", ku: ku[i] || "" }));
    kuCount = ku.length;
  }
  const unmatched = segments.flatMap((x, i) => (x.de && x.ku ? [] : [i]));
  return { segments, deCount: de.length, kuCount, unmatched };
}

const shuffle = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// "What does X mean?" questions for words that have a meaning and no question yet.
// Wrong answers: other meanings from this story first, then from "pool" (meanings from other stories);
// up to 3, and a word is skipped if there is none.
export function generateQuestions(words, existing, pool = [], rng = Math.random) {
  let asked = existing.map((q) => q.questionDe).join("\n");
  const own = [...new Set(words.map((x) => trim(x.wordKu)).filter(Boolean))];
  const more = [...new Set(pool.map(trim).filter((m) => m && !own.includes(m)))];
  const out = [];
  for (const x of words) {
    const de = trim(x.wordDe);
    const ku = trim(x.wordKu);
    if (!de || !ku || asked.includes(`'${de}'`)) continue;
    const wrong = [...shuffle(own.filter((m) => m !== ku), rng), ...shuffle(more.filter((m) => m !== ku), rng)].slice(0, 3);
    if (!wrong.length) continue;
    const options = shuffle([ku, ...wrong], rng);
    out.push({ questionDe: `Was bedeutet '${de}'?`, questionKu: `رامانا '${de}' چییە؟`, options, correctAnswer: options.indexOf(ku) });
    asked += `\n'${de}'`;
  }
  return out;
}
```

- [ ] Run: `npm test`
- [ ] Verify: every test in `storyBundle.test.js` passes.

### Task 4: Save and delete a bundle in Firestore
Files: `src/data/stories.js`
Interface: produces `saveBundle(bundle): Promise<void>` (the bundle must have an id) and `deleteBundle(storyId): Promise<void>`.
Steps:
- [ ] Add `import { bundleToDocs } from "./storyBundle";` after the `../lib/firebase` import.
- [ ] Add this after `export const removeItem = ...`:

```js
// One story with its word list and quiz (see storyBundle.js), written in a single batch
export async function saveBundle(bundle) {
  const { sets, deletes } = bundleToDocs(bundle, Date.now());
  const batch = writeBatch(db);
  sets.forEach(([col, id, data]) => batch.set(doc(db, col, id), data));
  deletes.forEach(([col, id]) => batch.delete(doc(db, col, id)));
  await batch.commit();
}

// Deletes a story together with every word list and quiz linked to it
export async function deleteBundle(storyId) {
  const batch = writeBatch(db);
  batch.delete(doc(db, "stories", storyId));
  for (const col of ["wordTopics", "quizzes"]) {
    LEVEL_IDS.forEach((l) => state.content[col][l].filter((x) => x.storyId === storyId).forEach((x) => batch.delete(doc(db, col, x.id))));
  }
  await batch.commit();
}
```

- [ ] Run: `npm run lint`
- [ ] Verify: only the 4 known errors.

### Task 5: Shared dashboard helpers
Files: `src/pages/dashboard/bi.js`, `src/pages/dashboard/ui.jsx`
Interface: `useBi()` returns `bi(de, ku)`. The message objects are `{ ok, de, ku }`. `ui.jsx` exports components only, which keeps `react-refresh/only-export-components` quiet.
Steps:
- [ ] Create:

```js file=src/pages/dashboard/bi.js
// Dashboard texts are German + Kurdish (Badini, Arabic script) pairs. No English.
// bi(de, ku) = the text in the app language (the DE/KU switch). Texts defined outside components
// are [de, ku] pairs: bi(...PAIR).
import { useLang } from "../../context/LangContext";

export const useBi = () => {
  const { lang } = useLang();
  return (de, ku) => (lang === "de" ? de : ku);
};

export const OPT = ["(optional)", "(ڤەبژارتی)"];
// Messages for <Msg>: { ok, text } or { ok, de, ku }
export const SAVE_FAIL = { ok: false, de: "Speichern fehlgeschlagen. Prüfe die Internetverbindung.", ku: "پاراستن سەرنەکەفت. پەیوەندیا ئینتەرنێتێ بپشکنە." };
export const WAIT = { ok: true, de: "Bitte warten…", ku: "تکایە چاڤەڕێ بکە…" };
export const UPLOAD_FAIL = { ok: false, de: "Hochladen fehlgeschlagen. Bitte erneut versuchen.", ku: "بارکرنا وێنەی سەرنەکەفت. دیسا هەول بدە." };
export const NOT_IMAGE = { ok: false, de: "Bitte wähle eine Bilddatei.", ku: "تکایە فایلەکێ وێنە هەلبژێرە." };
```

```jsx file=src/pages/dashboard/ui.jsx
// Small building blocks shared by the dashboard sections
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useBi } from "./bi";

// Long texts / JSX in the app language
export const Bi = ({ de, ku }) => useBi()(de, ku);

export function Field({ label, hint, children }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      {hint && <span className="ms-2 font-normal text-faint">{hint}</span>}
      {children}
    </label>
  );
}

// A card section; "id" makes it a jump target, "aside" sits next to the title (e.g. a button)
export function Box({ id, title, aside, active, children }) {
  return (
    <section id={id} className="glass mb-6 scroll-mt-6 rounded-2xl p-4 sm:p-6" style={active ? { borderColor: "var(--brand)" } : undefined}>
      {(title || aside) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{title}</h2>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Row({ title, sub, badge, onEdit, onDelete }) {
  const bi = useBi();
  return (
    <div className="flex items-center gap-2 border-b border-line py-3 last:border-b-0 sm:gap-3">
      {badge}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold" dir="auto">{title}</p>
        {sub && <p className="truncate text-sm text-muted" dir="auto">{sub}</p>}
      </div>
      {onEdit && (
        <button onClick={onEdit} className="btn-mini inline-flex items-center gap-1 text-sm" aria-label={`${bi("Bearbeiten", "دەستکاریکرن")} ${title}`}>
          <Pencil size={15} /><span className="hidden md:inline">{bi("Bearbeiten", "دەستکاریکرن")}</span>
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className="btn-danger inline-flex items-center gap-1 text-sm" aria-label={`${bi("Löschen", "سڕین")} ${title}`}>
          <Trash2 size={15} /><span className="hidden md:inline">{bi("Löschen", "سڕین")}</span>
        </button>
      )}
    </div>
  );
}

export function Msg({ m }) {
  const bi = useBi();
  if (!m) return null;
  return <p role="status" className="mt-3 text-sm font-medium" style={{ color: m.ok ? "var(--ok)" : "var(--bad)" }}>{m.text ?? bi(m.de, m.ku)}</p>;
}

export function SubmitRow({ editing, label, onCancel, busy }) {
  const bi = useBi();
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <button disabled={busy} className="btn-primary inline-flex items-center gap-2 px-6 py-3">
        {editing ? <Pencil size={17} /> : <Plus size={18} />}
        {editing ? bi("Änderungen speichern", "گوهۆڕینان بپارێزە") : label}
      </button>
      {editing && <button type="button" onClick={onCancel} className="btn-ghost px-5 py-3">{bi("Abbrechen", "هەلوەشاندن")}</button>}
    </div>
  );
}

export function SearchBox({ value, onChange }) {
  const bi = useBi();
  return (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-faint" />
      <input className="field !mt-0 !ps-9" placeholder={bi("Suchen…", "گەڕیان…")} value={value} onChange={(e) => onChange(e.target.value)} aria-label={bi("Suchen", "گەڕیان")} />
    </div>
  );
}
```

- [ ] Run: `npm run lint`
- [ ] Verify: only the 4 known errors.

### Task 6: Students and settings pages (moved code)
Files: `src/pages/dashboard/StudentsPage.jsx`, `src/pages/dashboard/SettingsPage.jsx`
Interface: `StudentsPage` reads `students` from `useOutletContext()`. `SettingsPage` has no props.
Steps:
- [ ] Create (the code is the old StudentsTab and the old SetupBox, OverviewTab announcement and BackupTab, with the same behaviour):

```jsx file=src/pages/dashboard/StudentsPage.jsx
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { levels } from "../../data/levels";
import { createStudent, deleteStudent, updateStudent } from "../../data/students";
import { SAVE_FAIL, WAIT, useBi } from "./bi";
import { Box, Field, Msg, Row, SearchBox, SubmitRow } from "./ui";

// Schüler: create login codes, edit name / class / level, delete (revokes access)
const emptyStu = { name: "", className: "", level: "A1" };

export default function StudentsPage() {
  const bi = useBi();
  const { students } = useOutletContext();
  const [f, setF] = useState(emptyStu);
  const [edit, setEdit] = useState(null); // uid of the student being edited
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const item = { name: f.name.trim(), className: f.className.trim(), level: f.level };
    setBusy(true); setMsg(WAIT);
    try {
      if (edit) {
        await updateStudent(edit, item);
        setMsg({ ok: true, text: bi("Änderungen gespeichert ✓", "گوهۆڕین هاتنە پاراستن ✓") });
      } else {
        const code = await createStudent(item);
        setMsg({ ok: true, text: bi(`Schüler erstellt ✓ Anmeldecode: ${code}`, `قوتابی هاتە دروستکرن ✓ کۆدێ چوونەژوورێ: ${code}`) });
      }
      setEdit(null); setF(emptyStu);
    } catch (err) {
      console.error(err);
      setMsg(SAVE_FAIL);
    }
    setBusy(false);
  };
  const del = (uid) => {
    if (window.confirm(bi("Diesen Schüler löschen? Sein Anmeldecode funktioniert dann nicht mehr.", "ئەڤ قوتابیە بهێتە سڕین؟ کۆدێ چوونەژوورا وی ئێدی کار ناکەت."))) {
      deleteStudent(uid).catch(() => setMsg(SAVE_FAIL));
    }
  };
  const startEdit = (s) => {
    setEdit(s.uid); setF({ name: s.name, className: s.className, level: s.level }); setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const match = (s) => `${s.name} ${s.code} ${s.className}`.toLowerCase().includes(q.trim().toLowerCase());

  return (
    <>
      <Box title={edit ? bi("Schüler bearbeiten", "دەستکاریکرنا قوتابی") : bi("Schüler hinzufügen", "زێدەکرنا قوتابی")} active={!!edit}>
        <form onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={bi("Name", "ناڤ")}><input required className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label={bi("Klasse", "پۆل")}><input className="field" value={f.className} onChange={(e) => setF({ ...f, className: e.target.value })} /></Field>
            <Field label={bi("Niveau", "ئاست")}>
              <select className="field" value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}>{levels.map((l) => <option key={l.id}>{l.title}</option>)}</select>
            </Field>
          </div>
          <SubmitRow editing={!!edit} busy={busy} label={bi("Anmeldecode erstellen", "کۆدێ چوونەژوورێ دروست بکە")} onCancel={() => { setEdit(null); setF(emptyStu); setMsg(null); }} />
          <Msg m={msg} />
        </form>
      </Box>
      <Box title={bi(`Schüler und Anmeldecodes (${students.length})`, `قوتابی و کۆدێن چوونەژوورێ (${students.length})`)}>
        <div className="mb-3"><SearchBox value={q} onChange={setQ} /></div>
        {students.length === 0 && <p className="text-muted">{bi("Noch keine Schüler.", "هێشتا چ قوتابی نینن.")}</p>}
        {students.filter(match).map((s) => (
          <Row key={s.uid} title={s.name} sub={`${s.code} · ${s.className} · ${s.level}`} onEdit={() => startEdit(s)} onDelete={() => del(s.uid)} />
        ))}
      </Box>
    </>
  );
}
```

```jsx file=src/pages/dashboard/SettingsPage.jsx
import { useState } from "react";
import {
  addMissingBuiltIn, builtIn, clearLocalContent, getContent, normalizeContent, readLocalContent, replaceAllContent, saveItem,
} from "../../data/stories";
import { clearLocalStudents, createStudent, readLocalStudents } from "../../data/students";
import { getAnnouncement, setAnnouncement } from "../../data/settings";
import { toJpeg, uploadImage } from "../../services/upload";
import { IMAGES_URL } from "../../config";
import { SAVE_FAIL, WAIT, useBi } from "./bi";
import { Bi, Box, Msg } from "./ui";

// Einstellungen: announcement for students, one-time setup helpers, backup / import / reset
const flat = (col) => Object.entries(getContent()[col]).flatMap(([level, list]) => list.map((x) => ({ ...x, level })));

// Runs fn and shows WAIT, then okText or SAVE_FAIL
const useRun = (setMsg) => async (fn, okText) => {
  setMsg(WAIT);
  try { await fn(); setMsg({ ok: true, text: okText }); } catch (err) { console.error(err); setMsg(SAVE_FAIL); }
};

// One-time helpers: empty database, and data that was saved in this browser before Firebase
function SetupBox() {
  const bi = useBi();
  const c = getContent();
  const [localContent, setLocalContent] = useState(readLocalContent);
  const [localStudents, setLocalStudents] = useState(readLocalStudents);
  const [msg, setMsg] = useState(null);
  const run = useRun(setMsg);
  const isEmpty = ["stories", "wordTopics", "quizzes"].every((col) => Object.values(c[col]).flat().length === 0);
  if (!isEmpty && !localContent && localStudents.length === 0 && !msg) return null;

  const loadBuiltIn = () => run(() => replaceAllContent(builtIn()), bi("Eingebauter Inhalt geladen ✓", "ناڤەڕۆکا ئامادەکراو هاتە بارکرن ✓"));
  const uploadContent = () => {
    if (!window.confirm(bi("Den Inhalt der Datenbank durch den Inhalt aus diesem Browser ersetzen?", "ناڤەڕۆکا داتابەیسێ ب ناڤەڕۆکا ڤی براوسەری بگوهۆڕی؟"))) return;
    run(async () => { await replaceAllContent(localContent); clearLocalContent(); setLocalContent(null); },
      bi("Inhalt hochgeladen ✓", "ناڤەڕۆک هاتە بارکرن ✓"));
  };
  const uploadStudents = () =>
    run(async () => {
      for (const s of localStudents) {
        try {
          await createStudent({ name: s.name, className: s.className || "", level: s.level || "A1" }, s.code);
        } catch (err) {
          if (err.code !== "auth/email-already-in-use") throw err; // already moved
        }
      }
      clearLocalStudents(); setLocalStudents([]);
    }, bi("Schüler übertragen ✓ Ihre alten Codes funktionieren weiter.", "قوتابی هاتنە ڤەگوهاستن ✓ کۆدێن وان یێن کەڤن کار دکەن."));

  return (
    <Box title={bi("Einrichtung", "ئامادەکرن")} active>
      <div className="space-y-4">
        {isEmpty && (
          <div>
            <p className="mb-2 text-sm text-muted"><Bi de="Die Datenbank ist noch leer." ku="داتابەیس هێشتا ڤالایە." /></p>
            <button onClick={loadBuiltIn} className="btn-primary px-5 py-3">{bi("Eingebauten Inhalt laden", "ناڤەڕۆکا ئامادەکراو بار بکە")}</button>
          </div>
        )}
        {localContent && (
          <div>
            <p className="mb-2 text-sm text-muted">
              <Bi de="In diesem Browser wurde Inhalt aus der Zeit vor der Datenbank gefunden." ku="د ڤی براوسەری دا ناڤەڕۆکەک ژ بەری داتابەیسێ هاتە دیتن." />
            </p>
            <button onClick={uploadContent} className="btn-primary px-5 py-3">{bi("Inhalt in die Datenbank hochladen", "ناڤەڕۆکێ بۆ داتابەیسێ بار بکە")}</button>
          </div>
        )}
        {localStudents.length > 0 && (
          <div>
            <p className="mb-2 text-sm text-muted">
              <Bi de={`${localStudents.length} Schüler aus diesem Browser gefunden.`} ku={`${localStudents.length} قوتابی د ڤی براوسەری دا هاتنە دیتن.`} />
            </p>
            <button onClick={uploadStudents} className="btn-primary px-5 py-3">{bi("Schüler übertragen", "قوتابیان ڤەگوهێزە")}</button>
          </div>
        )}
        <Msg m={msg} />
      </div>
    </Box>
  );
}

function AnnouncementBox() {
  const bi = useBi();
  const [note, setNote] = useState(getAnnouncement());
  const [msg, setMsg] = useState(null);
  const saveNote = async () => {
    try { await setAnnouncement(note); } catch { return setMsg(SAVE_FAIL); }
    setMsg({
      ok: true,
      text: note.trim()
        ? bi("Die Ankündigung wird jetzt auf der Startseite der Schüler angezeigt ✓", "ڕاگەهاندن ئێستا ل رووپەلێ سەرەکی یێ قوتابیان دیار دبیت ✓")
        : bi("Ankündigung entfernt ✓", "ڕاگەهاندن هاتە سڕین ✓"),
    });
  };
  return (
    <Box title={bi("Ankündigung für die Schüler", "ڕاگەهاندن بۆ قوتابیان")}>
      <p className="mb-2 text-sm text-muted">
        <Bi
          de="Wird oben auf der Startseite der Schüler gezeigt. Leer lassen, um sie zu verstecken."
          ku="ل سەرویێ رووپەلێ سەرەکی یێ قوتابیان دیار دبیت. ڤالا بهێلە دا بهێتە ڤەشارتن."
        />
      </p>
      <textarea
        className="field" rows={2} dir="auto" value={note} onChange={(e) => setNote(e.target.value)}
        placeholder={bi("Beispiel: Freitag ist Quiz! Bitte lernt das Thema „Essen und Trinken“.", "نمونە: ئەینی کویزە! تکایە بابەتێ «Essen und Trinken» بخوێنن.")}
      />
      <button onClick={saveNote} className="btn-primary mt-4 px-6 py-3">{bi("Ankündigung speichern", "ڕاگەهاندنێ بپارێزە")}</button>
      <Msg m={msg} />
    </Box>
  );
}

function BackupBox() {
  const bi = useBi();
  const [msg, setMsg] = useState(null);
  const run = useRun(setMsg);
  const exportFile = () => {
    const blob = new Blob([JSON.stringify(getContent(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "lingua-content.json"; a.click();
    URL.revokeObjectURL(a.href);
  };
  const importFile = async (e) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    let data;
    try {
      data = normalizeContent(JSON.parse(await file.text()));
    } catch {
      return setMsg({ ok: false, text: bi("Diese Datei ist keine gültige Inhalts-Sicherung.", "ئەڤ فایلە پاشەکەوتەکا دروست نینە.") });
    }
    if (!window.confirm(bi("Den gesamten Inhalt für alle Schüler durch diese Datei ersetzen?", "هەمی ناڤەڕۆکێ بۆ هەمی قوتابیان ب ڤی فایلی بگوهۆڕی؟"))) return;
    run(() => replaceAllContent(data), bi("Inhalt importiert ✓", "ناڤەڕۆک هاتە هاوردن ✓"));
  };
  // Every story cover that isn't in the R2 bucket yet: built-in stories get their bucket cover from the code,
  // other stories get their picture downloaded, shrunk and uploaded. Nothing else in the story changes.
  const moveCovers = async () => {
    setMsg(WAIT);
    const fromCode = Object.fromEntries(Object.values(builtIn().stories).flat().map((s) => [s.id, s.coverImage]));
    let moved = 0, failed = 0;
    for (const s of flat("stories")) {
      if (!s.coverImage || s.coverImage.startsWith(IMAGES_URL)) continue;
      try {
        let url = fromCode[s.id]?.startsWith(IMAGES_URL) ? fromCode[s.id] : null;
        if (!url) {
          const res = await fetch(s.coverImage);
          if (!res.ok) throw new Error(`download ${res.status}`);
          url = await uploadImage("cover", await toJpeg(await res.blob(), { size: 1600 }));
        }
        await saveItem("stories", { ...s, coverImage: url });
        moved++;
      } catch (err) {
        console.error(`Cover of "${s.id}":`, err);
        failed++;
      }
    }
    setMsg(failed
      ? { ok: false, text: bi(`${moved} Titelbilder verschoben, ${failed} fehlgeschlagen. Lade diese in „Geschichten“ neu hoch.`, `${moved} وێنەیێن بەرگی هاتنە ڤەگوهاستن، ${failed} سەرنەکەفتن. وان د «چیرۆک» دا دووبارە بار بکە.`) }
      : { ok: true, text: moved ? bi(`${moved} Titelbilder in den Speicher verschoben ✓`, `${moved} وێنەیێن بەرگی هاتنە ڤەگوهاستن ✓`) : bi("Alle Titelbilder sind schon im Speicher ✓", "هەمی وێنەیێن بەرگی یێ ل جهێ خۆ نە ✓") });
  };
  // Safe: only writes built-in items that aren't in the database yet, deletes nothing
  const addMissing = async () => {
    setMsg(WAIT);
    try {
      const n = await addMissingBuiltIn();
      setMsg({ ok: true, text: n ? bi(`${n} neue Einträge hinzugefügt ✓`, `${n} تشتێن نوو هاتنە زێدەکرن ✓`) : bi("Alles ist schon da ✓", "هەمی تشت یێ هەیە ✓") });
    } catch (err) {
      console.error(err);
      setMsg(SAVE_FAIL);
    }
  };
  const reset = () => {
    if (window.confirm(bi("Alles entfernen, was du hinzugefügt hast, und zum eingebauten Inhalt zurückgehen?", "هەمی ئەوێ تە زێدە کری بسڕی و بزڤڕی بۆ ناڤەڕۆکا ئامادەکراو؟"))) {
      run(() => replaceAllContent(builtIn()), bi("Inhalt zurückgesetzt ✓", "ناڤەڕۆک زڤڕیە ✓"));
    }
  };
  return (
    <Box title={bi("Sicherung", "پاشەکەوت")}>
      <p className="mb-4 rounded-xl bg-soft p-4 text-sm text-muted">
        <Bi
          de={<>Alle Inhalte werden in der Datenbank gespeichert, und alle Schüler sehen Änderungen sofort. Mit „Exportieren“ machst du eine Sicherungskopie. <b className="text-fg">„Importieren“ und „Zurücksetzen“ ersetzen den gesamten Inhalt für alle Schüler.</b></>}
          ku={<>هەمی ناڤەڕۆک د داتابەیسێ دا دهێتە پاراستن، و هەمی قوتابی گوهۆڕینان دەستبەجێ دبینن. ب «هەناردەکرن» کۆپیەکا پاشەکەوتێ وەرگرە. <b className="text-fg">«هاوردن» و «زڤڕاندن» هەمی ناڤەڕۆکێ بۆ هەمی قوتابیان دگوهۆڕن.</b></>}
        />
      </p>
      <div className="flex flex-wrap gap-3">
        <button onClick={exportFile} className="btn-primary px-5 py-3">{bi("Inhalt exportieren", "ناڤەڕۆکێ هەناردە بکە")}</button>
        <label className="btn-ghost inline-flex cursor-pointer items-center px-5 py-3">
          {bi("Inhalt importieren", "ناڤەڕۆکێ هاوردە بکە")}<input type="file" accept="application/json" onChange={importFile} className="sr-only" />
        </label>
        <button onClick={addMissing} className="btn-ghost px-5 py-3">{bi("Neue eingebaute Inhalte hinzufügen", "ناڤەڕۆکا ئامادەکراو یا نوو زێدە بکە")}</button>
        <button onClick={moveCovers} className="btn-ghost px-5 py-3">{bi("Titelbilder in den Speicher verschieben", "وێنەیێن بەرگی ڤەگوهێزە بۆ جهێ پاراستنێ")}</button>
        <button onClick={reset} className="btn-danger px-5 py-3">{bi("Auf Standard zurücksetzen", "بزڤڕە بۆ ئامادەکراو")}</button>
      </div>
      <Msg m={msg} />
    </Box>
  );
}

export default function SettingsPage() {
  return (
    <>
      <SetupBox />
      <AnnouncementBox />
      <BackupBox />
    </>
  );
}
```

- [ ] Run: `npm run lint`
- [ ] Verify: only the 4 known errors.

### Task 7: Library
Files: `src/pages/dashboard/LibraryCard.jsx`, `src/pages/dashboard/LibraryPage.jsx`
Interface: `LibraryCard({ story, health })`, where `health` is the result of `storyHealth(bundle)`. `LibraryPage` reads `useContent()`.
Steps:
- [ ] Create:

```jsx file=src/pages/dashboard/LibraryCard.jsx
import { Link } from "react-router-dom";
import LevelBadge from "../../components/LevelBadge";
import { getLevel } from "../../data/levels";
import { useBi } from "./bi";

// Green = there, orange = missing (text stays in the normal text colour for contrast)
function Chip({ ok, children }) {
  return (
    <span
      className="rounded-md px-2 py-0.5 text-xs font-semibold"
      style={ok ? { background: "var(--okbg)", color: "var(--ok)" } : { background: "color-mix(in srgb, #fb923c 18%, transparent)", color: "var(--fg)" }}
    >
      {children}
    </span>
  );
}

// One story in the library: cover, level, titles, and chips that show what is there and what is missing
export default function LibraryCard({ story, health }) {
  const bi = useBi();
  const level = getLevel(story.level);
  const { sentences, missingKu, words, questions } = health;
  return (
    <Link to={`stories/${story.id}`} className="glass flex flex-col overflow-hidden rounded-2xl transition hover:border-brand">
      {story.coverImage
        ? <img src={story.coverImage} alt="" loading="lazy" className="h-28 w-full object-cover" />
        : <span aria-hidden="true" className="h-28" style={{ background: `color-mix(in srgb, ${level.color} 18%, var(--card))` }} />}
      <span className="flex flex-1 flex-col gap-1.5 p-3.5">
        <LevelBadge level={level} />
        <span className="font-bold leading-snug" lang="de" dir="ltr">{story.titleDe}</span>
        {story.titleKu && <span lang="ku" dir="rtl" className="text-sm text-muted">{story.titleKu}</span>}
        <span className="mt-auto flex flex-wrap gap-1.5 pt-1">
          <Chip ok={sentences > 0}>{sentences > 0 ? bi(`✓ ${sentences} Sätze`, `✓ ${sentences} رستە`) : bi("Keine Sätze", "چ رستە نینن")}</Chip>
          {missingKu > 0 && <Chip>{bi(`${missingKu} ohne Übersetzung`, `${missingKu} بێ وەرگێڕان`)}</Chip>}{/* KU: review */}
          <Chip ok={words > 0}>{words > 0 ? bi(`✓ ${words} Wörter`, `✓ ${words} وشە`) : bi("Wörter fehlen", "وشە نینن")}</Chip>{/* KU: review */}
          <Chip ok={questions > 0}>{questions > 0 ? bi(`✓ ${questions} Fragen`, `✓ ${questions} پرسیار`) : bi("Quiz fehlt", "کویز نینە")}</Chip>{/* KU: review */}
        </span>
      </span>
    </Link>
  );
}
```

```jsx file=src/pages/dashboard/LibraryPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { levels } from "../../data/levels";
import { useContent } from "../../data/stories";
import { LEVEL_IDS, loadBundle, storyHealth } from "../../data/storyBundle";
import { useBi } from "./bi";
import { SearchBox } from "./ui";
import LibraryCard from "./LibraryCard";

// Geschichten: every story as a card (cover, level, what is missing); filter by level, search by title
export default function LibraryPage() {
  const bi = useBi();
  const { content } = useContent();
  const [level, setLevel] = useState("all");
  const [q, setQ] = useState("");
  const stories = LEVEL_IDS.flatMap((l) => content.stories[l].map((s) => ({ ...s, level: l })));
  const query = q.trim().toLowerCase();
  const shown = stories.filter((s) => (level === "all" || s.level === level) && `${s.titleDe} ${s.titleKu || ""}`.toLowerCase().includes(query));
  const filters = [["all", bi("Alle", "هەمی"), stories.length], ...levels.map((l) => [l.id, l.title, content.stories[l.id].length])];

  return (
    <>
      {stories.length === 0 && (
        <div className="glass mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
          <p className="text-sm text-muted">{bi("Die Datenbank ist noch leer.", "داتابەیس هێشتا ڤالایە.")}</p>
          <Link to="/dashboard/settings" className="btn-primary inline-flex items-center px-5">{bi("Eingebauten Inhalt laden", "ناڤەڕۆکا ئامادەکراو بار بکە")}</Link>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div role="group" aria-label={bi("Niveau", "ئاست")} className="flex flex-wrap gap-2">
          {filters.map(([id, label, n]) => (
            <button
              key={id} type="button" aria-pressed={level === id} onClick={() => setLevel(id)}
              className={`min-h-10 rounded-full border px-4 text-sm font-bold ${level === id ? "border-brand bg-soft" : "border-line"}`}
            >
              {label} · {n}
            </button>
          ))}
        </div>
        <div className="min-w-56 flex-1"><SearchBox value={q} onChange={setQ} /></div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-4">
        <Link to="stories/new" className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line font-bold text-link hover:border-brand">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-soft"><Plus size={24} /></span>
          {bi("Neue Geschichte", "چیرۆکا نوو")}
        </Link>
        {shown.map((s) => <LibraryCard key={s.id} story={s} health={storyHealth(loadBundle(content, s.id).bundle)} />)}
      </div>
      {shown.length === 0 && stories.length > 0 && <p className="mt-6 text-muted">{bi("Keine Geschichten gefunden.", "چ چیرۆکەک نەهاتە دیتن.")}</p>}
    </>
  );
}
```

- [ ] Run: `npm run lint`
- [ ] Verify: only the 4 known errors.

### Task 8: Editor sections
Files: `src/pages/dashboard/editor/JumpNav.jsx`, `DetailsSection.jsx`, `SentencesSection.jsx`, `BulkPaste.jsx`, `WordsSection.jsx`, `QuizSection.jsx`, `SaveBar.jsx`
Interface:
- `JumpNav({ counts: { sentences, words, questions } })`
- `DetailsSection({ bundle, update(patch) })`
- `SentencesSection({ segments, onChange(segments) })`
- `BulkPaste({ hasSentences, onDone(rows, replace), onCancel })`
- `WordsSection({ words, onChange(words) })`
- `QuizSection({ questions, words, pool: string[], onChange(questions) })`
- `SaveBar({ dirty, busy, msg, onSave, onDiscard })`

None of these talk to Firestore.

Steps:
- [ ] Create:

```jsx file=src/pages/dashboard/editor/JumpNav.jsx
import { useBi } from "../bi";

// Links to the editor sections. A row on small screens, a column next to the sections on wide ones.
export default function JumpNav({ counts }) {
  const bi = useBi();
  const items = [
    ["details", bi("Details", "وردەکاری"), ""],
    ["sentences", bi("Sätze", "رستە"), counts.sentences],
    ["words", bi("Wörter", "وشە"), counts.words],
    ["quiz", bi("Quiz", "کویز"), counts.questions],
  ];
  return (
    <nav aria-label={bi("Abschnitte", "بەش")} className="glass flex flex-[1_1_11rem] flex-row flex-wrap gap-1 rounded-2xl p-2 lg:max-w-56 lg:flex-col">{/* KU: review */}
      {items.map(([id, label, n]) => (
        <a key={id} href={`#${id}`} className="flex min-h-11 flex-1 items-center justify-between gap-3 rounded-xl px-3 font-semibold hover:bg-soft lg:flex-none">
          <span>{label}</span>
          <span className="text-xs font-bold text-link">{n}</span>
        </a>
      ))}
    </nav>
  );
}
```

```jsx file=src/pages/dashboard/editor/DetailsSection.jsx
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { levels } from "../../../data/levels";
import { toJpeg, uploadImage } from "../../../services/upload";
import { NOT_IMAGE, OPT, UPLOAD_FAIL, WAIT, useBi } from "../bi";
import { Box, Field, Msg } from "../ui";

// Cover, titles, level and reading time
export default function DetailsSection({ bundle, update }) {
  const bi = useBi();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => update({ [k]: e.target.value });

  // Shrinks the picture and uploads it to R2; the story keeps only its URL
  const pickCover = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same file again
    if (!file) return;
    if (!file.type.startsWith("image/")) return setMsg(NOT_IMAGE);
    setUploading(true); setMsg(WAIT);
    try {
      update({ coverImage: await uploadImage("cover", await toJpeg(file, { size: 1600 })) });
      setMsg(null);
    } catch {
      setMsg(UPLOAD_FAIL);
    }
    setUploading(false);
  };

  return (
    <Box id="details" title={bi("Details", "وردەکاری")}>
      <div className="flex flex-wrap gap-5">
        <div className="flex flex-[0_1_13rem] flex-col gap-2">
          {bundle.coverImage
            ? <img src={bundle.coverImage} alt="" className="h-32 w-full rounded-xl border border-line object-cover" />
            : <span aria-hidden="true" className="h-32 rounded-xl border border-dashed border-line bg-soft" />}
          <button type="button" onClick={() => fileRef.current.click()} disabled={uploading} className="btn-ghost inline-flex items-center justify-center gap-2 px-4 text-sm font-semibold">
            <Upload size={16} />
            {bundle.coverImage ? bi("Anderes Bild hochladen", "وێنەیەکێ دی بار بکە") : bi("Bild hochladen", "وێنەی بار بکە")}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={pickCover} className="hidden" />
          <Msg m={msg} />
        </div>
        <div className="grid flex-[1_1_20rem] content-start gap-4 sm:grid-cols-2">
          <Field label={bi("Deutscher Titel", "ناڤونیشانێ ئەلمانی")}>
            <input className="field" lang="de" dir="ltr" value={bundle.titleDe} onChange={set("titleDe")} />
          </Field>
          <Field label={bi("Kurdischer Titel", "ناڤونیشانێ کوردی")}>
            <input className="field" lang="ku" dir="rtl" value={bundle.titleKu} onChange={set("titleKu")} />
          </Field>
          <fieldset>
            <legend className="text-sm font-semibold">{bi("Niveau", "ئاست")}</legend>
            <div className="mt-1 grid grid-cols-4 gap-2">
              {levels.map((l) => {
                const on = bundle.level === l.id;
                return (
                  <button
                    key={l.id} type="button" aria-pressed={on} onClick={() => update({ level: l.id })}
                    className={`min-h-11 rounded-xl border font-bold ${on ? "" : "border-line"}`}
                    style={on ? { borderColor: l.color, background: `color-mix(in srgb, ${l.color} 18%, transparent)` } : undefined}
                  >
                    {l.title}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <Field label={bi("Lesezeit", "دەمێ خوێندنێ")} hint={bi(...OPT)}>
            <input className="field" value={bundle.readTime} onChange={set("readTime")} placeholder="3 min" />
          </Field>
        </div>
      </div>
    </Box>
  );
}
```

```jsx file=src/pages/dashboard/editor/BulkPaste.jsx
import { useState } from "react";
import { parsePaste } from "../../../data/storyBundle";
import { useBi } from "../bi";

// Paste many sentences at once: German lines in one box, Kurdish lines in the other, paired by line.
// Lines in the old "Deutsch || Kurdisch" format also work in the German box.
export default function BulkPaste({ hasSentences, onDone, onCancel }) {
  const bi = useBi();
  const [de, setDe] = useState("");
  const [ku, setKu] = useState("");
  const r = parsePaste(de, ku);
  const n = r.segments.length;
  const replace = () => {
    if (window.confirm(bi("Alle vorhandenen Sätze ersetzen?", "هەمی رستێن هەین بگوهۆڕی؟"))) onDone(r.segments, true); // KU: review
  };

  return (
    <div className="mb-5 rounded-xl border border-dashed p-4" style={{ borderColor: "var(--brand)" }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          {bi(`Deutsch · ${r.deCount} Zeilen`, `ئەلمانی · ${r.deCount} رێز`)}{/* KU: review */}
          <textarea className="field" rows={7} lang="de" dir="ltr" value={de} onChange={(e) => setDe(e.target.value)} placeholder={"Hallo, wie geht es dir?\nMir geht es gut."} />
        </label>
        <label className="block text-sm font-semibold">
          {bi(`Kurdisch · ${r.kuCount} Zeilen`, `کوردی · ${r.kuCount} رێز`)}{/* KU: review */}
          <textarea className="field" rows={7} lang="ku" dir="rtl" value={ku} onChange={(e) => setKu(e.target.value)} placeholder={"سڵاو، تو چەوایی؟\nئەز باشم."} />
        </label>
      </div>
      {r.unmatched.length > 0 && (
        <p role="status" className="mt-3 text-sm font-medium" style={{ color: "var(--bad)" }}>
          {bi(`Diese Zeilen haben kein Gegenstück: ${r.unmatched.map((i) => i + 1).join(", ")}`, `ئەڤ رێزە بێ بەرامبەرن: ${r.unmatched.map((i) => i + 1).join("، ")}`)}{/* KU: review */}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" disabled={!n} onClick={() => onDone(r.segments, false)} className="btn-primary px-5">
          {bi(`${n} Sätze anhängen`, `${n} رستان زێدە بکە`)}{/* KU: review */}
        </button>
        {hasSentences && <button type="button" disabled={!n} onClick={replace} className="btn-ghost px-5">{bi("Alle Sätze ersetzen", "هەمی رستان بگوهۆڕە")}</button>}{/* KU: review */}
        <button type="button" onClick={onCancel} className="btn-ghost px-5">{bi("Abbrechen", "هەلوەشاندن")}</button>
      </div>
    </div>
  );
}
```

```jsx file=src/pages/dashboard/editor/SentencesSection.jsx
import { useState } from "react";
import { ArrowDown, ArrowUp, ClipboardPaste, Plus, Trash2 } from "lucide-react";
import { moveItem } from "../../../data/storyBundle";
import { useBi } from "../bi";
import { Box } from "../ui";
import BulkPaste from "./BulkPaste";

const ICON_BTN = "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line disabled:opacity-40";

// One row per sentence: the German sentence and its Kurdish translation, each in its own text direction
export default function SentencesSection({ segments, onChange }) {
  const bi = useBi();
  const [pasting, setPasting] = useState(false);
  const setRow = (i, k) => (e) => onChange(segments.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)));

  return (
    <Box
      id="sentences"
      title={`${bi("Sätze", "رستە")} (${segments.length})`}
      aside={
        <button type="button" onClick={() => setPasting((p) => !p)} aria-expanded={pasting} className="btn-ghost inline-flex items-center gap-2 px-4 text-sm font-semibold">
          <ClipboardPaste size={16} /> {bi("Viele Sätze einfügen", "گەلەک رستان بچەسپینە")}{/* KU: review */}
        </button>
      }
    >
      {pasting && (
        <BulkPaste
          hasSentences={segments.length > 0}
          onDone={(rows, replace) => { onChange(replace ? rows : [...segments, ...rows]); setPasting(false); }}
          onCancel={() => setPasting(false)}
        />
      )}
      <ol className="space-y-2">
        {segments.map((s, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2">
            <span className="w-6 text-center text-sm font-bold text-muted">{i + 1}</span>
            <input
              aria-label={bi(`Satz ${i + 1} Deutsch`, `رستە ${i + 1} ئەلمانی`)} placeholder={bi("Deutscher Satz", "رستەیا ئەلمانی")}
              className="field !mt-0 min-w-0 flex-[1_1_14rem]" lang="de" dir="ltr" value={s.de} onChange={setRow(i, "de")}
            />
            <input
              aria-label={bi(`Satz ${i + 1} Kurdisch`, `رستە ${i + 1} کوردی`)} placeholder={bi("Kurdische Übersetzung", "وەرگێڕانا کوردی")}
              className="field !mt-0 min-w-0 flex-[1_1_14rem]" lang="ku" dir="rtl" value={s.ku} onChange={setRow(i, "ku")}
            />
            <span className="flex gap-1">
              <button type="button" aria-label={bi("Nach oben", "بۆ سەری")} disabled={i === 0} onClick={() => onChange(moveItem(segments, i, i - 1))} className={ICON_BTN}>{/* KU: review */}
                <ArrowUp size={16} />
              </button>
              <button type="button" aria-label={bi("Nach unten", "بۆ خوارێ")} disabled={i === segments.length - 1} onClick={() => onChange(moveItem(segments, i, i + 1))} className={ICON_BTN}>{/* KU: review */}
                <ArrowDown size={16} />
              </button>
              <button type="button" aria-label={bi(`Satz ${i + 1} löschen`, `رستە ${i + 1} بسڕە`)} onClick={() => onChange(segments.filter((_, j) => j !== i))} className={`${ICON_BTN} text-[var(--bad)]`}>
                <Trash2 size={16} />
              </button>
            </span>
          </li>
        ))}
      </ol>
      <button
        type="button" onClick={() => onChange([...segments, { de: "", ku: "" }])}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line font-bold text-link hover:border-brand"
      >
        <Plus size={17} /> {bi("Satz hinzufügen", "رستەیێ زێدە بکە")}{/* KU: review */}
      </button>
    </Box>
  );
}
```

```jsx file=src/pages/dashboard/editor/WordsSection.jsx
import { useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useBi } from "../bi";
import { Box } from "../ui";

const EMPTY_WORD = { wordDe: "", wordKu: "", sentenceDe: "", sentenceKu: "" };

// The story's vocabulary. Students can tap these words in the story.
export default function WordsSection({ words, onChange }) {
  const bi = useBi();
  const [open, setOpen] = useState(() => new Set()); // rows whose example sentences are shown
  const setRow = (i, k) => (e) => onChange(words.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)));
  const toggle = (i) => setOpen((s) => {
    const next = new Set(s);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    return next;
  });

  return (
    <Box id="words" title={`${bi("Wörter", "وشە")} (${words.length})`}>
      <p className="mb-3 text-sm text-muted">{bi("Diese Wörter können die Schüler in der Geschichte antippen.", "قوتابی دشێن ل سەر ڤان وشان د چیرۆکێ دا کلیک بکەن.")}</p>{/* KU: review */}
      <ul className="space-y-2">
        {words.map((x, i) => (
          <li key={i} className="rounded-xl border border-line p-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                aria-label={bi(`Wort ${i + 1}`, `وشە ${i + 1}`)} placeholder={bi("Deutsches Wort", "وشەیا ئەلمانی")}
                className="field !mt-0 min-w-0 flex-[1_1_12rem] font-semibold" lang="de" dir="ltr" value={x.wordDe} onChange={setRow(i, "wordDe")}
              />
              <input
                aria-label={bi(`Bedeutung ${i + 1}`, `رامان ${i + 1}`)} placeholder={bi("Kurdische Bedeutung", "رامانا کوردی")}
                className="field !mt-0 min-w-0 flex-[1_1_12rem]" lang="ku" dir="rtl" value={x.wordKu} onChange={setRow(i, "wordKu")}
              />
              <button type="button" aria-expanded={open.has(i)} onClick={() => toggle(i)} className="btn-mini inline-flex min-h-11 items-center gap-1 text-sm">
                <ChevronDown size={15} /> {bi("Beispiel", "نمونە")}
              </button>
              <button
                type="button" aria-label={bi(`Wort ${i + 1} löschen`, `وشە ${i + 1} بسڕە`)}
                onClick={() => { onChange(words.filter((_, j) => j !== i)); setOpen(new Set()); }}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line text-[var(--bad)]"
              >
                <Trash2 size={16} />
              </button>
            </div>
            {open.has(i) && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input
                  aria-label={bi("Deutscher Beispielsatz", "رستەیا نمونەیا ئەلمانی")} placeholder={bi("Deutscher Beispielsatz", "رستەیا نمونەیا ئەلمانی")}
                  className="field !mt-0" lang="de" dir="ltr" value={x.sentenceDe} onChange={setRow(i, "sentenceDe")}
                />
                <input
                  aria-label={bi("Kurdischer Beispielsatz", "رستەیا نمونەیا کوردی")} placeholder={bi("Kurdischer Beispielsatz", "رستەیا نمونەیا کوردی")}
                  className="field !mt-0" lang="ku" dir="rtl" value={x.sentenceKu} onChange={setRow(i, "sentenceKu")}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
      <button
        type="button" onClick={() => onChange([...words, { ...EMPTY_WORD }])}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line font-bold text-link hover:border-brand"
      >
        <Plus size={17} /> {bi("Wort hinzufügen", "وشەیێ زێدە بکە")}
      </button>
    </Box>
  );
}
```

```jsx file=src/pages/dashboard/editor/QuizSection.jsx
import { useState } from "react";
import { Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { generateQuestions } from "../../../data/storyBundle";
import { useBi } from "../bi";
import { Box, Msg } from "../ui";

const emptyQuestion = () => ({ questionDe: "", questionKu: "", options: ["", ""], correctAnswer: 0 });

// One question opened for editing: texts, answers, and a radio button for the correct answer
function QuestionEditor({ n, q, onChange, onDelete, onClose }) {
  const bi = useBi();
  const set = (patch) => onChange({ ...q, ...patch });
  const setOption = (i) => (e) => set({ options: q.options.map((o, j) => (j === i ? e.target.value : o)) });
  const removeOption = (i) => set({
    options: q.options.filter((_, j) => j !== i),
    correctAnswer: i === q.correctAnswer ? 0 : i < q.correctAnswer ? q.correctAnswer - 1 : q.correctAnswer,
  });

  return (
    <fieldset className="rounded-xl border p-3" style={{ borderColor: "var(--brand)" }}>
      <legend className="px-1 text-sm font-bold">{bi(`Frage ${n}`, `پرسیار ${n}`)}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          aria-label={bi("Frage (Deutsch)", "پرسیار (ئەلمانی)")} placeholder={bi("Frage (Deutsch)", "پرسیار (ئەلمانی)")}
          className="field !mt-0" lang="de" dir="ltr" value={q.questionDe} onChange={(e) => set({ questionDe: e.target.value })}
        />
        <input
          aria-label={bi("Frage (Kurdisch)", "پرسیار (کوردی)")} placeholder={bi("Frage (Kurdisch)", "پرسیار (کوردی)")}
          className="field !mt-0" lang="ku" dir="rtl" value={q.questionKu} onChange={(e) => set({ questionKu: e.target.value })}
        />
      </div>
      <p className="mt-3 text-sm text-muted">{bi("Antworten – den Kreis bei der richtigen Antwort anklicken.", "بەرسڤ – ل سەر بازنەیا بەرسڤا درست کلیک بکە.")}</p>{/* KU: review */}
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {q.options.map((o, i) => (
          <div
            key={i} className="flex items-center gap-2 rounded-xl border px-2"
            style={i === q.correctAnswer ? { borderColor: "var(--ok)", background: "var(--okbg)" } : { borderColor: "var(--line)" }}
          >
            <input
              type="radio" name={`correct-${n}`} checked={i === q.correctAnswer} onChange={() => set({ correctAnswer: i })}
              aria-label={bi(`Antwort ${i + 1} ist richtig`, `بەرسڤا ${i + 1} درستە`)} className="h-5 w-5 shrink-0 accent-[var(--brand)]"
            />{/* KU: review */}
            <input aria-label={bi(`Antwort ${i + 1}`, `بەرسڤ ${i + 1}`)} className="min-h-11 min-w-0 flex-1 bg-transparent outline-none" dir="auto" value={o} onChange={setOption(i)} />
            {q.options.length > 2 && (
              <button type="button" aria-label={bi(`Antwort ${i + 1} entfernen`, `بەرسڤا ${i + 1} لابە`)} onClick={() => removeOption(i)} className="p-2 text-muted hover:text-fg">{/* KU: review */}
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {q.options.length < 6 && (
          <button type="button" onClick={() => set({ options: [...q.options, ""] })} className="btn-mini inline-flex items-center gap-1 text-sm">
            <Plus size={15} /> {bi("Antwort", "بەرسڤ")}
          </button>
        )}
        <button type="button" onClick={onClose} className="btn-mini text-sm">{bi("Fertig", "تەمام")}</button>{/* KU: review */}
        <button type="button" onClick={onDelete} className="btn-danger ms-auto inline-flex items-center gap-1 text-sm">
          <Trash2 size={15} /> {bi("Frage löschen", "پرسیارێ بسڕە")}{/* KU: review */}
        </button>
      </div>
    </fieldset>
  );
}

// Quiz: a short list; one question at a time opens for editing.
// pool = Kurdish meanings from other stories of this level (extra wrong answers for generated questions).
export default function QuizSection({ questions, words, pool, onChange }) {
  const bi = useBi();
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState(null);
  const setQuestion = (i) => (q) => onChange(questions.map((x, j) => (j === i ? q : x)));
  const add = () => { onChange([...questions, emptyQuestion()]); setEditing(questions.length); setMsg(null); };
  const remove = (i) => { onChange(questions.filter((_, j) => j !== i)); setEditing(null); };
  const generate = () => {
    const made = generateQuestions(words, questions, pool);
    onChange([...questions, ...made]);
    setMsg(made.length
      ? { ok: true, de: `${made.length} Fragen erstellt. Bitte prüfen und speichern.`, ku: `${made.length} پرسیار هاتنە دروستکرن. تکایە بپشکنە و بپارێزە.` } // KU: review
      : { ok: false, de: "Keine neuen Fragen: Jedes Wort hat schon eine Frage, oder es fehlen Wörter mit Bedeutung.", ku: "چ پرسیارێن نوو نینن: هەر وشەیەک پرسیارەک هەیە، یان وشە ب رامان نینن." }); // KU: review
  };

  return (
    <Box
      id="quiz"
      title={`${bi("Quiz", "کویز")} (${questions.length})`}
      aside={
        <button type="button" onClick={generate} className="btn-ghost inline-flex items-center gap-2 px-4 text-sm font-semibold">
          <Sparkles size={16} /> {bi("Fragen aus den Wörtern erstellen", "پرسیاران ژ وشان دروست بکە")}{/* KU: review */}
        </button>
      }
    >
      <Msg m={msg} />
      <ol className="mt-3 space-y-2">
        {questions.map((q, i) => (
          <li key={i}>
            {editing === i ? (
              <QuestionEditor n={i + 1} q={q} onChange={setQuestion(i)} onDelete={() => remove(i)} onClose={() => setEditing(null)} />
            ) : (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
                <span className="min-w-0 flex-[1_1_16rem]">
                  <span className="block font-semibold" dir="auto">{i + 1}. {q.questionDe || bi("(ohne Text)", "(بێ دەق)")}</span>{/* KU: review */}
                  <span className="block text-sm text-muted">
                    {bi("Richtig", "درست")}: <span dir="auto">{q.options[q.correctAnswer] || "–"}</span> · {bi(`${q.options.length} Antworten`, `${q.options.length} بەرسڤ`)}
                  </span>
                </span>
                <button type="button" onClick={() => setEditing(i)} className="btn-mini inline-flex items-center gap-1 text-sm">
                  <Pencil size={15} /> {bi("Bearbeiten", "دەستکاریکرن")}
                </button>
              </div>
            )}
          </li>
        ))}
      </ol>
      <button
        type="button" onClick={add}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line font-bold text-link hover:border-brand"
      >
        <Plus size={17} /> {bi("Frage hinzufügen", "پرسیارەکێ زێدە بکە")}
      </button>
    </Box>
  );
}
```

```jsx file=src/pages/dashboard/editor/SaveBar.jsx
import { useBi } from "../bi";
import { Msg } from "../ui";

// Sticky bar at the bottom of the editor. Shown while there are unsaved changes, or to show the last save message.
// On phones it sits above the app's bottom tab bar.
export default function SaveBar({ dirty, busy, msg, onSave, onDiscard }) {
  const bi = useBi();
  if (!dirty && !msg) return null;
  return (
    <div className="glass sticky bottom-20 z-10 mt-2 flex flex-wrap items-center gap-3 rounded-2xl p-3 lg:bottom-4">
      <div className="me-auto text-sm font-semibold">
        {dirty && (
          <p><span aria-hidden="true" style={{ color: "#f59e0b" }}>● </span>{bi("Nicht gespeicherte Änderungen", "گوهۆڕینێن نەپاراستی")}</p>
        )}{/* KU: review */}
        <Msg m={msg} />
      </div>
      {dirty && (
        <>
          <button type="button" onClick={onDiscard} disabled={busy} className="btn-ghost px-5">{bi("Verwerfen", "ژێ ببە")}</button>{/* KU: review */}
          <button type="button" onClick={onSave} disabled={busy} className="btn-primary px-6">
            {busy ? bi("Speichert…", "دهێتە پاراستن…") : bi("Speichern", "بپارێزە")}{/* KU: review */}
          </button>
        </>
      )}
    </div>
  );
}
```

- [ ] Run: `npm run lint`
- [ ] Verify: only the 4 known errors.

### Task 9: Editor page
Files: `src/pages/dashboard/editor/StoryEditorPage.jsx`
Interface:
- Route element for `stories/new` and `stories/:storyId`.
- Uses `useOutletContext().setDirty`, plus `saveBundle` and `deleteBundle`.
Steps:
- [ ] Create:

```jsx file=src/pages/dashboard/editor/StoryEditorPage.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Trash2 } from "lucide-react";
import EmptyState from "../../../components/EmptyState";
import { deleteBundle, saveBundle, useContent } from "../../../data/stories";
import { emptyBundle, loadBundle, slugId, validateBundle } from "../../../data/storyBundle";
import { SAVE_FAIL, useBi } from "../bi";
import DetailsSection from "./DetailsSection";
import JumpNav from "./JumpNav";
import QuizSection from "./QuizSection";
import SaveBar from "./SaveBar";
import SentencesSection from "./SentencesSection";
import WordsSection from "./WordsSection";

// Which section each validation error belongs to, and its text ([de, ku]; n = row number)
const SECTION_OF = {
  titleDe: "details", cover: "details", segments: "sentences", segmentDe: "sentences", word: "words",
  questionText: "quiz", questionOptions: "quiz", questionCorrect: "quiz",
};
const ERROR_TEXT = {
  titleDe: () => ["Bitte gib einen deutschen Titel ein.", "تکایە ناڤونیشانەکێ ئەلمانی بنڤیسە."],
  cover: () => ["Bitte lade ein Titelbild hoch.", "تکایە وێنەیەکێ بەرگی بار بکە."],
  segments: () => ["Bitte schreibe mindestens einen Satz.", "تکایە کێم ئێک رستە بنڤیسە."],
  segmentDe: (n) => [`Satz ${n}: Der deutsche Text fehlt.`, `رستە ${n}: دەقێ ئەلمانی نینە.`], // KU: review
  word: (n) => [`Wort ${n}: Bitte Wort und Bedeutung ausfüllen.`, `وشە ${n}: تکایە وشەیا ئەلمانی و رامانا کوردی پر بکە.`],
  questionText: (n) => [`Frage ${n}: Bitte schreibe die Frage.`, `پرسیار ${n}: تکایە پرسیارەکێ بنڤیسە.`],
  questionOptions: (n) => [`Frage ${n}: Schreibe mindestens 2 Antworten.`, `پرسیار ${n}: کێم 2 بەرسڤان بنڤیسە.`],
  questionCorrect: (n) => [`Frage ${n}: Wähle die richtige Antwort.`, `پرسیار ${n}: بەرسڤا درست هەلبژێرە.`], // KU: review
};

// Route element: a fresh editor (and form state) for every story
export default function StoryEditorPage() {
  const { storyId } = useParams();
  return <StoryEditor key={storyId ?? "new"} storyId={storyId} />;
}

function StoryEditor({ storyId }) {
  const bi = useBi();
  const { content, ready } = useContent();
  if (!ready) return <p className="text-muted">{bi("Wird geladen…", "تێتە بارکرن…")}</p>; // KU: review
  if (!storyId) return <EditorForm initial={emptyBundle()} />;
  const loaded = loadBundle(content, storyId);
  if (!loaded) {
    return <EmptyState title={bi("Geschichte nicht gefunden", "چیرۆک نەهاتە دیتن")} linkTo="/dashboard" linkLabel={bi("Alle Geschichten", "هەمی چیرۆک")} />;
  }
  return <EditorForm initial={loaded.bundle} others={loaded.otherWordTopics + loaded.otherQuizzes} />;
}

// The form keeps its own copy of the bundle; live updates from Firestore don't overwrite what is being edited.
// "saved" is the last saved state, used for the unsaved-changes check.
function EditorForm({ initial, others = 0 }) {
  const bi = useBi();
  const navigate = useNavigate();
  const { setDirty } = useOutletContext();
  const { content } = useContent();
  const [bundle, setBundle] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState([]);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(bundle) !== JSON.stringify(saved);
  const update = (patch) => { setBundle((b) => ({ ...b, ...patch })); setMsg(null); };

  useEffect(() => { setDirty(dirty); }, [dirty, setDirty]);
  useEffect(() => () => setDirty(false), [setDirty]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const pool = content.wordTopics[bundle.level].filter((t) => t.storyId !== bundle.id).flatMap((t) => t.words.map((x) => x.wordKu));
  const confirmLeave = (e) => {
    if (dirty && !window.confirm(bi("Änderungen verwerfen?", "گوهۆڕینان ژێ ببەی؟"))) e.preventDefault(); // KU: review
  };

  const save = async () => {
    const errs = validateBundle(bundle);
    setErrors(errs);
    if (errs.length) {
      setMsg(null);
      requestAnimationFrame(() => document.getElementById("editor-errors")?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    const isNew = !bundle.id;
    const toSave = isNew ? { ...bundle, id: slugId(bundle.titleDe) } : bundle;
    setBusy(true);
    try {
      await saveBundle(toSave);
    } catch (err) {
      console.error(err);
      setBusy(false);
      return setMsg(SAVE_FAIL);
    }
    setBusy(false);
    setSaved(toSave);
    setBundle(toSave);
    if (isNew) return navigate(`/dashboard/stories/${toSave.id}`, { replace: true });
    setMsg({ ok: true, de: "Gespeichert ✓ Die Schüler sehen die Änderungen jetzt.", ku: "هاتە پاراستن ✓ قوتابی ئێستا گوهۆڕینان دبینن." }); // KU: review
  };

  const remove = async () => {
    if (!window.confirm(bi(`„${saved.titleDe}“ mit Wörtern und Quiz für alle Schüler löschen?`, `«${saved.titleDe}» دگەل وشە و کویزێ بۆ هەمی قوتابیان بهێتە سڕین؟`))) return; // KU: review
    try {
      await deleteBundle(saved.id);
    } catch (err) {
      console.error(err);
      return setMsg(SAVE_FAIL);
    }
    navigate("/dashboard");
  };

  const discard = () => { setBundle(saved); setErrors([]); setMsg(null); };

  return (
    <div>
      <Link to="/dashboard" onClick={confirmLeave} className="mb-3 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted hover:text-fg">
        <ArrowLeft size={16} className="rtl:rotate-180" /> {bi("Alle Geschichten", "هەمی چیرۆک")}
      </Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-extrabold" dir="auto">{bundle.titleDe || bi("Neue Geschichte", "چیرۆکا نوو")}</h2>
          {bundle.titleKu && <p lang="ku" dir="rtl" className="text-muted">{bundle.titleKu}</p>}
        </div>
        {saved.id && (
          <a href={`/stories/${saved.level}/${saved.id}`} target="_blank" rel="noreferrer" className="btn-ghost inline-flex items-center gap-2 px-4 py-2.5 font-semibold">
            <Eye size={17} /> {bi("Wie Schüler es sehen", "وەکی قوتابی دبینن")}{/* KU: review */}
          </a>
        )}
      </div>

      {errors.length > 0 && (
        <div id="editor-errors" role="alert" className="mb-6 rounded-2xl border p-4 text-sm" style={{ borderColor: "var(--bad)", background: "var(--badbg)" }}>
          <p className="mb-2 font-bold">{bi("Bitte korrigieren:", "تکایە ڤان چاک بکە:")}</p>{/* KU: review */}
          <ul className="list-inside list-disc space-y-1">
            {errors.map((e, i) => (
              <li key={i}><a href={`#${SECTION_OF[e.code]}`} className="underline">{bi(...ERROR_TEXT[e.code](e.n))}</a></li>
            ))}
          </ul>
        </div>
      )}
      {others > 0 && (
        <p className="mb-6 rounded-xl bg-soft p-3 text-sm text-muted">
          {bi(`Diese Geschichte hat ${others} weitere verknüpfte Wortlisten oder Quizze. Sie bleiben unverändert.`, `${others} لیستێن وشان یان کویزێن دی ب ڤێ چیرۆکێ ڤە گرێداینە. ئەو وەکی خۆ دمینن.`)}{/* KU: review */}
        </p>
      )}

      <div className="flex flex-wrap items-start gap-6">
        <JumpNav counts={{ sentences: bundle.segments.length, words: bundle.words.length, questions: bundle.questions.length }} />
        <div className="min-w-0 flex-[999_1_32rem]">
          <DetailsSection bundle={bundle} update={update} />
          <SentencesSection segments={bundle.segments} onChange={(segments) => update({ segments })} />
          <WordsSection words={bundle.words} onChange={(words) => update({ words })} />
          <QuizSection questions={bundle.questions} words={bundle.words} pool={pool} onChange={(questions) => update({ questions })} />
          {saved.id && (
            <section className="mb-6 rounded-2xl border p-4 sm:p-6" style={{ borderColor: "var(--bad)" }}>
              <p className="mb-3 text-sm text-muted">{bi("Löscht die Geschichte mit ihren Wörtern und ihrem Quiz für alle Schüler.", "چیرۆکێ دگەل وشە و کویزا وێ بۆ هەمی قوتابیان دسڕیت.")}</p>{/* KU: review */}
              <button type="button" onClick={remove} className="btn-danger inline-flex items-center gap-2">
                <Trash2 size={16} /> {bi("Geschichte löschen", "چیرۆکێ بسڕە")}{/* KU: review */}
              </button>
            </section>
          )}
        </div>
      </div>

      <SaveBar dirty={dirty} busy={busy} msg={msg} onSave={save} onDiscard={discard} />
    </div>
  );
}
```

- [ ] Run: `npm run lint`
- [ ] Verify: only the 4 known errors.

### Task 10: Layout and routes, and remove the old dashboard
Files: `src/pages/dashboard/DashboardLayout.jsx`, `src/routes/AppRoutes.jsx`, `src/pages/Dashboard.jsx` (delete)
Interface: `DashboardLayout` passes `{ students, setDirty }` through the Outlet context.
Steps:
- [ ] Create:

```jsx file=src/pages/dashboard/DashboardLayout.jsx
import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { useContent } from "../../data/stories";
import { useStudents } from "../../data/students";
import { useBi } from "./bi";

// Owner dashboard (only German + Kurdish): header with a one-line summary, the section switch, and the current
// section below. A section with unsaved changes reports them through setDirty, so switching sections asks first.
const SECTIONS = [
  ["/dashboard", "Geschichten", "چیرۆک"],
  ["/dashboard/students", "Schüler", "قوتابی"],
  ["/dashboard/settings", "Einstellungen", "ڕێکخستن"], // KU: review
];
const total = (byLevel, key) => Object.values(byLevel).flat().reduce((n, x) => n + (key ? x[key]?.length || 0 : 1), 0);

export default function DashboardLayout() {
  const bi = useBi();
  const { pathname } = useLocation();
  const { content } = useContent();
  const students = useStudents();
  const [dirty, setDirty] = useState(false);
  const current = pathname.startsWith("/dashboard/students") ? 1 : pathname.startsWith("/dashboard/settings") ? 2 : 0;
  const n = [total(content.stories), total(content.wordTopics, "words"), total(content.quizzes, "questions"), students.length];
  const guard = (e) => {
    if (dirty && !window.confirm(bi("Änderungen verwerfen?", "گوهۆڕینان ژێ ببەی؟"))) e.preventDefault(); // KU: review
  };

  return (
    <div>
      <PageHeader
        title={bi("Dashboard", "داشبۆرد")}
        subtitle={bi(`${n[0]} Geschichten · ${n[1]} Wörter · ${n[2]} Fragen · ${n[3]} Schüler`, `${n[0]} چیرۆک · ${n[1]} وشە · ${n[2]} پرسیار · ${n[3]} قوتابی`)}
      />
      <nav aria-label={bi("Bereiche", "بەش")} className="-mx-1 mb-6 flex gap-2 overflow-x-auto p-1">{/* KU: review */}
        {SECTIONS.map(([to, de, ku], i) => (
          <Link
            key={to} to={to} onClick={guard} aria-current={i === current ? "page" : undefined}
            className={`inline-flex shrink-0 items-center px-4 font-semibold ${i === current ? "btn-primary" : "btn-ghost"}`}
          >
            {bi(de, ku)}
          </Link>
        ))}
      </nav>
      <Outlet context={{ students, setDirty }} />
    </div>
  );
}
```

- [ ] In `src/routes/AppRoutes.jsx`, replace `import Dashboard from "../pages/Dashboard";` with:

```jsx
import DashboardLayout from "../pages/dashboard/DashboardLayout";
import LibraryPage from "../pages/dashboard/LibraryPage";
import StoryEditorPage from "../pages/dashboard/editor/StoryEditorPage";
import StudentsPage from "../pages/dashboard/StudentsPage";
import SettingsPage from "../pages/dashboard/SettingsPage";
```

- [ ] In the same file, replace `<Route path="dashboard" element={<OwnerOnly><Dashboard /></OwnerOnly>} />` with:

```jsx
          <Route path="dashboard" element={<OwnerOnly><DashboardLayout /></OwnerOnly>}>
            <Route index element={<LibraryPage />} />
            <Route path="stories/new" element={<StoryEditorPage />} />
            <Route path="stories/:storyId" element={<StoryEditorPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
```

- [ ] Delete `src/pages/Dashboard.jsx`.
- [ ] Run: `npm run lint && npm test && npm run build`
- [ ] Verify: lint shows only the 4 known errors, all tests pass, and the build succeeds.

### Task 11: Documentation
Files: `docs/CLAUDE.md`, `docs/CODEBASE.md`
Steps:
- [ ] `docs/CLAUDE.md`:
  - In Commands, add `npm test          # Vitest unit tests (src/data/storyBundle.test.js)`.
  - Replace the "There are no tests and no test runner." bullet with: "Unit tests: Vitest, only for the pure story-bundle logic in `src/data/storyBundle.js`. UI is checked manually."
  - Update any mention of `pages/Dashboard.jsx` to `pages/dashboard/`.
- [ ] `docs/CODEBASE.md`:
  - In the file tree, replace `Dashboard.jsx` with the `pages/dashboard/` folder (the files from this plan) and add `src/data/storyBundle.js`.
  - Replace the Dashboard section (the tab table and the SetupBox notes) with: the three sections (Geschichten library + one-page editor, Schüler, Einstellungen = announcement + setup + backup), the routes, the story bundle (load and save as one `writeBatch`, titles and level copied to the word list and quiz, an empty word list or quiz deletes its doc, delete removes linked docs), bulk paste, "Fragen aus den Wörtern erstellen", the unsaved-changes guard and its `BrowserRouter` limit.
  - Under the content store API, add `saveBundle(bundle)` and `deleteBundle(storyId)`.
- [ ] Run: `npm run lint`
- [ ] Verify: unchanged (4 known errors).

### Task 12: Final verification
Steps:
- [ ] Run: `npm test`. Verify: all pass.
- [ ] Run: `npm run lint`. Verify: exactly the 4 known errors.
- [ ] Run: `npm run build`. Verify: success.
- [ ] Manual check, done by the owner in `npm run dev` (needs an owner login), using the checklist in spec §7:
  1. Create a story with sentences, words and a quiz. Students see it, with tappable words and the quiz.
  2. Saving without a title, cover or sentence shows the errors and saves nothing.
  3. Edit a built-in story and check that the student pages change.
  4. Delete a story. Its word list and quiz are gone.
  5. Schüler and Einstellungen work as before.
  6. The layout works at phone width and in Kurdish (RTL).

## Self-review
- [x] Every spec requirement maps to a task:
  - library §3.2 → Task 7
  - editor §3.3 → Tasks 8–9
  - students §3.4 → Task 6
  - settings §3.5 → Task 6
  - routes §4 → Task 10
  - bundle and saving §5.1 → Tasks 3–4
  - validation §5.2 → Tasks 3 and 9
  - bulk paste §5.3 → Tasks 3 and 8
  - question generation §5.4 → Tasks 3 and 8
  - unsaved changes §5.5 → Tasks 9–10
  - code structure §6 → all
  - tests §7 → Tasks 1–3 and 12
- [x] No placeholders.
- [x] Types are consistent:
  - bundle fields are the same across `storyBundle.js`, the tests and the editor
  - `bundleToDocs` returns `{ sets, deletes }`, which `saveBundle` uses
  - `storyHealth` returns the keys `LibraryCard` reads
