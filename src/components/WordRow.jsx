import Icon from "./Icon";
import { speak } from "../utils/speak";

// German on the left, Kurdish on the right
export default function WordRow({ entry }) {
  return (
    <div dir="ltr" className="grid grid-cols-2 gap-4 border-b border-line px-4 py-4 last:border-b-0 sm:px-6">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => speak(entry.wordDe)}
            aria-label={`Listen: ${entry.wordDe}`}
            className="btn-ghost shrink-0 p-2.5 text-muted hover:text-fg"
          >
            <Icon name="volume" size={18} />
          </button>
          <span lang="de" className="font-display text-xl font-semibold sm:text-2xl">{entry.wordDe}</span>
        </div>
        <p lang="de" className="mt-2 text-sm text-muted">{entry.sentenceDe}</p>
      </div>

      <div dir="rtl" lang="ku" className="min-w-0 text-right">
        <p className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--brand)" }}>{entry.wordKu}</p>
        <p className="mt-2 text-sm text-muted">{entry.sentenceKu}</p>
      </div>
    </div>
  );
}
