import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { loadProfile, saveAvatar } from "../data/students";
import { useConfirm } from "./ConfirmContext";
import { useLang } from "./LangContext";

const AuthContext = createContext(null);

// Firebase keeps the session; user = profile from Firestore + role + avatar (see data/students.js)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();
  const { t } = useLang();

  useEffect(
    () =>
      onAuthStateChanged(auth, async (fbUser) => {
        if (!fbUser) {
          setUser(null);
          setLoading(false);
          return;
        }
        try {
          const profile = await loadProfile(fbUser);
          if (!profile) return signOut(auth); // runs this listener again with null
          setUser(profile);
        } catch (err) {
          console.error("Could not load profile:", err);
          setUser(null);
        }
        setLoading(false);
      }),
    []
  );

  const logout = () => {
    try { sessionStorage.removeItem("welcomed"); } catch { /* ignore */ }
    return signOut(auth);
  };

  // Logout button: asks first; students are reminded of the code they need to come back
  const askLogout = async () => {
    const ok = await confirm({
      title: t("profile.logoutAsk"),
      text: user?.role === "student" ? t("profile.logoutHint", { code: user.code }) : undefined,
      ok: t("profile.logout"),
      danger: true,
    });
    if (ok) await logout();
  };

  // url = new picture (already uploaded to R2), or null to remove it
  const setAvatar = (url) => {
    setUser((u) => ({ ...u, avatar: url }));
    return saveAvatar(user.uid, url);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, askLogout, setAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
