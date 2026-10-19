import { SPEECH_LANG } from "../config";

const synth = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;

// Many browsers (Android, some Windows setups) ignore utterance.lang and read with their default
// (often English) voice, so we pick a German voice ourselves. Voices load asynchronously in Chrome,
// so the choice is refreshed when the list changes.
let voice = null;
function pickVoice() {
  const want = SPEECH_LANG.toLowerCase();               // "de-de"
  const base = want.split("-")[0];                      // "de"
  const voices = synth.getVoices().map((v) => ({ v, lang: v.lang.replace("_", "-").toLowerCase() }));
  voice =
    (voices.find((x) => x.lang === want) || voices.find((x) => x.lang.startsWith(`${base}-`) || x.lang === base))?.v || null;
}
if (synth) {
  pickVoice();
  synth.addEventListener?.("voiceschanged", pickVoice);
}

export function speak(text, onEnd) {
  if (!synth) return;
  synth.cancel();
  if (!voice) pickVoice();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = SPEECH_LANG;
  if (voice) u.voice = voice;
  u.rate = 0.9;
  if (onEnd) u.onend = onEnd;
  synth.speak(u);
}

export function stopSpeaking() {
  synth?.cancel();
}
