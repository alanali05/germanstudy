import { IMAGES_URL } from "../../config";

export const a2WohnungssucheStory = {
  id: "wohnungssuche-in-der-stadt",
  titleDe: "Die Wohnungssuche in der Stadt",
  titleKu: "لێگەریان ل دووڤ خانوویەکێ ل باژێری",
  level: "A2 (Grundlegende Kenntnisse)",
  readTime: "4 min",
  coverImage: `${IMAGES_URL}/covers/wohnungssuche-in-der-stadt.jpg`,
  segments: [
    { de: "Markus wohnt zur Miete, aber er möchte umziehen, weil seine aktuelle Wohnung zu klein ist.", ku: "مارکوس ب کرێ ل وێ دژیت، لێ ئەو دخوازم کۆچ بکەت، ژ بەر کو خانیێ وی یێ نها گەلەک بچووکە." },
    { de: "Deshalb liest er jeden Tag die Anzeigen in der Zeitung und im Internet.", ku: "ژ بەر ڤێ چەندێ، ئەو هەمی رۆژان دەلالەتێن رۆژنامێ و اینتەرنێتێ دژمێرێت." },
    { de: "Gestern hat er eine schöne Dreizimmerwohnung gefunden, die einen großen Balkon hat.", ku: "دوهی وی خانیەکێ جوان یێ سێ ژووری دیت، یێ کو باڵکۆنەکا مەزن هەی." },
    { de: "Er hat sofort angerufen und einen Besichtigungstermin vereinbart.", ku: "وی ب لێکن تەلەفۆن کر و نۆبەک بۆ سەرەدانا خانی دانوستاند." },
    { de: "Der Vermieter hat ihm die Wohnung gezeigt und erklärt, dass die Warmmiete inklusive Nebenkosten ist.", ku: "خانیڤان (خانی خودان) خانی بۆ نیشان دا و شرۆڤە کر کو کریا گەرم دگەل خەرجیێن زێدەترە." },
    { de: "Markus war sofort begeistert, weil die Küche modern und die Lage sehr ruhig ist.", ku: "مارکوس دەستبەجێ حەز ژێ کر، ژ بەر کو چێشتخانە یا نوی بوو و جهـ گەلەک ب سەقامگیر و ئارام بوو." },
    { de: "Er hat den Mietvertrag unterschrieben und freut sich schon auf den Umzug im nächsten Monat.", ku: "وی گرێبەستا کرێ ئیمزا کر و ژ نوکە ڤە بێچۆنا خۆشحالیێ دکەت بۆ ڤەگۆهێزتنا هەیڤا بهێت." }
  ],
  vocabulary: [
    { wordDe: "Die Miete Mieten", sentenceDe: "Er wohnt zur Miete.", wordKu: "کرێ", sentenceKu: "ئەو ب کرێ ل وێ دژیت." },
    { wordDe: "Umziehen", sentenceDe: "Er möchte umziehen.", wordKu: "کۆچکرن / گوهۆڕینا جهی", sentenceKu: "ئەو دخوازم کۆچ بکەت." },
    { wordDe: "Die Anzeige Anzeigen", sentenceDe: "Er liest die Anzeigen in der Zeitung.", wordKu: "دەلالەت / ڕیکلام", sentenceKu: "ئەو دەلالەتێن رۆژنامێ دژمێرێت." },
    { wordDe: "Der Vermieter Vermieter", sentenceDe: "Der Vermieter hat die Wohnung gezeigt.", wordKu: "خانیڤان / خودانێ خانی", sentenceKu: "خانیڤانی خانی نیشان دا." },
    { wordDe: "Die Nebenkosten", sentenceDe: "Die Miete ist inklusive Nebenkosten.", wordKu: "خەرجیێن زێدە (ئاو، دەستخۆشی و هتد)", sentenceKu: "کرێ خەرجیێن زێدە ژی ل خۆ دگریت." },
    { wordDe: "Der Mietvertrag Mietverträge", sentenceDe: "Er hat den Mietvertrag unterschrieben.", wordKu: "گرێبەستا کرێ", sentenceKu: "وی گرێبەستا کرێ ئیمزا کر." }
  ],
  quiz: [
    { questionDe: "Was bedeutet 'Die Miete'?", questionKu: "رامانا 'Die Miete' چییە؟", options: ["کرێ", "فڕۆتن", "خانیڤان", "گرێبەست"], correctAnswer: 0 },
    { questionDe: "Wie sagt man 'خانیڤان' auf Deutsch?", questionKu: "تۆ چەوا دبێژی 'خانیڤان' ب ئەلمانی؟", options: ["Der Vermieter", "Der Mieter", "Der Nachbar", "Der Arzt"], correctAnswer: 0 },
    { questionDe: "Was bedeutet 'Der Mietvertrag'?", questionKu: "رامانا 'Der Mietvertrag' چییە؟", options: ["گرێبەستا کرێ", "پاسپۆرت", "ناسنامە", "فاکتورە"], correctAnswer: 0 }
  ]
};

