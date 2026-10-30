export const APP_NAME = "LinguaSchool"; // change to your school app name
export const SPEECH_LANGS = { de: "de-DE", en: "en-GB" }; // read-aloud voice per learning language

// Firebase Auth user of the teacher. Must match OWNER_UID in firestore.rules.
export const OWNER_UID = "QNlSQxU7L6R9TN8hzzAtoFcm4tf1";
// A login code becomes the hidden Firebase account: <code lowercase>@CODE_EMAIL_DOMAIN, password = code
export const CODE_EMAIL_DOMAIN = "linguaschool.app";
