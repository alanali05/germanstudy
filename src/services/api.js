import { getStudents } from "../data/students";

// TEMPORARY: checks the code in a local list (NOT safe).
// Later: replace the body with a fetch() to your backend.
export async function loginWithCode(rawCode) {
  const code = rawCode.trim().toUpperCase();
  await new Promise((r) => setTimeout(r, 500));

  const student = getStudents().find((s) => s.code === code);
  if (!student) throw Object.assign(new Error("INVALID_CODE"), { code: "INVALID_CODE" });

  return { student, token: "fake-token" };
}
