import { useState } from "react";
import { getAnnouncement, setAnnouncement } from "../../data/settings";
import { SAVE_FAIL, useBi } from "./bi";
import { Bi, Box, Msg } from "./ui";

// Einstellungen: the announcement shown on the students' home page
export default function SettingsPage() {
  const bi = useBi();
  const [note, setNote] = useState(getAnnouncement());
  const [msg, setMsg] = useState(null);
  const saveNote = async () => {
    try { await setAnnouncement(note); } catch { return setMsg(SAVE_FAIL); }
    setMsg({
      ok: true,
      text: note.trim()
        ? bi("Die Ankündigung wird jetzt auf der Startseite der Schüler angezeigt ✓", "ڕاگەهاندن ئێستا ل رووپەلێ سەرەکی یێ قوتابیان دیار دبیت ✓")
        : bi("Ankündigung entfernt ✓", "ڕاگەهاندن هاتە سڕین ✓"),
    });
  };
  return (
    <Box title={bi("Ankündigung für die Schüler", "ڕاگەهاندن بۆ قوتابیان")}>
      <p className="mb-2 text-sm text-muted">
        <Bi
          de="Wird oben auf der Startseite der Schüler gezeigt. Leer lassen, um sie zu verstecken."
          ku="ل سەرویێ رووپەلێ سەرەکی یێ قوتابیان دیار دبیت. ڤالا بهێلە دا بهێتە ڤەشارتن."
        />
      </p>
      <textarea
        className="field" rows={2} dir="auto" value={note} onChange={(e) => setNote(e.target.value)}
        placeholder={bi("Beispiel: Freitag ist Quiz! Bitte lernt das Thema „Essen und Trinken“.", "نمونە: ئەینی کویزە! تکایە بابەتێ «Essen und Trinken» بخوێنن.")}
      />
      <button onClick={saveNote} className="btn-primary mt-4 px-6 py-3">{bi("Ankündigung speichern", "ڕاگەهاندنێ بپارێزە")}</button>
      <Msg m={msg} />
    </Box>
  );
}
