import { describe, expect, it } from "vitest";
import {
  bundleToDocs, cleanBundle, emptyBundle, generateQuestions, loadBundle, moveItem, parsePaste, slugId, storyHealth, validateBundle,
} from "./storyBundle";

const levels = () => ({ a1: [], a2: [], b1: [], b2: [] });
const lib = () => ({ stories: levels(), wordTopics: levels(), quizzes: levels() });
// Content store shape (grouped by language, then level), like useContent() returns
function content({ stories = [], wordTopics = [], quizzes = [] } = {}) {
  const c = { de: lib(), en: lib() };
  Object.entries({ stories, wordTopics, quizzes }).forEach(([col, list]) => list.forEach((x) => c[x.lang || "de"][col][x.level].push(x)));
  return c;
}
const story = {
  id: "s1", lang: "de", level: "a2", order: 5, number: 3, title: "Kochen", titleKu: "چێشتکرن", readTime: "4 min",
  coverImage: "https://img.test/c.jpg", segments: [{ text: "Hallo.", ku: "سڵاو." }],
};
const topic = {
  id: "s1", lang: "de", level: "a2", order: 6, storyId: "s1", title: "Kochen",
  words: [{ word: "Gemeinsam", wordKu: "پێکڤە", sentence: "", sentenceKu: "" }],
};
const quiz = {
  id: "s1", lang: "de", level: "a2", order: 7, storyId: "s1", title: "Kochen",
  questions: [{ question: "Was?", questionKu: "", options: ["a", "b"], correctAnswer: 1 }],
};
const validBundle = () => ({
  ...emptyBundle(), id: "s1", title: "Titel", coverImage: "https://img.test/c.jpg", segments: [{ text: "Satz.", ku: "رستە." }],
});
const w = (word, wordKu) => ({ word, wordKu, sentence: "", sentenceKu: "" });
const q = (question, options = ["a", "b"], correctAnswer = 0) => ({ question, questionKu: "", options, correctAnswer });
const codes = (errors) => errors.map((e) => (e.n ? `${e.code}:${e.n}` : e.code));
const first = () => 0; // deterministic "random"

describe("emptyBundle", () => {
  it("starts in the given language", () => {
    expect(emptyBundle().lang).toBe("de");
    expect(emptyBundle("en").lang).toBe("en");
  });
});

