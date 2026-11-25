// كل نصوص الواجهة تمر من هنا — عربي أولاً ومقابل إنجليزي معتمد.
// راجع docs/i18n.md قبل إضافة أي مفتاح جديد.

import type {
  Adjustment,
  AdjustmentReasonCode,
} from "@/lib/engine/adjuster";
import type { PlanReason, PlanReasonCode } from "@/lib/engine/first-plan";

export type Lang = "ar" | "en";

const welcomeAr = {
  startFree: "ابدئي مجاناً — بلا بطاقة",
  foundingLink: "احجزي مقعدك المؤسس",
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
    foundingLink: "Reserve a founding seat",
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
    home: "Back to home",
  },
};

// الشاشة 03 — الخطة الأولى: لحظة القيمة.
// كل النصوص من docs/screens.md § الشاشة 03، والقيم المتغيرة تُملأ من المحرك.
const planAr = {
  docTitle: "خطة اليوم",
  headerTitle: "خطة ليان — اليوم الأول",
  headerSubline: "ليان · {age}",

  tonightTitle: "جدول الليلة",
  tonightHint: "اضغطي أي محطة لترى سببها",

  timelineRoutine: "بداية روتين التهدئة",
  timelineFeed: "آخر رضعة",
  timelineBed: "وضع في السرير يقظاً",
  timelineSleep: "النوم المتوقع",

  detailRoutine: "بعد صلاة العشاء بربع ساعة",
  detailFeed: "بلا نوم بعدها — فصل التغذية عن النوم بـ20 دقيقة",
  detailBed: "ضعيها في السرير يقظاً — الهدف: تهدأ بنفسها خلال 15 دقيقة",
  detailSleep: "تقدير أولي — يتحدّث يومياً",

  pillarsTitle: "ركائز خطتك الثلاث",
  pillarTimingTitle: "توقيت متقدم {advance} دقيقة",
  pillarTimingSubtitle: "من {from} إلى {to} — داخل نافذة العمر",
  pillarRoutineTitle: "روتين ثابت من 4 خطوات",
  pillarRoutineSubtitle: "35 دقيقة · الترتيب نفسه كل ليلة",
  pillarResponseTitle: "استجابة هادئة عند الاستيقاظ",
  pillarResponseFixed: "نفس الرد الهادئ في كل مرة",
  pillarResponseRandom: "ثبات بدل التبديل بين الحمل والهز",
  pillarResponseEarly: "عتمة وهدوء حتى الصباح",

  whyTitle: "لماذا هذه الخطة تحديداً؟",
  whyBody:
    "مبنية على عمر ليان ({age}) ونمط استيقاظها الذي اخترتِه. اضغطي أي عنصر لتري سببه كاملاً — لا قرارات خفية في راحة.",
  whyLabel: "السبب",
  closeReason: "إغلاق السبب",

  startCta: "حسناً — ابدئي الليلة",
  startedNotice: "تم — خطتك لهذه الليلة جاهزة. نبدأ {time}.",

  shareCta: "شاركي الخطة",
  shareAria: "مشاركة خطة الليلة كصورة",
  sharePreviewTitle: "معاينة الصورة",
  sharePreviewHint: "هذه هي الصورة التي ستُشارك — بلا بيانات خاصة.",
  shareSave: "حفظ الصورة",
  shareClose: "إغلاق",
  shareWorking: "جاري تجهيز الصورة...",
  shareDone: "تم تجهيز الصورة — بلا أي معلومات خاصة.",
  shareError: "تعذّر إنشاء الصورة. جرّبي مرة أخرى.",
  shareTitle: "خطة الليلة — راحة",
  shareCardEyebrow: "من راحة",
  shareCardTitle: "خطة الليلة",
  shareCardTagline: "ثلاث لمسات صباحاً. صمت ليلي كامل. خطة تتذكر.",
  shareCardFooter: "راحة · RahaMoon — مدرّب نوم الرضّع",
  shareNote: "صورة نظيفة — بلا اسم أو عمر أو نمط استيقاظ.",
} as const;

type PlanKeys = keyof typeof planAr;

