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
  /(?:اتركيها|اتركيه|دعيها|دعيه)\s+(?:تبكي|يبكي)/,
  /طريقة\s+فيربر/,
  // «دعيه يبكي» بالإنجليزية — رقعة 12.4 البند 5.
  /(?:let|leave)\s+(?:them|him|her)\s+(?:to\s+)?cry\b/i,
] as const;

/**
 * حدود الجملة — رقعة 12.4 البند 1: أُضيفت الفاصلة اللاتينية , والفاصلة
 * المنقوطة ; والنقطتان : والشرطة الطويلة — والقصيرة – إلى الحدود السابقة
 * [.؛،!؟\n]. «لا تقلقي — اتركيه يبكي» جملتان لا جملة واحدة.
 */
const CLAUSE_BREAK = /[.؛،,;:—–!?\n]/;

/** تطبيع الفاصلة العليّة ’ و‘ إلى ' قبل كل الفحوص — البند 3. */
function normalizeApostrophes(text: string): string {
  return text.replace(/[’‘]/g, "'");
}

/** بداية الجملة ونهايتها حول مقطع مطابق. */
function clauseBounds(
  text: string,
  start: number,
  end: number,
): [number, number] {
  let clauseStart = 0;
  for (let i = start - 1; i >= 0; i -= 1) {
    if (CLAUSE_BREAK.test(text[i])) {
      clauseStart = i + 1;
      break;
    }
  }
  let clauseEnd = text.length;
  for (let i = end; i < text.length; i += 1) {
    if (CLAUSE_BREAK.test(text[i])) {
      clauseEnd = i;
      break;
    }
  }
  return [clauseStart, clauseEnd];
}

/**
 * النفي داخل الجملة: المطابقة منفية إذا ظهرت أداة نفي أو تحذير في نص
 * الجملة قبلها. بداية الجملة = آخر حدّ من [.؛،!؟\n] قبل المطابقة، أو 0.
 * «خطر/خطير/dangerous» في القائمة لأن جملة «النوم على البطن خطر» تحذير
 * آمن لا نصيحة خطر.
 *
 * قيد مقبول وموثّق: جملة مختلطة نادرة («لا تستجيبي واتركيه يبكي») قد تمرّ،
 * لأن أداة النفي في أول الجملة تغطّي ما بعدها حتى حدّ الجملة التالي.
 * الحارس خط دفاع أخير، والبرومبت يمنع هذه الصياغة أصلًا.
 */
const NEGATION = new RegExp(
  "(?:^|[^\\p{L}])(?:لا|ألا|ألّا|لن|ولا|بلا|بدون|دون|ليس|ليست|ممنوع|" +
    "تفادي|تجنّبي|تجنبي|امتنعي|ابتعدي|خطر|خطير|غير آمن|" +
    "never|avoid|without|don't|doesn't|not|no|n't|dangerous|unsafe|risky)(?![\\p{L}])",
  "iu",
);

/**
 * اختصارات النفي الإنجليزية — رقعة 12.4 البند 3: `n't` ملتصقة بالفعل
 * («shouldn't») لا تمرّ من شرط الحدّ `[^\p{L}]` في NEGATION، فتُفحص وحدها
 * بعد تطبيع الفاصلة العليّة، فتُغطى don't/shouldn't/can't/won't/mustn't.
 */
