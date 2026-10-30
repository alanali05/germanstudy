import { SPEECH_LANGS } from "../config";

const synth = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;

// Many browsers (Android, some Windows setups) ignore utterance.lang and read with their default
// (often English) voice, so we pick a voice for the language ourselves: the exact tag (de-DE, en-GB) first,
// then any voice of the same language. Voices load asynchronously in Chrome, so the choices are
// forgotten (and picked again) when the list changes.
let voices = {}; // "en-GB" -> SpeechSynthesisVoice | null
function voiceFor(tag) {
  if (!(tag in voices)) {
    const want = tag.toLowerCase();
    const base = want.split("-")[0];
    const list = synth.getVoices().map((v) => ({ v, lang: v.lang.replace("_", "-").toLowerCase() }));
    const found = (list.find((x) => x.lang === want) || list.find((x) => x.lang.startsWith(`${base}-`) || x.lang === base))?.v || null;
    if (!found) return null; // not loaded yet: try again next time
    voices[tag] = found;
  }
  return voices[tag];
}
if (synth) synth.addEventListener?.("voiceschanged", () => { voices = {}; });

// lang = learning language ("de" | "en"); onEnd runs when the text has been read
export function speak(text, lang, onEnd) {
  if (!synth) return;
  synth.cancel();
  const tag = SPEECH_LANGS[lang] || SPEECH_LANGS.de;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = tag;
  const voice = voiceFor(tag);
  if (voice) u.voice = voice;
  u.rate = 0.9;
  if (onEnd) u.onend = onEnd;
  synth.speak(u);
}

export function stopSpeaking() {
  synth?.cancel();
}