export const a2BeimArztStory = {
  id: "termin-beim-arzt",
  titleDe: "Ein Termin beim Arzt",
  titleKu: "نۆبە ل دەف پزیشکی",
  level: "A2 (Grundlegende Kenntnisse)",
  readTime: "4 min",
  coverImage: `${IMAGES_URL}/covers/termin-beim-arzt.jpg`,
  segments: [
    { de: "Claudia hat seit drei Tagen starke Halsschmerzen und Fieber.", ku: "کلاودیا ژ سێ رۆژان ڤە ئێشەکا مەزن د گەرووی خۆ دا هەیە و تبا وێ یا هەی." },
    { de: "Sie ruft in der Praxis an, um einen Termin zu vereinbaren.", ku: "ئەو تەلەفۆن بۆ نۆبەردارگەهێ دکەت دا کو نۆبەکێ دەستنیشان بکەت." },
    { de: "Die Sprechstundenhilfe sagt: 'Kommen Sie bitte heute um zehn Uhr vorbei.'", ku: "کچە کارگێرا نۆبەردارگەهێ دبێژیت: 'کەرەم بکە ئەڤرۆ دەمژمێر دەهـ وەرە.'" },
    { de: "Im Wartezimmer muss Claudia zwanzig Minuten warten, bis sie aufgerufen wird.", ku: "ل ژوورا ڤەواندنێ پێڤە دیارە کلاودیا بڤێت بیست خولەکان لبەر خۆ بگری هەتا کو هاتییە بانگکرن." },
    { de: "Der Arzt untersucht sie gründlich und stellt fest, dass sie eine Mandelentzündung hat.", ku: "پزیشک پشکنینەکا باوەرپێکری بۆ دکەت و دیار دکەت کو مێشکێن بەرۆکێن وێ تووشی هەوکردنێ بووینە." },
    { de: "Er verschreibt ihr Tabletten und empfiehlt, dass sie sich einige Tage im Bett ausruht.", ku: "ئەو حبوبان بۆ دڤەگۆهێزیت و پێشنیار دکەت کو ئەو هندەک رۆژان ل سەر جێگایی بهێنڤەدانێ بکەت." },
    { de: "Claudia holt die Medikamente in der Apotheke ab und geht direkt nach Hause.", ku: "کلاودیا دەرمانان ژ دەرمانخانەیێ دئینیت و راستەوخۆ دچیتە مال." }
  ],
  vocabulary: [
    { wordDe: "Die Halsschmerzen", sentenceDe: "Sie hat starke Halsschmerzen.", wordKu: "ئێشا گەرووی", sentenceKu: "ئێشەکا مەزن د گەرووی دا هەیە." },
    { wordDe: "Die Praxis Praxen", sentenceDe: "Sie ruft in der Praxis an.", wordKu: "نۆبەردارگەهـ / پزیشکخانە", sentenceKu: "ئەو تەلەفۆن بۆ پزیشکخانەیێ دکەت." },
    { wordDe: "Untersuchen", sentenceDe: "Der Arzt untersucht sie.", wordKu: "پشکنین کرن", sentenceKu: "پزیشک پشکنینێ بۆ دکەت." },
    { wordDe: "Das Rezept Rezepte", sentenceDe: "Der Arzt schreibt ein Rezept.", wordKu: "کاغەزا دەرمانان / رەسێت", sentenceKu: "پزیشک کاغەزا دەرمانان نڤیسیت." },
    { wordDe: "Das Medikament Medikamente", sentenceDe: "Sie holt die Medikamente ab.", wordKu: "دەرمان", sentenceKu: "ئەو دەرمانان دئینیت." }
  ],
  quiz: [
    { questionDe: "Was bedeutet 'Die Halsschmerzen'?", questionKu: "رامانا 'Die Halsschmerzen' چییە؟", options: ["ئێشا گەرووی", "سەرئێشە", "ئێشا دڵی", "تبا لەشی"], correctAnswer: 0 },
    { questionDe: "Wie sagt man 'پشکنین کرن' auf Deutsch?", questionKu: "تۆ چەوا دبێژی 'پشکنین کرن' ب ئەلمانی؟", options: ["Untersuchen", "Bestellen", "Bezahlen", "Wohnen"], correctAnswer: 0 },
    { questionDe: "Was bedeutet 'Das Medikament'?", questionKu: "رامانا 'Das Medikament' چییە؟", options: ["دەرمان", "پەرتووک", "تەلەفۆن", "نان"], correctAnswer: 0 }
  ]
};