const CONTRACTION_NEGATION = /\p{L}n['’]t\b/iu;

/**
 * تحذير داخل الجملة نفسها بعد المطابقة — البند 2، ورقعة 12.5 البند 3:
 * أُضيف «ممنوع» و«محظور» و«not recommended» و«غير موصى به».
 */
const DANGER_WARNING =
  /(?:خطر|خطير|غير\s+آمن|ليست\s+آمنة|ليس\s+آمن|ممنوع|محظور|غير\s+موصى\s+به|dangerous|unsafe|risky|not\s+safe|not\s+recommended)/iu;

/** تشكيل عربي اختياري — رقعة 12.5 البند 1 («ليس بخطرٍ»). */
const TASHKEEL = "[\\u064B-\\u0652\\u0670]*";

/**
 * تحذير منفي («ليس خطرًا»، «ليست بخطيرة»، «غير خطر»، «not dangerous»،
 * «isn't dangerous») = تبييض خطر لا إعفاء — رقعة 12.5 البند 1: حرف الباء
 * الاختياري بين ليس/ليست والجذر، وصيغة «غير خطر»، واختصار النفي الإنجليزي.
 */
const NEGATED_WARNING_SOURCE =
  `(?:ليس(?:ت)?\\s*(?:بـ?\\s*)?خط${TASHKEEL}ي?${TASHKEEL}ر${TASHKEEL}\\p{L}*` +
  `|غير\\s+خط${TASHKEEL}ي?${TASHKEEL}ر${TASHKEEL}\\p{L}*` +
  `|(?:not|n['’]t)\\s+dangerous)`;
const NEGATED_WARNING = new RegExp(NEGATED_WARNING_SOURCE, "iu");
const NEGATED_WARNING_ALL = new RegExp(NEGATED_WARNING_SOURCE, "giu");

type WarningVerdict = "none" | "warning" | "masked";

/**
 * فحص ما بعد المطابقة في الجملة نفسها — رقعة 12.4 البند 2: تحذير بعد
 * المطابقة («النوم على البطن خطر») يجعلها تحذيراً آمناً، إلا إذا كان التحذير
 * نفسه منفياً («ليس خطراً»، «not dangerous») فترفض الجملة لأنه تبييض خطر.
 */
function warningAfterMatch(
  text: string,
  matchEnd: number,
  clauseEnd: number,
): WarningVerdict {
  const after = text.slice(matchEnd, clauseEnd);
  if (DANGER_WARNING.test(after.replace(NEGATED_WARNING_ALL, " "))) {
    return "warning";
  }
  if (NEGATED_WARNING.test(after)) return "masked";
  return "none";
}

function isNegatedBefore(
  text: string,
  clauseStart: number,
  matchStart: number,
): boolean {
  // رقعة 12.5 البند 2: عبارات التحذير المنفي («not dangerous»، «ليس بخطر»)
  // تُنزع قبل فحص النفي، لأنها تبييض خطر لا نفيًا عاديًا.
  const before = text
    .slice(clauseStart, matchStart)
    .replace(NEGATED_WARNING_ALL, " ");
  return NEGATION.test(before) || CONTRACTION_NEGATION.test(before);
}

/** فع ل إزالة خطر بعد مطابقة الوسادة — يعفي أنماط الوسائد وحدها (البند 6). */
const REMOVAL_ACTION = /(?:أزيلي|أخرجي|انزعي|remove)/iu;

/** إعفاء وقت البطن أثناء الاستيقاظ — البند 6. الوسائد لا تُعفى أبداً. */
const AWAKE_TUMMY_TIME =
  /(?:tummy[\s-]*time|while\s+awake|وقت\s+البطن|أثناء\s+الاستيقاظ|وهو\s+مستيقظ)/iu;

interface MatchOptions {
  /** جملة وقت البطن أثناء الاستيقاظ تُعفى من أنماط الموضع وحدها. */
  exemptAwakeTummy?: boolean;
  /** فعل إزالة بعد مطابقة الوسادة يعفي أنماط الوسائد وحدها — البند 6. */
  exemptRemovalAfterMatch?: boolean;
}

/** نبحث عن أول مطابقة غير منفية — المطابقة المنفية تُتجاهل ونكمل. */
function hasPositiveMatch(
  text: string,
  patterns: readonly RegExp[],
  options?: MatchOptions,
): boolean {
  for (const pattern of patterns) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const scan = new RegExp(pattern.source, flags);
    let match = scan.exec(text);
    while (match) {
      const matchEnd = match.index + match[0].length;
      const [clauseStart, clauseEnd] = clauseBounds(text, match.index, matchEnd);
      const clause = text.slice(clauseStart, clauseEnd);
      const afterMatch = clause.slice(matchEnd - clauseStart);
      const exempt =
        (options?.exemptAwakeTummy === true && AWAKE_TUMMY_TIME.test(clause)) ||
        (options?.exemptRemovalAfterMatch === true &&
          REMOVAL_ACTION.test(afterMatch));

      if (
        !exempt &&
        !isNegatedBefore(text, clauseStart, match.index) &&
        warningAfterMatch(text, matchEnd, clauseEnd) !== "warning"
      ) {
        return true;
      }

      match = scan.exec(text);
    }
  }
  return false;
}

