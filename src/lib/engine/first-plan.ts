// مولد الخطة الأولى — docs/engine.md §2 و docs/screens.md § الشاشة 03.
// دالة نقية: لا تقرأ وقتاً ولا تخزيناً ولا واجهة. كل المدخلات صريحة.
// النصوص لا تُبنى هنا — تُعاد رموز أسباب + قيم، ويصوغها src/lib/i18n.ts.

import { ageParts } from "@/lib/age";
import {
  bedtimeMidpoint,
  clampClock,
  formatClock,
  roundToStep,
  type AgeRules,
} from "@/lib/engine/age-rules";

export type PlanWorstProblem = "frequent-wakes" | "late-sleep" | "held-sleep";

/** الحقول الأربعة الأولى من الملف النامي — docs/engine.md §1. */
export interface PlanProfile {
  birthDate: string;
  worstProblem: PlanWorstProblem;
  wakePattern: string;
  priorityGoal: string;
}

export type PlanTimelineId = "routine" | "feed" | "bed" | "sleep";
export type PlanPillarId = "timing" | "routine" | "response";

export type PlanReasonCode =
  | "routine"
  | "feed"
  | "bed"
  | "sleep"
  | "pillar-timing"
  | "pillar-routine"
  | "pillar-response-fixed"
  | "pillar-response-random"
  | "pillar-response-early";

/**
 * سبب قابل للعرض عند الضغط على العنصر.
 * الكود يحدد القالب في i18n، والقيم تُملأ فيه — فلا نص صلب خارج i18n.
 */
export interface PlanReason {
  code: PlanReasonCode;
  params: Record<string, string | number>;
}

export interface PlanTimelineItem {
  id: PlanTimelineId;
  time: string; // HH:mm
  reason: PlanReason;
}

export interface PlanPillar {
  id: PlanPillarId;
  minutes: number;
  reason: PlanReason;
}

export interface FirstPlan {
  date: string; // YYYY-MM-DD محلي
  ageMonths: number;
  ageDays: number;
  inputFingerprint: string;
  bedtime: string;
  routineStart: string;
  lastFeed: string;
  expectedSleep: string;
  advanceMinutes: number;
  baselineBedtime: string;
  wakePattern: string;
  timeline: PlanTimelineItem[];
  pillars: PlanPillar[];
}

// مدة الروتين المعتمدة في الشاشة 04: أربع خطوات في 35 دقيقة.
const ROUTINE_MINUTES = 35;
// فصل التغذية عن النوم — docs/screens.md § الشاشة 03.
const FEED_GAP_MINUTES = 20;
// فرصة التهدئة الذاتية قبل اعتبار النوم متوقعاً.
const SELF_SETTLE_MINUTES = 15;
// سقف التقديم في الخطة الأولى — يمنع قفزة أكبر من 25 دقيقة.
const MAX_ADVANCE_MINUTES = 25;
// نقطة الارتكاز المسائية داخل نافذة العمر: منتصف النافذة + 20 دقيقة،
// ثم نتقدم منها 15 دقيقة كأول خطوة. هذا يبقي الخطة داخل النطاق دائماً.
const EVENING_ANCHOR_OFFSET = 20;
const FIRST_ADVANCE_MINUTES = 15;

function extraAdvanceMinutes(profile: PlanProfile): number {
  let extra = 0;

  // النوم المتأخر يحتاج تقديماً إضافياً بسيطاً.
  if (profile.worstProblem === "late-sleep") extra += 5;

  // نمط الاستيقاظ يغيّر نقطة البداية: غير المنتظم والفجري يتقدمان أكثر.
  if (profile.wakePattern === "frequent-random") extra += 5;
  if (profile.wakePattern === "early-riser") extra += 10;

  // هدف «موعد أبكر» يضيف تقديماً إضافياً واحداً.
  if (profile.priorityGoal === "earlier-bedtime") extra += 5;

  return extra;
}

function responseReasonCode(wakePattern: string): PlanReasonCode {
  if (wakePattern === "frequent-random") return "pillar-response-random";
  if (wakePattern === "early-riser") return "pillar-response-early";
  return "pillar-response-fixed";
}

