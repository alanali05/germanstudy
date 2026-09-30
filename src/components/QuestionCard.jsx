// selected and answer are option INDEXES (selected is null before the student answers)
export default function QuestionCard({ questionDe, questionKu, options, selected, answer, onSelect }) {
  const stateClass = (i) => {
    if (selected === null) return "";
    if (i === answer) return "opt-right";
    if (i === selected) return "opt-wrong";
    return "opt-dim";
  };

  return (
    <div className="glass rounded-2xl p-6 sm:p-10">
      <h2 dir="ltr" lang="de" className="font-display text-2xl font-semibold sm:text-3xl">{questionDe}</h2>
      <p dir="rtl" lang="ku" className="mt-3 text-right text-lg text-muted">{questionKu}</p>

      <div className="mt-8 grid gap-3">
        {options.map((option, i) => (
          <button
            key={i}
            disabled={selected !== null}
            onClick={() => onSelect(i)}
            dir="auto"
            className={`opt rounded-2xl px-5 py-4 text-start text-lg ${stateClass(i)}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