/**
 * تأخير الاستجابة للبكاء — رقعة 12.4 البند 7 ثم رقعة 12.5 البند 7:
 * الفحص على مستوى الجملة الكاملة بحدود [.؛!؟\n] وحدها (بلا الفاصلة والفاصلة
 * المنقوطة والنقطتين والشرطة)، مع صيغة تاء (تنتظري) وصيغ دقائق الثلاث،
 * وأنماط إنجليزية (wait|leave + minutes) وكلمات البكاء والاستجابة.
 * «انتظري عشرين دقيقة بعد الرضعة» نصيحة سليمة وتمرّ (بلا بكاء).
 */
const SENTENCE_BREAK = /[.؛!؟\n]/;
const WAIT_MINUTES_AR =
  /(?:انتظر|تنتظر)\S*\s+(?:\S+\s+){0,2}?(?:دقائق|دقيق\p{L}*)/u;
const WAIT_MINUTES_EN =
  /\b(?:wait|waits|waited|waiting)\s+(?:\p{L}+\s+){0,2}?minutes?\b/iu;
const LEAVE_MINUTES_EN =
  /\bleave\s+(?:him|them|her)\s+(?:for\s+)?(?:\p{L}+\s+){0,2}?minutes?\b/iu;
const CRY_OR_RESPONSE =
  /(?:بكاء|بكى|تبكي|يبكي|بكيت|الاستجابة|استجابة|\bcries?\b|\bcrying\b|\brespond\b|\bresponse\b)/iu;
const CRY_WAIT_PATTERNS = [
  WAIT_MINUTES_AR,
  WAIT_MINUTES_EN,
  LEAVE_MINUTES_EN,
] as const;

function hasDelayedCryResponse(text: string): boolean {
  return text.split(SENTENCE_BREAK).some((sentence) => {
    if (!CRY_OR_RESPONSE.test(sentence)) return false;
    return CRY_WAIT_PATTERNS.some((pattern) => {
      const flags = pattern.flags.includes("g")
        ? pattern.flags
        : `${pattern.flags}g`;
      const scan = new RegExp(pattern.source, flags);
      let match = scan.exec(sentence);
      while (match) {
        if (!isNegatedBefore(sentence, 0, match.index)) return true;
        match = scan.exec(sentence);
      }
      return false;
    });
  });
}

/** حارس أخير: إن اقترح النموذج منهج بكاء صريحاً نرفض إجابته ونرجع للثابتة. */
export function containsCryTraining(text: string): boolean {
  const normalized = normalizeApostrophes(text);
  if (hasDelayedCryResponse(normalized)) return true;
  return hasPositiveMatch(normalized, CRY_TRAINING_PATTERNS);
}

/**
 * أنماط الأمر الإيجابي وحده — لا أنماط الوجود. نصوص النفي الآمنة
 * («ضعيها على ظهرها، وليس على جانبها، وبلا وسائد») تمرّ من الحارس.
 */