export const PLAN: Record<Lang, Record<PlanKeys, string>> = {
  ar: planAr,
  en: {
    docTitle: "Today's plan",
    headerTitle: "Layan's plan — Day one",
    headerSubline: "Layan · {age}",

    tonightTitle: "Tonight's schedule",
    tonightHint: "Tap any step to see why",

    timelineRoutine: "Wind-down routine begins",
    timelineFeed: "Last feed",
    timelineBed: "Into bed, awake",
    timelineSleep: "Expected sleep",

    detailRoutine: "Fifteen minutes after Isha",
    detailFeed: "No sleep after it — feeding separated from sleep by 20 minutes",
    detailBed: "Place them in bed awake — goal: self-settle within 15 minutes",
    detailSleep: "An initial estimate — updates daily",

    pillarsTitle: "Your three foundations",
    pillarTimingTitle: "{advance} minutes earlier",
    pillarTimingSubtitle: "From {from} to {to} — inside the age window",
    pillarRoutineTitle: "A steady 4-step routine",
    pillarRoutineSubtitle: "35 minutes · same order every night",
    pillarResponseTitle: "A calm response to wake-ups",
    pillarResponseFixed: "The same calm reply every time",
    pillarResponseRandom: "Consistency instead of switching holds",
    pillarResponseEarly: "Dark and quiet until morning",

    whyTitle: "Why this plan, specifically?",
    whyBody:
      "Built on Layan's age ({age}) and the wake pattern you chose. Tap any item to see its full reason — no hidden decisions in RahaMoon.",
    whyLabel: "Why",
    closeReason: "Close reason",

    startCta: "Okay — start tonight",
    startedNotice: "Done — tonight's plan is set. We start at {time}.",

    shareCta: "Share the plan",
    shareAria: "Share tonight's plan as an image",
    sharePreviewTitle: "Image preview",
    sharePreviewHint: "This is the image you'll share — no private details.",
    shareSave: "Save image",
    shareClose: "Close",
    shareWorking: "Preparing the image...",
    shareDone: "Image ready — with no private details.",
    shareError: "Couldn't create the image. Please try again.",
    shareTitle: "Tonight's plan — RahaMoon",
    shareCardEyebrow: "From RahaMoon",
    shareCardTitle: "Tonight's plan",
    shareCardTagline:
      "Three morning taps. Full night silence. A plan that remembers.",
    shareCardFooter: "RahaMoon — Baby Sleep Coach",
    shareNote: "A clean image — no name, age, or wake pattern.",
  },
};

// شريط التنقل السفلي — من الشاشة 03 فصاعداً.
const tabbarAr = {
  navAria: "التنقل الرئيسي",
  today: "اليوم",
  ask: "اسألي راحة",
  library: "المكتبة",
  progress: "تقدمي",
  soon: "قريباً في الأيام القادمة",
} as const;

type TabbarKeys = keyof typeof tabbarAr;

export const TABBAR: Record<Lang, Record<TabbarKeys, string>> = {
  ar: tabbarAr,
  en: {
    navAria: "Main navigation",
    today: "Today",
    ask: "Ask Raha",
    library: "Library",
    progress: "Progress",
    soon: "Coming in the next few days",
  },
};

// الشاشة 05 — تسجيل الليلة: ثلاث لمسات صباحاً.
// النصوص من docs/screens.md § الشاشة 05، والقيم المتغيرة تُملأ بـ fillText.
const nightsAr = {
  docTitle: "تسجيل الليلة",
  greeting: "صباح الخير — كيف كانت الليلة؟",
  childName: "ليان",
  subline: "{name} · {age}",

  cardSleepTitle: "نامت {name} الساعة؟",
  cardSleepHint: "من خطة الليلة نفسها",
  otherTime: "وقت آخر",
  otherTimeAria: "اختيار وقت نوم آخر — يفتح منتقي الوقت",
  timePickerAria: "وقت نوم {name}",

  cardWakeTitle: "كم مرة استيقظت؟",
  wakeValueAria: "عدد مرات الاستيقاظ",
  wakeDecrease: "أنقصي عدد الاستيقاظات",
  wakeIncrease: "زيدي عدد الاستيقاظات",
  wakeAverage: "متوسط الأسبوع الماضي: {value}",
  wakeAverageNone: "هذه أول ليلة نسجلها — المتوسط يظهر من الغد",

  cardMoodTitle: "وأنتم الصباح؟",
  moodRested: "مرتاحون",
  moodTired: "متعَبون قليلاً",
  moodHard: "ليلة صعبة",

  saveCta: "سجّلي — وحدّثي خطة اليوم",
  emergencyCta: "ليلة صعبة جداً — فعّلي وضع الطوارئ",
  emergencyOn: "وضع الطوارئ مفعّل — خطة اليوم مثبتة بلا أي تعديل",
  emergencyTone:
    "كفى اليوم. ثبّتنا كل التوقيتات كما هي بلا أي تعديل، وخفضنا التوقعات. خطة اليوم تفتح في الشاشة التالية.",
  emergencyBannerTitle: "وضع الطوارئ مفعّل",
  emergencyBannerBody:
    "ثبّتنا خطة اليوم كما هي، بلا تعديلات ولا مطاردة. التفصيل الهادئ في خطة اليوم.",
  notice: "كل هذا لا يستهلك ثلاثين ثانية — ثم يصمت التطبيق حتى الغد",

  savedNotice: "تم — خطتك تحدثت. نراك غداً في الصباح.",
  summaryTitle: "تسجيل الليلة",
  summarySleep: "نامت الساعة",
  summaryWakes: "مرات الاستيقاظ",
  summaryMood: "صباحكم",
  edit: "تعديل التسجيل",

  devTitle: "أدوات التطوير — لا تظهر للمستخدم",
  devSeed: "املأي 7 ليالي لليان",
  devSeeded: "تم — سبع ليالي محفوظة",
  devClear: "مسح الليالي",
} as const;

