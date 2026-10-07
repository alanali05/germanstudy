// The announcement (shown on the student home page) lives in Firestore: settings/announcement.
// It is synced together with the content, see data/stories.js.
export { getAnnouncement, setAnnouncement } from "./stories";
