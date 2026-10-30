import { useEffect } from "react";
import Icon from "./Icon";
import { useLang } from "../context/LangContext";
import { speak, stopSpeaking } from "../utils/speak";

const KURDISH = /\p{Script=Arabic}/u;
// The German voice can't read Kurdish: drop Kurdish parts ('سپێده باش' in "Wie sagt man '…' auf Deutsch?")
const germanOnly = (text) =>
  text.replace(/'[^']*'/g, (m) => (KURDISH.test(m) ? "" : m)).replace(/[\p{Script=Arabic}]+/gu, "").replace(/\s+/g, " ").trim();

function ListenButton({ text, label }) {
  return (
    <button type="button" onClick={() => speak(text)} aria-label={label} className="shrink-0 rounded-xl p-2 text-muted hover:bg-soft hover:text-fg">
      <Icon name="volume" size={20} />
    </button>
  );
}

// selected and answer are option INDEXES (selected is null before the student answers)
export default function QuestionCard({ questionDe, questionKu, options, selected, answer, onSelect }) {
  const { t } = useLang();
  const stateClass = (i) => {
    if (selected === null) return "";
    if (i === answer) return "opt-right";
    if (i === selected) return "opt-wrong";
    return "opt-dim";
  };
  const spoken = germanOnly(questionDe);

  useEffect(() => () => stopSpeaking(), []); // next question / leaving the quiz stops the voice

  return (
    <div className="glass rounded-2xl p-6 sm:p-10">
      <div className="flex items-start gap-2">
        <h2 dir="ltr" lang="de" className="min-w-0 flex-1 font-display text-2xl font-semibold sm:text-3xl">{questionDe}</h2>
        {spoken && <ListenButton text={spoken} label={t("common.listen")} />}
      </div>
      <p dir="rtl" lang="ku" className="mt-3 text-right text-lg text-muted">{questionKu}</p>

      <div className="mt-8 grid gap-3">
        {options.map((option, i) => {
          const german = !KURDISH.test(option);
          return (
            <div key={i} dir={german ? "ltr" : undefined} className="relative">
              <button
                disabled={selected !== null}
                onClick={() => onSelect(i)}
                dir="auto"
                className={`opt w-full rounded-2xl px-5 py-4 text-start text-lg ${german ? "pe-14" : ""} ${stateClass(i)}`}
              >
                {option}
              </button>
              {/* German answers can be heard too (also before answering) */}
              {german && (
                <span className="absolute end-2 top-1/2 -translate-y-1/2">
                  <ListenButton text={option} label={`${t("common.listen")}: ${option}`} />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
