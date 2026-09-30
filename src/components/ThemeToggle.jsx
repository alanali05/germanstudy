import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useLang } from "../context/LangContext";

export default function ThemeToggle({ withLabel = false }) {
  const { theme, toggle } = useTheme();
  const { t } = useLang();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      onClick={toggle}
      aria-label={t(`theme.${next}`)}
      title={t(`theme.${next}`)}
      className="btn-ghost inline-flex items-center gap-2 px-3"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      {withLabel && <span className="text-sm">{t(`theme.${next}`)}</span>}
    </button>
  );
}
