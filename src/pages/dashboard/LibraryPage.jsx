import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { levels } from "../../data/levels";
import { useContent } from "../../data/stories";
import { LEVEL_IDS, loadBundle, storyHealth } from "../../data/storyBundle";
import { useBi } from "./bi";
import { SearchBox } from "./ui";
import LibraryCard from "./LibraryCard";

// Geschichten: every story as a card (cover, level, what is missing); filter by level, search by title
export default function LibraryPage() {
  const bi = useBi();
  const { content } = useContent();
  const [level, setLevel] = useState("all");
  const [q, setQ] = useState("");
  const stories = LEVEL_IDS.flatMap((l) => content.stories[l].map((s) => ({ ...s, level: l })));
  const query = q.trim().toLowerCase();
  const shown = stories.filter((s) => (level === "all" || s.level === level) && `${s.titleDe} ${s.titleKu || ""}`.toLowerCase().includes(query));
  const filters = [["all", bi("Alle", "هەمی"), stories.length], ...levels.map((l) => [l.id, l.title, content.stories[l.id].length])];

  return (
    <>
      {stories.length === 0 && (
        <p className="glass mb-6 rounded-2xl p-4 text-sm text-muted">
          {bi("Noch keine Geschichten. Erstelle die erste mit „Neue Geschichte“.", "هێشتا چ چیرۆک نینن. یا ئێکێ ب «چیرۆکا نوو» دروست بکە.")}{/* KU: review */}
        </p>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div role="group" aria-label={bi("Niveau", "ئاست")} className="flex flex-wrap gap-2">
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
        <Link to="stories/new" className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line font-bold text-link hover:border-brand">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-soft"><Plus size={24} /></span>
          {bi("Neue Geschichte", "چیرۆکا نوو")}
        </Link>
        {shown.map((s) => <LibraryCard key={s.id} story={s} health={storyHealth(loadBundle(content, s.id).bundle)} />)}
      </div>
      {shown.length === 0 && stories.length > 0 && <p className="mt-6 text-muted">{bi("Keine Geschichten gefunden.", "چ چیرۆکەک نەهاتە دیتن.")}</p>}
    </>
  );
}
