import { useState } from "react";
import { getAnnouncement, setAnnouncement } from "../../data/settings";
import { SAVE_FAIL, useTr } from "./bi";
import { Tr, Box, Msg } from "./ui";

// Einstellungen: the announcement shown on the students' home page
export default function SettingsPage() {
  const tr = useTr();
  const [note, setNote] = useState(getAnnouncement());
  const [msg, setMsg] = useState(null);
  const saveNote = async () => {
    try { await setAnnouncement(note); } catch { return setMsg(SAVE_FAIL); }
    setMsg({
      ok: true,
      text: note.trim()
        ? tr("Die Ankündigung wird jetzt auf der Startseite der Schüler angezeigt ✓", "ڕاگەهاندن ئێستا ل رووپەلێ سەرەکی یێ قوتابیان دیار دبیت ✓", "The announcement now shows on the students' home page ✓")
        : tr("Ankündigung entfernt ✓", "ڕاگەهاندن هاتە سڕین ✓", "Announcement removed ✓"),
    });
  };
  return (
    <Box title={tr("Ankündigung für die Schüler", "ڕاگەهاندن بۆ قوتابیان", "Announcement for the students")}>
      <p className="mb-2 text-sm text-muted">
        <Tr
          de="Wird oben auf der Startseite der Schüler gezeigt. Leer lassen, um sie zu verstecken."
          ku="ل سەرویێ رووپەلێ سەرەکی یێ قوتابیان دیار دبیت. ڤالا بهێلە دا بهێتە ڤەشارتن."
          en="Shown at the top of the students' home page. Leave it empty to hide it."
        />
      </p>
      <textarea
        className="field" rows={2} dir="auto" value={note} onChange={(e) => setNote(e.target.value)}
        placeholder={tr("Beispiel: Freitag ist Quiz! Bitte lernt das Thema „Essen und Trinken“.", "نمونە: ئەینی کویزە! تکایە بابەتێ «Essen und Trinken» بخوێنن.", "Example: Quiz on Friday! Please revise the topic “Food and drink”.")}
      />
      <button onClick={saveNote} className="btn-primary mt-4 px-6 py-3">{tr("Ankündigung speichern", "ڕاگەهاندنێ بپارێزە", "Save announcement")}</button>
      <Msg m={msg} />
    </Box>
  );
}
