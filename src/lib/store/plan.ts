"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FirstPlan } from "@/lib/engine/first-plan";

// خطة اليوم — تُحفظ محلياً مع تاريخها.
// إعادة الفتح في اليوم نفسه لا تعيد التوليد؛ ويوم جديد يعني خطة جديدة.
// `base` هي خطة اليوم قبل تعديلات الشاشة 06 — تُحفظ كي يعيد «غير موافق»
// قيمة الأمس بلا إعادة توليد ولا تعديل متكرر.
interface PlanState {
  plan: FirstPlan | null;
  date: string | null; // YYYY-MM-DD محلي
  base: FirstPlan | null;
  savePlan: (plan: FirstPlan, base?: FirstPlan | null) => void;
  clearPlan: () => void;
}

export const usePlan = create<PlanState>()(
  persist(
    (set) => ({
      plan: null,
      date: null,
      base: null,
      savePlan: (plan, base = null) => set({ plan, date: plan.date, base }),
      clearPlan: () => set({ plan: null, date: null, base: null }),
    }),
    {
      name: "raha.plan",
      version: 2,
      partialize: ({ plan, date, base }) => ({ plan, date, base }),
    },
  ),
);
