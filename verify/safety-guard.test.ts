/*
  اختبار حارس النوم الآمن — رقعة 12.5.
  60 حالة مسمّاة (1–18 من رقعتي 12.1 و12.3، و19–40 من رقعة 12.4،
  و41–60 من رقعة 12.5) + 4 نصوص سلامة.
  تمرّ = ليست مرفوضة. تُرفض = نوم غير آمن أو تدريب بكاء.
  كل واحدة تطبع PASS/FAIL.

  التشغيل: node --experimental-strip-types verify/safety-guard.test.ts
*/

import assert from "node:assert/strict";
import {
  buildSafetyAnswer,
  buildUnderFourAnswer,
  containsCryTraining,
  containsInventedTime,
  containsUnsafeSleepAdvice,
  isAllowedRequestOrigin,
  type AskPlanContext,
} from "../src/lib/engine/ask-content.ts";

// أوقات الخطة المرجعية (ليان · الشاشة 03).
const plan: AskPlanContext = {
  routineStart: "18:10",
  lastFeed: "18:45",
  bedtime: "19:05",
};

/** الرفض كما في المسار: نوم غير آمن أو تدريب بكاء. */
function isRejected(text: string): boolean {
  return containsUnsafeSleepAdvice(text) || containsCryTraining(text);
}

interface Case {
  name: string;
  check: () => void;
}