type NightsKeys = keyof typeof nightsAr;

export const NIGHTS: Record<Lang, Record<NightsKeys, string>> = {
  ar: nightsAr,
  en: {
    docTitle: "Night check-in",
    greeting: "Good morning — how was the night?",
    childName: "Layan",
    subline: "{name} · {age}",

    cardSleepTitle: "What time did {name} fall asleep?",
    cardSleepHint: "From tonight's plan itself",
    otherTime: "Another time",
    otherTimeAria: "Pick another sleep time — opens the time picker",
    timePickerAria: "{name}'s sleep time",

    cardWakeTitle: "How many times did they wake?",
    wakeValueAria: "Number of wake-ups",
    wakeDecrease: "One fewer wake-up",
    wakeIncrease: "One more wake-up",
    wakeAverage: "Last week's average: {value}",
    wakeAverageNone: "This is the first night you log — the average starts tomorrow",

    cardMoodTitle: "And your morning?",
    moodRested: "Rested",
    moodTired: "A little tired",
    moodHard: "A hard night",

    saveCta: "Log it — update today's plan",
    emergencyCta: "A very rough night — turn on emergency mode",
    emergencyOn: "Emergency mode is on — today's plan is fixed with no adjustments",
    emergencyTone:
      "Enough for today. Every timing stays fixed with no adjustment, and expectations are lowered. Today's plan opens on the next screen.",
    emergencyBannerTitle: "Emergency mode is on",
    emergencyBannerBody:
      "Today's plan is fixed exactly as it is, with no adjustments and no chasing. The calm detail sits in today's plan.",
    notice:
      "All of this takes under thirty seconds — then the app goes quiet until tomorrow",

    savedNotice: "Done — your plan has updated. See you tomorrow morning.",
    summaryTitle: "Tonight's log",
    summarySleep: "Fell asleep at",
    summaryWakes: "Wake-ups",
    summaryMood: "Your morning",
    edit: "Edit the log",

    devTitle: "Development tools — never shown to users",
    devSeed: "Fill 7 nights for Layan",
    devSeeded: "Done — seven nights saved",
    devClear: "Clear the nights",
  },
};

// الشاشة 10 — العرض والاشتراك: السعر بعدالة معلنة.
// كل النصوص حرفياً من docs/screens.md § الشاشة 10.
const offerAr = {
  docTitle: "العرض والاشتراك",
  title: "انضمي إلى المؤسسين",
  subtitle: "عرض ما قبل الإطلاق — 200 مقعد فقط، والعداد حقيقي",

  foundingEyebrow: "عضوية مؤسِّسة",
  foundingPrice: "69$",
  foundingUnit: "مرة واحدة / مدى الحياة",
  foundingBody:
    "كل ما في راحة الآن وكل تحديثات السنة الأولى — بدلاً من 12$ شهرياً للأعضاء اللاحقين",

  subscriptionTitle: "الاشتراك العادي",
  subscriptionPrice: "12$",
  subscriptionUnit: "شهرياً",
  annualBadge: "الأوفر",
  annualLine: "سنوي: 79$ — أي 6.6$ شهرياً فعلياً",
  savingLine: "وفّري نحو 41$ في السنة مقابل Huckleberry Premium",

  compareTitle: "المقارنة المعلنة",
  compareConsultantLabel: "استشاري نوم متخصص",
  compareConsultantPrice: "800$+",
  compareCourseLabel: "دورة فيديو مسجلة (TCB)",
  compareCoursePrice: "179$",
  compareTrackingLabel: "تطبيق تتبع (Huckleberry)",
  compareTrackingPrice: "14.99$/شهر",
  compareCoachLabel: "مدرب عربي (ChildRoo)",
  compareCoachPrice: "19.99$/شهر",
  compareRahaLabel: "راحة — مدرب يتكيف يومياً",
  compareRahaPrice: "6.6$/شهر فعلياً",

  cta: "احجزي مقعدك المؤسس",
  trustNote: "ضمان استرداد 14 يوماً · إلغاء بضغطة واحدة · لا رسوم خفية",
} as const;

type OfferKeys = keyof typeof offerAr;

