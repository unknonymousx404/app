"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Adjustment, AdjustmentRecord } from "@/lib/engine/adjuster";

// سجل التعديلات — docs/engine.md §1 (`adjustments`) و§3 (قاعدة الرفض).
// يُحفظ محلياً مع تاريخ كل اقتراح، لأن قاعدة «لا تكرار ثلاثة أيام» تحتاج
// تاريخ الرفض لا حالته وحدها.
interface AdjustmentsState {
  records: AdjustmentRecord[];
  /** يسجّل تعديلات يوم واحد — اليوم نفسه يُستبدل لا يتكرر. */
  recordDay: (date: string, adjustments: Adjustment[]) => void;
  /** «غير موافق»: يحوّل الحالة إلى مرفوض ويُبقي تاريخ الاقتراح. */
  reject: (date: string, id: string) => void;
  clear: () => void;
}

export const useAdjustments = create<AdjustmentsState>()(
  persist(
    (set) => ({
      records: [],
      recordDay: (date, adjustments) =>
        set((state) => ({
          records: [
            ...state.records.filter((record) => record.date !== date),
            ...adjustments.map((adjustment) => ({
              ...adjustment,
              date,
              // الاقتراح المعروض في الشاشة مطبّق على خطة اليوم فعلاً.
              status: adjustment.status === "pending" ? "applied" : adjustment.status,
            })),
          ],
        })),
      reject: (date, id) =>
        set((state) => ({
          records: state.records.map((record) =>
            record.date === date && record.id === id
              ? { ...record, status: "rejected" }
              : record,
          ),
        })),
      clear: () => set({ records: [] }),
    }),
    {
      name: "raha.adjustments",
      version: 1,
      partialize: ({ records }) => ({ records }),
    },
  ),
);

/** تعديلات يوم بعينه — الأحدث أولاً داخل اليوم. */
export function recordsForDate(
  records: AdjustmentRecord[],
  date: string,
): AdjustmentRecord[] {
  return records.filter((record) => record.date === date).reverse();
}

export interface AdjustmentDay {
  date: string;
  records: AdjustmentRecord[];
}

/** يجمع السجل بالأيام، الأحدث تاريخاً أولاً — لتصفح السجل للخلف. */
export function groupByDate(records: AdjustmentRecord[]): AdjustmentDay[] {
  const days = new Map<string, AdjustmentRecord[]>();

  for (const record of records) {
    const list = days.get(record.date) ?? [];
    list.push(record);
    days.set(record.date, list);
  }

  return [...days.entries()]
    .map(([date, list]) => ({ date, records: list }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
