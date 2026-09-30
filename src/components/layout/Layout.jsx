import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LangContext";
import { APP_NAME } from "../../config";
import Icon from "../Icon";
import Avatar from "../Avatar";
import LangSwitch from "../LangSwitch";
import ThemeToggle from "../ThemeToggle";
import Welcome from "../Welcome";

const baseLinks = [
  { to: "/", key: "nav.home", icon: "home", end: true },
  { to: "/stories", key: "nav.stories", icon: "book" },
  { to: "/quiz", key: "nav.quiz", icon: "quiz" },
  { to: "/words", key: "nav.words", icon: "list" },
  { to: "/profile", key: "nav.profile", icon: "user" },
];
const ownerLink = { to: "/dashboard", key: "nav.dashboard", icon: "grid" };

export default function Layout() {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const { pathname } = useLocation();
  const links = user.role === "owner" ? [...baseLinks, ownerLink] : baseLinks;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen">
      <Welcome />
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-20 hidden w-72 flex-col border-e border-line bg-card p-6 lg:flex">
        <div className="px-3 font-display text-2xl font-semibold">{APP_NAME}</div>

        <nav className="mt-10 flex flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 font-medium transition ${
                  isActive ? "bg-soft text-fg" : "text-muted hover:bg-soft hover:text-fg"
                }`
              }
            >
              <Icon name={l.icon} size={20} />
              {t(l.key)}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-2"><LangSwitch /><ThemeToggle /></div>
          <div className="flex items-center gap-3 rounded-2xl bg-soft p-3">
            <Avatar user={user} size={44} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="truncate text-sm text-muted">{user.className}</p>
            </div>
            <button onClick={logout} aria-label={t("profile.logout")} className="ms-auto p-2 text-muted hover:text-fg">
              <Icon name="logout" size={20} className="rtl:rotate-180" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 pt-4 sm:px-5 lg:hidden">
        <span className="font-display text-lg font-extrabold sm:text-xl">{APP_NAME}</span>
        <div className="flex items-center gap-2"><LangSwitch /><ThemeToggle /></div>
      </header>

      <main className="lg:ps-72">
        <div className="mx-auto max-w-5xl px-5 py-8 pb-28 sm:px-8 lg:pb-12">
          <div key={pathname} className="page-in"><Outlet /></div>
        </div>
      </main>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid border-t border-line bg-card px-2 pb-[env(safe-area-inset-bottom)] lg:hidden" style={{ gridTemplateColumns: `repeat(${links.length}, 1fr)` }}>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-3 text-xs font-medium ${isActive ? "text-link" : "text-muted"}`
            }
          >
            <Icon name={l.icon} size={22} />
            {t(l.key)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
