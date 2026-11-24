// كل نصوص الواجهة تمر من هنا — عربي أولاً ومقابل إنجليزي معتمد.
// راجع docs/i18n.md قبل إضافة أي مفتاح جديد.

export type Lang = "ar" | "en";

const welcomeAr = {
  startFree: "ابدئي مجاناً — بلا بطاقة",
  languageLabel: "اختيار اللغة",
  arabicLabel: "العربية",
  englishLabel: "English",
} as const;

type WelcomeKeys = keyof typeof welcomeAr;

// TypeScript يفرض تطابق المفاتيح حرفياً بين اللغتين.
export const WELCOME: Record<Lang, Record<WelcomeKeys, string>> = {
  ar: welcomeAr,
  en: {
    startFree: "Start free — no card needed",
    languageLabel: "Choose language",
    arabicLabel: "العربية",
    englishLabel: "English",
  },
};

// الشاشة 02 — ملف الطفل: أربع خطوات، سؤال واحد في كل خطوة.
// نصوص الأسئلة والخيارات حرفياً من docs/screens.md § الشاشة 02.
const profileAr = {
  docTitle: "ملف طفلك",
  progressLead: "الخطوة",
  progressTail: "من 4 — لا يستغرق الكل أكثر من دقيقتين",
  progressAria: "تقدم خطوات الملف",
  back: "رجوع",
  next: "متابعة",
  finish: "أكملي الملف",
  privacyNote: "لا بريد ولا كلمة سر الآن — الحساب بعد الخطة",

  step1Title: "متى وُلد طفلك؟",
  step1Hint: "اختاري التاريخ — نحسب العمر وحدنا.",
  birthDateLabel: "تاريخ الميلاد",
  ageInvalid: "اختاري تاريخاً ليس في المستقبل.",
  ageNote: "ضمن نافذة تدريب مثالية",

  step2Title: "وما أصعب ما في نومه هذه الأيام؟",
  step2Hint: "اختاري الأقرب لك — لا جواب خاطئ.",
  problemFrequentWakes: "يستيقظ كل ساعتين تقريباً",
  problemFrequentWakesHint:
    "استيقاظات متكررة طوال الليل، حتى لو كان النوم سهلاً في بدايته.",
  problemLateSleep: "ينام متأخراً جداً",
  problemLateSleepHint: "السهرة تطول، وموعد النوم يتأخر كل ليلة.",
  problemHeldSleep: "لا ينام إلا في حضنك",
  problemHeldSleepHint: "يهدأ بين ذراعيك، ويصحو فور وضعه في سريره.",

  step3Title: "كيف يستيقظ في الليل غالباً؟",
  step3Hint: "اختاري النمط الأقرب لآخر أسبوع.",
  wakeTwoThree: "مرتين إلى ثلاث، في مواعيد متقاربة",
  wakeFrequentRandom: "كثيراً وبلا انتظام",
  wakeEarlyRiser: "ينام أول الليل ثم يستيقظ في الفجر",

  step4Title: "وما أهم هدف تريدينه أولاً؟",
  step4Hint: "هدف واحد نبدأ به، والباقي يأتي بعده.",
  goalSleepThrough: "ليلة أطول بلا استيقاظ",
  goalSelfSettle: "ينام بنفسه في سريره",
  goalEarlierBedtime: "موعد نوم أبكر وأثبت",

  doneEyebrow: "اكتمل الملف",
  doneTitle: "اكتمل ملف ليان — لنبنِ خطتك الأولى",
  doneIntro: "أربع إجابات فقط، وهذا ما سنبني عليه كل ليلة.",
  summaryBirth: "تاريخ الميلاد",
  summaryProblem: "أصعب ما في النوم",
  summaryWake: "نمط الاستيقاظ",
  summaryGoal: "أول هدف",
  doneNote: "محفوظ على جهازك — لا بريد ولا كلمة سر.",
  doneCta: "ابنِ خطتي الأولى",
  planTomorrow: "الشاشة 03 تُبنى غداً — ستعودين إلى الرئيسية.",
  home: "العودة للرئيسية",
} as const;

