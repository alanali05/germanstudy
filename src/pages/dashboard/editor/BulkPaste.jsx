import { useState } from "react";
import { useConfirm } from "../../../context/ConfirmContext";
import { parsePaste } from "../../../data/storyBundle";
import { byLang, useTr } from "../bi";

// Paste many sentences at once: German lines in one box, Kurdish lines in the other, paired by line.
// Lines in the old "Deutsch || Kurdisch" format also work in the German box.
export default function BulkPaste({ lang, hasSentences, onDone, onCancel }) {
  const tr = useTr();
  const [de, setDe] = useState("");
  const [ku, setKu] = useState("");
  const r = parsePaste(de, ku);
  const n = r.segments.length;
  const confirm = useConfirm();
  const replace = async () => {
    const ok = await confirm({
      title: tr("Alle vorhandenen Sätze ersetzen?", "هەمی رستێن هەین بگوهۆڕی؟", "Replace all existing sentences?"), // KU: review
      ok: tr("Ersetzen", "بگوهۆڕە", "Replace"), // KU: review
      danger: true,
    });
    if (ok) onDone(r.segments, true);
  };

  return (
    <div className="mb-5 rounded-xl border border-dashed p-4" style={{ borderColor: "var(--brand)" }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          {tr(...byLang(lang,
            [`Deutsch · ${r.targetCount} Zeilen`, `ئەلمانی · ${r.targetCount} رێز`, `German · ${r.targetCount} lines`],
            [`Englisch · ${r.targetCount} Zeilen`, `ئینگلیزی · ${r.targetCount} رێز`, `English · ${r.targetCount} lines`]))}{/* KU: review */}
          <textarea className="field" rows={7} lang={lang} dir="ltr" value={de} onChange={(e) => setDe(e.target.value)} placeholder={lang === "en" ? "Hello, how are you?\nI'm fine." : "Hallo, wie geht es dir?\nMir geht es gut."} />
        </label>
        <label className="block text-sm font-semibold">
          {tr(`Kurdisch · ${r.kuCount} Zeilen`, `کوردی · ${r.kuCount} رێز`, `Kurdish · ${r.kuCount} lines`)}{/* KU: review */}
          <textarea className="field" rows={7} lang="ku" dir="rtl" value={ku} onChange={(e) => setKu(e.target.value)} placeholder={"سڵاو، تو چەوایی؟\nئەز باشم."} />
        </label>
      </div>
      {r.unmatched.length > 0 && (
        <p role="status" className="mt-3 text-sm font-medium" style={{ color: "var(--bad)" }}>
          {tr(`Diese Zeilen haben kein Gegenstück: ${r.unmatched.map((i) => i + 1).join(", ")}`, `ئەڤ رێزە بێ بەرامبەرن: ${r.unmatched.map((i) => i + 1).join("، ")}`, `These lines have no partner: ${r.unmatched.map((i) => i + 1).join(", ")}`)}{/* KU: review */}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" disabled={!n} onClick={() => onDone(r.segments, false)} className="btn-primary px-5">
          {tr(`${n} Sätze anhängen`, `${n} رستان زێدە بکە`, `Add ${n} sentences`)}{/* KU: review */}
        </button>
        {hasSentences && <button type="button" disabled={!n} onClick={replace} className="btn-ghost px-5">{tr("Alle Sätze ersetzen", "هەمی رستان بگوهۆڕە", "Replace all sentences")}</button>}{/* KU: review */}
        <button type="button" onClick={onCancel} className="btn-ghost px-5">{tr("Abbrechen", "هەلوەشاندن", "Cancel")}</button>
      </div>
    </div>
  );
}
