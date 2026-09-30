import { useState } from "react";
import { useParams } from "react-router-dom";
import WordRow from "../../components/WordRow";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { useLang } from "../../context/LangContext";
import { findWordTopic } from "../../data/stories";

export default function WordsList() {
  const { level, topicId } = useParams();
  const { t, tn } = useLang();
  const story = findWordTopic(level, topicId);
  const [query, setQuery] = useState("");

  if (!story || !story.words?.length) {
    return (
      <EmptyState
        title={t("common.notFoundTitle")}
        text={t("common.notFoundText")}
        linkTo={`/words/${level}`}
        linkLabel={t("common.back")}
      />
    );
  }

  const q = query.trim().toLowerCase();
  const shown = story.words.filter((w) => `${w.wordDe} ${w.wordKu}`.toLowerCase().includes(q));

  return (
    <div>
      <PageHeader
        title={story.titleDe}
        subtitle={`${story.titleKu}  (${tn("count.words", story.words.length)})`}
        backTo={`/words/${level}`}
      />

      <label htmlFor="find" className="sr-only">{t("words.search")}</label>
      <input
        id="find"
        dir="auto"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("words.search")}
        className="glass mb-5 w-full rounded-xl px-4 py-3 placeholder:text-faint"
      />

      <div className="glass overflow-hidden rounded-2xl">
        {shown.length === 0 ? (
          <p className="p-6 text-center text-muted">{t("words.noMatch", { q: query })}</p>
        ) : (
          shown.map((w, i) => <WordRow key={`${w.wordDe}-${i}`} entry={w} />)
        )}
      </div>
    </div>
  );
}
