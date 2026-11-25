"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_TEMPLATE_ID,
  type RoutineStepId,
  type RoutineTemplateId,
  type StepDelay,
} from "@/lib/engine/routines";

// حالة روتين التهدئة — docs/screens.md § الشاشة 04.
// القالب المختار، والترتيب المُعدَّل يدوياً، وبداية الروتين، والخطوات
// المعلَّمة الليلة، وتأخيرات الخطوات التي يستخدمها المحرك في اليوم التالي.

interface RoutineState {
  templateId: RoutineTemplateId;
  /** ترتيب مخصص لكل قالب — ينجو من تبديل القوالب. */
  orders: Partial<Record<RoutineTemplateId, RoutineStepId[]>>;
  /** مددّات معدَّلة يدوياً داخل كل قالب. */
  minutes: Partial<
    Record<RoutineTemplateId, Partial<Record<RoutineStepId, number>>>
  >;
  /** بداية الروتين اليدوية — null تعني «من خطة اليوم». */
  startOverride: string | null;
  /** تذكير المساء مفعّل؟ */
  reminderEnabled: boolean;
  /** HH:mm — وقت الإشعار (قبل الروتين بعشر دقائق). */
  reminderTime: string | null;
  /** معرّفات الخطوات المعلَّمة الليلة. */
  checked: string[];
  /** التاريخ الذي تنتمي إليه العلامات — تصفير تلقائي في يوم جديد. */
  checkedDate: string | null;
  /** التأخيرات المسجّلة — يستخدمها المحرك في اليوم التالي. */
  delays: StepDelay[];

  setTemplate: (id: RoutineTemplateId) => void;
  setOrder: (templateId: RoutineTemplateId, order: RoutineStepId[]) => void;
  setStepMinutes: (
    templateId: RoutineTemplateId,
    stepId: RoutineStepId,
    minutes: number,
  ) => void;
  setStartOverride: (value: string | null) => void;
  toggleStep: (stepId: RoutineStepId, date: string) => void;
  resetSteps: (date: string) => void;
  recordDelay: (stepId: RoutineStepId, minutes: number, date: string) => void;
  setReminder: (enabled: boolean, time: string | null) => void;
}

export const useRoutine = create<RoutineState>()(
  persist(
    (set) => ({
      templateId: DEFAULT_TEMPLATE_ID,
      orders: {},
      minutes: {},
      startOverride: null,
      reminderEnabled: false,
      reminderTime: null,
      checked: [],
      checkedDate: null,
      delays: [],

      setTemplate: (id) => set({ templateId: id }),

      setOrder: (templateId, order) =>
        set((state) => ({ orders: { ...state.orders, [templateId]: order } })),

      setStepMinutes: (templateId, stepId, minutes) =>
        set((state) => {
          const forTemplate = state.minutes[templateId] ?? {};
          return {
            minutes: {
              ...state.minutes,
              [templateId]: { ...forTemplate, [stepId]: minutes },
            },
          };
        }),

      setStartOverride: (value) => set({ startOverride: value }),

      toggleStep: (stepId, date) =>
        set((state) => {
          // يوم جديد — العلامات القديمة لا تُنقل.
          const checked =
            state.checkedDate === date ? state.checked : [];

          return {
            checkedDate: date,
            checked: checked.includes(stepId)
              ? checked.filter((id) => id !== stepId)
              : [...checked, stepId],
          };
        }),

      resetSteps: (date) => set({ checked: [], checkedDate: date }),

      recordDelay: (stepId, minutes, date) =>
        set((state) => ({
          delays: [
            ...state.delays.filter(
              (delay) => !(delay.date === date && delay.stepId === stepId),
            ),
            { date, stepId, minutes },
          ],
        })),

      setReminder: (enabled, time) =>
        set({ reminderEnabled: enabled, reminderTime: time }),
    }),
    {
      name: "raha.routine",
      version: 1,
      partialize: ({
        templateId,
        orders,
        minutes,
        startOverride,
        reminderEnabled,
        reminderTime,
        checked,
        checkedDate,
        delays,
      }) => ({
        templateId,
        orders,
        minutes,
        startOverride,
        reminderEnabled,
        reminderTime,
        checked,
        checkedDate,
        delays,
      }),
    },
  ),
);
