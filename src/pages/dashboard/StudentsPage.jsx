import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useConfirm } from "../../context/ConfirmContext";
import { levels } from "../../data/levels";
import { createStudent, deleteStudent, updateStudent } from "../../data/students";
import { SAVE_FAIL, WAIT, useBi } from "./bi";
import { Box, Field, Msg, Row, SearchBox, SubmitRow } from "./ui";

// Schüler: create login codes, edit name / class / level, delete (revokes access)
const emptyStu = { name: "", className: "", level: "A1" };

export default function StudentsPage() {
  const bi = useBi();
  const { students } = useOutletContext();
  const confirm = useConfirm();
  const [f, setF] = useState(emptyStu);
  const [edit, setEdit] = useState(null); // uid of the student being edited
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const item = { name: f.name.trim(), className: f.className.trim(), level: f.level };
    setBusy(true); setMsg(WAIT);
    try {
      if (edit) {
        await updateStudent(edit, item);
        setMsg({ ok: true, text: bi("Änderungen gespeichert ✓", "گوهۆڕین هاتنە پاراستن ✓") });
      } else {
        const code = await createStudent(item);
        setMsg({ ok: true, text: bi(`Schüler erstellt ✓ Anmeldecode: ${code}`, `قوتابی هاتە دروستکرن ✓ کۆدێ چوونەژوورێ: ${code}`) });
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
      title: bi(`${s.name} löschen?`, `${s.name} بهێتە سڕین؟`), // KU: review
      text: bi(`Der Anmeldecode ${s.code} funktioniert dann nicht mehr.`, `کۆدێ چوونەژوورێ ${s.code} ئێدی کار ناکەت.`), // KU: review
      ok: bi("Löschen", "سڕین"),
      danger: true,
    });
    if (ok) deleteStudent(s.uid).catch(() => setMsg(SAVE_FAIL));
  };
  const startEdit = (s) => {
    setEdit(s.uid); setF({ name: s.name, className: s.className, level: s.level }); setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const match = (s) => `${s.name} ${s.code} ${s.className}`.toLowerCase().includes(q.trim().toLowerCase());

  return (
    <>
      <Box title={edit ? bi("Schüler bearbeiten", "دەستکاریکرنا قوتابی") : bi("Schüler hinzufügen", "زێدەکرنا قوتابی")} active={!!edit}>
        <form onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={bi("Name", "ناڤ")}><input required className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label={bi("Klasse", "پۆل")}><input className="field" value={f.className} onChange={(e) => setF({ ...f, className: e.target.value })} /></Field>
            <Field label={bi("Niveau", "ئاست")}>
              <select className="field" value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}>{levels.map((l) => <option key={l.id}>{l.title}</option>)}</select>
            </Field>
          </div>
          <SubmitRow editing={!!edit} busy={busy} label={bi("Anmeldecode erstellen", "کۆدێ چوونەژوورێ دروست بکە")} onCancel={() => { setEdit(null); setF(emptyStu); setMsg(null); }} />
          <Msg m={msg} />
        </form>
      </Box>
      <Box title={bi(`Schüler und Anmeldecodes (${students.length})`, `قوتابی و کۆدێن چوونەژوورێ (${students.length})`)}>
        <div className="mb-3"><SearchBox value={q} onChange={setQ} /></div>
        {students.length === 0 && <p className="text-muted">{bi("Noch keine Schüler.", "هێشتا چ قوتابی نینن.")}</p>}
        {students.filter(match).map((s) => (
          <Row key={s.uid} title={s.name} sub={`${s.code} · ${s.className} · ${s.level}`} onEdit={() => startEdit(s)} onDelete={() => del(s)} />
        ))}
      </Box>
    </>
  );
}
