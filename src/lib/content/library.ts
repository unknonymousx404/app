/*
  مكتبة النوم — docs/screens.md § الشاشة 09:
  «مكتبة علاجية لا تثقيفية: 15 درساً فقط (3–4 دقائق لكل درس)، كل درس مرتبط
  بمشغّل داخل المنتج... كل درس ينتهي بمهمة ليلة مقترحة قابلة للإضافة إلى
  الخطة بنقرة».

  التقسيم حرفياً كما في المواصفة:
  6 انحدارات وأعمار / 3 قيلولة / 3 سلوكيات وارتباطات / 2 للسياق الاجتماعي /
  1 للأب تحديداً.

  كل نص موجود باللغتين معاً داخل العنصر نفسه (ar/en)، فلا يمكن أن يُعرض
  نص بلغة واحدة. نبرة brand.md: أم قريبة، تحتفل بالسلوك، بلا ألفاظ
  مقلقة ولا وعد طبي. ممنوع هنا: «فشل»، «مشكلة طفلك»، المقارنة بأطفال
  آخرين.
*/

export type LessonCategory =
  | "regression" // الانحدارات وأعمار
  | "nap" // القيلولة
  | "behavior" // السلوكيات وارتباطات
  | "context" // السياق الاجتماعي
  | "dad"; // للأب تحديداً

export type LessonArtId =
  | "steps"
  | "moon"
  | "clock"
  | "bowl"
  | "hands"
  | "family"
  | "book"
  | "bed";

/** نصّ بلغتين — لا يُعرض بلغة واحدة أبداً. */
export interface Localized {
  ar: string;
  en: string;
}

export interface Lesson {
  id: string;
  category: LessonCategory;
  /** مدة القراءة — 3 أو 4 دقائق. */
  minutes: 3 | 4;
  /** رسم واحد بسيط لكل درس. */
  art: LessonArtId;
  title: Localized;
  /** جملة وصف من واقعنا الاجتماعي. */
  description: Localized;
  /** نص الدرس — 150–250 كلمة. */
  body: Localized;
  /** مهمة الليل المقترحة — تُضاف إلى الخطة بنقرة. */
  task: Localized;
  /** كلمات البحث (بلغتين) — تُطابَق مع حقل البحث. */
  keywords: string[];
}

/** تختار قيمة اللغة من عنصر ثنائي اللغة. */
export function pick(value: Localized, lang: "ar" | "en"): string {
  return value[lang];
}

