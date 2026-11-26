import { formatAge, formatTime } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { FirstPlan } from "@/lib/engine/first-plan";
import type { GrowingProfile } from "@/lib/store/profile";
import { ageInDays, ageParts } from "@/lib/age";
import { hasRedFlag } from "@/lib/engine/safety";
import { survivalGuideForAge } from "@/lib/content/library";

export type AnswerTemplate =
  | "feed-before-bed"
  | "frequent-wakes"
  | "late-routine"
  | "grandma-nap"
  | "tangled-regression"
  | "general";

export interface AnswerContext {
  lang: Lang;
  question: string;
  profile: GrowingProfile;
  plan: FirstPlan;
  adjustmentsCount: number;
  lastSummary?: string;
  today?: Date;
}

export interface BaseAnswer {
  text: string;
  template: AnswerTemplate | "safety";
  suggestedAdjustment?: { from: string; to: string };
  /** الدرس الذي يوسّد به الرد — يفتح في مكتبة النوم. */
  lessonId?: string;
}

function pickTemplate(question: string): AnswerTemplate {
  const value = question.toLocaleLowerCase();
  if (/رضع|رضعة|تأكل|feed|nurs|bottle/.test(value)) return "feed-before-bed";
  if (/40|يتكرر|متكرر|يستيقظ|wake|frequent/.test(value)) return "frequent-wakes";
  if (/متأخر|سهرة|روتين|late|routine/.test(value)) return "late-routine";
  if (/جدة|grandma|جدت/.test(value)) return "grandma-nap";
  if (/انحدار|تراجع|regression|regress/.test(value)) return "tangled-regression";
  return "general";
}

function profileAge(
  profile: GrowingProfile,
  today: Date,
): { exact: string; days: number; months: number } {
  const parts = ageParts(profile.birthDate, today) ?? { months: 0, days: 0 };
  return {
    exact: formatAge("ar", parts.months, parts.days),
    days: ageInDays(profile.birthDate, today) ?? 0,
    months: parts.months,
  };
}

/**
 * الدرس الذي يوسّد به الرد — docs/screens.md § الشاشة 09:
 * «سؤال في الدردشة يوسّد بدرسه». يختار حسب موضوع السؤال وعمر الطفل.
 */
function lessonForTemplate(
  template: AnswerTemplate,
  months: number,
): string | undefined {
  switch (template) {
    case "feed-before-bed":
      return "behavior-bottle";
    case "frequent-wakes":
      return survivalGuideForAge(months).id;
    case "late-routine":
      return "context-dinner";
    case "grandma-nap":
      return "nap-grandma";
    case "tangled-regression":
      return survivalGuideForAge(months).id;
    default:
      return undefined;
  }
}

export function buildBaseAnswer(context: AnswerContext): BaseAnswer {
  const { lang, question, profile, plan, today = new Date() } = context;
  if (hasRedFlag(question)) return { text: "", template: "safety" };

  const age = profileAge(profile, today);
  const ageText = lang === "ar"
    ? `عمر ${age.days} يوماً (${age.exact.replace(" — ضمن نافذة تدريب مثالية", "")})`
    : `${age.days} days old`;
  const feedTime = formatTime(lang, plan.lastFeed);
  const bedTime = formatTime(lang, plan.bedtime);
  const lastPlan = lang === "ar"
    ? `خطة الأمس التي نبني عليها الليلة تفصل آخر رضعة عند ${feedTime} عن السرير عند ${bedTime} بعشرين دقيقة.`
    : `The saved plan from yesterday, which we are carrying into tonight, keeps the last feed at ${feedTime}, twenty minutes before bed at ${bedTime}.`;
  const step = lang === "ar"
    ? `خطوة الليلة: التزمي بموعد ${feedTime}، ثم ضعيها يقظة وهادئة عند ${bedTime}، ولا نحتاج قياساً بعد ذلك.`
    : `Tonight's step: keep ${feedTime}, then place your baby calm and awake at ${bedTime}; no tracking after that.`;
  const pattern = pickTemplate(question);

  if (lang === "en") {
    const opening = `I remember your baby's profile: ${ageText}.`;
    const answers: Record<AnswerTemplate, string> = {
      "feed-before-bed": `${opening} A feed before bed can be part of the routine, but the sleep cue is clearer when feeding ends before the cot. ${lastPlan} ${step}`,
      "frequent-wakes": `${opening} A wake after forty minutes often means the first sleep cycle met the old sleep cue, not that you did anything wrong. Keep the response calm and brief. ${step}`,
      "late-routine": `${opening} A late routine can build overtiredness, especially with a frequent-wake pattern. Move only the planned small step, rather than changing several things at once. ${step}`,
      "grandma-nap": `${opening} A generous nap at grandma's can be lovely and still shift tonight. Protect the evening anchor and return to the familiar four-step routine without a family battle. ${step}`,
      "tangled-regression": `${opening} A tangled regression is a reason to lower expectations, not to add more rules tonight. Keep the timings steady and use the calm response already in the plan. ${step}`,
      general: `${opening} I can answer from the saved profile, tonight's plan, and the adjustment history — not from an open web search. ${lastPlan} ${step}`,
    };
    return { text: answers[pattern], template: pattern, suggestedAdjustment: pattern === "late-routine" ? { from: plan.bedtime, to: plan.bedtime } : undefined, lessonId: lessonForTemplate(pattern, age.months) };
  }

  const opening = `أتذكر ملف طفلك: ${ageText}.`;
  const answers: Record<AnswerTemplate, string> = {
    "feed-before-bed": `${opening} الرضعة قبل النوم ممكنة ضمن الروتين، لكن إشارة النوم تكون أوضح حين تنتهي الرضعة قبل السرير. ${lastPlan} ${step}`,
    "frequent-wakes": `${opening} الصحو بعد أربعين دقيقة غالباً يعني أن أول دورة نوم عادت إلى إشارة النوم القديمة، وليس أنك فعلتِ شيئاً خطأ. اجعلي الاستجابة هادئة وقصيرة. ${step}`,
    "late-routine": `${opening} الروتين المتأخر قد يصنع إرهاقاً زائداً، خصوصاً مع نمط الاستيقاظ المتكرر. نحرّك الخطوة الصغيرة الموجودة في الخطة فقط، لا عدة أشياء معاً. ${step}`,
    "grandma-nap": `${opening} قيلولة طويلة عند الجدة قد تكون جميلة، وقد تؤخر ليلة طفلك في الوقت نفسه. احمي مرساة المساء وعودي إلى خطوات الروتين الأربع بلا حرب عائلية. ${step}`,
    "tangled-regression": `${opening} الانحدار المشتبك سبب لخفض التوقعات، لا لإضافة قواعد أكثر الليلة. ثبّتي التوقيتات واستجيبي بالهدوء الموجود في الخطة. ${step}`,
    general: `${opening} أجيبك من الملف المحفوظ وخطة الليلة وسجل التعديلات — لا من بحث مفتوح. ${lastPlan} ${step}`,
  };
  return { text: answers[pattern], template: pattern, suggestedAdjustment: pattern === "late-routine" ? { from: plan.bedtime, to: plan.bedtime } : undefined, lessonId: lessonForTemplate(pattern, age.months) };
}