export const a2ImBuroStory = {
  id: "arbeitsleben-im-buero",
  titleDe: "Ein Arbeitstag im Büro",
  titleKu: "رۆژا کارکرنێ ل فەرمانگەهێ",
  level: "A2 (Grundlegende Kenntnisse)",
  readTime: "4 min",
  coverImage: `${IMAGES_URL}/covers/arbeitsleben-im-buero.jpg`,
  segments: [
    { de: "Stefan arbeitet als Kaufmann in einer großen Firma in Frankfurt.", ku: "ستێفان وەکو بازرگانەک ل کۆمپانیەکا مەزن ل فرانکفۆرت کار دکەت." },
    { de: "Jeden Morgen beginnt er um acht Uhr mit der Arbeit und liest zuerst seine E-Mails.", ku: "سبەیدا هەمی رۆژان دەمژمێر هەشت دەست ب کار دکەت و پێشیێ نامەیێن خۆ دبینیت." },
    { de: "Um zehn Uhr hat er eine wichtige Besprechung mit seinem Chef und den Kollegen.", ku: "دەمژمێر دەهـ جڤاتەکا گرنگ دگەل سەروکێ خۆ و هەڤکاران هەیە." },
    { de: "Während des Meetings besprechen sie neue Projekte und planen die nächsten Aufgaben.", ku: "د دەمێ جڤاتێ دا، ئەوان پرۆژێن نوی دانوستاندن کر و ئەرکێن بهێت پلان بۆ دانان." },
    { de: "In der Mittagspause geht Stefan mit seiner Kollegin Anna in die Kantine, um etwas zu essen.", ku: "د دەمێ خوارنا نیڤرۆ دا، ستێفان دگەل هەڤالا خۆ ئانا دچیتە کانتینا کارگەهێ دا کو تشتەکێ بخۆریت." },
    { de: "Nachmittags schreibt er Rechnungen und telefoniert mit Kunden.", ku: "ل نیڤرۆیێ ئەو فاکتورەیان ددەتە نڤیسین و تەلەفۆنێ دگەل مێهڤان یان مۆشتەریان دکەت." },
    { de: "Um siebzehn Uhr schaltet er den Computer aus und fährt zufrieden nach Hause.", ku: "دەمژمێر پێنج ئێڤاری ئەو کۆمپیوتەری دکوژینیت و ب رازیبوون بەرەڤ مال دڤەگەریت." }
  ],
  vocabulary: [
    { wordDe: "Die Firma Firmen", sentenceDe: "Er arbeitet in einer Firma.", wordKu: "کۆمپانیا / کارگەهـ", sentenceKu: "ئەو ل کۆمپانیەکێ کار دکەت." },
    { wordDe: "Die Besprechung Besprechungen", sentenceDe: "Er hat eine Besprechung.", wordKu: "جڤات / دانوستاندن", sentenceKu: "ئەو جڤاتەکێ هەیە." },
    { wordDe: "Der Kollege Kollegen", sentenceDe: "Er arbeitet mit Kollegen.", wordKu: "هەڤکار", sentenceKu: "ئەو دگەل هەڤکاران کار دکەت." },
    { wordDe: "Die Mittagspause Mittagspausen", sentenceDe: "In der Mittagspause isst er.", wordKu: "دەمی خوارنا نیڤرۆ", sentenceKu: "د دەمێ نیڤرۆیدا ئەو خارنێ بخۆریت." },
    { wordDe: "Der Kunde Kunden", sentenceDe: "Er telefoniert mit Kunden.", wordKu: "مۆشتەری / مێهڤان", sentenceKu: "ئەو تەلەفۆنێ دگەل مۆشتەریان دکەت." }
  ],
  quiz: [
    { questionDe: "Was bedeutet 'Die Firma'?", questionKu: "رامانا 'Die Firma' چییە؟", options: ["کۆمپانیا", "مال", "نەخۆشخانە", "سوپرمارکێت"], correctAnswer: 0 },
    { questionDe: "Wie sagt man 'هەڤکار' auf Deutsch?", questionKu: "تۆ چەوا دبێژی 'هەڤکار' ب ئەلمانی؟", options: ["Der Kollege", "Der Arzt", "Der Kellner", "Der Vermieter"], correctAnswer: 0 },
    { questionDe: "Was bedeutet 'Die Mittagspause'?", questionKu: "رامانا 'Die Mittagspause' چییە؟", options: ["دەمی خوارنا نیڤرۆ", "ژوورا ڤەواندنێ", "داویا هەفتیێ", "دەمێ ڤالا"], correctAnswer: 0 }
  ]
};

