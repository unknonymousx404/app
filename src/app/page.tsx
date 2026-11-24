"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { WELCOME } from "@/lib/i18n";
import { setLang, useLang } from "@/lib/lang";

export default function Home() {
  const lang = useLang();
  const t = WELCOME[lang];

  // قلب الوثيقة كاملة عند تبديل اللغة — راجع docs/i18n.md.
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const langButton =
    "h-11 min-w-24 rounded-full px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-night-deep px-6 py-12 text-center">
      <div className="raha-moon" aria-hidden="true" />

      <h1 className="text-2xl font-extrabold tracking-tight text-nhi sm:text-3xl">
        {BRAND.lockup}
      </h1>

      <Button
        asChild
        className="h-12 w-full max-w-xs rounded-full bg-gold px-8 text-base font-extrabold text-goldink hover:bg-gold/90 focus-visible:ring-gold/60"
      >
        <a href="#">{t.startFree}</a>
      </Button>

      <div
        role="group"
        aria-label={t.languageLabel}
        className="flex items-center gap-1 rounded-full bg-nchip p-1"
      >
        <button
          type="button"
          onClick={() => setLang("ar")}
          aria-pressed={lang === "ar"}
          className={`${langButton} ${
            lang === "ar"
              ? "bg-gold text-goldink"
              : "text-nlo hover:text-nhi"
          }`}
        >
          {t.arabicLabel}
        </button>
        <button
          type="button"
          onClick={() => setLang("en")}
          aria-pressed={lang === "en"}
          className={`${langButton} ${
            lang === "en"
              ? "bg-gold text-goldink"
              : "text-nlo hover:text-nhi"
          }`}
        >
          {t.englishLabel}
        </button>
      </div>
    </main>
  );
}
