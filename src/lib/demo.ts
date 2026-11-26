"use client";

import { useEffect, useSyncExternalStore } from "react";
import { isProfileComplete, useProfile } from "@/lib/store/profile";

// وضع العرض (?demo=1) — docs/ai-log/2026-11-27.md.
// الشارة وحارس المسارات يشتركان في هذا المصدر الوحيد: العرض مفعّل إن جاء
// الرابط بـ?demo=1 أو إن كانت جلسة عرض محفوظة من زيارة سابقة. تثبيت الجلسة
// ضروري لأن روابط التبويبات لا تحمل معامل الرابط معها.

export const DEMO_PARAM = "demo";
const DEMO_PARAM_VALUE = "1";

// بوابة التركيب: الخادم يعرض الهيكل، والعميل يعرض الحالة الحقيقية.
function subscribeToHydration(): () => void {
  return () => {};
}
function getHydrated(): boolean {
  return true;
}
function getHydratedOnServer(): boolean {
  return false;
}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToHydration,
    getHydrated,
    getHydratedOnServer,
  );
}

/** هل يحمل عنوان الصفحة ?demo=1 صراحة؟ */
export function hasDemoParam(): boolean {
  if (typeof window === "undefined") return false;
  return (
    new URLSearchParams(window.location.search).get(DEMO_PARAM) ===
    DEMO_PARAM_VALUE
  );
}

/** هل نعرض بيانات العائلة التجريبية الآن؟ */
export function useDemoMode(): boolean {
  const hydrated = useHydrated();
  const stored = useProfile((state) => state.demo);
  return hydrated && (stored || hasDemoParam());
}

export type ProfileGateStatus = "loading" | "open" | "closed";

/**
 * حارس المسارات: لا خطة يتيمة.
 * مفتوح إذا وُجد ملف طفل مكتمل أو كان وضع العرض مفعّلاً؛ ومغلق يعني
 * تحويلاً إلى معالج ملف الطفل (الشاشة 02).
 */
export function useProfileGate(): ProfileGateStatus {
  const hydrated = useHydrated();
  const demo = useProfile((state) => state.demo);
  const complete = useProfile((state) => isProfileComplete(state));
  const enterDemo = useProfile((state) => state.enterDemo);
  const fromUrl = hydrated && hasDemoParam();

  // الوصول بـ?demo=1 يثبّت جلسة العرض، فتظل الشارة والحارس مع التنقل.
  useEffect(() => {
    if (fromUrl && !demo) enterDemo();
  }, [fromUrl, demo, enterDemo]);

  if (!hydrated) return "loading";
  if (demo || complete || fromUrl) return "open";
  return "closed";
}