export const a2UrlaubUndReisenStory = {
  id: "urlaub-am-meer",
  titleDe: "Urlaub am Meer",
  titleKu: "پشوولە ل سەر دەریاسی",
  level: "A2 (Grundlegende Kenntnisse)",
  readTime: "4 min",
  coverImage: `${IMAGES_URL}/covers/urlaub-am-meer.jpg`,
  segments: [
    { de: "Im Sommer sind Julia und Tobias für eine Woche nach Spanien gereist.", ku: "ل هاڤینێ جولیا و تۆبیاس بۆ هەفتیەکێ بۆ ئیسپانیا گەشت کر." },
    { de: "Sie haben einen Flug gebucht und in einem schönen Hotel direkt am Strand gewohnt.", ku: "وان فڕۆکەیەک رزێرڤە کر و ل هۆتێلەکە جوان راست ل سەر دەریایی ژیان." },
    { de: "Das Wetter war fantastisch: Die Sonne hat jeden Tag geschienen und es war sehr warm.", ku: "قەسلا سەقایی گەلەک یا باش بوو: خۆرێ هەمی رۆژان تیشک دا و گەلەک گەرم بوو." },
    { de: "Jeden Morgen sind sie früh aufgestanden, um im Meer zu schwimmen.", ku: "سبەیدا هەمی رۆژان زوو ژ خەو رابوون دا ل دەریاسی مەلەڤانێ بکەن." },
    { de: "Nachmittags haben sie Ausflüge gemacht und historische Sehenswürdigkeiten besichtigt.", ku: "ل نیڤرۆیێ وان گەشتێن بچووک کر و شوینوارێن مێژوویی پشکنین کر." },
    { de: "Abends haben sie in traditionellen Restaurants lokale Spezialitäten probiert.", ku: "ل ئێڤاریێ وان ل رێستۆرانتێن نەریتەپەرست خارنێن خۆمالی تاقی کر." },
    { de: "Der Urlaub war leider viel zu kurz, aber sie haben wunderbare Erinnerungen mitgebracht.", ku: "پشوولە مخابن گەلەک کورت بوو، لێ وان بیروەریێن مەزن دگەل خۆ ئینانە ڤە." }
  ],
  vocabulary: [
    { wordDe: "Der Urlaub Urlaube", sentenceDe: "Sie machen Urlaub in Spanien.", wordKu: "پشوولە / گەشت", sentenceKu: "ئەو پشوولەیێ ل ئیسپانیا دکەن." },
    { wordDe: "Das Hotel Hotels", sentenceDe: "Sie wohnen in einem Hotel.", wordKu: "هۆتێل / مێهڤانخانە", sentenceKu: "ئەو ل هۆتێلەکێ دژین." },
    { wordDe: "Der Strand Strände", sentenceDe: "Das Hotel liegt am Strand.", wordKu: "کەنار / دەریابس", sentenceKu: "هۆتێل ل کەنارێ دژیت." },
    { wordDe: "Die Sonne", sentenceDe: "Die Sonne scheint.", wordKu: "خۆر / ڕۆژ", sentenceKu: "خۆر تیشک ددەت." },
    { wordDe: "Die Erinnerung Erinnerungen", sentenceDe: "Sie haben schöne Erinnerungen.", wordKu: "بیروەری", sentenceKu: "وان بیروەریێن جوان هەنە." }
  ],
  quiz: [
    { questionDe: "Was bedeutet 'Der Urlaub'?", questionKu: "رامانا 'Der Urlaub' چییە؟", options: ["پشوولە / گەشت", "کار", "نەخۆشی", "خانی"], correctAnswer: 0 },
    { questionDe: "Wie sagt man 'کەنار' auf Deutsch?", questionKu: "تۆ چەوا دبێژی 'کەنار' ب ئەلمانی؟", options: ["Der Strand", "Der Park", "Das Haus", "Das Zimmer"], correctAnswer: 0 },
    { questionDe: "Was bedeutet 'Die Erinnerung'?", questionKu: "رامانا 'Die Erinnerung' چییە؟", options: ["بیروەری", "زانین", "گۆتار", "کۆمپانیا"], correctAnswer: 0 }
  ]
};

