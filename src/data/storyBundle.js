// Story bundle: one story together with its word list and quiz. This is what the dashboard
// editor works on. Pure functions only (no Firebase), so they can be unit-tested;
// saving and deleting live in stories.js (saveBundle, deleteBundle).
//
// In Firestore a bundle is up to three documents linked by storyId, all with the same "lang":
//   stories/{id}, wordTopics/{wordTopicId ?? id}, quizzes/{quizId ?? id}
// Field names are neutral (see contentShape.js): "text", "word", "question" are in the learning language.

export const LEVEL_IDS = ["a1", "a2", "b1", "b2"];
const LANGS = ["de", "en"];

// Story fields the editor handles; any other field of a story document is kept as it is ("extra")
const STORY_KEYS = ["id", "lang", "level", "order", "title", "titleKu", "readTime", "coverImage", "segments"];
const str = (v) => (typeof v === "string" ? v : "");
const trim = (v) => str(v).trim();

// Document id from a title: "Kochen mit Freunden" -> "kochen-mit-freunden-x7k2"
export const slugId = (title, rand = Math.random) =>
  `${trim(title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item"}-${rand().toString(36).slice(2, 6)}`;

export const emptyBundle = (lang = "de") => ({
  id: null, lang, level: "a1", order: undefined, extra: {},
  title: "", titleKu: "", readTime: "", coverImage: "",
  segments: [], words: [], questions: [],
  wordTopicId: null, wordTopicOrder: undefined, quizId: null, quizOrder: undefined,
});

// All items of a collection in one language (or in every language) as one list, each with its language and level
const allOf = (content, col, langs = LANGS) =>
  langs.flatMap((lang) => LEVEL_IDS.flatMap((l) => (content?.[lang]?.[col]?.[l] || []).map((x) => ({ ...x, lang, level: l }))));

// The linked document the editor edits (the one with the story's id, else the first) and how many others exist
function pickLinked(list, storyId) {
  const mine = list.filter((x) => x.storyId === storyId);
  const main = mine.find((x) => x.id === storyId) || mine[0] || null;
  return { main, others: Math.max(0, mine.length - 1) };
}

