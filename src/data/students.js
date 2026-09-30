// TEMPORARY test students + one OWNER code (change OWNER-2026!). Later these live in the database (backend).
export const students = [
  { code: "OWNER-2026", name: "Teacher", className: "Owner", level: "B2", role: "owner" },
];

const KEY = "ls-students-v1";
// Students the owner adds in the dashboard (stored in this browser for now)
export function getCustomStudents() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
export function saveCustomStudents(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
}
export const getStudents = () => [...students, ...getCustomStudents()];
