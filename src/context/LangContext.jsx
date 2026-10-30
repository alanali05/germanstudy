import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { dict } from "../i18n";

const LangContext = createContext(null);
const ALL = ["ku", "de", "en"];

// Interface language: ku | de | en. Which of them a user may pick is set by AuthContext (setAllowed):
// students get Kurdish + their learning language, the owner all three, logged-out visitors all three.
// If the chosen language isn't allowed (e.g. the student now learns English but the interface was German),
// the learning language is used instead (or Kurdish if Kurdish was chosen).
export function LangProvider({ children }) {
  const [chosen, setLang] = useState(() => {
    try {
      return localStorage.getItem("lang") || "ku";
    } catch {
      return "ku";
    }
  });
  const [allowed, setAllowedState] = useState(ALL);
  const setAllowed = useCallback((list) => setAllowedState(list || ALL), []);
  const lang = allowed.includes(chosen) ? chosen : allowed.find((l) => l !== "ku") || "ku";

  // Kurdish (Arabic script) is right-to-left
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ku" ? "rtl" : "ltr";
    try {
      localStorage.setItem("lang", lang);
    } catch { /* storage blocked: the choice just isn't remembered */ }
  }, [lang]);

  const t = (key, vars = {}) => {
    const entry = dict[key];
    let text = entry ? entry[lang] ?? entry.de : key;
    for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
    return text;
  };

  // Like t(), but uses the ".one" text when n is 1
  const tn = (key, n) => t(n === 1 && dict[`${key}.one`] ? `${key}.one` : key, { n });

  return <LangContext.Provider value={{ lang, setLang, allowed, setAllowed, t, tn }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
