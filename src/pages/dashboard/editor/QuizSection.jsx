import { useState } from "react";
import { Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useConfirm } from "../../../context/ConfirmContext";
import { generateQuestions } from "../../../data/storyBundle";
import { byLang, useTr } from "../bi";
import { AutoText, Box, Msg } from "../ui";

const emptyQuestion = () => ({ question: "", questionKu: "", options: ["", ""], correctAnswer: 0 });

// One question opened for editing: texts, answers, and a radio button for the correct answer
function QuestionEditor({ n, q, lang, onChange, onDelete, onClose }) {
  const tr = useTr();
  const set = (patch) => onChange({ ...q, ...patch });
  const questionLabel = byLang(lang, ["Frage (Deutsch)", "پرسیار (ئەلمانی)", "Question (German)"], ["Frage (Englisch)", "پرسیار (ئینگلیزی)", "Question (English)"]); // KU: review
  const setOption = (i) => (v) => set({ options: q.options.map((o, j) => (j === i ? v : o)) });
  const removeOption = (i) => set({
    options: q.options.filter((_, j) => j !== i),
    correctAnswer: i === q.correctAnswer ? 0 : i < q.correctAnswer ? q.correctAnswer - 1 : q.correctAnswer,
  });

  return (
    <fieldset className="rounded-xl border p-3" style={{ borderColor: "var(--brand)" }}>
      <legend className="px-1 text-sm font-bold">{tr(`Frage ${n}`, `پرسیار ${n}`, `Question ${n}`)}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        <AutoText
          aria-label={tr(...questionLabel)} placeholder={tr(...questionLabel)}
          className="field !mt-0" lang={lang} dir="ltr" value={q.question} onValue={(v) => set({ question: v })}
        />
        <AutoText
          aria-label={tr("Frage (Kurdisch)", "پرسیار (کوردی)", "Question (Kurdish)")} placeholder={tr("Frage (Kurdisch)", "پرسیار (کوردی)", "Question (Kurdish)")}
          className="field !mt-0" lang="ku" dir="rtl" value={q.questionKu} onValue={(v) => set({ questionKu: v })}
        />
      </div>
      <p className="mt-3 text-sm text-muted">{tr("Antworten – den Kreis bei der richtigen Antwort anklicken.", "بەرسڤ – ل سەر بازنەیا بەرسڤا درست کلیک بکە.", "Answers – click the circle next to the correct answer.")}</p>{/* KU: review */}
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {q.options.map((o, i) => (
          <div
            key={i} className="flex items-center gap-2 rounded-xl border px-2"
            style={i === q.correctAnswer ? { borderColor: "var(--ok)", background: "var(--okbg)" } : { borderColor: "var(--line)" }}
          >
            <input
              type="radio" name={`correct-${n}`} checked={i === q.correctAnswer} onChange={() => set({ correctAnswer: i })}
              aria-label={tr(`Antwort ${i + 1} ist richtig`, `بەرسڤا ${i + 1} درستە`, `Answer ${i + 1} is correct`)} className="h-5 w-5 shrink-0 accent-[var(--brand)]"
            />{/* KU: review */}
            <AutoText aria-label={tr(`Antwort ${i + 1}`, `بەرسڤ ${i + 1}`, `Answer ${i + 1}`)} className="min-w-0 flex-1 bg-transparent py-2.5 outline-none" dir="auto" value={o} onValue={setOption(i)} />
            {q.options.length > 2 && (
              <button type="button" aria-label={tr(`Antwort ${i + 1} entfernen`, `بەرسڤا ${i + 1} لابە`, `Remove answer ${i + 1}`)} onClick={() => removeOption(i)} className="p-2 text-muted hover:text-fg">{/* KU: review */}
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {q.options.length < 6 && (
          <button type="button" onClick={() => set({ options: [...q.options, ""] })} className="btn-mini inline-flex items-center gap-1 text-sm">
            <Plus size={15} /> {tr("Antwort", "بەرسڤ", "Answer")}
          </button>
        )}
        <button type="button" onClick={onClose} className="btn-mini text-sm">{tr("Fertig", "تەمام", "Done")}</button>{/* KU: review */}
        <button type="button" onClick={onDelete} className="btn-danger ms-auto inline-flex items-center gap-1 text-sm">
          <Trash2 size={15} /> {tr("Frage löschen", "پرسیارێ بسڕە", "Delete question")}{/* KU: review */}
        </button>
      </div>
    </fieldset>
  );
}

// Quiz: a short list; one question at a time opens for editing.
// pool = Kurdish meanings from other stories of this level (extra wrong answers for generated questions).
// lang = the story's learning language ("de" | "en")
export default function QuizSection({ lang, questions, words, pool, onChange }) {
  const tr = useTr();
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState(null);
  const setQuestion = (i) => (q) => onChange(questions.map((x, j) => (j === i ? q : x)));
  const add = () => { onChange([...questions, emptyQuestion()]); setEditing(questions.length); setMsg(null); };
  const confirm = useConfirm();
  const remove = async (i) => {
    const q = questions[i];
    if ((q.question.trim() || q.options.some((o) => o.trim())) && !(await confirm({
      title: tr(`Frage ${i + 1} löschen?`, `پرسیار ${i + 1} بسڕی؟`, `Delete question ${i + 1}?`), // KU: review
      text: q.question.trim() || q.questionKu.trim(),
      ok: tr("Löschen", "سڕین", "Delete"),
      danger: true,
    }))) return;
    onChange(questions.filter((_, j) => j !== i));
    setEditing(null);
  };
  const generate = () => {
    const made = generateQuestions(words, questions, { pool, lang });
    onChange([...questions, ...made]);
    setMsg(made.length
      ? { ok: true, de: `${made.length} Fragen erstellt. Bitte prüfen und speichern.`, ku: `${made.length} پرسیار هاتنە دروستکرن. تکایە بپشکنە و بپارێزە.`, en: `${made.length} questions made. Please check them and save.` } // KU: review
      : { ok: false, de: "Keine neuen Fragen: Jedes Wort hat schon eine Frage, oder es fehlen Wörter mit Bedeutung.", ku: "چ پرسیارێن نوو نینن: هەر وشەیەک پرسیارەک هەیە، یان وشە ب رامان نینن.", en: "No new questions: every word already has a question, or there are no words with a meaning." }); // KU: review
  };

  return (
    <Box
      id="quiz"
      title={`${tr("Quiz", "کویز", "Quiz")} (${questions.length})`}
      aside={
        <button type="button" onClick={generate} className="btn-ghost inline-flex items-center gap-2 px-4 text-sm font-semibold">
          <Sparkles size={16} /> {tr("Fragen aus den Wörtern erstellen", "پرسیاران ژ وشان دروست بکە", "Make questions from the words")}{/* KU: review */}
        </button>
      }
    >
      <Msg m={msg} />
      <ol className="mt-3 space-y-2">
        {questions.map((q, i) => (
          <li key={i}>
            {editing === i ? (
              <QuestionEditor n={i + 1} q={q} lang={lang} onChange={setQuestion(i)} onDelete={() => remove(i)} onClose={() => setEditing(null)} />
            ) : (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
                <span className="min-w-0 flex-[1_1_16rem]">
                  <span className="block font-semibold" dir="auto">{i + 1}. {q.question || tr("(ohne Text)", "(بێ دەق)", "(no text)")}</span>{/* KU: review */}
                  <span className="block text-sm text-muted">
                    {tr("Richtig", "درست", "Correct")}: <span dir="auto">{q.options[q.correctAnswer] || "–"}</span> · {tr(`${q.options.length} Antworten`, `${q.options.length} بەرسڤ`, `${q.options.length} answers`)}
                  </span>
                </span>
                <button type="button" onClick={() => setEditing(i)} className="btn-mini inline-flex items-center gap-1 text-sm">
                  <Pencil size={15} /> {tr("Bearbeiten", "دەستکاریکرن", "Edit")}
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
        <Plus size={17} /> {tr("Frage hinzufügen", "پرسیارەکێ زێدە بکە", "Add question")}
      </button>
    </Box>
  );
}
