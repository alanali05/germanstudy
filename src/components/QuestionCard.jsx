import { useEffect } from "react";
import Icon from "./Icon";
import { useLang } from "../context/LangContext";
import { speak, stopSpeaking } from "../utils/speak";

const KURDISH = /\p{Script=Arabic}/u;
// The German / English voice can't read Kurdish: drop Kurdish parts ('سپێده باش' in "Wie sagt man '…' auf Deutsch?")
const withoutKurdish = (text) =>
  text.replace(/'[^']*'/g, (m) => (KURDISH.test(m) ? "" : m)).replace(/[\p{Script=Arabic}]+/gu, "").replace(/\s+/g, " ").trim();

function ListenButton({ text, lang, label }) {
  return (
    <button type="button" onClick={() => speak(text, lang)} aria-label={label} className="shrink-0 rounded-xl p-2 text-muted hover:bg-soft hover:text-fg">
      <Icon name="volume" size={20} />
    </button>
  );
}

// selected and answer are option INDEXES (selected is null before the student answers); lang = learning language
export default function QuestionCard({ question, questionKu, lang, options, selected, answer, onSelect }) {
  const { t } = useLang();
  const stateClass = (i) => {
    if (selected === null) return "";
    if (i === answer) return "opt-right";
    if (i === selected) return "opt-wrong";
    return "opt-dim";
  };
  const spoken = withoutKurdish(question);

  useEffect(() => () => stopSpeaking(), []); // next question / leaving the quiz stops the voice

  return (
    <div className="glass rounded-2xl p-6 sm:p-10">
      <div className="flex items-start gap-2">
        <h2 dir="ltr" lang={lang} className="min-w-0 flex-1 font-display text-2xl font-semibold sm:text-3xl">{question}</h2>
        {spoken && <ListenButton text={spoken} lang={lang} label={t("common.listen")} />}
      </div>
      <p dir="rtl" lang="ku" className="mt-3 text-right text-lg text-muted">{questionKu}</p>

      <div className="mt-8 grid gap-3">
        {options.map((option, i) => {
          const target = !KURDISH.test(option); // in the learning language, so it can be read aloud
          return (
            <div key={i} dir={target ? "ltr" : undefined} className="relative">
              <button
                disabled={selected !== null}
                onClick={() => onSelect(i)}
                dir="auto"
                className={`opt w-full rounded-2xl px-5 py-4 text-start text-lg ${target ? "pe-14" : ""} ${stateClass(i)}`}
              >
                {option}
              </button>
              {/* Answers in the learning language can be heard too (also before answering) */}
              {target && (
                <span className="absolute end-2 top-1/2 -translate-y-1/2">
                  <ListenButton text={option} lang={lang} label={`${t("common.listen")}: ${option}`} />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