const cases: Case[] = [
  {
    name: "1. نصيحة آمنة منفية — عربي",
    check: () =>
      assert.equal(
        containsUnsafeSleepAdvice("ضعيها على ظهرها، وليس على جانبها، وبلا وسائد."),
        false,
      ),
  },
  {
    name: "2. نصيحة آمنة منفية — إنجليزي",
    check: () =>
      assert.equal(
        containsUnsafeSleepAdvice(
          "Never place them on their side, and keep the cot without a pillow.",
        ),
        false,
      ),
  },
  {
    name: "3. خطر حقيقي — عربي",
    check: () =>
      assert.equal(
        containsUnsafeSleepAdvice("دعيه ينام على بطنه بعد الرضعة حتى ينام أسرع."),
        true,
      ),
  },
  {
    name: "4. خطر حقيقي — إنجليزي",
    check: () =>
      assert.equal(
        containsUnsafeSleepAdvice("Place them on their stomach after the feed."),
        true,
      ),
  },
  {
    name: "5. تدريب بكاء",
    check: () =>
      assert.equal(containsCryTraining("دعيها تبكي وحدها حتى تنام."), true),
  },
  {
    name: "6. أوقات الخطة",
    check: () =>
      assert.equal(
        containsInventedTime(
          "ابدئي الروتين 18:10، والرضعة الأخيرة 18:45، والسرير 19:05.",
          plan,
        ),
        false,
      ),
  },
  {
    name: "7. وقت رابع مخترع",
    check: () =>
      assert.equal(
        containsInventedTime(
          "ابدئي الروتين 18:10، والرضعة 18:45، والسرير 21:15.",
          plan,
        ),
        true,
      ),
  },
  {
    name: "8. تمرّ — نفي البطن وتحذير الخطر",
    check: () =>
      assert.equal(
        isRejected(
          "لا تضعيه على بطنه أبداً — النوم على البطن خطر، ضعيه على ظهره فقط.",
        ),
        false,
      ),
  },
  {
    name: "9. تمرّ — لا تدعيها تبكي",
    check: () =>
      assert.equal(
        isRejected("لا تدعيها تبكي حتى تنام — استجيبي لها بهدوء."),
        false,
      ),
  },
  {
    name: "10. تمرّ — يجب ألا ينام على بطنه أو جانبه",
    check: () =>
      assert.equal(
        isRejected("يجب ألا ينام على بطنه أو على جانبه في هذا العمر."),
        false,
      ),
  },
  {
    name: "11. تمرّ — تجنبي البطن والوسائد",
    check: () =>
      assert.equal(
        isRejected("تجنبي النوم على البطن والوسائد في السرير."),
        false,
      ),
  },
  {
    name: "12. تمرّ — never cry it out",
    check: () =>
      assert.equal(
        isRejected(
          "You never need to let him cry it out — respond gently every time.",
        ),
        false,
      ),
  },
  {
    name: "13. تمرّ — تفادي المخدة",
    check: () =>
      assert.equal(
        isRejected("تفادي وضع المخدة داخل سرير الطفل نهائياً."),
        false,
      ),
  },
  {
    name: "14. تُرفض — البطن بعد الرضعة",
    check: () =>
      assert.equal(
        isRejected("ضعيه على بطنه بعد الرضعة، فهذا يساعد الهضم."),
        true,
      ),
  },
  {
    name: "15. تُرفض — وسادة تحت رأسه",
    check: () =>
      assert.equal(isRejected("ضعي وسادة صغيرة تحت رأسه لتريحيه."), true),
  },
  {
    name: "16. تُرفض — اتركيه يبكي",
    check: () =>
      assert.equal(
        isRejected("اتركيه يبكي عشر دقائق قبل أن تستجيبي."),
        true,
      ),
  },
  {
    name: "17. تُرفض — place on his side",
    check: () =>
      assert.equal(
        isRejected("Place him on his side tonight and see if it helps."),
        true,
      ),
  },
  {
    name: "18. تُرفض — نوم الطفل على البطن خبري",
    check: () => assert.equal(isRejected("نوم الطفل على البطن يطيل نومه عادة."), true),
  },
  {
    name: "19. تُرفض — الشرطة الطويلة تكسر الجملة قبل اتركيه يبكي (البند 1)",
    check: () =>
      assert.equal(
        isRejected("لا تقلقي — اتركيه يبكي خمس دقائق فقط."),
        true,
      ),
  },
  {
    name: "20. تُرفض — الفاصلة المنقوطة تفصل Never عن الوسادة (البند 1)",
    check: () =>
      assert.equal(
        isRejected("Never use loose bedding; add a small pillow instead."),
        true,
      ),
  },
  {
    name: "21. تُرفض — الفاصلة اللاتينية تفصل Never عن الوسادة (البند 1)",
    check: () =>
      assert.equal(
        isRejected("Never use a swaddle at this age, add a pillow in the cot."),
        true,
      ),
  },
  {
    name: "22. تمرّ — تحذير الخطر بعد المطابقة داخل الجملة (البند 2)",
    check: () =>
      assert.equal(
        isRejected("النوم على البطن خطر على الرضع دون سن سنة."),
        false,
      ),
  },
  {
    name: "23. تمرّ — نوم الطفل على البطن خطر (البند 2)",
    check: () =>
      assert.equal(
        isRejected("نوم الطفل على البطن خطر في هذا العمر."),
        false,
      ),
  },
  {
    name: "24. تمرّ — «ليست آمنة» بعد المطابقة تحذير لا نصيحة (البند 2)",
    check: () =>
      assert.equal(
        isRejected("وسادة تحت رأسه ليست آمنة قبل عمر سنة — أزيليها من السرير."),
        false,
      ),
  },
  {
    name: "25. تُرفض — تبييض خطر: «ليس خطرًا» بعد المطابقة (البند 2)",
    check: () =>
      assert.equal(isRejected("وضعه على بطنه ليس خطرًا كما يقولون."), true),
  },
  {
    name: "26. تمرّ — shouldn't نفي بعد تطبيع الاختصار (البند 3)",
    check: () =>
      assert.equal(
        isRejected("You shouldn't put him on his tummy to sleep."),
        false,
      ),
  },
  {
    name: "27. تمرّ — can't نفي بعد تطبيع الاختصار (البند 3)",
    check: () =>
      assert.equal(
        isRejected("You can't use a pillow in the cot at this age."),
        false,
      ),
  },
  {
    name: "28. تمرّ — Don’t بالفاصلة العليّة المطبيعّة (البند 3)",
    check: () =>
      assert.equal(isRejected("Don’t put a pillow in the cot."), false),
  },
  {
    name: "29. تُرفض — صيغة أمر ناقصة: نوّميه على بطنه (البند 4)",
    check: () =>
      assert.equal(isRejected("نوّميه على بطنه بعد الرضعة مباشرة."), true),
  },
  {
    name: "30. تُرفض — صيغة أمر ناقصة: ناميه على جانبه (البند 4)",
    check: () =>
      assert.equal(isRejected("ناميه على جانبه في المهد ليلاً."), true),
  },
  {
    name: "31. تُرفض — ضمير متصل بعد نوم: نومه على بطنه (البند 4)",
    check: () =>
      assert.equal(
        isRejected("ستجدين نومه على بطنه أهدأ بكثير."),
        true,
      ),
  },
  {
    name: "32. تُرفض — your baby في النمط الإنجليزي (البند 4)",
    check: () =>
      assert.equal(isRejected("Place your baby on their side tonight."), true),
  },
  {
    name: "33. تُرفض — let him cry بعد الشرطة (البند 5)",
    check: () =>
      assert.equal(
        isRejected(
          "Don't worry — let him cry for ten minutes before you respond.",
        ),
        true,
      ),
  },
  {
    name: "34. تمرّ — إعفاء وقت البطن أثناء الاستيقاظ (البند 6)",
    check: () =>
      assert.equal(
        isRejected(
          "Give them tummy time daily: place them on their tummy while awake and supervised.",
        ),
        false,
      ),
  },
  {
    name: "35. تُرفض — انتظري عشر دقائق مع البكاء (البند 7)",
    check: () =>
      assert.equal(
        isRejected("إن بكى فانتظري عشر دقائق قبل أن تهرعي إليه."),
        true,
      ),
  },
  {
    name: "36. تمرّ — انتظري عشرين دقيقة بعد الرضعة بلا بكاء (البند 7)",
    check: () =>
      assert.equal(
        isRejected("انتظري عشرين دقيقة بعد الرضعة قبل وضعه في السرير."),
        false,
      ),
  },
  {
    name: "37. Origin — مساواة تامة مع أصل مسموح (البند 8)",
    check: () =>
      assert.equal(
        isAllowedRequestOrigin("https://rahamoon.vercel.app", null),
        true,
      ),
  },
  {
    name: "38. Origin — نطاق متشبه يُرفض (البند 8)",
    check: () =>
      assert.equal(
        isAllowedRequestOrigin("https://rahamoon.vercel.app.evil.com", null),
        false,
      ),
  },
  {
    name: "39. Referer — مسار كامل تحت أصل مسموح يُقبل (البند 8)",
    check: () =>
      assert.equal(
        isAllowedRequestOrigin(
          null,
          "https://rahamoon.vercel.app/ask?from=lib",
        ),
        true,
      ),
  },
  {
    name: "40. Referer — نطاق متشبه بمسار يُرفض (البند 8)",
    check: () =>
      assert.equal(
        isAllowedRequestOrigin(null, "https://rahamoon.vercel.app.evil.com/ask"),
        false,
      ),
  },
  {
    name: "41. تُرفض — التحذير المنفي بحرف الباء: «ليس بخطر» (البند 1)",
    check: () =>
      assert.equal(
        isRejected("وضعه على بطنه ليس بخطر كما يقولون."),
        true,
      ),
  },
  {
    name: "42. تُرفض — التبييض قبل المطابقة: «not dangerous to put» (البند 2)",
    check: () =>
      assert.equal(
        isRejected("It's not dangerous to put a pillow under his head."),
        true,
      ),
  },
  {
    name: "43. تمرّ — «not safe» نفي عادي لا تبييض (البند 2)",
    check: () =>
      assert.equal(
        isRejected("It's not safe to put him on his side."),
        false,
      ),
  },
  {
    name: "44. تمرّ — «ممنوع» تحذير بعد المطابقة (البند 3)",
    check: () =>
      assert.equal(
        isRejected("نوم الطفل على البطن ممنوع في هذا العمر."),
        false,
      ),
  },
  {
    name: "45. تمرّ — «not recommended» تحذير بعد المطابقة (البند 3)",
    check: () =>
      assert.equal(
        isRejected("Stomach sleeping is not recommended at this age."),
        false,
      ),
  },
  {
    name: "46. تُرفض — الصيغة الاسمية: «stomach sleeping» (البند 4)",
    check: () =>
      assert.equal(
        isRejected("You could try stomach sleeping for longer naps."),
        true,
      ),
  },
  {
    name: "47. تمرّ — «Stomach sleeping is dangerous» تحذير (البند 4)",
    check: () =>
      assert.equal(
        isRejected("Stomach sleeping is dangerous for babies under one."),
        false,
      ),
  },
  {
    name: "48. تمرّ — «back» مستثناة من النمط الاسمي (البند 4)",
    check: () =>
      assert.equal(
        isRejected("Back sleeping is best for babies under one."),
        false,
      ),
  },
  {
    name: "49. تُرفض — الوسادة مع rest on (البند 5)",
    check: () =>
      assert.equal(
        isRejected("Let him rest on a soft pillow during the night."),
        true,
      ),
  },
  {
    name: "50. تمرّ — «Putting a pillow … is not safe» (البند 5)",
    check: () =>
      assert.equal(
        isRejected("Putting a pillow in the cot is not safe before age one."),
        false,
      ),
  },
  {
    name: "51. تمرّ — Never let him rest on a pillow (البند 5)",
    check: () =>
      assert.equal(
        isRejected("Never let him rest on a pillow — keep the cot bare."),
        false,
      ),
  },
  {
    name: "52. تمرّ — فعل الإزالة يعفي مطابقة الوسادة (البند 6)",
    check: () =>
      assert.equal(
        isRejected("إن كان في سريره وسادة تحت رأسه فأزيليها الآن."),
        false,
      ),
  },
  {
    name: "53. تُرفض — وسادة تحت رأسه بلا فعل إزالة (البند 6)",
    check: () =>
      assert.equal(
        isRejected("ستجدين وسادة تحت رأسه مريحة له."),
        true,
      ),
  },
  {
    name: "54. تُرفض — انتظار بالإنجليزية عبر الفاصلة (البند 7)",
    check: () =>
      assert.equal(
        isRejected("If he cries, wait ten minutes before you respond."),
        true,
      ),
  },
  {
    name: "55. تُرفض — Leave him for ten minutes (البند 7)",
    check: () =>
      assert.equal(
        isRejected("Leave him for ten minutes if he cries."),
        true,
      ),
  },
  {
    name: "56. تمرّ — Don't wait … respond right away (البند 7)",
    check: () =>
      assert.equal(
        isRejected("Don't wait ten minutes when he cries — respond right away."),
        false,
      ),
  },
  {
    name: "57. تمرّ — Wait twenty minutes بلا بكاء (البند 7)",
    check: () =>
      assert.equal(
        isRejected("Wait twenty minutes after the feed before you put him down."),
        false,
      ),
  },
  {
    name: "58. تُرفض — «انتظري دقائق» مع البكاء (البند 7)",
    check: () =>
      assert.equal(
        isRejected("انتظري دقائق قليلة حين يبكي قبل أن تستجيبي."),
        true,
      ),
  },
  {
    name: "59. تمرّ — «لا تنتظري عشر دقائق» نفي قبل الانتظار (البند 7)",
    check: () =>
      assert.equal(
        isRejected("لا تنتظري عشر دقائق إذا بكى — استجيبي فورًا."),
        false,
      ),
  },
  {
    name: "60. تمرّ — «انتظري عشرين دقيقة» بلا بكاء (البند 7)",
    check: () =>
      assert.equal(
        isRejected("انتظري عشرين دقيقة بعد الرضعة قبل وضعه في السرير."),
        false,
      ),
  },
];

