import { useRef, useState } from "react";
import { Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import PageHeader from "../components/PageHeader";
import LevelBadge from "../components/LevelBadge";
import { levels, getLevel } from "../data/levels";
import {
  getContent, normalizeContent, builtIn, saveItem, removeItem, findStory, replaceAllContent, addMissingBuiltIn, readLocalContent, clearLocalContent,
} from "../data/stories";
import { useStudents, createStudent, updateStudent, deleteStudent, readLocalStudents, clearLocalStudents } from "../data/students";
import { getAnnouncement, setAnnouncement } from "../data/settings";
import { toJpeg, uploadImage } from "../services/upload";
import { useLang } from "../context/LangContext";
import { IMAGES_URL } from "../config";

// Besitzer-Dashboard / داشبۆردا خودانی. Only German + Kurdish (Badini, Arabic script). No English.

/* bi(de, ku) = the text in the app language (the DE/KU switch). Every component gets it from useBi().
   Texts defined outside components are [de, ku] pairs: bi(...PAIR). */
const useBi = () => {
  const { lang } = useLang();
  return (de, ku) => (lang === "de" ? de : ku);
};
/* Bi = the same for long texts / JSX */
const Bi = ({ de, ku }) => useBi()(de, ku);
const OPT = ["(optional)", "(ڤەبژارتی)"];
/* Messages for <Msg>: { ok, text } or { ok, de, ku } */
const SAVE_FAIL = { ok: false, de: "Speichern fehlgeschlagen. Prüfe die Internetverbindung.", ku: "پاراستن سەرنەکەفت. پەیوەندیا ئینتەرنێتێ بپشکنە." };
const WAIT = { ok: true, de: "Bitte warten…", ku: "تکایە چاڤەڕێ بکە…" };
const UPLOAD_FAIL = { ok: false, de: "Hochladen fehlgeschlagen. Bitte erneut versuchen.", ku: "بارکرنا وێنەی سەرنەکەفت. دیسا هەول بدە." };
const NOT_IMAGE = { ok: false, de: "Bitte wähle eine Bilddatei.", ku: "تکایە فایلەکێ وێنە هەلبژێرە." };
const NEED_COVER = { ok: false, de: "Bitte lade ein Titelbild hoch.", ku: "تکایە وێنەیەکێ بەرگی بار بکە." };

const clone = (x) => JSON.parse(JSON.stringify(x));
const uid = (s) => `${s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item"}-${Math.random().toString(36).slice(2, 6)}`;
const top = () => window.scrollTo({ top: 0, behavior: "smooth" });
const flat = (col) => Object.entries(getContent()[col]).flatMap(([level, list]) => list.map((x) => ({ ...x, level })));
const lvTitle = (id) => getLevel(id).title;

/* ---------- small UI pieces ---------- */
function Field({ label, hint, children }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      {hint && <span className="ms-2 font-normal text-faint">{hint}</span>}
      {children}
    </label>
  );
}
function Box({ title, children, active }) {
  return (
    <section className="glass mb-6 rounded-2xl p-4 sm:p-6" style={active ? { borderColor: "var(--brand)" } : undefined}> 
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}
function Row({ title, sub, badge, onEdit, onDelete, onClick, selected }) {
  const bi = useBi();
  return (
    <div className={`flex items-center gap-2 border-b border-line py-3 last:border-b-0 sm:gap-3 ${selected ? "rounded-lg bg-soft px-2" : ""}`}>
      {badge}
      <div className={`min-w-0 flex-1 ${onClick ? "cursor-pointer" : ""}`} onClick={onClick}>
        <p className="truncate font-semibold" dir="auto">{title}</p>
        {sub && <p className="truncate text-sm text-muted" dir="auto">{sub}</p>}
      </div>
      {onEdit && (
        <button onClick={onEdit} className="btn-mini inline-flex items-center gap-1 text-sm" aria-label={`${bi("Bearbeiten", "دەستکاریکرن")} ${title}`}>
          <Pencil size={15} /><span className="hidden md:inline">{bi("Bearbeiten", "دەستکاریکرن")}</span>
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className="btn-danger inline-flex items-center gap-1 text-sm" aria-label={`${bi("Löschen", "سڕین")} ${title}`}>
          <Trash2 size={15} /><span className="hidden md:inline">{bi("Löschen", "سڕین")}</span>
        </button>
      )}
    </div>
  );
}
function Msg({ m }) {
  const bi = useBi();
  if (!m) return null;
  return <p role="status" className="mt-3 text-sm font-medium" style={{ color: m.ok ? "var(--ok)" : "var(--bad)" }}>{m.text ?? bi(m.de, m.ku)}</p>;
}
function SubmitRow({ editing, label, onCancel, busy }) {
  const bi = useBi();
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <button disabled={busy} className="btn-primary inline-flex items-center gap-2 px-6 py-3">
        {editing ? <Pencil size={17} /> : <Plus size={18} />}
        {editing ? bi("Änderungen speichern", "گوهۆڕینان بپارێزە") : label}
      </button>
      {editing && <button type="button" onClick={onCancel} className="btn-ghost px-5 py-3">{bi("Abbrechen", "هەلوەشاندن")}</button>}
    </div>
  );
}
function SearchBox({ value, onChange }) {
  const bi = useBi();
  return (
    <div className="relative mb-3">
      <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-faint" />
      <input className="field !mt-0 !ps-9" placeholder={bi("Suchen…", "گەڕیان…")} value={value} onChange={(e) => onChange(e.target.value)} aria-label={bi("Suchen", "گەڕیان")} />
    </div>
  );
}
const Grid = ({ children }) => <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
function LevelSelect({ value, onChange }) {
  const bi = useBi();
  return (
    <Field label={bi("Niveau", "ئاست")}>
      <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        {levels.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
      </select>
    </Field>
  );
}

/* Topic details (level + titles + optional story link), used for new and existing topics */
function TopicFields({ v, set, kind }) {
  const bi = useBi();
  const stories = flat("stories");
  return (
    <div className="space-y-4">
      <Grid>
        <LevelSelect value={v.level} onChange={(x) => set({ ...v, level: x })} />
        <Field label={bi(`${kind.de}-Titel (Deutsch)`, `ناڤونیشانێ ${kind.ku} (ئەلمانی)`)}>
          <input className="field" lang="de" dir="ltr" value={v.titleDe} onChange={(e) => set({ ...v, titleDe: e.target.value })} placeholder="z. B. Essen und Trinken" />
        </Field>
        <Field label={bi(`${kind.de}-Titel (Kurdisch)`, `ناڤونیشانێ ${kind.ku} (کوردی)`)}>
          <input className="field" lang="ku" dir="rtl" value={v.titleKu} onChange={(e) => set({ ...v, titleKu: e.target.value })} />
        </Field>
        <Field label={bi("Mit einer Geschichte verknüpfen", "ب چیرۆکەکێ ڤە گرێدە")} hint={bi(...OPT)}>
          <select className="field" value={v.storyId} onChange={(e) => set({ ...v, storyId: e.target.value })}>
            <option value="">{bi("– keine –", "– چوو –")}</option>
            {stories.map((s) => <option key={s.id} value={s.id}>{lvTitle(s.level)} · {s.titleDe}</option>)}
          </select>
        </Field>
      </Grid>
    </div>
  );
}
const emptyTopic = { level: "a1", titleDe: "", titleKu: "", storyId: "" };

/* ---------------- Overview / Übersicht / گشتی ---------------- */
/* One-time helpers: empty database, and data that was saved in this browser before Firebase */
function SetupBox() {
  const bi = useBi();
  const c = getContent();
  const [localContent, setLocalContent] = useState(readLocalContent);
  const [localStudents, setLocalStudents] = useState(readLocalStudents);
  const [msg, setMsg] = useState(null);
  const isEmpty = ["stories", "wordTopics", "quizzes"].every((col) => Object.values(c[col]).flat().length === 0);
  if (!isEmpty && !localContent && localStudents.length === 0 && !msg) return null;

  const run = async (fn, okText) => {
    setMsg(WAIT);
    try { await fn(); setMsg({ ok: true, text: okText }); } catch (err) { console.error(err); setMsg(SAVE_FAIL); }
  };
  const loadBuiltIn = () => run(() => replaceAllContent(builtIn()), bi("Eingebauter Inhalt geladen ✓", "ناڤەڕۆکا ئامادەکراو هاتە بارکرن ✓"));
  const uploadContent = () => {
    if (!window.confirm(bi("Den Inhalt der Datenbank durch den Inhalt aus diesem Browser ersetzen?", "ناڤەڕۆکا داتابەیسێ ب ناڤەڕۆکا ڤی براوسەری بگوهۆڕی؟"))) return;
    run(async () => { await replaceAllContent(localContent); clearLocalContent(); setLocalContent(null); },
      bi("Inhalt hochgeladen ✓", "ناڤەڕۆک هاتە بارکرن ✓"));
  };
  const uploadStudents = () =>
    run(async () => {
      for (const s of localStudents) {
        try {
          await createStudent({ name: s.name, className: s.className || "", level: s.level || "A1" }, s.code);
        } catch (err) {
          if (err.code !== "auth/email-already-in-use") throw err; // already moved
        }
      }
      clearLocalStudents(); setLocalStudents([]);
    }, bi("Schüler übertragen ✓ Ihre alten Codes funktionieren weiter.", "قوتابی هاتنە ڤەگوهاستن ✓ کۆدێن وان یێن کەڤن کار دکەن."));

  return (
    <Box title={bi("Einrichtung", "ئامادەکرن")} active>
      <div className="space-y-4">
        {isEmpty && (
          <div>
            <p className="mb-2 text-sm text-muted"><Bi de="Die Datenbank ist noch leer." ku="داتابەیس هێشتا ڤالایە." /></p>
            <button onClick={loadBuiltIn} className="btn-primary px-5 py-3">{bi("Eingebauten Inhalt laden", "ناڤەڕۆکا ئامادەکراو بار بکە")}</button>
          </div>
        )}
        {localContent && (
          <div>
            <p className="mb-2 text-sm text-muted">
              <Bi de="In diesem Browser wurde Inhalt aus der Zeit vor der Datenbank gefunden." ku="د ڤی براوسەری دا ناڤەڕۆکەک ژ بەری داتابەیسێ هاتە دیتن." />
            </p>
            <button onClick={uploadContent} className="btn-primary px-5 py-3">{bi("Inhalt in die Datenbank hochladen", "ناڤەڕۆکێ بۆ داتابەیسێ بار بکە")}</button>
          </div>
        )}
        {localStudents.length > 0 && (
          <div>
            <p className="mb-2 text-sm text-muted">
              <Bi de={`${localStudents.length} Schüler aus diesem Browser gefunden.`} ku={`${localStudents.length} قوتابی د ڤی براوسەری دا هاتنە دیتن.`} />
            </p>
            <button onClick={uploadStudents} className="btn-primary px-5 py-3">{bi("Schüler übertragen", "قوتابیان ڤەگوهێزە")}</button>
          </div>
        )}
        <Msg m={msg} />
      </div>
    </Box>
  );
}

function OverviewTab({ go }) {
  const bi = useBi();
  const c = getContent();
  const [note, setNote] = useState(getAnnouncement());
  const [msg, setMsg] = useState(null);
  const max = Math.max(1, ...levels.map((l) => c.stories[l.id].length));
  const saveNote = async () => {
    try { await setAnnouncement(note); } catch { return setMsg(SAVE_FAIL); }
    setMsg({
      ok: true,
      text: note.trim()
        ? bi("Die Ankündigung wird jetzt auf der Startseite der Schüler angezeigt ✓", "ڕاگەهاندن ئێستا ل رووپەلێ سەرەکی یێ قوتابیان دیار دبیت ✓")
        : bi("Ankündigung entfernt ✓", "ڕاگەهاندن هاتە سڕین ✓"),
    });
  };

  const quick = [
    ["stories", bi("Neue Geschichte", "چیرۆکا نوو")],
    ["words", bi("Neue Wörter", "وشەیا نوو")],
    ["quiz", bi("Neues Quiz", "کویزا نوو")],
    ["students", bi("Neuer Schüler", "قوتابیێ نوو")],
  ];

  return (
    <>
      <SetupBox />
      <Box title={bi("Schnellaktionen", "کارێن بلەز")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quick.map(([id, label]) => (
            <button key={id} onClick={() => go(id)} className="btn-primary inline-flex items-center justify-center gap-2 px-3 py-3 text-sm"><Plus size={18} />{label}</button>
          ))}
        </div>
      </Box>

      <Box title={bi("Inhalt pro Niveau", "ناڤەڕۆک بۆ هەر ئاستەکی")}>
        <div className="space-y-4">
          {levels.map((l) => (
            <div key={l.id}>
              <div className="flex items-center gap-3">
                <LevelBadge level={l} />
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-soft"><div className="bar-fill h-full rounded-full" style={{ width: `${(c.stories[l.id].length / max) * 100}%`, background: l.color }} /></div>
              </div>
              <p className="mt-1 ps-12 text-sm text-muted">
                {bi(
                  `${c.stories[l.id].length} Geschichten · ${c.wordTopics[l.id].length} Wortthemen · ${c.quizzes[l.id].length} Quizze`,
                  `${c.stories[l.id].length} چیرۆک · ${c.wordTopics[l.id].length} بابەتێ وشە · ${c.quizzes[l.id].length} کویز`
                )}
              </p>
            </div>
          ))}
        </div>
      </Box>

      <Box title={bi("Ankündigung für die Schüler", "ڕاگەهاندن بۆ قوتابیان")}>
        <p className="mb-2 text-sm text-muted">
          <Bi
            de="Wird oben auf der Startseite der Schüler gezeigt. Leer lassen, um sie zu verstecken."
            ku="ل سەرویێ رووپەلێ سەرەکی یێ قوتابیان دیار دبیت. ڤالا بهێلە دا بهێتە ڤەشارتن."
          />
        </p>
        <textarea
          className="field" rows={2} dir="auto" value={note} onChange={(e) => setNote(e.target.value)}
          placeholder={bi("Beispiel: Freitag ist Quiz! Bitte lernt das Thema „Essen und Trinken“.", "نمونە: ئەینی کویزە! تکایە بابەتێ «Essen und Trinken» بخوێنن.")}
        />
        <button onClick={saveNote} className="btn-primary mt-4 px-6 py-3">{bi("Ankündigung speichern", "ڕاگەهاندنێ بپارێزە")}</button>
        <Msg m={msg} />
      </Box>
    </>
  );
}

/* ---------------- Stories / Geschichten / چیرۆک ---------------- */
const emptyStory = { level: "a1", titleDe: "", titleKu: "", readTime: "", coverImage: "", text: "" };
function StoriesTab() {
  const bi = useBi();
  const [f, setF] = useState(emptyStory);
  const [edit, setEdit] = useState(null);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // Shrinks the chosen picture and uploads it to R2. Covers can only be set this way, so they all live in the bucket
  // (old stories may still have an outside link until a new picture is uploaded).
  const pickCover = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same file again
    if (!file) return;
    if (!file.type.startsWith("image/")) return setMsg(NOT_IMAGE);
    setUploading(true); setMsg(WAIT);
    try {
      const url = await uploadImage("cover", await toJpeg(file, { size: 1600 }));
      setF((x) => ({ ...x, coverImage: url }));
      setMsg(null);
    } catch {
      setMsg(UPLOAD_FAIL);
    }
    setUploading(false);
  };

  const startEdit = (s) => {
    setEdit({ level: s.level, id: s.id }); setMsg(null);
    setF({ level: s.level, titleDe: s.titleDe, titleKu: s.titleKu || "", readTime: s.readTime || "", coverImage: s.coverImage || "",
      text: s.segments.map((x) => `${x.de} || ${x.ku}`).join("\n") });
    top();
  };
  const cancel = () => { setEdit(null); setF(emptyStory); setMsg(null); };

  const submit = async (e) => {
    e.preventDefault();
    const segments = f.text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const [de, ...rest] = l.split("||");
      return { de: de.trim(), ku: rest.join("||").trim() };
    });
    if (!f.titleDe.trim() || segments.length === 0)
      return setMsg({ ok: false, text: bi("Bitte gib einen deutschen Titel und mindestens einen Satz ein.", "تکایە ناڤونیشانەکێ ئەلمانی و کێم ئێک رستە بنڤیسە.") });
    if (!f.coverImage) return setMsg(NEED_COVER);
    const base = { titleDe: f.titleDe.trim(), titleKu: f.titleKu.trim(), level: f.level, readTime: f.readTime.trim(), coverImage: f.coverImage, segments };
    const story = edit ? { ...findStory(edit.level, edit.id), id: edit.id, ...base } : { id: uid(f.titleDe), ...base };
    try { await saveItem("stories", story); } catch { return setMsg(SAVE_FAIL); }
    setEdit(null); setF(emptyStory);
    setMsg({ ok: true, text: edit ? bi("Geschichte aktualisiert ✓", "چیرۆک هاتە نووکرن ✓") : bi("Geschichte hinzugefügt ✓", "چیرۆک هاتە زێدەکرن ✓") });
  };

  const del = (id, title) => {
    if (!window.confirm(bi(`Die Geschichte „${title}“ löschen?`, `چیرۆکا «${title}» بهێتە سڕین؟`))) return;
    removeItem("stories", id).catch(() => setMsg(SAVE_FAIL));
  };
  const list = flat("stories").filter((s) => `${s.titleDe} ${s.titleKu}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <Box title={edit ? bi("Geschichte bearbeiten", "دەستکاریکرنا چیرۆکێ") : bi("Geschichte hinzufügen", "زێدەکرنا چیرۆکێ")} active={!!edit}>
        <form onSubmit={submit} className="space-y-4">
          <Grid>
            <LevelSelect value={f.level} onChange={(x) => setF({ ...f, level: x })} />
            <Field label={bi("Lesezeit", "دەمێ خوێندنێ")} hint={bi(...OPT)}><input className="field" value={f.readTime} onChange={set("readTime")} placeholder="3 min" /></Field>
            <Field label={bi("Deutscher Titel", "ناڤونیشانێ ئەلمانی")}><input className="field" value={f.titleDe} onChange={set("titleDe")} lang="de" dir="ltr" /></Field>
            <Field label={bi("Kurdischer Titel", "ناڤونیشانێ کوردی")}><input className="field" value={f.titleKu} onChange={set("titleKu")} lang="ku" dir="rtl" /></Field>
          </Grid>
          <div>
            <p className="text-sm font-semibold">{bi("Titelbild", "وێنەیێ بەرگی")}</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              {f.coverImage && <img src={f.coverImage} alt="" className="h-24 w-40 rounded-lg border border-line object-cover" />}
              <button type="button" onClick={() => fileRef.current.click()} disabled={uploading}
                className="btn-ghost inline-flex items-center gap-2 px-4 py-3">
                <Upload size={17} />
                {f.coverImage ? bi("Anderes Bild hochladen", "وێنەیەکێ دی بار بکە") : bi("Bild hochladen", "وێنەی بار بکە")}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={pickCover} className="hidden" />
          </div>
          <Field label={bi("Geschichte", "چیرۆک")} hint={bi("ein Satz pro Zeile: Deutsch || Kurdisch", "ئێک رستە د هەر رێزەکێ دا: ئەلمانی || کوردی")}>
            <textarea className="field" rows={8} value={f.text} onChange={set("text")} dir="auto"
              placeholder={"Hallo, wie geht es dir? || سڵاو، تو چەوایی؟\nMir geht es gut. || ئەز باشم."} />
          </Field>
          <SubmitRow editing={!!edit} label={bi("Geschichte hinzufügen", "چیرۆکێ زێدە بکە")} onCancel={cancel} busy={uploading} />
          <Msg m={msg} />
        </form>
        <p className="mt-4 rounded-xl bg-soft p-3 text-sm text-muted">
          <Bi
            de={<>💡 Wörter, die man in der Geschichte antippen kann: Lege im Tab <b className="text-fg">Wörter</b> ein Wortthema an und verknüpfe es mit dieser Geschichte.</>}
            ku={<>💡 ئەو وشەیێن د چیرۆکێ دا دهێنە کلیککرن: د تابێ <b className="text-fg">وشە</b> دا بابەتەکێ وشە زێدە بکە و ب ڤێ چیرۆکێ ڤە گرێدە.</>}
          />
        </p>
      </Box>
      <Box title={bi(`Alle Geschichten (${flat("stories").length})`, `هەمی چیرۆک (${flat("stories").length})`)}>
        <SearchBox value={q} onChange={setQ} />
        {list.length === 0 && <p className="text-muted">{bi("Keine Geschichten gefunden.", "چ چیرۆکەک نەهاتە دیتن.")}</p>}
        {list.map((s) => (
          <Row key={s.id} badge={<LevelBadge level={getLevel(s.level)} />} title={s.titleDe} sub={bi(`${s.segments.length} Sätze`, `${s.segments.length} رستە`)}
            onEdit={() => startEdit(s)} onDelete={() => del(s.id, s.titleDe)} />
        ))}
      </Box>
    </>
  );
}

/* ---------------- Words + Quiz (same idea: topics that contain items) ---------------- */
function WordFields({ f, set }) {
  const bi = useBi();
  return (
    <Grid>
      <Field label={bi("Deutsches Wort oder Ausdruck", "وشە یان دەربڕینا ئەلمانی")}><input className="field" lang="de" dir="ltr" value={f.wordDe} onChange={set("wordDe")} /></Field>
      <Field label={bi("Kurdische Bedeutung", "رامانا کوردی")}><input className="field" lang="ku" dir="rtl" value={f.wordKu} onChange={set("wordKu")} /></Field>
      <Field label={bi("Deutscher Beispielsatz", "رستەیا نمونەیا ئەلمانی")}><input className="field" lang="de" dir="ltr" value={f.sentenceDe} onChange={set("sentenceDe")} /></Field>
      <Field label={bi("Kurdischer Beispielsatz", "رستەیا نمونەیا کوردی")}><input className="field" lang="ku" dir="rtl" value={f.sentenceKu} onChange={set("sentenceKu")} /></Field>
    </Grid>
  );
}
function QuestionFields({ f, set }) {
  const bi = useBi();
  return (
    <div className="space-y-4">
      <Grid>
        <Field label={bi("Frage (Deutsch)", "پرسیار (ئەلمانی)")}><input className="field" lang="de" dir="ltr" value={f.questionDe} onChange={set("questionDe")} /></Field>
        <Field label={bi("Frage (Kurdisch)", "پرسیار (کوردی)")}><input className="field" lang="ku" dir="rtl" value={f.questionKu} onChange={set("questionKu")} /></Field>
      </Grid>
      <Field label={bi("Antworten", "بەرسڤ")} hint={bi("eine pro Zeile", "ئێک د هەر رێزەکێ دا")}><textarea className="field" rows={4} dir="auto" value={f.options} onChange={set("options")} /></Field>
      <Field label={bi("Nummer der richtigen Antwort", "ژمارا بەرسڤا درست")} hint={bi("(1 = erste Zeile)", "(1 = رێزا ئێکێ)")}><input className="field" type="number" min="1" max="6" value={f.correct} onChange={set("correct")} /></Field>
    </div>
  );
}

/* Texts are [de, ku] pairs (TopicTab shows them with bi(...pair)).
   toItem returns the cleaned item, or a [de, ku] pair with the error. */
const CFG = {
  words: {
    col: "wordTopics", items: "words",
    kind: { de: "Thema", ku: "بابەت" },
    createOpt: ["➕ Neues Thema erstellen…", "➕ بابەتەکێ نوو دروست بکە…"],
    newTitle: ["Neues Thema", "بابەتێ نوو"],
    needTitle: ["Bitte gib dem neuen Thema einen deutschen Titel.", "تکایە ناڤونیشانەکێ ئەلمانی بۆ بابەتێ نوو بنڤیسە."],
    createAdd: ["Thema erstellen und hinzufügen", "بابەت دروست بکە و زێدە بکە"],
    createdMsg: ["Neues Thema erstellt und Eintrag hinzugefügt ✓", "بابەتێ نوو هاتە دروستکرن و ناڤەڕۆک هاتە زێدەکرن ✓"],
    editDetails: ["Themen-Details bearbeiten", "دەستکاریکرنا وردەکاریێن بابەتی"],
    allTitle: (n) => [`Alle Themen (${n})`, `هەمی بابەت (${n})`],
    itemNew: ["Wort hinzufügen", "وشەیێ زێدە بکە"],
    itemEdit: ["Wort bearbeiten", "دەستکاریکرنا وشەیێ"],
    count: (n) => [`${n} Wörter`, `${n} وشە`],
    inTitle: (t, n) => [`Wörter in „${t}“ (${n})`, `وشە د «${t}» دا (${n})`],
    empty: { wordDe: "", wordKu: "", sentenceDe: "", sentenceKu: "" },
    toItem(f) {
      if (!f.wordDe.trim() || !f.wordKu.trim())
        return ["Bitte fülle das deutsche Wort und die kurdische Bedeutung aus.", "تکایە وشەیا ئەلمانی و رامانا کوردی پر بکە."];
      return Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim()]));
    },
    toForm: (w) => ({ ...CFG.words.empty, ...w }),
    row: (w) => ({ title: `${w.wordDe}  —  ${w.wordKu}`, sub: w.sentenceDe }),
    Fields: WordFields,
  },
  quiz: {
    col: "quizzes", items: "questions",
    kind: { de: "Quiz", ku: "کویز" },
    createOpt: ["➕ Neues Quiz erstellen…", "➕ کویزەکێ نوو دروست بکە…"],
    newTitle: ["Neues Quiz", "کویزەکا نوو"],
    needTitle: ["Bitte gib dem neuen Quiz einen deutschen Titel.", "تکایە ناڤونیشانەکێ ئەلمانی بۆ کویزا نوو بنڤیسە."],
    createAdd: ["Quiz erstellen und hinzufügen", "کویز دروست بکە و زێدە بکە"],
    createdMsg: ["Neues Quiz erstellt und Frage hinzugefügt ✓", "کویزەکا نوو هاتە دروستکرن و پرسیار هاتە زێدەکرن ✓"],
    editDetails: ["Quiz-Details bearbeiten", "دەستکاریکرنا وردەکاریێن کویزێ"],
    allTitle: (n) => [`Alle Quizze (${n})`, `هەمی کویز (${n})`],
    itemNew: ["Frage hinzufügen", "پرسیارەکێ زێدە بکە"],
    itemEdit: ["Frage bearbeiten", "دەستکاریکرنا پرسیارێ"],
    count: (n) => [`${n} Fragen`, `${n} پرسیار`],
    inTitle: (t, n) => [`Fragen in „${t}“ (${n})`, `پرسیار د «${t}» دا (${n})`],
    empty: { questionDe: "", questionKu: "", options: "", correct: "1" },
    toItem(f) {
      const options = f.options.split("\n").map((o) => o.trim()).filter(Boolean);
      const correct = parseInt(f.correct, 10) - 1;
      if (!f.questionDe.trim()) return ["Bitte schreibe die Frage.", "تکایە پرسیارەکێ بنڤیسە."];
      if (options.length < 2) return ["Schreibe mindestens 2 Antworten, eine pro Zeile.", "کێم 2 بەرسڤان بنڤیسە، ئێک د هەر رێزەکێ دا."];
      if (!(correct >= 0 && correct < options.length))
        return [`Die Nummer der richtigen Antwort muss zwischen 1 und ${options.length} liegen.`, `ژمارا بەرسڤا درست دڤێت د ناڤبەرا 1 و ${options.length} دا بیت.`];
      return { questionDe: f.questionDe.trim(), questionKu: f.questionKu.trim(), options, correctAnswer: correct };
    },
    toForm: (q) => ({ questionDe: q.questionDe, questionKu: q.questionKu || "", options: q.options.join("\n"), correct: String(q.correctAnswer + 1) }),
    row: (q, i, bi) => ({ title: `${i + 1}. ${q.questionDe}`, sub: `${bi("Richtig", "درست")}: ${q.options[q.correctAnswer]}` }),
    Fields: QuestionFields,
  },
};

function TopicTab({ kind }) {
  const bi = useBi();
  const cfg = CFG[kind];
  const topics = flat(cfg.col);
  const [sel, setSel] = useState("");
  const [nt, setNt] = useState(emptyTopic);
  const [f, setF] = useState(cfg.empty);
  const [editItem, setEditItem] = useState(null);
  const [editTopic, setEditTopic] = useState(null);
  const [msg, setMsg] = useState(null);
  const [q, setQ] = useState("");

  const keyOf = (t) => `${t.level}/${t.id}`;
  const eff = sel === "new" || topics.length === 0 ? "new" : topics.some((t) => keyOf(t) === sel) ? sel : keyOf(topics[0]);
  const current = eff === "new" ? null : topics.find((t) => keyOf(t) === eff);
  const setItem = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const cancelItem = () => { setEditItem(null); setF(cfg.empty); setMsg(null); };

  const submitItem = async (e) => {
    e.preventDefault();
    const item = cfg.toItem(f);
    if (Array.isArray(item)) return setMsg({ ok: false, text: bi(...item) });
    if (eff === "new" && !nt.titleDe.trim()) return setMsg({ ok: false, text: bi(...cfg.needTitle) });
    let t;
    if (eff === "new") {
      t = { id: uid(nt.titleDe), level: nt.level, titleDe: nt.titleDe.trim(), titleKu: nt.titleKu.trim(), [cfg.items]: [item] };
      if (nt.storyId) t.storyId = nt.storyId;
    } else {
      t = clone(current);
      if (editItem !== null) t[cfg.items][editItem] = item; else t[cfg.items].push(item);
    }
    try { await saveItem(cfg.col, t); } catch { return setMsg(SAVE_FAIL); }
    if (eff === "new") setNt(emptyTopic);
    setSel(`${t.level}/${t.id}`);
    setEditItem(null); setF(cfg.empty);
    setMsg({
      ok: true,
      text: eff === "new" ? bi(...cfg.createdMsg) : editItem !== null ? bi("Änderungen gespeichert ✓", "گوهۆڕین هاتنە پاراستن ✓") : bi("Hinzugefügt ✓", "هاتە زێدەکرن ✓"),
    });
  };

  const delItem = (i) => {
    const t = clone(current);
    t[cfg.items].splice(i, 1);
    saveItem(cfg.col, t).catch(() => setMsg(SAVE_FAIL));
    if (editItem === i) cancelItem();
  };

  const saveTopic = async (e) => {
    e.preventDefault();
    if (!editTopic.titleDe.trim()) return setMsg({ ok: false, text: bi("Das Thema braucht einen deutschen Titel.", "دڤێت بابەت ناڤونیشانەکێ ئەلمانی هەبیت.") });
    const old = topics.find((x) => x.id === editTopic.id && x.level === editTopic.oldLevel);
    const upd = { ...old, level: editTopic.level, titleDe: editTopic.titleDe.trim(), titleKu: editTopic.titleKu.trim() };
    if (editTopic.storyId) upd.storyId = editTopic.storyId; else delete upd.storyId;
    try { await saveItem(cfg.col, upd); } catch { return setMsg(SAVE_FAIL); }
    setSel(`${editTopic.level}/${editTopic.id}`); setEditTopic(null);
    setMsg({ ok: true, text: bi("Details aktualisiert ✓", "وردەکاری هاتنە نووکرن ✓") });
  };
  const delTopic = (t) => {
    if (!window.confirm(bi(`„${t.titleDe}“ mit allem Inhalt löschen?`, `«${t.titleDe}» ب هەمی ناڤەڕۆکێ ڤە بهێتە سڕین؟`))) return;
    removeItem(cfg.col, t.id).catch(() => setMsg(SAVE_FAIL));
  };

  const items = (current?.[cfg.items] || []).map((it, i) => ({ it, i })).filter(({ it, i }) => `${cfg.row(it, i, bi).title}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <Box title={bi(...(editItem !== null ? cfg.itemEdit : cfg.itemNew))} active={editItem !== null}>
        <form onSubmit={submitItem} className="space-y-4">
          <Field label={bi(cfg.kind.de, cfg.kind.ku)}>
            <select className="field" value={eff} disabled={editItem !== null} onChange={(e) => { setSel(e.target.value); setMsg(null); }}>
              {topics.map((t) => <option key={keyOf(t)} value={keyOf(t)}>{lvTitle(t.level)} · {t.titleDe} ({t[cfg.items].length})</option>)}
              <option value="new">{bi(...cfg.createOpt)}</option>
            </select>
          </Field>

          {eff === "new" && (
            <div className="rounded-xl border border-dashed p-4" style={{ borderColor: "var(--brand)" }}>
              <p className="mb-3 text-sm font-semibold">{bi(...cfg.newTitle)}</p>
              <TopicFields v={nt} set={setNt} kind={cfg.kind} />
            </div>
          )}

          <cfg.Fields f={f} set={setItem} />
          <SubmitRow editing={editItem !== null} label={bi(...(eff === "new" ? cfg.createAdd : cfg.itemNew))} onCancel={cancelItem} />
          <Msg m={msg} />
        </form>
      </Box>

      {editTopic && (
        <Box title={bi(...cfg.editDetails)} active>
          <form onSubmit={saveTopic}>
            <TopicFields v={editTopic} set={(v) => setEditTopic({ ...editTopic, ...v })} kind={cfg.kind} />
            <SubmitRow editing label="" onCancel={() => setEditTopic(null)} />
          </form>
        </Box>
      )}

      <Box title={bi(...cfg.allTitle(topics.length))}>
        {topics.length === 0 && <p className="text-muted">{bi("Noch nichts da. Benutze das Formular oben, um das Erste zu erstellen.", "هێشتا چ نینە. فۆرما سەری بکاربینە بۆ دروستکرنا ئێکەم.")}</p>}
        {topics.map((t) => (
          <Row key={keyOf(t)} badge={<LevelBadge level={getLevel(t.level)} />} selected={keyOf(t) === eff}
            title={t.titleDe} sub={`${bi(...cfg.count(t[cfg.items].length))}${t.storyId ? ` · ${bi("mit Geschichte verknüpft", "ب چیرۆکێ ڤە گرێدایە")}` : ""}`}
            onClick={() => { setSel(keyOf(t)); cancelItem(); }}
            onEdit={() => { setEditTopic({ level: t.level, oldLevel: t.level, id: t.id, titleDe: t.titleDe, titleKu: t.titleKu || "", storyId: t.storyId || "" }); top(); }}
            onDelete={() => delTopic(t)} />
        ))}
      </Box>

      {current && (
        <Box title={bi(...cfg.inTitle(current.titleDe, current[cfg.items].length))}>
          <SearchBox value={q} onChange={setQ} />
          {items.length === 0 && <p className="text-muted">{bi("Nichts gefunden.", "چ نەهاتە دیتن.")}</p>}
          {items.map(({ it, i }) => {
            const r = cfg.row(it, i, bi);
            return <Row key={i} title={r.title} sub={r.sub} onEdit={() => { setEditItem(i); setF(cfg.toForm(it)); setMsg(null); top(); }} onDelete={() => delItem(i)} />;
          })}
        </Box>
      )}
    </>
  );
}

