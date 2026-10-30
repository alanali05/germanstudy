// Languages a student can learn, and the interface languages each user may pick
export const LEARN_LANGS = ["de", "en"];

// Name of a language, written in that language (used in toggles and pickers)
export const LANG_NAME = { ku: "کوردی", de: "Deutsch", en: "English" };

// The learning language of a profile; profiles from before English learn German
export const learnLangOf = (user) => (LEARN_LANGS.includes(user?.learnLang) ? user.learnLang : "de");

// Students: Kurdish + their learning language. The owner: all three.
export const uiLangsFor = (user) => (user?.role === "owner" ? ["ku", "de", "en"] : ["ku", learnLangOf(user)]);