/** تطبيع للمقارنة فقط: بلا تشكيل ولا تطويل ولا علامات ترقيم. */
function normalizeForCompare(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[\u061F\u060C.,!?;:—–\-()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * فقرات الدرس كما تُعرض في صفحة الدرس.
 *
 * بعض الدروس تبدأ بجملة الافتتاح نفسها التي تُعرض فوق العنوان
 * (جملة الوصف)، فتتكرّر مرتين متتاليتين. هنا نحذف التكرار — ولا نحذف
 * إلا إذا بقيت فقرة واحدة على الأقل، وإلا بقي النص كما هو.
 */
export function lessonParagraphs(
  lesson: Lesson,
  lang: "ar" | "en",
): string[] {
  const paragraphs = pick(lesson.body, lang)
    .split("\n\n")
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length < 2) return paragraphs;

  const description = normalizeForCompare(pick(lesson.description, lang));
  const opening = normalizeForCompare(paragraphs[0]);

  if (
    description.length > 12 &&
    opening.slice(0, 18) === description.slice(0, 18)
  ) {
    return paragraphs.slice(1);
  }

  return paragraphs;
}

// ---------------------------------------------------------------------------
// الدروس الخمسة عشر
// ---------------------------------------------------------------------------

export const LESSONS: readonly Lesson[] = [
  // ---------------------------- 6 انحدارات وأعمار ----------------------------

  {
    id: "regression-4m",
    category: "regression",
    minutes: 4,
    art: "steps",
    title: {
      ar: "انحدار الشهر الرابع: البدايات الكاذبة",
      en: "The four-month change: false starts",
    },
    description: {
      ar: "البدايات الكاذبة عادت — يستيقظ كل ساعتين بعد أسابيع من النوم المتصل. هذا عمره، لا ثمرة تدريبك.",
      en: "The false starts are back — two-hour wake-ups after weeks of solid sleep. This is his age, not your training.",
    },
    body: {
      ar: "في الشهر الرابع يتغيّر نوم طفلك داخلياً قبل أن يتغيّر ظاهراً. ينتقل من نوم خفيف متّصل إلى دورات نوم قصيرة يفصل بينها انتقالٌ خفيف. ومع كل انتقال يعود وعيه نصف ثانية — وهذا يكفي ليصرخ، لأن الليل صار مظلماً وما زال يظنّ أن الرضعة قريبة.\n\nلهذا يبدو الشهر الرابع كأن كل شيء ينهار فجأة، بينما هو في الحقيقة شيء جديد: النوم صار دورياً كما سيبقى دائماً.\n\nالخطة العملية ثلاث خطوات فقط. الأولى: قدّمي موعد النوم خمس عشرة دقيقة، لأن الاستيقاظ المتكرر في هذا العمر سببه غالباً نومٌ متأخر لا استجابة غير مناسبة. الثانية: ثبّتي الاستجابة. نفس الصوت الهادئ، ونفس اليد على الظهر، ونفس الدقائق الانتظارية — لا حمل ولا هزّ ولا ضوء. الثالثة: لا تضيفي خطوة جديدة هذا الشهر. الروتين ثابت، والتغييرات الصغيرة جدا تتراكم بلا أن تريها.\n\nأعطيه أسبوعين، ثم لاحظي: الاستيقاظ صار أقل عدداً حتى لو بدا أطول. هذا هو التقدّم الحقيقي — ليس أن يظل نائماً، بل أن يهدأ أسرع حين يستيقظ.",
      en: "In the fourth month your baby's sleep changes underneath before it changes on the surface. The light, continuous sleep of early infancy gives way to shorter cycles, and between each one he surfaces for half a second. That is enough to cry, because the room is dark and he still expects a feed to be close.\n\nSo the fourth month can feel like everything has collapsed at once, when in fact something new has arrived: sleep has become cyclical, and it stays that way.\n\nThe plan is three small moves. First, move bedtime fifteen minutes earlier — at this age frequent waking is usually about a late start, not about your response. Second, hold the response still: the same quiet voice, the same hand on his back, the same waiting minutes, no carrying, no rocking, no light. Third, add nothing new this month. The routine stays exactly as it is, because very small changes are the ones that quietly add up.\n\nGive it two weeks, and you will notice the wake-ups are fewer even when they last longer. That is the progress that counts: not that he never surfaces, but that he settles again faster when he does.",
    },
    task: {
      ar: "قدّمي موعد النوم 15 دقيقة الليلة — وثبّتي الاستجابة الهادئة نفسها بلا أي خطوة جديدة.",
      en: "Move bedtime 15 minutes earlier tonight — and keep the same calm response, with nothing new added.",
    },
    keywords: [
      "4 months",
      "four month",
      "regression",
      "false start",
      "شهر الرابع",
      "انحدار",
      "بدايات",
      "استيقاظ",
    ],
  },

  {
    id: "regression-5m",
    category: "regression",
    minutes: 3,
    art: "clock",
    title: {
      ar: "انحدار الشهر الخامس: حين يتغيّر شكل النوم",
      en: "The five-month change: when sleep takes a new shape",
    },
    description: {
      ar: "دورتا النوم صارتا تشبهان نوم الكبار — والنوم المتصل صار مقطعاً لا خطاً.",
      en: "Sleep cycles now look like adult cycles, and the long stretch has become a series of pieces.",
    },
    body: {
      ar: "بين الشهر الرابع والخامس يتبدّل شكل النوم تماماً. حتى الآن كنتِ ترين نوماً واحداً طويلاً يمتد ساعات، أما الآن فالنوم مقطعان أو ثلاثة، كل مقطع بين الأربعين والخمسين دقيقة، وبينها انتقال قصير لا تلاحظينه بالليل.\n\nهذا هو سبب الصحو المتكرر المفاجئ بعد شهور من النوم المتصل. ليس تغيّراً في مجهودك، ولا أثراً لما أكل أو شرب، بل علامة أن نومه نضج.\n\nما يفيد الآن: فهم المقطع بوصفه وحدة. حين تستيقظ بعد أربعين دقيقة، لا تعاودين تشغيل الليلة من أولها — تنكملين من حيث توقفت. إضاءة خافتة جداً، أو همسة واحدة، أو يد على ظهره، ثم الانتظار: هذه هي الاستجابة التي تعلّمه أن الانتقال عادي.\n\nالخطأ الشائع في الشهر الخامس هو الإفراط في التسهيل: أن تحمليه كل مرة يصرخ، خوفاً من الكاء، فتُعلَّم إشارة جديدة بالضبط في عمر تتعلّم فيه إشارات جديدة. الصبر القصير هنا يبني شيئاً يدوم طويلاً.\n\nاجعلي آخر رضعة قبل السرير بشرين دقيقة. حين ينفصل الطعام عن السرير، يصير السرير وحده يعني النوم — وهذا ما يجعل الانتقال بين المقاطع سهلاً.",
      en: "Between the fourth and fifth months the shape of sleep changes completely. Until now you saw one long stretch running for hours; now sleep comes in two or three pieces of forty to fifty minutes each, separated by short transitions you would never notice in the dark.\n\nThis is why the sudden wake-ups arrive after months of long stretches. It is not something you did differently, and it is not about what she ate or drank. It is a sign that her sleep has grown up.\n\nWhat helps now is thinking of the cycle as the unit. When she wakes after forty minutes, you are not restarting the night from the beginning — you are continuing from where it stopped. The dimmest light, one whispered line, a hand on her back, then the waiting: that is the response that teaches her that a transition is normal.\n\nThe common mistake in the fifth month is being too helpful. Carrying her every time she cries, out of fear of tears, teaches a new cue in exactly the age where she is learning cues. Short patience here builds something that lasts.\n\nKeep the last feed twenty minutes before bed. Once food and cot are separated, the cot alone means sleep — and moving between pieces becomes easy.",
    },
    task: {
      ar: "افصلي آخر رضعة عن السرير بـ20 دقيقة الليلة — وثبّتي موعد النوم كما هو.",
      en: "Separate the last feed from the cot by 20 minutes tonight — and keep bedtime where it is.",
    },
    keywords: [
      "5 months",
      "five month",
      "sleep cycle",
      "40 minutes",
      "شهر الخامس",
      "انحدار",
      "دورة نوم",
      "أربعون دقيقة",
    ],
  },

  {
    id: "regression-6m",
    category: "regression",
    minutes: 4,
    art: "moon",
    title: {
      ar: "انحدار الشهر السادس: دليل النجاة",
      en: "The six-month change: a survival guide",
    },
    description: {
      ar: "عادت تستيقظ كل ساعتين فجأة بعد أسابيع هادئة؟ هذا طبيعي ومؤقت — وإليك خطة الأيام الثلاثة حتى تمر.",
      en: "Two-hour wake-ups are back after calm weeks? This is normal and temporary — here is your three-day plan to get through it.",
    },
    body: {
      ar: "عادت تستيقظ كل ساعتين فجأة بعد أسابيع هادئة؟ هذا طبيعي ومؤقت — وهذه خطة الأيام الثلاثة حتى تمرّ.\n\nفي الشهر السادس ينقلب نوم طفلك من الداخل قبل أن ينقلب ظاهراً: ينتقل من نوم خفيف متّصل إلى دورات نوم تشبه دورات الكبار، وميل كل دورة يصير منيراً بوضوح. لو كان نومه هادئاً لأسابيع ثم تجدينه واقفاً بعد ساعتين، فهذا انحدار نوم — وهو أحد أشهر مراحل النمو في هذه السنة، لا نهاية طريق، ولا شيئاً يحتاج تصحيحاً.\n\nاليوم الأول — ثبّتي. لا تقدّمي موعد النوم، ولا تغيّري ترتيب الروتين، ولا تضيفي خطوة جديدة. كرّري الخطوات نفسها بنفس الأوقات: حمام، رضعة، تلاوة، ثم ضوء خافت. في آخر ساعتين قبل النوم ثبّتي الموعد تماماً حتى لو بدا مبكراً. الثبات هنا ليس تضحية — إنه ما يسمح للدماغ أن يعيد ترتيب نفسه.\n\nاليوم الثاني — راقبي الفرق لا الساعة. لا تسألي «كم مرة استيقظ؟»، بل «هل عاد يهدأ في دقيقتين كما كان، أم صار يبتسم في الظلام؟». هذا هو المؤشر. إن كان الصحو أطول لكنه أهدأ، فأنتِ على الطريق الصحيح، حتى لو بدا العدد أكثر.\n\nاليوم الثالث — خطوة واحدة فقط. إن بقيت الليلة هادئة من الاستيقاظ الأول، أعيدي تقديم موعد النوم خمس دقائق فقط. وإن عادت الاستيقاظات كما كانت، ارجعي إلى تثبيت الأمس بلا حرج ولا لوم.\n\nليست هذه ليلتك السيئة. هذا شهرٌ يعيد ترتيب نفسه، وبعده يعود نوم أطول ممّا يوقظ نفسه فيه.",
      en: "Two-hour wake-ups are back after calm weeks? This is normal and temporary — and this is your three-day plan to get through it.\n\nIn the sixth month your baby's sleep turns over from the inside before it turns over on the outside. Light, continuous sleep gives way to cycles that look like adult cycles, and the middle of each cycle becomes sharply clear. If he slept peacefully for weeks and now you find him standing two hours in, that is a sleep change — one of the most common growth stages of this year. It is not a dead end, and there is nothing to correct.\n\nDay one — hold everything still. Do not move bedtime earlier, do not change the order of the routine, do not add a step. Repeat the same steps at the same times: bath, feed, recitation, then dim light. In the last two hours before bed, keep the time exactly as it is even if it looks early. Holding still here is not sacrifice — it is what lets the brain rewire itself.\n\nDay two — watch the difference, not the clock. Instead of asking how many times he woke, ask whether he settles in two minutes the way he used to, or whether he is smiling in the dark. That is the real signal. If the waking lasts longer but settles more easily, you are moving in the right direction, even when the number is higher.\n\nDay three — one small move only. If the night stayed calm from the first waking, move bedtime five minutes earlier. If the wake-ups came back exactly as they were, return to yesterday's hold, with no guilt and no self-reproach.\n\nThis is not your bad night. It is a month rearranging itself, and after it most nights are longer than the ones that wake him.",
    },
    task: {
      ar: "خطة الليلة: ثبّتي الموعد وخطوات الروتين كاملة — بلا تقديم ولا خطوة جديدة حتى الغد.",
      en: "Tonight's plan: keep the time and every step of the routine exactly as they are — no earlier bedtime, nothing new until tomorrow.",
    },
    keywords: [
      "6 months",
      "six month",
      "regression",
      "survival guide",
      "two hour wake",
      "شهر السادس",
      "انحدار",
      "دليل النجاة",
      "كل ساعتين",
    ],
  },

  {
    id: "regression-8m",
    category: "regression",
    minutes: 3,
    art: "steps",
    title: {
      ar: "انحدار الشهر الثامن: حين يتسلّق",
      en: "The eight-month change: when he starts climbing",
    },
    description: {
      ar: "صار ينزلق على بطنه ويسحب نفسه إلى الوقوف — والجسد يتعلّم حركات جديدة فيجدها في الليل.",
      en: "He is sliding on his belly and pulling himself up now — and his body rehearses new movements at night.",
    },
    body: {
      ar: "في الشهر الثامن يتعلّم طفلك أشياء كثيرة في وقت واحد: يجلس بثبات، ينزلق على بطنه، يسحب نفسه على ركبتيه ليقف، وقد يمسك حافة السرير ويرتمي عليه. عامٌ كامل من الحركة — ومن الطبيعي أن يمارسها في السرير حين يستيقظ، فتجدينه واقفاً على ذراعيه يضحك في الظلام.\n\nلهذا يبدو هذا الشهر أشبه بحماس أكثر منه قلق. هو لا يكسر نومه، بل يوزّع انتباهه على مهارة جديدة: أن يجلس، أن يقف، أن يتشبث. وهذه المهارات تحتاج وقتاً أطول في الظلام حيث لا تساعده اليدان.\n\nما يفيد الآن: أن يملأ نهاره بالحركة حتى يتسلّم جسدُه ما يحتاجه في الليل. عشر دقائق من التسلّق أو الزحف على الأرض قبل الروتين بساعة، ثم نومٌ أهدأ في السرير.\n\nخطة الليلة ثلاث خطوات: ثبّتي موعد النوم كما هو تماماً، واتركي القيلولة في موعدها، ولا تضيفي خطوة جديدة. إن وقف في السرير، فدعيه يقف لحظة ثم هدّئيه بيد على ظهره وبنفس الصوت الهادئ كل ليلة. الضحك في الظلام ليس إزعاجاً — إنه صوت طفل يتدرّب. دعيه ينهي التمرين، ثم دعيه ينام.",
      en: "In the eighth month your baby is learning a great many things at once: sitting steadily, sliding on his belly, pulling himself up onto his knees, and gripping the edge of the cot to throw himself over. It is a full year of movement — and it is natural for him to practise it in the cot at night, which is how you find him standing on his arms, laughing in the dark.\n\nThat is why this month feels more like excitement than worry. He is not breaking his sleep; he is splitting his attention between a new skill: sitting, standing, holding on. And those skills take longer in the dark, where hands do not help.\n\nWhat helps now is filling his day with movement so his body gets what it needs at night. Ten minutes of climbing or floor-crawling an hour before the routine, and calmer sleep in the cot.\n\nTonight's three moves: keep bedtime exactly where it is, keep the nap in its own slot, and add nothing new. If he stands in the cot, let him stand for a moment, then settle him with a hand on his back and the same quiet voice you use every night. The laughter in the dark is not a disruption — it is the sound of a baby practising. Let him finish the practice, then let him sleep.",
    },
    task: {
      ar: "امنحيه عشر دقائق من الزحف أو التسلّق قبل الروتين بساعة — وثبّتي موعد النوم بلا أي تغيير.",
      en: "Give him ten minutes of crawling or climbing an hour before the routine — and keep bedtime exactly as it is.",
    },
    keywords: [
      "8 months",
      "eight month",
      "regression",
      "climbing",
      "pulling up",
      "شهر الثامن",
      "انحدار",
      "يتسلق",
      "وقوف",
    ],
  },

  {
    id: "regression-10m",
    category: "regression",
    minutes: 3,
    art: "bowl",
    title: {
      ar: "انحدار الشهر العاشر: حين يزحف",
      en: "The ten-month change: when he crawls",
    },
    description: {
      ar: "الزحف يجرّه من فراشه كل ليلة — والانفصال عن الأم في هذا الشهر يشتدّ.",
      en: "Crawling pulls him out of the cot every night, and separation runs strongest in this month.",
    },
    body: {
      ar: "حين يزحف طفلك، يتغيّر كل شيء في الليل دفعة واحدة. الحركة التي تعلّمها في النهار يجدها جاهزةً حين يستيقظ، فيتسلّق أرجاء السرير ويصرخ — لا لأن شيئاً مؤلماً، بل لأن العالم صار أكبر من أن يبقى في مكان واحد.\n\nوفي الشهر العاشر يشتدّ الانفصال عن الأم. هذا ليس رفضاً لكِ، بل ذاكرة نامية: طفلك صار يعرف أنكِ موجودة حتى حين لا يراكِ، فصار اشتياقكِ شعوراً حقيقياً يُحسّ، وهذا يحتاج وقتاً ليستقرّ.\n\nوتظهر هذه الحاجة في النهار أكثر من الليل: يبحث عنكِ حين يخرج من الغرفة، ويقف عند الباب. لا يعني ذلك أن تُقللي وقتك معه — بل أن تعطيه وقتاً قصيراً ومحدّداً كل ساعة، فيعرف أنكما ستلتقيان.\n\nما يفيد الليلة: أن تمنحيه مهمة جديدة تستهلك ذهنه. دعيه يزحف عشر دقائق على الأرض معكِ، ثم اقرئي له كتاباً واحداً بصوت هادئ. حين يستيقظ في الليل، أعطيه يدكِ وصوتكِ لا اللعب — فاشتياق الأم لا يهدأ بالنوم وحده، بل بوجودها الهادئ.\n\nخطة الليلة: ثبّتي موعد النوم كما هو، ولا تُلغي قيلولة النهار مهما كان اليوم، واظبري على وداع واحد ثابت قبل السرير — نفس الكلمات ونفس الصوت، من الأم أو الأب.",
      en: "Once your baby starts crawling, everything changes at night in one go. The movement he practises by day is ready and waiting when he wakes, so he climbs the sides of the cot and cries — not because anything hurts, but because the world has become too big to stay in one place.\n\nSeparation runs strongest in the tenth month. That is not a rejection of you. It is a growing memory: he now knows you exist even when you are out of sight, so missing you has become a feeling rather than a fact — and feelings need time to settle.\n\nWhat helps tonight is giving him something to occupy his mind. Let him crawl for ten minutes on the floor with you, then read one book aloud in a calm voice. When he wakes at night, give him your hand and your voice, not play — missing his mother is not settled by sleep alone, but by her quiet presence.\n\nTonight's plan: keep bedtime where it is; do not drop the midday nap however the day went; and keep one goodbye constant before the cot — the same words, the same voice, from mum or from dad.",
    },
    task: {
      ar: "دعيه يزحف عشر دقائق معكِ قبل الروتين — واظبري على وداع واحد ثابت كل ليلة.",
      en: "Let him crawl for ten minutes with you before the routine — and keep one constant goodbye every night.",
    },
    keywords: [
      "10 months",
      "ten month",
      "regression",
      "crawling",
      "separation",
      "شهر العاشر",
      "انحدار",
      "زحف",
      "انفصال",
    ],
  },

  {
    id: "regression-12m",
    category: "regression",
    minutes: 3,
    art: "book",
    title: {
      ar: "انحدار الشهر الثاني عشر: حين يتكلّم",
      en: "The twelve-month change: when he starts talking",
    },
    description: {
      ar: "كلمات جديدة كل يوم، ورفعة حادة — والجسد يتعب قبل السرير.",
      en: "New words every day and a sharp refusal — and his body is tired before bed.",
    },
    body: {
      ar: "في الشهر الثاني عشر يتغيّر المشهد من جهة أخرى: الكلمات. تبدأ أصوات لها معنى، ثم فجأة «لا» — وهي كلمة تعني «أنا هنا، وليست لي فيها الكلمة».\n\nومعه يتحرك كثيراً: خطوات متعثرة، وإمساك بالأثاث، وركض بخطوات قصيرة. كل هذا يستهلك من طاقته، فلا ينام مبكراً كما كان. ولهذا ترينه في وقت النوم نشطاً لا متعباً.\n\nوفي الوقت نفسه تبدأ القيلولة الثالثة بالتراجع، لأن جسداً يمشي ويحتاج إلى نوم أقل في النهار. وهنا التناقض: هو متعب أكثر ويحتاج نوماً أقل — والنتيجة سهرٌ في وقت النوم.\n\nخطة الليلة: لا تُلغي القيلولة فجأة. انقلي من ثلاث قيلولات إلى اثنتين بهدوء: ثبّتي قيلولة الصباح، وأخّري قيلولة الظهيرة قليلاً كل ثلاثة أيام حتى تدخل في نافذة ما قبل النوم. ثم ثبّتي موعد النوم ولا تنزليه مع القيلولة — دع قيلولة الصباح هي الرافعة، وموعد النوم هو الثابت.\n\nوإن طلب اللعب قبل النوم، فالجابة ليست أن تمنحيه اللعب، بل أن يسمع ترتيب المساء نفسه في كل مرة: «قيلولة، ثم روتين، ثم حضن».",
      en: "In the twelfth month the scene changes from another direction: words. Sounds that mean something arrive, and then, out of nowhere, 'no' — a word that means 'I am here, and I have a say'.\n\nHe is also moving much more: unsteady steps, holding on to furniture, running in short bursts. All of it draws on his reserves, so he no longer falls asleep as early as he used to. That is why he arrives at bedtime alert rather than tired.\n\nAt the same time the third nap starts to fade, because a body that walks and climbs needs less daytime sleep. Here is the paradox: he is more tired and needs less sleep — and the result is a wired child at bedtime.\n\nTonight's plan: do not drop the third nap in one night. Move gently from three naps to two — keep the morning nap, and shift the early-afternoon nap a little later every three days until it lands inside the late-afternoon window. Then hold bedtime steady and do not let the nap pull it later; let the morning nap do the lifting, and let bedtime be the fixed point.\n\nAnd if he asks for play before sleep, the answer is not to give him play, but to let him hear the same order of the evening every time: nap, then routine, then cuddles.",
    },
    task: {
      ar: "ثبّتي موعد النوم ولا تُلغي القيلولة فجأة — أخرِها 15 دقيقة كل ثلاثة أيام فقط.",
      en: "Keep bedtime fixed and don't drop the nap overnight — shift it 15 minutes later every three days only.",
    },
    keywords: [
      "12 months",
      "twelve month",
      "regression",
      "talking",
      "new words",
      "nap transition",
      "شهر الثاني عشر",
      "انحدار",
      "يتكلم",
      "كلمات",
    ],
  },

  // ------------------------------ 3 قيلولة ------------------------------

  {
    id: "nap-short",
    category: "nap",
    minutes: 3,
    art: "clock",
    title: {
      ar: "القيلولة القصيرة: لماذا تصحو بعد أربعين دقيقة",
      en: "The short nap: why she wakes after forty minutes",
    },
    description: {
      ar: "أربعون دقيقة ثم تصحو كأن شيئاً لم يكن — والقيلولة قصيرة لأن دورتها لم تكتمل.",
      en: "Forty minutes and she is up as if nothing happened — the nap is short because a cycle never finished.",
    },
    body: {
      ar: "أربعون دقيقة ثم تصحو كأن شيئاً لم يكن. هذا التوقيت الغريب الذي تسمعينه من أمهات كثيرات، وهو ليس عطلاً في نومها ولا في راحتك.\n\nالقيلولة مبنية على دورات قصيرة تشبه دورات الليل: كل دورة بين الأربعين والخمسين دقيقة، وبعدها يمرّ دماغها من النوم الخفيف إلى النوم العميق. إن استيقظت في تلك اللحظة بالذات، انتهى نوم اليوم. وإن مرّت بها، بدأت دورة جديدة.\n\nالفرق بين أم تنام قيلولتها وأخرى لا يكمن في طول القيلولة، بل في لحظة الاستيقاظ: الأولى تنتظر حتى تدور الدورة، والثانية تحمل طفلها وترضعه نائماً حتى ينام.\n\nأكثر سبب شائع لقيلولة قصيرة هو الإرهاق: حين يتجاوز الطفل نافذة يقظته، يبدأ الجسم في إفراغ الطاقة بسرعة، ثم يسقط فجأة في نوم عميق يصعب الخروج منه. والسبب الثاني أن القيلولة قصيرة لأن الطفل نائم خفيفاً — وهذا طبيعي أيضاً.\n\nالخطة العملية: تمديد خمس دقائق كل أسبوع لا كل يوم. وحاولي أن تنتهي القيلولة في مرحلة نوم عميق، وهذا يعني أن تبدئي إيقاظها بعد أربعين دقيقة لا قبلها — فالاستيقاظ في منتصف الدورة يتركه في نوم خفيف يُتعبه.\n\nوإذا كان الإرهاق هو السبب، فالحل في وقت القيلولة لا في السرير: أمامه خمس دقائق من اللعب الهادئ أولاً، حتى لا ينام متوتراً.",
      en: "Forty minutes and she is up as if nothing happened. You will hear this timing from many mothers, and it is not a fault in her sleep or in your rest.\n\nA nap is built from short cycles that mirror the cycles of the night: each one runs forty to fifty minutes, and then her brain slides from light sleep into deep sleep. If she wakes at that exact moment, the day's sleep is over. If she passes through it, a new cycle begins.\n\nThe difference between a mother who sleeps through the nap and one who does not is not the length of the nap but the moment she wakes: the first waits for the cycle to turn, the second carries her baby and feeds her back to sleep.\n\nThe most common cause of a short nap is overtiredness. When a baby passes her wake window, the body dumps its energy quickly and then drops into deep sleep that is hard to leave. The second cause is simply a light sleeper, and that is normal too.\n\nThe practical plan: extend the nap by five minutes a week, not a day. And try to end it in deep sleep, which means waking her after forty minutes rather than before, because waking her mid-cycle leaves her in light sleep that tires her out.\n\nAnd if overtiredness is the cause, the answer is at nap time, not at bedtime: give him five minutes of calm play first, so he does not fall asleep agitated.",
    },
    task: {
      ar: "أوقظيها من القيلولة عند الدقيقة 40 لا قبلها — ثم زيدي خمس دقائق أسبوعياً فقط.",
      en: "Wake her at minute 40 of the nap, not before — then add five minutes a week, no more.",
    },
    keywords: [
      "nap",
      "short nap",
      "40 minutes",
      "overtired",
      "قيلولة",
      "قصيرة",
      "أربعين دقيقة",
      "إرهاق",
    ],
  },

  {
    id: "nap-late",
    category: "nap",
    minutes: 3,
    art: "clock",
    title: {
      ar: "قيلولة المساء: متى تُلغى",
      en: "The late nap: when to drop it",
    },
    description: {
      ar: "القيلولة الثالثة تؤخّر النوم أسبوعين — وهذه خطة الانتقال بلا صداع.",
      en: "The third nap pushes bedtime back by two weeks — and here is a gentle way to transition.",
    },
    body: {
      ar: "القيلولة الثالثة تؤخّر النوم أسبوعين. هذه أشهر نقطة يتعثّر فيها الانتقال من ثلاث قيلولات إلى اثنتين، لأن الطفل ما زال يحتاج القيلولة، والطفل الذي يحتاجها ولا يأخذها يسهر.\n\nوملاحظة مهمة: عندما تتأخر القيلولة، يتأخر موعد النوم معها — فيبدو الأمر كأنه «صعوبة في النوم» بينما هو في الحقيقة توقيت قيلولة خاطئ. كثيرات من الأمهات يعانين من هذا دون أن يعرفن سببه.\n\nالمؤشر الحقيقي للنجاح ليس عدد القيلولات، بل أن يهدأ الطفل قبل موعد النوم. إن كان يهدأ قبله بعشر دقائق فأنتِ في المكان الصحيح. وإن كان ما زال نشطاً، فالقيلولة الأخيرة ما زالت في موضعها الصحيح.\n\nالخطة العملية: لا تُلغي القيلولة فجأة. ثبّتي قيلولة الصباح لأنها التي تحمل اليوم كله، ثم أخرِري قيلولة الظهيرة خمس عشرة دقيقة كل ثلاثة أيام — لا كل يوم — حتى تدخل في نافذة ما قبل النوم. ومع كل تقديم، ثبّتي موعد النوم مكانه ولا تدعيه يتبع القيلولة.\n\nوحين تصل القيلولة الأخيرة إلى آخر النهار، لا تقلقي إن لم ينم فيها. عشرون دقيقة من النوم في وقت القيلولة خيرٌ من سهر ساعتين في وقت النوم.\n\nوالبديل الأقوى: إذا كان عمره يقارب سنة، انقلي إلى قيلولتين — الصباح وقيلولة بعد الغداء مباشرة — واحذفي الثالثة بهدوء.",
      en: "The third nap pushes bedtime back by two weeks. It is the hardest point in moving from three naps to two, because the baby still needs sleep, and a baby who needs it and does not get it stays awake.\n\nOne thing worth knowing: when the late nap slides later, bedtime slides with it, so it looks like a problem falling asleep when it is really nap timing. Many mothers struggle with this without knowing the cause.\n\nThe real sign of progress is not the number of naps but whether your baby settles before bedtime. If he calms ten minutes before his bedtime, you are in the right place. If he is still bright and busy, the last nap is simply still in the right slot.\n\nThe practical plan: never drop the nap overnight. Keep the morning nap, because it carries the whole day, and shift the early-afternoon nap fifteen minutes earlier every three days — not every day — until it lands inside the pre-bedtime window. And with every shift, keep bedtime where it is rather than letting it follow the nap down.\n\nWhen the last nap reaches late afternoon, do not worry if he does not sleep in it. Twenty minutes of sleep at nap time is still better than two hours awake at bedtime.\n\nThe stronger option: if he is close to a year, move to two naps — morning and one straight after lunch — and let the third one go quietly.",
    },
    task: {
      ar: "ثبّتي قيلولة الصباح — وأخرِري قيلولة الظهيرة 15 دقيقة كل ثلاثة أيام، وموعد النوم مكانه.",
      en: "Keep the morning nap — and move the afternoon nap 15 minutes earlier every three days, with bedtime fixed.",
    },
    keywords: [
      "nap",
      "late nap",
      "third nap",
      "nap transition",
      "bedtime",
      "قيلولة",
      "المساء",
      "ثالثة",
      "انتقال",
    ],
  },

  {
    id: "nap-grandma",
    category: "nap",
    minutes: 4,
    art: "family",
    title: {
      ar: "قيلولة الجدة: ساعتان أمام السهر العائلي",
      en: "Grandma's nap: two hours before the family evening",
    },
    description: {
      ar: "جدة تُنيمها بحنان ظهراً ساعتين كاملتين؟ كيف تحافظين على ليلتها دون حرب عائلية",
      en: "Grandma puts her down for a full two hours at noon — how to protect her night without a family battle",
    },
    body: {
      ar: "جدة تُنيمها بحنان ظهراً ساعتين كاملتين. مشهد جميل لا تريدين أن تنهيه، ثم النتيجة التي تعرفينها: ليلة متأخرة، وإيقاظ متكرر، ونهار ثقيل في اليوم التالي.\n\nالجدة ليست المشكلة. القيلولة الطويلة في الظهيرة هي ما دفعت النوم إلى ما بعد منتصف الليل، ثم أضافت السهرة ساعة أخرى فوقه. وحين يتأخر النوم ساعة، لا يُختصر — بل يُزاح كل ما بعده، فتصير الاستيقاظات في الثانية فجراً.\n\nالقاعدة العملية: لا تُلغي القيلولة ولا تحاربي الجدة — اعملي على ما بين يديك. إن كانت القيلولة ساعتين، فليكن موعد النوم في تلك الليلة أبكر بخمس وأربعين دقيقة. وإن كانت السهرة نفسها متأخرة، فلا تُلغي القيلولة — اختصرها نصف ساعة فقط.\n\nوهنا الجزء الذي يغفل عنه الجميع: حين يستيقظ طفلك متأخراً، لا تعاقبيها. لا تنقلي الروتين كله إلى اليوم التالي، ولا تغيّري ترتيبه. البنية نفسها هي، والتوقيت وحده هو الذي يتحرك.\n\nوللجدة جملة تُحبّها: «ساعتان منهارة ليست ساعتين مفيدة — ساعة ونصف تغني عن ساعتين». حين تأخذين ثلاثين دقيقة فقط، تتحوّل السهرة من مشكلة إلى تفصيل صغير.",
      en: "Grandma puts her down for a full two hours at noon. A lovely scene you would rather not end, followed by the outcome you already know: a late night, broken sleep, and a heavy morning after.\n\nGrandma is not the problem. The long midday nap is what pushed sleep past midnight, and the family evening added another hour on top of it. And when sleep runs an hour late, it does not get shorter — everything after it shifts, which is why the wake-ups land at two in the morning.\n\nThe practical rule: do not cancel the nap and do not fight grandma — work with what you can control. If the nap was two hours, make that night's bedtime forty-five minutes earlier. If the evening itself ran late, keep the nap and cut it by half an hour only.\n\nAnd here is the part everyone forgets: when she wakes late, do not punish her. Do not move the whole routine to the next day and do not change its order. The structure stays exactly the same; only the timing moves.\n\nA line for grandma that she will actually like: two hours of sleep is not two hours of rest — ninety minutes does the same job. Take thirty minutes off and the evening turns from a problem into a detail.",
    },
    task: {
      ar: "في يوم السهرة، أبرمي موعد نوم أبكر بـ45 دقيقة مع الجدة — بصوت واحد وبكلمة طيبة.",
      en: "On an evening day, agree a bedtime 45 minutes earlier with grandma — one voice, one kind word.",
    },
    keywords: [
      "grandma",
      "nap",
      "family",
      "evening",
      "جدة",
      "قيلولة",
      "سهرة",
      "عائلة",
      "عشاء",
    ],
  },

  // ------------------------ 3 سلوكيات وارتباطات ------------------------

  {
    id: "behavior-rocking",
    category: "behavior",
    minutes: 4,
    art: "hands",
    title: {
      ar: "الحمل ليلاً: كيف تفكّين الارتباط",
      en: "Rocking to sleep: how to loosen the hold",
    },
    description: {
      ar: "كل نومٍ يبدأ في ذراعيْك — وهذه خطة الفكّ التدريجي بلا صراخ ولا ليلة بيضاء.",
      en: "Every sleep begins in your arms — and here is a gradual way to let go, without a single scream.",
    },
    body: {
      ar: "كل نومٍ يبدأ في ذراعيْك. هذه ليست عادة سيئة ولا تربية ناقصة — بل الطريقة الوحيدة التي تعلّمها، وأنتِ الطريق الوحيد الذي يعرفه.\n\nوالارتباط نفسه ليس عدوّه. هو ما جعله ينام بهدوء أول مرة — وسنستخدمه نحن هذه المرة حتى نخفّفه بلطف.\n\nالقاعدة الذهبية: السرير مكان نوم، والحضن مكان راحة. إن كان ينام الآن في ذراعيْك، فليبدأ الروتين نفسه في ذراعيْك — حمام، رضعة، تلاوة — ثم انقلي به إلى السرير وهو ما زال يقظاً قليلاً.\n\nالانتقال يحتاج ثلاث ليالٍ على الأقل، ويكون ناعماً: في الليلة الأولى ضعيه في السرير وأنتِ ما زالتِ تحملينه، ثم أبعدي يدكِ ببطء حتى تلمس الوسادة، واتركيها ثوانيَ قليلة. في الليلة الثانية كرّري، لكن بوسع يدكِ قليلاً. وفي الثالثة لمسة واحدة على الظهر ثم انصرفي.\n\nوالردّ الليلي يتبع القاعدة نفسها: نفس الصوت، ونفس اليد، ونفس الدقائق. لا تسألي «هل نام؟» — اسألي «هل هدأ؟». الهدوء هو الهدف، والنوم يتبعه وحده.\n\nولا تنتظري ليلة كاملة بلا نجاح. إن عاد بعد ساعتين فهذه ليست ليلة ضائعة — هذه ليلة تتعلّم فيها. والغد يبدأ من حيث توقفتِ، لا من الصفر.",
      en: "Every sleep begins in your arms. This is not a bad habit and not a failure of parenting — it is the only way he has learned, and you are the only route he knows.\n\nThe association is not his enemy. It is what made him sleep peacefully the first time — and we are going to use it once more, gently, to loosen it.\n\nThe golden rule: the cot is for sleep, the arms are for comfort. If he falls asleep in your arms now, let the routine begin in your arms too — bath, feed, recitation — and then carry him to the cot while he is still only half awake.\n\nThe shift needs at least three nights, and it needs to be soft. On the first night, place him in the cot with your arms still around him, then slowly slide your hands away until your palms rest on the mattress, and stay there a few seconds. On the second night, repeat it with a slightly wider circle. On the third night, one hand on his back, then walk out.\n\nThe night response follows the same rule: the same voice, the same hand, the same waiting minutes. Do not ask whether he slept — ask whether he settled. Settling is the goal, and sleep follows it on its own.\n\nAnd do not wait for a whole night with no progress. If he comes back at two, that is not a wasted night — it is a night of learning. Tomorrow starts where you stopped, not from zero.",
    },
    task: {
      ar: "ضعيها في السرير وأنتِ ما زلتِ تحملينه — ثم أبعدي يدكِ ببطء حتى تلمس الوسادة.",
      en: "Place her in the cot with your arms still around her — then slide your hands away slowly to the mattress.",
    },
    keywords: [
      "rocking",
      "holding",
      "association",
      "sleep cue",
      "حمل",
      "هز",
      "ارتباط",
      "إشارة نوم",
      "حضن",
    ],
  },

  {
    id: "behavior-bottle",
    category: "behavior",
    minutes: 3,
    art: "bowl",
    title: {
      ar: "الزجاجة في السرير: حين تصير إشارة النوم",
      en: "The bottle in the cot: when it becomes a sleep cue",
    },
    description: {
      ar: "حين تصير الزجاجة شرطاً للنوم — تفكّين الارتباط دون أن يتألم أحد.",
      en: "When the bottle becomes the price of sleep — loosening the link without hurting anyone.",
    },
    body: {
      ar: "الزجاجة في السرير بدأت كوسيلة عملية في الليل، ثم صارت شرطاً: بلا زجاجة لا نوم. والطفل في هذا العمر لا يفرّق بين الأم والرضاعة — الأم هي الرضاعة في نظره.\n\nولهذا حين تسحبين الزجاجة فجأة، لا تكونين أنتِ من يسحب — هو يسحب شيئاً كان يظنّه جزءاً منها. ولذلك تأتي الحدّة مُدركةً كخطر، لا كمخطط.\n\nالقاعدة: لا تُلغي الرضعة الليلية — غيّري مكانها فقط. انقلي الزجاجة من السرير إلى حضنك، وأيقظيها قليلاً لتأخذها، ثم أعِديها بعد أن تثبت. هذا يحوّل الزجاجة من «شرط للنوم» إلى «شيء يحدث ضمن الروتين».\n\nثم المرحلة الثانية: أن تضعيها على الطاولة الجانبية بعد الرضعة لا في يدكِ. حين تنتهي الرضعة تُوضع الزجاجة بعيداً — هكذا يُغلق الاستعمال ويُغلق المشهد.\n\nولا تنتظري أسابيعاً. أسبوعان من النقل البطيء يكفيان عادةً لتظهر النتيجة: نام بلا زجاجة مرتين، ثم ثلاثاً.\n\nأمّا إن كان لا يزال يشرب منها في السرير ويطلبها فور فتح عينيه، فهذه مرحلة أخرى — لا تحاولي تغييرها الليلة. ما يهمّ اليوم خطوة واحدة فقط: أن تكون الزجاجة خارج السرير.",
      en: "The bottle in the cot started as a practical thing at night, and then became a condition: no bottle, no sleep. At this age a baby does not separate you from the milk — you are the milk, as far as he is concerned.\n\nSo when you take the bottle away sharply, you are not the one taking something away: he is losing something he believed was part of you. That is why sudden removal reads as danger rather than as a plan.\n\nThe rule: do not cancel the night feed — change its place. Move the bottle out of the cot and into your arms, wake him enough to take it, and give it back once he has settled. That turns the bottle from a condition for sleep into something that happens inside the routine.\n\nThen the second stage: put it on the side table after the feed instead of in your hand. When the feed ends, the bottle is put down — the use is finished and the scene closes.\n\nDo not wait for weeks. Two weeks of slow moving is usually enough to see it: he slept without the bottle twice, then three times.\n\nAnd if he still drinks in the cot and wants it the moment he opens his eyes, that is a different stage — do not try to change it tonight. What matters today is one step only: the bottle lives outside the cot.",
    },
    task: {
      ar: "انقلي الزجاجة من السرير إلى حضنك الليلة — ثم ضعيها على الطاولة الجانبية بعد الرضعة.",
      en: "Move the bottle out of the cot and into your arms tonight — then put it on the side table after the feed.",
    },
    keywords: [
      "bottle",
      "night feed",
      "association",
      "sleep cue",
      "زجاجة",
      "رضاع ليلي",
      "ارتباط",
      "إشارة نوم",
      "رضاعة",
    ],
  },

  {
    id: "behavior-night-feed",
    category: "behavior",
    minutes: 3,
    art: "moon",
    title: {
      ar: "الاستيقاظ للرضاع: متى يبقى جزءاً من الروتين",
      en: "Waking to feed: when it stays part of the routine",
    },
    description: {
      ar: "استيقظت للرضاع كما في البداية — وهذا طبيعي في هذا العمر، ولا يعني أن الخطة نسيت شيئاً.",
      en: "She woke for a feed like she used to — normal at this age, and no sign the plan forgot anything.",
    },
    body: {
      ar: "استيقظت للرضاع كما في البداية. كثيرة من الأمهات يظننّ أن هذا دليل على أن الخطة لم تنجح أو أن الطفل اعتاد على الرضاعة، والأمران بعيدان عن الواقع.\n\nالرضاع الليلي في هذا العمر طبيعي تماماً. الأطفال في هذه المرحلة يحتاجون سعرات ليلية حقيقية — رضعة ترضي، لا رضعات تهدئة. والفرق بينهما مهم: الرضعة التي ترضي تُقفل نفسها ويُنام بعدها، أما رضعة التهدئة فتفتح باباً جديداً لأن الطفل لم يأكل.\n\nالقاعدة: إيقظيها قليلاً لتأكل، ثم أعِديها للنوم. الرضعة آخر خطوة في الروتين لا استثناء بعده — ولهذا ترينها في المكان نفسه كل ليلة، بينما هو ينام في المكان نفسه كل ليلة.\n\nومتى يجيء وقت تقليم الرضعة؟ حين تنام قبل أن تأكل، أو حين تنام فيها من قبل. وقتها خفّفي الكمية بمقدار صغير كل ليلتين — لا أن تُلغيها دفعة واحدة، فالإلغاء المفاجئ هو ما يجعل الطفل يصرخ.\n\nوحتى ذلك الحين، تذكّري أن الاستيقاظ للرضاع في الشهر السادس جزء طبيعي من الرضاعة في السنة الأولى — وليس شيئاً يحتاج تصحيحاً.",
      en: "She woke for a feed like she used to. Many mothers read that as proof the plan has not worked, or that the baby has got used to the bottle. Both are far from the truth.\n\nNight feeding at this age is completely normal. Babies around six months need real night calories — a feed that satisfies, not a feed that soothes. The difference matters: a satisfying feed closes itself and sleep follows, while a soothing feed opens a new door because the baby has not actually eaten.\n\nThe rule: wake her just enough to eat, then return her to sleep. The feed is the last step of the routine, not an exception after it — which is why it happens in the same place every night while he sleeps in the same place every night.\n\nAnd when is it time to trim it? When she starts falling asleep before the feed, or when she sleeps through it. Then reduce the amount a little every second night — never cancel it in one go, because the sudden removal is what produces the crying.\n\nUntil then, remember that waking for a feed at six months is a normal part of feeding in the baby's first year — not something that needs correcting.",
    },
    task: {
      ar: "أوقظيها قليلاً لتأكل ثم أعِديها للنوم — الرضعة آخر خطوة في الروتين، لا بعدها.",
      en: "Wake her just enough to eat, then return her to sleep — the feed is the last step, not an extra one.",
    },
    keywords: [
      "night feed",
      "feeding",
      "routine",
      "wakes for milk",
      "رضاع ليلي",
      "رضاعة",
      "روتين",
      "يستيقظ للرضاع",
      "حليب",
    ],
  },

  // ------------------------ 2 للسياق الاجتماعي ------------------------

  {
    id: "context-dinner",
    category: "context",
    minutes: 3,
    art: "moon",
    title: {
      ar: "العشاء وبداية الليلة",
      en: "Dinner and where the night begins",
    },
    description: {
      ar: "العشاء العائلي يتأخر أحياناً، والروتين يجب أن يبدأ بعده لا قبله — وهذه ضبطات تجعل العشاء ممكناً.",
      en: "Family dinner sometimes runs late, and the routine has to begin after it, not before — these adjustments make family dinners possible.",
    },
    body: {
      ar: "العشاء العائلي يتأخر أحياناً، والروتين يجب أن يبدأ بعده لا قبله. في بيوت كثيرة هذا التناقض — مائدة العشاء ممتدة، والطفل يحتاج أن ينام — هو ما يُنهك الأم قبل أن يبدأ الليل أصلاً.\n\nالقاعدة الأساسية: بداية الروتين تُحسب من العشاء لا من الساعة. فلو انتهى العشاء في الثامنة، يبدأ الروتين في الثامنة والربع، أو بعد انتهاء المائدة مباشرة إن تأخر العشاء. المعيار واحد: ما بعد العشاء مباشرة.\n\nهذا الترتيب يحلّ نصف المشكلة. النصف الثاني هو إطعام الطفل: امنحيه ما يكفي في وقت العشاء، ثم لا تعطي رضعة أخرى بعده إلا إذا جاع فعلاً — فالرضعة المتأخرة داخل السهرة تؤخّر النوم أكثر من العشاء نفسه.\n\nأمّا حين تأخر العشاء كثيراً، فلا تعاقبي نفسك. اختاري ثلاث خطوات فقط الليلة — رضعة، تلاوة، ضوء خافت — واحذفي الحمام. روتين أقصر في ليلة واحدة خيرٌ من روتين كامل متأخر.\n\nوحين تخرجين من المائدة، لا ترجعي إلى الغرفة فوراً — خذي خمس دقائق لكِ وحدكِ. هذا الوقت لكِ، لا له: دقائق الهدوء قبل بداية الليل تحوّل ما بعدها من تضحية إلى عمل منظّم.",
      en: "Family dinner sometimes runs late, and the routine has to begin after it, not before. In many homes this is the real tension of the evening: a table that stretches, and a baby who needs to sleep. It is what wears a mother out before the night even starts.\n\nThe basic rule: the routine starts from dinner, not from the clock. If dinner ends at eight, the routine begins at a quarter past eight — or straight after the table ends when dinner runs late. The measure is one thing: what comes after the meal.\n\nThat order solves half the problem. The other half is feeding him: give him enough at dinner, and then no extra feed afterwards unless he is genuinely hungry — a late feed inside the evening delays bedtime more than the dinner itself.\n\nAnd when dinner runs properly late, do not punish yourself. Choose three steps tonight — feed, recitation, dim light — and drop the bath. A shorter routine on one night is better than a full one that starts late.\n\nAnd when you leave the table, do not go straight back to the room — take five minutes for yourself first. That time is yours, not his: a little quiet before the night begins turns what follows from sacrifice into organised work.",
    },
    task: {
      ar: "ابدئي الروتين مباشرة بعد العشاء أو بعده بربع ساعة — ولا رضعة بعد العشاء الليلة.",
      en: "Start the routine right after dinner, or fifteen minutes after the table ends — and no extra feed tonight.",
    },
    keywords: [
      "dinner",
      "late dinner",
      "family",
      "cultural",
      "عشاء",
      "عشاء متأخر",
      "مائدة",
      "روتين",
    ],
  },

  {
    id: "context-family",
    category: "context",
    minutes: 3,
    art: "family",
    title: {
      ar: "سهرة العائلة: كيف تخرجين بهدوء",
      en: "The family evening: leaving gently",
    },
    description: {
      ar: "السهرة العائلية ممتعة ومربكة في الوقت نفسه — وكيفية الخروج منها بهدوء بلا حِراج.",
      en: "Family evenings are lovely and complicated at once — and how to leave one without a scene.",
    },
    body: {
      ar: "السهرة العائلية ممتعة ومربكة في الوقت نفسه. الجمال فيها أنها لا تنتهي في وقتها، والصعوبة في أن نوم الطفل لا ينتظر نهاية حديث ما بين الجدة وابنتها.\n\nالمشكلة الحقيقية ليست أن الأم في السهرة، بل أن النهاية غير موعودة. كلما طال السهر، صار الخروج إحراجاً، والإحراج يطيل السهر.\n\nالحل ليس أن تخرجي مبكراً، بل أن يكون موعد الخروج معلناً مسبقاً. «سنتأخر قليلاً» أفضل من «يجب أن نذهب الآن» — لأن الأولى تفتح نقاشاً، والثانية تقطعه.\n\nثلاث خطوات تجعل الخروج هادئاً. الأولى: أبرمي الموعد قبل السهرة لا أثناءها — «سنخرج في العاشرة». الثانية: جهّزي المهد والروتين قبل الخروج، فحضن الوداع على السرير يهدّئ أكثر من الوداع عند الباب. الثالثة: بعد أن يكون في السرير، اخرجي قليلاً للمشي أو اجلسِي في غرفة هادئة دقيقتين — الحركة الهوائية تهدّئ، والعودة إلى بيت ساكن أرحم من العودة إلى غرفة صاخبة.\n\nوللجدّة جملة تُغني عن نقاش طويل: «سألتقي بكِ صباحاً، وسأحكي لكِ كل شيء». من يملك موعداً لا يحتاج أن يطلب إذناً.",
      en: "Family evenings are lovely and complicated at once. The beauty is that they never end on time; the difficulty is that a baby's sleep does not wait for the end of a conversation between a grandmother and her daughter.\n\nThe real problem is not that a mother is at the gathering — it is that the ending is undeclared. The longer the evening runs, the more awkward leaving becomes, and the awkwardness makes the evening longer.\n\nThe answer is not to leave early, but to have your leaving time announced in advance. 'We will be a little late' is better than 'we have to go now' — the first opens a conversation, the second cuts one off.\n\nThree steps make leaving gentle. First, agree the time before the evening rather than during it: we leave at ten. Second, prepare the cot and the routine before you go, because a goodbye cuddle at the bedside settles more than a goodbye at the door. Third, once he is in the cot, step out for a short walk or sit in a quiet room for two minutes — moving air settles him, and coming back to a quiet house is kinder than coming back to a loud room.\n\nAnd a sentence for grandma that saves a long argument: I will see you in the morning, and I will tell you everything. Whoever holds a time does not have to ask for permission.",
    },
    task: {
      ar: "اتفقي على موعد خروج واحد قبل السهرة — وجهّزي المهد والروتين قبل المغادرة.",
      en: "Agree one leaving time before the evening — and prepare the cot and routine before you go.",
    },
    keywords: [
      "family",
      "evening",
      "guests",
      "leaving",
      "سهرة",
      "عائلة",
      "ضيوف",
      "خروج",
      "انسحاب",
    ],
  },

  // ---------------------------- 1 للأب ----------------------------

  {
    id: "dad-night",
    category: "dad",
    minutes: 4,
    art: "hands",
    title: {
      ar: "للأب: دورك في الليلة الطويلة",
      en: "For dad: your part of the long night",
    },
    description: {
      ar: "أنت لست ضيفاً في هذه الليلة — وهذه مشاركة تعمل من أول ليلة، بلا كلام كثير.",
      en: "You are not a guest in this night — and here is a share that works from the very first night.",
    },
    body: {
      ar: "أنت لست ضيفاً في هذه الليلة. كثير من الآباء يظنّون أن دورهم أن يكونوا موجودين فقط، وهذا بالضبط ما يترك الأم وحدها مع أصعب نصف الليل.\n\nوالمشكلة العملية في معظم البيوت: الأم تستيقظ مع كل استيقاظ بينما يعمّ نومك العميق. والطفل يراقبكما معاً — فيتعلّم أن الليل يوقظ واحداً ويُبقي الآخر نائماً، فيلتفت إلى الأم أولاً.\n\nما ينفع فعلاً هو التقسيم المسبق. اتفقا قبل النوم على الساعة التي تستلم فيها الأم والتي تستلم فيها أنت. مثال عملي: من الحادية حتى الثالثة الأم، ومن الثالثة حتى الشروق أنت — أو العكس إن كان نومك أعمق قبل الشروق.\n\nوقواعد بسيطة تجعل الاستلام سهلاً. لا تحمله في أول مرة تصعد — اترك الأم هي من تهدّئه ثم خُذ منه. لا تفتح الأنوار ولا تسحب الستارة: إضاءة خافتة وصمت. ولا تعُد إلى الغرفة لمجرد أنه بكى — انتظر دقيقتين، فصوتك من الباب يهدم ما بناه السرير.\n\nوأهمّ ما في ذلك كله: أخبر الأم بما لاحظته لا بما توصلتَ إليه. «نام عند الثانية ونصف» ملاحظة، أما الحل الذي توصلتم إليه فهو قرارٌ مشترك. الملاحظة بيانات.\n\nوأخيراً: دور الأب ليس أن تُصلح ما تقوله الخطة أسرع، بل أن تحمل نصف الليل بأناقة. حين تستيقظ في الثالثة فتجد الطفل هادئاً، تكون قد وفّرتِ لها ساعتين كاملتين من النوم — وأكبر هدية في البيت.",
      en: "You are not a guest in this night. Many fathers assume their job is to be present, and that is exactly what leaves the mother alone with the hardest half of the night.\n\nThe practical problem in most homes: she wakes with every wake-up while you sleep on deeply. The baby watches both of you — and learns that night wakes one person and lets the other sleep, which is why he turns to her first.\n\nWhat genuinely works is splitting the night in advance. Agree before bed on the hour she takes and the hour you take. A workable split: she covers eleven until two, you cover two until dawn, or the other way round if your sleep is deepest before morning.\n\nA few simple rules make the handover easy. Do not pick him up the first time you go in — let her settle him, then take him from her. Do not switch on lights or open the curtains: dim and quiet. And do not come back into the room just because he cried — wait two minutes, because your voice in the doorway undoes what the cot has built.\n\nAnd the most important part of all: tell her what you noticed, not what you concluded. He settled at half past two is an observation; a solution you have both agreed on is a shared decision. An observation is data.\n\nAnd last of all: a father's part is not to correct the plan faster, but to carry half the night well. When he wakes at two and finds the baby calm, you have bought her two full hours of sleep — the largest gift in the house.",
    },
    task: {
      ar: "استلِم الليل من الساعة التي اتفقتما عليها — وأخبرها بما لاحظته، لا بالحلّ.",
      en: "Take the night from the hour you agreed — and tell her what you noticed, not what to do.",
    },
    keywords: [
      "dad",
      "father",
      "partner",
      "sharing the night",
      "night feed",
      "أب",
      "الأب",
      "زوج",
      "تقسيم الليل",
      "مشاركة",
    ],
  },
];

// ---------------------------------------------------------------------------
// الوصول إلى الدروس
// ---------------------------------------------------------------------------

/** درس بمعرّفه. */
export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}

