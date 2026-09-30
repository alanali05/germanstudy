import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";
import { useLang } from "../context/LangContext";
import { speak, stopSpeaking } from "../utils/speak";
import { linkedWords } from "../data/stories";

export default function StoryReader({ story }) {
  const { t } = useLang();
  const [showKu, setShowKu] = useState(true);
  const [active, setActive] = useState(null); // the word that was clicked
  const [playing, setPlaying] = useState(false);

  // Map: german word or phrase (lowercase) -> vocabulary entry, plus one regex that finds them all
  const { vocab, matcher } = useMemo(() => {
    const map = new Map();
    linkedWords(story.id).forEach((v) => {
      const key = v.wordDe.trim().toLowerCase();
      if (key && !map.has(key)) map.set(key, v);
    });
    const alts = [...map.keys()]
      .sort((a, b) => b.length - a.length) // longest first, so "Guten Morgen" wins over "Guten"
      .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"));
    const re = alts.length ? new RegExp(`(?<![\\p{L}\\p{N}])(${alts.join("|")})(?![\\p{L}\\p{N}])`, "giu") : null;
    return { vocab: map, matcher: re };
  }, [story]);

  // Stop the voice when the student leaves the page
  useEffect(() => () => stopSpeaking(), []);

  // Escape closes the word card
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleListen = () => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
    } else {
      setPlaying(true);
      speak(story.segments.map((s) => s.de).join(" "), () => setPlaying(false));
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button onClick={toggleListen} className="btn-primary inline-flex items-center gap-2 px-5 py-3">
          <Icon name={playing ? "stop" : "volume"} size={18} />
          {playing ? t("common.stop") : t("common.listen")}
        </button>
        <button onClick={() => setShowKu((v) => !v)} className="btn-ghost px-5 py-3 text-sm">
          {showKu ? t("story.hideKu") : t("story.showKu")}
        </button>
      </div>

      <p className="mb-4 text-sm text-muted">{t("story.tapHint")}</p>

      <article className="paper rounded-2xl p-5 shadow-sm sm:p-10">
        {story.segments.map((seg, i) => (
          <div key={i} className="border-b border-line py-4 last:border-b-0">
            {/* German sentence, every word with a meaning is clickable */}
            <p dir="ltr" lang="de" className="font-display text-xl leading-9 sm:text-2xl sm:leading-10">
              {(matcher ? seg.de.split(matcher) : [seg.de]).map((part, j) => {
                if (j % 2 === 0) return <span key={j}>{part}</span>;
                const entry = vocab.get(part.toLowerCase().replace(/\s+/g, " "));
                if (!entry) return <span key={j}>{part}</span>;
                return (
                  <button
                    key={j}
                    type="button"
                    className="tap-word"
                    aria-pressed={active === entry}
                    onClick={() => setActive((a) => (a === entry ? null : entry))}
                  >
                    {part}
                  </button>
                );
              })}
            </p>

            {showKu && (
              <p dir="rtl" lang="ku" className="mt-1 text-right text-lg leading-8 text-muted">
                {seg.ku}
              </p>
            )}
          </div>
        ))}
      </article>

      {/* Meaning card: rendered on <body>, so no parent (animation, transform) can push it to the bottom of the page */}
      {active &&
        createPortal(
          <div role="dialog" aria-label={active.wordDe} className="meaning-card">
            <div className="flex items-start gap-3">
              <div dir="ltr" lang="de" className="flex flex-wrap items-center gap-3">
                <span className="font-display text-3xl font-extrabold">{active.wordDe}</span>
                <button onClick={() => speak(active.wordDe)} aria-label={t("common.listen")} className="btn-ghost p-2 text-muted hover:text-fg">
                  <Icon name="volume" size={18} />
                </button>
              </div>
              <button onClick={() => setActive(null)} aria-label={t("common.close")} className="ms-auto p-1 text-muted hover:text-fg">
                <Icon name="close" size={22} />
              </button>
            </div>

            <p dir="rtl" lang="ku" className="mt-3 text-right text-2xl font-bold" style={{ color: "var(--link)" }}>
              {active.wordKu}
            </p>

            {(active.sentenceDe || active.sentenceKu) && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="mb-2 text-sm text-muted">{t("word.example")}</p>
                <p dir="ltr" lang="de" className="text-fg">{active.sentenceDe}</p>
                <p dir="rtl" lang="ku" className="mt-1 text-right text-muted">{active.sentenceKu}</p>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
