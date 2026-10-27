// Dashboard texts are German + Kurdish (Badini, Arabic script) pairs. No English.
// bi(de, ku) = the text in the app language (the DE/KU switch). Texts defined outside components
// are [de, ku] pairs: bi(...PAIR).
import { useLang } from "../../context/LangContext";

export const useBi = () => {
  const { lang } = useLang();
  return (de, ku) => (lang === "de" ? de : ku);
};

export const OPT = ["(optional)", "(ڤەبژارتی)"];
// Messages for <Msg>: { ok, text } or { ok, de, ku }
export const SAVE_FAIL = { ok: false, de: "Speichern fehlgeschlagen. Prüfe die Internetverbindung.", ku: "پاراستن سەرنەکەفت. پەیوەندیا ئینتەرنێتێ بپشکنە." };
export const WAIT = { ok: true, de: "Bitte warten…", ku: "تکایە چاڤەڕێ بکە…" };
export const UPLOAD_FAIL = { ok: false, de: "Hochladen fehlgeschlagen. Bitte erneut versuchen.", ku: "بارکرنا وێنەی سەرنەکەفت. دیسا هەول بدە." };
export const NOT_IMAGE = { ok: false, de: "Bitte wähle eine Bilddatei.", ku: "تکایە فایلەکێ وێنە هەلبژێرە." };
