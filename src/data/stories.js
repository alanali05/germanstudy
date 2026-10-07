// Content store. Three Firestore collections, one document per item, each with a "level" field (a1, a2, b1, b2):
//   stories     – texts to read
//   wordTopics  – word lists   { titleDe, titleKu, storyId?, words: [...] }
//   quizzes     – question sets { titleDe, titleKu, storyId?, questions: [...] }
// plus settings/announcement { text }.
// "storyId" is optional: it links a topic/quiz to a story (its words become tappable there).
// startContentSync() keeps a live in-memory copy (grouped by level, like before), so the getters below stay synchronous.
import { useSyncExternalStore } from "react";
import { collection, deleteDoc, doc, getDocs, onSnapshot, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { a1GreetingsStory, a2PersoenlicheInformationenStory } from "./storyFiles/storydata";

const COLS = ["stories", "wordTopics", "quizzes"];
const LEGACY_KEYS = ["ls-content-v2", "ls-content-v1"]; // content saved in the browser before Firebase
const LEVEL_IDS = ["a1", "a2", "b1", "b2"];
const empty = () => ({ a1: [], a2: [], b1: [], b2: [] });
const emptyContent = () => ({ version: 2, stories: empty(), wordTopics: empty(), quizzes: empty() });

// Old shape (v1): stories that carried their own vocabulary + quiz -> new shape
function fromStoryMap(map) {
  const c = emptyContent();
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

// Built-in stories: put new ones here (v1 shape, see storyFiles/storydata.js)
export const builtIn = () => fromStoryMap({
  a1: [a1GreetingsStory, a2PersoenlicheInformationenStory],
  a2: [],
  b1: [],
  b2: [],
});

/* ---------- live copy of the database ---------- */
const initial = { content: emptyContent(), announcement: "", ready: false };
let state = initial;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

// Start listening (call when a user is logged in). Returns the stop function.
export function startContentSync() {
  const parts = { stories: [], wordTopics: [], quizzes: [] };
  let announcement = "";
  const loaded = new Set();

  const rebuild = () => {
    const content = emptyContent();
    COLS.forEach((col) => {
      [...parts[col]]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .forEach((x) => (content[col][x.level] || content[col].a1).push(x));
    });
    state = { content, announcement, ready: loaded.size === COLS.length + 1 };
    emit();
  };
  const fail = (key) => (err) => {
    console.error(`Firestore ${key}:`, err);
    loaded.add(key);
    rebuild();
  };

  const unsubs = COLS.map((col) =>
    onSnapshot(collection(db, col), (snap) => {
      parts[col] = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      loaded.add(col);
      rebuild();
    }, fail(col))
  );
  unsubs.push(
    onSnapshot(doc(db, "settings", "announcement"), (snap) => {
      announcement = snap.data()?.text || "";
      loaded.add("settings");
      rebuild();
    }, fail("settings"))
  );

  return () => {
    unsubs.forEach((u) => u());
    state = initial;
    emit();
  };
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
// Re-renders the caller whenever the content changes. Returns { content, announcement, ready }.
export const useContent = () => useSyncExternalStore(subscribe, () => state);

/* ---------- read ---------- */
export const getContent = () => state.content;
export const getStories = () => state.content.stories;
export const storiesOf = (level) => state.content.stories[level] || [];
export const findStory = (level, id) => storiesOf(level).find((s) => s.id === id);

export const wordTopicsOf = (level) => state.content.wordTopics[level] || [];
export const findWordTopic = (level, id) => wordTopicsOf(level).find((t) => t.id === id);
export const quizzesOf = (level) => state.content.quizzes[level] || [];
export const findQuiz = (level, id) => quizzesOf(level).find((q) => q.id === id);

// Words / quizzes that belong to a story (any level)
export const linkedWords = (storyId) =>
  LEVEL_IDS.flatMap((l) => wordTopicsOf(l)).filter((t) => t.storyId === storyId).flatMap((t) => t.words);
export const linkedQuizzes = (storyId) =>
  LEVEL_IDS.flatMap((l) => quizzesOf(l).filter((q) => q.storyId === storyId && q.questions?.length).map((q) => ({ ...q, level: l })));
export const linkedWordTopics = (storyId) =>
  LEVEL_IDS.flatMap((l) => wordTopicsOf(l).filter((t) => t.storyId === storyId && t.words?.length).map((t) => ({ ...t, level: l })));

export const getAnnouncement = () => state.announcement;

/* ---------- write (owner only, enforced by firestore.rules) ---------- */
// item needs "level" (a1..b2); its "id" becomes the document id
export function saveItem(col, { id, ...data }) {
  return setDoc(doc(db, col, id), { order: Date.now(), ...data });
}
export const removeItem = (col, id) => deleteDoc(doc(db, col, id));

export function setAnnouncement(text) {
  const ref = doc(db, "settings", "announcement");
  return text.trim() ? setDoc(ref, { text: text.trim() }) : deleteDoc(ref);
}

// Deletes all stories, word topics and quizzes, then writes "c" (v2 shape). Used by import, reset and migration.
export async function replaceAllContent(c) {
  const ops = [];
  for (const col of COLS) {
    const snap = await getDocs(collection(db, col));
    snap.docs.forEach((d) => ops.push((b) => b.delete(d.ref)));
    LEVEL_IDS.forEach((level) =>
      (c[col][level] || []).forEach(({ id, ...item }, order) =>
        ops.push((b) => b.set(doc(db, col, id), { ...item, level, order }))
      )
    );
  }
  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db);
    ops.slice(i, i + 450).forEach((op) => op(batch));
    await batch.commit();
  }
}

/* ---------- content saved in this browser before Firebase ---------- */
export function readLocalContent() {
  for (const k of LEGACY_KEYS) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) return normalizeContent(JSON.parse(raw));
    } catch { /* try next */ }
  }
  return null;
}
export function clearLocalContent() {
  try { LEGACY_KEYS.forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
}
