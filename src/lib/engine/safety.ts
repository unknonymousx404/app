// قواعد الأمان للشاشة 07 — مطابقة حرفية جزئية قبل أي توليد للجواب.
// لا تشخيص طبي: العلم الأحمر يحوّل الأم بلطف إلى طبيب.
// القائمة تشمل الأعراض الأربعة المطلوبة صراحةً: حمى مستمرة، جفاف،
// صعوبة تنفس، وإصابة سقوط — مع مرادفات عربية وإنجليزية شائعة.

export const RED_FLAG_PHRASES = [
  // حمى
  "حمى",
  "حرارة",
  "حرارة عالية",
  "حرارة مرتفعة",
  "حرارة جسم",
  "fever",
  "high temperature",
  // جفاف
  "جفاف",
  "قلة التبول",
  "لا يتبول",
  "dehydration",
  "dehydrated",
  "no wet diaper",
  "not urinating",
  // صعوبة تنفس
  "صعوبة تنفس",
  "صعوبة في التنفس",
  "ضيق تنفس",
  "ضيق في التنفس",
  "difficulty breathing",
  "trouble breathing",
  "shortness of breath",
  "cannot breathe",
  "can't breathe",
  // إصابة سقوط
  "إصابة سقوط",
  "سقوط",
  "سقط",
  "ضربة على الرأس",
  "ارتجاج",
  "fall injury",
  "head injury",
  "hit his head",
  "hit her head",
  "hit their head",
  "fell from",
  "fell off",
  "concussion",
  // أعلام حمراء قائمة من قبل
  "رفض الأكل المتكرر",
  "خمول غير معتاد",
  "بكاء ألم حاد مستمر",
  "repeated refusal to eat",
  "unusual lethargy",
  "persistent severe pain cry",
] as const;

export function hasRedFlag(question: string): boolean {
  const normalized = question
    .trim()
    .toLocaleLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "");
  return RED_FLAG_PHRASES.some((phrase) => normalized.includes(phrase));
}