let failures = 0;

for (const testCase of cases) {
  try {
    testCase.check();
    console.log(`PASS — ${testCase.name}`);
  } catch (error) {
    failures += 1;
    console.log(`FAIL — ${testCase.name}`);
    console.log(`       ${(error as Error).message}`);
  }
}

// نصوص السلامة الثابتة نفسها يجب أن تمرّ من الحارس (لا ندّعي خطراً في نصّنا).
for (const lang of ["ar", "en"] as const) {
  for (const [label, text] of [
    ["buildSafetyAnswer", buildSafetyAnswer(lang)],
    ["buildUnderFourAnswer", buildUnderFourAnswer(lang, 2)],
  ] as const) {
    try {
      assert.equal(containsUnsafeSleepAdvice(text), false, label);
      assert.equal(containsCryTraining(text), false, label);
      console.log(`PASS — ${label} آمن — ${lang}`);
    } catch (error) {
      failures += 1;
      console.log(`FAIL — ${label} آمن — ${lang}`);
      console.log(`       ${(error as Error).message}`);
    }
  }
}

if (failures > 0) {
  console.log(`\n${failures} حالة فاشلة.`);
  process.exit(1);
}

console.log("\nكل الحالات الـ64 PASS (60 حالة مسمّاة + 4 نصوص سلامة).");
