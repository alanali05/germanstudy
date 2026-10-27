import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { useContent } from "../../data/stories";
import { useStudents } from "../../data/students";
import { useBi } from "./bi";

// Owner dashboard (only German + Kurdish): header with a one-line summary, the section switch, and the current
// section below. A section with unsaved changes reports them through setDirty, so switching sections asks first.
const SECTIONS = [
  ["/dashboard", "Geschichten", "چیرۆک"],
  ["/dashboard/students", "Schüler", "قوتابی"],
  ["/dashboard/settings", "Einstellungen", "ڕێکخستن"], // KU: review
];
const total = (byLevel, key) => Object.values(byLevel).flat().reduce((n, x) => n + (key ? x[key]?.length || 0 : 1), 0);

export default function DashboardLayout() {
  const bi = useBi();
  const { pathname } = useLocation();
  const { content } = useContent();
  const students = useStudents();
  const [dirty, setDirty] = useState(false);
  const current = pathname.startsWith("/dashboard/students") ? 1 : pathname.startsWith("/dashboard/settings") ? 2 : 0;
  const n = [total(content.stories), total(content.wordTopics, "words"), total(content.quizzes, "questions"), students.length];
  const guard = (e) => {
    if (dirty && !window.confirm(bi("Änderungen verwerfen?", "گوهۆڕینان ژێ ببەی؟"))) e.preventDefault(); // KU: review
  };

  return (
    <div>
      <PageHeader
        title={bi("Dashboard", "داشبۆرد")}
        subtitle={bi(`${n[0]} Geschichten · ${n[1]} Wörter · ${n[2]} Fragen · ${n[3]} Schüler`, `${n[0]} چیرۆک · ${n[1]} وشە · ${n[2]} پرسیار · ${n[3]} قوتابی`)}
      />
      <nav aria-label={bi("Bereiche", "بەش")} className="-mx-1 mb-6 flex gap-2 overflow-x-auto p-1">{/* KU: review */}
        {SECTIONS.map(([to, de, ku], i) => (
          <Link
            key={to} to={to} onClick={guard} aria-current={i === current ? "page" : undefined}
            className={`inline-flex shrink-0 items-center px-4 font-semibold ${i === current ? "btn-primary" : "btn-ghost"}`}
          >
            {bi(de, ku)}
          </Link>
        ))}
      </nav>
      <Outlet context={{ students, setDirty }} />
    </div>
  );
}
