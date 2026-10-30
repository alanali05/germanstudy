import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useConfirm } from "../../context/ConfirmContext";
import PageHeader from "../../components/PageHeader";
import { LEARN_LANGS } from "../../data/languages";
import { useContent } from "../../data/stories";
import { useStudents } from "../../data/students";
import { LEAVE, useTr } from "./bi";

// Owner dashboard (German, Kurdish or English, following the interface toggle): header with a one-line summary,
// the section switch, and the current section below. A section with unsaved changes reports them through setDirty,
// so switching sections asks first. "library" = which learning language's stories the list shows (de | en),
// remembered in this browser.
const SECTIONS = [
  ["/dashboard", "Geschichten", "چیرۆک", "Stories"],
  ["/dashboard/students", "Schüler", "قوتابی", "Students"],
  ["/dashboard/settings", "Einstellungen", "ڕێکخستن", "Settings"], // KU: review
];
const total = (byLevel, key) => Object.values(byLevel).flat().reduce((n, x) => n + (key ? x[key]?.length || 0 : 1), 0);

function savedLibrary() {
  try {
    const l = localStorage.getItem("dashLibrary");
    return LEARN_LANGS.includes(l) ? l : "de";
  } catch {
    return "de";
  }
}

export default function DashboardLayout() {
  const tr = useTr();
  const { pathname } = useLocation();
  const { content } = useContent();
  const students = useStudents();
  const [dirty, setDirty] = useState(false);
  const [library, setLibraryState] = useState(savedLibrary);
  const confirm = useConfirm();
  const navigate = useNavigate();
  const lib = content[library];
  const current = pathname.startsWith("/dashboard/students") ? 1 : pathname.startsWith("/dashboard/settings") ? 2 : 0;
  const n = [total(lib.stories), total(lib.wordTopics, "words"), total(lib.quizzes, "questions"), students.length];
  const guard = (to) => async (e) => {
    if (!dirty) return;
    e.preventDefault();
    if (await confirm(LEAVE(tr))) navigate(to);
  };
  const setLibrary = (l) => {
    setLibraryState(l);
    try { localStorage.setItem("dashLibrary", l); } catch { /* not remembered */ }
  };

  return (
    <div>
      <PageHeader
        title={tr("Dashboard", "داشبۆرد", "Dashboard")}
        subtitle={tr(`${n[0]} Geschichten · ${n[1]} Wörter · ${n[2]} Fragen · ${n[3]} Schüler`, `${n[0]} چیرۆک · ${n[1]} وشە · ${n[2]} پرسیار · ${n[3]} قوتابی`, `${n[0]} stories · ${n[1]} words · ${n[2]} questions · ${n[3]} students`)}
      />
      <nav aria-label={tr("Bereiche", "بەش", "Sections")} className="mb-6 flex flex-wrap gap-2">{/* KU: review */}
        {SECTIONS.map(([to, de, ku, en], i) => (
          <Link
            key={to} to={to} onClick={guard(to)} aria-current={i === current ? "page" : undefined}
            className={`inline-flex shrink-0 items-center px-4 font-semibold ${i === current ? "btn-primary" : "btn-ghost"}`}
          >
            {tr(de, ku, en)}
          </Link>
        ))}
      </nav>
      <Outlet context={{ students, setDirty, library, setLibrary }} />
    </div>
  );
}
