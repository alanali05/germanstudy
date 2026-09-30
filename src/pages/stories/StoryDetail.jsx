import { Link, useParams, useLocation } from "react-router-dom";
import EmptyState from "../../components/EmptyState";
import StoryReader from "../../components/StoryReader";
import Icon from "../../components/Icon";
import { useLang } from "../../context/LangContext";
import { getLevel } from "../../data/levels";
import { findStory, linkedQuizzes, linkedWordTopics } from "../../data/stories";

export default function StoryDetail() {
  const { level, storyId } = useParams();
  const { t } = useLang();
  const location = useLocation();
  const lv = getLevel(level);
  const story = findStory(level, storyId);

  if (!story) {
    return (
      <EmptyState
        title={t("common.notFoundTitle")}
        text={t("common.notFoundText")}
        linkTo={`/stories/${level}`}
        linkLabel={t("common.back")}
      />
    );
  }

  // Story number: comes from the card the user clicked (or from the data)
  const num = location.state?.index ?? story.number ?? story.order ?? null;

  const words = linkedWordTopics(story.id);
  const quizzes = linkedQuizzes(story.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-1 sm:px-0">
      <Link
        to={`/stories/${level}`}
        className="mb-4 inline-flex min-h-[44px] items-center gap-2 text-sm text-muted hover:text-fg sm:mb-6"
      >
        <Icon name="back" size={16} className="rtl:rotate-180" /> {t("common.back")}
      </Link>

      {/* Chips */}
      <div dir="ltr" className="mb-3 flex flex-wrap items-center gap-2">
        <span className="chip" style={{ "--c": lv.color }}>{lv.title}</span>
        {story.readTime && (
          <span className="chip" style={{ "--c": "#64748b" }}>{story.readTime}</span>
        )}
      </div>

      {/* Number + German title */}
      <div dir="ltr" className="flex items-start gap-3 sm:gap-4">
        {num != null && (
          <span
            className="grid size-10 shrink-0 place-items-center rounded-xl text-base font-bold tabular-nums
                       sm:size-14 sm:rounded-2xl sm:text-2xl"
            style={{
              background: "color-mix(in srgb, var(--accent) 18%, transparent)",
              border: "1px solid color-mix(in srgb, var(--accent) 45%, transparent)",
              color: "var(--fg)",
            }}
          >
            {num}
          </span>
        )}
        <h1
          lang="de"
          className="font-display min-w-0 flex-1 break-words text-2xl font-semibold leading-tight
                     sm:text-3xl lg:text-4xl"
        >
          {story.titleDe}
        </h1>
      </div>

      {/* Kurdish title */}
      <p
        dir="rtl"
        lang="ku"
        className="mb-5 mt-2 break-words text-right text-lg text-muted sm:mb-6 sm:text-xl"
      >
        {story.titleKu}
      </p>

      <StoryReader story={story} />

      {(quizzes.length > 0 || words.length > 0) && (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {words.map((w) => (
            <Link
              key={w.id}
              to={`/words/${w.level}/${w.id}`}
              className="btn-ghost inline-flex w-full items-center justify-center px-5 py-3 text-center font-semibold sm:w-auto"
            >
              {t("nav.words")} · {w.titleDe}
            </Link>
          ))}
          {quizzes.map((q) => (
            <Link
              key={q.id}
              to={`/quiz/${q.level}/${q.id}`}
              className="btn-primary inline-flex w-full items-center justify-center px-5 py-3 text-center sm:w-auto"
            >
              {t("nav.quiz")} · {q.titleDe}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}