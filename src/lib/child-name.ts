"use client";

import { useDemoMode } from "@/lib/demo";
import { CHILD_NAMES, type Lang } from "@/lib/i18n";
import { useLang } from "@/lib/lang";

// اسم الطفل في الواجهة. الملف النامي لا يحمل حقلاً للاسم (أربعة حقول فقط —
// docs/screens.md §2)، فاسم العائلة المرجعية لا يظهر إلا في وضع العرض،
// والمستخدم الحقيقي يُخاطب بـ«طفلك» من دون أن يُضاف سؤال خامس للمعالج.

export function childName(lang: Lang, demo: boolean): string {
  return demo ? CHILD_NAMES[lang].demo : CHILD_NAMES[lang].generic;
}

export function useChildName(): string {
  const lang = useLang();
  const demo = useDemoMode();
  return childName(lang, demo);
}
