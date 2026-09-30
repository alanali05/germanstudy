import LevelCard from "../../components/LevelCard";
import PageHeader from "../../components/PageHeader";
import { useLang } from "../../context/LangContext";
import { levels } from "../../data/levels";
import { storiesOf } from "../../data/stories";

export default function StoriesLevels() {
  const { t, tn } = useLang();

  return (
    <div>
      <PageHeader title={t("stories.title")} subtitle={t("stories.sub")} />
      <div className="grid gap-5 sm:grid-cols-2">
        {levels.map((l) => {
          const n = storiesOf(l.id).length;
          return (
            <LevelCard
              key={l.id}
              to={`/stories/${l.id}`}
              level={l}
              info={n ? tn("count.stories", n) : t("common.comingSoon")}
            />
          );
        })}
      </div>
    </div>
  );
}
