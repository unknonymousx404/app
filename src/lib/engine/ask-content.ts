import type { Lang } from "@/lib/i18n";

/**
 * محتوى طبقة «اسألي راحة» — نصوص ثابتة مشتركة بين الخادم والواجهة.
 * لا مفاتيح ولا اتصال شبكي هنا؛ الاستدعاء في src/app/api/ask/route.ts وحده.
 */

export interface AskPlanContext {
  routineStart?: string;
  lastFeed?: string;
  bedtime?: string;
}

export type AskWorstProblem =
  | "frequent-wakes"
  | "late-sleep"
  | "held-sleep"
  | string;

const ARABIC_LETTER = /[\u0600-\u06FF]/;
const LATIN_LETTER = /[A-Za-z]/;

/** لغة الرد تتبع لغة السؤال لا لغة الواجهة — docs/ai-log § ربط Groq. */
export function detectQuestionLang(question: string, uiLang: Lang): Lang {
  if (ARABIC_LETTER.test(question)) return "ar";
  if (LATIN_LETTER.test(question)) return "en";
  return uiLang;
}

export function worstProblemLabel(
  lang: Lang,
  problem: AskWorstProblem,
): string {
  if (lang === "ar") {
    switch (problem) {
      case "frequent-wakes":
        return "الاستيقاظ كل ساعتين تقريباً";
      case "late-sleep":
        return "النوم متأخراً جداً";
      case "held-sleep":
        return "لا ينام إلا في حضنك";
      default:
        return "نمط الليل الذي وصفته";
    }
  }

  switch (problem) {
    case "frequent-wakes":
      return "waking every two hours or so";
    case "late-sleep":
      return "sleeping very late";
    case "held-sleep":
      return "only sleeping in your arms";
    default:
      return "the night pattern you described";
  }
}

function ageMonthsLabel(lang: Lang, ageMonths: number): string {
  const months = Math.max(0, Math.floor(ageMonths));
  if (lang === "ar") {
    if (months === 0) return "أقل من شهر";
    if (months === 1) return "شهر واحد";
    if (months === 2) return "شهرين";
    return `${months} أشهر`;
  }
  if (months === 0) return "under a month";
  if (months === 1) return "1 month";
  return `${months} months`;
}

/** تحويل حتمي إلى الطبيب عند الأعراض الحمراء — لا يمرّ على النموذج. */
export function buildSafetyAnswer(lang: Lang): string {
  return lang === "ar"
    ? "هذا الوصف يحتاج تقييماً طبياً مباشراً. استشيري طبيب الأطفال الآن، ولا تنتظري. إن كانت الأعراض شديدة أو لاحظتِ صعوبة في التنفس، فاتصلي بخدمة الطوارئ المحلية فوراً."
    : "This needs direct medical assessment. Please see your pediatrician now — don't wait. If symptoms are severe or you notice difficulty breathing, contact your local emergency service immediately.";
}

/** أقل من 4 أشهر: تهدئة وأمان نوم فقط، بلا أي تدريب نوم. */
export function buildUnderFourAnswer(lang: Lang, ageMonths: number): string {
  const age = ageMonthsLabel(lang, ageMonths);
  return lang === "ar"
    ? `طفلك في عمر ${age}، وفي هذا العمر لا ندرّب النوم ولا نتركه يبكي. كل ما يحتاجه الآن دفء وحضن، ورضاعة عند الجوع، وغرفة هادئة مظلمة. ضعيه دائماً على ظهره على سطح ثابت، بلا وسائد أو أغطية رخوة، وشاركيه الغرفة. استجيبي لعلاماته بهدوء — هذا الأمان هو ما يبني نومه لاحقاً.`
    : `Your baby is ${age} old, and at this age we don't sleep train or leave a baby to cry. What helps now is warmth and closeness, feeding on hunger cues, and a calm, dark room. Always place your baby on their back on a firm surface, with no pillows or loose bedding, and share the room. Respond to their cues gently — that safety is what builds sleep later.`;
}

/**
 * إجابة ثابتة احتياطية للخادم عند فشل Groq. الواجهة تفضّل عليها
 * buildBaseAnswer لأنه يضم خطة الليلة كاملة، لكن هذه تبقى صالحة وحدها.
 */
