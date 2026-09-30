import LevelCard from "../../components/LevelCard";
import PageHeader from "../../components/PageHeader";
import { useLang } from "../../context/LangContext";
import { levels } from "../../data/levels";
import { quizzesOf } from "../../data/stories";

export default function QuizLevels() {
  const { t, tn } = useLang();

  return (
    <div>
      <PageHeader title={t("quiz.title")} subtitle={t("quiz.sub")} />
      <div className="grid gap-5 sm:grid-cols-2">
        {levels.map((l) => {
          const n = quizzesOf(l.id).filter((s) => s.questions?.length).length;
          return (
            <LevelCard
              key={l.id}
              to={`/quiz/${l.id}`}
              level={l}
              info={n ? tn("count.quizzes", n) : t("common.comingSoon")}
            />
          );
        })}
      </div>
    </div>
  );
}
