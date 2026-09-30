import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { getLevel } from "../data/levels";
import LevelBadge from "../components/LevelBadge";
import { getContent } from "../data/stories";
import { getAnnouncement } from "../data/settings";

export default function Home() {
  const { user } = useAuth();
  const { t, tn } = useLang();

  const firstName = user.name.split(" ")[0];
  const levelId = (user.level || "A1").toLowerCase();
  const level = getLevel(levelId);

  const all = Object.values(getContent().stories).flat();
  const nStories = all.length;
  const nQuestions = Object.values(getContent().quizzes).flat().reduce((sum, q) => sum + (q.questions?.length || 0), 0);
  const nWords = Object.values(getContent().wordTopics).flat().reduce((sum, w) => sum + (w.words?.length || 0), 0);

  const panels = [
    {
      to: "/stories",
      cls: "panel-stories md:col-span-2 min-h-[220px]",
      title: t("nav.stories"),
      text: t("home.storiesText"),
      info: tn("count.stories", nStories),
    },
    {
      to: "/quiz",
      cls: "panel-quiz min-h-[200px]",
      title: t("nav.quiz"),
      text: t("home.quizText"),
      info: tn("count.questions", nQuestions),
    },
    {
      to: "/words",
      cls: "panel-words min-h-[200px]",
      title: t("nav.words"),
      text: t("home.wordsText"),
      info: tn("count.words", nWords),
    },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
        {t("home.greeting", { name: firstName })}
      </h1>

      {getAnnouncement() && (
        <div role="note" dir="auto" className="glass mt-5 rounded-2xl border-s-4 p-4" style={{ borderInlineStartColor: "var(--brand)" }}>
          📣 {getAnnouncement()}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <LevelBadge level={level} />
        {user.className && <span className="glass rounded-full px-3 py-1 text-sm">{user.className}</span>}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to={`/stories/${levelId}`} className="btn-primary cta-pulse px-5 py-3">{t("home.readStories", { level: level.title })}</Link>
        <Link to={`/quiz/${levelId}`} className="btn-ghost px-5 py-3">{t("home.takeQuiz", { level: level.title })}</Link>
        <Link to={`/words/${levelId}`} className="btn-ghost px-5 py-3">{t("home.learnWords", { level: level.title })}</Link>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {panels.map((p) => (
          <Link key={p.to} to={p.to} className={`panel flex flex-col justify-between p-7 ${p.cls}`}>
            <div>
              <h2 className="font-display text-4xl font-semibold">{p.title}</h2>
              <p className="mt-2 max-w-sm text-muted">{p.text}</p>
            </div>
            <p className="mt-6 text-sm font-semibold text-fg">{p.info}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
