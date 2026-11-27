/*
  اختبار حارس النوم الآمن — رقعة 12.2.
  الحالات السبع المعتمدة، كل واحدة تطبع PASS/FAIL.

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

console.log("\nكل الحالات السبع PASS.");
