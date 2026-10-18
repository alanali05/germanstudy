// Students live in Firestore: students/{uid} = { code, name, className, level: "A1".."B2" }.
// Each student is also a Firebase Auth account: email <code>@CODE_EMAIL_DOMAIN, password = code.
// The owner is the Auth user OWNER_UID (see config.js and firestore.rules).
import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, inMemoryPersistence, initializeAuth, signOut } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { db, firebaseConfig } from "../lib/firebase";
import { CODE_EMAIL_DOMAIN, OWNER_UID } from "../config";

export const codeToEmail = (code) => `${code.trim().toLowerCase()}@${CODE_EMAIL_DOMAIN}`;
const isOwner = (uid) => uid === OWNER_UID;

const newCode = (name) => {
  const first = name.trim().split(/\s+/)[0].toUpperCase().replace(/[^A-Z]/g, "") || "STU";
  return `${first}-${Math.floor(1000 + Math.random() * 9000)}`;
};

// Profile of a logged-in Firebase user, or null if this account is not a student (e.g. deleted by the owner)
export async function loadProfile(fbUser) {
  const { uid } = fbUser;
  const snap = await getDoc(doc(db, "students", uid));
  let data = snap.data();
  if (!data) {
    if (!isOwner(uid)) return null;
    // First owner login: create the owner's profile
    data = { code: fbUser.email.split("@")[0].toUpperCase(), name: "Teacher", className: "Owner", level: "B2" };
    await setDoc(doc(db, "students", uid), data);
  }
  const avatar = await getDoc(doc(db, "avatars", uid));
  return { ...data, uid, role: isOwner(uid) ? "owner" : "student", avatar: avatar.data()?.url || null };
}

// avatars/{uid} = { url } of the picture in R2 (uploaded by services/upload.js); null removes it
export function saveAvatar(uid, url) {
  const ref = doc(db, "avatars", uid);
  return url ? setDoc(ref, { url }) : deleteDoc(ref);
}

/* ---------- owner only ---------- */

// Live list of all students (without the owner), sorted by name
export function useStudents() {
  const [list, setList] = useState([]);
  useEffect(
    () =>
      onSnapshot(
        collection(db, "students"),
        (snap) => setList(
          snap.docs
            .filter((d) => !isOwner(d.id))
            .map((d) => ({ ...d.data(), uid: d.id }))
            .sort((a, b) => a.name.localeCompare(b.name))
        ),
        (err) => console.error("Firestore students:", err)
      ),
    []
  );
  return list;
}

// A second Firebase app, so creating a student account does not log the owner out
let creatorAuth;
const getCreatorAuth = () =>
  (creatorAuth ??= initializeAuth(initializeApp(firebaseConfig, "student-creator"), { persistence: inMemoryPersistence }));

// Creates the login account + profile. Pass "code" to keep an existing code, otherwise a new one is made.
// Returns the code.
export async function createStudent({ name, className, level }, code) {
  const auth = getCreatorAuth();
  for (let tries = 0; tries < 5; tries++) {
    const c = code || newCode(name);
    try {
      const cred = await createUserWithEmailAndPassword(auth, codeToEmail(c), c);
      await signOut(auth);
      await setDoc(doc(db, "students", cred.user.uid), { code: c, name, className, level });
      return c;
    } catch (err) {
      if (err.code === "auth/email-already-in-use" && !code) continue; // code taken, try another
      throw err;
    }
  }
  throw new Error("Could not find a free code");
}

export const updateStudent = (uid, data) => updateDoc(doc(db, "students", uid), data);

// Removes the profile, so the code stops working. The (now useless) Auth account stays;
// it can be deleted in the Firebase console under Authentication -> Users.
export async function deleteStudent(uid) {
  await deleteDoc(doc(db, "students", uid));
  await deleteDoc(doc(db, "avatars", uid));
}

/* ---------- students saved in this browser before Firebase ---------- */
const LEGACY_KEY = "ls-students-v1";
export function readLocalStudents() {
  try { return JSON.parse(localStorage.getItem(LEGACY_KEY)) || []; } catch { return []; }
}
export function clearLocalStudents() {
  try { localStorage.removeItem(LEGACY_KEY); } catch { /* ignore */ }
}
