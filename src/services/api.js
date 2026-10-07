import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { codeToEmail } from "../data/students";
import { OWNER_UID } from "../config";

const fail = (code) => Object.assign(new Error(code), { code });
const INVALID = ["auth/invalid-credential", "auth/invalid-email", "auth/user-not-found", "auth/wrong-password", "auth/missing-password", "auth/user-disabled"];

// Logs in with a student code. On success AuthContext picks the user up (onAuthStateChanged).
// Throws { code: "INVALID_CODE" | "TOO_MANY" | "NETWORK" | firebase code }.
export async function loginWithCode(rawCode) {
  const code = rawCode.trim().toUpperCase();
  let cred;
  try {
    cred = await signInWithEmailAndPassword(auth, codeToEmail(code), code);
  } catch (err) {
    if (INVALID.includes(err.code)) throw fail("INVALID_CODE");
    if (err.code === "auth/too-many-requests") throw fail("TOO_MANY");
    if (err.code === "auth/network-request-failed") throw fail("NETWORK");
    throw err;
  }
  // The owner deleted this student: the account exists but has no profile any more
  if (cred.user.uid !== OWNER_UID && !(await getDoc(doc(db, "students", cred.user.uid))).exists()) {
    await signOut(auth);
    throw fail("INVALID_CODE");
  }
}
