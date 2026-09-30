import { useParams } from "react-router-dom";
import TopicCard from "../../components/TopicCard";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useLang } from "../../context/LangContext";
import { getLevel } from "../../data/levels";
import { quizzesOf } from "../../data/stories";

export default function QuizTopics() {
  const { level } = useParams();
  const { t, tn } = useLang();

  const lv = getLevel(level);
  const topics = quizzesOf(level).filter(
    (s) => s.questions?.length
  );

  return (
    <div 
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      style={{ "--accent": lv.color }}
    >
      <PageHeader
        title={t("quiz.levelTitle", { level: lv.title })}
        subtitle={t(`level.${lv.id}`)}
        backTo="/quiz"
        level={lv}
      />

      {topics.length === 0 ? (
        <EmptyState
          title={t("level.emptyTitle")}
          text={t("level.emptyText")}
          linkTo="/quiz"
          linkLabel={t("common.chooseLevel")}
        />
      ) : (
        /* Adaptive responsive grid layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {topics.map((s, i) => (
            <TopicCard
              key={s.id}
              index={i + 1}
              to={`/quiz/${level}/${s.id}`}
              title={s.titleDe}
              subtitle={s.titleKu}
              info={tn(
                "count.questions",
                s.questions.length
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}