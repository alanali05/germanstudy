import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Trash2 } from "lucide-react";
import EmptyState from "../../../components/EmptyState";
import { deleteBundle, saveBundle, useContent } from "../../../data/stories";
import { emptyBundle, loadBundle, slugId, validateBundle } from "../../../data/storyBundle";
import { SAVE_FAIL, useBi } from "../bi";
import DetailsSection from "./DetailsSection";
import QuizSection from "./QuizSection";
import SaveBar from "./SaveBar";
import SectionTabs from "./SectionTabs";
import SentencesSection from "./SentencesSection";
import WordsSection from "./WordsSection";

const TAB_IDS = ["details", "sentences", "words", "quiz"];

// Which section each validation error belongs to, and its text ([de, ku]; n = row number)
const SECTION_OF = {
  titleDe: "details", cover: "details", segments: "sentences", segmentDe: "sentences", word: "words",
  questionText: "quiz", questionOptions: "quiz", questionCorrect: "quiz",
};
const ERROR_TEXT = {
  titleDe: () => ["Bitte gib einen deutschen Titel ein.", "تکایە ناڤونیشانەکێ ئەلمانی بنڤیسە."],
  cover: () => ["Bitte lade ein Titelbild hoch.", "تکایە وێنەیەکێ بەرگی بار بکە."],
  segments: () => ["Bitte schreibe mindestens einen Satz.", "تکایە کێم ئێک رستە بنڤیسە."],
  segmentDe: (n) => [`Satz ${n}: Der deutsche Text fehlt.`, `رستە ${n}: دەقێ ئەلمانی نینە.`], // KU: review
  word: (n) => [`Wort ${n}: Bitte Wort und Bedeutung ausfüllen.`, `وشە ${n}: تکایە وشەیا ئەلمانی و رامانا کوردی پر بکە.`],
  questionText: (n) => [`Frage ${n}: Bitte schreibe die Frage.`, `پرسیار ${n}: تکایە پرسیارەکێ بنڤیسە.`],
  questionOptions: (n) => [`Frage ${n}: Schreibe mindestens 2 Antworten.`, `پرسیار ${n}: کێم 2 بەرسڤان بنڤیسە.`],
  questionCorrect: (n) => [`Frage ${n}: Wähle die richtige Antwort.`, `پرسیار ${n}: بەرسڤا درست هەلبژێرە.`], // KU: review
};

// Route element: a fresh editor (and form state) for every story
export default function StoryEditorPage() {
  const { storyId } = useParams();
  return <StoryEditor key={storyId ?? "new"} storyId={storyId} />;
}

function StoryEditor({ storyId }) {
  const bi = useBi();
  const { content, ready } = useContent();
  if (!ready) return <p className="text-muted">{bi("Wird geladen…", "تێتە بارکرن…")}</p>; // KU: review
  if (!storyId) return <EditorForm initial={emptyBundle()} />;
  const loaded = loadBundle(content, storyId);
  if (!loaded) {
    return <EmptyState title={bi("Geschichte nicht gefunden", "چیرۆک نەهاتە دیتن")} linkTo="/dashboard" linkLabel={bi("Alle Geschichten", "هەمی چیرۆک")} />;
  }
  return <EditorForm initial={loaded.bundle} others={loaded.otherWordTopics + loaded.otherQuizzes} />;
}

