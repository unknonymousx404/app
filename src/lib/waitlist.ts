import { z } from "zod";

// قائمة الانتظار — بلا خادم.
// النسخة المحلية في localStorage مفتاحها raha.waitlist (مصفوفة كائنات).
// راجع docs/screens.md § الشاشة 10 و docs/ai-log.

export const WAITLIST_STORAGE_KEY = "raha.waitlist";

/**
 * ربط Google Form — الصق هنا قيمتين فقط من رابط الإرسال:
 *   endpoint: https://docs.google.com/forms/d/e/<ID>/formResponse
 *   entry:    entry.1234567890   (اسم حقل البريد في النموذج)
 * viewUrl رابط النموذج العام، ويُستخدم احتياطياً إن لم يوجد endpoint.
 * ما دامت فارغة، يُحفظ البريد محلياً فقط ويظهر تنويه صادق بذلك.
 */
export const WAITLIST_FORM = {
  endpoint: "",
  entry: "",
  viewUrl: "",
} as const;

export interface WaitlistEntry {
  email: string;
  at: string;
}

export type WaitlistValidation = "ok" | "empty" | "invalid";

const emailSchema = z.string().trim().min(1).max(254).pipe(z.email());

/** تحقق واحد مشترك بين الواجهة والتخزين — رسائل الخطأ في i18n. */
export function validateWaitlistEmail(value: string): WaitlistValidation {
  const trimmed = value.trim();
  if (!trimmed) return "empty";
  return emailSchema.safeParse(trimmed).success ? "ok" : "invalid";
}

/** يقرأ المصفوفة المحفوظة، ويتجاهل أي محتوى تالف بدل أن يسقط الصفحة. */
export function readWaitlist(): WaitlistEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(WAITLIST_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (entry): entry is WaitlistEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as WaitlistEntry).email === "string",
    );
  } catch {
    return [];
  }
}

/** يضيف البريد مرة واحدة (بلا تكرار) ويحفظه فوراً. يعيد نجاح الكتابة. */
export function saveWaitlistEmail(email: string): boolean {
  if (typeof window === "undefined") return false;

  const trimmed = email.trim();
  if (!trimmed) return false;

  const current = readWaitlist();
  const exists = current.some(
    (entry) => entry.email.toLowerCase() === trimmed.toLowerCase(),
  );

  if (!exists) {
    const next: WaitlistEntry[] = [
      ...current,
      { email: trimmed, at: new Date().toISOString() },
    ];

    try {
      window.localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(next));
      return true;
    } catch {
      return false;
    }
  }

  return true;
}
