import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { loadProfile, saveAvatar } from "../data/students";

const AuthContext = createContext(null);

// Firebase keeps the session; user = profile from Firestore + role + avatar (see data/students.js)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // dataUrl = new picture, or null to remove it
  const setAvatar = (dataUrl) => {
    setUser((u) => ({ ...u, avatar: dataUrl }));
    return saveAvatar(user.uid, dataUrl);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, setAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
