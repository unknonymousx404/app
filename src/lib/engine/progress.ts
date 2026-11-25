/*
  محرك التقدم — docs/screens.md § الشاشة 08 و docs/engine.md §3
  (قاعدة التوقع الواقعي: «أطول فترة نوم متصل هي المقياس المعروض»).

  دوال نقية بالكامل: لا تقرأ وقتاً ولا تخزيناً ولا واجهة. النصوص تُصاغ في
  i18n، والمقياس الداخلي (الدقائق) لا يُعرض للمستخدم إلا بعد تحويله لساعات.

  «أطول فترة نوم متصل» تقدير معلن لا قياس دقيق: يُشتق من وقت النوم وعدد
  الاستيقاظات (تقسيم ليل النوم على عدد المقاطع، ثم عامل للأطول)، ولا يدّعي
  دقة جهاز قياس — وهو ما يجعل الشاشة متوافقة مع «الصمت الليلي».
*/

// شكل الليلة كما يحتاجه المحرك — يطابق NightRecord في المخزن بنيوياً.
export interface ProgressNight {
  date: string; // YYYY-MM-DD محلي
  sleepTime: string; // HH:mm
  wakeCount: number;
  morningMood: "rested" | "tired" | "hard";
  emergency?: boolean;
}

/** مرجع نهاية الليل — 06:30 صباحاً (تقدير معلن). */
export const MORNING_REFERENCE_MINUTES = 6 * 60 + 30;

/** عامل يرفع متوسط المقطع إلى تقدير «الأطول» (تقدير معلن). */
export const LONGEST_STRETCH_FACTOR = 1.2;

/** تسامح الالتزام بالخطة: فرق النوم عن موعد الخطة (دقائق). */
export const ADHERENCE_TOLERANCE_MINUTES = 45;

/** نافذة الأسبوع — سبعة أيام (الحد الأقصى للرسوم في المنتج كله). */
export const WEEK_DAYS = 7;

/** عتبة الانحدار: فرق النصف ساعة بين متوسطين يُرصد كتراجع. */
const REGRESSION_THRESHOLD_MINUTES = 30;

// ---------------------------- أدوات وقت وتاريخ نقية ----------------------------