// Builds the bundle for a story from the content store (useContent().content: { de: {...}, en: {...} }).
// The story may be in any language; its word list and quiz are looked up in the same language only.
// Returns { bundle, otherWordTopics, otherQuizzes }, or null if the story doesn't exist.
export function loadBundle(content, storyId) {
  const story = allOf(content, "stories").find((s) => s.id === storyId);
  if (!story) return null;
  const topic = pickLinked(allOf(content, "wordTopics", [story.lang]), storyId);
  const quiz = pickLinked(allOf(content, "quizzes", [story.lang]), storyId);
  return {
    bundle: {
      id: story.id,
      lang: story.lang,
      level: story.level,
      order: story.order,
      extra: Object.fromEntries(Object.entries(story).filter(([k]) => !STORY_KEYS.includes(k))),
      title: str(story.title),
      titleKu: str(story.titleKu),
      readTime: str(story.readTime),
      coverImage: str(story.coverImage),
      segments: (story.segments || []).map((x) => ({ text: str(x.text), ku: str(x.ku) })),
      words: (topic.main?.words || []).map((x) => ({
        word: str(x.word), wordKu: str(x.wordKu), sentence: str(x.sentence), sentenceKu: str(x.sentenceKu),
      })),
      questions: (quiz.main?.questions || []).map((q) => ({
        question: str(q.question),
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
    title: trim(b.title),
    titleKu: trim(b.titleKu),
    readTime: trim(b.readTime),
    coverImage: trim(b.coverImage),
    segments: b.segments.map((x) => ({ text: trim(x.text), ku: trim(x.ku) })).filter((x) => x.text || x.ku),
    words: b.words
      .map((x) => ({ word: trim(x.word), wordKu: trim(x.wordKu), sentence: trim(x.sentence), sentenceKu: trim(x.sentenceKu) }))
      .filter((x) => x.word || x.wordKu || x.sentence || x.sentenceKu),
    questions: b.questions
      .map((q) => {
        const kept = q.options.map((text, i) => ({ text: trim(text), i })).filter((o) => o.text);
        return {
          question: trim(q.question),
          questionKu: trim(q.questionKu),
          options: kept.map((o) => o.text),
          correctAnswer: kept.findIndex((o) => o.i === q.correctAnswer),
        };
      })
      .filter((q) => q.question || q.questionKu || q.options.length),
  };
}

// Problems that block saving, as { code, n? } (n = 1-based row number after cleaning). The UI turns codes into text.
export function validateBundle(b) {
  const c = cleanBundle(b);
  const errors = [];
  if (!c.title) errors.push({ code: "title" });
  if (!c.coverImage) errors.push({ code: "cover" });
  if (!c.segments.some((x) => x.text)) errors.push({ code: "segments" });
  else c.segments.forEach((x, i) => !x.text && errors.push({ code: "segmentText", n: i + 1 }));
  c.words.forEach((x, i) => (!x.word || !x.wordKu) && errors.push({ code: "word", n: i + 1 }));
  c.questions.forEach((q, i) => {
    if (!q.question) errors.push({ code: "questionText", n: i + 1 });
    if (q.options.length < 2) errors.push({ code: "questionOptions", n: i + 1 });
    else if (q.correctAnswer < 0) errors.push({ code: "questionCorrect", n: i + 1 });
  });
  return errors;
}

// The Firestore writes for a bundle (it must have an id): sets [collection, id, data], deletes [collection, id].
// Language, level and titles are copied to the word list and quiz; an empty word list or quiz deletes its document.
// "now" is the order for documents that have none yet.
export function bundleToDocs(b, now) {
  const c = cleanBundle(b);
  const head = { lang: c.lang, level: c.level, title: c.title, titleKu: c.titleKu };
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
  sentences: b.segments.filter((x) => trim(x.text)).length,
  missingKu: b.segments.filter((x) => trim(x.text) && !trim(x.ku)).length,
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

// Pasted sentences: lines in the learning language and Kurdish lines, paired by line (blank lines skipped).
// If every line of the first box contains "||", the old one-box format "Satz || Kurdisch" is used instead.
// unmatched = indexes of rows where one side is missing.
export function parsePaste(targetText, kuText) {
  const lines = (t) => str(t).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const target = lines(targetText);
  let segments;
  let kuCount;
  if (target.length && target.every((l) => l.includes("||"))) {
    segments = target.map((l) => {
      const [d, ...rest] = l.split("||");
      return { text: d.trim(), ku: rest.join("||").trim() };
    });
    kuCount = segments.filter((x) => x.ku).length;
  } else {
    const ku = lines(kuText);
    segments = Array.from({ length: Math.max(target.length, ku.length) }, (_, i) => ({ text: target[i] || "", ku: ku[i] || "" }));
    kuCount = ku.length;
  }
  const unmatched = segments.flatMap((x, i) => (x.text && x.ku ? [] : [i]));
  return { segments, targetCount: target.length, kuCount, unmatched };
}

const shuffle = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// "What does X mean?" in each learning language; the Kurdish question is the same for all
const QUESTION_TEMPLATE = {
  de: (w) => `Was bedeutet '${w}'?`,
  en: (w) => `What does '${w}' mean?`,
};

// "What does X mean?" questions for words that have a meaning and no question yet.
// Wrong answers: other meanings from this story first, then from "pool" (meanings from other stories);
// up to 3, and a word is skipped if there is none.
export function generateQuestions(words, existing, { pool = [], lang = "de", rng = Math.random } = {}) {
  const template = QUESTION_TEMPLATE[lang] || QUESTION_TEMPLATE.de;
  let asked = existing.map((q) => q.question).join("\n");
  const own = [...new Set(words.map((x) => trim(x.wordKu)).filter(Boolean))];
  const more = [...new Set(pool.map(trim).filter((m) => m && !own.includes(m)))];
  const out = [];
  for (const x of words) {
    const word = trim(x.word);
    const ku = trim(x.wordKu);
    if (!word || !ku || asked.includes(`'${word}'`)) continue;
    const wrong = [...shuffle(own.filter((m) => m !== ku), rng), ...shuffle(more.filter((m) => m !== ku), rng)].slice(0, 3);
    if (!wrong.length) continue;
    const options = shuffle([ku, ...wrong], rng);
    out.push({ question: template(word), questionKu: `رامانا '${word}' چییە؟`, options, correctAnswer: options.indexOf(ku) });
    asked += `\n'${word}'`;
  }
  return out;
}
