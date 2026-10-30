import { useState } from "react";
import { Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useConfirm } from "../../../context/ConfirmContext";
import { generateQuestions } from "../../../data/storyBundle";
import { useBi } from "../bi";
import { Box, Msg } from "../ui";

const emptyQuestion = () => ({ questionDe: "", questionKu: "", options: ["", ""], correctAnswer: 0 });

// One question opened for editing: texts, answers, and a radio button for the correct answer
function QuestionEditor({ n, q, onChange, onDelete, onClose }) {
  const bi = useBi();
  const set = (patch) => onChange({ ...q, ...patch });
  const setOption = (i) => (e) => set({ options: q.options.map((o, j) => (j === i ? e.target.value : o)) });
  const removeOption = (i) => set({
    options: q.options.filter((_, j) => j !== i),
    correctAnswer: i === q.correctAnswer ? 0 : i < q.correctAnswer ? q.correctAnswer - 1 : q.correctAnswer,
  });

  return (
    <fieldset className="rounded-xl border p-3" style={{ borderColor: "var(--brand)" }}>
      <legend className="px-1 text-sm font-bold">{bi(`Frage ${n}`, `پرسیار ${n}`)}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          aria-label={bi("Frage (Deutsch)", "پرسیار (ئەلمانی)")} placeholder={bi("Frage (Deutsch)", "پرسیار (ئەلمانی)")}
          className="field !mt-0" lang="de" dir="ltr" value={q.questionDe} onChange={(e) => set({ questionDe: e.target.value })}
        />
        <input
          aria-label={bi("Frage (Kurdisch)", "پرسیار (کوردی)")} placeholder={bi("Frage (Kurdisch)", "پرسیار (کوردی)")}
          className="field !mt-0" lang="ku" dir="rtl" value={q.questionKu} onChange={(e) => set({ questionKu: e.target.value })}
        />
      </div>
      <p className="mt-3 text-sm text-muted">{bi("Antworten – den Kreis bei der richtigen Antwort anklicken.", "بەرسڤ – ل سەر بازنەیا بەرسڤا درست کلیک بکە.")}</p>{/* KU: review */}
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {q.options.map((o, i) => (
          <div
            key={i} className="flex items-center gap-2 rounded-xl border px-2"
            style={i === q.correctAnswer ? { borderColor: "var(--ok)", background: "var(--okbg)" } : { borderColor: "var(--line)" }}
          >
            <input
              type="radio" name={`correct-${n}`} checked={i === q.correctAnswer} onChange={() => set({ correctAnswer: i })}
              aria-label={bi(`Antwort ${i + 1} ist richtig`, `بەرسڤا ${i + 1} درستە`)} className="h-5 w-5 shrink-0 accent-[var(--brand)]"
            />{/* KU: review */}
            <input aria-label={bi(`Antwort ${i + 1}`, `بەرسڤ ${i + 1}`)} className="min-h-11 min-w-0 flex-1 bg-transparent outline-none" dir="auto" value={o} onChange={setOption(i)} />
            {q.options.length > 2 && (
              <button type="button" aria-label={bi(`Antwort ${i + 1} entfernen`, `بەرسڤا ${i + 1} لابە`)} onClick={() => removeOption(i)} className="p-2 text-muted hover:text-fg">{/* KU: review */}
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {q.options.length < 6 && (
          <button type="button" onClick={() => set({ options: [...q.options, ""] })} className="btn-mini inline-flex items-center gap-1 text-sm">
            <Plus size={15} /> {bi("Antwort", "بەرسڤ")}
          </button>
        )}
        <button type="button" onClick={onClose} className="btn-mini text-sm">{bi("Fertig", "تەمام")}</button>{/* KU: review */}
        <button type="button" onClick={onDelete} className="btn-danger ms-auto inline-flex items-center gap-1 text-sm">
          <Trash2 size={15} /> {bi("Frage löschen", "پرسیارێ بسڕە")}{/* KU: review */}
        </button>
      </div>
    </fieldset>
  );
}

// Quiz: a short list; one question at a time opens for editing.
// pool = Kurdish meanings from other stories of this level (extra wrong answers for generated questions).
export default function QuizSection({ questions, words, pool, onChange }) {
  const bi = useBi();
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState(null);
  const setQuestion = (i) => (q) => onChange(questions.map((x, j) => (j === i ? q : x)));
  const add = () => { onChange([...questions, emptyQuestion()]); setEditing(questions.length); setMsg(null); };
  const confirm = useConfirm();
  const remove = async (i) => {
    const q = questions[i];
    if ((q.questionDe.trim() || q.options.some((o) => o.trim())) && !(await confirm({
      title: bi(`Frage ${i + 1} löschen?`, `پرسیار ${i + 1} بسڕی؟`), // KU: review
      text: q.questionDe.trim() || q.questionKu.trim(),
      ok: bi("Löschen", "سڕین"),
      danger: true,
    }))) return;
    onChange(questions.filter((_, j) => j !== i));
    setEditing(null);
  };
  const generate = () => {
    const made = generateQuestions(words, questions, pool);
    onChange([...questions, ...made]);
    setMsg(made.length
      ? { ok: true, de: `${made.length} Fragen erstellt. Bitte prüfen und speichern.`, ku: `${made.length} پرسیار هاتنە دروستکرن. تکایە بپشکنە و بپارێزە.` } // KU: review
      : { ok: false, de: "Keine neuen Fragen: Jedes Wort hat schon eine Frage, oder es fehlen Wörter mit Bedeutung.", ku: "چ پرسیارێن نوو نینن: هەر وشەیەک پرسیارەک هەیە، یان وشە ب رامان نینن." }); // KU: review
  };

  return (
    <Box
      id="quiz"
      title={`${bi("Quiz", "کویز")} (${questions.length})`}
      aside={
        <button type="button" onClick={generate} className="btn-ghost inline-flex items-center gap-2 px-4 text-sm font-semibold">
          <Sparkles size={16} /> {bi("Fragen aus den Wörtern erstellen", "پرسیاران ژ وشان دروست بکە")}{/* KU: review */}
        </button>
      }
    >
      <Msg m={msg} />
      <ol className="mt-3 space-y-2">
        {questions.map((q, i) => (
          <li key={i}>
            {editing === i ? (
              <QuestionEditor n={i + 1} q={q} onChange={setQuestion(i)} onDelete={() => remove(i)} onClose={() => setEditing(null)} />
            ) : (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
                <span className="min-w-0 flex-[1_1_16rem]">
                  <span className="block font-semibold" dir="auto">{i + 1}. {q.questionDe || bi("(ohne Text)", "(بێ دەق)")}</span>{/* KU: review */}
                  <span className="block text-sm text-muted">
                    {bi("Richtig", "درست")}: <span dir="auto">{q.options[q.correctAnswer] || "–"}</span> · {bi(`${q.options.length} Antworten`, `${q.options.length} بەرسڤ`)}
                  </span>
                </span>
                <button type="button" onClick={() => setEditing(i)} className="btn-mini inline-flex items-center gap-1 text-sm">
                  <Pencil size={15} /> {bi("Bearbeiten", "دەستکاریکرن")}
                </button>
              </div>
            )}
          </li>
        ))}
      </ol>
      <button
        type="button" onClick={add}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line font-bold text-link hover:border-brand"
      >
        <Plus size={17} /> {bi("Frage hinzufügen", "پرسیارەکێ زێدە بکە")}
      </button>
    </Box>
  );
}
