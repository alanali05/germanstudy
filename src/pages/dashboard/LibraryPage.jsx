import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Plus } from "lucide-react";
import { LANG_NAME, LEARN_LANGS } from "../../data/languages";
import { levels } from "../../data/levels";
import { useContent } from "../../data/stories";
import { LEVEL_IDS, loadBundle, storyHealth } from "../../data/storyBundle";
import { useTr } from "./bi";
import { SearchBox } from "./ui";
import LibraryCard from "./LibraryCard";

// Geschichten: the German or the English library (switch at the top), every story as a card
// (cover, level, what is missing); filter by level, search by title
export default function LibraryPage() {
  const tr = useTr();
  const { content } = useContent();
  const { library, setLibrary } = useOutletContext();
  const [level, setLevel] = useState("all");
  const [q, setQ] = useState("");
  const lib = content[library];
  const stories = LEVEL_IDS.flatMap((l) => lib.stories[l].map((s) => ({ ...s, level: l })));
  const query = q.trim().toLowerCase();
  const shown = stories.filter((s) => (level === "all" || s.level === level) && `${s.title} ${s.titleKu || ""}`.toLowerCase().includes(query));
  const filters = [["all", tr("Alle", "هەمی", "All"), stories.length], ...levels.map((l) => [l.id, l.title, lib.stories[l.id].length])];
  const count = (lang) => Object.values(content[lang].stories).flat().length;

  return (
    <>
      {/* Which learning language's stories are shown (and get created) */}
      <div role="group" aria-label={tr("Bibliothek", "کتێبخانە", "Library")} className="mb-5 inline-flex rounded-xl bg-soft p-1 font-semibold">{/* KU: review */}
        {LEARN_LANGS.map((l) => (
          <button
            key={l} type="button" aria-pressed={library === l} onClick={() => setLibrary(l)}
            className={`min-h-10 rounded-lg px-4 transition ${library === l ? "bg-brand text-on-brand" : "text-muted hover:text-fg"}`}
          >
            {LANG_NAME[l]} · {count(l)}
          </button>
        ))}
      </div>

      {stories.length === 0 && (
        <p className="glass mb-6 rounded-2xl p-4 text-sm text-muted">
          {tr("Noch keine Geschichten. Erstelle die erste mit „Neue Geschichte“.", "هێشتا چ چیرۆک نینن. یا ئێکێ ب «چیرۆکا نوو» دروست بکە.", "No stories yet. Create the first one with “New story”.")}{/* KU: review */}
        </p>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div role="group" aria-label={tr("Niveau", "ئاست", "Level")} className="flex flex-wrap gap-2">
          {filters.map(([id, label, n]) => (
            <button
              key={id} type="button" aria-pressed={level === id} onClick={() => setLevel(id)}
              className={`min-h-10 rounded-full border px-4 text-sm font-bold ${level === id ? "border-brand bg-soft" : "border-line"}`}
            >
              {label} · {n}
            </button>
          ))}
        </div>
        <div className="min-w-56 flex-1"><SearchBox value={q} onChange={setQ} /></div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-4">
        <Link to={`stories/new?lang=${library}`} className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line font-bold text-link hover:border-brand">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-soft"><Plus size={24} /></span>
          {tr("Neue Geschichte", "چیرۆکا نوو", "New story")}
          <span className="text-sm font-semibold text-muted">{LANG_NAME[library]}</span>
        </Link>
        {shown.map((s) => <LibraryCard key={s.id} story={s} health={storyHealth(loadBundle(content, s.id).bundle)} />)}
      </div>
      {shown.length === 0 && stories.length > 0 && <p className="mt-6 text-muted">{tr("Keine Geschichten gefunden.", "چ چیرۆکەک نەهاتە دیتن.", "No stories found.")}</p>}
    </>
  );
}
