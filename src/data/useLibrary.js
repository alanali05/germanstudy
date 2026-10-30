import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { LEARN_LANGS, learnLangOf } from "./languages";
import { libraryOf, useContent } from "./stories";

// Stories, words and quizzes of the logged-in user's learning language, plus that language ("de" | "en").
// Students always get their learning language. The owner gets the library of the language toggle
// (Deutsch / English; on Kurdish their profile's learning language), or ?lang=en / ?lang=de from the
// editor's "See it as a student" link.
export function useLibrary() {
  const { user } = useAuth();
  const { lang: uiLang } = useLang();
  const { content } = useContent();
  const [params] = useSearchParams();
  const pick = [params.get("lang"), uiLang].find((l) => LEARN_LANGS.includes(l));
  const lang = user?.role === "owner" && pick ? pick : learnLangOf(user);
  return { lang, ...libraryOf(content, lang) };
}
