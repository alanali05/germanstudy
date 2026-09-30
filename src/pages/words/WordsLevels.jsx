import LevelCard from "../../components/LevelCard";
import PageHeader from "../../components/PageHeader";
import { useLang } from "../../context/LangContext";
import { levels } from "../../data/levels";
import { wordTopicsOf } from "../../data/stories";

export default function WordsLevels() {
  const { t, tn } = useLang();

  return (
    <div>
      <PageHeader title={t("words.title")} subtitle={t("words.sub")} />
      <div className="grid gap-5 sm:grid-cols-2">
        {levels.map((l) => {
          const n = wordTopicsOf(l.id).reduce((sum, s) => sum + (s.words?.length || 0), 0);
          return (
            <LevelCard
              key={l.id}
              to={`/words/${l.id}`}
              level={l}
              info={n ? tn("count.words", n) : t("common.comingSoon")}
            />
          );
        })}
      </div>
    </div>
  );
}