// The form keeps its own copy of the bundle; live updates from Firestore don't overwrite what is being edited.
// "saved" is the last saved state, used for the unsaved-changes check.
function EditorForm({ initial, others = 0 }) {
  const bi = useBi();
  const navigate = useNavigate();
  const { setDirty } = useOutletContext();
  const { content } = useContent();
  const [bundle, setBundle] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState([]);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  // Open tab; kept in the URL hash (#quiz) so a reload stays on it
  const [tab, setTab] = useState(() => {
    const h = window.location.hash.slice(1);
    return TAB_IDS.includes(h) ? h : "details";
  });
  const contentRef = useRef(null);
  const dirty = JSON.stringify(bundle) !== JSON.stringify(saved);
  const update = (patch) => { setBundle((b) => ({ ...b, ...patch })); setMsg(null); };

  useEffect(() => { setDirty(dirty); }, [dirty, setDirty]);
  useEffect(() => () => setDirty(false), [setDirty]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const pool = content.wordTopics[bundle.level].filter((t) => t.storyId !== bundle.id).flatMap((t) => t.words.map((x) => x.wordKu));
  // Shows one section; if the page was scrolled past the top of the content, it scrolls back to it
  const selectTab = (id) => {
    setTab(id);
    window.history.replaceState(window.history.state, "", `#${id}`);
    requestAnimationFrame(() => {
      const el = contentRef.current;
      if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: "start" });
    });
  };

  const confirmLeave = (e) => {
    if (dirty && !window.confirm(bi("Änderungen verwerfen?", "گوهۆڕینان ژێ ببەی؟"))) e.preventDefault(); // KU: review
  };

  const save = async () => {
    const errs = validateBundle(bundle);
    setErrors(errs);
    if (errs.length) {
      setMsg(null);
      setTab(SECTION_OF[errs[0].code]);
      requestAnimationFrame(() => document.getElementById("editor-errors")?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    const isNew = !bundle.id;
    const toSave = isNew ? { ...bundle, id: slugId(bundle.titleDe) } : bundle;
    setBusy(true);
    try {
      await saveBundle(toSave);
    } catch (err) {
      console.error(err);
      setBusy(false);
      return setMsg(SAVE_FAIL);
    }
    setBusy(false);
    setSaved(toSave);
    setBundle(toSave);
    if (isNew) return navigate(`/dashboard/stories/${toSave.id}`, { replace: true });
    setMsg({ ok: true, de: "Gespeichert ✓ Die Schüler sehen die Änderungen jetzt.", ku: "هاتە پاراستن ✓ قوتابی ئێستا گوهۆڕینان دبینن." }); // KU: review
  };

  const remove = async () => {
    if (!window.confirm(bi(`„${saved.titleDe}“ mit Wörtern und Quiz für alle Schüler löschen?`, `«${saved.titleDe}» دگەل وشە و کویزێ بۆ هەمی قوتابیان بهێتە سڕین؟`))) return; // KU: review
    try {
      await deleteBundle(saved.id);
    } catch (err) {
      console.error(err);
      return setMsg(SAVE_FAIL);
    }
    navigate("/dashboard");
  };

  const discard = () => { setBundle(saved); setErrors([]); setMsg(null); };

  return (
    <div>
      <Link to="/dashboard" onClick={confirmLeave} className="mb-3 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted hover:text-fg">
        <ArrowLeft size={16} className="rtl:rotate-180" /> {bi("Alle Geschichten", "هەمی چیرۆک")}
      </Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-extrabold" dir="auto">{bundle.titleDe || bi("Neue Geschichte", "چیرۆکا نوو")}</h2>
          {bundle.titleKu && <p lang="ku" dir="rtl" className="text-muted">{bundle.titleKu}</p>}
        </div>
        {saved.id && (
          <a href={`/stories/${saved.level}/${saved.id}`} target="_blank" rel="noreferrer" className="btn-ghost inline-flex items-center gap-2 px-4 py-2.5 font-semibold">
            <Eye size={17} /> {bi("Wie Schüler es sehen", "وەکی قوتابی دبینن")}{/* KU: review */}
          </a>
        )}
      </div>

      {errors.length > 0 && (
        <div id="editor-errors" role="alert" className="mb-6 rounded-2xl border p-4 text-sm" style={{ borderColor: "var(--bad)", background: "var(--badbg)" }}>
          <p className="mb-2 font-bold">{bi("Bitte korrigieren:", "تکایە ڤان چاک بکە:")}</p>{/* KU: review */}
          <ul className="list-inside list-disc space-y-1">
            {errors.map((e, i) => (
              <li key={i}>
                <button type="button" onClick={() => selectTab(SECTION_OF[e.code])} className="text-start underline">{bi(...ERROR_TEXT[e.code](e.n))}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {others > 0 && (
        <p className="mb-6 rounded-xl bg-soft p-3 text-sm text-muted">
          {bi(`Diese Geschichte hat ${others} weitere verknüpfte Wortlisten oder Quizze. Sie bleiben unverändert.`, `${others} لیستێن وشان یان کویزێن دی ب ڤێ چیرۆکێ ڤە گرێداینە. ئەو وەکی خۆ دمینن.`)}{/* KU: review */}
        </p>
      )}

      <div className="flex flex-wrap items-start gap-6">
        <SectionTabs
          active={tab} onSelect={selectTab}
          tabs={[
            { id: "details", label: bi("Details", "وردەکاری"), count: "" },
            { id: "sentences", label: bi("Sätze", "رستە"), count: bundle.segments.length },
            { id: "words", label: bi("Wörter", "وشە"), count: bundle.words.length },
            { id: "quiz", label: bi("Quiz", "کویز"), count: bundle.questions.length },
          ].map((t) => ({ ...t, error: errors.some((e) => SECTION_OF[e.code] === t.id) }))}
        />
        {/* All panels stay mounted (only hidden), so open rows and pasted text survive a tab switch */}
        <div ref={contentRef} className="min-w-0 flex-[999_1_32rem] scroll-mt-6">
          <div role="tabpanel" id="panel-details" aria-labelledby="tab-details" hidden={tab !== "details"}>
            <DetailsSection bundle={bundle} update={update} />
            {saved.id && (
              <section className="mb-6 rounded-2xl border p-4 sm:p-6" style={{ borderColor: "var(--bad)" }}>
                <p className="mb-3 text-sm text-muted">{bi("Löscht die Geschichte mit ihren Wörtern und ihrem Quiz für alle Schüler.", "چیرۆکێ دگەل وشە و کویزا وێ بۆ هەمی قوتابیان دسڕیت.")}</p>{/* KU: review */}
                <button type="button" onClick={remove} className="btn-danger inline-flex items-center gap-2">
                  <Trash2 size={16} /> {bi("Geschichte löschen", "چیرۆکێ بسڕە")}{/* KU: review */}
                </button>
              </section>
            )}
          </div>
          <div role="tabpanel" id="panel-sentences" aria-labelledby="tab-sentences" hidden={tab !== "sentences"}>
            <SentencesSection segments={bundle.segments} onChange={(segments) => update({ segments })} />
          </div>
          <div role="tabpanel" id="panel-words" aria-labelledby="tab-words" hidden={tab !== "words"}>
            <WordsSection words={bundle.words} onChange={(words) => update({ words })} />
          </div>
          <div role="tabpanel" id="panel-quiz" aria-labelledby="tab-quiz" hidden={tab !== "quiz"}>
            <QuizSection questions={bundle.questions} words={bundle.words} pool={pool} onChange={(questions) => update({ questions })} />
          </div>
        </div>
      </div>

      <SaveBar dirty={dirty} busy={busy} msg={msg} onSave={save} onDiscard={discard} />
    </div>
  );
}
