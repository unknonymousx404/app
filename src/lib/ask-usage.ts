"use client";

import { useSyncExternalStore } from "react";
import { localIsoDate } from "@/lib/age";

/**
 * عدّاد أسئلة «اسألي راحة» اليومي — 15 سؤالاً لكل أم.
 * التخزين محلي أولاً (localStorage) كما تنص المواصفة؛ لا يُرسل العدّاد للخادم.
 * عند تعذّر localStorage يبقى العدّاد في الذاكرة لهذه الجلسة بدل تعطيل الحد.
 */
export const ASK_USAGE_KEY = "raha.ask.usage";
export const ASK_DAILY_LIMIT = 15;

interface AskUsage {
  date: string;
  count: number;
}

const listeners = new Set<() => void>();
let memoryUsage: AskUsage | null = null;

function today(): string {
  return localIsoDate();
}

function readUsage(): AskUsage {
  if (typeof window === "undefined") {
    return { date: today(), count: 0 };
  }

  try {
    const raw = window.localStorage.getItem(ASK_USAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AskUsage>;
      if (
        parsed &&
        parsed.date === today() &&
        typeof parsed.count === "number" &&
        Number.isFinite(parsed.count)
      ) {
        return { date: parsed.date, count: Math.max(0, Math.floor(parsed.count)) };
      }
    }
  } catch {
    // التخزين المحلي قد يكون معطلاً — نكمل بالذاكرة.
  }

  if (memoryUsage && memoryUsage.date === today()) return memoryUsage;
  return { date: today(), count: 0 };
}

function writeUsage(usage: AskUsage): void {
  memoryUsage = usage;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(ASK_USAGE_KEY, JSON.stringify(usage));
    } catch {
      // لا نعطّل السؤال بسبب تعذّر الحفظ.
    }
  }
  listeners.forEach((listener) => listener());
}

export function subscribeAskUsage(listener: () => void): () => void {
  listeners.add(listener);

  if (typeof window === "undefined") {
    return () => listeners.delete(listener);
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === ASK_USAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getAskUsageCount(): number {
  return readUsage().count;
}

export function getAskUsageServerSnapshot(): number {
  return 0;
}

export function useAskUsage(): number {
  return useSyncExternalStore(
    subscribeAskUsage,
    getAskUsageCount,
    getAskUsageServerSnapshot,
  );
}

/** يستهلك سؤالاً واحداً فقط إن بقي ضمن السقف. */
export function consumeAskQuestion(): { allowed: boolean; count: number } {
  const current = readUsage();
  if (current.count >= ASK_DAILY_LIMIT) {
    return { allowed: false, count: current.count };
  }

  const next: AskUsage = { date: today(), count: current.count + 1 };
  writeUsage(next);
  return { allowed: true, count: next.count };
}
