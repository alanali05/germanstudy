import { useState } from "react";
import { ArrowDown, ArrowUp, ClipboardPaste, Plus, Trash2 } from "lucide-react";
import { moveItem } from "../../../data/storyBundle";
import { useBi } from "../bi";
import { Box } from "../ui";
import BulkPaste from "./BulkPaste";

const ICON_BTN = "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line disabled:opacity-40";

// One row per sentence: the German sentence and its Kurdish translation, each in its own text direction
export default function SentencesSection({ segments, onChange }) {
  const bi = useBi();
  const [pasting, setPasting] = useState(false);
  const setRow = (i, k) => (e) => onChange(segments.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)));

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
      <ol className="space-y-2">
        {segments.map((s, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2">
            <span className="w-6 text-center text-sm font-bold text-muted">{i + 1}</span>
            <input
              aria-label={bi(`Satz ${i + 1} Deutsch`, `رستە ${i + 1} ئەلمانی`)} placeholder={bi("Deutscher Satz", "رستەیا ئەلمانی")}
              className="field !mt-0 min-w-0 flex-[1_1_14rem]" lang="de" dir="ltr" value={s.de} onChange={setRow(i, "de")}
            />
            <input
              aria-label={bi(`Satz ${i + 1} Kurdisch`, `رستە ${i + 1} کوردی`)} placeholder={bi("Kurdische Übersetzung", "وەرگێڕانا کوردی")}
              className="field !mt-0 min-w-0 flex-[1_1_14rem]" lang="ku" dir="rtl" value={s.ku} onChange={setRow(i, "ku")}
            />
            <span className="flex gap-1">
              <button type="button" aria-label={bi("Nach oben", "بۆ سەری")} disabled={i === 0} onClick={() => onChange(moveItem(segments, i, i - 1))} className={ICON_BTN}>{/* KU: review */}
                <ArrowUp size={16} />
              </button>
              <button type="button" aria-label={bi("Nach unten", "بۆ خوارێ")} disabled={i === segments.length - 1} onClick={() => onChange(moveItem(segments, i, i + 1))} className={ICON_BTN}>{/* KU: review */}
                <ArrowDown size={16} />
              </button>
              <button type="button" aria-label={bi(`Satz ${i + 1} löschen`, `رستە ${i + 1} بسڕە`)} onClick={() => onChange(segments.filter((_, j) => j !== i))} className={`${ICON_BTN} text-[var(--bad)]`}>
                <Trash2 size={16} />
              </button>
            </span>
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
