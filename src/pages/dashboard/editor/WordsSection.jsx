import { useState } from "react";
import { ChevronDown, ClipboardPaste, MousePointerClick, Plus, Trash2 } from "lucide-react";
import { useConfirm } from "../../../context/ConfirmContext";
import { findExample } from "../../../data/storyBundle";
import { byLang, useTr } from "../bi";
import { AutoText, Box } from "../ui";
import BulkPaste from "./BulkPaste";
import { ICON_BTN, ROW_CARD, ROW_HEAD, ROW_NUM } from "./styles";
import WordPicker from "./WordPicker";

const EMPTY_WORD = { word: "", wordKu: "", sentence: "", sentenceKu: "" };

// The story's vocabulary, one card per word: number, "Beispiel" and delete on top, then word and meaning
// (stacked on phones, side by side on wide screens); the example sentences open below. Students can tap these words in the story.
// Many words can be pasted at once ("word || Kurdish", the example comes from the story) or picked by tapping them in the story.
// lang = the story's learning language ("de" | "en"); segments = the story's sentences
export default function WordsSection({ lang, words, segments, onChange }) {
  const tr = useTr();
  const [open, setOpen] = useState(() => new Set()); // rows whose example sentences are shown
  const [panel, setPanel] = useState(null); // "paste" | "pick" | null
  const togglePanel = (p) => setPanel((x) => (x === p ? null : p));
  const confirm = useConfirm();
  const exampleLabel = byLang(lang, ["Deutscher Beispielsatz", "رستەیا نمونەیا ئەلمانی", "German example sentence"], ["Englischer Beispielsatz", "رستەیا نمونەیا ئینگلیزی", "English example sentence"]); // KU: review
  const setRow = (i, k) => (v) => onChange(words.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  // An empty row goes at once; one with text asks first
  const removeRow = async (i) => {
    const x = words[i];
    if (Object.values(x).some((v) => v.trim()) && !(await confirm({
      title: tr(`Wort ${i + 1} löschen?`, `وشە ${i + 1} بسڕی؟`, `Delete word ${i + 1}?`), // KU: review
      text: [x.word, x.wordKu].map((v) => v.trim()).filter(Boolean).join(" – "),
      ok: tr("Löschen", "سڕین", "Delete"),
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
    <Box
      id="words"
      title={`${tr("Wörter", "وشە", "Words")} (${words.length})`}
      aside={
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => togglePanel("pick")} aria-expanded={panel === "pick"} className="btn-ghost inline-flex items-center gap-2 px-4 text-sm font-semibold">
            <MousePointerClick size={16} /> {tr("Aus der Geschichte wählen", "ژ چیرۆکێ هەلبژێرە", "Pick from the story")}{/* KU: review */}
          </button>
          <button type="button" onClick={() => togglePanel("paste")} aria-expanded={panel === "paste"} className="btn-ghost inline-flex items-center gap-2 px-4 text-sm font-semibold">
            <ClipboardPaste size={16} /> {tr("Viele Wörter einfügen", "گەلەک وشان بچەسپینە", "Paste many words")}{/* KU: review */}
          </button>
        </div>
      }
    >
      <p className="mb-3 text-sm text-muted">{tr("Diese Wörter können die Schüler in der Geschichte antippen.", "قوتابی دشێن ل سەر ڤان وشان د چیرۆکێ دا کلیک بکەن.", "Students can tap these words in the story.")}</p>{/* KU: review */}
      {panel === "pick" && (
        <WordPicker
          lang={lang} segments={segments} words={words} onClose={() => setPanel(null)}
          onPick={(word, s) => onChange([...words, { word, wordKu: "", sentence: s.text, sentenceKu: s.ku }])}
        />
      )}
      {panel === "paste" && (
        <BulkPaste
          kind="words" lang={lang} hasRows={words.length > 0} onCancel={() => setPanel(null)}
          onDone={(rows, replace) => {
            const pasted = rows.map((r) => ({
              word: r.left, wordKu: r.right, sentence: "", sentenceKu: "", ...findExample(r.left, segments, lang),
            }));
            onChange(replace ? pasted : [...words, ...pasted]);
            setOpen(new Set());
            setPanel(null);
          }}
        />
      )}
      <ul className="space-y-3">
        {words.map((x, i) => (
          <li key={i} className={ROW_CARD}>
            <div className={ROW_HEAD}>
              <span className={ROW_NUM}>{i + 1}</span>
              <button type="button" aria-expanded={open.has(i)} onClick={() => toggle(i)} className="btn-mini ms-auto inline-flex h-10 items-center gap-1 text-sm">
                <ChevronDown size={15} className={`transition ${open.has(i) ? "rotate-180" : ""}`} /> {tr("Beispiel", "نمونە", "Example")}
              </button>
              <button type="button" aria-label={tr(`Wort ${i + 1} löschen`, `وشە ${i + 1} بسڕە`, `Delete word ${i + 1}`)} onClick={() => removeRow(i)} className={`${ICON_BTN} text-[var(--bad)]`}>
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                aria-label={tr(`Wort ${i + 1}`, `وشە ${i + 1}`, `Word ${i + 1}`)} placeholder={tr(...byLang(lang, ["Deutsches Wort", "وشەیا ئەلمانی", "German word"], ["Englisches Wort", "وشەیا ئینگلیزی", "English word"]))}
                className="field !mt-0 font-semibold" lang={lang} dir="ltr" value={x.word} onChange={(e) => setRow(i, "word")(e.target.value)}
              />
              <input
                aria-label={tr(`Bedeutung ${i + 1}`, `رامان ${i + 1}`, `Meaning ${i + 1}`)} placeholder={tr("Kurdische Bedeutung", "رامانا کوردی", "Kurdish meaning")}
                className="field !mt-0" lang="ku" dir="rtl" value={x.wordKu} onChange={(e) => setRow(i, "wordKu")(e.target.value)}
              />
              {open.has(i) && (
                <>
                  <AutoText
                    aria-label={tr(...exampleLabel)} placeholder={tr(...exampleLabel)}
                    className="field !mt-0" lang={lang} dir="ltr" value={x.sentence} onValue={setRow(i, "sentence")}
                  />
                  <AutoText
                    aria-label={tr("Kurdischer Beispielsatz", "رستەیا نمونەیا کوردی", "Kurdish example sentence")} placeholder={tr("Kurdischer Beispielsatz", "رستەیا نمونەیا کوردی", "Kurdish example sentence")}
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
        <Plus size={17} /> {tr("Wort hinzufügen", "وشەیێ زێدە بکە", "Add word")}
      </button>
    </Box>
  );
}