/**
 * يبني خطة الليلة الأولى.
 *
 * @param profile الحقول الأربعة الأولى من الملف النامي
 * @param rules الصف العمري المختار من جدول age-rules
 * @param today تاريخ اليوم — يُستخدم لحساب العمر وتاريخ الخطة
 */
export function buildFirstPlan(
  profile: PlanProfile,
  rules: AgeRules,
  today: Date,
): FirstPlan {
  const age = ageParts(profile.birthDate, today);
  const ageMonths = age?.months ?? 0;
  const ageDays = age?.days ?? 0;

  // نقطة الارتكاز: منتصف نافذة العمر + 20 دقيقة، مقربة لأقرب 5 دقائق.
  const baselineMinutes = roundToStep(
    bedtimeMidpoint(rules.bedtimeRange) + EVENING_ANCHOR_OFFSET,
    5,
  );

  const wantedAdvance = Math.min(
    FIRST_ADVANCE_MINUTES + extraAdvanceMinutes(profile),
    MAX_ADVANCE_MINUTES,
  );

  const bedtimeMinutes = clampClock(
    baselineMinutes - wantedAdvance,
    rules.bedtimeRange,
  );
  const advanceMinutes = baselineMinutes - bedtimeMinutes;

  const routineMinutes = bedtimeMinutes - ROUTINE_MINUTES;
  const feedMinutes = bedtimeMinutes - FEED_GAP_MINUTES;
  const sleepMinutes = bedtimeMinutes + SELF_SETTLE_MINUTES;

  const routineStart = formatClock(routineMinutes);
  const bedtime = formatClock(bedtimeMinutes);
  const lastFeed = formatClock(feedMinutes);
  const expectedSleep = formatClock(sleepMinutes);
  const baselineBedtime = formatClock(baselineMinutes);

  const wakeMin = rules.wakeWindowAfternoon[0];
  const wakeMax = rules.maxAwakeBeforeBed;
  const [nightMin, nightMax] = rules.nightSleepExpected;

  const timeline: PlanTimelineItem[] = [
    {
      id: "routine",
      time: routineStart,
      reason: {
        code: "routine",
        params: {
          time: routineStart,
          bedtime,
          routineMinutes: ROUTINE_MINUTES,
          wakeMin,
          wakeMax,
          ageMonths,
        },
      },
    },
    {
      id: "feed",
      time: lastFeed,
      reason: {
        code: "feed",
        params: {
          time: lastFeed,
          gap: FEED_GAP_MINUTES,
        },
      },
    },
    {
      id: "bed",
      time: bedtime,
      reason: {
        code: "bed",
        params: {
          time: bedtime,
          settle: SELF_SETTLE_MINUTES,
          problem: profile.worstProblem,
          wakePattern: profile.wakePattern,
        },
      },
    },
    {
      id: "sleep",
      time: expectedSleep,
      reason: {
        code: "sleep",
        params: {
          time: expectedSleep,
          nightMin,
          nightMax,
          ageMonths,
        },
      },
    },
  ];

  const pillars: PlanPillar[] = [
    {
      id: "timing",
      minutes: advanceMinutes,
      reason: {
        code: "pillar-timing",
        params: {
          advance: advanceMinutes,
          from: baselineBedtime,
          to: bedtime,
          goal: profile.priorityGoal,
        },
      },
    },
    {
      id: "routine",
      minutes: ROUTINE_MINUTES,
      reason: {
        code: "pillar-routine",
        params: {
          steps: 4,
          minutes: ROUTINE_MINUTES,
        },
      },
    },
    {
      id: "response",
      minutes: 0,
      reason: {
        code: responseReasonCode(profile.wakePattern),
        params: {
          wakePattern: profile.wakePattern,
        },
      },
    },
  ];

  // بصمة المدخلات: تغيّر أي إجابة أو الصف العمري يعني خطة جديدة.
  const inputFingerprint = [
    profile.birthDate,
    profile.worstProblem,
    profile.wakePattern,
    profile.priorityGoal,
    `${rules.monthsFrom}-${rules.monthsTo}`,
  ].join("|");

  const date = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  return {
    date,
    ageMonths,
    ageDays,
    inputFingerprint,
    bedtime,
    routineStart,
    lastFeed,
    expectedSleep,
    advanceMinutes,
    baselineBedtime,
    wakePattern: profile.wakePattern,
    timeline,
    pillars,
  };
}
