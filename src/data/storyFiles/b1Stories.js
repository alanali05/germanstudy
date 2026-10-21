// B1 stories. Covers live in the R2 bucket (covers/<story id>.jpg, photos from Unsplash).
import { IMAGES_URL } from "../../config";

const COVER = `${IMAGES_URL}/covers`;

export const b1VorstellungsgespraechStory = {
  id: "das-vorstellungsgespraech",
  titleDe: "Das Vorstellungsgespräch",
  titleKu: "هەڤدیتنا کاری",
  level: "B1 (Fortgeschrittene Sprachverwendung)",
  readTime: "5 min",
  coverImage: `${COVER}/das-vorstellungsgespraech.jpg`,
  segments: [
    { de: "Ahmad hat sich bei einer Firma für Elektrotechnik als Techniker beworben.", ku: "ئەحمەدی داخوازا کاری وەکو تەکنیکار ل کۆمپانیەکا ئەلەکترۆتەکنیکێ پێشکێش کر." },
    { de: "Eine Woche später bekam er eine E-Mail mit einer Einladung zum Vorstellungsgespräch.", ku: "هەفتیەکێ پاشتر، ئیمەیلەک بۆ هات و ئەو بۆ هەڤدیتنا کاری هاتە داخوازکرن." },
    { de: "Am Abend vorher bereitete er sich gut vor und überlegte, welche Fragen man ihm stellen könnte.", ku: "ئێڤارا بەری هینگێ، وی خۆ باش ئامادە کر و هزر کر کا دێ چ پرسیار ژێ هێنە کرن." },
    { de: "Im Gespräch fragte ihn die Personalleiterin, warum er gerade in dieser Firma arbeiten wolle.", ku: "د هەڤدیتنێ دا، بەرپرسا کارمەندان پرسیار ژێ کر کا بۆچی ئەو دخوازیت ل ڤێ کۆمپانیێ کار بکەت." },
    { de: "Ahmad erklärte, dass er schon drei Jahre Berufserfahrung habe und gern im Team arbeite.", ku: "ئەحمەدی شرۆڤە کر کو سێ سالێن ئەزموونا کاری یێن وی هەین و حەز دکەت د تیمەکێ دا کار بکەت." },
    { de: "Außerdem sagte er, dass er seine Deutschkenntnisse in einem Abendkurs ständig verbessere.", ku: "هەروەسا گۆت کو ئەو زانینا خۆ یا ئەلمانی د خولەکا ئێڤاری دا بەردەوام باشتر دکەت." },
    { de: "Dann wollte sie wissen, welche Gehaltsvorstellung er habe und ab wann er anfangen könne.", ku: "پاشی وێ دڤیا بزانیت کا ئەو چ مووچەیەکێ دخوازیت و ژ کەنگی دشێت دەست ب کاری بکەت." },
    { de: "Am Ende bedankte sich Ahmad für das freundliche Gespräch und verabschiedete sich höflich.", ku: "ل دوماهیێ ئەحمەدی سوپاسیا وێ بۆ هەڤدیتنا دلخۆش کر و ب ڕێزڤە خاترا خۆ خواست." },
    { de: "Zwei Tage später rief die Firma an: Er hatte die Stelle bekommen!", ku: "پشتی دوو رۆژان کۆمپانیێ تەلەفۆن کر: وی جهێ کاری وەرگرتبوو!" }
  ],
  vocabulary: [
    { wordDe: "Sich bewerben", sentenceDe: "Er hat sich bei einer Firma beworben.", wordKu: "داخوازا کاری پێشکێش کرن", sentenceKu: "وی داخوازا کاری ل کۆمپانیەکێ پێشکێش کر." },
    { wordDe: "Das Vorstellungsgespräch Vorstellungsgespräche", sentenceDe: "Er hat morgen ein Vorstellungsgespräch.", wordKu: "هەڤدیتنا کاری", sentenceKu: "سوبەهی هەڤدیتنەکا کاری یا وی هەیە." },
    { wordDe: "Die Einladung Einladungen", sentenceDe: "Er bekam eine Einladung.", wordKu: "داخوازی / داوەتنامە", sentenceKu: "داوەتنامەیەک بۆ وی هات." },
    { wordDe: "Sich vorbereiten", sentenceDe: "Er bereitet sich gut vor.", wordKu: "خۆ ئامادەکرن", sentenceKu: "ئەو خۆ باش ئامادە دکەت." },
    { wordDe: "Die Berufserfahrung", sentenceDe: "Er hat drei Jahre Berufserfahrung.", wordKu: "ئەزموونا کاری", sentenceKu: "سێ سالێن ئەزموونا کاری یێن وی هەین." },
    { wordDe: "Das Gehalt Gehälter", sentenceDe: "Wie hoch ist das Gehalt?", wordKu: "مووچە", sentenceKu: "مووچە چەندە؟" },
    { wordDe: "Die Stelle Stellen", sentenceDe: "Er hat die Stelle bekommen.", wordKu: "جهێ کاری / پۆست", sentenceKu: "وی جهێ کاری وەرگرت." }
  ],
  quiz: [
    { questionDe: "Was bedeutet 'Das Vorstellungsgespräch'?", questionKu: "رامانا 'Das Vorstellungsgespräch' چییە؟", options: ["هەڤدیتنا کاری", "گرێبەستا کرێ", "کۆمبوونا دەیبابان", "خولا ئەلمانی"], correctAnswer: 0 },
    { questionDe: "Wie sagt man 'مووچە' auf Deutsch?", questionKu: "تۆ چەوا دبێژی 'مووچە' ب ئەلمانی؟", options: ["Die Miete", "Das Gehalt", "Die Rechnung", "Der Fahrpreis"], correctAnswer: 1 },
    { questionDe: "Was bedeutet 'Die Berufserfahrung'?", questionKu: "رامانا 'Die Berufserfahrung' چییە؟", options: ["زانینا زمانی", "ئەزموونا کاری", "دەمێ ڤالا", "پشوویا هاڤینێ"], correctAnswer: 1 },
    { questionDe: "Wie sagt man 'جهێ کاری / پۆست' auf Deutsch?", questionKu: "تۆ چەوا دبێژی 'جهێ کاری / پۆست' ب ئەلمانی؟", options: ["Die Stelle", "Die Schule", "Die Stadt", "Die Straße"], correctAnswer: 0 },
    { questionDe: "Was bedeutet 'Sich bewerben'?", questionKu: "رامانا 'Sich bewerben' چییە؟", options: ["خۆ ئامادەکرن", "خاترا خۆ خواستن", "داخوازا کاری پێشکێش کرن", "سوپاسی کرن"], correctAnswer: 2 }
  ]
};

