import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import QuestionCard from "../../components/QuestionCard";
import EmptyState from "../../components/EmptyState";
import { useLang } from "../../context/LangContext";
import { getLevel } from "../../data/levels";
import { useLibrary } from "../../data/useLibrary";
import PageHeader from "../../components/PageHeader";

const scrollBehavior = () => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");

export default function QuizPlay() {
  const { level, topicId } = useParams();
  const { t } = useLang();
  const { findQuiz, lang } = useLibrary();
  const lv = getLevel(level);
  const story = findQuiz(level, topicId);
  const quiz = story?.questions || [];

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null); // option index, or null
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const topRef = useRef(null);
  const nextRef = useRef(null);

  // After answering, scroll the "next" button into view (on phones it is below the screen / under the tab bar)
  useEffect(() => {
    if (selected !== null) nextRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: "nearest" });
  }, [selected]);

  if (!story || quiz.length === 0) {
    return (
      <EmptyState
        title={t("common.notFoundTitle")}
        text={t("quiz.none")}
        linkTo={`/quiz/${level}`}
        linkLabel={t("common.back")}
      />
    );
  }

  const total = quiz.length;
  const q = quiz[index];

  const handleSelect = (i) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.correctAnswer) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (index + 1 === total) {
      setFinished(true);
    } else {
      setIndex(index + 1);
      setSelected(null);
      // the button sits low on phones: bring the new question back into view
      if (topRef.current?.getBoundingClientRect().top < 0) topRef.current.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
    }
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const pct = Math.round((score / total) * 100);
    const msg = pct >= 80 ? "quiz.msgHigh" : pct >= 50 ? "quiz.msgMid" : "quiz.msgLow";
    return (
      <div style={{ "--accent": lv.color }} className="glass relative mx-auto max-w-lg overflow-hidden rounded-2xl p-8 text-center sm:p-12">
        {pct >= 80 &&
          Array.from({ length: 16 }, (_, i) => (
            <i key={i} className="confetti" style={{ left: `${(i * 6.3 + 4) % 96}%`, animationDelay: `${(i % 6) * 0.12}s`, background: ["#22d3ee", "#3b82f6", "#facc15", "#4ade80"][i % 4] }} />
          ))}
        <svg width="150" height="150" viewBox="0 0 140 140" className="mx-auto" aria-hidden="true">
          <circle cx="70" cy="70" r="60" fill="none" style={{ stroke: "var(--line)" }} strokeWidth="10" />
          <circle
            className="ring" cx="70" cy="70" r="60" fill="none" stroke="var(--accent)" strokeWidth="10" strokeLinecap="round"
            strokeDasharray="377" strokeDashoffset={377 * (1 - score / total)}
            transform="rotate(-90 70 70)"
          />
          <text x="70" y="78" textAnchor="middle" style={{ fill: "var(--fg)" }} fontSize="28" fontWeight="700">{pct}%</text>
        </svg>
        <h1 className="mt-6 font-display text-3xl font-semibold">{t("quiz.youGot", { s: score, n: total })}</h1>
        <p className="mt-2 text-muted">{t(msg)}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={restart} className="btn-primary px-5 py-3">{t("quiz.tryAgain")}</button>
          <Link to={`/quiz/${level}`} className="btn-ghost px-5 py-3">{t("quiz.backToList")}</Link>
        </div>
      </div>
    );
  }

  const progress = ((index + (selected !== null ? 1 : 0)) / total) * 100;

  return (
    <div style={{ "--accent": lv.color }} className="mx-auto max-w-2xl">
      <PageHeader title={story.title} subtitle={story.titleKu} backTo={`/quiz/${level}`} />

      <div ref={topRef} className="mb-2 flex scroll-mt-4 justify-between text-sm text-muted">
        <span>{t("quiz.questionOf", { i: index + 1, n: total })}</span>
        <span>{t("quiz.score", { n: score })}</span>
      </div>
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-line">
        <div
          className="bar-fill h-full rounded-full"
          style={{ width: `${progress}%`, background: "var(--accent)" }}
        />
      </div>

      <QuestionCard
        key={index}
        question={q.question}
        lang={lang}
        questionKu={q.questionKu}
        options={q.options}
        selected={selected}
        answer={q.correctAnswer}
        onSelect={handleSelect}
      />

      {selected !== null && (
        <button ref={nextRef} onClick={handleNext} className="btn-primary mt-6 w-full scroll-mb-28 py-4 text-lg lg:scroll-mb-8">
          {index + 1 === total ? t("quiz.seeScore") : t("quiz.next")}
        </button>
      )}
    </div>
  );
}
