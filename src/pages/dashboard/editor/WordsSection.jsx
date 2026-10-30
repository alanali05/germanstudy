import { useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useConfirm } from "../../../context/ConfirmContext";
import { useBi } from "../bi";
import { AutoText, Box } from "../ui";
import { ICON_BTN, ROW_CARD, ROW_HEAD, ROW_NUM } from "./styles";

const EMPTY_WORD = { wordDe: "", wordKu: "", sentenceDe: "", sentenceKu: "" };

// The story's vocabulary, one card per word: number, "Beispiel" and delete on top, then word and meaning
// (stacked on phones, side by side on wide screens); the example sentences open below. Students can tap these words in the story.
export default function WordsSection({ words, onChange }) {
  const bi = useBi();
  const [open, setOpen] = useState(() => new Set()); // rows whose example sentences are shown
  const confirm = useConfirm();
  const setRow = (i, k) => (v) => onChange(words.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  // An empty row goes at once; one with text asks first
  const removeRow = async (i) => {
    const x = words[i];
    if (Object.values(x).some((v) => v.trim()) && !(await confirm({
      title: bi(`Wort ${i + 1} löschen?`, `وشە ${i + 1} بسڕی؟`), // KU: review
      text: [x.wordDe, x.wordKu].map((v) => v.trim()).filter(Boolean).join(" – "),
      ok: bi("Löschen", "سڕین"),
      danger: true,
    }))) return;
    onChange(words.filter((_, j) => j !== i));
    setOpen(new Set());
  };
  const toggle = (i) => setOpen((s) => {
    const next = new Set(s);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    return next;
  });

  return (
    <Box id="words" title={`${bi("Wörter", "وشە")} (${words.length})`}>
      <p className="mb-3 text-sm text-muted">{bi("Diese Wörter können die Schüler in der Geschichte antippen.", "قوتابی دشێن ل سەر ڤان وشان د چیرۆکێ دا کلیک بکەن.")}</p>{/* KU: review */}
      <ul className="space-y-3">
        {words.map((x, i) => (
          <li key={i} className={ROW_CARD}>
            <div className={ROW_HEAD}>
              <span className={ROW_NUM}>{i + 1}</span>
              <button type="button" aria-expanded={open.has(i)} onClick={() => toggle(i)} className="btn-mini ms-auto inline-flex h-10 items-center gap-1 text-sm">
                <ChevronDown size={15} className={`transition ${open.has(i) ? "rotate-180" : ""}`} /> {bi("Beispiel", "نمونە")}
              </button>
              <button type="button" aria-label={bi(`Wort ${i + 1} löschen`, `وشە ${i + 1} بسڕە`)} onClick={() => removeRow(i)} className={`${ICON_BTN} text-[var(--bad)]`}>
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                aria-label={bi(`Wort ${i + 1}`, `وشە ${i + 1}`)} placeholder={bi("Deutsches Wort", "وشەیا ئەلمانی")}
                className="field !mt-0 font-semibold" lang="de" dir="ltr" value={x.wordDe} onChange={(e) => setRow(i, "wordDe")(e.target.value)}
              />
              <input
                aria-label={bi(`Bedeutung ${i + 1}`, `رامان ${i + 1}`)} placeholder={bi("Kurdische Bedeutung", "رامانا کوردی")}
                className="field !mt-0" lang="ku" dir="rtl" value={x.wordKu} onChange={(e) => setRow(i, "wordKu")(e.target.value)}
              />
              {open.has(i) && (
                <>
                  <AutoText
                    aria-label={bi("Deutscher Beispielsatz", "رستەیا نمونەیا ئەلمانی")} placeholder={bi("Deutscher Beispielsatz", "رستەیا نمونەیا ئەلمانی")}
                    className="field !mt-0" lang="de" dir="ltr" value={x.sentenceDe} onValue={setRow(i, "sentenceDe")}
                  />
                  <AutoText
                    aria-label={bi("Kurdischer Beispielsatz", "رستەیا نمونەیا کوردی")} placeholder={bi("Kurdischer Beispielsatz", "رستەیا نمونەیا کوردی")}
                    className="field !mt-0" lang="ku" dir="rtl" value={x.sentenceKu} onValue={setRow(i, "sentenceKu")}
                  />
                </>
              )}
            </div>
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
