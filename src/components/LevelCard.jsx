import { Link } from "react-router-dom";
import { useLang } from "../context/LangContext";
import { levels } from "../data/levels";
import Icon from "./Icon";
import LevelBadge from "./LevelBadge";

export default function LevelCard({ to, level, info }) {
  const { t } = useLang();
  const step = levels.findIndex((l) => l.id === level.id) + 1;

  return (
    <Link to={to} style={{ "--accent": level.color }} className="level-card">
      <span className="level-ghost" aria-hidden="true" dir="ltr">{level.title}</span>

      <div className="relative flex items-start justify-between">
        <LevelBadge level={level} size="lg" />
        <span className="level-go"><Icon name="chevron" size={18} className="rtl:rotate-180" /></span>
      </div>

      <div className="relative mt-8">
        <div className="steps mb-3" aria-hidden="true">
          {levels.map((l, i) => <i key={l.id} className={i < step ? "on" : ""} />)}
        </div>
        <h3 className="text-2xl font-extrabold">{t(`level.${level.id}`)}</h3>
        <p className="mt-1 min-h-[3rem] text-muted">{t(`level.${level.id}.desc`)}</p>
        <p className="level-pill mt-3 inline-block rounded-full px-3 py-1 text-sm font-semibold">{info}</p>
      </div>
    </Link>
  );
}
