// Content documents use neutral field names plus the learning language:
//   stories    { lang, title, titleKu, segments: [{ text, ku }], … }
//   wordTopics { lang, title, titleKu, words: [{ word, wordKu, sentence, sentenceKu }], … }
//   quizzes    { lang, title, titleKu, questions: [{ question, questionKu, options, correctAnswer }], … }
// Documents from the German-only app used titleDe, segments[].de, wordDe/sentenceDe and questionDe.
// toNewShape turns either shape into the new one (old keys removed, lang "de" if missing). Pure: used by the
// content store when it loads documents and by the one-time migration.
const pick = (a, b) => (typeof a === "string" ? a : typeof b === "string" ? b : "");

const ITEMS = {
  stories: ["segments", (s) => ({ text: pick(s.text, s.de), ku: pick(s.ku) })],
  wordTopics: ["words", (w) => ({ word: pick(w.word, w.wordDe), wordKu: pick(w.wordKu), sentence: pick(w.sentence, w.sentenceDe), sentenceKu: pick(w.sentenceKu) })],
  quizzes: ["questions", (q) => ({
    question: pick(q.question, q.questionDe),
    questionKu: pick(q.questionKu),
    options: (q.options || []).map((o) => pick(o)),
    correctAnswer: Number.isInteger(q.correctAnswer) ? q.correctAnswer : 0,
  })],
};

export function toNewShape(col, data) {
  const { titleDe, ...rest } = data;
  const [listKey, fix] = ITEMS[col];
  return { ...rest, lang: data.lang === "en" ? "en" : "de", title: pick(data.title, titleDe), [listKey]: (data[listKey] || []).map(fix) };
}

// Same content regardless of key order (Firestore does not keep the order of map keys)
const stable = (v) =>
  Array.isArray(v) ? v.map(stable)
  : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, stable(v[k])]))
  : v;

// True if the document is already in the new shape (nothing to migrate)
export const isNewShape = (col, data) => JSON.stringify(stable(toNewShape(col, data))) === JSON.stringify(stable(data));
