/* Share configuration — the ONE place that defines the promo footer, the public link and the
 * UTM scheme appended to every share leaving the app (Quran, Hadith, Wisdom, Dua, Reminder,
 * Zikr milestones, streaks, invites…). Edit here, every module follows. */
(function () {
  "use strict";
  if (window.MHSShareConfig) return;
  window.MHSShareConfig = {
    brand: "Muhasabah-Pro",
    url: "https://muhasabah-pro.app",
    playUrl: "https://play.google.com/store/apps/details?id=com.shamimnoor.muhasabahpro",
    utm: { source: "app_share", param: "utm_medium" },
    /* Allowed utm_medium values. Anything else falls back to "app". */
    mediums: ["quran", "hadith", "wisdom", "dua", "amol", "names", "reminder", "zikr", "streak", "journal", "invite", "prayer", "widget", "app"],
    /* Signature line shown under every share, per language. */
    signature: { en: "— Muhasabah-Pro", bn: "— মুহাসাবা-প্রো", ar: "— محاسبة برو" },
    /* Invite / promo copy used by the 3-day engagement prompt and "Invite a friend". */
    invite: {
      en: "I use Muhasabah-Pro for prayer times, Quran, Hadith, daily amol and habit tracking — free, offline and private. Try it:",
      bn: "নামাজের সময়, কুরআন, হাদিস, দৈনন্দিন আমল ও অভ্যাস ট্র্যাকিংয়ের জন্য আমি মুহাসাবা-প্রো ব্যবহার করি — ফ্রি, অফলাইন ও ব্যক্তিগত। আপনিও দেখুন:",
      ar: "أستخدم محاسبة برو لمواقيت الصلاة والقرآن والحديث والأعمال اليومية وتتبع العادات — مجاني ويعمل دون إنترنت. جرّبه:"
    },
    /* Watermark text on generated image cards. */
    watermark: "muhasabah-pro.app"
  };
})();
