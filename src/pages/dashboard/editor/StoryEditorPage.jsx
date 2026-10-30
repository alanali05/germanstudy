import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, Trash2 } from "lucide-react";
import { useConfirm } from "../../../context/ConfirmContext";
import EmptyState from "../../../components/EmptyState";
import { deleteBundle, saveBundle, useContent } from "../../../data/stories";
import { emptyBundle, loadBundle, slugId, validateBundle } from "../../../data/storyBundle";
import { LANG_NAME } from "../../../data/languages";
import { LEAVE, SAVE_FAIL, byLang, useTr } from "../bi";
import DetailsSection from "./DetailsSection";
import QuizSection from "./QuizSection";
import SaveBar from "./SaveBar";
import SectionTabs from "./SectionTabs";
import SentencesSection from "./SentencesSection";
import WordsSection from "./WordsSection";

const TAB_IDS = ["details", "sentences", "words", "quiz"];
const MAX_UNDO = 100;

// Which section each validation error belongs to, and its text ([de, ku, en]; n = row number, lang = story language)
const SECTION_OF = {
  title: "details", cover: "details", segments: "sentences", segmentText: "sentences", word: "words",
  questionText: "quiz", questionOptions: "quiz", questionCorrect: "quiz",
};
const ERROR_TEXT = {
  title: (n, lang) => byLang(lang,
    ["Bitte gib einen deutschen Titel ein.", "تکایە ناڤونیشانەکێ ئەلمانی بنڤیسە.", "Please enter a German title."],
    ["Bitte gib einen englischen Titel ein.", "تکایە ناڤونیشانەکێ ئینگلیزی بنڤیسە.", "Please enter an English title."]), // KU: review
  cover: () => ["Bitte lade ein Titelbild hoch.", "تکایە وێنەیەکێ بەرگی بار بکە.", "Please upload a cover picture."],
  segments: () => ["Bitte schreibe mindestens einen Satz.", "تکایە کێم ئێک رستە بنڤیسە.", "Please write at least one sentence."],
  segmentText: (n, lang) => byLang(lang,
    [`Satz ${n}: Der deutsche Text fehlt.`, `رستە ${n}: دەقێ ئەلمانی نینە.`, `Sentence ${n}: the German text is missing.`],
    [`Satz ${n}: Der englische Text fehlt.`, `رستە ${n}: دەقێ ئینگلیزی نینە.`, `Sentence ${n}: the English text is missing.`]), // KU: review
  word: (n, lang) => byLang(lang,
    [`Wort ${n}: Bitte Wort und Bedeutung ausfüllen.`, `وشە ${n}: تکایە وشەیا ئەلمانی و رامانا کوردی پر بکە.`, `Word ${n}: please fill in the word and its meaning.`],
    [`Wort ${n}: Bitte Wort und Bedeutung ausfüllen.`, `وشە ${n}: تکایە وشەیا ئینگلیزی و رامانا کوردی پر بکە.`, `Word ${n}: please fill in the word and its meaning.`]), // KU: review
  questionText: (n) => [`Frage ${n}: Bitte schreibe die Frage.`, `پرسیار ${n}: تکایە پرسیارەکێ بنڤیسە.`, `Question ${n}: please write the question.`],
  questionOptions: (n) => [`Frage ${n}: Schreibe mindestens 2 Antworten.`, `پرسیار ${n}: کێم 2 بەرسڤان بنڤیسە.`, `Question ${n}: write at least 2 answers.`],
  questionCorrect: (n) => [`Frage ${n}: Wähle die richtige Antwort.`, `پرسیار ${n}: بەرسڤا درست هەلبژێرە.`, `Question ${n}: choose the correct answer.`], // KU: review
};

// Route element: a fresh editor (and form state) for every story
export default function StoryEditorPage() {
  const { storyId } = useParams();
  return <StoryEditor key={storyId ?? "new"} storyId={storyId} />;
}

function StoryEditor({ storyId }) {
  const tr = useTr();
  const { content, ready } = useContent();
  const [params] = useSearchParams(); // a new story is made in the library chosen in the list (?lang=en)
  if (!ready) return <p className="text-muted">{tr("Wird geladen…", "تێتە بارکرن…", "Loading…")}</p>; // KU: review
  if (!storyId) return <EditorForm initial={emptyBundle(params.get("lang") === "en" ? "en" : "de")} />;
  const loaded = loadBundle(content, storyId);
  if (!loaded) {
    return <EmptyState title={tr("Geschichte nicht gefunden", "چیرۆک نەهاتە دیتن", "Story not found")} linkTo="/dashboard" linkLabel={tr("Alle Geschichten", "هەمی چیرۆک", "All stories")} />;
  }
  return <EditorForm initial={loaded.bundle} others={loaded.otherWordTopics + loaded.otherQuizzes} />;
}

