import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { levels } from "../../../data/levels";
import { toJpeg, uploadImage } from "../../../services/upload";
import { NOT_IMAGE, OPT, UPLOAD_FAIL, WAIT, useBi } from "../bi";
import { Box, Field, Msg } from "../ui";

// Cover, titles, level and reading time
export default function DetailsSection({ bundle, update }) {
  const bi = useBi();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => update({ [k]: e.target.value });

  // Shrinks the picture and uploads it to R2; the story keeps only its URL
  const pickCover = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same file again
    if (!file) return;
    if (!file.type.startsWith("image/")) return setMsg(NOT_IMAGE);
    setUploading(true); setMsg(WAIT);
    try {
      update({ coverImage: await uploadImage("cover", await toJpeg(file, { size: 1600 })) });
      setMsg(null);
    } catch {
      setMsg(UPLOAD_FAIL);
    }
    setUploading(false);
  };

  return (
    <Box id="details" title={bi("Details", "وردەکاری")}>
      <div className="flex flex-wrap gap-5">
        <div className="flex flex-[0_1_13rem] flex-col gap-2">
          {bundle.coverImage
            ? <img src={bundle.coverImage} alt="" className="h-32 w-full rounded-xl border border-line object-cover" />
            : <span aria-hidden="true" className="h-32 rounded-xl border border-dashed border-line bg-soft" />}
          <button type="button" onClick={() => fileRef.current.click()} disabled={uploading} className="btn-ghost inline-flex items-center justify-center gap-2 px-4 text-sm font-semibold">
            <Upload size={16} />
            {bundle.coverImage ? bi("Anderes Bild hochladen", "وێنەیەکێ دی بار بکە") : bi("Bild hochladen", "وێنەی بار بکە")}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={pickCover} className="hidden" />
          <Msg m={msg} />
        </div>
        <div className="grid flex-[1_1_20rem] content-start gap-4 sm:grid-cols-2">
          <Field label={bi("Deutscher Titel", "ناڤونیشانێ ئەلمانی")}>
            <input className="field" lang="de" dir="ltr" value={bundle.titleDe} onChange={set("titleDe")} />
          </Field>
          <Field label={bi("Kurdischer Titel", "ناڤونیشانێ کوردی")}>
            <input className="field" lang="ku" dir="rtl" value={bundle.titleKu} onChange={set("titleKu")} />
          </Field>
          <fieldset>
            <legend className="text-sm font-semibold">{bi("Niveau", "ئاست")}</legend>
            <div className="mt-1 grid grid-cols-4 gap-2">
              {levels.map((l) => {
                const on = bundle.level === l.id;
                return (
                  <button
                    key={l.id} type="button" aria-pressed={on} onClick={() => update({ level: l.id })}
                    className={`min-h-11 rounded-xl border font-bold ${on ? "" : "border-line"}`}
                    style={on ? { borderColor: l.color, background: `color-mix(in srgb, ${l.color} 18%, transparent)` } : undefined}
                  >
                    {l.title}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <Field label={bi("Lesezeit", "دەمێ خوێندنێ")} hint={bi(...OPT)}>
            <input className="field" value={bundle.readTime} onChange={set("readTime")} placeholder="3 min" />
          </Field>
        </div>
      </div>
    </Box>
  );
}
