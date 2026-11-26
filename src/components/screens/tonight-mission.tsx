"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import {
  getLesson,
  pick,
  survivalGuideForAge,
  type Lesson,
} from "@/lib/content/library";
import type { FirstPlan, PlanWorstProblem } from "@/lib/engine/first-plan";
import { PLAN, fillText, formatAgeMonths } from "@/lib/i18n";
import { useLang } from "@/lib/lang";

/**
 * اختيار مهمة الليلة من المحرك وإلى المكتبة:
 * - الحمل للنوم ← درس فكّ الارتباط.
 * - النوم المتأخر ← درس قيلولة المساء.
 * - غير ذلك ← دليل النجاة لعمر الطفل (نفس قاعدة الشاشة 06).
 * لا محتوى جديد ولا نص مكتوب هنا.
 */
function missionLesson(
  ageMonths: number,
  worstProblem: PlanWorstProblem,
): Lesson {
  if (worstProblem === "held-sleep") {
    return getLesson("behavior-rocking") ?? survivalGuideForAge(ageMonths);
  }
  if (worstProblem === "late-sleep") {
    return getLesson("nap-late") ?? survivalGuideForAge(ageMonths);
  }
  return survivalGuideForAge(ageMonths);
}

/**
 * بطاقة «مهمة الليلة» البارزة في شاشة اليوم (الشاشة 03).
 * معرّفة من ملف الطفل (العمر وأصعب مشكلة) ومن درس المكتبة المطابق،
 * وباسم الطفل من الواجهة — لا اسم العائلة المرجعية لغير وضع العرض.
 */
export function TonightMissionCard({
  plan,
  worstProblem,
  childName,
}: {
  plan: FirstPlan;
  worstProblem: PlanWorstProblem;
  childName: string;
}) {
  const lang = useLang();
  const t = PLAN[lang];
  const lesson = missionLesson(plan.ageMonths, worstProblem);

  return (
    <section
      aria-labelledby="tonight-mission-title"
      className="mt-6 rounded-3xl border border-gold/45 bg-gold/10 p-4"
    >
      <div className="flex items-center gap-2 text-gold">
        <Sparkles aria-hidden="true" className="h-4 w-4" />
        <h2
          id="tonight-mission-title"
          className="text-base leading-snug font-medium"
        >
          {fillText(t.missionTitle, { name: childName })}
        </h2>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-nhi">
        {pick(lesson.task, lang)}
      </p>

      <p className="mt-2 text-xs leading-relaxed text-nlo">
        {fillText(t.missionWhy, {
          name: childName,
          age: formatAgeMonths(lang, plan.ageMonths),
        })}
      </p>

      <Link
        href={`/library?lesson=${encodeURIComponent(lesson.id)}`}
        className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-xs text-gold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      >
        {t.missionOpen} — {pick(lesson.title, lang)}
        <ArrowLeft
          aria-hidden="true"
          className={`h-3.5 w-3.5 ${lang === "en" ? "rotate-180" : ""}`}
        />
      </Link>
    </section>
  );
}
