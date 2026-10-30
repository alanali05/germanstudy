import { useState } from "react";
import { ArrowDown, ArrowUp, ClipboardPaste, Plus, Trash2 } from "lucide-react";
import { useConfirm } from "../../../context/ConfirmContext";
import { moveItem } from "../../../data/storyBundle";
import { useBi } from "../bi";
import { AutoText, Box } from "../ui";
import BulkPaste from "./BulkPaste";
import { ICON_BTN, ROW_CARD, ROW_HEAD, ROW_NUM } from "./styles";


// One card per sentence: number and buttons on top, then the German sentence and its Kurdish translation
// (stacked on phones, side by side on wide screens), each in its own text direction and growing with the text
export default function SentencesSection({ segments, onChange }) {
  const bi = useBi();
  const [pasting, setPasting] = useState(false);
  const confirm = useConfirm();
  const setRow = (i, k) => (v) => onChange(segments.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  // An empty row goes at once; one with text asks first
  const removeRow = async (i) => {
    const s = segments[i];
    if ((s.de.trim() || s.ku.trim()) && !(await confirm({
      title: bi(`Satz ${i + 1} löschen?`, `رستە ${i + 1} بسڕی؟`), // KU: review
      text: s.de.trim() || s.ku.trim(),
      ok: bi("Löschen", "سڕین"),
      danger: true,
    }))) return;
    onChange(segments.filter((_, j) => j !== i));
  };

  return (
    <Box
      id="sentences"
      title={`${bi("Sätze", "رستە")} (${segments.length})`}
      aside={
        <button type="button" onClick={() => setPasting((p) => !p)} aria-expanded={pasting} className="btn-ghost inline-flex items-center gap-2 px-4 text-sm font-semibold">
          <ClipboardPaste size={16} /> {bi("Viele Sätze einfügen", "گەلەک رستان بچەسپینە")}{/* KU: review */}
        </button>
      }
    >
      {pasting && (
        <BulkPaste
          hasSentences={segments.length > 0}
          onDone={(rows, replace) => { onChange(replace ? rows : [...segments, ...rows]); setPasting(false); }}
          onCancel={() => setPasting(false)}
        />
      )}
      <ol className="space-y-3">
        {segments.map((s, i) => (
          <li key={i} className={ROW_CARD}>
            <div className={ROW_HEAD}>
              <span className={ROW_NUM}>{i + 1}</span>
              <span className="ms-auto flex gap-1">
                <button type="button" aria-label={bi("Nach oben", "بۆ سەری")} disabled={i === 0} onClick={() => onChange(moveItem(segments, i, i - 1))} className={ICON_BTN}>{/* KU: review */}
                  <ArrowUp size={16} />
                </button>
                <button type="button" aria-label={bi("Nach unten", "بۆ خوارێ")} disabled={i === segments.length - 1} onClick={() => onChange(moveItem(segments, i, i + 1))} className={ICON_BTN}>{/* KU: review */}
                  <ArrowDown size={16} />
                </button>
                <button type="button" aria-label={bi(`Satz ${i + 1} löschen`, `رستە ${i + 1} بسڕە`)} onClick={() => removeRow(i)} className={`${ICON_BTN} text-[var(--bad)]`}>
                  <Trash2 size={16} />
                </button>
              </span>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <AutoText
                aria-label={bi(`Satz ${i + 1} Deutsch`, `رستە ${i + 1} ئەلمانی`)} placeholder={bi("Deutscher Satz", "رستەیا ئەلمانی")}
                className="field !mt-0" lang="de" dir="ltr" value={s.de} onValue={setRow(i, "de")}
              />
              <AutoText
                aria-label={bi(`Satz ${i + 1} Kurdisch`, `رستە ${i + 1} کوردی`)} placeholder={bi("Kurdische Übersetzung", "وەرگێڕانا کوردی")}
                className="field !mt-0" lang="ku" dir="rtl" value={s.ku} onValue={setRow(i, "ku")}
              />
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button" onClick={() => onChange([...segments, { de: "", ku: "" }])}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line font-bold text-link hover:border-brand"
      >
        <Plus size={17} /> {bi("Satz hinzufügen", "رستەیێ زێدە بکە")}{/* KU: review */}
      </button>
    </Box>
  );
}
