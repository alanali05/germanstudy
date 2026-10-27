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
