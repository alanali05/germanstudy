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
