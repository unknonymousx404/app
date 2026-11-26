"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { localIsoDate } from "@/lib/age";

// سجل الليالي — docs/engine.md §1 (NightRecord حرفياً).
// التسجيل من الشاشة 05: ثلاث إجابات صباحاً، والتعديل متاح دائماً
// («كنت نائمة وسجلت بالخطأ»).
export type MorningMood = "rested" | "tired" | "hard";

export interface NightRecord {
  date: string; // ISO — YYYY-MM-DD محلي
  sleepTime: string; // HH:mm — وقت النوم الفعلي
  wakeCount: number; // عدد الاستيقاظات
  morningMood: MorningMood;
  emergency?: boolean; // هل فُعّل وضع الطوارئ
}

interface NightsState {
  nights: NightRecord[];
  /** هل الليالي الحالية بيانات عرض تجريبية؟ يُمسح العرض وحده عند إغلاقه. */
  demoSeeded?: boolean;
  /** إضافة أو تعديل — نفس التاريخ يعني تعديلاً لا تكراراً. */
  saveNight: (record: NightRecord) => void;
  removeNight: (date: string) => void;
  seedDemoNights: () => void;
  clearNights: () => void;
  clearDemoNights: () => void;
}

// ترتيب تصاعدي بالتاريخ — أحدث ليلة في النهاية.
function sortNights(nights: NightRecord[]): NightRecord[] {
  return [...nights].sort((a, b) => a.date.localeCompare(b.date));
}

// ---------------------- بيانات التطوير: سبع ليالٍ لليان ----------------------
// ليالٍ واقعية (6 أشهر): استيقاظ متكرر يتراجع ببطء من 5 إلى 2،
// وموعد نوم يثبت حول 19:15، ومزاج صباحي يتحسن مع الأسبوع.
const DEMO_SLEEP_TIMES = [
  "19:40",
  "19:30",
  "19:45",
  "19:25",
  "19:20",
  "19:15",
  "19:20",
];
const DEMO_WAKE_COUNTS = [5, 4, 5, 3, 3, 2, 2];
const DEMO_MOODS: MorningMood[] = [
  "hard",
  "tired",
  "tired",
  "tired",
  "rested",
  "rested",
  "rested",
];

function demoNights(): NightRecord[] {
  const records: NightRecord[] = [];
  const base = new Date();

  // من أمس إلى سبعة أيام خلفاً — لا نلمس تسجيل اليوم نفسه.
  for (let index = 1; index <= 7; index += 1) {
    const day = new Date(base);
    day.setDate(day.getDate() - index);

    // slot 0 لأقدم ليلة وslot 6 لأمس — فالمسار يتحسن كلما اقتربنا من اليوم.
    const slot = 7 - index;

    records.push({
      date: localIsoDate(day),
      sleepTime: DEMO_SLEEP_TIMES[slot],
      wakeCount: DEMO_WAKE_COUNTS[slot],
      morningMood: DEMO_MOODS[slot],
    });
  }

  return records;
}

export const useNights = create<NightsState>()(
  persist(
    (set) => ({
      nights: [],
      saveNight: (record) =>
        set((state) => ({
          nights: sortNights([
            ...state.nights.filter((night) => night.date !== record.date),
            record,
          ]),
        })),
      removeNight: (date) =>
        set((state) => ({
          nights: state.nights.filter((night) => night.date !== date),
        })),
      // حزام أمان (رقعة 11.1): لا استبدال ليالٍ حقيقية غير موسومة demoSeeded.
      // وإلا محا عرضٌ عارضٌ سجلَّ أمٍّ حقيقية بضغطة واحدة.
      seedDemoNights: () =>
        set((state) =>
          state.nights.length > 0 && !state.demoSeeded
            ? state
            : { nights: sortNights(demoNights()), demoSeeded: true },
        ),
      clearNights: () => set({ nights: [], demoSeeded: false }),
      clearDemoNights: () =>
        set((state) =>
          state.demoSeeded ? { nights: [], demoSeeded: false } : state,
        ),
    }),
    {
      name: "raha.nights",
      version: 1,
      partialize: ({ nights, demoSeeded }) => ({ nights, demoSeeded }),
    },
  ),
);

// ---------------------------- حسابات نقية ----------------------------

/** تسجيل يوم بعينه — null إن لم يُسجَّل بعد. */
export function findNight(
  nights: NightRecord[],
  date: string,
): NightRecord | null {
  return nights.find((night) => night.date === date) ?? null;
}

/**
 * متوسط عدد الاستيقاظات في الأسبوع الماضي (حتى سبعة تسجيلات قبل اليوم).
 * يعيد null حين لا يوجد سجل سابق — فلا نعرض رقماً مخترعاً.
 */
export function averageWakeCount(
  nights: NightRecord[],
  today: Date = new Date(),
  days = 7,
): number | null {
  const from = new Date(today);
  from.setDate(from.getDate() - days);

  const fromIso = localIsoDate(from);
  const todayIso = localIsoDate(today);

  const past = nights
    .filter((night) => night.date >= fromIso && night.date < todayIso)
    .slice(-days);

  if (past.length === 0) return null;

  const total = past.reduce((sum, night) => sum + night.wakeCount, 0);
  return total / past.length;
}