describe("loadBundle", () => {
  it("returns null for an unknown story", () => {
    expect(loadBundle(content(), "nope")).toBeNull();
  });

  it("loads the story with its word list and quiz", () => {
    const { bundle, otherWordTopics, otherQuizzes } = loadBundle(content({ stories: [story], wordTopics: [topic], quizzes: [quiz] }), "s1");
    expect(bundle).toMatchObject({
      id: "s1", lang: "de", level: "a2", order: 5, title: "Kochen", titleKu: "چێشتکرن", readTime: "4 min",
      wordTopicId: "s1", wordTopicOrder: 6, quizId: "s1", quizOrder: 7, extra: { number: 3 },
    });
    expect(bundle.segments).toEqual([{ text: "Hallo.", ku: "سڵاو." }]);
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

  it("finds an English story and links only English word lists", () => {
    const enStory = { ...story, id: "e1", lang: "en", title: "Cooking" };
    const deTopic = { ...topic, id: "x", storyId: "e1" };
    const enTopic = { ...topic, id: "e1", lang: "en", storyId: "e1", words: [w("oil", "روون")] };
    const r = loadBundle(content({ stories: [story, enStory], wordTopics: [deTopic, enTopic] }), "e1");
    expect(r.bundle).toMatchObject({ lang: "en", title: "Cooking", wordTopicId: "e1" });
    expect(r.bundle.words).toEqual([w("oil", "روون")]);
    expect(r.otherWordTopics).toBe(0);
  });
});

describe("cleanBundle", () => {
  it("trims text and drops empty rows", () => {
    const c = cleanBundle({
      ...validBundle(), title: "  T ",
      segments: [{ text: " a ", ku: "" }, { text: " ", ku: " " }],
      words: [w("", "")],
      questions: [q("", ["", ""])],
    });
    expect(c.title).toBe("T");
    expect(c.segments).toEqual([{ text: "a", ku: "" }]);
    expect(c.words).toEqual([]);
    expect(c.questions).toEqual([]);
  });

  it("drops empty answers and keeps correctAnswer on its answer", () => {
    const c = cleanBundle({ ...validBundle(), questions: [q("Q", ["", "x", " y "], 2)] });
    expect(c.questions[0]).toEqual(q("Q", ["x", "y"], 1));
  });
});

describe("validateBundle", () => {
  it("accepts a complete story", () => {
    expect(validateBundle(validBundle())).toEqual([]);
  });

  it("needs a title, a cover and a sentence", () => {
    expect(codes(validateBundle(emptyBundle()))).toEqual(["title", "cover", "segments"]);
  });

  it("flags a sentence without text in the learning language", () => {
    const b = { ...validBundle(), segments: [{ text: "Satz.", ku: "" }, { text: "", ku: "تەنێ کوردی" }] };
    expect(codes(validateBundle(b))).toEqual(["segmentText:2"]);
  });

  it("flags a word without meaning", () => {
    expect(codes(validateBundle({ ...validBundle(), words: [w("Haus", "")] }))).toEqual(["word:1"]);
  });

  it("checks quiz questions", () => {
    const b = { ...validBundle(), questions: [q(""), q("Q2", ["a", ""]), q("Q3", ["a", "b", ""], 2)] };
    expect(codes(validateBundle(b))).toEqual(["questionText:1", "questionOptions:2", "questionCorrect:3"]);
  });
});

describe("bundleToDocs", () => {
  it("writes story, word list and quiz with shared language, level, titles and storyId", () => {
    const { bundle } = loadBundle(content({ stories: [story], wordTopics: [topic], quizzes: [quiz] }), "s1");
    const { sets, deletes } = bundleToDocs({ ...bundle, level: "b1", title: " Neu " }, 999);
    const head = { lang: "de", level: "b1", title: "Neu", titleKu: "چێشتکرن" };
    expect(deletes).toEqual([]);
    expect(sets).toEqual([
      ["stories", "s1", { number: 3, ...head, order: 5, readTime: "4 min", coverImage: "https://img.test/c.jpg", segments: [{ text: "Hallo.", ku: "سڵاو." }] }],
      ["wordTopics", "s1", { ...head, order: 6, storyId: "s1", words: topic.words }],
      ["quizzes", "s1", { ...head, order: 7, storyId: "s1", questions: quiz.questions }],
    ]);
  });

  it("writes the language into all three documents", () => {
    const { sets } = bundleToDocs({ ...validBundle(), lang: "en", words: [w("a", "b")], questions: [q("Q")] }, 1);
    expect(sets.map(([, , d]) => d.lang)).toEqual(["en", "en", "en"]);
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
  it("pairs sentence lines with Kurdish lines and skips blank lines", () => {
    expect(parsePaste("Eins.\n\n Zwei. \n", "ئێک.\nدوو.")).toEqual({
      segments: [{ text: "Eins.", ku: "ئێک." }, { text: "Zwei.", ku: "دوو." }], targetCount: 2, kuCount: 2, unmatched: [],
    });
  });

  it("reports rows without a partner", () => {
    const r = parsePaste("Eins.\nZwei.\nDrei.", "ئێک.");
    expect(r.segments).toHaveLength(3);
    expect(r.unmatched).toEqual([1, 2]);
  });

  it("reads the old 'Deutsch || Kurdisch' format", () => {
    expect(parsePaste("Hallo. || سڵاو.\nJa || بەلێ || باشە", "").segments).toEqual([
      { text: "Hallo.", ku: "سڵاو." }, { text: "Ja", ku: "بەلێ || باشە" },
    ]);
  });
});

describe("generateQuestions", () => {
  const words = [w("Gemeinsam", "پێکڤە"), w("Der Nachtisch", "شرینی"), w("Das Öl", "روون"), w("Die Zutat", "پێکهاتە")];

  it("asks for the meaning, with the right answer among 4 different options", () => {
    const qs = generateQuestions(words, [], { rng: first });
    expect(qs).toHaveLength(4);
    const x = qs[0];
    expect(x.question).toBe("Was bedeutet 'Gemeinsam'?");
    expect(x.questionKu).toBe("رامانا 'Gemeinsam' چییە؟");
    expect(x.options).toHaveLength(4);
    expect(new Set(x.options).size).toBe(4);
    expect(x.options[x.correctAnswer]).toBe("پێکڤە");
  });

  it("uses the English template for English stories", () => {
    const [x] = generateQuestions([w("apple", "سێڤ"), w("bread", "نان")], [], { lang: "en", rng: first });
    expect(x.question).toBe("What does 'apple' mean?");
    expect(x.questionKu).toBe("رامانا 'apple' چییە؟");
  });

  it("skips words that already have a question or have no meaning", () => {
    const qs = generateQuestions([...words, w("Leer", "")], [q("Was bedeutet 'Gemeinsam'?", [])], { rng: first });
    expect(qs.map((x) => x.question)).toEqual([
      "Was bedeutet 'Der Nachtisch'?", "Was bedeutet 'Das Öl'?", "Was bedeutet 'Die Zutat'?",
    ]);
  });

  it("fills wrong answers from the pool when the story has few words", () => {
    const [x] = generateQuestions([w("Haus", "خانی")], [], { pool: ["ئاڤ", "نان", "خانی"], rng: first });
    expect([...x.options].sort()).toEqual(["ئاڤ", "خانی", "نان"].sort());
    expect(x.options[x.correctAnswer]).toBe("خانی");
  });

  it("skips a word when no wrong answer exists", () => {
    expect(generateQuestions([w("Haus", "خانی")], [], { rng: first })).toEqual([]);
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
    const b = { ...validBundle(), segments: [{ text: "A", ku: "ب" }, { text: "B", ku: " " }, { text: "", ku: "" }], words: [w("x", "y")] };
    expect(storyHealth(b)).toEqual({ sentences: 2, missingKu: 1, words: 1, questions: 0 });
  });
});
