import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const avatarKey = (code) => `avatar:${code}`;

function withAvatar(student) {
  let avatar = null;
  try {
    avatar = localStorage.getItem(avatarKey(student.code));
  } catch {}
  return { ...student, avatar };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("auth");
      if (saved) setUser(withAvatar(JSON.parse(saved).user));
    } catch {
      localStorage.removeItem("auth");
    }
    setLoading(false);
  }, []);

  const login = (student, token) => {
    localStorage.setItem("auth", JSON.stringify({ user: student, token }));
    setUser(withAvatar(student));
  };

  const logout = () => {
    localStorage.removeItem("auth");
    try { sessionStorage.removeItem("welcomed"); } catch { /* ignore */ }
    setUser(null);
  };

  // dataUrl = new picture, or null to remove it
  const setAvatar = (dataUrl) => {
    try {
      if (dataUrl) localStorage.setItem(avatarKey(user.code), dataUrl);
      else localStorage.removeItem(avatarKey(user.code));
    } catch {}
    setUser((u) => ({ ...u, avatar: dataUrl }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
