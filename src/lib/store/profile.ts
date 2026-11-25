"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// الملف النامي — docs/engine.md §1.
// الحقول الأربعة الأولى تُجمع في الشاشة 02 ولا يُسأل عنها المستخدم مرة أخرى أبداً.
export type WorstProblem = "frequent-wakes" | "late-sleep" | "held-sleep";

export interface GrowingProfile {
  birthDate: string; // ISO — يُحسب منه العمر بالأيام دائماً
  worstProblem: WorstProblem;
  wakePattern: string;
  priorityGoal: string;
}

// أثناء جمع الإجابات تكون الحقول فارغة، ثم تُحفظ دفعة واحدة عند إتمام الخطوة الرابعة.
export interface ProfileAnswers {
  birthDate: string;
  worstProblem: WorstProblem | "";
  wakePattern: string;
  priorityGoal: string;
}

export const EMPTY_ANSWERS: ProfileAnswers = {
  birthDate: "",
  worstProblem: "",
  wakePattern: "",
  priorityGoal: "",
};

// العائلة المرجعية: ليان، مولودة 15 مايو 2026 — تاريخ افتراضي للعرض التجريبي.
export const DEMO_BIRTH_DATE = "2026-05-15";

// ملف العائلة المرجعية الكامل — يُستخدم حين تُفتح الشاشة 03 قبل إتمام الشاشة 02.
export const DEMO_PROFILE: GrowingProfile = {
  birthDate: DEMO_BIRTH_DATE,
  worstProblem: "frequent-wakes",
  wakePattern: "two-three-fixed",
  priorityGoal: "sleep-through",
};

interface ProfileState extends ProfileAnswers {
  saveProfile: (profile: GrowingProfile) => void;
  resetProfile: () => void;
}

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      ...EMPTY_ANSWERS,
      saveProfile: (profile) => set(profile),
      resetProfile: () => set(EMPTY_ANSWERS),
    }),
    {
      name: "raha.profile",
      version: 1,
      // نحفظ الحقول الأربعة وحدها — لا دوال ولا حالة واجهة.
      partialize: ({ birthDate, worstProblem, wakePattern, priorityGoal }) => ({
        birthDate,
        worstProblem,
        wakePattern,
        priorityGoal,
      }),
    },
  ),
);

export function isProfileComplete(
  answers: ProfileAnswers,
): answers is GrowingProfile {
  return Boolean(
    answers.birthDate &&
      answers.worstProblem &&
      answers.wakePattern &&
      answers.priorityGoal,
  );
}

// ---------------------------- حساب العمر ----------------------------
// المنطق النقي في src/lib/age.ts ويُعاد تصديره هنا للتوافق مع استيرادات
// الشاشات الحالية (screen-02) والمحرك.

export { ageInDays, ageParts } from "@/lib/age";
