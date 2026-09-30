import { Link } from "react-router-dom";
import { useLang } from "../context/LangContext";

export default function NotFound() {
  const { t } = useLang();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="font-display text-8xl font-bold" style={{ color: "var(--brand)" }}>404</h1>
      <p className="mt-3 text-muted">{t("notFound.text")}</p>
      <Link to="/" className="btn-primary mt-6 px-5 py-3">{t("notFound.home")}</Link>
    </div>
  );
}
