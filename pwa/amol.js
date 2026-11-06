/* Muhasabah Amol — daily duas & adhkar, a step-by-step Namaz (salah) guide and essential masail.
 * Daily amol can be ticked off; completions feed the Home overview (Qalb score) and stay on device.
 * Content uses widely accepted authentic sources; rulings note that details differ between madhhabs.
 * Data: MHSX.get("amol") = { done: { "YYYY-MM-DD": [ids] } } */
(function () {
  "use strict";
  if (window.MHSAmol) return;
  var X = window.MHSX;
  var t = X.tr({
    en: { title: "Amol & Namaz", sub: "Daily duas · Namaz guide · Masail", menuSub: "Daily duas, namaz guide & masail", tabAmol: "Daily Amol", tabNamaz: "Namaz Shiksha", tabMasail: "Masail",
      doneToday: "{d} of {n} done today", mark: "Mark done", marked: "Done today", src: "Source", openQuran: "Read in Quran", openZikr: "Count with tasbih", copy: "Share",
      wudu: "Wudu (ablution)", salah: "How to pray — step by step", rakat: "Rakat of the five daily prayers", prayer: "Prayer", sunnahB: "Sunnah before", fard: "Fard", sunnahA: "Sunnah after", witr: "Witr",
      disclaimer: "Short summaries for everyday guidance. Some details differ between the schools of fiqh — ask a qualified scholar for your situation.", search: "Search duas and masail…",
      morning: "Morning & evening", daily: "Everyday life", salahG: "After salah", sleep: "Night & sleep", streak: "{n}-day amol streak" },
    bn: { title: "আমল ও নামাজ", sub: "দৈনিক দোয়া · নামাজ শিক্ষা · মাসায়েল", menuSub: "দৈনিক দোয়া, নামাজ শিক্ষা ও মাসায়েল", tabAmol: "দৈনিক আমল", tabNamaz: "নামাজ শিক্ষা", tabMasail: "মাসায়েল",
      doneToday: "আজ {n}টির মধ্যে {d}টি সম্পন্ন", mark: "সম্পন্ন করুন", marked: "আজ সম্পন্ন", src: "সূত্র", openQuran: "কুরআনে পড়ুন", openZikr: "তাসবিহে গুনুন", copy: "শেয়ার",
      wudu: "অজু", salah: "নামাজ পড়ার নিয়ম — ধাপে ধাপে", rakat: "পাঁচ ওয়াক্ত নামাজের রাকাত", prayer: "নামাজ", sunnahB: "আগের সুন্নত", fard: "ফরজ", sunnahA: "পরের সুন্নত", witr: "বিতর",
      disclaimer: "দৈনন্দিন দিকনির্দেশনার জন্য সংক্ষিপ্ত সারাংশ। কিছু বিষয়ে মাযহাবভেদে পার্থক্য আছে — নিজের অবস্থার জন্য একজন যোগ্য আলেমকে জিজ্ঞেস করুন।", search: "দোয়া ও মাসায়েল খুঁজুন…",
      morning: "সকাল ও সন্ধ্যা", daily: "দৈনন্দিন জীবন", salahG: "নামাজের পরে", sleep: "রাত ও ঘুম", streak: "{n} দিনের আমল ধারা" }
  });

  /* Daily amol. q = link to Quran {s,a}; z = link to the zikr counter. */
  var AMOL = [
    { id: "quls", g: "morning", ar: "قُلْ هُوَ ٱللَّهُ أَحَدٌ · قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ · قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ", en: "Recite Surah Al-Ikhlas, Al-Falaq and An-Nas three times each, morning and evening — it suffices you against everything.", bn: "সকাল-সন্ধ্যায় সূরা ইখলাস, ফালাক ও নাস তিনবার করে পড়ুন — এটি সব কিছু থেকে আপনার জন্য যথেষ্ট।", src: "Abu Dawud 5082 · Tirmidhi 3575", q: { s: 112, a: 1 } },
    { id: "bismillah3", g: "morning", ar: "بِسْمِ ٱللَّهِ ٱلَّذِي لَا يَضُرُّ مَعَ ٱسْمِهِ شَيْءٌ فِي ٱلْأَرْضِ وَلَا فِي ٱلسَّمَاءِ وَهُوَ ٱلسَّمِيعُ ٱلْعَلِيمُ", tl: "Bismillahil-ladhi la yadurru ma'asmihi shay'un fil-ardi wa la fis-sama'i wa huwas-sami'ul-'alim (×3)", en: "In the name of Allah, with whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing.", bn: "আল্লাহর নামে, যাঁর নামের সাথে আসমান ও জমিনের কোনো কিছুই ক্ষতি করতে পারে না; তিনি সর্বশ্রোতা, সর্বজ্ঞ। (৩ বার)", src: "Abu Dawud 5088 · Tirmidhi 3388" },
    { id: "sayyid", g: "morning", ar: "ٱللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا ٱسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَٱغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ ٱلذُّنُوبَ إِلَّا أَنْتَ", en: "Sayyidul Istighfar — the master supplication for forgiveness. Whoever says it with conviction in the day or night and dies, enters Paradise.", bn: "সাইয়্যিদুল ইস্তিগফার — ক্ষমা প্রার্থনার শ্রেষ্ঠ দোয়া। দৃঢ় বিশ্বাসে দিনে বা রাতে পড়ে সেদিন মারা গেলে জান্নাতি হবে।", src: "Bukhari 6306" },
    { id: "istighfar100", g: "morning", ar: "أَسْتَغْفِرُ ٱللَّهَ وَأَتُوبُ إِلَيْهِ", tl: "Astaghfirullaha wa atubu ilayh", en: "The Prophet ﷺ sought Allah's forgiveness and repented more than seventy times a day.", bn: "রাসূল ﷺ দিনে সত্তর বারেরও বেশি ইস্তিগফার ও তওবা করতেন।", src: "Bukhari 6307", z: "istighfar" },
    { id: "tasbih33", g: "salah", ar: "سُبْحَانَ ٱللَّهِ ٣٣ · ٱلْحَمْدُ لِلَّهِ ٣٣ · ٱللَّهُ أَكْبَرُ ٣٤", en: "After every fard prayer: SubhanAllah 33, Alhamdulillah 33, Allahu Akbar 34.", bn: "প্রতি ফরজ নামাজের পর: সুবহানাল্লাহ ৩৩, আলহামদুলিল্লাহ ৩৩, আল্লাহু আকবার ৩৪ বার।", src: "Muslim 596, 597", z: "subhanallah" },
    { id: "kursi", g: "salah", ar: "ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ…", en: "Ayatul Kursi after every fard prayer — nothing stands between the reciter and Paradise except death.", bn: "প্রতি ফরজ নামাজের পর আয়াতুল কুরসি — পাঠকারী ও জান্নাতের মাঝে মৃত্যু ছাড়া কোনো বাধা থাকে না।", src: "An-Nasa'i, Al-Kubra 9928 · Quran 2:255", q: { s: 2, a: 255 } },
    { id: "eat", g: "daily", ar: "بِسْمِ ٱللَّهِ", tl: "Bismillah · if forgotten: Bismillahi awwalahu wa akhirahu", en: "Before eating say Bismillah. If you forget, say: In the name of Allah at its beginning and its end.", bn: "খাওয়ার আগে বিসমিল্লাহ বলুন। ভুলে গেলে বলুন: বিসমিল্লাহি আওয়ালাহু ওয়া আখিরাহু।", src: "Abu Dawud 3767 · Tirmidhi 1858" },
    { id: "ate", g: "daily", ar: "ٱلْحَمْدُ لِلَّهِ ٱلَّذِي أَطْعَمَنِي هَٰذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ", en: "All praise is for Allah who fed me this and provided it for me without any might or power from me.", bn: "সমস্ত প্রশংসা আল্লাহর, যিনি আমাকে এটি খাইয়েছেন এবং আমার কোনো শক্তি-সামর্থ্য ছাড়াই রিজিক দিয়েছেন।", src: "Abu Dawud 4023 · Tirmidhi 3458" },
    { id: "leave", g: "daily", ar: "بِسْمِ ٱللَّهِ، تَوَكَّلْتُ عَلَى ٱللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّهِ", en: "Leaving home: In the name of Allah, I place my trust in Allah; there is no might nor power except with Allah.", bn: "ঘর থেকে বের হওয়ার সময়: আল্লাহর নামে, আল্লাহর উপর ভরসা করলাম; আল্লাহ ছাড়া কোনো শক্তি ও সামর্থ্য নেই।", src: "Abu Dawud 5095 · Tirmidhi 3426" },
    { id: "toilet", g: "daily", ar: "ٱللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ ٱلْخُبُثِ وَٱلْخَبَائِثِ · غُفْرَانَكَ", en: "Entering the toilet: O Allah, I seek refuge in You from evil and evil ones. Leaving: (I ask) Your forgiveness.", bn: "টয়লেটে প্রবেশের সময়: হে আল্লাহ, আমি অপবিত্র জিন নর-নারী থেকে আপনার আশ্রয় চাই। বের হয়ে: গুফরানাকা।", src: "Bukhari 142 · Abu Dawud 30" },
    { id: "masjid", g: "daily", ar: "ٱللَّهُمَّ ٱفْتَحْ لِي أَبْوَابَ رَحْمَتِكَ · ٱللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ", en: "Entering the masjid: O Allah, open for me the doors of Your mercy. Leaving: O Allah, I ask You of Your bounty.", bn: "মসজিদে প্রবেশের সময়: হে আল্লাহ, আমার জন্য আপনার রহমতের দরজা খুলে দিন। বের হওয়ার সময়: হে আল্লাহ, আমি আপনার অনুগ্রহ চাই।", src: "Muslim 713" },
    { id: "parents", g: "daily", ar: "رَّبِّ ٱرْحَمْهُمَا كَمَا رَبَّيَانِى صَغِيرًا", en: "My Lord, have mercy on them (my parents) as they raised me when I was small.", bn: "হে আমার রব, তাদের (মা-বাবার) প্রতি দয়া করুন, যেমন তারা আমাকে শৈশবে লালন-পালন করেছেন।", src: "Quran 17:24", q: { s: 17, a: 24 } },
    { id: "atina", g: "daily", ar: "رَبَّنَآ ءَاتِنَا فِى ٱلدُّنْيَا حَسَنَةً وَفِى ٱلْءَاخِرَةِ حَسَنَةً وَقِنَا عَذَابَ ٱلنَّارِ", en: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.", bn: "হে আমাদের রব, আমাদের দুনিয়াতে কল্যাণ দিন, আখিরাতে কল্যাণ দিন এবং জাহান্নামের আজাব থেকে রক্ষা করুন।", src: "Quran 2:201 · Bukhari 6389", q: { s: 2, a: 201 } },
    { id: "sleep", g: "sleep", ar: "بِٱسْمِكَ ٱللَّهُمَّ أَمُوتُ وَأَحْيَا", en: "Before sleeping: In Your name, O Allah, I die and I live.", bn: "ঘুমানোর আগে: হে আল্লাহ, আপনার নামেই আমি মৃত্যুবরণ করি ও জীবিত হই।", src: "Bukhari 6324" },
    { id: "wake", g: "sleep", ar: "ٱلْحَمْدُ لِلَّهِ ٱلَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ ٱلنُّشُورُ", en: "On waking: All praise is for Allah who gave us life after causing us to die, and to Him is the return.", bn: "ঘুম থেকে উঠে: সমস্ত প্রশংসা আল্লাহর, যিনি মৃত্যুর পর আমাদের জীবিত করেছেন এবং তাঁর কাছেই প্রত্যাবর্তন।", src: "Bukhari 6312" },
    { id: "baqarah", g: "sleep", ar: "ءَامَنَ ٱلرَّسُولُ بِمَآ أُنزِلَ إِلَيْهِ مِن رَّبِّهِۦ…", en: "The last two verses of Surah Al-Baqarah at night are sufficient for the one who recites them.", bn: "রাতে সূরা বাকারার শেষ দুই আয়াত পাঠকারীর জন্য যথেষ্ট।", src: "Bukhari 5009 · Quran 2:285–286", q: { s: 2, a: 285 } },
    { id: "mulk", g: "sleep", ar: "تَبَٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ…", en: "Surah Al-Mulk every night — a surah of thirty verses that intercedes for its companion.", bn: "প্রতি রাতে সূরা মুলক — ত্রিশ আয়াতের সূরা যা তার পাঠকারীর জন্য সুপারিশ করবে।", src: "Tirmidhi 2891 · Abu Dawud 1400", q: { s: 67, a: 1 } }
  ];
  var GROUPS = ["morning", "salah", "daily", "sleep"];

  var WUDU = {
    en: ["Make the intention (niyyah) in your heart and say Bismillah.", "Wash both hands up to the wrists three times.", "Rinse the mouth three times.", "Sniff water into the nose and blow it out three times.", "Wash the whole face three times — hairline to chin, ear to ear.", "Wash the right arm up to and including the elbow three times, then the left.", "Wipe (masah) the head once with wet hands, then wipe the ears.", "Wash the right foot up to and including the ankle three times, then the left, cleaning between the toes."],
    bn: ["অন্তরে নিয়ত করুন এবং বিসমিল্লাহ বলুন।", "দুই হাত কবজি পর্যন্ত তিনবার ধুয়ে নিন।", "তিনবার কুলি করুন।", "তিনবার নাকে পানি দিয়ে ঝেড়ে পরিষ্কার করুন।", "পুরো মুখমণ্ডল তিনবার ধুয়ে নিন — কপালের চুলের গোড়া থেকে থুতনি, এক কান থেকে অন্য কান পর্যন্ত।", "প্রথমে ডান হাত কনুইসহ তিনবার, তারপর বাম হাত ধুয়ে নিন।", "ভেজা হাতে একবার মাথা মাসেহ করুন, তারপর কান মাসেহ করুন।", "প্রথমে ডান পা টাখনুসহ তিনবার, তারপর বাম পা ধুয়ে নিন; আঙুলের ফাঁক খিলাল করুন।"]
  };
  var WUDU_DUA = { ar: "أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا ٱللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ", src: "Muslim 234" };

  var SALAH = [
    { k: { en: "Intention & Takbir", bn: "নিয়ত ও তাকবিরে তাহরিমা" }, d: { en: "Face the Qibla, make the intention in your heart, raise your hands and say Allahu Akbar.", bn: "কিবলামুখী হয়ে অন্তরে নিয়ত করুন, দুই হাত তুলে আল্লাহু আকবার বলুন।" }, ar: "ٱللَّهُ أَكْبَرُ" },
    { k: { en: "Opening supplication (Thana)", bn: "সানা" }, d: { en: "Standing (qiyam) with hands folded, recite the opening supplication quietly.", bn: "দাঁড়িয়ে হাত বেঁধে নিচু স্বরে সানা পড়ুন।" }, ar: "سُبْحَانَكَ ٱللَّهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ ٱسْمُكَ، وَتَعَالَىٰ جَدُّكَ، وَلَا إِلَٰهَ غَيْرُكَ" },
    { k: { en: "Al-Fatihah and a surah", bn: "সূরা ফাতিহা ও অন্য সূরা" }, d: { en: "Say Ta'awwudh and Bismillah, recite Surah Al-Fatihah, then another surah or verses (in the first two rakat).", bn: "আউযুবিল্লাহ ও বিসমিল্লাহ পড়ে সূরা ফাতিহা, তারপর (প্রথম দুই রাকাতে) অন্য একটি সূরা বা আয়াত পড়ুন।" }, q: { s: 1, a: 1 } },
    { k: { en: "Ruku (bowing)", bn: "রুকু" }, d: { en: "Say Allahu Akbar and bow, back straight, hands on knees. Say at least three times:", bn: "আল্লাহু আকবার বলে রুকুতে যান, পিঠ সোজা, হাত হাঁটুতে। কমপক্ষে তিনবার বলুন:" }, ar: "سُبْحَانَ رَبِّيَ ٱلْعَظِيمِ" },
    { k: { en: "Rising (Qawmah)", bn: "কাওমা (রুকু থেকে ওঠা)" }, d: { en: "Rise and stand straight, saying:", bn: "সোজা হয়ে দাঁড়ান এবং বলুন:" }, ar: "سَمِعَ ٱللَّهُ لِمَنْ حَمِدَهُ · رَبَّنَا وَلَكَ ٱلْحَمْدُ" },
    { k: { en: "Sujood (prostration)", bn: "সিজদা" }, d: { en: "Say Allahu Akbar and prostrate on forehead, nose, palms, knees and toes. Say at least three times:", bn: "আল্লাহু আকবার বলে কপাল, নাক, দুই হাত, দুই হাঁটু ও পায়ের আঙুল মাটিতে রেখে সিজদা করুন। কমপক্ষে তিনবার বলুন:" }, ar: "سُبْحَانَ رَبِّيَ ٱلْأَعْلَىٰ" },
    { k: { en: "Sitting between prostrations (Jalsa)", bn: "জলসা (দুই সিজদার মাঝে বসা)" }, d: { en: "Sit up calmly, then make the second sujood. You may say:", bn: "শান্তভাবে বসুন, তারপর দ্বিতীয় সিজদা করুন। বলতে পারেন:" }, ar: "رَبِّ ٱغْفِرْ لِي" },
    { k: { en: "Tashahhud", bn: "তাশাহহুদ (আত্তাহিয়্যাতু)" }, d: { en: "After every two rakat, sit and recite the Tashahhud.", bn: "প্রতি দুই রাকাত পর বসে তাশাহহুদ পড়ুন।" }, ar: "ٱلتَّحِيَّاتُ لِلَّهِ وَٱلصَّلَوَاتُ وَٱلطَّيِّبَاتُ، ٱلسَّلَامُ عَلَيْكَ أَيُّهَا ٱلنَّبِيُّ وَرَحْمَةُ ٱللَّهِ وَبَرَكَاتُهُ، ٱلسَّلَامُ عَلَيْنَا وَعَلَىٰ عِبَادِ ٱللَّهِ ٱلصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا ٱللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ" },
    { k: { en: "Salawat (Durood Ibrahim)", bn: "দরুদে ইবরাহিম" }, d: { en: "In the final sitting, send blessings on the Prophet ﷺ, then make a short dua.", bn: "শেষ বৈঠকে দরুদে ইবরাহিম পড়ুন, তারপর দোয়া মাসুরা পড়ুন।" }, ar: "ٱللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ، ٱللَّهُمَّ بَارِكْ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ" },
    { k: { en: "Salam", bn: "সালাম ফেরানো" }, d: { en: "Turn your head to the right, then to the left, saying:", bn: "প্রথমে ডানে, তারপর বামে মুখ ফিরিয়ে বলুন:" }, ar: "ٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّهِ" }
  ];
  // [prayer, sunnah before, fard, sunnah after, witr]
  var RAKAT = [["Fajr", "ফজর", "2", "2", "—", "—"], ["Dhuhr", "যোহর", "4", "4", "2", "—"], ["Asr", "আসর", "4*", "4", "—", "—"], ["Maghrib", "মাগরিব", "—", "3", "2", "—"], ["Isha", "এশা", "4*", "4", "2", "3"]];

  var MASAIL = [
    { q: { en: "What breaks wudu?", bn: "কী কী কারণে অজু ভেঙে যায়?" }, a: { en: "Anything that exits from the private parts (urine, stool, wind), deep sleep lying down or leaning, and losing consciousness. Schools differ on bleeding, vomiting and touching — follow your madhhab.", bn: "পেশাব-পায়খানার রাস্তা দিয়ে কিছু বের হওয়া (বায়ুসহ), শুয়ে বা হেলান দিয়ে গভীর ঘুম এবং অজ্ঞান হওয়া। রক্ত, বমি ও স্পর্শের বিষয়ে মাযহাবভেদে মত আছে — নিজের মাযহাব অনুসরণ করুন।" }, src: "Quran 5:6 · Bukhari 135" },
    { q: { en: "I forgot something in salah — what do I do?", bn: "নামাজে কিছু ভুলে গেলে কী করব?" }, a: { en: "If you miss a required (wajib) act or are unsure how many rakat you prayed, perform Sajdah Sahw — two prostrations near the end of the prayer. Missing a pillar (rukn) such as ruku or sujood must be made up.", bn: "ওয়াজিব কিছু ছুটে গেলে বা কত রাকাত পড়েছেন তা নিয়ে সন্দেহ হলে শেষ বৈঠকে সাহু সিজদা (দুটি সিজদা) দিন। রুকু-সিজদার মতো ফরজ (রুকন) ছুটে গেলে তা আদায় করতে হবে।" }, src: "Bukhari 1224 · Muslim 571" },
    { q: { en: "I missed a prayer. Can I make it up?", bn: "নামাজ কাজা হলে কী করব?" }, a: { en: "Yes. Pray it (qada) as soon as you remember or wake up, in the same form, and keep the order of missed prayers where possible.", bn: "হ্যাঁ। মনে পড়া বা ঘুম ভাঙার সাথে সাথে একই নিয়মে কাজা আদায় করুন এবং সম্ভব হলে ক্রমানুসারে পড়ুন।" }, src: "Bukhari 597 · Muslim 684" },
    { q: { en: "How do I pray while travelling?", bn: "সফরে নামাজ কীভাবে পড়ব?" }, a: { en: "A traveller shortens the four-rakat fard prayers (Dhuhr, Asr, Isha) to two (qasr). Fajr and Maghrib stay the same. The distance and duration that count as travel differ between schools (about 77–80 km in many).", bn: "মুসাফির চার রাকাতের ফরজ (যোহর, আসর, এশা) দুই রাকাত পড়বে (কসর)। ফজর ও মাগরিব অপরিবর্তিত। কতদূর ও কতদিন সফর ধরা হবে তা মাযহাবভেদে ভিন্ন (অনেকের মতে প্রায় ৭৭–৮০ কিমি)।" }, src: "Quran 4:101 · Bukhari 1090" },
    { q: { en: "When is it forbidden to pray?", bn: "কখন নামাজ পড়া নিষেধ?" }, a: { en: "At sunrise until the sun has risen, when the sun is at its zenith, and while the sun is setting.", bn: "সূর্যোদয়ের সময় (সূর্য পুরো ওঠা পর্যন্ত), ঠিক দুপুরে সূর্য মাথার উপর থাকার সময় এবং সূর্যাস্তের সময়।" }, src: "Muslim 831" },
    { q: { en: "There is no water — how do I purify?", bn: "পানি না থাকলে কীভাবে পবিত্র হব?" }, a: { en: "Perform tayammum: intend, strike clean earth or dust with both palms, wipe the face, then the hands. It is valid when water is unavailable or harmful to use.", bn: "তায়াম্মুম করুন: নিয়ত করে পবিত্র মাটি বা ধুলায় দুই হাত মেরে মুখমণ্ডল, তারপর দুই হাত মাসেহ করুন। পানি না পেলে বা ব্যবহারে ক্ষতির আশঙ্কা থাকলে এটি বৈধ।" }, src: "Quran 5:6 · Bukhari 338" },
    { q: { en: "I am ill and cannot stand.", bn: "অসুস্থ, দাঁড়াতে পারি না — কী করব?" }, a: { en: "Pray standing if you can; if not, sitting; if not, lying on your side — gesturing for ruku and sujood.", bn: "পারলে দাঁড়িয়ে, না পারলে বসে, তাও না পারলে কাত হয়ে শুয়ে ইশারায় রুকু-সিজদা করে নামাজ পড়ুন।" }, src: "Bukhari 1117" },
    { q: { en: "Does eating by mistake break my fast?", bn: "ভুলে খেয়ে ফেললে কি রোজা ভাঙে?" }, a: { en: "No. If you eat or drink out of forgetfulness, complete your fast — it was Allah who fed you.", bn: "না। ভুলে খেলে বা পান করলে রোজা পূর্ণ করুন — আল্লাহই তাকে খাইয়েছেন।" }, src: "Bukhari 1933 · Muslim 1155" },
    { q: { en: "Who must pay zakat?", bn: "কার উপর যাকাত ফরজ?" }, a: { en: "An adult Muslim whose savings (cash, gold, silver, trade goods) stay at or above the nisab for one lunar year pays 2.5% of it.", bn: "যে প্রাপ্তবয়স্ক মুসলিমের সঞ্চয় (নগদ, সোনা, রুপা, ব্যবসার পণ্য) এক চান্দ্রবছর নিসাব পরিমাণ বা তার বেশি থাকে, তিনি তার ২.৫% যাকাত দেবেন।" }, src: "Quran 9:103 · Abu Dawud 1573" },
    { q: { en: "Is Jumu'ah obligatory for me?", bn: "জুমার নামাজ কার উপর ফরজ?" }, a: { en: "Jumu'ah is obligatory on adult, sane, resident Muslim men; it replaces Dhuhr. Women, travellers and the sick may attend but pray Dhuhr otherwise.", bn: "প্রাপ্তবয়স্ক, সুস্থ মস্তিষ্ক, মুকিম মুসলিম পুরুষের উপর জুমা ফরজ; এটি যোহরের স্থলাভিষিক্ত। নারী, মুসাফির ও অসুস্থরা অংশ নিতে পারেন, না হলে যোহর পড়বেন।" }, src: "Quran 62:9 · Abu Dawud 1067" }
  ];

  function L(o) { return o[X.lang()] || o.en; }
  function data() { var d = X.get("amol", null) || {}; d.done = d.done || {}; return d; }
  function doneToday(d) { return (d || data()).done[X.dayKey()] || []; }
  function stats() {
    var d = data(), week = X.lastDays(7).map(function (x) { return (d.done[X.dayKey(x)] || []).length; });
    var streak = 0, day = new Date();
    if (!(d.done[X.dayKey()] || []).length) day = X.addDays(day, -1);
    while ((d.done[X.dayKey(day)] || []).length) { streak++; day = X.addDays(day, -1); }
    return { today: doneToday(d).length, total: AMOL.length, week: week, streak: streak };
  }
  function toggle(id) {
    var d = data(), k = X.dayKey(), list = (d.done[k] || []).slice(), i = list.indexOf(id);
    if (i === -1) list.push(id); else list.splice(i, 1);
    d.done[k] = list;
    var keys = Object.keys(d.done).sort(); while (keys.length > 400) delete d.done[keys.shift()];
    X.set("amol", d); X.haptic(i === -1 ? 18 : 8);
    return i === -1;
  }

  var sh = null, tab = "amol", query = "";
  function open(opts) {
    if (!window.MHSSheet) return;
    if (opts && opts.tab) tab = opts.tab;
    if (sh && sh.dialog.open) { render(); return; }
    sh = X.sheet({ id: "mhs-amol", title: t("title"), sub: t("sub"), onClose: function () { sh = null; } });
    sh.body.classList.add("mhs-am");
    render();
  }

  function arBlock(text) { return X.el("p", { class: "mhs-am-ar", lang: "ar", dir: "rtl", text: text }); }
  function quranBtn(q) {
    return X.el("button", { type: "button", class: "mhs-chip", text: "📖 " + t("openQuran"), on: { click: function () { sh && sh.close(); setTimeout(function () { window.MHSQuran && window.MHSQuran.open({ surah: q.s, ayah: q.a }); }, 120); } } });
  }

  function render() {
    var b = sh.body; b.replaceChildren();
    var tabs = X.el("div", { class: "mhs-am-tabs", role: "tablist" });
    [["amol", "tabAmol"], ["namaz", "tabNamaz"], ["masail", "tabMasail"]].forEach(function (p) {
      tabs.appendChild(X.el("button", { type: "button", role: "tab", "aria-selected": tab === p[0] ? "true" : "false", class: "mhs-am-tab" + (tab === p[0] ? " is-on" : ""), text: t(p[1]), on: { click: function () { tab = p[0]; render(); b.scrollTop = 0; } } }));
    });
    b.appendChild(tabs);
    if (tab === "amol") renderAmol(b); else if (tab === "namaz") renderNamaz(b); else renderMasail(b);
    b.appendChild(X.el("p", { class: "mhs-mini-note mhs-am-disc", text: t("disclaimer") }));
  }

  function renderAmol(b) {
    var s = stats(), done = doneToday();
    b.appendChild(X.el("div", { class: "mhs-am-dash", html:
      '<div class="r">' + X.ring(s.today / s.total, 58, 6) + '<b>' + X.esc(X.num(Math.round(100 * s.today / s.total))) + '%</b></div><div class="t"><b>' + X.esc(t("doneToday", { d: X.num(s.today), n: X.num(s.total) })) + "</b><small>🔥 " + X.esc(t("streak", { n: X.num(s.streak) })) + "</small></div>" + X.bars(s.week, 84, 30) }));
    GROUPS.forEach(function (g) {
      b.appendChild(X.el("h3", { class: "mhs-am-h", text: t(g === "salah" ? "salahG" : g) }));
      AMOL.filter(function (a) { return a.g === g; }).forEach(function (a) {
        var on = done.indexOf(a.id) !== -1;
        var card = X.el("article", { class: "mhs-am-card" + (on ? " is-done" : "") });
        var chk = X.el("button", { type: "button", class: "mhs-am-chk", "aria-pressed": on ? "true" : "false", "aria-label": on ? t("marked") : t("mark"), on: { click: function () {
          var now = toggle(a.id); card.classList.toggle("is-done", now); chk.setAttribute("aria-pressed", now ? "true" : "false"); chk.setAttribute("aria-label", now ? t("marked") : t("mark"));
          var dash = b.querySelector(".mhs-am-dash"); if (dash) { var s2 = stats(); dash.querySelector(".r").innerHTML = X.ring(s2.today / s2.total, 58, 6) + "<b>" + X.esc(X.num(Math.round(100 * s2.today / s2.total))) + "%</b>"; dash.querySelector(".t b").textContent = t("doneToday", { d: X.num(s2.today), n: X.num(s2.total) }); }
        } } }, [X.icon("check")]);
        var tools = X.el("div", { class: "tools" }, [
          a.q ? quranBtn(a.q) : null,
          a.z ? X.el("button", { type: "button", class: "mhs-chip", text: "📿 " + t("openZikr"), on: { click: function () { sh && sh.close(); setTimeout(function () { window.MHSZikr && window.MHSZikr.open({ zikr: a.z }); }, 120); } } }) : null,
          X.el("button", { type: "button", class: "mhs-chip", text: "↗ " + t("copy"), on: { click: function () { X.share(a.ar + "\n\n" + L(a) + "\n— " + a.src, t("title")); } } })
        ]);
        card.append(chk, X.el("div", { class: "body" }, [arBlock(a.ar), a.tl ? X.el("p", { class: "mhs-am-tl", text: a.tl }) : null, X.el("p", { class: "mhs-am-tr", text: L(a) }), X.el("small", { class: "mhs-am-src", text: t("src") + ": " + a.src }), tools]));
        b.appendChild(card);
      });
    });
  }

  function renderNamaz(b) {
    var w = X.el("details", { class: "mhs-am-acc", open: true }, [X.el("summary", { text: "💧 " + t("wudu") })]);
    var ol = X.el("ol", { class: "mhs-am-steps" });
    (WUDU[X.lang()] || WUDU.en).forEach(function (s) { ol.appendChild(X.el("li", { text: s })); });
    w.append(ol, arBlock(WUDU_DUA.ar), X.el("small", { class: "mhs-am-src", text: t("src") + ": " + WUDU_DUA.src }));
    b.appendChild(w);

    var s = X.el("details", { class: "mhs-am-acc", open: true }, [X.el("summary", { text: "🕌 " + t("salah") })]);
    var steps = X.el("ol", { class: "mhs-am-steps big" });
    SALAH.forEach(function (st) {
      steps.appendChild(X.el("li", null, [X.el("b", { text: L(st.k) }), X.el("p", { text: L(st.d) }), st.ar ? arBlock(st.ar) : null, st.q ? quranBtn(st.q) : null]));
    });
    s.appendChild(steps);
    b.appendChild(s);

    var r = X.el("details", { class: "mhs-am-acc", open: true }, [X.el("summary", { text: "🧮 " + t("rakat") })]);
    var tbl = X.el("table", { class: "mhs-am-rakat" });
    tbl.appendChild(X.el("thead", null, [X.el("tr", null, [t("prayer"), t("sunnahB"), t("fard"), t("sunnahA"), t("witr")].map(function (h) { return X.el("th", { scope: "col", text: h }); }))]));
    var tb = X.el("tbody");
    RAKAT.forEach(function (row) {
      tb.appendChild(X.el("tr", null, [X.el("th", { scope: "row", text: X.lang() === "bn" ? row[1] : row[0] })].concat(row.slice(2).map(function (c) { return X.el("td", { text: X.lang() === "bn" ? c.replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }) : c }); }))));
    });
    tbl.appendChild(tb);
    r.append(X.el("div", { class: "mhs-am-tblwrap" }, [tbl]), X.el("small", { class: "mhs-am-src", text: X.lang() === "bn" ? "* সুন্নতে গায়রে মুয়াক্কাদা (ঐচ্ছিক)। রাকাত সংখ্যা হানাফি মাযহাবের প্রচলিত নিয়ম অনুযায়ী; অন্য মাযহাবে সুন্নতের সংখ্যা ভিন্ন হতে পারে।" : "* Optional (ghair mu'akkadah) sunnah. Counts follow the common Hanafi practice; other schools differ slightly on sunnah prayers." }));
    b.appendChild(r);
  }

  function renderMasail(b) {
    var input = X.el("input", { type: "search", placeholder: t("search"), value: query, "aria-label": t("search") });
    var list = X.el("div", { class: "mhs-am-masail" });
    function draw() {
      list.replaceChildren();
      var q = query.trim().toLowerCase();
      MASAIL.filter(function (m) { return !q || (L(m.q) + " " + L(m.a)).toLowerCase().indexOf(q) !== -1; }).forEach(function (m, i) {
        list.appendChild(X.el("details", { class: "mhs-am-acc", open: i === 0 && !q ? true : null }, [
          X.el("summary", { text: L(m.q) }), X.el("p", { text: L(m.a) }), X.el("small", { class: "mhs-am-src", text: t("src") + ": " + m.src })
        ]));
      });
    }
    input.addEventListener("input", function () { query = input.value; draw(); });
    b.append(X.el("div", { class: "mhs-mini-search" }, [input]), list);
    draw();
  }

  window.MHSAmol = { open: open, stats: stats, items: AMOL };
  X.action({ k: "amol", label: function () { return t("title"); }, sub: function () { return t("menuSub"); }, icon: X.ICONS.mosque, c: "linear-gradient(140deg,#8d6e63,#5d4037)", run: function () { open(); } });
})();
