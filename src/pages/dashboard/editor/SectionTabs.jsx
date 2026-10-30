import { useTr } from "../bi";

// The editor's sections as tabs: a column next to the content on wide screens (stays in view while
// scrolling), a 2×2 grid (phones) or a row of four (tablets) above it. Arrow keys / Home / End move between tabs (WAI-ARIA tabs pattern).
// tabs: [{ id, label, count, error }]
export default function SectionTabs({ tabs, active, onSelect }) {
  const tr = useTr();

  const onKeyDown = (e) => {
    const i = tabs.findIndex((t) => t.id === active);
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const step = { ArrowDown: 1, ArrowUp: -1, ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
    const next = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : step ? (i + step + tabs.length) % tabs.length : -1;
    if (next < 0) return;
    e.preventDefault();
    onSelect(tabs[next].id);
    document.getElementById(`tab-${tabs[next].id}`)?.focus();
  };

  return (
    <div className="flex-[1_1_11rem] lg:sticky lg:top-6 lg:max-w-56">
      <div
        role="tablist" aria-label={tr("Teile der Geschichte", "پشکێن چیرۆکێ", "Parts of the story")} onKeyDown={onKeyDown}
        className="glass grid grid-cols-2 gap-1 rounded-2xl p-2 sm:grid-cols-4 lg:flex lg:flex-col"
      >{/* KU: review */}
        {tabs.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id} id={`tab-${t.id}`} type="button" role="tab" aria-selected={on} aria-controls={`panel-${t.id}`}
              tabIndex={on ? 0 : -1} onClick={() => onSelect(t.id)}
              className={`flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-xl border-s-4 px-3 font-semibold transition ${on ? "bg-soft text-fg" : "border-transparent text-muted hover:bg-soft hover:text-fg"}`}
              style={on ? { borderInlineStartColor: "var(--brand)" } : undefined}
            >
              <span className="truncate">{t.label}</span>
              <span className="flex items-center gap-2">
                {t.error && (
                  <span role="img" aria-label={tr("hat Fehler", "هەلە تێدا هەنە", "has errors")} className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--bad)" }} />
                )}{/* KU: review */}
                <span className="text-xs font-bold text-link">{t.count}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
