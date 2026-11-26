"use client";

import { DemoBadge } from "@/components/demo-badge";

import { useEffect } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { OFFER } from "@/lib/i18n";
import { useLang } from "@/lib/lang";

/**
 * الشاشة 10 — العرض والاشتراك: السعر بعدالة معلنة.
 * البنية والنصوص حرفياً من docs/screens.md § الشاشة 10.
 * لا دفع اليوم: زرّ الاحتياط يفتح صفحة الانتظار (/waitlist).
 */
export function Screen10() {
  const lang = useLang();
  const t = OFFER[lang];

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";

    const brand = lang === "ar" ? BRAND.arabic : BRAND.latin;
    const title = `${brand} — ${t.docTitle}`;
    document.title = title;

    const timer = window.setTimeout(() => {
      document.title = title;
      const titles = Array.from(document.querySelectorAll("title"));
      for (const extra of titles.slice(1)) extra.remove();
    }, 150);

    return () => window.clearTimeout(timer);
  }, [lang, t.docTitle]);

  const comparison = [
    {
      id: "consultant",
      label: t.compareConsultantLabel,
      price: t.compareConsultantPrice,
      highlight: false,
    },
    {
      id: "course",
      label: t.compareCourseLabel,
      price: t.compareCoursePrice,
      highlight: false,
    },
    {
      id: "tracking",
      label: t.compareTrackingLabel,
      price: t.compareTrackingPrice,
      highlight: false,
    },
    {
      id: "coach",
      label: t.compareCoachLabel,
      price: t.compareCoachPrice,
      highlight: false,
    },
    {
      id: "raha",
      label: t.compareRahaLabel,
      price: t.compareRahaPrice,
      highlight: true,
    },
  ];

  return (
    <main className="flex h-dvh justify-center bg-night-deep sm:items-center">
      <div className="flex h-dvh w-full max-w-[420px] flex-col bg-night sm:h-[min(860px,calc(100dvh-4rem))] sm:rounded-[2.5rem] sm:border sm:border-frame">
        <div className="no-scrollbar flex-1 overflow-y-auto px-6 pt-6 pb-8 sm:px-7">
          <DemoBadge />

          <header>
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="raha-moon shrink-0"
                style={{ width: 17, height: 17 }}
              />
              <span className="text-sm text-nlo">
                {lang === "ar" ? BRAND.arabic : BRAND.latin}
              </span>
            </div>

            <h1 className="mt-5 text-2xl leading-snug font-medium text-nhi">
              {t.title}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-nlo">
              {t.subtitle}
            </p>
          </header>

          {/* البطاقة الذهبية — العضوية المؤسِّسة */}
          <section
            aria-labelledby="founding-title"
            className="mt-6 rounded-3xl border border-gold/30 p-5"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--color-nblue), var(--color-nsoft))",
            }}
          >
            <div className="flex items-center gap-2 text-gold">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              <h2 id="founding-title" className="text-base font-medium">
                {t.foundingEyebrow}
              </h2>
            </div>

            <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span
                dir="ltr"
                className="ltr-inline font-latin text-4xl leading-none text-gold"
              >
                {t.foundingPrice}
              </span>
              <span className="text-sm text-nmd">{t.foundingUnit}</span>
            </p>

            <p className="mt-3 text-sm leading-relaxed text-nmd">
              {t.foundingBody}
            </p>
          </section>

          {/* بطاقة الاشتراك العادي */}
          <section
            aria-labelledby="subscription-title"
            className="mt-4 rounded-3xl border border-nline bg-ncard p-5"
          >
            <h2
              id="subscription-title"
              className="text-base font-medium text-nhi"
            >
              {t.subscriptionTitle}
            </h2>

            <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span
                dir="ltr"
                className="ltr-inline font-latin text-3xl leading-none text-nhi"
              >
                {t.subscriptionPrice}
              </span>
              <span className="text-sm text-nlo">{t.subscriptionUnit}</span>
            </p>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-gold/25 bg-gold/10 px-3.5 py-3">
              <span className="text-sm leading-relaxed text-nmd">
                {t.annualLine}
              </span>
              <span className="shrink-0 rounded-full bg-gold px-2.5 py-1 text-[11px] leading-none font-medium text-goldink">
                {t.annualBadge}
              </span>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-ngreen">
              {t.savingLine}
            </p>
          </section>

          {/* بطاقة المقارنة المعلنة — خمسة أسطر، السطر الذهبي لراحة */}
          <section
            aria-labelledby="compare-title"
            className="mt-4 rounded-3xl border border-nline bg-ncard p-5"
          >
            <h2 id="compare-title" className="text-base font-medium text-nhi">
              {t.compareTitle}
            </h2>

            <ul className="mt-3">
              {comparison.map((row, index) => (
                <li
                  key={row.id}
                  className={`flex items-start justify-between gap-3 py-2.5 ${
                    index === comparison.length - 1
                      ? ""
                      : "border-b border-nline/60"
                  }`}
                >
                  <span
                    className={`min-w-0 text-sm leading-snug ${
                      row.highlight ? "text-gold" : "text-nmd"
                    }`}
                  >
                    {row.label}
                  </span>
                  <span
                    className={`shrink-0 text-sm ${
                      row.highlight ? "text-gold" : "text-nlo"
                    }`}
                  >
                    {row.highlight ? (
                      row.price
                    ) : (
                      <span dir="ltr" className="ltr-inline">
                        {row.price}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-6">
            <Button
              asChild
              className="h-12 w-full rounded-full bg-gold px-6 text-base font-normal text-goldink hover:bg-gold/90 focus-visible:ring-gold/60"
            >
              <Link href="/waitlist">{t.cta}</Link>
            </Button>

            <p className="mt-3 text-center text-[11px] leading-relaxed text-ndim">
              {t.trustNote}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
