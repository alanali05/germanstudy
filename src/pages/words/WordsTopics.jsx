import { useParams } from "react-router-dom";
import TopicCard from "../../components/TopicCard";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useLang } from "../../context/LangContext";
import { getLevel } from "../../data/levels";
import { wordTopicsOf } from "../../data/stories";

export default function WordsTopics() {
  const { level } = useParams();
  const { t, tn } = useLang();

  const lv = getLevel(level);
  const topics = wordTopicsOf(level).filter((s) => s.words?.length);

  return (
    <div 
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      style={{ "--accent": lv.color }}
    >
      <PageHeader
        title={t("words.levelTitle", { level: lv.title })}
        subtitle={t(`level.${lv.id}`)}
        backTo="/words"
        level={lv}
      />

      {topics.length === 0 ? (
        <EmptyState
          title={t("level.emptyTitle")}
          text={t("level.emptyText")}
          linkTo="/words"
          linkLabel={t("common.chooseLevel")}
        />
      ) : (
        /* Responsive Grid: 1 col on mobile, 2 cols on tablets, 3 cols on desktops */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {topics.map((s, i) => (
            <TopicCard
              key={s.id}
              index={i + 1}
              to={`/words/${level}/${s.id}`}
              title={s.titleDe}
              subtitle={s.titleKu}
              info={tn("count.words", s.words.length)}
            />
          ))}
        </div>
      )}
    </div>
  );
}