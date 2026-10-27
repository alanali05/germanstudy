import { useBi } from "../bi";
import { Msg } from "../ui";

// Sticky bar at the bottom of the editor. Shown while there are unsaved changes, or to show the last save message.
// On phones it sits above the app's bottom tab bar.
export default function SaveBar({ dirty, busy, msg, onSave, onDiscard }) {
  const bi = useBi();
  if (!dirty && !msg) return null;
  return (
    <div className="glass sticky bottom-20 z-10 mt-2 flex flex-wrap items-center gap-3 rounded-2xl p-3 lg:bottom-4">
      <div className="me-auto text-sm font-semibold">
        {dirty && (
          <p><span aria-hidden="true" style={{ color: "#f59e0b" }}>● </span>{bi("Nicht gespeicherte Änderungen", "گوهۆڕینێن نەپاراستی")}</p>
        )}{/* KU: review */}
        <Msg m={msg} />
      </div>
      {dirty && (
        <>
          <button type="button" onClick={onDiscard} disabled={busy} className="btn-ghost px-5">{bi("Verwerfen", "ژێ ببە")}</button>{/* KU: review */}
          <button type="button" onClick={onSave} disabled={busy} className="btn-primary px-6">
            {busy ? bi("Speichert…", "دهێتە پاراستن…") : bi("Speichern", "بپارێزە")}{/* KU: review */}
          </button>
        </>
      )}
    </div>
  );
}
