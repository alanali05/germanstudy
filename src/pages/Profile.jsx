import { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { getLevel } from "../data/levels";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";
import PageHeader from "../components/PageHeader";
import { toJpeg, uploadImage } from "../services/upload";

export default function Profile() {
  const { user, logout, setAvatar } = useAuth();
  const { t } = useLang();
  const fileRef = useRef(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const level = getLevel((user.level || "A1").toLowerCase());

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same file again
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t("profile.notImage"));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError(t("profile.tooLarge"));
      return;
    }
    setError("");
    setBusy(true);

    // Crop to a small square JPEG, upload it to R2, then save its link
    toJpeg(file, { size: 320, square: true })
      .then((blob) => uploadImage("avatar", blob))
      .then((url) => setAvatar(url))
      .catch((err) => setError(t(err.message === "OPEN_FAIL" ? "profile.openFail" : "profile.saveFail")))
      .finally(() => setBusy(false));
  };

  return (
    <div>
      <PageHeader title={t("profile.title")} />

      <div className="glass flex flex-col items-center gap-8 rounded-2xl p-6 sm:flex-row sm:p-10">
        <div className="relative">
          <Avatar user={user} size={150} />
          <button
            onClick={() => fileRef.current.click()}
            disabled={busy}
            aria-label={t("profile.change")}
            className="btn-primary absolute bottom-1 end-1 flex h-11 w-11 items-center justify-center !rounded-full"
          >
            <Icon name="camera" size={20} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>

        <div className="w-full text-center sm:text-start">
          <h2 className="font-display text-4xl font-semibold">{user.name}</h2>

          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <span className="chip" style={{ "--c": level.color }}>
              {level.title}
            </span>
            {user.className && <span className="rounded-full bg-line px-3 py-1 text-sm">{user.className}</span>}
          </div>

          <div className="mt-6 inline-block rounded-2xl bg-soft px-5 py-3">
            <p className="text-sm text-muted">{t("profile.yourCode")}</p>
            <p dir="ltr" className="text-xl font-semibold tracking-widest">{user.code}</p>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm" style={{ color: "var(--bad)" }}>
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
            <button onClick={() => fileRef.current.click()} disabled={busy} className="btn-primary px-5 py-3">
              {t("profile.change")}
            </button>
            {user.avatar && (
              <button onClick={() => setAvatar(null).catch(() => setError(t("profile.saveFail")))} className="btn-ghost px-5 py-3">
                {t("profile.remove")}
              </button>
            )}
          </div>
        </div>
      </div>

      <button onClick={logout} className="btn-ghost mt-6 inline-flex items-center gap-2 px-5 py-3">
        <Icon name="logout" size={18} className="rtl:rotate-180" /> {t("profile.logout")}
      </button>
    </div>
  );
}
