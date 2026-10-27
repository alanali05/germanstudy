import { useState } from "react";
import { parsePaste } from "../../../data/storyBundle";
import { useBi } from "../bi";

// Paste many sentences at once: German lines in one box, Kurdish lines in the other, paired by line.
// Lines in the old "Deutsch || Kurdisch" format also work in the German box.
export default function BulkPaste({ hasSentences, onDone, onCancel }) {
  const bi = useBi();
  const [de, setDe] = useState("");
  const [ku, setKu] = useState("");
  const r = parsePaste(de, ku);
  const n = r.segments.length;
  const replace = () => {
    if (window.confirm(bi("Alle vorhandenen Sätze ersetzen?", "هەمی رستێن هەین بگوهۆڕی؟"))) onDone(r.segments, true); // KU: review
  };

  return (
    <div className="mb-5 rounded-xl border border-dashed p-4" style={{ borderColor: "var(--brand)" }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          {bi(`Deutsch · ${r.deCount} Zeilen`, `ئەلمانی · ${r.deCount} رێز`)}{/* KU: review */}
          <textarea className="field" rows={7} lang="de" dir="ltr" value={de} onChange={(e) => setDe(e.target.value)} placeholder={"Hallo, wie geht es dir?\nMir geht es gut."} />
        </label>
        <label className="block text-sm font-semibold">
          {bi(`Kurdisch · ${r.kuCount} Zeilen`, `کوردی · ${r.kuCount} رێز`)}{/* KU: review */}
          <textarea className="field" rows={7} lang="ku" dir="rtl" value={ku} onChange={(e) => setKu(e.target.value)} placeholder={"سڵاو، تو چەوایی؟\nئەز باشم."} />
        </label>
      </div>
      {r.unmatched.length > 0 && (
        <p role="status" className="mt-3 text-sm font-medium" style={{ color: "var(--bad)" }}>
          {bi(`Diese Zeilen haben kein Gegenstück: ${r.unmatched.map((i) => i + 1).join(", ")}`, `ئەڤ رێزە بێ بەرامبەرن: ${r.unmatched.map((i) => i + 1).join("، ")}`)}{/* KU: review */}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" disabled={!n} onClick={() => onDone(r.segments, false)} className="btn-primary px-5">
          {bi(`${n} Sätze anhängen`, `${n} رستان زێدە بکە`)}{/* KU: review */}
        </button>
        {hasSentences && <button type="button" disabled={!n} onClick={replace} className="btn-ghost px-5">{bi("Alle Sätze ersetzen", "هەمی رستان بگوهۆڕە")}</button>}{/* KU: review */}
        <button type="button" onClick={onCancel} className="btn-ghost px-5">{bi("Abbrechen", "هەلوەشاندن")}</button>
      </div>
    </div>
  );
}