export const OFFER: Record<Lang, Record<OfferKeys, string>> = {
  ar: offerAr,
  en: {
    docTitle: "Offer & plans",
    title: "Join the founders",
    subtitle: "Pre-launch offer — 200 seats only, and the counter is real",

    foundingEyebrow: "Founding membership",
    foundingPrice: "$69",
    foundingUnit: "once / lifetime",
    foundingBody:
      "Everything in RahaMoon now, plus every update in the first year — instead of $12 a month for later members",

    subscriptionTitle: "Standard subscription",
    subscriptionPrice: "$12",
    subscriptionUnit: "a month",
    annualBadge: "Best value",
    annualLine: "Annual: $79 — that's $6.6 a month in practice",
    savingLine: "Save about $41 a year against Huckleberry Premium",

    compareTitle: "The comparison, in the open",
    compareConsultantLabel: "Specialist sleep consultant",
    compareConsultantPrice: "$800+",
    compareCourseLabel: "Recorded video course (TCB)",
    compareCoursePrice: "$179",
    compareTrackingLabel: "Tracking app (Huckleberry)",
    compareTrackingPrice: "$14.99/month",
    compareCoachLabel: "Arabic-speaking coach (ChildRoo)",
    compareCoachPrice: "$19.99/month",
    compareRahaLabel: "RahaMoon — a coach that adapts daily",
    compareRahaPrice: "$6.6/month in practice",

    cta: "Reserve your founding seat",
    trustNote:
      "14-day money-back guarantee · Cancel in one tap · No hidden fees",
  },
};

// صفحة الانتظار — الروح المبكرة من الشاشة 10، بلا دفع اليوم.
const waitlistAr = {
  docTitle: "قائمة المؤسسين",
  title: "انضمي إلى المؤسسين",
  subtitle: "عرض ما قبل الإطلاق — 200 مقعد فقط، والعداد حقيقي",
  promise: "ثلاث لمسات صباحاً. صمت ليلي كامل. خطة تتذكر.",

  emailLabel: "بريدك الإلكتروني",
  emailPlaceholder: "name@example.com",
  submit: "احجزوا مقعداً مؤسساً",
  submitting: "نحجز مقعدك...",
  viewProduct: "شاهدي المنتج",

  empty: "اكتبي بريدك أولاً — ونحجز لك المقعد.",
  invalid: "يبدو أن البريد غير مكتمل — تحقّقي منه من فضلك.",
  saved: "تم — مقعدك المؤسس محفوظ. نراسلك عند الإطلاق.",
  savedLocal: "تم — حفظنا بريدك على جهازك. نراسلك عند الإطلاق.",
  networkError:
    "تعذّر الوصول الآن — حفظنا بريدك على جهازك، فلن يضيع.",
} as const;

type WaitlistKeys = keyof typeof waitlistAr;

export const WAITLIST: Record<Lang, Record<WaitlistKeys, string>> = {
  ar: waitlistAr,
  en: {
    docTitle: "Founders list",
    title: "Join the founders",
    subtitle: "Pre-launch offer — 200 seats only, and the counter is real",
    promise: "Three morning taps. Full night silence. A plan that remembers.",

    emailLabel: "Your email",
    emailPlaceholder: "name@example.com",
    submit: "Reserve a founding seat",
    submitting: "Holding your seat...",
    viewProduct: "See the product",

    empty: "Add your email first and we'll hold your seat.",
    invalid: "That email looks incomplete — please check it.",
    saved: "Done — your founding seat is saved. We'll write when we launch.",
    savedLocal:
      "Done — your email is saved on this device. We'll write when we launch.",
    networkError:
      "We couldn't reach the server just now — your email is saved on your device, so it isn't lost.",
  },
};

// ---------------------------- أسباب الخطة ----------------------------
// قالب واحد لكل سبب. القيم تُملأ من PlanReason.params — لا نص في المكونات.

const planReasonsAr: Record<PlanReasonCode, string> = {
  routine:
    "نبدأ {time} — بعد صلاة العشاء بربع ساعة، ثم {routineMinutes} دقيقة روتين هادئ. آخر نافذة يقظة لعمر {ageMonths} أشهر هي {wakeMin}–{wakeMax} ساعة، وموعد النوم {bedtime} يقع داخل نطاقها.",
  feed:
    "آخر رضعة {time} — قبل السرير بـ{gap} دقيقة. نفصل التغذية عن النوم حتى لا ترتبط الرضاعة بالنوم، وتبقى لديها فرصة أن تهدأ بنفسها.",
  bed:
    "نضعها في السرير {time} وهي يقظة لكن هادئة. نمنحها {settle} دقيقة لتهدأ بنفسها؛ إن طال الوقت نستجيب بهدوء وبالحد الأدنى من الضوء، بلا حمل أو هز.",
  sleep:
    "نتوقع النوم حول {time}. لعمر {ageMonths} أشهر، النوم الليلي المتوقع {nightMin}–{nightMax} ساعة. هذا تقدير أولي يتحدّث كل صباح — لا وعد ولا قياس ليلي.",
  "pillar-timing":
    "نبدأ {to} بدل {from} — تقديم {advance} دقيقة فقط. خطوة صغيرة تحافظ على النافذة العمرية وتبني ضغط نوم كافياً بلا إرهاق.",
  "pillar-routine":
    "أربع خطوات، {minutes} دقيقة، بالترتيب نفسه كل ليلة: حمام دافئ، رضعة، تلاوة أو أنشودة، ثم ضوء خافت. الثبات هو نصف التدريب.",
  "pillar-response-fixed":
    "استيقاظات متوقعة في مواعيد متقاربة. نستجيب بهدوء وبالحد الأدنى من الضوء، ونمنحها دقيقتين قبل الحمل — نفس الاستجابة كل مرة.",
  "pillar-response-random":
    "استيقاظات غير منتظمة. نثبّت الاستجابة الهادئة نفسها كل مرة، بلا تبديل بين الحمل والهز؛ الثبات يعطيها إشارة أن الليل للنوم.",
  "pillar-response-early":
    "استيقاظ فجري. نُبقي الغرفة معتمة وهادئة حتى 6:00، بلا ضوء أو لعب؛ الضوء أول إشارة تعلّمها أن الصباح بدأ.",
};

