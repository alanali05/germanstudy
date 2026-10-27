import { useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useBi } from "../bi";
import { Box } from "../ui";

const EMPTY_WORD = { wordDe: "", wordKu: "", sentenceDe: "", sentenceKu: "" };

// The story's vocabulary. Students can tap these words in the story.
export default function WordsSection({ words, onChange }) {
  const bi = useBi();
  const [open, setOpen] = useState(() => new Set()); // rows whose example sentences are shown
  const setRow = (i, k) => (e) => onChange(words.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)));
  const toggle = (i) => setOpen((s) => {
    const next = new Set(s);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    return next;
  });

  return (
    <Box id="words" title={`${bi("Wörter", "وشە")} (${words.length})`}>
      <p className="mb-3 text-sm text-muted">{bi("Diese Wörter können die Schüler in der Geschichte antippen.", "قوتابی دشێن ل سەر ڤان وشان د چیرۆکێ دا کلیک بکەن.")}</p>{/* KU: review */}
      <ul className="space-y-2">
        {words.map((x, i) => (
          <li key={i} className="rounded-xl border border-line p-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                aria-label={bi(`Wort ${i + 1}`, `وشە ${i + 1}`)} placeholder={bi("Deutsches Wort", "وشەیا ئەلمانی")}
                className="field !mt-0 min-w-0 flex-[1_1_12rem] font-semibold" lang="de" dir="ltr" value={x.wordDe} onChange={setRow(i, "wordDe")}
              />
              <input
                aria-label={bi(`Bedeutung ${i + 1}`, `رامان ${i + 1}`)} placeholder={bi("Kurdische Bedeutung", "رامانا کوردی")}
                className="field !mt-0 min-w-0 flex-[1_1_12rem]" lang="ku" dir="rtl" value={x.wordKu} onChange={setRow(i, "wordKu")}
              />
              <button type="button" aria-expanded={open.has(i)} onClick={() => toggle(i)} className="btn-mini inline-flex min-h-11 items-center gap-1 text-sm">
                <ChevronDown size={15} /> {bi("Beispiel", "نمونە")}
              </button>
              <button
                type="button" aria-label={bi(`Wort ${i + 1} löschen`, `وشە ${i + 1} بسڕە`)}
                onClick={() => { onChange(words.filter((_, j) => j !== i)); setOpen(new Set()); }}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line text-[var(--bad)]"
              >
                <Trash2 size={16} />
              </button>
            </div>
            {open.has(i) && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input
                  aria-label={bi("Deutscher Beispielsatz", "رستەیا نمونەیا ئەلمانی")} placeholder={bi("Deutscher Beispielsatz", "رستەیا نمونەیا ئەلمانی")}
                  className="field !mt-0" lang="de" dir="ltr" value={x.sentenceDe} onChange={setRow(i, "sentenceDe")}
                />
                <input
                  aria-label={bi("Kurdischer Beispielsatz", "رستەیا نمونەیا کوردی")} placeholder={bi("Kurdischer Beispielsatz", "رستەیا نمونەیا کوردی")}
                  className="field !mt-0" lang="ku" dir="rtl" value={x.sentenceKu} onChange={setRow(i, "sentenceKu")}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
      <button
        type="button" onClick={() => onChange([...words, { ...EMPTY_WORD }])}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line font-bold text-link hover:border-brand"
      >
        <Plus size={17} /> {bi("Wort hinzufügen", "وشەیێ زێدە بکە")}
      </button>
    </Box>
  );
}
