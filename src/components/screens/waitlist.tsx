"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { WAITLIST } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import {
  WAITLIST_FORM,
  saveWaitlistEmail,
  validateWaitlistEmail,
} from "@/lib/waitlist";

type Status =
  | "idle"
  | "submitting"
  | "empty"
  | "invalid"
  | "saved"
  | "saved-local"
  | "network";

/**
 * صفحة الانتظار /waitlist — نسخة مبكرة من روح الشاشة 10.
 * لا دفع اليوم: البريد يُحفظ محلياً دائماً، ويُرسل إلى Google Form إن رُبط.
 */
export function WaitlistScreen() {
  const lang = useLang();
  const t = WAITLIST[lang];
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";

    document.title =
      lang === "ar"
        ? `${BRAND.arabic} — ${t.docTitle}`
        : `${BRAND.latin} — ${t.docTitle}`;
  }, [lang, t.docTitle]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;

    const validation = validateWaitlistEmail(email);
    if (validation !== "ok") {
      setStatus(validation);
      return;
    }

    setStatus("submitting");

    // النسخة المحلية احتياطية دائماً — حتى لو فشل الإرسال أو لم يُربط النموذج.
    saveWaitlistEmail(email);

    if (WAITLIST_FORM.endpoint && WAITLIST_FORM.entry) {
      try {
        const body = new URLSearchParams();
        body.set(WAITLIST_FORM.entry, email.trim());

        // no-cors مقصود: Google Forms لا يرسل ترويسات CORS، والرد غير مقروء.
        await fetch(WAITLIST_FORM.endpoint, {
          method: "POST",
          mode: "no-cors",
          body,
        });

        setStatus("saved");
        setEmail("");
      } catch {
        setStatus("network");
      }
      return;
    }

    // بلا ربط بعد: رابط النموذج العام يُفتح في تبويب جديد، والمحلي يبقى.
    if (WAITLIST_FORM.viewUrl) {
      window.open(WAITLIST_FORM.viewUrl, "_blank", "noopener,noreferrer");
    }

    setStatus("saved-local");
    setEmail("");
  };

  const messages: Record<Status, string | null> = {
    idle: null,
    submitting: t.submitting,
    empty: t.empty,
    invalid: t.invalid,
    saved: t.saved,
    "saved-local": t.savedLocal,
    network: t.networkError,
  };

  const message = messages[status];
  const isError = status === "empty" || status === "invalid" || status === "network";

  return (
    <main className="flex min-h-dvh justify-center bg-night-deep sm:items-center">
      <div className="flex min-h-dvh w-full max-w-[420px] flex-col bg-night sm:min-h-[min(860px,calc(100dvh-4rem))] sm:rounded-[2.5rem] sm:border sm:border-frame">
        <div className="flex flex-1 flex-col justify-center px-7 py-12">
          <div className="flex flex-col items-center text-center">
            <span aria-hidden="true" className="raha-moon" />

            <p className="mt-4 font-arabic text-lg text-nhi">
              <span dir="rtl">{BRAND.lockup}</span>
            </p>

            <h1 className="mt-8 text-2xl leading-snug font-medium text-nhi">
              {t.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-nlo">
              {t.subtitle}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-gold">
              {t.promise}
            </p>
          </div>

          <form onSubmit={onSubmit} noValidate className="mt-8">
            <label
              htmlFor="waitlist-email"
              className="block text-sm text-nmd"
            >
              {t.emailLabel}
            </label>

            <input
              id="waitlist-email"
              name="email"
              type="email"
              dir="ltr"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (isError) setStatus("idle");
              }}
              placeholder={t.emailPlaceholder}
              aria-invalid={isError}
              aria-describedby="waitlist-status"
              className="mt-2 h-12 w-full rounded-2xl border border-nline bg-nsoft px-4 text-sm text-nhi placeholder:text-ndim focus-visible:border-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 aria-invalid:border-gold/60"
            />

            <Button
              type="submit"
              disabled={status === "submitting"}
              className="mt-3 h-12 w-full rounded-full bg-gold px-6 text-base font-normal text-goldink hover:bg-gold/90 focus-visible:ring-gold/60 disabled:opacity-70"
            >
              {status === "submitting" ? t.submitting : t.submit}
            </Button>

            <p
              id="waitlist-status"
              role="status"
              aria-live="polite"
              className={`mt-3 min-h-[1.25rem] text-center text-xs leading-relaxed ${
                isError ? "text-gold" : "text-ngreen"
              }`}
            >
              {message}
            </p>
          </form>

          <div className="mt-8 flex justify-center">
            <Link
              href="/"
              className="flex min-h-11 items-center rounded-full px-4 text-sm text-nlo transition-colors duration-200 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              {t.viewProduct}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
