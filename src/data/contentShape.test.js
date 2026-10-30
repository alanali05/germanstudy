import { describe, expect, it } from "vitest";
import { isNewShape, toNewShape } from "./contentShape";

const legacyStory = { level: "a1", order: 3, number: 2, titleDe: "Kochen", titleKu: "چێشتکرن", readTime: "4 min", segments: [{ de: "Hallo.", ku: "سڵاو." }] };
const legacyTopic = { level: "a1", storyId: "s1", titleDe: "Kochen", titleKu: "", words: [{ wordDe: "Öl", wordKu: "روون", sentenceDe: "Das Öl.", sentenceKu: "روون." }] };
const legacyQuiz = { level: "a1", storyId: "s1", titleDe: "Kochen", questions: [{ questionDe: "Was?", questionKu: "چ؟", options: ["a", "b"], correctAnswer: 1 }] };

describe("toNewShape", () => {
  it("converts a legacy story", () => {
    const s = toNewShape("stories", legacyStory);
    expect(s).toEqual({ level: "a1", order: 3, number: 2, titleKu: "چێشتکرن", readTime: "4 min", lang: "de", title: "Kochen", segments: [{ text: "Hallo.", ku: "سڵاو." }] });
    expect(s).not.toHaveProperty("titleDe");
  });

  it("converts legacy words", () => {
    expect(toNewShape("wordTopics", legacyTopic).words).toEqual([{ word: "Öl", wordKu: "روون", sentence: "Das Öl.", sentenceKu: "روون." }]);
  });

  it("converts legacy questions", () => {
    const q = toNewShape("quizzes", legacyQuiz);
    expect(q.questions).toEqual([{ question: "Was?", questionKu: "چ؟", options: ["a", "b"], correctAnswer: 1 }]);
    expect(q.storyId).toBe("s1");
  });

  it("leaves a new-shape document as it is and keeps lang en", () => {
    const en = toNewShape("stories", { ...legacyStory, lang: "en" });
    expect(en.lang).toBe("en");
    expect(toNewShape("stories", en)).toEqual(en);
  });
});

describe("isNewShape", () => {
  it("is false before and true after conversion", () => {
    for (const [col, data] of [["stories", legacyStory], ["wordTopics", legacyTopic], ["quizzes", legacyQuiz]]) {
      expect(isNewShape(col, data)).toBe(false);
      expect(isNewShape(col, toNewShape(col, data))).toBe(true);
    }
  });
});
