// محرك التكيّف v2 — docs/engine.md §3 و§4، وdocs/screens.md § الشاشة 06.
// دالة نقية: لا تقرأ وقتاً ولا تخزيناً ولا واجهة. المدخلات صريحة كلها،
// والمخرجات تعديلات بحدود التدرج نفسها في كل مرة.
//
// النصوص لا تُبنى هنا: كل تعديل يحمل رمز سبب (`reason`) وقيم (`reasonParams`)
// وتصوغه `formatAdjustmentReason` في src/lib/i18n.ts.

import { formatClock, parseClock, type AgeRules } from "@/lib/engine/age-rules";
import type { FirstPlan } from "@/lib/engine/first-plan";
import {
  daysBetween,
  detectTrend,
  type TrendNight,
  type TrendSignal,
} from "@/lib/engine/trends";

export type AdjustmentElement = "bedtime" | "nap" | "feed" | "routine";
export type AdjustmentStatus = "applied" | "rejected" | "pending";

/** رمز سبب التعديل — القالب في i18n، والقيم في reasonParams. */
export type AdjustmentReasonCode = "bedtime-earlier";

export interface Adjustment {
  id: string;
  element: AdjustmentElement;
  /** HH:mm — القيمة السابقة. */
  from: string;
  /** HH:mm — القيمة المقترحة. */
  to: string;
  /** رمز سبب مستقر — يُصاغ في i18n (قاعدة 2: لا نص صلب خارج i18n). */
  reason: AdjustmentReasonCode;
  reasonParams: Record<string, string | number>;
  status: AdjustmentStatus;
}

/** تعديل محفوظ في السجل — يحمل تاريخ اليوم الذي اقترح فيه (لقاعدة الرفض). */
export interface AdjustmentRecord extends Adjustment {
  date: string; // YYYY-MM-DD محلي
}

// حدود التدرج — ±5 إلى ±15 دقيقة فقط في المرة الواحدة.
export const MIN_STEP_MINUTES = 5;
export const MAX_STEP_MINUTES = 15;
export const DEFAULT_STEP_MINUTES = 10;

// الرفض يمنع تكرار الاقتراح نفسه في الأيام الثلاثة التالية.
// أي: مرفوض اليوم يُعاد اقتراحه في اليوم الرابع لا قبله.
export const REJECTION_BLOCK_DAYS = 3;

export type AdjusterMode =
  | "adjust" // يوجد تعديل اليوم
  | "hold" // تدهور — تثبيت كامل
  | "cautious" // تقلب — خطة أكثر تحفظاً بلا تعديل
  | "floor" // الخطة عند أبكر موعد آمن — لا مساحة لخطوة صالحة
  | "rejected" // رفض سابق يمنع تكرار الاقتراح ثلاثة أيام
  | "steady" // ليالٍ مستقرة أو غير كافية — لا تعديل ولا إنذار
  | "emergency"; // وضع الطوارئ من الشاشة 05 — تثبيت

/** التوقيتات الأربعة التي يعدّلها المحرك. */
export interface AdjusterPlanTimes {
  bedtime: string;
  routineStart: string;
  lastFeed: string;
  expectedSleep: string;
}

export interface AdjusterInput {
  /** تاريخ اليوم المحلي YYYY-MM-DD. */
  today: string;
  /** سجل الليالي كاملاً. */
  nights: TrendNight[];
  /** خطة الأمس (قبل تعديل اليوم). */
  plan: AdjusterPlanTimes;
  /** الصف العمري الموثق لعمر الطفل. */
  rules: AgeRules;
  /** سجل التعديلات والرفوض السابق. */
  history: AdjustmentRecord[];
  /** هل فُعّل وضع الطوارئ في تسجيل اليوم؟ */
  emergency: boolean;
}

export interface AdjusterResult {
  mode: AdjusterMode;
  trend: TrendSignal;
  /** تعديلات اليوم — فارغة عند التثبيت أو الانتظار. */
  adjustments: Adjustment[];
}

/**
 * هل يمنع رفض سابق اقتراح هذا التعديل؟
 *
 * المطابقة على (العنصر + من + إلى): بعد الرفض تعود الخطة إلى قيمتها السابقة،
 * فيكون الاقتراح في الغد بنفس الثنائية — وهو ما نمنعه ثلاثة أيام.
 */
export function rejectionBlocks(
  history: AdjustmentRecord[],
  candidate: Pick<Adjustment, "element" | "from" | "to">,
  today: string,
): boolean {
  return history.some((record) => {
    if (record.status !== "rejected") return false;
    if (record.element !== candidate.element) return false;
    if (record.from !== candidate.from) return false;
    if (record.to !== candidate.to) return false;

    const age = daysBetween(record.date, today);
    return age > 0 && age <= REJECTION_BLOCK_DAYS;
  });
}