type ProfileKeys = keyof typeof profileAr;

export const PROFILE: Record<Lang, Record<ProfileKeys, string>> = {
  ar: profileAr,
  en: {
    docTitle: "Your baby's profile",
    progressLead: "Step",
    progressTail: "of 4 — the whole thing takes under two minutes",
    progressAria: "Profile steps progress",
    back: "Back",
    next: "Continue",
    finish: "Finish profile",
    privacyNote: "No email, no password now — the account comes after the plan",

    step1Title: "When was your baby born?",
    step1Hint: "Pick the date — we work out the age for you.",
    birthDateLabel: "Date of birth",
    ageInvalid: "Pick a date that isn't in the future.",
    ageNote: "in an ideal training window",

    step2Title: "What's hardest about sleep these days?",
    step2Hint: "Pick the closest one — there's no wrong answer.",
    problemFrequentWakes: "Wakes almost every two hours",
    problemFrequentWakesHint:
      "Repeated wake-ups all night, even when bedtime starts smoothly.",
    problemLateSleep: "Falls asleep very late",
    problemLateSleepHint:
      "The evening stretches, and bedtime drifts later every night.",
    problemHeldSleep: "Only sleeps in your arms",
    problemHeldSleepHint:
      "Settles in your arms, then wakes the moment you lay them down.",

    step3Title: "How do the wake-ups usually go?",
    step3Hint: "Pick the closest pattern from the past week.",
    wakeTwoThree: "Two or three, at fairly regular times",
    wakeFrequentRandom: "Many times, with no pattern",
    wakeEarlyRiser: "Sleeps early, then wakes before dawn",

    step4Title: "What matters most to you first?",
    step4Hint: "One goal to start with — the rest follows.",
    goalSleepThrough: "A longer night without waking",
    goalSelfSettle: "Falls asleep in their own bed",
    goalEarlierBedtime: "An earlier, steadier bedtime",

    doneEyebrow: "Profile complete",
    doneTitle: "Layan's profile is complete — let's build your first plan",
    doneIntro: "Four answers, and every night from here builds on them.",
    summaryBirth: "Date of birth",
    summaryProblem: "Hardest right now",
    summaryWake: "Wake pattern",
    summaryGoal: "First goal",
    doneNote: "Saved on your device — no email, no password.",
    doneCta: "Build my first plan",
    planTomorrow: "Screen 03 is being built tomorrow — taking you home.",
    home: "Back to home",
  },
};

// صياغة العمر باللغتين: «6 أشهر و9 أيام — ضمن نافذة تدريب مثالية».
function arabicCount(
  value: number,
  one: string,
  two: string,
  few: string,
  many: string,
): string {
  if (value === 1) return one;
  if (value === 2) return two;
  if (value >= 3 && value <= 10) return few.replace("{n}", String(value));
  return many.replace("{n}", String(value));
}

export function formatAge(lang: Lang, months: number, days: number): string {
  const { ageNote } = PROFILE[lang];

  if (lang === "en") {
    const monthText = `${months} ${months === 1 ? "month" : "months"}`;
    const dayText = `${days} ${days === 1 ? "day" : "days"}`;

    if (months === 0 && days === 0) return `Under a day — ${ageNote}`;
    if (months === 0) return `${dayText} — ${ageNote}`;
    if (days === 0) return `${monthText} exactly — ${ageNote}`;
    return `${monthText} and ${dayText} — ${ageNote}`;
  }

  const monthText = arabicCount(
    months,
    "شهر واحد",
    "شهران",
    "{n} أشهر",
    "{n} شهراً",
  );
  const dayText = arabicCount(days, "يوم واحد", "يومان", "{n} أيام", "{n} يوماً");

  if (months === 0 && days === 0) return `أقل من يوم — ${ageNote}`;
  if (months === 0) return `${dayText} — ${ageNote}`;
  if (days === 0) return `${monthText} بالضبط — ${ageNote}`;
  return `${monthText} و${dayText} — ${ageNote}`;
}
