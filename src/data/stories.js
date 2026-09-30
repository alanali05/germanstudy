// Content store. Three separate collections, each grouped by level (a1, a2, b1, b2):
//   stories     – texts to read
//   wordTopics  – word lists   { id, titleDe, titleKu, storyId?, words: [...] }
//   quizzes     – question sets { id, titleDe, titleKu, storyId?, questions: [...] }
// "storyId" is optional: it links a topic/quiz to a story (its words become tappable there).
// The owner dashboard changes are saved in THIS browser (localStorage) until a backend exists.
import { a1GreetingsStory,a2PersoenlicheInformationenStory } from "./storyFiles/storydata";

const KEY = "ls-content-v2";
const OLD_KEY = "ls-content-v1";
const LEVEL_IDS = ["a1", "a2", "b1", "b2"];
const empty = () => ({ a1: [], a2: [], b1: [], b2: [] });

// Old shape (v1): stories that carried their own vocabulary + quiz -> new shape
function fromStoryMap(map) {
  const c = { version: 2, stories: empty(), wordTopics: empty(), quizzes: empty() };
  LEVEL_IDS.forEach((lv) => {
    (map[lv] || []).forEach((s) => {
      const { vocabulary, quiz, ...story } = s;
      c.stories[lv].push(story);
      if (vocabulary?.length) c.wordTopics[lv].push({ id: s.id, titleDe: s.titleDe, titleKu: s.titleKu || "", storyId: s.id, words: vocabulary });
      if (quiz?.length) c.quizzes[lv].push({ id: s.id, titleDe: s.titleDe, titleKu: s.titleKu || "", storyId: s.id, questions: quiz });
    });
  });
  return c;
}

// Accepts new or old shaped data (also used by the dashboard "Import")
export function normalizeContent(d) {
  if (!d || typeof d !== "object") throw new Error("bad data");
  if (d.version === 2) {
    return { version: 2, stories: { ...empty(), ...d.stories }, wordTopics: { ...empty(), ...d.wordTopics }, quizzes: { ...empty(), ...d.quizzes } };
  }
  if (LEVEL_IDS.every((l) => Array.isArray(d[l]))) return fromStoryMap(d);
  throw new Error("bad data");
}
{"put stories here"}
const builtIn = () => fromStoryMap({
  a1: [a1GreetingsStory,a2PersoenlicheInformationenStory],
  a2: [],
  b1: [],
  b2: [],
});

function load() {
  for (const k of [KEY, OLD_KEY]) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) return normalizeContent(JSON.parse(raw));
    } catch { /* try next */ }
  }
  return builtIn();
}

let content = load();

export const getContent = () => content;
export const getStories = () => content.stories;
export const storiesOf = (level) => content.stories[level] || [];
export const findStory = (level, id) => storiesOf(level).find((s) => s.id === id);

export const wordTopicsOf = (level) => content.wordTopics[level] || [];
export const findWordTopic = (level, id) => wordTopicsOf(level).find((t) => t.id === id);
export const quizzesOf = (level) => content.quizzes[level] || [];
export const findQuiz = (level, id) => quizzesOf(level).find((q) => q.id === id);

// Words / quizzes that belong to a story (any level)
export const linkedWords = (storyId) =>
  LEVEL_IDS.flatMap((l) => wordTopicsOf(l)).filter((t) => t.storyId === storyId).flatMap((t) => t.words);
export const linkedQuizzes = (storyId) =>
  LEVEL_IDS.flatMap((l) => quizzesOf(l).filter((q) => q.storyId === storyId && q.questions?.length).map((q) => ({ ...q, level: l })));
export const linkedWordTopics = (storyId) =>
  LEVEL_IDS.flatMap((l) => wordTopicsOf(l).filter((t) => t.storyId === storyId && t.words?.length).map((t) => ({ ...t, level: l })));

export function saveContent(next) {
  content = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
}
export function resetContent() {
  content = builtIn();
  try { localStorage.removeItem(KEY); localStorage.removeItem(OLD_KEY); } catch { /* ignore */ }
}
