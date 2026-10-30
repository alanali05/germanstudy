// Dashboard texts are written inline in German, Kurdish (Badini, Arabic script) and English.
// tr(de, ku, en) = the text in the app language (the interface toggle). Texts defined outside components
// are [de, ku, en] triples: tr(...TRIPLE).
import { useLang } from "../../context/LangContext";

export const useTr = () => {
  const { lang } = useLang();
  return (de, ku, en) => ({ de, ku, en })[lang] ?? de;
};

// The "leave with unsaved changes?" question, for useConfirm() (context/ConfirmContext)
export const LEAVE = (tr) => ({
  title: tr("Änderungen verwerfen?", "گوهۆڕینان ژێ ببەی؟", "Discard changes?"), // KU: review
  text: tr("Was du nicht gespeichert hast, geht verloren.", "ئەوا تە نەپاراستی دێ ژ دەست چیت.", "Anything you haven't saved will be lost."), // KU: review
  ok: tr("Verwerfen", "ژێ ببە", "Discard"), // KU: review
  danger: true,
});

// A text that names the story's learning language: byLang(lang, [de, ku, en] for German, [de, ku, en] for English)
export const byLang = (lang, german, english) => (lang === "en" ? english : german);

export const OPT =["(optional)", "(ڤەبژارتی)", "(optional)"];
// Messages for <Msg>: { ok, text } or { ok, de, ku, en }
export const SAVE_FAIL = { ok: false, de: "Speichern fehlgeschlagen. Prüfe die Internetverbindung.", ku: "پاراستن سەرنەکەفت. پەیوەندیا ئینتەرنێتێ بپشکنە.", en: "Saving failed. Check the internet connection." };
export const WAIT = { ok: true, de: "Bitte warten…", ku: "تکایە چاڤەڕێ بکە…", en: "Please wait…" };
export const UPLOAD_FAIL = { ok: false, de: "Hochladen fehlgeschlagen. Bitte erneut versuchen.", ku: "بارکرنا وێنەی سەرنەکەفت. دیسا هەول بدە.", en: "Upload failed. Please try again." };
export const NOT_IMAGE = { ok: false, de: "Bitte wähle eine Bilddatei.", ku: "تکایە فایلەکێ وێنە هەلبژێرە.", en: "Please choose an image file." };
