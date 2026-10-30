import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useConfirm } from "../../context/ConfirmContext";
import { LANG_NAME, LEARN_LANGS, learnLangOf } from "../../data/languages";
import { levels } from "../../data/levels";
import { createStudent, deleteStudent, updateStudent } from "../../data/students";
import { SAVE_FAIL, WAIT, useTr } from "./bi";
import { Box, Field, Msg, Row, SearchBox, SubmitRow } from "./ui";

// Schüler: create login codes, edit name / class / level / learning language, delete (revokes access)
const emptyStu = { name: "", className: "", level: "A1", learnLang: "de" };

export default function StudentsPage() {
  const tr = useTr();
  const { students } = useOutletContext();
  const confirm = useConfirm();
  const [f, setF] = useState(emptyStu);
  const [edit, setEdit] = useState(null); // uid of the student being edited
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const item = { name: f.name.trim(), className: f.className.trim(), level: f.level, learnLang: f.learnLang };
    setBusy(true); setMsg(WAIT);
    try {
      if (edit) {
        await updateStudent(edit, item);
        setMsg({ ok: true, text: tr("Änderungen gespeichert ✓", "گوهۆڕین هاتنە پاراستن ✓", "Changes saved ✓") });
      } else {
        const code = await createStudent(item);
        setMsg({ ok: true, text: tr(`Schüler erstellt ✓ Anmeldecode: ${code}`, `قوتابی هاتە دروستکرن ✓ کۆدێ چوونەژوورێ: ${code}`, `Student created ✓ Login code: ${code}`) });
      }
      setEdit(null); setF(emptyStu);
    } catch (err) {
      console.error(err);
      setMsg(SAVE_FAIL);
    }
    setBusy(false);
  };
  const del = async (s) => {
    const ok = await confirm({
      title: tr(`${s.name} löschen?`, `${s.name} بهێتە سڕین؟`, `Delete ${s.name}?`), // KU: review
      text: tr(`Der Anmeldecode ${s.code} funktioniert dann nicht mehr.`, `کۆدێ چوونەژوورێ ${s.code} ئێدی کار ناکەت.`, `The login code ${s.code} will stop working.`), // KU: review
      ok: tr("Löschen", "سڕین", "Delete"),
      danger: true,
    });
    if (ok) deleteStudent(s.uid).catch(() => setMsg(SAVE_FAIL));
  };
  const startEdit = (s) => {
    setEdit(s.uid); setF({ name: s.name, className: s.className, level: s.level, learnLang: learnLangOf(s) }); setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const match = (s) => `${s.name} ${s.code} ${s.className} ${LANG_NAME[learnLangOf(s)]}`.toLowerCase().includes(q.trim().toLowerCase());

  return (
    <>
      <Box title={edit ? tr("Schüler bearbeiten", "دەستکاریکرنا قوتابی", "Edit student") : tr("Schüler hinzufügen", "زێدەکرنا قوتابی", "Add student")} active={!!edit}>
        <form onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label={tr("Name", "ناڤ", "Name")}><input required className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label={tr("Klasse", "پۆل", "Class")}><input className="field" value={f.className} onChange={(e) => setF({ ...f, className: e.target.value })} /></Field>
            <Field label={tr("Niveau", "ئاست", "Level")}>
              <select className="field" value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}>{levels.map((l) => <option key={l.id}>{l.title}</option>)}</select>
            </Field>
            <Field label={tr("Lernsprache", "زمانێ فێربوونێ", "Learning language")}>{/* KU: review */}
              <select className="field" value={f.learnLang} onChange={(e) => setF({ ...f, learnLang: e.target.value })}>
                {LEARN_LANGS.map((l) => <option key={l} value={l}>{LANG_NAME[l]}</option>)}
              </select>
            </Field>
          </div>
          <SubmitRow editing={!!edit} busy={busy} label={tr("Anmeldecode erstellen", "کۆدێ چوونەژوورێ دروست بکە", "Create login code")} onCancel={() => { setEdit(null); setF(emptyStu); setMsg(null); }} />
          <Msg m={msg} />
        </form>
      </Box>
      <Box title={tr(`Schüler und Anmeldecodes (${students.length})`, `قوتابی و کۆدێن چوونەژوورێ (${students.length})`, `Students and login codes (${students.length})`)}>
        <div className="mb-3"><SearchBox value={q} onChange={setQ} /></div>
        {students.length === 0 && <p className="text-muted">{tr("Noch keine Schüler.", "هێشتا چ قوتابی نینن.", "No students yet.")}</p>}
        {students.filter(match).map((s) => (
          <Row key={s.uid} title={s.name} sub={`${s.code} · ${s.className} · ${s.level} · ${LANG_NAME[learnLangOf(s)]}`} onEdit={() => startEdit(s)} onDelete={() => del(s)} />
        ))}
      </Box>
    </>
  );
}