/**
 * يقترح تعديلات اليوم.
 *
 * القواعد المطبقة (docs/engine.md §3):
 * - ثلاث ليالٍ بنفس النمط فقط — لا قرار من ليلة واحدة.
 * - تحسن متصل: تقديم موعد النوم خطوة واحدة 5–15 دقيقة، داخل النافذة العمرية.
 * - تدهور أو تقلب: تثبيت كامل بلا أي تعديل.
 * - طوارئ: تثبيت كامل (docs/engine.md §4).
 * - الرفض يمنع تكرار الاقتراح نفسه ثلاثة أيام.
 */
export function proposeAdjustments(input: AdjusterInput): AdjusterResult {
  const trend = detectTrend(input.nights, input.today);

  if (input.emergency) {
    return { mode: "emergency", trend, adjustments: [] };
  }

  if (trend.kind === "deteriorating") {
    return { mode: "hold", trend, adjustments: [] };
  }

  if (trend.kind === "volatile") {
    return { mode: "cautious", trend, adjustments: [] };
  }

  if (trend.kind !== "improving") {
    // مستقرة أو أقل من ثلاث ليالٍ — لا تعديل، ولا إنذار.
    return { mode: "steady", trend, adjustments: [] };
  }

  // المساحة المتاحة داخل النافذة العمرية قبل موعد النوم الحالي.
  const room =
    parseClock(input.plan.bedtime) - parseClock(input.rules.bedtimeRange[0]);
  const step = Math.min(
    DEFAULT_STEP_MINUTES,
    MAX_STEP_MINUTES,
    Math.floor(room / 5) * 5,
  );

  // لا مساحة كافية لخطوة صالحة → تثبيت بدل اقتراح خارج النافذة.
  if (step < MIN_STEP_MINUTES) {
    return { mode: "floor", trend, adjustments: [] };
  }

  const from = input.plan.bedtime;
  const to = formatClock(parseClock(from) - step);

  const candidate: Adjustment = {
    id: `bedtime-${input.today}`,
    element: "bedtime",
    from,
    to,
    reason: "bedtime-earlier",
    reasonParams: {
      minutes: step,
      nights: trend.window.length,
      wakesFrom: trend.window[0].wakeCount,
      wakesTo: trend.window[trend.window.length - 1].wakeCount,
    },
    status: "pending",
  };

  if (rejectionBlocks(input.history, candidate, input.today)) {
    return { mode: "rejected", trend, adjustments: [] };
  }

  return { mode: "adjust", trend, adjustments: [candidate] };
}

/**
 * يطبّق التعديلات غير المرفوضة على خطة اليوم.
 *
 * - `bedtime`: تُزاح محطات المساء الأربع معاً بالفرق نفسه (الروتين 35 دقيقة،
 *   الرضعة قبل السرير بـ20، والنوم المتوقع بعده بـ15 تبقى كما هي).
 * - `routine` / `feed`: تُزاح المحطة وحدها.
 * - `nap`: لا يوجد في خطة الإصدار الأول مرتكز قيلولة، فتُهمل بأمان.
 */
export function applyAdjustments(
  plan: FirstPlan,
  adjustments: Adjustment[],
): FirstPlan {
  let bedtimeShift = 0;
  let routineShift = 0;
  let feedShift = 0;

  for (const adjustment of adjustments) {
    if (adjustment.status === "rejected") continue;

    const delta = parseClock(adjustment.to) - parseClock(adjustment.from);
    if (delta === 0) continue;

    switch (adjustment.element) {
      case "bedtime":
        bedtimeShift += delta;
        routineShift += delta;
        feedShift += delta;
        break;
      case "routine":
        routineShift += delta;
        break;
      case "feed":
        feedShift += delta;
        break;
      case "nap":
        // لا مرتكز قيلولة في خطة الإصدار الأول.
        break;
    }
  }

  const bedtime = formatClock(parseClock(plan.bedtime) + bedtimeShift);
  const routineStart = formatClock(
    parseClock(plan.routineStart) + routineShift,
  );
  const lastFeed = formatClock(parseClock(plan.lastFeed) + feedShift);
  const expectedSleep = formatClock(
    parseClock(plan.expectedSleep) + bedtimeShift,
  );

  const advanceMinutes = Math.max(
    0,
    parseClock(plan.baselineBedtime) - parseClock(bedtime),
  );

  const times: Record<string, string> = {
    routine: routineStart,
    feed: lastFeed,
    bed: bedtime,
    sleep: expectedSleep,
  };

  return {
    ...plan,
    bedtime,
    routineStart,
    lastFeed,
    expectedSleep,
    advanceMinutes,
    timeline: plan.timeline.map((item) => ({
      ...item,
      time: times[item.id] ?? item.time,
    })),
  };
}