export const b1HeizungStory = {
  id: "aerger-mit-der-heizung",
  titleDe: "Ärger mit der Heizung",
  titleKu: "ئاریشە دگەل گەرمکەرێ",
  level: "B1 (Fortgeschrittene Sprachverwendung)",
  readTime: "5 min",
  coverImage: `${COVER}/aerger-mit-der-heizung.jpg`,
  segments: [
    { de: "Seit einer Woche funktioniert die Heizung in Leylas Wohnung nicht mehr richtig.", ku: "ژ هەفتیەکێ ڤە، گەرمکەرا خانیێ لەیلایێ ب دورستی کار ناکەت." },
    { de: "Obwohl es draußen sehr kalt ist, bleiben die Heizkörper kalt.", ku: "هەرچەندە ل دەرڤە گەلەک سار بیت ژی، رادیاتۆر هەر سار دمینن." },
    { de: "Sie hat den Hausmeister schon zweimal angerufen, aber er ist nie gekommen.", ku: "وێ دوو جاران تەلەفۆن بۆ بەرپرسێ ئاڤاهیی کریە، لێ ئەو چ جاران نەهاتیە." },
    { de: "Deshalb hat sie beschlossen, ihrem Vermieter einen offiziellen Brief zu schreiben.", ku: "ژ بەر هندێ، وێ بڕیار دا نامەیەکا فەرمی بۆ خودانێ خانی بنڤیسیت." },
    { de: "In dem Brief beschreibt sie das Problem genau und bittet um eine schnelle Reparatur.", ku: "د نامێ دا ئەو ئاریشێ ب هویری دیار دکەت و داخوازا چاککرنەکا لەز دکەت." },
    { de: "Sie schreibt auch, dass sie die Miete mindern wird, wenn das Problem nicht bald gelöst wird.", ku: "هەروەسا دنڤیسیت کو ئەگەر ئاریشە زوو چارەسەر نەبیت، دێ کرێیێ کێم کەت." },
    { de: "Zwei Tage später kommt ein Handwerker und repariert die Heizung.", ku: "پشتی دوو رۆژان وەستایەک دهێت و گەرمکەرێ چاک دکەت." },
    { de: "Er erklärt, dass eine alte Pumpe kaputt war und ausgetauscht werden musste.", ku: "ئەو شرۆڤە دکەت کو پەمپەکا کەڤن خراب بوو و پێدڤی بوو بهێتە گوهۆڕین." },
    { de: "Endlich ist es in der Wohnung wieder warm, und Leyla ist sehr erleichtert.", ku: "ل دوماهیێ خانی دیسا گەرم بوو، و لەیلا گەلەک رحەت بوو." }
  ],
  vocabulary: [
    { wordDe: "Die Heizung Heizungen", sentenceDe: "Die Heizung funktioniert nicht.", wordKu: "گەرمکەر / سۆپا", sentenceKu: "گەرمکەر کار ناکەت." },
    { wordDe: "Der Heizkörper Heizkörper", sentenceDe: "Die Heizkörper bleiben kalt.", wordKu: "رادیاتۆر", sentenceKu: "رادیاتۆر سار دمینن." },
    { wordDe: "Der Hausmeister Hausmeister", sentenceDe: "Sie ruft den Hausmeister an.", wordKu: "بەرپرسێ ئاڤاهیی", sentenceKu: "ئەو تەلەفۆنێ بۆ بەرپرسێ ئاڤاهیی دکەت." },
    { wordDe: "Die Reparatur Reparaturen", sentenceDe: "Sie bittet um eine schnelle Reparatur.", wordKu: "چاککرن", sentenceKu: "ئەو داخوازا چاککرنەکا لەز دکەت." },
    { wordDe: "Der Handwerker Handwerker", sentenceDe: "Ein Handwerker repariert die Heizung.", wordKu: "وەستا", sentenceKu: "وەستایەک گەرمکەرێ چاک دکەت." },
    { wordDe: "Kaputt", sentenceDe: "Die Pumpe war kaputt.", wordKu: "خراب / شکەستی", sentenceKu: "پەمپ خراب بوو." },
    { wordDe: "Die Miete mindern", sentenceDe: "Sie wird die Miete mindern.", wordKu: "کرێ کێمکرن", sentenceKu: "ئەو دێ کرێیێ کێم کەت." }
  ],
  quiz: [
    { questionDe: "Was bedeutet 'Die Heizung'?", questionKu: "رامانا 'Die Heizung' چییە؟", options: ["گەرمکەر / سۆپا", "سەلاجە", "پەنجەرە", "دەرگەهـ"], correctAnswer: 0 },
    { questionDe: "Wie sagt man 'وەستا' auf Deutsch?", questionKu: "تۆ چەوا دبێژی 'وەستا' ب ئەلمانی؟", options: ["Der Vermieter", "Der Handwerker", "Der Kellner", "Der Kunde"], correctAnswer: 1 },
    { questionDe: "Was bedeutet 'Kaputt'?", questionKu: "رامانا 'Kaputt' چییە؟", options: ["نوی", "گەرم", "خراب / شکەستی", "ئارام"], correctAnswer: 2 },
    { questionDe: "Wer kümmert sich um das Haus?", questionKu: "کێ ئاگەهداریا ئاڤاهیی دکەت؟", options: ["Der Hausmeister", "Der Arzt", "Die Lehrerin", "Der Kunde"], correctAnswer: 0 }
  ]
};

