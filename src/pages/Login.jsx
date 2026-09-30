import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { loginWithCode } from "../services/api";
import { levels } from "../data/levels";
import { APP_NAME } from "../config";
import LangSwitch from "../components/LangSwitch";
import ThemeToggle from "../components/ThemeToggle";

export default function Login() {
  const { user, login } = useAuth();
  const { t } = useLang();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { student, token } = await loginWithCode(code);
      login(student, token);
    } catch (err) {
      setError(err.code === "INVALID_CODE" ? t("login.invalid") : err.message);
      setBusy(false);
    }
  };

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <div className="absolute end-4 top-4 z-10 flex items-center gap-2">
        <ThemeToggle />
        <LangSwitch />
      </div>

      {/* Left: the four levels, big */}
      <section className="hidden flex-col justify-between overflow-hidden border-e border-line p-12 lg:flex">
        <div className="font-display text-2xl font-semibold">{APP_NAME}</div>
        <div dir="ltr" className="select-none leading-[0.85]" aria-hidden="true">
          {levels.map((l) => (
            <div
              key={l.id}
              className="font-display font-bold"
              style={{ color: l.color, fontSize: "clamp(4rem, 10vw, 8rem)" }}
            >
              {l.title}
            </div>
          ))}
        </div>
        <p className="max-w-sm text-lg text-muted">{t("login.tagline")}</p>
      </section>

      {/* Right: code form */}
      <section className="flex items-center justify-center p-6 pt-20 lg:pt-6">
        <form onSubmit={handleSubmit} className="rise w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="font-display text-2xl font-semibold">{APP_NAME}</div>
            <div dir="ltr" className="mt-3 flex gap-2">
              {levels.map((l) => (
                <span key={l.id} className="chip" style={{ "--c": l.color }}>
                  {l.title}
                </span>
              ))}
            </div>
          </div>

          <h1 className="font-display text-4xl font-semibold">{t("login.title")}</h1>
          <p className="mt-2 text-muted">{t("login.sub")}</p>

          <label htmlFor="code" className="mt-8 block text-sm font-medium text-fg">
            {t("login.label")}
          </label>
          <input
            id="code"
            dir="ltr"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="SARA-4821"
            required
            className="glass mt-2 w-full rounded-xl px-4 py-4 text-center text-2xl font-semibold tracking-widest placeholder:text-faint"
          />

          {error && (
            <p role="alert" className="mt-3 text-sm" style={{ color: "var(--bad)" }}>
              {error}
            </p>
          )}

          <button disabled={busy} className="btn-primary mt-6 w-full py-4 text-lg disabled:opacity-60">
            {busy ? t("login.checking") : t("login.enter")}
          </button>

          <p className="mt-6 text-sm text-muted">{t("login.lost")}</p>
        </form>
      </section>
    </div>
  );
}
