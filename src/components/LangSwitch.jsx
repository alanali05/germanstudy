import { useLang } from "../context/LangContext";

const options = [
  { id: "ku", label: "کوردی" },
  { id: "de", label: "Deutsch" },
];

export default function LangSwitch() {
  const { lang, setLang } = useLang();

  return (
    <div dir="ltr" role="group" aria-label="Language" className="inline-flex rounded-xl bg-soft p-1 text-sm font-semibold">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => setLang(o.id)}
          aria-pressed={lang === o.id}
          className={`rounded-lg px-3 py-1.5 transition ${
            lang === o.id ? "bg-brand text-on-brand" : "text-muted hover:text-fg"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
