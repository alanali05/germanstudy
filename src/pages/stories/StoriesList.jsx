import { useParams } from "react-router-dom";
import StoryCard from "../../components/StoryCard";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useLang } from "../../context/LangContext";
import { getLevel } from "../../data/levels";
import { storiesOf } from "../../data/stories";

export default function StoriesList() {
  const { level } = useParams();
  const { t } = useLang();
  const lv = getLevel(level);
  const list = storiesOf(level);

  return (
    <div style={{ "--accent": lv.color }}>
      <PageHeader
        title={t("stories.levelTitle", { level: lv.title })}
        subtitle={t(`level.${lv.id}`)}
        backTo="/stories"
        level={lv}
      />

      {list.length === 0 ? (
        <EmptyState
          title={t("level.emptyTitle")}
          text={t("level.emptyText")}
          linkTo="/stories"
          linkLabel={t("common.chooseLevel")}
        />
      ) : (
        <div className="grid gap-4">
          {list.map((s,i) => (
            <StoryCard 
            key={s.id} 
            index={i+1} 
            to={`/stories/${level}/${s.id}`} 
            story={s} />
          ))}
        </div>
      )}
    </div>
  );
}