export const UNSAFE_SLEEP_PATTERNS = [
  /(?:ضعيه|ضعيها|ضعي|ضعه|ينام|لينام|نوم|نومه|نومها|ينامه|ينامها|تنامه|تنامها|نوّ?\s*مي(?:ه|ها)|نامي(?:ه|ها))\s+(?:الطفل|طفلك|الرضيع|هو|هي)?\s*(?:على\s+)?(?:جانبه|جنبه|جانبها|بطنه|بطنها|البطن|الجانب)/,
  /(?:place|put|lay|sleep)\S*\s+(?:them|him|her|(?:your|the|my)\s+baby)?\s*(?:on\s+)?(?:their\s+|his\s+|her\s+)?(?:side|stomach|tummy)/i,
  // رقعة 12.5 البند 4: الصيغة الاسمية (stomach|side|tummy) + sleep/sleeping.
  // «back» مستثناة قصداً: «Back sleeping is best» نصيحة آمنة تمرّ دومًا.
  /\b(?:stomach|side|tummy)\s+sleep(?:ing|s)?\b/i,
  /(?:ينام|تنام|نوم|نائمة|نومه|نومها|ينامه|ينامها|تنامه|تنامها)\s+(?:الطفل|طفلك|الرضيع|هو|هي)?\s*(?:على\s+)?(?:جانب\w*|بطن\w*|الجانب|البطن)/,
] as const;

/** أنماط الوسائد — مرفوضة دائماً حتى في جملة وقت البطن (البند 6). */
const UNSAFE_PILLOW_PATTERNS = [
  /(?:مع|بـ|ب)\s*(?:وسادة|وسائد|مخدة)/,
  /\b(?:with|use|add)\s+(?:a\s+)?pillow/i,
  /(?:ضعي|ضع|أعطيه|أعطيها)\s+(?:وسادة|وسائد|مخدة)/,
  /(?:وسادة|وسائد|مخدة)\s+تحت\s+(?:رأسه|رأسها|راسه)/,
  // رقعة 12.5 البند 5: أي لواحق بعد الفعل تصطاد «Putting a pillow».
  /(?:place|put|use|add)\S*\s+(?:a\s+)?(?:small\s+)?pillow/i,
  // رقعة 12.5 البند 5: (rest|sleep|nap|lie) + (on|with) + pillow.
  /(?:rest|sleep|nap|lie)\S*\s+(?:on|with)\s+(?:\p{L}+\s+){0,3}pillow/iu,
] as const;

/**
 * حارس سلامة إضافي: النوم على الجانب أو البطن أو استخدام الوسائد
 * يخالف قواعد النوم الآمن، فنرفض الإجابة كاملة ونرجع للثابتة.
 */
export function containsUnsafeSleepAdvice(text: string): boolean {
  const normalized = normalizeApostrophes(text);
  if (
    hasPositiveMatch(normalized, UNSAFE_PILLOW_PATTERNS, {
      exemptRemovalAfterMatch: true,
    })
  ) {
    return true;
  }
  return hasPositiveMatch(normalized, UNSAFE_SLEEP_PATTERNS, {
    exemptAwakeTummy: true,
  });
}

/** الأصول المسموحة لاستدعاء /api/ask (كانت في route.ts حتى رقعة 12.4). */
export const ALLOWED_ORIGINS = [
  "https://rahamoon.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
] as const;

/**
 * رقعة 12.4 البند 8: Origin يُقبل بمساواة تامة مع أحد الأصول الثلاثة، وReferer
 * (يحمل مساراً كاملاً) يُقبل إن بدأ بأحدها متبوعاً فوراً بـ«/» أو انتهى عنده —
 * فيُسدّ النطاق المتشبه https://rahamoon.vercel.app.evil.com دون كسر مسار الرجوع.
 */
export function isAllowedRequestOrigin(
  origin: string | null,
  referer: string | null,
): boolean {
  const exactOrigin = origin?.trim();
  if (exactOrigin) {
    return (ALLOWED_ORIGINS as readonly string[]).includes(exactOrigin);
  }

  const fromReferer = referer?.trim();
  if (!fromReferer) return false;

  return ALLOWED_ORIGINS.some(
    (allowed) => fromReferer === allowed || fromReferer.startsWith(`${allowed}/`),
  );
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
