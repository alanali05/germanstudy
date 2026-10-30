import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";
import { useLang } from "../context/LangContext";
import { speak, stopSpeaking } from "../utils/speak";

const scrollBehavior = () => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");

// story: the story; words: its vocabulary (tappable in the text); lang: the learning language ("de" | "en")
export default function StoryReader({ story, words, lang }) {
  const { t } = useLang();
  const segs = story.segments;
  const [showKu, setShowKu] = useState(true);
  const [active, setActive] = useState(null); // the word that was clicked
  // Reading aloud goes sentence by sentence: current = index of the sentence being read (null = reader off)
  const [current, setCurrent] = useState(null);
  const [playing, setPlaying] = useState(false);
  const run = useRef(0); // bumped on every start/stop, so the end of an old sentence can't start the next one
  const segRefs = useRef([]);
  const controlsRef = useRef(null);
  const [controlsInView, setControlsInView] = useState(true);

  // Map: word or phrase in the learning language (lowercase) -> vocabulary entry, plus one regex that finds them all
  const { vocab, matcher } = useMemo(() => {
    const map = new Map();
    words.forEach((v) => {
      const key = v.word.trim().toLowerCase();
      if (key && !map.has(key)) map.set(key, v);
    });
    const alts = [...map.keys()]
      .sort((a, b) => b.length - a.length) // longest first, so "Guten Morgen" wins over "Guten"
      .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"));
    const re = alts.length ? new RegExp(`(?<![\\p{L}\\p{N}])(${alts.join("|")})(?![\\p{L}\\p{N}])`, "giu") : null;
    return { vocab: map, matcher: re };
  }, [words]);

  // Stop the voice when the student leaves the page
  useEffect(() => {
    const r = run;
    return () => { r.current++; stopSpeaking(); };
  }, []);

  // The floating controls appear once the normal ones are scrolled out of view
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setControlsInView(e.isIntersecting));
    io.observe(controlsRef.current);
    return () => io.disconnect();
  }, []);

  // Keep the sentence being read on screen (above the floating controls and the phone tab bar)
  useEffect(() => {
    const el = playing && current !== null ? segRefs.current[current] : null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight - 180) el.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
  }, [current, playing]);

  // Escape closes the word card
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Nearest sentence with German text from i on, going forward (step 1) or back (-1); -1 if there is none
  const findSentence = (i, step) => {
    while (i >= 0 && i < segs.length && !segs[i].text?.trim()) i += step;
    return i >= 0 && i < segs.length ? i : -1;
  };
  const stop = () => {
    run.current++;
    stopSpeaking();
    setPlaying(false);
    setCurrent(null);
  };
  const pause = () => {
    run.current++;
    stopSpeaking();
    setPlaying(false);
  };
  // Reads sentence i, then goes on with the next one until the end
  const readFrom = (start) => {
    const i = findSentence(start, 1);
    if (i < 0) return stop();
    const id = ++run.current;
    setCurrent(i);
    setPlaying(true);
    speak(segs[i].text, lang, () => { if (run.current === id) readFrom(i + 1); });
  };
  const toggleListen = () => (current === null ? readFrom(0) : playing ? pause() : readFrom(current));
  const prev = () => readFrom(Math.max(0, findSentence(current - 1, -1)));
  const next = () => readFrom(current + 1);
  const mainLabel = current === null ? t("common.listen") : playing ? t("common.pause") : t("common.resume");
  const mainIcon = playing ? "pause" : current === null ? "volume" : "play";

  return (
    <div>
      <div ref={controlsRef} className="mb-4 flex flex-wrap items-center gap-3">
        <button onClick={toggleListen} className="btn-primary inline-flex items-center gap-2 px-5 py-3">
          <Icon name={mainIcon} size={18} />
          {mainLabel}
        </button>
        {current !== null && (
          <button onClick={stop} className="btn-ghost inline-flex items-center gap-2 px-5 py-3 text-sm">
            <Icon name="stop" size={16} /> {t("common.stop")}
          </button>
        )}
        <button onClick={() => setShowKu((v) => !v)} className="btn-ghost px-5 py-3 text-sm">
          {showKu ? t("story.hideKu") : t("story.showKu")}
        </button>
      </div>

      <p className="mb-4 text-sm text-muted">{t("story.tapHint")}</p>

      <article className="paper rounded-2xl p-5 shadow-sm sm:p-10">
        {segs.map((seg, i) => (
          <div
            key={i} ref={(el) => { segRefs.current[i] = el; }} aria-current={i === current ? "true" : undefined}
            className={`seg -mx-3 border-b border-line px-3 py-4 last:border-b-0 ${i === current ? "seg-reading" : ""}`}
          >
            {/* German sentence, every word with a meaning is clickable */}
            <p dir="ltr" lang={lang} className="font-display text-xl leading-9 sm:text-2xl sm:leading-10">
              {(matcher ? seg.text.split(matcher) : [seg.text]).map((part, j) => {
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

      {/* Floating reader controls while reading and the normal ones are out of view (hidden while a word card is open,
          which sits in the same place). On <body>, like the meaning card below. Media buttons keep their order in RTL. */}
      {current !== null && !controlsInView && !active &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 lg:bottom-6 lg:ps-72">
            <div role="toolbar" aria-label={t("common.listen")} dir="ltr" className="reader-float pointer-events-auto flex items-center gap-1 rounded-full p-1.5">
              <button onClick={prev} aria-label={t("reader.prev")} className="grid h-11 w-11 place-items-center rounded-full text-muted hover:bg-soft hover:text-fg">
                <Icon name="prev" size={18} />
              </button>
              <button onClick={toggleListen} aria-label={mainLabel} className="btn-primary grid h-12 w-12 place-items-center !rounded-full">
                <Icon name={playing ? "pause" : "play"} size={20} />
              </button>
              <button onClick={next} aria-label={t("reader.next")} className="grid h-11 w-11 place-items-center rounded-full text-muted hover:bg-soft hover:text-fg">
                <Icon name="next" size={18} />
              </button>
              <span aria-label={t("reader.sentence", { i: current + 1, n: segs.length })} className="px-2 text-sm font-semibold tabular-nums text-muted">
                {current + 1}/{segs.length}
              </span>
              <button onClick={stop} aria-label={t("common.stop")} className="grid h-11 w-11 place-items-center rounded-full text-muted hover:bg-soft hover:text-fg">
                <Icon name="close" size={18} />
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* Meaning card: rendered on <body>, so no parent (animation, transform) can push it to the bottom of the page */}
      {active &&
        createPortal(
          <div role="dialog" aria-label={active.word} className="meaning-card">
            <div className="flex items-start gap-3">
              <div dir="ltr" lang={lang} className="flex flex-wrap items-center gap-3">
                <span className="font-display text-3xl font-extrabold">{active.word}</span>
                <button onClick={() => speak(active.word, lang)} aria-label={t("common.listen")} className="btn-ghost p-2 text-muted hover:text-fg">
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

            {(active.sentence || active.sentenceKu) && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="mb-2 text-sm text-muted">{t("word.example")}</p>
                <p dir="ltr" lang={lang} className="text-fg">{active.sentence}</p>
                <p dir="rtl" lang="ku" className="mt-1 text-right text-muted">{active.sentenceKu}</p>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
