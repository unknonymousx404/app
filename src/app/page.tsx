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
    document.title = lang === "ar" ? BRAND.storeAr : BRAND.storeEn;

    const description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    description?.setAttribute(
      "content",
      lang === "ar" ? BRAND.taglineAr : BRAND.taglineEn,
    );
  }, [lang]);

  const langButton =
    "relative z-10 h-11 rounded-full text-sm font-bold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-night-deep px-6 py-12 text-center">
      <div className="raha-moon" aria-hidden="true" />

      <h1
        key={lang}
        className="lang-swap text-2xl font-extrabold tracking-tight text-nhi sm:text-3xl"
      >
        {lang === "ar" ? BRAND.lockup : BRAND.latin}
      </h1>

      <Button
        asChild
        className="h-12 w-full max-w-xs rounded-full bg-gold px-8 text-base font-extrabold text-goldink hover:bg-gold/90 focus-visible:ring-gold/60"
      >
        <a href="#">
          <span key={lang} className="lang-swap">
            {t.startFree}
          </span>
        </a>
      </Button>

      {/*
        المبدل ثابت الاتجاه والترتيب: الإنجليزية يساراً والعربية يميناً في اللغتين،
        والمؤشر الذهبي ينزلق بين الخيارين بدل أن يتحرك المبدل نفسه.
      */}
      <div
        dir="ltr"
        role="group"
        aria-label={t.languageLabel}
        className="relative grid w-60 grid-cols-2 rounded-full bg-nchip p-1"
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%_-_0.25rem)] rounded-full bg-gold shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none ${
            lang === "en" ? "translate-x-0" : "translate-x-full"
          }`}
        />

        <button
          type="button"
          onClick={() => setLang("en")}
          aria-pressed={lang === "en"}
          className={`${langButton} ${
            lang === "en" ? "text-goldink" : "text-nlo hover:text-nhi"
          }`}
        >
          {t.englishLabel}
        </button>
        <button
          type="button"
          onClick={() => setLang("ar")}
          aria-pressed={lang === "ar"}
          className={`${langButton} ${
            lang === "ar" ? "text-goldink" : "text-nlo hover:text-nhi"
          }`}
        >
          {t.arabicLabel}
        </button>
      </div>
    </main>
  );
}