/** الدروس لتقسيم معيّن. */
export function lessonsByCategory(category: LessonCategory): Lesson[] {
  return LESSONS.filter((lesson) => lesson.category === category);
}

/**
 * دليل النجاة المناسب لعمر الطفل.
 * عمر غير موجود في المكتبة → أقرب عمر أكبر (أكثر تحفظاً في النبرة).
 */
export function survivalGuideForAge(months: number): Lesson {
  const guides = lessonsByCategory("regression");
  const exact = guides.find((lesson) => lesson.id === `regression-${months}m`);

  if (exact) return exact;

  const later = guides.find((lesson) => {
    const age = Number(lesson.id.replace("regression-", "").replace("m", ""));
    return age > months;
  });

  return later ?? guides[guides.length - 1];
}

/** نص البحث: العنوان والوصف والنص والكلمات المفتاحية — بلغتين. */
function haystack(lesson: Lesson): string {
  return [
    lesson.title.ar,
    lesson.title.en,
    lesson.description.ar,
    lesson.description.en,
    lesson.body.ar,
    lesson.body.en,
    ...lesson.keywords,
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * بحث داخل المكتبة — بالعربية والإنجليزية.
 * يُطابَق العنوان والوصف أولاً (ترتيب أدق)، ثم نص الدرس.
 */
export function searchLessons(
  query: string,
  category: LessonCategory | "all" = "all",
): Lesson[] {
  const trimmed = query.trim().toLowerCase();

  return LESSONS.filter((lesson) => {
    if (category !== "all" && lesson.category !== category) return false;
    if (!trimmed) return true;
    return haystack(lesson).includes(trimmed);
  });
}
