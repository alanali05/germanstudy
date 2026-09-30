// Small owner settings (saved in this browser). Announcement is shown on the student home page.
const KEY = "ls-announcement-v1";
export function getAnnouncement() {
  try { return localStorage.getItem(KEY) || ""; } catch { return ""; }
}
export function setAnnouncement(text) {
  try { if (text.trim()) localStorage.setItem(KEY, text.trim()); else localStorage.removeItem(KEY); } catch { /* ignore */ }
}
