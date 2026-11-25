/*
  ⚠️ قيم أولية — تعاير قبل الإطلاق مقابل مصدر موثق واحد على الأقل.
  ------------------------------------------------------------------
  هذا الجدول هو المرجع الوحيد لمواعيد الشاشة 03، لكن أرقامه ليست
  توصيات طبية نهائية. القيم الحالية مأخوذة من نطاقات نوافذ اليقظة
  الشائعة في أدبيات استشارات نوم الرضّع (4–18 شهراً)، وتُعايَر قبل
  الإطلاق مقابل مصدر موثق واحد على الأقل (نوافذ اليقظة، نطاقات النوم
  الليلي، ومواعيد النوم). البند مسجل في قائمة ما قبل الإطلاق داخل
  docs/ai-log/2026-11-25.md.

  القاعدة: أي تعديل في المحرك لا يخرج عن حدود النافذة العمرية هنا.
*/

export interface AgeRules {
  monthsFrom: number;
  monthsTo: number;
  wakeWindowMorning: [number, number]; // بالساعات — نطاق
  wakeWindowAfternoon: [number, number];
  bedtimeRange: [string, string]; // HH:mm — نطاق موعد النوم
  nightSleepExpected: [number, number]; // ساعات متوقعة
  maxAwakeBeforeBed: number; // أقصى يقظة قبل النوم
  regressionWindows: number[]; // أشهر الانحدار الشائعة
}

// الصفوف متتابعة بلا فجوات من 4 إلى 18 شهراً.
// القيم الاحتياطية خارج النطاق: أقرب صف (الأول لمن دون 4، والأخير لمن فوق 18).
export const AGE_RULES: readonly AgeRules[] = [
  {
    monthsFrom: 4,
    monthsTo: 5,
    wakeWindowMorning: [1.75, 2.25],
    wakeWindowAfternoon: [2, 2.5],
    bedtimeRange: ["18:30", "20:00"],
    nightSleepExpected: [10, 11],
    maxAwakeBeforeBed: 2.5,
    regressionWindows: [4, 6, 8, 9, 10, 12, 18],
  },
  {
    monthsFrom: 6,
    monthsTo: 7,
    wakeWindowMorning: [2, 2.5],
    wakeWindowAfternoon: [2.25, 2.75],
    bedtimeRange: ["18:30", "20:00"],
    nightSleepExpected: [10, 11],
    maxAwakeBeforeBed: 2.75,
    regressionWindows: [6, 8, 9, 10, 12, 18],
  },
  {
    monthsFrom: 8,
    monthsTo: 9,
    wakeWindowMorning: [2.5, 3],
    wakeWindowAfternoon: [2.75, 3.25],
    bedtimeRange: ["18:30", "20:00"],
    nightSleepExpected: [10, 11.5],
    maxAwakeBeforeBed: 3.25,
    regressionWindows: [8, 9, 10, 12, 18],
  },
  {
    monthsFrom: 10,
    monthsTo: 12,
    wakeWindowMorning: [3, 3.5],
    wakeWindowAfternoon: [3.25, 4],
    bedtimeRange: ["18:30", "20:00"],
    nightSleepExpected: [10, 12],
    maxAwakeBeforeBed: 4,
    regressionWindows: [10, 12, 18],
  },
  {
    monthsFrom: 13,
    monthsTo: 15,
    wakeWindowMorning: [3.5, 4.5],
    wakeWindowAfternoon: [4, 5],
    bedtimeRange: ["19:00", "20:30"],
    nightSleepExpected: [10, 12],
    maxAwakeBeforeBed: 5,
    regressionWindows: [12, 15, 18],
  },
  {
    monthsFrom: 16,
    monthsTo: 18,
    wakeWindowMorning: [4, 5],
    wakeWindowAfternoon: [4.5, 5.5],
    bedtimeRange: ["19:00", "20:30"],
    nightSleepExpected: [10, 12],
    maxAwakeBeforeBed: 5.5,
    regressionWindows: [18],
  },
];

/** الصف العمري المناسب — يُقرّب لأقرب صف عند الخروج من نطاق 4–18 شهراً. */
export function ageRulesForMonths(months: number): AgeRules {
  if (!Number.isFinite(months)) return AGE_RULES[0];

  const match = AGE_RULES.find(
    (rules) => months >= rules.monthsFrom && months <= rules.monthsTo,
  );
  if (match) return match;

  return months < AGE_RULES[0].monthsFrom
    ? AGE_RULES[0]
    : AGE_RULES[AGE_RULES.length - 1];
}

// ---------------------------- أدوات الوقت ----------------------------
// كل الأوقات تُحسب كدقائق من منتصف الليل ثم تُعاد إلى HH:mm.

export function parseClock(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatClock(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const rest = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

/** منتصف نطاق موعد النوم بالدقائق. */
export function bedtimeMidpoint(range: [string, string]): number {
  return Math.round((parseClock(range[0]) + parseClock(range[1])) / 2);
}

/** تقريب إلى أقرب مضاعف للخطوة (5 دقائق افتراضاً). */
export function roundToStep(minutes: number, step = 5): number {
  return Math.round(minutes / step) * step;
}

/** حصر وقت داخل نطاق موعد النوم العمري. */
export function clampClock(
  minutes: number,
  range: [string, string],
): number {
  const min = parseClock(range[0]);
  const max = parseClock(range[1]);
  return Math.min(Math.max(minutes, min), max);
}
