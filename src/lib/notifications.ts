"use client";

/**
 * تذكير المساء — docs/engine.md §6:
 * «إشعار مسائي واحد فقط قبل الروتين بعشر دقائق، في وقت يحدده المستخدم.»
 * و«لا إشعار ليلياً إطلاقاً (الصمت الليلي)».
 *
 * القرار الكامل: إشعار واحد في اليوم، لا يتكرر أبداً في اليوم نفسه. نضمن
 * ذلك بمفتاح في التخزين يسجّل آخر يوم أُرسل فيه التذكير.
 */

export type ReminderPermission =
  | "unsupported"
  | "default"
  | "granted"
  | "denied";

/** مفتاح يسجّل آخر يوم صُرفت فيه الإشعار — يضمن إشعاراً واحداً في اليوم. */
const LAST_SENT_KEY = "raha.reminder.lastSent";

/** أقصى مهلة.setTimeout (‏~24.8 يوماً) — نُعيد التسليح قبلها. */
const MAX_TIMEOUT = 2_147_483_000;

/** مهلة التسامح: إن فُتح التطبيق بعد موعد التذكير بقليل، نُرسله فوراً. */
const GRACE_MS = 20 * 60 * 1000;

/** حالة إذن الإشعارات في المتصفح. */
export function reminderPermission(): ReminderPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission as ReminderPermission;
}

/** طلب الإذن — يُستدعى من ضغط المستخدم لا من تحميل الصفحة. */
export async function askReminderPermission(): Promise<ReminderPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission !== "default") {
    return Notification.permission as ReminderPermission;
  }
  try {
    const result = await Notification.requestPermission();
    return result as ReminderPermission;
  } catch {
    return "denied";
  }
}

function lastSentDate(): string | null {
  try {
    return window.localStorage.getItem(LAST_SENT_KEY);
  } catch {
    return null;
  }
}

function markSentToday(): void {
  try {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    window.localStorage.setItem(
      LAST_SENT_KEY,
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    );
  } catch {
    // التخزين معطّل — نكتفي بالحالة في الجلسة.
  }
}

/** هل أُرسل تذكير اليوم؟ */
export function reminderSentToday(): boolean {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return lastSentDate() === today;
}

/** يعرض الإشعار الآن. */
export function showReminder(title: string, body: string): void {
  if (reminderPermission() !== "granted") return;

  try {
    new Notification(title, {
      body,
      icon: undefined,
      tag: "raha.evening",
    });
  } catch {
    // بعض المتصفحات تتطلّب Service Worker — نكتفي بالتنبيه داخل التطبيق.
  }
}

/** الوقت القادم لتذكير بصيغة HH:mm. */
export function nextReminderTime(
  time: string,
  from: Date = new Date(),
): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const target = new Date(from);
  target.setHours(hours || 0, minutes || 0, 0, 0);
  return target;
}

export interface ReminderOptions {
  /** HH:mm — وقت الإشعار. */
  time: string;
  title: string;
  body: string;
  /** يُستدعى بعد إطلاق التذكير — لتحديث الواجهة. */
  onFire?: () => void;
}

/**
 * يجدول التذكير: إشعار واحد في الموعد، ثم يُعاد التسليح لليلة التالية.
 * يُعيد دالة إلغاء.
 */
export function scheduleEveningReminder(
  options: ReminderOptions,
): () => void {
  if (typeof window === "undefined") return () => {};

  let timer: number | null = null;

  const arm = () => {
    if (timer !== null) window.clearTimeout(timer);

    const now = new Date();
    const target = nextReminderTime(options.time, now);
    const delta = target.getTime() - now.getTime();

    let delay: number;

    if (delta > 0) {
      delay = delta;
    } else if (delta > -GRACE_MS) {
      // فُتح التطبيق بعد الموعد بقليل — نُرسل التذكير حالاً لا غداً.
      delay = 1_500;
    } else {
      const tomorrow = new Date(target);
      tomorrow.setDate(tomorrow.getDate() + 1);
      delay = tomorrow.getTime() - now.getTime();
    }

    if (delay > MAX_TIMEOUT) {
      timer = window.setTimeout(arm, MAX_TIMEOUT);
      return;
    }

    timer = window.setTimeout(() => {
      if (!reminderSentToday()) {
        showReminder(options.title, options.body);
        markSentToday();
      }
      options.onFire?.();
      arm();
    }, delay);
  };

  arm();

  return () => {
    if (timer !== null) window.clearTimeout(timer);
  };
}
