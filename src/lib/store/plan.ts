"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FirstPlan } from "@/lib/engine/first-plan";

// خطة اليوم — تُحفظ محلياً مع تاريخها.
// إعادة الفتح في اليوم نفسه لا تعيد التوليد؛ ويوم جديد يعني خطة جديدة.
interface PlanState {
  plan: FirstPlan | null;
  date: string | null; // YYYY-MM-DD محلي
  savePlan: (plan: FirstPlan) => void;
  clearPlan: () => void;
}

export const usePlan = create<PlanState>()(
  persist(
    (set) => ({
      plan: null,
      date: null,
      savePlan: (plan) => set({ plan, date: plan.date }),
      clearPlan: () => set({ plan: null, date: null }),
    }),
    {
      name: "raha.plan",
      version: 1,
      partialize: ({ plan, date }) => ({ plan, date }),
    },
  ),
);
