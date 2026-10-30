import { Check } from "lucide-react";
import { bareWord } from "../../../data/storyBundle";
import { useTr } from "../bi";

// Splits a sentence into words (odd indexes) and the spaces / punctuation between them (even indexes)
const pieces = (text) => text.split(/([\p{L}\p{N}][\p{L}\p{N}'’-]*)/u);

// The story's sentences with every word tappable: a tap adds it to the word list with this sentence
// (and its Kurdish line) as the example, so only the Kurdish meaning is left to type.
// Words already in the list are marked and can't be added twice.
export default function WordPicker({ lang, segments, words, onPick, onClose }) {
  const tr = useTr();
  const taken = new Set(words.map((w) => bareWord(w.word, lang).toLowerCase()).filter(Boolean));
  const sentences = segments.filter((s) => s.text.trim());

  return (
    <div className="mb-5 rounded-xl border border-dashed p-4" style={{ borderColor: "var(--brand)" }}>
      {sentences.length ? (
        <>
          <p className="font-semibold">
            {tr("Tippe ein Wort an, um es hinzuzufügen.", "ل سەر وشەیەکێ کلیک بکە دا زێدە ببیت.", "Tap a word to add it.")}{/* KU: review */}
          </p>
          <p className="mt-1 text-sm text-muted">
            {tr(
              "Es kommt mit seinem Satz als Beispiel ans Ende der Liste. Dort schreibst du nur noch die kurdische Bedeutung (und kannst z. B. den Artikel ergänzen).",
              "دێ ل دوماهیا لیستێ زێدە بیت، دگەل رستەیا خۆ وەک نمونە. ل وێرێ تنێ رامانا کوردی بنڤیسە (و دشێی ئارتیکلی ژی زێدە بکەی).",
              "It goes to the end of the list with its sentence as the example. There you only type the Kurdish meaning (and can add an article, for example).",
            )}{/* KU: review */}
          </p>
          <ol className="mt-3 space-y-2">
            {sentences.map((s, i) => (
              <li key={i} dir="ltr" lang={lang} className="rounded-lg bg-soft/60 px-3 py-2 leading-9">
                {pieces(s.text).map((p, j) => {
                  if (j % 2 === 0) return p;
                  const has = taken.has(bareWord(p, lang).toLowerCase());
                  return (
                    <button
                      key={j} type="button" disabled={has} onClick={() => onPick(p, s)}
                      aria-label={has ? tr(`${p} (schon in der Liste)`, `${p} (د لیستێ دا یە)`, `${p} (already in the list)`) : tr(`${p} hinzufügen`, `${p} زێدە بکە`, `Add ${p}`)}
                      className={`inline-flex items-center gap-1 rounded-md px-0.5 transition ${
                        has ? "bg-brand/15 font-semibold text-link" : "underline decoration-dotted decoration-1 underline-offset-4 hover:bg-brand hover:text-on-brand"
                      }`}
                    >
                      {p}{has && <Check size={13} aria-hidden />}
                    </button>
                  );
                })}
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="text-sm text-muted">
          {tr("Schreib zuerst die Sätze der Geschichte, dann kannst du hier Wörter daraus wählen.", "پێشی رستێن چیرۆکێ بنڤیسە، پاشان دشێی ل ڤێرێ وشان ژێ هەلبژێری.", "Write the story's sentences first, then you can pick words from them here.")}{/* KU: review */}
        </p>
      )}
      <button type="button" onClick={onClose} className="btn-ghost mt-4 px-5">{tr("Fertig", "تەمام", "Done")}</button>
    </div>
  );
}