export const b1ElternabendStory = {
  id: "der-elternabend",
  titleDe: "Der Elternabend",
  titleKu: "کۆمبوونا دەیبابان ل قوتابخانێ",
  level: "B1 (Fortgeschrittene Sprachverwendung)",
  readTime: "5 min",
  coverImage: `${COVER}/der-elternabend.jpg`,
  segments: [
    { de: "Rojin hat einen Sohn, der in die vierte Klasse einer Grundschule geht.", ku: "کوڕەکێ رۆژینێ هەیە کو دچیتە پۆلا چارێ یا قوتابخانا سەرەتایی." },
    { de: "Letzte Woche wurde sie zum ersten Mal zu einem Elternabend eingeladen.", ku: "هەفتیا بۆری بۆ جارا ئێکێ ئەو بۆ کۆمبوونا دەیبابان هاتە داخوازکرن." },
    { de: "Zuerst war sie nervös, weil sie Angst hatte, nicht alles zu verstehen.", ku: "د دەستپێکێ دا ئەو یا نیگەران بوو، ژ بەر کو دترسیا هەمی تشتان تێ نەگەهیت." },
    { de: "Die Klassenlehrerin begrüßte alle Eltern und stellte den Plan für das neue Schuljahr vor.", ku: "مامۆستایا پۆلێ بخێرهاتنا هەمی دەیبابان کر و پلانا سالا خواندنێ یا نوی پێشکێش کر." },
    { de: "Sie sprach über die Klassenfahrt, die Hausaufgaben und die Noten im Zeugnis.", ku: "وێ دەربارەی گەشتا پۆلێ، ئەرکێن مالێ و نمرێن کارنامەیێ ئاخفت." },
    { de: "Danach durften die Eltern Fragen stellen, und Rojin fragte, wie sie ihrem Sohn beim Lernen helfen könne.", ku: "پاشی دەیبابان دشیان پرسیاران بکەن، و رۆژینێ پرسیار کر کا چەوا دشێت هاریکاریا کوڕێ خۆ د خواندنێ دا بکەت." },
    { de: "Die Lehrerin empfahl ihr, jeden Abend zwanzig Minuten zusammen mit ihm zu lesen.", ku: "مامۆستایێ پێشنیار کر کو هەر ئێڤار بیست خولەکان دگەل وی بخوینیت." },
    { de: "Am Ende war Rojin stolz, weil sie fast alles verstanden und sogar selbst etwas gesagt hatte.", ku: "ل دوماهیێ رۆژین یا سەربلند بوو، ژ بەر کو وێ نێزیکی هەمی تشت تێگەهشتبوو و ب خۆ ژی تشتەک گۆتبوو." }
  ],
  vocabulary: [
    { wordDe: "Der Elternabend Elternabende", sentenceDe: "Sie geht zum Elternabend.", wordKu: "کۆمبوونا دەیبابان", sentenceKu: "ئەو دچیتە کۆمبوونا دەیبابان." },
    { wordDe: "Die Grundschule Grundschulen", sentenceDe: "Ihr Sohn geht in die Grundschule.", wordKu: "قوتابخانا سەرەتایی", sentenceKu: "کوڕێ وێ دچیتە قوتابخانا سەرەتایی." },
    { wordDe: "Die Klassenlehrerin Klassenlehrerinnen", sentenceDe: "Die Klassenlehrerin begrüßt die Eltern.", wordKu: "مامۆستایا پۆلێ", sentenceKu: "مامۆستایا پۆلێ بخێرهاتنا دەیبابان دکەت." },
    { wordDe: "Die Hausaufgabe Hausaufgaben", sentenceDe: "Er macht seine Hausaufgaben.", wordKu: "ئەرکێ مالێ", sentenceKu: "ئەو ئەرکێن خۆ یێن مالێ دکەت." },
    { wordDe: "Die Note Noten", sentenceDe: "Seine Noten sind gut.", wordKu: "نمرە", sentenceKu: "نمرێن وی باشن." },
    { wordDe: "Das Zeugnis Zeugnisse", sentenceDe: "Die Noten stehen im Zeugnis.", wordKu: "کارنامە", sentenceKu: "نمرە د کارنامەیێ دا دنڤیسینە." },
    { wordDe: "Nervös", sentenceDe: "Sie war nervös.", wordKu: "نیگەران", sentenceKu: "ئەو یا نیگەران بوو." }
  ],
  quiz: [
    { questionDe: "Was bedeutet 'Der Elternabend'?", questionKu: "رامانا 'Der Elternabend' چییە؟", options: ["کۆمبوونا دەیبابان", "ئێڤارا خێزانێ", "گەشتا پۆلێ", "رۆژا ئێکێ یا قوتابخانێ"], correctAnswer: 0 },
    { questionDe: "Wie sagt man 'ئەرکێ مالێ' auf Deutsch?", questionKu: "تۆ چەوا دبێژی 'ئەرکێ مالێ' ب ئەلمانی؟", options: ["Die Hausaufgabe", "Der Hausmeister", "Das Haus", "Die Hausnummer"], correctAnswer: 0 },
    { questionDe: "Was bedeutet 'Das Zeugnis'?", questionKu: "رامانا 'Das Zeugnis' چییە؟", options: ["پەرتووک", "کارنامە", "مامۆستا", "پۆل"], correctAnswer: 1 },
    { questionDe: "Was empfahl die Lehrerin?", questionKu: "مامۆستایێ چ پێشنیار کر؟", options: ["Mehr fernsehen", "Jeden Abend zusammen lesen", "Eine neue Schule suchen", "Weniger Hausaufgaben machen"], correctAnswer: 1 }
  ]
};

