import { createContext, useContext, useEffect, useState } from "react";
import { dict } from "../i18n";

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem("lang") || "ku";
    } catch {
      return "ku";
    }
  });

  // Kurdish (Arabic script) is right-to-left
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ku" ? "rtl" : "ltr";
    try {
      localStorage.setItem("lang", lang);
    } catch {}
  }, [lang]);

  const t = (key, vars = {}) => {
    const entry = dict[key];
    let text = entry ? entry[lang] ?? entry.de : key;
    for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
    return text;
  };

  // Like t(), but uses the ".one" text when n is 1
  const tn = (key, n) => t(n === 1 && dict[`${key}.one`] ? `${key}.one` : key, { n });

  return <LangContext.Provider value={{ lang, setLang, t, tn }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
