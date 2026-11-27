/*
  اختبار حارس النوم الآمن — رقعة 12.3.
  11 حالة سابقة (7 مسمّاة + 4 نصوص سلامة) و11 حالة لنطاق الجملة.
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
    check: () =>
      assert.equal(isRejected("نوم الطفل على البطن يطيل نومه عادة."), true),
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

console.log("\nكل الحالات الـ22 PASS.");
