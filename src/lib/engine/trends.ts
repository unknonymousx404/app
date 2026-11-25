// كشف الاتجاه — docs/engine.md §3 (قاعدة الاتجاه).
// دالة نقية: آخر ثلاث ليالٍ فقط، ولا قرار من ليلة واحدة.
// لا نصوص هنا — نُعيد إشارة ورموزاً، ويصوغها src/lib/i18n.ts.

// شكل الليلة كما يحتاجه المحرك — يطابق NightRecord في المخزن بنيوياً.
export interface TrendNight {
  date: string; // YYYY-MM-DD محلي
  sleepTime: string; // HH:mm
  wakeCount: number;
  morningMood: "rested" | "tired" | "hard";
  emergency?: boolean;
}

/** عدد الليالي التي يُبنى عليها القرار — ثلاث ليالٍ بنفس النمط = إشارة. */
export const TREND_WINDOW = 3;

export type TrendKind =
  | "insufficient" // أقل من ثلاث ليالٍ — لا إشارة
  | "steady" // مستقرة بلا نمط واضح
  | "improving" // تحسن متصل
  | "deteriorating" // تدهور متصل
  | "volatile"; // نمط متقلب (صعود وهبوط)

export interface TrendSignal {
  kind: TrendKind;
  /** آخر ثلاث ليالٍ (أو المتاح منها) بترتيب تصاعدي. */
  window: TrendNight[];
  /** تغيّر عدد الاستيقاظات بين أول الليالي وآخرها (سالب = تحسن). */
  deltaWakes: number;
  /** تغيّر وقت النوم بالدقائق بين أول الليالي وآخرها (سالب = أبكر). */
  deltaBedtime: number;
  /** مرشح درس من المكتبة — null حتى تُبنى المكتبة (الشاشة 09). */
  lessonId: string | null;
  /** هل بنيت المكتبة فعلاً؟ يقرأها i18n لاختيار النص الاستباقي. */
  lessonsBuilt: boolean;
  /** هل تستحق إشارة إنذار مبكر ذهبية في الشاشة 06؟ */
  earlyWarning: boolean;
}

// وزن المزاج الصباحي: الليلة المرتاحة أفضل من المتعبة، والمتعبة أفضل من الصعبة.
const MOOD_SCORE: Record<TrendNight["morningMood"], number> = {
  rested: 2,
  tired: 1,
  hard: 0,
};

/**
 * جودة ليلة واحدة برقم واحد: المزاج الصباحي أولاً، ثم عدد الاستيقاظات.
 * المقياس داخلي للمقارنة فقط — لا يُعرض للمستخدم (لا درجات ولا نسب).
 */
function nightQuality(night: TrendNight): number {
  return MOOD_SCORE[night.morningMood] * 2 - night.wakeCount * 0.5;
}

function parseClock(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function emptySignal(kind: TrendKind, window: TrendNight[]): TrendSignal {
  return {
    kind,
    window,
    deltaWakes: 0,
    deltaBedtime: 0,
    lessonId: null,
    lessonsBuilt: false,
    earlyWarning: false,
  };
}

/**
 * يرصد نمط آخر ثلاث ليالٍ حتى تاريخ اليوم.
 *
 * @param nights سجل الليالي كاملاً (أي ترتيب)
 * @param today تاريخ اليوم المحلي YYYY-MM-DD — الليالي بعده تُهمل
 */
export function detectTrend(
  nights: TrendNight[],
  today: string,
): TrendSignal {
  const window = [...nights]
    .filter((night) => night.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-TREND_WINDOW);

  if (window.length < TREND_WINDOW) {
    return emptySignal("insufficient", window);
  }

  const [first, middle, last] = window;
  const q1 = nightQuality(first);
  const q2 = nightQuality(middle);
  const q3 = nightQuality(last);

  const deltaWakes = last.wakeCount - first.wakeCount;
  const deltaBedtime = parseClock(last.sleepTime) - parseClock(first.sleepTime);

  // تحسن متصل: لا تراجع بين ليلة وأخرى + تحسن صافٍ لا يقل عن نصف نقطة.
  const improving = q1 <= q2 && q2 <= q3 && q3 - q1 >= 0.5;
  // تدهور متصل: العكس تماماً.
  const deteriorating = q1 >= q2 && q2 >= q3 && q1 - q3 >= 0.5;

  // تقلب: إشارة الاستيقاظ تنقلب بين الليالي (صعود ثم هبوط أو العكس).
  const wokeMore = middle.wakeCount - first.wakeCount;
  const wokeLessAfter = last.wakeCount - middle.wakeCount;
  const volatile =
    (wokeMore >= 1 && wokeLessAfter <= -1) ||
    (wokeMore <= -1 && wokeLessAfter >= 1);

  let kind: TrendKind = "steady";
  if (improving) kind = "improving";
  else if (deteriorating) kind = "deteriorating";
  else if (volatile) kind = "volatile";

  return {
    kind,
    window,
    deltaWakes,
    deltaBedtime,
    lessonId: null, // المكتبة لم تُبنَ بعد — النص الاستباقي هو البديل.
    lessonsBuilt: false,
    // الإنذار المبكر يظهر على التقلب وحده: التدهور له قالب تثبيت هادئ خاص.
    earlyWarning: kind === "volatile",
  };
}

// ---------------------------- أدوات تواريخ نقية ----------------------------

/** فرق الأيام بين تاريخين محليين (YYYY-MM-DD) — بالاعتماد على UTC فقط. */
export function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.round((to - from) / 86_400_000);
}
