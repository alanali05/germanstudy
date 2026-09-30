import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { APP_NAME } from "../config";

// Welcome screen: shown once per browser session, after the user enters the site.
export default function Welcome() {
  const { user } = useAuth();
  const { t } = useLang();
  const [phase, setPhase] = useState(() => {
    try { return sessionStorage.getItem("welcomed") ? "gone" : "show"; } catch { return "gone"; }
  });

  const close = () => {
    setPhase("leaving");
    try { sessionStorage.setItem("welcomed", "1"); } catch { /* ignore */ }
    setTimeout(() => setPhase("gone"), 450);
  };

  useEffect(() => {
    if (phase !== "show") return;
    const id = setTimeout(close, 3000);
    return () => clearTimeout(id);
  }, [phase]);

  if (phase === "gone") return null;
  const firstName = (user?.name || "").split(" ")[0];

  return (
    <div className={`welcome ${phase === "leaving" ? "leaving" : ""}`} role="dialog" aria-label="Welcome">
      <div className="welcome-card">
        <div className="wave" aria-hidden="true">👋</div>
        <p className="mt-4 text-sm font-semibold uppercase tracking-widest text-green-300">{APP_NAME}</p>
        <h1 className="mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">{t("welcome.hello", { name: firstName })}</h1>
        <p className="mt-3 text-lg text-white/80">{t("welcome.sub")}</p>
        <button onClick={close} className="btn-primary mt-8 px-8 py-3 text-lg">{t("welcome.start")}</button>
        <div className="mx-auto mt-8 w-40 overflow-hidden rounded bg-white/15"><div className="drain" /></div>
      </div>
    </div>
  );
}