const planReasonsEn: Record<PlanReasonCode, string> = {
  routine:
    "We start at {time} — fifteen minutes after Isha, then {routineMinutes} minutes of calm routine. The last wake window at {ageMonths} months is {wakeMin}–{wakeMax} hours, and the {bedtime} bedtime sits inside it.",
  feed:
    "Last feed at {time} — {gap} minutes before bed. We keep feeding separate from sleep so feeding doesn't become the sleep cue, and self-settling stays possible.",
  bed:
    "We place them in bed at {time}, awake but calm. We give them {settle} minutes to settle themselves; if it takes longer, we respond calmly with minimal light — no carrying or rocking.",
  sleep:
    "Sleep is expected around {time}. At {ageMonths} months, night sleep is typically {nightMin}–{nightMax} hours. This is an initial estimate that updates every morning — not a promise, and never a night measurement.",
  "pillar-timing":
    "We start at {to} instead of {from} — {advance} minutes earlier only. A small step that stays inside the age window and builds enough sleep pressure without exhaustion.",
  "pillar-routine":
    "Four steps, {minutes} minutes, in the same order every night: warm bath, feed, recitation or song, then dim light. Consistency is half the training.",
  "pillar-response-fixed":
    "Wake-ups at fairly regular times. We respond calmly with minimal light, giving them two minutes before picking them up — the same response every time.",
  "pillar-response-random":
    "Unpredictable wake-ups. We keep the same calm response every time, without switching between carrying and rocking; consistency tells them night is for sleep.",
  "pillar-response-early":
    "Early-morning wake-ups. We keep the room dark and quiet until 6:00, with no light or play; light is the first signal that morning has begun.",
};

const planProblemNotesAr: Record<string, string> = {
  "frequent-wakes":
    " لأن الاستيقاظ المتكرر هو ما يزعجكم الآن، نثبّت موعد النوم أولاً قبل أي تغيير آخر.",
  "late-sleep":
    " لأن النوم متأخر، نقدّم الموعد بهذه الدقائق فقط ونثبته قبل أي خطوة أخرى.",
  "held-sleep":
    " لأن النوم في الحضن هو التحدي، نضعها في السرير قبل أن تغفو حتى تتدرب على التهدئة الذاتية.",
};

const planProblemNotesEn: Record<string, string> = {
  "frequent-wakes":
    " Since repeated wake-ups are the hardest part right now, we steady bedtime first before changing anything else.",
  "late-sleep":
    " Since sleep is running late, we move bedtime earlier by these minutes only and hold it there before the next step.",
  "held-sleep":
    " Since sleeping in arms is the challenge, we place them in bed before they fall asleep so self-settling can begin.",
};

const planGoalNotesAr: Record<string, string> = {
  "sleep-through":
    " هدفك الأول ليلة أطول بلا استيقاظ — التقدم الصغير يخدمه بلا صدمة.",
  "self-settle":
    " هدفك الأول أن تنام بنفسها — البداية الهادئة هي أول خطوة.",
  "earlier-bedtime":
    " هدفك الأول موعد أبكر — هذه أول خطوة نحوه.",
};

const planGoalNotesEn: Record<string, string> = {
  "sleep-through":
    " Your first goal is a longer night without waking — this small step serves it without a shock.",
  "self-settle":
    " Your first goal is falling asleep independently — a calm start is the first step.",
  "earlier-bedtime":
    " Your first goal is an earlier bedtime — this is the first step toward it.",
};

/** يملأ قالب نص بقيم مفتاحية — يُستخدم للعناوين والبطاقات أيضاً. */
export function fillText(
  template: string,
  params: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    return value === undefined ? match : String(value);
  });
}