export const b1MuelltrennungStory = {
  id: "muelltrennung-und-umwelt",
  titleDe: "Mülltrennung und Umweltschutz",
  titleKu: "جوداکرنا زبلی و پاراستنا ژینگەهێ",
  level: "B1 (Fortgeschrittene Sprachverwendung)",
  readTime: "5 min",
  coverImage: `${COVER}/muelltrennung-und-umwelt.jpg`,
  segments: [
    { de: "Als Karwan nach Deutschland kam, wunderte er sich über die vielen verschiedenen Mülltonnen.", ku: "دەمێ کاروان هاتیە ئەلمانیا، ئەو ژ هەبوونا گەلەک تەنەکێن زبلێ یێن جۆراوجۆر سەرسام بوو." },
    { de: "Sein Nachbar erklärte ihm, dass man in Deutschland den Müll trennt.", ku: "جیرانێ وی بۆ شرۆڤە کر کو ل ئەلمانیا خەلک زبلی ژێک جودا دکەن." },
    { de: "In die gelbe Tonne kommen Verpackungen aus Plastik und Metall.", ku: "پاکەتێن پلاستیک و کانزایی دچنە د تەنەکا زەر دا." },
    { de: "Papier und Karton wirft man in die blaue Tonne, und Glas bringt man zum Glascontainer.", ku: "کاغەز و کارتۆن دهێنە هاڤێتن د تەنەکا شین دا، و شووشە دهێنە برن بۆ سندوقا شووشەیان." },
    { de: "Essensreste gehören in die Biotonne, damit daraus Kompost gemacht werden kann.", ku: "پاشماوێن خارنێ دچنە د تەنەکا ئۆرگانیک دا، دا کو پەین (کۆمپۆست) ژێ بهێتە چێکرن." },
    { de: "Inzwischen achtet Karwan auch beim Einkaufen auf die Umwelt.", ku: "نها کاروان دەمێ کڕینێ ژی ئاگەهداریا ژینگەهێ دکەت." },
    { de: "Er nimmt immer eine Stofftasche mit und kauft weniger Produkte, die in Plastik verpackt sind.", ku: "ئەو هەر جار چانتەکا قوماشی دگەل خۆ دبەت و کێمتر ئەو بەرهەمان دکڕیت یێن د پلاستیکێ دا پێچاین." },
    { de: "Er findet, dass jeder etwas tun kann, um die Natur zu schützen.", ku: "ب بۆچوونا وی، هەر کەسەک دشێت تشتەکی بکەت دا کو سروشتی بپارێزیت." }
  ],
  vocabulary: [
    { wordDe: "Der Müll", sentenceDe: "Man trennt den Müll.", wordKu: "زبل", sentenceKu: "خەلک زبلی ژێک جودا دکەن." },
    { wordDe: "Die Mülltonne Mülltonnen", sentenceDe: "Es gibt viele Mülltonnen.", wordKu: "تەنەکا زبلێ", sentenceKu: "گەلەک تەنەکێن زبلێ هەنە." },
    { wordDe: "Trennen", sentenceDe: "In Deutschland trennt man den Müll.", wordKu: "جوداکرن / ژێک ڤەکرن", sentenceKu: "ل ئەلمانیا زبل ژێک دهێتە جوداکرن." },
    { wordDe: "Die Verpackung Verpackungen", sentenceDe: "Verpackungen kommen in die gelbe Tonne.", wordKu: "پاکەت / بەرگ", sentenceKu: "پاکەت دچنە د تەنەکا زەر دا." },
    { wordDe: "Die Umwelt", sentenceDe: "Er achtet auf die Umwelt.", wordKu: "ژینگەهـ", sentenceKu: "ئەو ئاگەهداریا ژینگەهێ دکەت." },
    { wordDe: "Schützen", sentenceDe: "Wir müssen die Natur schützen.", wordKu: "پاراستن", sentenceKu: "دڤێت ئەم سروشتی بپارێزین." },
    { wordDe: "Der Nachbar Nachbarn", sentenceDe: "Sein Nachbar erklärt es ihm.", wordKu: "جیران", sentenceKu: "جیرانێ وی بۆ شرۆڤە دکەت." }
  ],
  quiz: [
    { questionDe: "Was bedeutet 'Der Müll'?", questionKu: "رامانا 'Der Müll' چییە؟", options: ["زبل", "ئاڤ", "نان", "کاغەز"], correctAnswer: 0 },
    { questionDe: "Wie sagt man 'ژینگەهـ' auf Deutsch?", questionKu: "تۆ چەوا دبێژی 'ژینگەهـ' ب ئەلمانی؟", options: ["Die Umwelt", "Die Umgebung", "Der Umzug", "Die Umleitung"], correctAnswer: 0 },
    { questionDe: "Wohin kommen Verpackungen aus Plastik?", questionKu: "پاکەتێن پلاستیکی دچنە کیڤە؟", options: ["In die blaue Tonne", "In die gelbe Tonne", "In die Biotonne", "Zum Glascontainer"], correctAnswer: 1 },
    { questionDe: "Was bedeutet 'Schützen'?", questionKu: "رامانا 'Schützen' چییە؟", options: ["هاڤێتن", "کڕین", "پاراستن", "جوداکرن"], correctAnswer: 2 }
  ]
};

