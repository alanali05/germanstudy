import { Link } from "react-router-dom";
import LevelBadge from "../../components/LevelBadge";
import { getLevel } from "../../data/levels";
import { useBi } from "./bi";

// Green = there, orange = missing (text stays in the normal text colour for contrast)
function Chip({ ok, children }) {
  return (
    <span
      className="rounded-md px-2 py-0.5 text-xs font-semibold"
      style={ok ? { background: "var(--okbg)", color: "var(--ok)" } : { background: "color-mix(in srgb, #fb923c 18%, transparent)", color: "var(--fg)" }}
    >
      {children}
    </span>
  );
}

// One story in the library: cover, level, titles, and chips that show what is there and what is missing
export default function LibraryCard({ story, health }) {
  const bi = useBi();
  const level = getLevel(story.level);
  const { sentences, missingKu, words, questions } = health;
  return (
    <Link to={`stories/${story.id}`} className="glass flex flex-col overflow-hidden rounded-2xl transition hover:border-brand">
      {story.coverImage
        ? <img src={story.coverImage} alt="" loading="lazy" className="h-28 w-full object-cover" />
        : <span aria-hidden="true" className="h-28" style={{ background: `color-mix(in srgb, ${level.color} 18%, var(--card))` }} />}
      <span className="flex flex-1 flex-col gap-1.5 p-3.5">
        <LevelBadge level={level} />
        <span className="font-bold leading-snug" lang="de" dir="ltr">{story.titleDe}</span>
        {story.titleKu && <span lang="ku" dir="rtl" className="text-sm text-muted">{story.titleKu}</span>}
        <span className="mt-auto flex flex-wrap gap-1.5 pt-1">
          <Chip ok={sentences > 0}>{sentences > 0 ? bi(`✓ ${sentences} Sätze`, `✓ ${sentences} رستە`) : bi("Keine Sätze", "چ رستە نینن")}</Chip>
          {missingKu > 0 && <Chip>{bi(`${missingKu} ohne Übersetzung`, `${missingKu} بێ وەرگێڕان`)}</Chip>}{/* KU: review */}
          <Chip ok={words > 0}>{words > 0 ? bi(`✓ ${words} Wörter`, `✓ ${words} وشە`) : bi("Wörter fehlen", "وشە نینن")}</Chip>{/* KU: review */}
          <Chip ok={questions > 0}>{questions > 0 ? bi(`✓ ${questions} Fragen`, `✓ ${questions} پرسیار`) : bi("Quiz fehlt", "کویز نینە")}</Chip>{/* KU: review */}
        </span>
      </span>
    </Link>
  );
}
