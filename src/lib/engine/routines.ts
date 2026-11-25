/*
  محرك الروتين — docs/screens.md § الشاشة 04:
  «ستة قوالب روتين جاهزة مبنية ثقافياً (الحمام/الرضعة/التلاوة/الأنشودة/
  المسك/الضوء الخافت) يختار المستخدم منها ويحرر الترتيب والتوقيت. تأخير
  خطوة يُعاد حساب ما بعدها تلقائياً في اليوم التالي.»

  دوال نقية بالكامل: لا تقرأ وقتاً ولا تخزيناً ولا واجهة. كل المدخلات
  صريحة. النصوص لا تُبنى هنا — الخطوات تحمل رموزاً ثابتة (step id)，
  ويصوغها src/lib/i18n.ts.

  توقيت الروتين نفسه يأتي من خطة اليوم (routineStart)؛ وهذا الملف يبني
  جدول الخطوات عليه: كل خطوة تأخذ مدتها من سابقتها، وأي تأخير يُزاح ما
  بعده.
*/

import { formatClock, parseClock } from "@/lib/engine/age-rules";

/** الخطوات الست — مبنية ثقافياً كما تطلب المواصفة. */
export type RoutineStepId =
  | "bath" // الحمام
  | "feed" // الرضعة
  | "quran" // التلاوة
  | "song" // الأنشودة
  | "hold" // المسك
  | "dimlight"; // الضوء الخافت

export type RoutineTemplateId =
  | "bath-feed-quran-dim" // الحمام · الرضعة · التلاوة · الضوء الخافت
  | "feed-quran-song-dim" // الرضعة · التلاوة · الأنشودة · الضوء الخافت
  | "bath-feed-song-dim" // الحمام · الرضعة · الأنشودة · الضوء الخافت
  | "full-five" // الروتين الكامل: خمس خطوات
  | "bath-feed-hold-dim" // الحمام · الرضعة · المسك · الضوء الخافت
  | "light-three"; // ثلاث خطوات خفيفة

export interface RoutineStep {
  id: RoutineStepId;
  /** مدة الخطوة بالدقائق. */
  minutes: number;
}

export interface RoutineTemplate {
  id: RoutineTemplateId;
  steps: readonly RoutineStep[];
}

/**
 * القوالب الستة.
 *
 * المجموع 35 دقيقة في كل قالب — وهو المدة المعتمدة في خطّة اليوم
 * («روتين ثابت من 4 خطوات · 35 دقيقة · الترتيب نفسه كل ليلة»).
 * الترتيب هنا هو الافتراضي؛ الأم تستطيع تغييره في الشاشة.
 */
export const ROUTINE_TEMPLATES: readonly RoutineTemplate[] = [
  {
    id: "bath-feed-quran-dim",
    steps: [
      { id: "bath", minutes: 10 },
      { id: "feed", minutes: 10 },
      { id: "quran", minutes: 10 },
      { id: "dimlight", minutes: 5 },
    ],
  },
  {
    id: "feed-quran-song-dim",
    steps: [
      { id: "feed", minutes: 10 },
      { id: "quran", minutes: 10 },
      { id: "song", minutes: 10 },
      { id: "dimlight", minutes: 5 },
    ],
  },
  {
    id: "bath-feed-song-dim",
    steps: [
      { id: "bath", minutes: 10 },
      { id: "feed", minutes: 10 },
      { id: "song", minutes: 10 },
      { id: "dimlight", minutes: 5 },
    ],
  },
  {
    id: "full-five",
    steps: [
      { id: "bath", minutes: 8 },
      { id: "feed", minutes: 8 },
      { id: "quran", minutes: 8 },
      { id: "song", minutes: 6 },
      { id: "dimlight", minutes: 5 },
    ],
  },
  {
    id: "bath-feed-hold-dim",
    steps: [
      { id: "bath", minutes: 10 },
      { id: "feed", minutes: 10 },
      { id: "hold", minutes: 10 },
      { id: "dimlight", minutes: 5 },
    ],
  },
  {
    id: "light-three",
    steps: [
      { id: "feed", minutes: 15 },
      { id: "song", minutes: 15 },
      { id: "dimlight", minutes: 5 },
    ],
  },
];

/** القالب الافتراضي — مطابق لركيزة «روتين ثابت من 4 خطوات» في خطة اليوم. */
export const DEFAULT_TEMPLATE_ID: RoutineTemplateId = "bath-feed-quran-dim";

/** أقصى إزاحة يسمح بها المحرك بسبب التأخير — كي لا ينزلق الروتين طويلاً. */
export const MAX_DELAY_SHIFT_MINUTES = 20;

/** تسجيل تأخير خطوة — يسجّله المحرك ويستخدمه لليوم التالي. */
export interface StepDelay {
  /** YYYY-MM-DD محلي — الليلة التي وقع فيها التأخير. */
  date: string;
  stepId: RoutineStepId;
  minutes: number;
}

