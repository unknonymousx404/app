"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { WELCOME, type Lang } from "@/lib/i18n";
import { setLang, useLang } from "@/lib/lang";

// اللوك-أب: كامل بالعربية، والاسم اللاتيني وحده بالإنجليزية — من docs/brand.md.
function Lockup({ lang }: { lang: Lang }) {
  if (lang === "en") {
    return (
      <span className="font-latin font-light tracking-[0.08em]">
        {BRAND.latin}
      </span>
    );
  }

  return (
    <span dir="rtl" className="inline-flex items-baseline gap-2">
      <span className="font-arabic">{BRAND.arabic}</span>
      <span aria-hidden="true" className="text-gold/60">
        ·
      </span>
      <span className="font-latin font-light tracking-[0.08em]">
        {BRAND.latin}
      </span>
    </span>
  );
}

// أيقونة اللغات: كرة أرضية بخطوط طول، مرسومة بحدود currentColor.
function LanguagesIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

export default function Home() {
  const lang = useLang();
  const t = WELCOME[lang];
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

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

  // قائمة اللغات: تُغلق بالنقر خارجها أو بمفتاح Escape.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (next: Lang) => {
    setLang(next);
    setOpen(false);
  };

  const optionClass =
    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60";

  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-night-deep px-6 py-12">
      {/*
        هيدر أعلى اليسار: الهلال + الاسم + أيقونة اللغات.
        dir="ltr" يثبّت ترتيب العناصر فلا ينقلب مع لغة الواجهة،
        وحجز عرض اللوك-أب الكامل (غير مرئي) يمنع ازاحته عند التبديل.
      */}
      <header className="absolute top-6 left-6 z-10">
        <div dir="ltr" className="flex items-center gap-4">
          <div
            className="raha-moon shrink-0"
            aria-hidden="true"
            style={{ width: 28, height: 28 }}
          />

          <h1 className="grid text-base font-normal text-nhi sm:text-lg">
            <span
              aria-hidden="true"
              className="invisible col-start-1 row-start-1 whitespace-nowrap"
            >
              <Lockup lang="ar" />
            </span>
            <span
              key={lang}
              className="lockup-reveal col-start-1 row-start-1 whitespace-nowrap"
            >
              <Lockup lang={lang} />
            </span>
          </h1>

          {/* أيقونة واحدة تفتح قائمة اللغتين — بلا خيارات ظاهرة دائماً. */}
          <div ref={pickerRef} dir="ltr" className="relative shrink-0">
            <button
              type="button"
              onClick={() => setOpen((current) => !current)}
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-label={t.languageLabel}
              title={t.languageLabel}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-nline bg-nchip/50 text-nlo transition-colors duration-300 hover:border-nedge hover:text-nhi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 aria-expanded:border-nedge aria-expanded:text-gold"
            >
              <LanguagesIcon />
            </button>

            {open ? (
              <div
                role="listbox"
                aria-label={t.languageLabel}
                className="lang-menu absolute top-full left-0 mt-2 w-40 rounded-2xl border border-nline bg-ncard p-1 shadow-lg shadow-night-deep/60"
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={lang === "en"}
                  onClick={() => choose("en")}
                  className={`${optionClass} font-latin ${
                    lang === "en"
                      ? "text-gold"
                      : "text-nlo hover:bg-nsoft hover:text-nhi"
                  }`}
                >
                  <span>{t.englishLabel}</span>
                  {lang === "en" ? <CheckIcon /> : null}
                </button>

                <button
                  type="button"
                  role="option"
                  aria-selected={lang === "ar"}
                  onClick={() => choose("ar")}
                  className={`${optionClass} font-arabic ${
                    lang === "ar"
                      ? "text-gold"
                      : "text-nlo hover:bg-nsoft hover:text-nhi"
                  }`}
                >
                  <span>{t.arabicLabel}</span>
                  {lang === "ar" ? <CheckIcon /> : null}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* زر البداية + طريق المؤسسين — الاثنان في منتصف الصفحة */}
      <div className="flex w-full max-w-xs flex-col items-center gap-3">
        <Button
          asChild
          className="h-12 w-full rounded-full bg-gold px-8 text-base font-normal text-goldink hover:bg-gold/90 focus-visible:ring-gold/60"
        >
          <Link href="/profile">
            <span
              key={lang}
              className={`lang-swap ${lang === "en" ? "font-latin font-light" : "font-arabic"}`}
            >
              {t.startFree}
            </span>
          </Link>
        </Button>

        <Link
          href="/waitlist"
          className="flex min-h-11 items-center justify-center rounded-full px-4 text-sm text-nlo transition-colors duration-200 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        >
          {t.foundingLink}
        </Link>
      </div>
    </main>
  );
}
