// Content store. Firestore is the only source of truth for content (there is no seed or copy in the code).
// Three Firestore collections, one document per item, each with a "level" field (a1, a2, b1, b2):
//   stories     – texts to read
//   wordTopics  – word lists   { titleDe, titleKu, storyId?, words: [...] }
//   quizzes     – question sets { titleDe, titleKu, storyId?, questions: [...] }
// plus settings/announcement { text }.
// "storyId" is optional: it links a topic/quiz to a story (its words become tappable there).
// startContentSync() keeps a live in-memory copy (grouped by level, like before), so the getters below stay synchronous.
import { useSyncExternalStore } from "react";
import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { bundleToDocs } from "./storyBundle";

const COLS = ["stories", "wordTopics", "quizzes"];
const LEVEL_IDS = ["a1", "a2", "b1", "b2"];
const empty = () => ({ a1: [], a2: [], b1: [], b2: [] });
const emptyContent = () => ({ stories: empty(), wordTopics: empty(), quizzes: empty() });

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

export function setAnnouncement(text) {
  const ref = doc(db, "settings", "announcement");
  return text.trim() ? setDoc(ref, { text: text.trim() }) : deleteDoc(ref);
}