/* ---------------- Students / Schüler / قوتابی ---------------- */
const emptyStu = { name: "", className: "", level: "A1" };
function StudentsTab({ students }) {
  const bi = useBi();
  const [f, setF] = useState(emptyStu);
  const [edit, setEdit] = useState(null); // uid of the student being edited
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const item = { name: f.name.trim(), className: f.className.trim(), level: f.level };
    setBusy(true); setMsg(WAIT);
    try {
      if (edit) {
        await updateStudent(edit, item);
        setMsg({ ok: true, text: bi("Änderungen gespeichert ✓", "گوهۆڕین هاتنە پاراستن ✓") });
      } else {
        const code = await createStudent(item);
        setMsg({ ok: true, text: bi(`Schüler erstellt ✓ Anmeldecode: ${code}`, `قوتابی هاتە دروستکرن ✓ کۆدێ چوونەژوورێ: ${code}`) });
      }
      setEdit(null); setF(emptyStu);
    } catch (err) {
      console.error(err);
      setMsg(SAVE_FAIL);
    }
    setBusy(false);
  };
  const del = (uid) => {
    if (window.confirm(bi("Diesen Schüler löschen? Sein Anmeldecode funktioniert dann nicht mehr.", "ئەڤ قوتابیە بهێتە سڕین؟ کۆدێ چوونەژوورا وی ئێدی کار ناکەت."))) {
      deleteStudent(uid).catch(() => setMsg(SAVE_FAIL));
    }
  };
  const match = (s) => `${s.name} ${s.code} ${s.className}`.toLowerCase().includes(q.trim().toLowerCase());

  return (
    <>
      <Box title={edit ? bi("Schüler bearbeiten", "دەستکاریکرنا قوتابی") : bi("Schüler hinzufügen", "زێدەکرنا قوتابی")} active={!!edit}>
        <form onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={bi("Name", "ناڤ")}><input required className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label={bi("Klasse", "پۆل")}><input className="field" value={f.className} onChange={(e) => setF({ ...f, className: e.target.value })} /></Field>
            <Field label={bi("Niveau", "ئاست")}>
              <select className="field" value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}>{levels.map((l) => <option key={l.id}>{l.title}</option>)}</select>
            </Field>
          </div>
          <SubmitRow editing={!!edit} busy={busy} label={bi("Anmeldecode erstellen", "کۆدێ چوونەژوورێ دروست بکە")} onCancel={() => { setEdit(null); setF(emptyStu); setMsg(null); }} />
          <Msg m={msg} />
        </form>
      </Box>
      <Box title={bi(`Schüler und Anmeldecodes (${students.length})`, `قوتابی و کۆدێن چوونەژوورێ (${students.length})`)}>
        <SearchBox value={q} onChange={setQ} />
        {students.length === 0 && <p className="text-muted">{bi("Noch keine Schüler.", "هێشتا چ قوتابی نینن.")}</p>}
        {students.filter(match).map((s) => (
          <Row key={s.uid} title={s.name} sub={`${s.code} · ${s.className} · ${s.level}`}
            onEdit={() => { setEdit(s.uid); setF({ name: s.name, className: s.className, level: s.level }); setMsg(null); top(); }} onDelete={() => del(s.uid)} />
        ))}
      </Box>
    </>
  );
}

