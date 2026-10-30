import { useEffect } from "react";
import { Check, Loader2, Undo2, X } from "lucide-react";
import { useBi } from "../bi";
import { Msg } from "../ui";

const FAB = "grid place-items-center rounded-full border border-line bg-card shadow-lg disabled:opacity-50";

// Save / undo / discard for the editor, shown while there is something to save or undo, or a save message.
// Wide screens: a sticky bar at the bottom. Phones: round floating buttons above the tab bar (a bar would cover too much).
export default function SaveBar({ dirty, busy, msg, canUndo, onSave, onUndo, onDiscard, onClearMsg }) {
  const bi = useBi();

  // "Saved ✓" goes away by itself; errors stay until the next change
  useEffect(() => {
    if (!msg?.ok) return;
    const id = setTimeout(onClearMsg, 4000);
    return () => clearTimeout(id);
  }, [msg, onClearMsg]);

  if (!dirty && !msg && !canUndo) return null;
  const saveLabel = busy ? bi("Speichert…", "دهێتە پاراستن…") : bi("Speichern", "بپارێزە"); // KU: review
  const undoLabel = bi("Rückgängig", "زڤڕاندن"); // KU: review
  const discardLabel = bi("Alle Änderungen verwerfen", "هەمی گوهۆڕینان ژێ ببە"); // KU: review

  return (
    <>
      {/* Wide screens */}
      <div className="glass sticky bottom-4 z-10 mt-2 hidden flex-wrap items-center gap-3 rounded-2xl p-3 lg:flex">
        <div className="me-auto text-sm font-semibold">
          {dirty && (
            <p><span aria-hidden="true" style={{ color: "#f59e0b" }}>● </span>{bi("Nicht gespeicherte Änderungen", "گوهۆڕینێن نەپاراستی")}</p>
          )}{/* KU: review */}
          <Msg m={msg} />
        </div>
        {canUndo && (
          <button type="button" onClick={onUndo} disabled={busy} className="btn-ghost inline-flex items-center gap-2 px-4">
            <Undo2 size={17} className="rtl:-scale-x-100" /> {undoLabel}
          </button>
        )}
        {dirty && (
          <>
            <button type="button" onClick={onDiscard} disabled={busy} className="btn-ghost px-5">{bi("Verwerfen", "ژێ ببە")}</button>{/* KU: review */}
            <button type="button" onClick={onSave} disabled={busy} className="btn-primary px-6">{saveLabel}</button>
          </>
        )}
      </div>

      {/* Phones and tablets */}
      <div className="lg:hidden">
        {msg && (
          <div className="glass fixed inset-x-4 bottom-40 z-30 rounded-xl px-3 py-2 shadow-lg [&>p]:mt-0">
            <Msg m={msg} />
          </div>
        )}
        {/* one row in the corner: discard, undo, then save at the edge */}
        <div className="fixed bottom-24 end-4 z-30 flex items-center gap-3">
          {dirty && (
            <button type="button" onClick={onDiscard} disabled={busy} aria-label={discardLabel} title={discardLabel} className={`${FAB} h-12 w-12 text-muted`}>
              <X size={20} />
            </button>
          )}
          {canUndo && (
            <button type="button" onClick={onUndo} disabled={busy} aria-label={undoLabel} title={undoLabel} className={`${FAB} h-12 w-12`}>
              <Undo2 size={20} className="rtl:-scale-x-100" />
            </button>
          )}
          {dirty && (
            <button type="button" onClick={onSave} disabled={busy} aria-label={saveLabel} title={saveLabel} className="btn-primary relative grid h-14 w-14 place-items-center !rounded-full">
              {busy ? <Loader2 size={24} className="animate-spin" /> : <Check size={26} />}
              {/* unsaved changes */}
              <span aria-hidden="true" className="absolute end-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-[var(--card)]" style={{ background: "#f59e0b" }} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
