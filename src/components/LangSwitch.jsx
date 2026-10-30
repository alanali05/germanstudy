import { useLang } from "../context/LangContext";
import { LANG_NAME } from "../data/languages";

// Interface language toggle: Kurdish + the learning language (the owner sees all three).
// full: stretch to the parent's width with equal buttons (the desktop sidebar).
export default function LangSwitch({ full = false }) {
  const { lang, setLang, allowed } = useLang();

  return (
    <div dir="ltr" role="group" aria-label="Language" className={`${full ? "flex w-full" : "inline-flex"} rounded-xl bg-soft p-1 text-sm font-semibold`}>
      {allowed.map((id) => (
        <button
          key={id}
          onClick={() => setLang(id)}
          aria-pressed={lang === id}
          className={`${full ? "flex-1" : ""} whitespace-nowrap rounded-lg px-3 py-1.5 transition ${
            lang === id ? "bg-brand text-on-brand" : "text-muted hover:text-fg"
          }`}
        >
          {LANG_NAME[id]}
        </button>
      ))}
    </div>
  );
}