/* ---------------- Backup / Sicherung / پاشەکەوت ---------------- */
function BackupTab() {
  const bi = useBi();
  const [msg, setMsg] = useState(null);
  const run = async (fn, okText) => {
    setMsg(WAIT);
    try { await fn(); setMsg({ ok: true, text: okText }); } catch (err) { console.error(err); setMsg(SAVE_FAIL); }
  };
  const exportFile = () => {
    const blob = new Blob([JSON.stringify(getContent(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "lingua-content.json"; a.click();
    URL.revokeObjectURL(a.href);
  };
  const importFile = async (e) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    let data;
    try {
      data = normalizeContent(JSON.parse(await file.text()));
    } catch {
      return setMsg({ ok: false, text: bi("Diese Datei ist keine gültige Inhalts-Sicherung.", "ئەڤ فایلە پاشەکەوتەکا دروست نینە.") });
    }
    if (!window.confirm(bi("Den gesamten Inhalt für alle Schüler durch diese Datei ersetzen?", "هەمی ناڤەڕۆکێ بۆ هەمی قوتابیان ب ڤی فایلی بگوهۆڕی؟"))) return;
    run(() => replaceAllContent(data), bi("Inhalt importiert ✓", "ناڤەڕۆک هاتە هاوردن ✓"));
  };
  // Safe: only writes built-in items that aren't in the database yet, deletes nothing
  // Every story cover that isn't in the R2 bucket yet: built-in stories get their bucket cover from the code,
  // other stories get their picture downloaded, shrunk and uploaded. Nothing else in the story changes.
  const moveCovers = async () => {
    setMsg(WAIT);
    const fromCode = Object.fromEntries(Object.values(builtIn().stories).flat().map((s) => [s.id, s.coverImage]));
    let moved = 0, failed = 0;
    for (const s of flat("stories")) {
      if (!s.coverImage || s.coverImage.startsWith(IMAGES_URL)) continue;
      try {
        let url = fromCode[s.id]?.startsWith(IMAGES_URL) ? fromCode[s.id] : null;
        if (!url) {
          const res = await fetch(s.coverImage);
          if (!res.ok) throw new Error(`download ${res.status}`);
          url = await uploadImage("cover", await toJpeg(await res.blob(), { size: 1600 }));
        }
        await saveItem("stories", { ...s, coverImage: url });
        moved++;
      } catch (err) {
        console.error(`Cover of "${s.id}":`, err);
        failed++;
      }
    }
    setMsg(failed
      ? { ok: false, text: bi(`${moved} Titelbilder verschoben, ${failed} fehlgeschlagen. Lade diese in „Geschichten“ neu hoch.`, `${moved} وێنەیێن بەرگی هاتنە ڤەگوهاستن، ${failed} سەرنەکەفتن. وان د «چیرۆک» دا دووبارە بار بکە.`) }
      : { ok: true, text: moved ? bi(`${moved} Titelbilder in den Speicher verschoben ✓`, `${moved} وێنەیێن بەرگی هاتنە ڤەگوهاستن ✓`) : bi("Alle Titelbilder sind schon im Speicher ✓", "هەمی وێنەیێن بەرگی یێ ل جهێ خۆ نە ✓") });
  };
  const addMissing = async () => {
    setMsg(WAIT);
    try {
      const n = await addMissingBuiltIn();
      setMsg({ ok: true, text: n ? bi(`${n} neue Einträge hinzugefügt ✓`, `${n} تشتێن نوو هاتنە زێدەکرن ✓`) : bi("Alles ist schon da ✓", "هەمی تشت یێ هەیە ✓") });
    } catch (err) {
      console.error(err);
      setMsg(SAVE_FAIL);
    }
  };
  const reset = () => {
    if (window.confirm(bi("Alles entfernen, was du hinzugefügt hast, und zum eingebauten Inhalt zurückgehen?", "هەمی ئەوێ تە زێدە کری بسڕی و بزڤڕی بۆ ناڤەڕۆکا ئامادەکراو؟"))) {
      run(() => replaceAllContent(builtIn()), bi("Inhalt zurückgesetzt ✓", "ناڤەڕۆک زڤڕیە ✓"));
    }
  };
  return (
    <Box title={bi("Sicherung", "پاشەکەوت")}>
      <p className="mb-4 rounded-xl bg-soft p-4 text-sm text-muted">
        <Bi
          de={<>Alle Inhalte werden in der Datenbank gespeichert, und alle Schüler sehen Änderungen sofort. Mit „Exportieren“ machst du eine Sicherungskopie. <b className="text-fg">„Importieren“ und „Zurücksetzen“ ersetzen den gesamten Inhalt für alle Schüler.</b></>}
          ku={<>هەمی ناڤەڕۆک د داتابەیسێ دا دهێتە پاراستن، و هەمی قوتابی گوهۆڕینان دەستبەجێ دبینن. ب «هەناردەکرن» کۆپیەکا پاشەکەوتێ وەرگرە. <b className="text-fg">«هاوردن» و «زڤڕاندن» هەمی ناڤەڕۆکێ بۆ هەمی قوتابیان دگوهۆڕن.</b></>}
        />
      </p>
      <div className="flex flex-wrap gap-3">
        <button onClick={exportFile} className="btn-primary px-5 py-3">{bi("Inhalt exportieren", "ناڤەڕۆکێ هەناردە بکە")}</button>
        <label className="btn-ghost inline-flex cursor-pointer items-center px-5 py-3">
          {bi("Inhalt importieren", "ناڤەڕۆکێ هاوردە بکە")}<input type="file" accept="application/json" onChange={importFile} className="sr-only" />
        </label>
        <button onClick={addMissing} className="btn-ghost px-5 py-3">{bi("Neue eingebaute Inhalte hinzufügen", "ناڤەڕۆکا ئامادەکراو یا نوو زێدە بکە")}</button>
        <button onClick={moveCovers} className="btn-ghost px-5 py-3">{bi("Titelbilder in den Speicher verschieben", "وێنەیێن بەرگی ڤەگوهێزە بۆ جهێ پاراستنێ")}</button>
        <button onClick={reset} className="btn-danger px-5 py-3">{bi("Auf Standard zurücksetzen", "بزڤڕە بۆ ئامادەکراو")}</button>
      </div>
      <Msg m={msg} />
    </Box>
  );
}

/* ---------------- Page ---------------- */
const tabs = [
  ["overview", "Übersicht", "گشتی"],
  ["stories", "Geschichten", "چیرۆک"],
  ["words", "Wörter", "وشە"],
  ["quiz", "Quiz", "کویز"],
  ["students", "Schüler", "قوتابی"],
  ["backup", "Sicherung", "پاشەکەوت"],
];

export default function Dashboard() {
  const bi = useBi();
  const [tab, setTab] = useState("overview");
  const students = useStudents();
  const c = getContent();
  const sum = (col, key) => Object.values(c[col]).flat().reduce((n, t) => n + (t[key]?.length || 0), 0);
  const counts = [
    [bi("Geschichten", "چیرۆک"), Object.values(c.stories).flat().length, "📖"],
    [bi("Wörter", "وشە"), sum("wordTopics", "words"), "🔤"],
    [bi("Fragen", "پرسیار"), sum("quizzes", "questions"), "❓"],
    [bi("Schüler", "قوتابی"), students.length, "🎓"],
  ];
  const body = {
    overview: <OverviewTab go={setTab} />,
    stories: <StoriesTab />,
    words: <TopicTab kind="words" />,
    quiz: <TopicTab kind="quiz" />,
    students: <StudentsTab students={students} />,
    backup: <BackupTab />,
  }[tab];

  return (
    <div>
      <PageHeader
        title={bi("Dashboard", "داشبۆرد")}
        subtitle={bi("Geschichten, Wortthemen, Quizze und Schüler hinzufügen, bearbeiten oder löschen.", "چیرۆک، بابەتێ وشە، کویز و قوتابیان زێدە بکە، دەستکاری بکە یان بسڕە.")}
      />
      <div className="stagger mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counts.map(([label, n, icon]) => (
          <div key={label} className="glass rounded-2xl p-4">
            <p className="text-2xl">{icon}</p>
            <p className="text-3xl font-extrabold">{n}</p>
            <p className="text-sm text-muted">{label}</p>
          </div>
        ))}
      </div>
      <div role="tablist" className="-mx-1 mb-6 flex gap-2 overflow-x-auto p-1">
        {tabs.map(([id, de, ku]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`shrink-0 px-4 py-2.5 font-semibold ${tab === id ? "btn-primary" : "btn-ghost"}`}>
            {bi(de, ku)}
          </button>
        ))}
      </div>
      <div key={tab} className="page-in">{body}</div>
    </div>
  );
}
