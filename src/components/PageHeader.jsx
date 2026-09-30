import { Link } from "react-router-dom";
import Icon from "./Icon";
import LevelBadge from "./LevelBadge";
import { useLang } from "../context/LangContext";

export default function PageHeader({ title, subtitle, backTo, level }) {
  const { t } = useLang();

  return (
    <header className="mb-8">
      {backTo && (
        <Link to={backTo} className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
          <Icon name="back" size={16} className="rtl:rotate-180" /> {t("common.back")}
        </Link>
      )}
      <div className="flex items-center gap-4">
        {level && <LevelBadge level={level} size="lg" />}
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{title}</h1>
      </div>
      {subtitle && <p className="mt-2 max-w-xl text-muted">{subtitle}</p>}
    </header>
  );
}