/** يصوغ سبب عنصر خطة بلغة الواجهة، ويضيف ملاحظة المشكلة/الهدف عند الحاجة. */
export function formatPlanReason(lang: Lang, reason: PlanReason): string {
  const templates = lang === "ar" ? planReasonsAr : planReasonsEn;
  let text = fillText(templates[reason.code], reason.params);

  if (reason.code === "bed") {
    const notes = lang === "ar" ? planProblemNotesAr : planProblemNotesEn;
    text += notes[String(reason.params.problem)] ?? "";
  }

  if (reason.code === "pillar-timing") {
    const notes = lang === "ar" ? planGoalNotesAr : planGoalNotesEn;
    text += notes[String(reason.params.goal)] ?? "";
  }

  return text;
}

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

/** عمر مختصر لرأس الشاشة 03: «6 أشهر» / "6 months". */
export function formatAgeMonths(lang: Lang, months: number): string {
  if (lang === "en") {
    return `${months} ${months === 1 ? "month" : "months"}`;
  }

  return arabicCount(
    months,
    "شهر واحد",
    "شهران",
    "{n} أشهر",
    "{n} شهراً",
  );
}

// ---------------------------- الشاشة 07 — اسألي راحة ----------------------------
const askAr = {
  docTitle: "اسألي راحة",
  headerTitle: "اسألي راحة",
  headerBody: "يجيب من ملف ليان وخطتك، لا من الذاكرة العامة",
  placeholder: "اسألي أي شيء يؤرقك الليلة...",
  send: "إرسال السؤال",
  motherLabel: "رسالتك",
  rahaLabel: "راحة",
  typing: "راحة تراجع الملف وتفكر بهدوء...",
  addAdjustment: "أضيفي التعديل إلى خطة الليلة",
  adjustmentAdded: "تم — أضفنا التعديل إلى سجل خطة الليلة.",
  askTomorrow: "وغداً أسأليني ماذا حدث",
  tomorrowAdded: "تم — سأعيد السؤال غداً صباحاً.",
  safetyTitle: "الأفضل أن يطمئن عليكِ طبيب",
  safetyBody: "هذا الوصف يحتاج تقييماً طبياً مباشراً. تواصلي مع طبيب الأطفال أو خدمة الطوارئ المحلية الآن، من فضلك.",
  empty: "اكتبي سؤالك، وسأربطه بملف ليان وخطة الليلة.",
  saved: "المحادثة محفوظة على جهازك.",
  noPlan: "أجهز خطة ليان المحفوظة أولاً، ثم أجيبك.",
} as const;

type AskKeys = keyof typeof askAr;

export const ASK: Record<Lang, Record<AskKeys, string>> = {
  ar: askAr,
  en: {
    docTitle: "Ask Raha",
    headerTitle: "Ask Raha",
    headerBody: "Answers from Layan's profile and your plan, not general memory",
    placeholder: "Ask anything keeping you up tonight...",
    send: "Send question",
    motherLabel: "Your message",
    rahaLabel: "Raha",
    typing: "Raha is checking the profile and thinking calmly...",
    addAdjustment: "Add the adjustment to tonight's plan",
    adjustmentAdded: "Done — the adjustment is in tonight's plan history.",
    askTomorrow: "Ask me tomorrow what happened",
    tomorrowAdded: "Done — I'll ask again tomorrow morning.",
    safetyTitle: "A doctor should check this",
    safetyBody: "This needs direct medical assessment. Please contact your baby's doctor or your local emergency service now.",
    empty: "Ask your question and I'll connect it to Layan's profile and tonight's plan.",
    saved: "This conversation is saved on your device.",
    noPlan: "I am loading Layan's saved plan first, then I'll answer.",
  },
};

// ---------------------- الشاشة 06 — خطة اليوم المعدّلة ----------------------
// النصوص من docs/screens.md § الشاشة 06. لا نص صلب في المكوّن.