// The form keeps its own copy of the bundle; live updates from Firestore don't overwrite what is being edited.
// "saved" is the last saved state, used for the unsaved-changes check.
function EditorForm({ initial, others = 0 }) {
  const tr = useTr();
  const navigate = useNavigate();
  const { setDirty } = useOutletContext();
  const { content } = useContent();
  const confirm = useConfirm();
  // bundle = the form; history = earlier states for "Rückgängig" (newest last)
  const [{ bundle, history }, setEdit] = useState({ bundle: initial, history: [] });
  const lastEdit = useRef({ keys: "", time: 0 });
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState([]);
  const [msg, setMsg] = useState(null);
  const clearMsg = useCallback(() => setMsg(null), []);
  const [busy, setBusy] = useState(false);
  // Open tab; kept in the URL hash (#quiz) so a reload stays on it
  const [tab, setTab] = useState(() => {
    const h = window.location.hash.slice(1);
    return TAB_IDS.includes(h) ? h : "details";
  });
  const contentRef = useRef(null);
  const dirty = JSON.stringify(bundle) !== JSON.stringify(saved);
  // Every change goes through here and can be undone. Typing in a row counts as one step: edits to the same
  // part within a second are merged, unless rows were added or removed.
  const update = (patch) => {
    const keys = Object.keys(patch).join();
    const now = Date.now();
    const typing = lastEdit.current.keys === keys && now - lastEdit.current.time < 1000;
    lastEdit.current = { keys, time: now };
    setEdit(({ bundle: b, history: h }) => {
      const sameRows = Object.keys(patch).every((k) => !Array.isArray(patch[k]) || patch[k].length === b[k]?.length);
      return { bundle: { ...b, ...patch }, history: typing && sameRows && h.length ? h : [...h.slice(1 - MAX_UNDO), b] };
    });
    setMsg(null);
  };
  const undo = () => {
    lastEdit.current = { keys: "", time: 0 };
    setEdit(({ bundle: b, history: h }) => (h.length ? { bundle: h[h.length - 1], history: h.slice(0, -1) } : { bundle: b, history: h }));
    setMsg(null);
  };

  useEffect(() => { setDirty(dirty); }, [dirty, setDirty]);
  useEffect(() => () => setDirty(false), [setDirty]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const pool = content[bundle.lang].wordTopics[bundle.level].filter((t) => t.storyId !== bundle.id).flatMap((t) => t.words.map((x) => x.wordKu));
  // Shows one section; if the page was scrolled past the top of the content, it scrolls back to it
  const selectTab = (id) => {
    setTab(id);
    window.history.replaceState(window.history.state, "", `#${id}`);
    requestAnimationFrame(() => {
      const el = contentRef.current;
      if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: "start" });
    });
  };

  const confirmLeave = async (e) => {
    if (!dirty) return;
    e.preventDefault();
    if (await confirm(LEAVE(tr))) navigate("/dashboard");
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
    const toSave = isNew ? { ...bundle, id: slugId(bundle.title) } : bundle;
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
    setEdit({ bundle: toSave, history: [] });
    if (isNew) return navigate(`/dashboard/stories/${toSave.id}`, { replace: true });
    setMsg({ ok: true, de: "Gespeichert ✓ Die Schüler sehen die Änderungen jetzt.", ku: "هاتە پاراستن ✓ قوتابی ئێستا گوهۆڕینان دبینن.", en: "Saved ✓ Students see the changes now." }); // KU: review
  };

  const remove = async () => {
    const ok = await confirm({
      title: tr(`„${saved.title}“ löschen?`, `«${saved.title}» بسڕی؟`, `Delete “${saved.title}”?`), // KU: review
      text: tr("Die Geschichte wird mit ihren Wörtern und ihrem Quiz für alle Schüler gelöscht.", "چیرۆک دگەل وشە و کویزا وێ بۆ هەمی قوتابیان دهێتە سڕین.", "The story is deleted with its words and its quiz, for all students."), // KU: review
      ok: tr("Geschichte löschen", "چیرۆکێ بسڕە", "Delete story"),
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteBundle(saved.id);
    } catch (err) {
      console.error(err);
      return setMsg(SAVE_FAIL);
    }
    navigate("/dashboard");
  };

  // Back to the last saved state; this too can be undone
  const discard = () => {
    lastEdit.current = { keys: "", time: 0 };
    setEdit(({ bundle: b, history: h }) => ({ bundle: saved, history: [...h.slice(1 - MAX_UNDO), b] }));
    setErrors([]);
    setMsg(null);
  };

  return (
    <div className="pb-24 lg:pb-0">{/* room to scroll the last rows out from under the floating buttons on phones */}
      <Link to="/dashboard" onClick={confirmLeave} className="mb-3 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted hover:text-fg">
        <ArrowLeft size={16} className="rtl:rotate-180" /> {tr("Alle Geschichten", "هەمی چیرۆک", "All stories")}
      </Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-extrabold" dir="auto">{bundle.title || tr("Neue Geschichte", "چیرۆکا نوو", "New story")}</h2>
          {bundle.titleKu && <p lang="ku" dir="rtl" className="text-muted">{bundle.titleKu}</p>}
          {/* Which library the story belongs to (fixed: a story is German or English) */}
          <span className="mt-2 inline-block rounded-md bg-soft px-2 py-0.5 text-xs font-bold">{LANG_NAME[bundle.lang]}</span>
        </div>
        {saved.id && (
          <a href={`/stories/${saved.level}/${saved.id}?lang=${saved.lang}`} target="_blank" rel="noreferrer" className="btn-ghost inline-flex items-center gap-2 px-4 py-2.5 font-semibold">
            <Eye size={17} /> {tr("Wie Schüler es sehen", "وەکی قوتابی دبینن", "See it as a student")}{/* KU: review */}
          </a>
        )}
      </div>

      {errors.length > 0 && (
        <div id="editor-errors" role="alert" className="mb-6 rounded-2xl border p-4 text-sm" style={{ borderColor: "var(--bad)", background: "var(--badbg)" }}>
          <p className="mb-2 font-bold">{tr("Bitte korrigieren:", "تکایە ڤان چاک بکە:", "Please fix:")}</p>{/* KU: review */}
          <ul className="list-inside list-disc space-y-1">
            {errors.map((e, i) => (
              <li key={i}>
                <button type="button" onClick={() => selectTab(SECTION_OF[e.code])} className="text-start underline">{tr(...ERROR_TEXT[e.code](e.n, bundle.lang))}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {others > 0 && (
        <p className="mb-6 rounded-xl bg-soft p-3 text-sm text-muted">
          {tr(`Diese Geschichte hat ${others} weitere verknüpfte Wortlisten oder Quizze. Sie bleiben unverändert.`, `${others} لیستێن وشان یان کویزێن دی ب ڤێ چیرۆکێ ڤە گرێداینە. ئەو وەکی خۆ دمینن.`, `This story has ${others} more linked word lists or quizzes. They stay as they are.`)}{/* KU: review */}
        </p>
      )}

      <div className="flex flex-wrap items-start gap-6">
        <SectionTabs
          active={tab} onSelect={selectTab}
          tabs={[
            { id: "details", label: tr("Details", "وردەکاری", "Details"), count: "" },
            { id: "sentences", label: tr("Sätze", "رستە", "Sentences"), count: bundle.segments.length },
            { id: "words", label: tr("Wörter", "وشە", "Words"), count: bundle.words.length },
            { id: "quiz", label: tr("Quiz", "کویز", "Quiz"), count: bundle.questions.length },
          ].map((t) => ({ ...t, error: errors.some((e) => SECTION_OF[e.code] === t.id) }))}
        />
        {/* All panels stay mounted (only hidden), so open rows and pasted text survive a tab switch */}
        <div ref={contentRef} className="min-w-0 flex-[999_1_32rem] scroll-mt-6">
          <div role="tabpanel" id="panel-details" aria-labelledby="tab-details" hidden={tab !== "details"}>
            <DetailsSection bundle={bundle} update={update} />
            {saved.id && (
              <section className="mb-6 rounded-2xl border p-4 sm:p-6" style={{ borderColor: "var(--bad)" }}>
                <p className="mb-3 text-sm text-muted">{tr("Löscht die Geschichte mit ihren Wörtern und ihrem Quiz für alle Schüler.", "چیرۆکێ دگەل وشە و کویزا وێ بۆ هەمی قوتابیان دسڕیت.", "Deletes the story with its words and its quiz, for all students.")}</p>{/* KU: review */}
                <button type="button" onClick={remove} className="btn-danger inline-flex items-center gap-2">
                  <Trash2 size={16} /> {tr("Geschichte löschen", "چیرۆکێ بسڕە", "Delete story")}{/* KU: review */}
                </button>
              </section>
            )}
          </div>
          <div role="tabpanel" id="panel-sentences" aria-labelledby="tab-sentences" hidden={tab !== "sentences"}>
            <SentencesSection lang={bundle.lang} segments={bundle.segments} onChange={(segments) => update({ segments })} />
          </div>
          <div role="tabpanel" id="panel-words" aria-labelledby="tab-words" hidden={tab !== "words"}>
            <WordsSection lang={bundle.lang} words={bundle.words} segments={bundle.segments} onChange={(words) => update({ words })} />
          </div>
          <div role="tabpanel" id="panel-quiz" aria-labelledby="tab-quiz" hidden={tab !== "quiz"}>
            <QuizSection lang={bundle.lang} questions={bundle.questions} words={bundle.words} pool={pool} onChange={(questions) => update({ questions })} />
          </div>
        </div>
      </div>

      <SaveBar dirty={dirty} busy={busy} msg={msg} canUndo={history.length > 0} onSave={save} onUndo={undo} onDiscard={discard} onClearMsg={clearMsg} />
    </div>
  );
}