function parseClockLocal(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/** يزيح تاريخاً محلياً (YYYY-MM-DD) بعدد أيام — عبر UTC لتفادي انزياح DST. */
export function shiftIsoDate(iso: string, deltaDays: number): string {
  const time = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(time)) return iso;
  const shifted = new Date(time + deltaDays * 86_400_000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/** رقم اليوم في الأسبوع (0=الأحد … 6=السبت) لتاريخ محلي. */
export function weekdayIndex(iso: string): number {
  const time = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(time)) return 0;
  return new Date(time).getUTCDay();
}

/** فرق الأيام بين تاريخين محليين — بالاعتماد على UTC فقط. */
export function daysBetweenIso(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.round((to - from) / 86_400_000);
}

// ---------------------------- الحسابات الأساسية ----------------------------

/**
 * أطول فترة نوم متصل (بالدقائق) — تقدير معلن من وقت النوم وعدد الاستيقاظات.
 * الوقت حتى 06:30، مقسوماً على (عدد الاستيقاظات + 1)، ثم عامل للأطول.
 */
export function longestStretchMinutes(night: ProgressNight): number {
  const sleep = parseClockLocal(night.sleepTime);
  const nightMinutes =
    (((MORNING_REFERENCE_MINUTES - sleep) % 1440) + 1440) % 1440;
  const segments = Math.max(1, night.wakeCount + 1);
  const estimate = (nightMinutes / segments) * LONGEST_STRETCH_FACTOR;
  return Math.min(Math.round(estimate), nightMinutes);
}

/**
 * هل الليلة «ملتزمة بالخطة»؟ مزاج صباحي غير صعب، غير طارئة، ووقت النوم
 * داخل تسامح موعد خطة الأمس (حين يُعرف). الليلة الصعبة ليست يوماً فاشلاً —
 * هي ببساطة لا تُحسب في سلسلة الالتزام.
 */
export function isCommitted(
  night: ProgressNight,
  planBedtime?: string | null,
): boolean {
  if (night.morningMood === "hard") return false;
  if (night.emergency) return false;
  if (!planBedtime) return true;

  const diff = Math.abs(
    parseClockLocal(night.sleepTime) - parseClockLocal(planBedtime),
  );
  const wrapped = Math.min(diff, 1440 - diff);
  return wrapped <= ADHERENCE_TOLERANCE_MINUTES;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

// ---------------------------- أنواع النتيجة ----------------------------

export interface ProgressDay {
  date: string;
  /** أطول نوم متصل بالدقائق — 0 إن لم تُسجَّل الليلة. */
  longestMinutes: number;
  hasRecord: boolean;
  committed: boolean;
  morningMood?: ProgressNight["morningMood"];
}

export type AchievementId =
  | "first-full-night"
  | "first-week"
  | "steady-week"
  | "first-improvement";

export interface Achievement {
  id: AchievementId;
  unlocked: boolean;
  current: number;
  target: number;
  /** 0..1 — للتقدم نحو الإنجاز. */
  ratio: number;
}

export interface ProgressSummary {
  /** آخر سبعة أيام تقويمية تصاعدياً — للرسم ذي الأعمدة السبعة. */
  days: ProgressDay[];
  /** متوسط أطول نوم متصل في آخر سبعة أيام (دقائق) — null إن لا سجل. */
  weekAverageMinutes: number | null;
  /** متوسط الأيام السبعة السابقة — null إن لا سجل. */
  previousAverageMinutes: number | null;
  /** خط الأساس للعرض: السابقة، وإلا أول ثلاث ليالٍ. */
  baselineMinutes: number | null;
  /** هل خط الأساس من الأسبوع السابق فعلاً؟ */
  baselineIsPrevious: boolean;
  /** ليالٍ متتالية تحسّن فيها أطول نوم متصل (تتضمن الفجوات). */
  improvementStreak: number;
  /** أطول سلسلة تحسن مسجّلة — للإنجازات. */
  bestImprovementRun: number;
  /** سلسلة الالتزام الحالية (نهاية السجل). */
  currentStreak: number;
  /** أطول سلسلة التزام مسجّلة. */
  bestStreak: number;
  /** إجمالي الليالي الملتزمة. */
  totalCommitted: number;
  /** رصد انحدار — يقلب النبرة إلى تهدئة. */
  regression: boolean;
  /** هل تحققت أول ليلة كاملة (بلا استيقاظ)؟ */
  hasFullNight: boolean;
  fullNightDate: string | null;
  achievements: Achievement[];
  nextAchievement: Achievement | null;
  /** عدد الليالي المسجّلة الكلي. */
  totalNights: number;
}

// ---------------------------- الحساب الرئيسي ----------------------------

/**
 * يحسب ملخص التقدم من سجل الليالي.
 *
 * @param nights سجل الليالي (أي ترتيب)
 * @param today تاريخ اليوم المحلي YYYY-MM-DD
 * @param planBedtime موعد نوم خطة الأمس HH:mm — لحساب الالتزام (اختياري)
 */
export function computeProgress(
  nights: ProgressNight[],
  today: string,
  planBedtime?: string | null,
): ProgressSummary {
  const sorted = [...nights]
    .filter((night) => night.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const byDate = new Map(sorted.map((night) => [night.date, night]));

  // آخر سبعة أيام تقويمية (الأقدم أولاً) — للرسم ذي الأعمدة السبعة.
  const days: ProgressDay[] = [];
  for (let offset = WEEK_DAYS - 1; offset >= 0; offset -= 1) {
    const iso = shiftIsoDate(today, -offset);
    const record = byDate.get(iso);
    days.push({
      date: iso,
      longestMinutes: record ? longestStretchMinutes(record) : 0,
      hasRecord: Boolean(record),
      committed: record ? isCommitted(record, planBedtime) : false,
      morningMood: record?.morningMood,
    });
  }

  const weekValues = days
    .filter((day) => day.hasRecord)
    .map((day) => day.longestMinutes);
  const weekAverageMinutes = average(weekValues);

  // الأيام السبعة السابقة (اليوم-13 حتى اليوم-7).
  const previousValues: number[] = [];
  for (let offset = 2 * WEEK_DAYS - 1; offset >= WEEK_DAYS; offset -= 1) {
    const record = byDate.get(shiftIsoDate(today, -offset));
    if (record) previousValues.push(longestStretchMinutes(record));
  }
  const previousAverageMinutes = average(previousValues);

  // خط الأساس: الأسبوع السابق إن وُجد، وإلا متوسط أول ثلاث ليالٍ.
  const firstThree = sorted.slice(0, 3).map(longestStretchMinutes);
  const earlyAverage = average(firstThree);
  const baselineIsPrevious = previousAverageMinutes !== null;
  const baselineMinutes = baselineIsPrevious
    ? previousAverageMinutes
    : earlyAverage;

  // سلاسل التحسن: ليالٍ متتالية (بلا فجوة تقويمية) يزيد فيها أطول نوم.
  let improvementStreak = 0;
  let bestImprovementRun = 0;
  let run = 0;
  for (let index = 1; index < sorted.length; index += 1) {
    const prev = sorted[index - 1];
    const curr = sorted[index];
    const adjacent = daysBetweenIso(prev.date, curr.date) === 1;
    const improved =
      longestStretchMinutes(curr) > longestStretchMinutes(prev);

    if (adjacent && improved) {
      run += 1;
      bestImprovementRun = Math.max(bestImprovementRun, run);
    } else {
      run = 0;
    }
  }
  improvementStreak = run;

  // سلاسل الالتزام.
  let currentStreak = 0;
  let bestStreak = 0;
  let streakRun = 0;
  let totalCommitted = 0;
  for (let index = 0; index < sorted.length; index += 1) {
    const night = sorted[index];
    const committed = isCommitted(night, planBedtime);
    if (committed) {
      totalCommitted += 1;
      const adjacent =
        index === 0 || daysBetweenIso(sorted[index - 1].date, night.date) === 1;
      streakRun = adjacent ? streakRun + 1 : 1;
      bestStreak = Math.max(bestStreak, streakRun);
    } else {
      streakRun = 0;
    }
  }
  currentStreak = streakRun;

  // أول ليلة كاملة: بلا أي استيقاظ.
  const fullNight = [...sorted]
    .reverse()
    .find((night) => night.wakeCount === 0);
  const hasFullNight = Boolean(fullNight);
  const fullNightDate = fullNight?.date ?? null;

  // رصد الانحدار: تراجع الأسبوع عن سابقتها، أو تراجع الثلث الأخير عن الأول،
  // أو طوارئ في أحدث ليلة.
  const recentThird = average(
    sorted.slice(-3).map(longestStretchMinutes),
  );
  const earlyThird = average(firstThree);
  const lastNight = sorted[sorted.length - 1];
  const regression =
    Boolean(lastNight?.emergency) ||
    (weekAverageMinutes !== null &&
      previousAverageMinutes !== null &&
      weekAverageMinutes <=
        previousAverageMinutes - REGRESSION_THRESHOLD_MINUTES) ||
    (recentThird !== null &&
      earlyThird !== null &&
      recentThird <= earlyThird - REGRESSION_THRESHOLD_MINUTES);

  // الإنجازات.
  const achievements: Achievement[] = [
    {
      id: "first-full-night",
      unlocked: hasFullNight,
      current: hasFullNight ? 1 : 0,
      target: 1,
      ratio: hasFullNight ? 1 : 0,
    },
    {
      id: "first-week",
      unlocked: totalCommitted >= WEEK_DAYS,
      current: Math.min(totalCommitted, WEEK_DAYS),
      target: WEEK_DAYS,
      ratio: Math.min(1, totalCommitted / WEEK_DAYS),
    },
    {
      id: "steady-week",
      unlocked: bestStreak >= WEEK_DAYS,
      current: Math.min(bestStreak, WEEK_DAYS),
      target: WEEK_DAYS,
      ratio: Math.min(1, bestStreak / WEEK_DAYS),
    },
    {
      id: "first-improvement",
      unlocked: bestImprovementRun >= 3,
      current: Math.min(bestImprovementRun, 3),
      target: 3,
      ratio: Math.min(1, bestImprovementRun / 3),
    },
  ];

  const nextAchievement =
    achievements.find((achievement) => !achievement.unlocked) ?? null;

  return {
    days,
    weekAverageMinutes,
    previousAverageMinutes,
    baselineMinutes,
    baselineIsPrevious,
    improvementStreak,
    bestImprovementRun,
    currentStreak,
    bestStreak,
    totalCommitted,
    regression,
    hasFullNight,
    fullNightDate,
    achievements,
    nextAchievement,
    totalNights: sorted.length,
  };
}

/** يحوّل الدقائق إلى ساعات برقم عشري واحد (5 → "5"، 4.5 → "4.5"). */
export function hoursLabel(minutes: number): string {
  const hours = minutes / 60;
  const rounded = Math.round(hours * 10) / 10;
  return Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1);
}