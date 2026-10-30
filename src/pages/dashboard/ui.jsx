// Small building blocks shared by the dashboard sections
import { useEffect, useLayoutEffect, useRef } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useTr } from "./bi";

// One-line text that grows taller as it wraps, so long sentences stay readable. Enter and pasted line
// breaks become spaces (a sentence is one line of text). onValue gets the new string.
export function AutoText({ value, onValue, className = "", ...props }) {
  const ref = useRef(null);
  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
  };
  useLayoutEffect(fit, [value]);
  // Narrower box = more lines: refit when the width changes (not the height, which fit() itself sets),
  // and once the web fonts have loaded (they wrap differently from the fallback font)
  useEffect(() => {
    let width = 0;
    const ro = new ResizeObserver(([e]) => {
      if (e.contentRect.width !== width) { width = e.contentRect.width; fit(); }
    });
    ro.observe(ref.current);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, []);
  return (
    <textarea
      ref={ref} rows={1} value={value} {...props}
      onChange={(e) => onValue(e.target.value.replace(/\s*\n\s*/g, " "))}
      onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
      className={`resize-none overflow-hidden ${className}`}
    />
  );
}

// Long texts / JSX in the app language
export const Tr = ({ de, ku, en }) => useTr()(de, ku, en);

export function Field({ label, hint, children }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      {hint && <span className="ms-2 font-normal text-faint">{hint}</span>}
      {children}
    </label>
  );
}

// A card section; "id" makes it a jump target, "aside" sits next to the title (e.g. a button)
export function Box({ id, title, aside, active, children }) {
  return (
    <section id={id} className="glass mb-6 scroll-mt-6 rounded-2xl p-4 sm:p-6" style={active ? { borderColor: "var(--brand)" } : undefined}>
      {(title || aside) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{title}</h2>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Row({ title, sub, badge, onEdit, onDelete }) {
  const tr = useTr();
  return (
    <div className="flex items-center gap-2 border-b border-line py-3 last:border-b-0 sm:gap-3">
      {badge}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold" dir="auto">{title}</p>
        {sub && <p className="truncate text-sm text-muted" dir="auto">{sub}</p>}
      </div>
      {onEdit && (
        <button onClick={onEdit} className="btn-mini inline-flex items-center gap-1 text-sm" aria-label={`${tr("Bearbeiten", "دەستکاریکرن", "Edit")} ${title}`}>
          <Pencil size={15} /><span className="hidden md:inline">{tr("Bearbeiten", "دەستکاریکرن", "Edit")}</span>
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className="btn-danger inline-flex items-center gap-1 text-sm" aria-label={`${tr("Löschen", "سڕین", "Delete")} ${title}`}>
          <Trash2 size={15} /><span className="hidden md:inline">{tr("Löschen", "سڕین", "Delete")}</span>
        </button>
      )}
    </div>
  );
}

export function Msg({ m }) {
  const tr = useTr();
  if (!m) return null;
  return <p role="status" className="mt-3 text-sm font-medium" style={{ color: m.ok ? "var(--ok)" : "var(--bad)" }}>{m.text ?? tr(m.de, m.ku, m.en)}</p>;
}

export function SubmitRow({ editing, label, onCancel, busy }) {
  const tr = useTr();
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <button disabled={busy} className="btn-primary inline-flex items-center gap-2 px-6 py-3">
        {editing ? <Pencil size={17} /> : <Plus size={18} />}
        {editing ? tr("Änderungen speichern", "گوهۆڕینان بپارێزە", "Save changes") : label}
      </button>
      {editing && <button type="button" onClick={onCancel} className="btn-ghost px-5 py-3">{tr("Abbrechen", "هەلوەشاندن", "Cancel")}</button>}
    </div>
  );
}

export function SearchBox({ value, onChange }) {
  const tr = useTr();
  return (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-faint" />
      <input className="field !mt-0 !ps-9" placeholder={tr("Suchen…", "گەڕیان…", "Search…")} value={value} onChange={(e) => onChange(e.target.value)} aria-label={tr("Suchen", "گەڕیان", "Search")} />
    </div>
  );
}
