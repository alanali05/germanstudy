import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { useConfirm } from "../../../context/ConfirmContext";
import { parsePairs } from "../../../data/storyBundle";
import { byLang, useTr } from "../bi";

// Example lines, shown under the rule and as the box's placeholder
const EXAMPLE = {
  sentences: {
    de: "Guten Morgen, wie geht es dir? || سپێدە باش، تو یێ چەوانی؟\nMir geht es gut, danke. || ئەزێ باشم، سپاس.",
    en: "Good morning, how are you? || سپێدە باش، تو یێ چەوانی؟\nI'm fine, thanks. || ئەزێ باشم، سپاس.",
  },
  words: {
    de: "der Morgen || سپێدە\ndanke || سپاس",
    en: "morning || سپێدە\nthanks || سپاس",
  },
};
// The box and its marking layer share this padding; the start side leaves room for the line numbers
const PAD = { padding: "0.7rem 0.85rem", paddingInlineStart: "3rem" };

// Paste many sentences or words at once, one per line: "text || Kurdish".
// Lines that break the rule are marked red (with the reason below) and nothing can be added until they are fixed.
// kind = "sentences" | "words"; onDone(rows, replace) gets [{ line, left, right }].
export default function BulkPaste({ kind, lang, hasRows, onDone, onCancel }) {
  const tr = useTr();
  const confirm = useConfirm();
  const [text, setText] = useState("");
  const box = useRef(null);
  const marks = useRef(null);
  const { rows, errors } = parsePairs(text);
  const bad = new Map(errors.map((e) => [e.line, e.kind]));
  const ready = rows.length > 0 && errors.length === 0;
  const target = byLang(lang, ["Deutsch", "ئەلمانی", "German"], ["Englisch", "ئینگلیزی", "English"]);
  const noun = kind === "words"
    ? (n) => tr(`${n} Wörter`, `${n} وشە`, n === 1 ? "1 word" : `${n} words`)
    : (n) => tr(`${n} Sätze`, `${n} رستە`, n === 1 ? "1 sentence" : `${n} sentences`);

  const reason = (k) => ({
    missing: tr("|| fehlt", "|| نینە", "|| is missing"),
    many: tr("Mehr als ein ||", "زێدەتر ژ ئێک ||", "More than one ||"),
    emptyTarget: tr(`Kein ${target[0]} vor ||`, `چ ${target[1]} بەری || نینە`, `No ${target[2]} before ||`),
    emptyKu: tr("Kein Kurdisch nach ||", "چ کوردی پشتی || نینە", "No Kurdish after ||"),
    swapped: tr(`Kurdisch steht vorne: zuerst ${target[0]}, dann ||, dann Kurdisch`, `کوردی ل پێشیێ یە: پێشی ${target[1]}، پاشان ||، پاشان کوردی`, `Kurdish comes first: write ${target[2]}, then ||, then Kurdish`),
    targetScript: tr("Kurdische Buchstaben vor ||", "پیتێن کوردی بەری ||", "Kurdish letters before ||"),
    kuScript: tr("Keine kurdischen Buchstaben nach ||", "پیتێن کوردی پشتی || نینن", "No Kurdish letters after ||"),
  })[k]; // KU: review

  // The box grows with the text, so the marking layer behind it never has to scroll.
  // Refit when the width changes or the web fonts have loaded.
  const fit = () => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
  };
  useLayoutEffect(fit, [text]);
  useEffect(() => {
    let width = 0;
    const ro = new ResizeObserver(([e]) => {
      if (e.contentRect.width !== width) { width = e.contentRect.width; fit(); }
    });
    ro.observe(box.current);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, []);

  // Jump to a bad line and select it
  const goTo = (line) => {
    marks.current.children[line - 1]?.scrollIntoView({ block: "center", behavior: "smooth" });
    const lines = text.split("\n");
    const start = lines.slice(0, line - 1).reduce((n, l) => n + l.length + 1, 0);
    box.current.focus({ preventScroll: true });
    box.current.setSelectionRange(start, start + lines[line - 1].length);
  };

  const replace = async () => {
    const ok = await confirm({
      title: kind === "words"
        ? tr("Alle vorhandenen Wörter ersetzen?", "هەمی وشێن هەین بگوهۆڕی؟", "Replace all existing words?")
        : tr("Alle vorhandenen Sätze ersetzen?", "هەمی رستێن هەین بگوهۆڕی؟", "Replace all existing sentences?"), // KU: review
      ok: tr("Ersetzen", "بگوهۆڕە", "Replace"), // KU: review
      danger: true,
    });
    if (ok) onDone(rows, true);
  };

  return (
    <div className="mb-5 rounded-xl border border-dashed p-4" style={{ borderColor: "var(--brand)" }}>
      <p className="font-semibold">
        {tr(
          `Eine Zeile pro ${kind === "words" ? "Wort" : "Satz"}: zuerst ${target[0]}, dann ||, dann die kurdische Übersetzung.`,
          `هەر ${kind === "words" ? "وشەیەک" : "رستەیەک"} د رێزەکێ دا: پێشی ${target[1]}، پاشان ||، پاشان وەرگێڕانا کوردی.`,
          `One ${kind === "words" ? "word" : "sentence"} per line: ${target[2]} first, then ||, then the Kurdish translation.`,
        )}{/* KU: review */}
      </p>
      {kind === "words" && (
        <p className="mt-1 text-sm text-muted">
          {tr("Der Beispielsatz kommt automatisch aus den Sätzen der Geschichte.", "رستەیا نمونە ب خۆ ژ رستێن چیرۆکێ دهێتە وەرگرتن.", "The example sentence is taken from the story's sentences automatically.")}{/* KU: review */}
        </p>
      )}
      <pre dir="ltr" lang={lang} className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-soft px-3 py-2 font-sans text-sm text-muted">
        {tr("Beispiel:", "نمونە:", "Example:")}{"\n"}{EXAMPLE[kind][lang]}
      </pre>

      <div className="relative mt-3">
        {/* Marking layer: the same lines as the box, with line numbers and bad lines in red */}
        <div ref={marks} aria-hidden dir="ltr" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[0.7rem] border border-transparent bg-[var(--bg)]" style={PAD}>
          {text.split("\n").map((l, i) => (
            <div key={i} className="relative whitespace-pre-wrap break-words" style={bad.has(i + 1) ? { background: "var(--badbg)", boxShadow: "-3rem 0 0 var(--badbg)" } : undefined}>
              <span className="absolute end-full w-10 pe-3 text-end text-xs leading-[inherit] tabular-nums" style={{ color: bad.has(i + 1) ? "var(--bad)" : "var(--faint)", fontWeight: bad.has(i + 1) ? 700 : 400 }}>
                {l.trim() ? i + 1 : ""}
              </span>
              <span className="invisible">{l || " "}</span>
            </div>
          ))}
        </div>
        <textarea
          ref={box} rows={8} dir="ltr" value={text} onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE[kind][lang]}
          aria-label={tr(...byLang(lang,
            ["Deutsch || Kurdisch, eine Zeile pro Eintrag", "ئەلمانی || کوردی، هەر رێزەک ئێک", "German || Kurdish, one per line"],
            ["Englisch || Kurdisch, eine Zeile pro Eintrag", "ئینگلیزی || کوردی، هەر رێزەک ئێک", "English || Kurdish, one per line"]))}
          aria-invalid={errors.length > 0} spellCheck={false}
          className="field relative !mt-0 block resize-none overflow-hidden !bg-transparent" style={PAD}
        />
      </div>

      {errors.length > 0 ? (
        <div role="alert" className="mt-3 rounded-lg p-3 text-sm" style={{ background: "var(--badbg)", color: "var(--bad)" }}>
          <p className="flex items-center gap-2 font-bold">
            <CircleAlert size={16} className="shrink-0" />
            {tr(
              errors.length === 1 ? "1 Zeile folgt der Regel nicht:" : `${errors.length} Zeilen folgen der Regel nicht:`,
              `${errors.length} رێز ل دویڤ یاسایێ نینن:`,
              errors.length === 1 ? "1 line doesn't follow the rule:" : `${errors.length} lines don't follow the rule:`,
            )}{/* KU: review */}
          </p>
          <ul className="mt-2 space-y-1">
            {errors.map((e) => (
              <li key={e.line}>
                <button type="button" onClick={() => goTo(e.line)} className="text-start underline-offset-2 hover:underline">
                  <span className="font-semibold">{tr(`Zeile ${e.line}`, `رێز ${e.line}`, `Line ${e.line}`)}:</span> {reason(e.kind)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : ready && (
        <p role="status" className="mt-3 flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--ok)" }}>
          <CircleCheck size={16} className="shrink-0" /> {tr(`${noun(rows.length)} bereit`, `${noun(rows.length)} ئامادەنە`, `${noun(rows.length)} ready`)}{/* KU: review */}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" disabled={!ready} onClick={() => onDone(rows, false)} className="btn-primary px-5">
          {tr(`${noun(rows.length)} anhängen`, `${noun(rows.length)} زێدە بکە`, `Add ${noun(rows.length)}`)}{/* KU: review */}
        </button>
        {hasRows && (
          <button type="button" disabled={!ready} onClick={replace} className="btn-ghost px-5">
            {kind === "words"
              ? tr("Alle Wörter ersetzen", "هەمی وشان بگوهۆڕە", "Replace all words")
              : tr("Alle Sätze ersetzen", "هەمی رستان بگوهۆڕە", "Replace all sentences")}{/* KU: review */}
          </button>
        )}
        <button type="button" onClick={onCancel} className="btn-ghost px-5">{tr("Abbrechen", "هەلوەشاندن", "Cancel")}</button>
      </div>
    </div>
  );
}
