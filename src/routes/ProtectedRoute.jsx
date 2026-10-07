import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { startContentSync, useContent } from "../data/stories";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const { ready } = useContent();
  const { t } = useLang();
  const location = useLocation();
  const uid = user?.uid;

  // Live content from Firestore while someone is logged in
  useEffect(() => (uid ? startContentSync() : undefined), [uid]);

  if (loading) return <p className="p-6 text-muted">{t("common.loading")}</p>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!ready) return <p className="p-6 text-muted">{t("common.loading")}</p>;

  return <Outlet />;
}