const adjustmentsAr = {
  docTitle: "خطة اليوم المعدّلة",
  headerTitle: "خطة ليان — خطة اليوم",
  headerSubline: "ليان · {age}",
  updatedEyebrow: "تحدّثت الآن",

  adjustEyebrow: "تعديل اليوم",
  elementBedtime: "موعد النوم",
  elementNap: "القيلولة",
  elementFeed: "آخر رضعة",
  elementRoutine: "بداية الروتين",
  changeAria: "من {from} إلى {to}",
  reasonLabel: "لماذا",
  rejectCta: "غير موافق",
  rejectAria: "غير موافق على تعديل {element} من {from} إلى {to}",
  rejectedNotice:
    "تم — أعدنا {element} إلى {time}. لن نقترح التعديل نفسه قبل ثلاثة أيام.",
  revertNote: "الرفض بيانات: الخطة تتعلم من اعتراضك وتسجّله.",

  pillarsTitle: "وبقيت الركائز كما هي",
  pillarsBody:
    "تغيير واحد في اليوم فقط. الروتين وفصل التغذية عن النوم والاستجابة الهادئة كما اعتمدتِها أمس.",
  pillarRoutine: "روتين ثابت من 4 خطوات",
  pillarFeed: "فصل التغذية عن النوم",
  pillarResponse: "استجابة هادئة عند الاستيقاظ",

  earlyWarningTitle: "إنذار مبكر",
  earlyWarningBody:
    "مرصود: نمط قيلولة متقلب منذ يومين — قد يكون انحداراً صغيراً قادماً؛ جعلنا خطة اليوم أكثر تحفظاً وجهّزنا دليلاً من 4 دقائق إن تأكد الشك غداً.",
  earlyWarningHint: "المكتبة ودليل النجاة يصلان في يومهما — حتى حينها نبقى على الخطة.",

  holdTitle: "لا تعديل اليوم — تثبيت",
  holdBody:
    "ثلاث ليالٍ متدهورة على التوالي: القاعدة عند الانحدار تثبيت كامل وإنزال التوقعات. لا نجدّد جرعات التغيير أثناء الأزمة.",
  holdTone: "لا نطارد تحسناً في ليلة صعبة. خطة الأمس كما هي، والأمان أولاً.",

  cautiousTitle: "نمط متقلب — خطة اليوم أكثر تحفظاً",
  cautiousBody:
    "ليلتان تقلب فيهما النمط صعوداً وهبوطاً: لا نعدّل على إشارة غير مستقرة. الخطة كما هي، وجهّزنا الإنذار المبكر أعلاه.",

  rejectedHoldTitle: "لا تعديل اليوم — احتراماً لاعتراضك",
  rejectedHoldBody:
    "رفضت هذا التعديل منذ أقل من ثلاثة أيام، ولن نقترحه قبل أن تمرّ ثلاثة أيام كاملة. خطة الأمس كما هي، ونعود للسؤال بعدها.",

  floorTitle: "وصلنا إلى أبكر موعد آمن لعمر ليان",
  floorBody:
    "الخطة الآن عند أول نافذة العمر: لا تقديم إضافي اليوم. نثبّت الموعد حتى يستقر النمط، ثم نعيد النظر.",

  steadyTitle: "ليالٍ مستقرة — لا تغيير",
  steadyBody: "لا نمط واضح يستدعي تعديلاً. نُبقي الخطة كما هي ونسجّل غداً.",

  insufficientTitle: "نحتاج ثلاث ليالٍ قبل أي قرار",
  insufficientBody:
    "لا قرار من ليلة واحدة. سجّلي ليلتين أخريين، ونقترح أول تعديل حين يتضح النمط.",

  emergencyTitle: "وضع الطوارئ — تثبيت",
  emergencyBody: "ثبّتنا توقيتات اليوم كما هي — الأمان أولاً",
  emergencyNote:
    "لا تعديلات اليوم، ولا مطاردة. أنزلنا التوقعات إلى معايير أسبوع سابق، وكل التوقيتات كما اعتمدتِها.",
  survivalLink: "دليل النجاة — يكتمل قريباً",
  survivalHint: "يفتح من الشاشة 09 بعد يومين.",

  ackCta: "شاهدت خطة اليوم — على الروتين مساءً",
  ackNotice: "تم — نراك على الروتين مساءً. بعدها يصمت التطبيق حتى الصباح.",

  historyToggle: "سجل التعديلات السابقة",
  historyTitle: "سجل التعديلات",
  historyEmpty: "لا تعديلات محفوظة بعد — أولها يظهر مع أول نمط ثلاث ليالٍ.",
  historyToday: "اليوم",
  historyOlder: "الأقدم",
  historyNewer: "الأحدث",
  historyPage: "صفحة {page} من {total}",
  historyClose: "إغلاق السجل",
  statusApplied: "مطبّق",
  statusRejected: "مرفوض",
  statusPending: "بانتظار ردك",

  devTitle: "أدوات التطوير — لا تظهر للمستخدم",
  devImproving: "3 ليالٍ تتحسن",
  devDeteriorating: "3 ليالٍ تتدهور",
  devVolatile: "3 ليالٍ متقلبة",
  devReset: "مسح الليالي والسجل",
  devSeeded: "تم — أُعيد ضبط الليالي والسجل",
  devDayForward: "يوم الاختبار +{days}",
  devDayReset: "العودة إلى اليوم",
} as const;

type AdjustmentsKeys = keyof typeof adjustmentsAr;