export const b1ZugverspaetungStory = {
  id: "verspaetung-mit-dem-zug",
  titleDe: "Verspätung mit dem Zug",
  titleKu: "دەرەنگکەفتنا شەمەندەفەرێ",
  level: "B1 (Fortgeschrittene Sprachverwendung)",
  readTime: "5 min",
  coverImage: `${COVER}/verspaetung-mit-dem-zug.jpg`,
  segments: [
    { de: "Lena wollte am Freitag mit dem Zug von Hamburg nach München fahren, um ihre Schwester zu besuchen.", ku: "لێنایێ دڤیا رۆژا ئەینیێ ب شەمەندەفەرێ ژ هامبورگ بچیتە میونشن، دا کو سەرەدانا خوشکا خۆ بکەت." },
    { de: "Sie hatte das Ticket schon vor einem Monat online gebucht, weil es dann billiger war.", ku: "وێ بلیت بەری هەیڤەکێ ب ئۆنلاین رزێرڤە کربوو، ژ بەر کو هینگێ هەرزانتر بوو." },
    { de: "Als sie am Bahnhof ankam, hörte sie eine Durchsage: Der Zug hatte neunzig Minuten Verspätung.", ku: "دەمێ گەهشتیە ئێستگەهێ، وێ گوهـ ل ئاگەهداریەکێ بوو: شەمەندەفەر نۆت خولەکان دەرەنگ کەفتبوو." },
    { de: "Lena ärgerte sich, denn sie wollte pünktlich zum Abendessen ankommen.", ku: "لێنا عێجز بوو، چونکی دڤیا ل دەمێ خۆ بۆ خارنا ئێڤارێ بگەهیت." },
    { de: "Sie ging zum Informationsschalter und fragte, ob sie einen anderen Zug nehmen dürfe.", ku: "ئەو چوو بۆ جهێ پێزانینان و پرسیار کر کا دشێت شەمەندەفەرەکا دی بگریت." },
    { de: "Der Mitarbeiter sagte, dass sie wegen der Verspätung jeden anderen Zug nehmen könne.", ku: "کارمەندی گۆت کو ژ بەر دەرەنگکەفتنێ، ئەو دشێت هەر شەمەندەفەرەکا دی بگریت." },
    { de: "Außerdem bekomme sie später einen Teil des Fahrpreises zurück.", ku: "هەروەسا دێ پاشی پشکەک ژ بهایێ بلیتێ بۆ وێ زڤڕیتەڤە." },
    { de: "Lena nahm den nächsten Zug, rief ihre Schwester an und kam nur eine Stunde später als geplant an.", ku: "لێنایێ شەمەندەفەرا پشتی هینگێ گرت، تەلەفۆن بۆ خوشکا خۆ کر و تنێ دەمژمێرەکێ پشتی پلانێ گەهشت." }
  ],
  vocabulary: [
    { wordDe: "Der Zug Züge", sentenceDe: "Sie fährt mit dem Zug.", wordKu: "شەمەندەفەر / قتار", sentenceKu: "ئەو ب شەمەندەفەرێ دچیت." },
    { wordDe: "Der Bahnhof Bahnhöfe", sentenceDe: "Sie kommt am Bahnhof an.", wordKu: "ئێستگەها شەمەندەفەرێ", sentenceKu: "ئەو دگەهیتە ئێستگەهێ." },
    { wordDe: "Die Verspätung Verspätungen", sentenceDe: "Der Zug hat Verspätung.", wordKu: "دەرەنگکەفتن", sentenceKu: "شەمەندەفەر دەرەنگ کەفتیە." },
    { wordDe: "Die Durchsage Durchsagen", sentenceDe: "Sie hört eine Durchsage.", wordKu: "ئاگەهداری (ب دەنگی)", sentenceKu: "ئەو گوهـ ل ئاگەهداریەکێ دبیت." },
    { wordDe: "Buchen", sentenceDe: "Sie hat das Ticket online gebucht.", wordKu: "رزێرڤەکرن / حجزکرن", sentenceKu: "وێ بلیت ب ئۆنلاین رزێرڤە کر." },
    { wordDe: "Der Fahrpreis Fahrpreise", sentenceDe: "Sie bekommt einen Teil des Fahrpreises zurück.", wordKu: "بهایێ بلیتێ", sentenceKu: "پشکەک ژ بهایێ بلیتێ بۆ وێ دزڤڕیتەڤە." },
    { wordDe: "Pünktlich", sentenceDe: "Sie wollte pünktlich ankommen.", wordKu: "ل دەمێ خۆ", sentenceKu: "وێ دڤیا ل دەمێ خۆ بگەهیت." }
  ],
  quiz: [
    { questionDe: "Was bedeutet 'Die Verspätung'?", questionKu: "رامانا 'Die Verspätung' چییە؟", options: ["دەرەنگکەفتن", "گەشت", "بلیت", "ئێستگەهـ"], correctAnswer: 0 },
    { questionDe: "Wie sagt man 'ئێستگەها شەمەندەفەرێ' auf Deutsch?", questionKu: "تۆ چەوا دبێژی 'ئێستگەها شەمەندەفەرێ' ب ئەلمانی؟", options: ["Der Flughafen", "Der Bahnhof", "Die Haltestelle", "Der Hafen"], correctAnswer: 1 },
    { questionDe: "Was bedeutet 'Pünktlich'?", questionKu: "رامانا 'Pünktlich' چییە؟", options: ["زوو", "دەرەنگ", "ل دەمێ خۆ", "هەرزان"], correctAnswer: 2 },
    { questionDe: "Wie lange hatte der Zug Verspätung?", questionKu: "شەمەندەفەر چەند دەرەنگ کەفت؟", options: ["Zehn Minuten", "Eine halbe Stunde", "Neunzig Minuten", "Drei Stunden"], correctAnswer: 2 }
  ]
};
