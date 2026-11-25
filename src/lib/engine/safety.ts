// قواعد الأمان للشاشة 07 — مطابقة حرفية جزئية قبل أي توليد للجواب.
// لا تشخيص طبي: العلم الأحمر يحوّل الأم بلطف إلى طبيب.

export const RED_FLAG_PHRASES = [
  "حرارة",
  "صعوبة تنفس",
  "رفض الأكل المتكرر",
  "خمول غير معتاد",
  "بكاء ألم حاد مستمر",
  "fever",
  "difficulty breathing",
  "repeated refusal to eat",
  "unusual lethargy",
  "persistent severe pain cry",
] as const;

export function hasRedFlag(question: string): boolean {
  const normalized = question.trim().toLocaleLowerCase();
  return RED_FLAG_PHRASES.some((phrase) => normalized.includes(phrase));
}