export const ADJUSTMENTS: Record<Lang, Record<AdjustmentsKeys, string>> = {
  ar: adjustmentsAr,
  en: {
    docTitle: "Today's adjusted plan",
    headerTitle: "Layan's plan — today",
    headerSubline: "Layan · {age}",
    updatedEyebrow: "Updated just now",

    adjustEyebrow: "Today's adjustment",
    elementBedtime: "Bedtime",
    elementNap: "Nap",
    elementFeed: "Last feed",
    elementRoutine: "Routine start",
    changeAria: "From {from} to {to}",
    reasonLabel: "Why",
    rejectCta: "I don't agree",
    rejectAria: "Disagree with the {element} change from {from} to {to}",
    rejectedNotice:
      "Done — {element} is back at {time}. We won't suggest the same change for three days.",
    revertNote: "A rejection is data: the plan learns from your objection and records it.",

    pillarsTitle: "The foundations stay as they were",
    pillarsBody:
      "One change a day, only. The routine, feeding separated from sleep, and the calm response stay exactly as you set them yesterday.",
    pillarRoutine: "A steady 4-step routine",
    pillarFeed: "Feeding kept apart from sleep",
    pillarResponse: "A calm response to wake-ups",

    earlyWarningTitle: "Early warning",
    earlyWarningBody:
      "Spotted: a swinging nap pattern for two days — a small regression may be coming; we kept today's plan more conservative and prepared a 4-minute guide in case the doubt is confirmed tomorrow.",
    earlyWarningHint: "The library and the survival guide arrive on their day — until then we stay on plan.",

    holdTitle: "No adjustment today — holding",
    holdBody:
      "Three deteriorating nights in a row: the rule at a regression is a full hold and lowered expectations. We don't add new change during a crisis.",
    holdTone: "We don't chase progress on a hard night. Yesterday's plan stays as it is — safety first.",

    cautiousTitle: "A swinging pattern — today's plan stays conservative",
    cautiousBody:
      "Two nights with the pattern swinging up and down: we don't move on an unstable signal. The plan stays as it is, and the early warning above is ready.",

    rejectedHoldTitle: "No adjustment today — honoring your objection",
    rejectedHoldBody:
      "You rejected this change less than three days ago, so we won't suggest it again until three full days pass. Yesterday's plan stays as it is, and we ask again after that.",

    floorTitle: "We've reached the earliest safe bedtime for Layan's age",
    floorBody:
      "The plan now sits at the first edge of the age window: no further move today. We hold the time until the pattern settles, then look again.",

    steadyTitle: "Steady nights — no change",
    steadyBody: "No pattern clear enough to act on. We keep the plan as it is and log again tomorrow.",

    insufficientTitle: "Three nights before any decision",
    insufficientBody:
      "No decision from one night. Log two more nights, and the first adjustment comes when the pattern is clear.",

    emergencyTitle: "Emergency mode — holding",
    emergencyBody: "Today's timings are fixed exactly as they are — safety first",
    emergencyNote:
      "No adjustments today, and no chasing. Expectations are lowered to a previous week's standard, and every timing stays as you set it.",
    survivalLink: "Survival guide — coming soon",
    survivalHint: "It opens from screen 09 in two days.",

    ackCta: "I've seen today's plan — on the routine tonight",
    ackNotice: "Done — see you at the routine tonight. After that the app stays quiet until morning.",

    historyToggle: "Earlier adjustments",
    historyTitle: "Adjustment history",
    historyEmpty: "No adjustments saved yet — the first appears with the first three-night pattern.",
    historyToday: "Today",
    historyOlder: "Older",
    historyNewer: "Newer",
    historyPage: "Page {page} of {total}",
    historyClose: "Close history",
    statusApplied: "Applied",
    statusRejected: "Rejected",
    statusPending: "Awaiting you",

    devTitle: "Development tools — never shown to users",
    devImproving: "3 improving nights",
    devDeteriorating: "3 deteriorating nights",
    devVolatile: "3 swinging nights",
    devReset: "Clear nights and history",
    devSeeded: "Done — nights and history reset",
    devDayForward: "Test day +{days}",
    devDayReset: "Back to today",
  },
};

// قوالب أسباب التعديل: [ماذا تغيّر] — [الملاحظة] — [المرجو].
// القيم من reasonParams، فلا نص صلب في المحرك ولا في المكوّن.
const adjustmentReasonsAr: Record<AdjustmentReasonCode, string> = {
  "bedtime-earlier":
    "قدّمناه {minutes} دقائق — {nights} ليالٍ متتالية نامت فيها أبكر، واستيقاظها نزل من {wakesFrom} إلى {wakesTo} — نثبّت التقدّم بخطوة صغيرة ونرى النتيجة غداً.",
};

const adjustmentReasonsEn: Record<AdjustmentReasonCode, string> = {
  "bedtime-earlier":
    "We moved it {minutes} minutes earlier — {nights} nights in a row of earlier sleep, with wake-ups down from {wakesFrom} to {wakesTo} — one small step to hold the progress, and we'll see tomorrow.",
};

/** يصوغ سبب تعديل بلغة الواجهة — الجملة الواحدة التي تراها الأم. */
export function formatAdjustmentReason(
  lang: Lang,
  adjustment: Adjustment,
): string {
  const templates = lang === "ar" ? adjustmentReasonsAr : adjustmentReasonsEn;
  return fillText(templates[adjustment.reason], {
    ...adjustment.reasonParams,
    from: adjustment.from,
    to: adjustment.to,
  });
}
