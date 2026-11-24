"use client";

import { useSyncExternalStore } from "react";
import type { Lang } from "@/lib/i18n";

// مفتاح حفظ اللغة المعتمد — راجع docs/i18n.md.
// الإنجليزية هي اللغة الافتراضية لأول فتح (بتوجيه المستخدم).
export const LANG_STORAGE_KEY = "raha.lang";

const listeners = new Set<() => void>();

function readLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    return window.localStorage.getItem(LANG_STORAGE_KEY) === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}

export function subscribeLang(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key === LANG_STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getLangSnapshot(): Lang {
  return readLang();
}

export function getServerLangSnapshot(): Lang {
  return "en";
}

export function setLang(lang: Lang): void {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // التخزين قد يكون معطلاً — نكتفي بالحالة الحالية في الجلسة.
  }
  listeners.forEach((listener) => listener());
}

export function useLang(): Lang {
  return useSyncExternalStore(
    subscribeLang,
    getLangSnapshot,
    getServerLangSnapshot,
  );
}
