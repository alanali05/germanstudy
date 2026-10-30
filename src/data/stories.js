// Content store. Firestore is the only source of truth for content (there is no seed or copy in the code).
// Three Firestore collections, one document per item, each with "lang" (de, en) and "level" (a1, a2, b1, b2):
//   stories     – texts to read  { title, titleKu, segments: [{ text, ku }], … }
//   wordTopics  – word lists     { title, titleKu, storyId?, words: [...] }
//   quizzes     – question sets  { title, titleKu, storyId?, questions: [...] }
// plus settings/announcement { text }. Field names: see contentShape.js (old German-only documents are converted on load).
// "storyId" is optional: it links a topic/quiz to a story (its words become tappable there).
// startContentSync() keeps a live in-memory copy grouped by language, then level: content.de.stories.a1 = [...].
import { useSyncExternalStore } from "react";
import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { bundleToDocs } from "./storyBundle";
import { toNewShape } from "./contentShape";
import { LEARN_LANGS } from "./languages";

const COLS = ["stories", "wordTopics", "quizzes"];
const LEVEL_IDS = ["a1", "a2", "b1", "b2"];
const empty = () => ({ a1: [], a2: [], b1: [], b2: [] });
const emptyLibrary = () => ({ stories: empty(), wordTopics: empty(), quizzes: empty() });
const emptyContent = () => Object.fromEntries(LEARN_LANGS.map((l) => [l, emptyLibrary()]));

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
        .forEach((x) => {
          const lib = content[x.lang] || content.de;
          (lib[col][x.level] || lib[col].a1).push(x);
        });
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
      parts[col] = snap.docs.map((d) => ({ ...toNewShape(col, d.data()), id: d.id }));
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
// Getters for one language's library (student pages get it from useLibrary(), bound to their learning language)
export function libraryOf(content, lang) {
  const lib = content[lang] || content.de;
  const storiesOf = (level) => lib.stories[level] || [];
  const wordTopicsOf = (level) => lib.wordTopics[level] || [];
  const quizzesOf = (level) => lib.quizzes[level] || [];
  const every = (col) => LEVEL_IDS.flatMap((l) => (lib[col][l] || []).map((x) => ({ ...x, level: l })));
  return {
    all: { stories: every("stories"), wordTopics: every("wordTopics"), quizzes: every("quizzes") },
    storiesOf,
    findStory: (level, id) => storiesOf(level).find((s) => s.id === id),
    wordTopicsOf,
    findWordTopic: (level, id) => wordTopicsOf(level).find((t) => t.id === id),
    quizzesOf,
    findQuiz: (level, id) => quizzesOf(level).find((q) => q.id === id),
    // Words / quizzes that belong to a story (any level)
    linkedWords: (storyId) => every("wordTopics").filter((t) => t.storyId === storyId).flatMap((t) => t.words),
    linkedQuizzes: (storyId) => every("quizzes").filter((q) => q.storyId === storyId && q.questions?.length),
    linkedWordTopics: (storyId) => every("wordTopics").filter((t) => t.storyId === storyId && t.words?.length),
  };
}

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

// Deletes a story together with every word list and quiz linked to it (in any language)
export async function deleteBundle(storyId) {
  const batch = writeBatch(db);
  batch.delete(doc(db, "stories", storyId));
  for (const col of ["wordTopics", "quizzes"]) {
    LEARN_LANGS.forEach((lang) => LEVEL_IDS.forEach((l) =>
      state.content[lang][col][l].filter((x) => x.storyId === storyId).forEach((x) => batch.delete(doc(db, col, x.id)))));
  }
  await batch.commit();
}

export function setAnnouncement(text) {
  const ref = doc(db, "settings", "announcement");
  return text.trim() ? setDoc(ref, { text: text.trim() }) : deleteDoc(ref);
}