export interface ScheduledStep {
  id: RoutineStepId;
  /** الترتيب المعروض (0 = أول خطوة). */
  index: number;
  /** مدة الخطوة بالدقائق. */
  minutes: number;
  /** HH:mm — بداية الخطوة الفعلية بعد أي تأخير. */
  startTime: string;
  /** HH:mm — نهاية الخطوة. */
  endTime: string;
  /** إزاحة البداية عن بداية الروتين بالدقائق. */
  offsetMinutes: number;
}

/** القالب بمعرّفه — يعود للقالب الافتراضي عند معرّف غير معروف. */
export function getTemplate(id: RoutineTemplateId): RoutineTemplate {
  return (
    ROUTINE_TEMPLATES.find((template) => template.id === id) ??
    ROUTINE_TEMPLATES[0]
  );
}

/** الترتيب الافتراضي لقالب — نفس ترتيب خطواته. */
export function defaultOrder(id: RoutineTemplateId): RoutineStepId[] {
  return getTemplate(id).steps.map((step) => step.id);
}

/** مدّة الروتين الكلية بالدقائق. */
export function routineTotalMinutes(template: RoutineTemplate): number {
  return template.steps.reduce((sum, step) => sum + step.minutes, 0);
}

/** مدّة خطوة واحدة داخل القالب. */
export function stepMinutes(
  template: RoutineTemplate,
  stepId: RoutineStepId,
): number {
  return template.steps.find((step) => step.id === stepId)?.minutes ?? 0;
}

/**
 * يبني جدول خطوات الليلة.
 *
 * @param template القالب المختار
 * @param order الترتيب الحالي (يعدّلته الأم بالسحب)
 * @param startClock HH:mm — بداية الروتين (من خطة اليوم)
 * @param delays تأخيرات مسجّلة لهذه الليلة — تُزاح بها الخطوة وما بعدها
 * @param minutesOverride مددّات عدّلتها الأم داخل القالب
 */
export function buildRoutineSchedule(
  template: RoutineTemplate,
  order: readonly RoutineStepId[],
  startClock: string,
  delays: readonly StepDelay[] = [],
  minutesOverride?: Partial<Record<RoutineStepId, number>>,
): ScheduledStep[] {
  const minutesById = new Map(
    template.steps.map((step) => [step.id, step.minutes] as const),
  );

  const start = parseClock(startClock);
  let planned = start;
  let shift = 0;

  const schedule: ScheduledStep[] = [];

  order.forEach((id, index) => {
    const minutes = minutesOverride?.[id] ?? minutesById.get(id) ?? 0;

    // تأخير هذه الخطوة يُزاح ما بعدها من الخطوات — بسقف أقصى.
    for (const delay of delays) {
      if (delay.stepId === id) {
        shift = Math.min(shift + delay.minutes, MAX_DELAY_SHIFT_MINUTES);
      }
    }

    const stepStart = planned + shift;

    schedule.push({
      id,
      index,
      minutes,
      startTime: formatClock(stepStart),
      endTime: formatClock(stepStart + minutes),
      offsetMinutes: stepStart - start,
    });

    planned += minutes;
  });

  return schedule;
}

/**
 * تأخيرات آخر ليلة سجّلت تأخيراً.
 *
 * «تأخير خطوة يُعاد حساب ما بعدها تلقائياً في اليوم التالي» — فيقرأ
 * المحرك هذه التأخيرات فيعيد حساب ما بعدها في جدول الغد. لا تُحسب
 * تأخيرات اليوم نفسه هنا: جدول الليلة يطبّقها مباشرة.
 */
export function delaysFromLatestNight(
  delays: readonly StepDelay[],
  todayIso: string,
): StepDelay[] {
  const past = delays.filter((delay) => delay.date < todayIso);
  if (past.length === 0) return [];

  const latest = past.reduce(
    (max, delay) => (delay.date > max ? delay.date : max),
    past[0].date,
  );

  return past.filter((delay) => delay.date === latest);
}

/** مجموع دقائق التأخير في قائمة — يُعرض في تنويه التأخير. */
export function totalDelayMinutes(delays: readonly StepDelay[]): number {
  return delays.reduce((sum, delay) => sum + delay.minutes, 0);
}

/**
 * ينقل خطوة داخل الترتيب ويعيد الترتيب الجديد.
 * العملية محصورة داخل المصفوفة — لا نص خارجها.
 */
export function moveStep(
  order: readonly RoutineStepId[],
  from: number,
  to: number,
): RoutineStepId[] {
  if (from === to) return [...order];
  if (from < 0 || from >= order.length) return [...order];

  const target = Math.min(Math.max(to, 0), order.length - 1);
  const next = [...order];
  const [moved] = next.splice(from, 1);
  next.splice(target, 0, moved);
  return next;
}