export function buildStaticAskAnswer(
  lang: Lang,
  ageMonths: number,
  worstProblem: AskWorstProblem,
  plan?: AskPlanContext,
): string {
  const age = ageMonthsLabel(lang, ageMonths);
  const problem = worstProblemLabel(lang, worstProblem);
  const times = plan?.routineStart && plan.lastFeed && plan.bedtime
    ? lang === "ar"
      ? `خطة الليلة المحفوظة: الروتين يبدأ ${plan.routineStart}، آخر رضعة ${plan.lastFeed}، والسرير ${plan.bedtime}.`
      : `Tonight's saved plan: wind-down starts at ${plan.routineStart}, last feed at ${plan.lastFeed}, and the cot at ${plan.bedtime}.`
    : "";

  if (lang === "ar") {
    return `أنا معك. طفلك في عمر ${age}، وأصعب ما في ليلتكم الآن: ${problem}. نبدأ بخطوة صغيرة واحدة: ثبّتي روتين التهدئة، وافصلي الرضعة عن السرير بعشرين دقيقة، وضعيه في سريره هادئاً لكن مستيقظاً. لا نتركه يبكي، ولا نغيّر أكثر من شيء واحد الليلة. ${times}`.trim();
  }

  return `I'm with you. Your baby is ${age} old, and the hardest part of your night right now is ${problem}. We start with one small step: keep the wind-down routine steady, finish the feed about twenty minutes before bed, and place your baby in the cot calm but awake. No crying it out, and no more than one change tonight. ${times}`.trim();
}

const CRY_TRAINING_PATTERNS = [
  /cry\s*it\s*out/i,
  /controlled\s*crying/i,
  /extinction\s+(method|sleep)/i,
  /ferber\s+method/i,
  /اتركيها\s+تبكي/,
  /اتركيه\s+يبكي/,
  /دعيها\s+تبكي/,
  /دعيه\s+يبكي/,
  /طريقة\s+فيربر/,
] as const;

/** حارس أخير: إن اقترح النموذج منهج بكاء صريحاً نرفض إجابته ونرجع للثابتة. */
export function containsCryTraining(text: string): boolean {
  return CRY_TRAINING_PATTERNS.some((pattern) => pattern.test(text));
}

const UNSAFE_SLEEP_PATTERNS = [
  /على\s+(جانبه|جنبه|جانبها|الجانب|الجانبين)/,
  /على\s+(بطنه|بطنها|البطن)/,
  /وضعية\s+(الجانبين|الجانب|البطن)/,
  /(?:وسادة|وسائد|مخدة)/,
  /on\s+(?:their|his|her|the)\s+(?:side|stomach|tummy)/i,
  /\b(?:side|stomach)\s+sleep(?:ing)?\b/i,
  /\bpillow/i,
] as const;

/**
 * حارس سلامة إضافي: النوم على الجانب أو البطن أو استخدام الوسائد
 * يخالف قواعد النوم الآمن، فنرفض الإجابة كاملة ونرجع للثابتة.
 */
export function containsUnsafeSleepAdvice(text: string): boolean {
  return UNSAFE_SLEEP_PATTERNS.some((pattern) => pattern.test(text));
}

const CLOCK_TIME = /\d{1,2}[:：]\d{2}/g;
const ARABIC_INDIC_DIGITS = /[٠-٩۰-۹]/;

/**
 * لا نسمح للنموذج باختراع وقت رابع خارج أوقات الخطة، ولا بأرقام هندية.
 * أي وقت غير معروف يعني رجوعاً صامتاً للإجابة الثابتة.
 */
export function containsInventedTime(
  text: string,
  plan?: AskPlanContext,
): boolean {
  if (ARABIC_INDIC_DIGITS.test(text)) return true;

  const allowed = new Set(
    [plan?.routineStart, plan?.lastFeed, plan?.bedtime]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.replace("：", ":")),
  );
  const times = text.match(CLOCK_TIME) ?? [];
  return times.some((time) => !allowed.has(time.replace("：", ":")));
}
