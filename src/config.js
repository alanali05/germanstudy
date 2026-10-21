export const APP_NAME = "LinguaSchool"; // change to your school app name
export const SPEECH_LANG = "de-DE";     // language used for the "Listen" buttons

// Firebase Auth user of the teacher. Must match OWNER_UID in firestore.rules.
export const OWNER_UID = "QNlSQxU7L6R9TN8hzzAtoFcm4tf1";
// Public address of the R2 image bucket (same value as R2_PUBLIC_BASE_URL). Not secret.
// Built-in story covers live at IMAGES_URL/covers/<story id>.jpg; the Dashboard moves any other cover here.
export const IMAGES_URL = "https://pub-57b48f8135d3481f9102f01e816f5594.r2.dev";
// A login code becomes the hidden Firebase account: <code lowercase>@CODE_EMAIL_DOMAIN, password = code
export const CODE_EMAIL_DOMAIN = "linguaschool.app";
