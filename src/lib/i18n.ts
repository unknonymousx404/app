// كل نصوص الواجهة تمر من هنا — عربي أولاً ومقابل إنجليزي معتمد.
// راجع docs/i18n.md قبل إضافة أي مفتاح جديد.

export type Lang = "ar" | "en";

const welcomeAr = {
  startFree: "ابدئي مجاناً — بلا بطاقة",
  languageLabel: "اختيار اللغة",
  arabicLabel: "العربية",
  englishLabel: "English",
} as const;

type WelcomeKeys = keyof typeof welcomeAr;

// TypeScript يفرض تطابق المفاتيح حرفياً بين اللغتين.
export const WELCOME: Record<Lang, Record<WelcomeKeys, string>> = {
  ar: welcomeAr,
  en: {
    startFree: "Start free — no card needed",
    languageLabel: "Choose language",
    arabicLabel: "العربية",
    englishLabel: "English",
  },
};