export const a2KochenUndErnahrungStory = {
  id: "kochen-mit-freunden",
  titleDe: "Kochen mit Freunden",
  titleKu: "چێشتکرن دگەل هەڤالان",
  level: "A2 (Grundlegende Kenntnisse)",
  readTime: "4 min",
  coverImage: `${IMAGES_URL}/covers/kochen-mit-freunden.jpg`,
  segments: [
    { de: "Am Freitagabend haben Freunde bei Michael zu Abend gegessen.", ku: "ل ئێڤارا شەمبیێ هەڤالان ل دەف مایکڵ خارنا ئێڤاری خار." },
    { de: "Michael hat vorgeschlagen, dass sie gemeinsam ein mediterranes Gericht kochen.", ku: "مایکڵ پێشنیار کر کو ئەو پێکڤە خارنەکا مەدیتەرانی دروست بکەن." },
    { de: "Zuerst sind sie gemeinsam in den Supermarkt gegangen, um frische Zutaten einzukaufen.", ku: "پێشیێ ئەو پێکڤە چوونە سووپر مارکێتێ دا کو پێکهاتێن نوی بکڕن." },
    { de: "Sie haben Gemüse, Tomaten, Olivenöl und Nudeln in den Einkaufswagen gelegt.", ku: "وان سەوزاتی، تەماتە، روونێ زەیتوونێ و مەکەرۆنی ئێخستنە د تڕۆلیێ دا." },
    { de: "In der Küche hat jeder eine Aufgabe übernommen: Michael hat die Nudeln gekocht und Lisa hat den Salat vorbereitet.", ku: "ل چێشتخانەیێ هەر ئێک ئەرەک گرتە خۆ: مایکڵ مەکەرۆنی کولان و لیسای سالات ئامادە کر." },
    { de: "Das Essen hat wunderbar geschmeckt und alle waren sehr zufrieden.", ku: "خارن ب شێوەیەکێ مەزن ب تام بوو و هەمیان گەلەک حەز ژێ کر." },
    { de: "Zum Nachtisch gab es frische Erdbeeren mit Sahne.", ku: "بۆ شرینیێ، چیلکێن نوی دگەل قیماغی هەنە." }
  ],
  vocabulary: [
    { wordDe: "Die Zutat Zutaten", sentenceDe: "Sie kaufen frische Zutaten.", wordKu: "پێکهاتە / مەواد", sentenceKu: "ئەو پێکهاتێن نوی دکڕن." },
    { wordDe: "Gemeinsam", sentenceDe: "Sie kochen gemeinsam.", wordKu: "پێکڤە", sentenceKu: "ئەو پێکڤە خارنێ دروست دکەن." },
    { wordDe: "Das Öl Öle", sentenceDe: "Er kauft Olivenöl.", wordKu: "روون", sentenceKu: "ئەو روونێ زەیتوونێ دکڕیت." },
    { wordDe: "Der Nachtisch", sentenceDe: "Es gibt Erdbeeren zum Nachtisch.", wordKu: "شرینی پشت خارنێ", sentenceKu: "چیلک بۆ شرینیێ هەنە." },
    { wordDe: "Schmecken", sentenceDe: "Das Essen hat geschmeckt.", wordKu: "تام دان", sentenceKu: "خارنێ تامەکا خۆش هەبوو." }
  ],
  quiz: [
    { questionDe: "Was bedeutet 'Gemeinsam'?", questionKu: "رامانا 'Gemeinsam' چییە؟", options: ["پێکڤە", "تەنێ", "ژ دەرڤە", "ل پاش"], correctAnswer: 0 },
    { questionDe: "Wie sagt man 'پێکهاتە' auf Deutsch?", questionKu: "تۆ چەوا دبێژی 'پێکهاتە' ب ئەلمانی؟", options: ["Die Zutat", "Die Tasche", "Die Rechnung", "Das Buch"], correctAnswer: 0 },
    { questionDe: "Was bedeutet 'Der Nachtisch'?", questionKu: "رامانا 'Der Nachtisch' چییە؟", options: ["شرینی پشت خارنێ", "خارنا سەرەکی", "نانی سپێدە", "تشتەکێ ترش"], correctAnswer: 0 }
  ]
};
