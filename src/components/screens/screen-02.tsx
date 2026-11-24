"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BRAND } from "@/lib/brand";
import { PROFILE, formatAge } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import {
  DEMO_BIRTH_DATE,
  ageInDays,
  ageParts,
  isProfileComplete,
  useProfile,
  type ProfileAnswers,
} from "@/lib/store/profile";

const TOTAL_STEPS = 4;
const HOME_NOTICE_MS = 2600;

// ------------------------- حالة البداية -------------------------
// تُقرأ مرة واحدة بعد التركيب: الملف المحفوظ وتاريخ اليوم المحلي.
// على الخادم نعيد قيماً افتراضية فقط حتى لا يُقرأ وقت أثناء prerender.

type InitialState = {
  answers: ProfileAnswers;
  step: number;
  done: boolean;
  today: string; // ISO محلي — فارغ على الخادم
};

function localTodayIso(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function dateFromIso(iso: string): Date | null {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function readInitialState(): InitialState {
  const demoAnswers: ProfileAnswers = {
    birthDate: DEMO_BIRTH_DATE,
    worstProblem: "",
    wakePattern: "",
    priorityGoal: "",
  };

  if (typeof window === "undefined") {
    return { answers: demoAnswers, step: 1, done: false, today: "" };
  }

  const stored = useProfile.getState();
  const answers: ProfileAnswers = {
    birthDate: stored.birthDate || DEMO_BIRTH_DATE,
    worstProblem: stored.worstProblem,
    wakePattern: stored.wakePattern,
    priorityGoal: stored.priorityGoal,
  };
  const complete = isProfileComplete(stored);

  return {
    answers,
    step: complete ? TOTAL_STEPS : 1,
    done: complete,
    today: localTodayIso(),
  };
}

// بوابة التركيب: الخادم يعرض الهيكل، والعميل يعرض الحالة المحفوظة فوراً.
function subscribeToHydration(): () => void {
  return () => {};
}
function getHydrated(): boolean {
  return true;
}
function getHydratedOnServer(): boolean {
  return false;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 rtl:rotate-180"
    >
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}

function formatDate(iso: string, lang: "ar" | "en"): string {
  const date = dateFromIso(iso);
  if (!date) return iso;

  return new Intl.DateTimeFormat(lang === "ar" ? "ar-u-nu-latn" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())));
}

function OptionCard({
  title,
  hint,
  selected,
  onSelect,
}: {
  title: string;
  hint?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex min-h-11 w-full items-start gap-3 rounded-2xl border p-4 text-start transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
        selected
          ? "border-gold bg-gold/10"
          : "border-nline bg-ncard hover:border-nedge"
      }`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
          selected
            ? "border-gold bg-gold text-goldink"
            : "border-nedge text-transparent"
        }`}
      >
        <CheckIcon className="h-3 w-3" />
      </span>
      <span className="min-w-0">
        <span
          className={`block text-base leading-snug ${
            selected ? "text-gold" : "text-nhi"
          }`}
        >
          {title}
        </span>
        {hint ? (
          <span className="mt-1 block text-sm leading-relaxed text-nlo">
            {hint}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function Screen02() {
  const lang = useLang();
  const t = PROFILE[lang];
  const router = useRouter();
  const saveProfile = useProfile((state) => state.saveProfile);
  const headingId = useId();

  const [initial] = useState(readInitialState);
  const [answers, setAnswers] = useState<ProfileAnswers>(initial.answers);
  const [step, setStep] = useState(initial.step);
  const [done, setDone] = useState(initial.done);
  const [notice, setNotice] = useState(false);
  const noticeTimer = useRef<number | null>(null);

  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrated,
    getHydratedOnServer,
  );

  // اللغة والاتجاه على مستوى الوثيقة — كما في الشاشة 01.
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
    document.title =
      lang === "ar"
        ? `${BRAND.arabic} — ${t.docTitle}`
        : `${BRAND.latin} — ${t.docTitle}`;
  }, [lang, t.docTitle]);

  useEffect(() => {
    return () => {
      if (noticeTimer.current !== null) {
        window.clearTimeout(noticeTimer.current);
      }
    };
  }, []);

  if (!hydrated) {
    return (
      <main className="flex min-h-dvh justify-center bg-night-deep">
        <div className="flex min-h-dvh w-full max-w-[420px] items-center justify-center bg-night px-6">
          <div
            aria-hidden="true"
            className="raha-moon"
            style={{ width: 24, height: 24 }}
          />
        </div>
      </main>
    );
  }

  const todayDate = initial.today ? dateFromIso(initial.today) : null;
  const birthDays =
    answers.birthDate && todayDate
      ? ageInDays(answers.birthDate, todayDate)
      : null;
  const parts =
    answers.birthDate && todayDate
      ? ageParts(answers.birthDate, todayDate)
      : null;
  const dateValid = birthDays !== null && birthDays >= 0;

  const canContinue =
    step === 1
      ? dateValid
      : step === 2
        ? answers.worstProblem !== ""
        : step === 3
          ? answers.wakePattern !== ""
          : answers.priorityGoal !== "";

  const problemOptions = [
    {
      value: "frequent-wakes",
      title: t.problemFrequentWakes,
      hint: t.problemFrequentWakesHint,
    },
    {
      value: "late-sleep",
      title: t.problemLateSleep,
      hint: t.problemLateSleepHint,
    },
    {
      value: "held-sleep",
      title: t.problemHeldSleep,
      hint: t.problemHeldSleepHint,
    },
  ] as const;

  const wakeOptions = [
    { value: "two-three-fixed", title: t.wakeTwoThree },
    { value: "frequent-random", title: t.wakeFrequentRandom },
    { value: "early-riser", title: t.wakeEarlyRiser },
  ] as const;

  const goalOptions = [
    { value: "sleep-through", title: t.goalSleepThrough },
    { value: "self-settle", title: t.goalSelfSettle },
    { value: "earlier-bedtime", title: t.goalEarlierBedtime },
  ] as const;

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      return;
    }
    router.push("/");
  };

  const goForward = () => {
    if (!canContinue) return;

    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }

    if (!isProfileComplete(answers)) return;
    saveProfile(answers);
    setDone(true);
  };

  const showPlanTomorrow = () => {
    setNotice(true);
    noticeTimer.current = window.setTimeout(() => {
      router.push("/");
    }, HOME_NOTICE_MS);
  };

  const selectedProblem = problemOptions.find(
    (option) => option.value === answers.worstProblem,
  )?.title;
  const selectedWake = wakeOptions.find(
    (option) => option.value === answers.wakePattern,
  )?.title;
  const selectedGoal = goalOptions.find(
    (option) => option.value === answers.priorityGoal,
  )?.title;

  return (
    <main className="flex min-h-dvh justify-center bg-night-deep">
      <div className="flex min-h-dvh w-full max-w-[420px] flex-col bg-night px-6 pt-6 pb-8 sm:my-8 sm:min-h-[min(860px,calc(100dvh-4rem))] sm:rounded-[2.5rem] sm:border sm:border-frame sm:px-7">
        {done ? (
          <>
            <header className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="raha-moon shrink-0"
                style={{ width: 18, height: 18 }}
              />
              <span className="text-sm text-nlo">
                {lang === "ar" ? BRAND.arabic : BRAND.latin}
              </span>
            </header>

            <div className="mt-10 flex flex-col items-center text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-gold/15 text-gold ring-1 ring-gold/30">
                <CheckIcon className="h-7 w-7" />
              </span>
              <p className="mt-6 text-xs tracking-[0.18em] text-gold">
                {t.doneEyebrow}
              </p>
              <h1 className="mt-3 text-2xl leading-snug font-medium text-nhi">
                {t.doneTitle}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-nlo">
                {t.doneIntro}
              </p>
            </div>

            <dl className="mt-8 divide-y divide-nline/70 rounded-2xl border border-nline bg-ncard px-4">
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="shrink-0 text-xs text-ndim">{t.summaryBirth}</dt>
                <dd className="text-sm text-nmd">
                  <span dir="ltr" className="ltr-inline">
                    {formatDate(answers.birthDate, lang)}
                  </span>
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="shrink-0 text-xs text-ndim">
                  {t.summaryProblem}
                </dt>
                <dd className="text-end text-sm text-nmd">{selectedProblem}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="shrink-0 text-xs text-ndim">{t.summaryWake}</dt>
                <dd className="text-end text-sm text-nmd">{selectedWake}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="shrink-0 text-xs text-ndim">{t.summaryGoal}</dt>
                <dd className="text-end text-sm text-nmd">{selectedGoal}</dd>
              </div>
            </dl>

            <div className="mt-auto pt-8">
              {notice ? (
                <p
                  role="status"
                  className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-center text-sm leading-relaxed text-gold"
                >
                  {t.planTomorrow}
                </p>
              ) : (
                <Button
                  type="button"
                  onClick={showPlanTomorrow}
                  className="h-12 w-full rounded-full bg-gold px-6 text-base font-normal text-goldink hover:bg-gold/90 focus-visible:ring-gold/60"
                >
                  {t.doneCta}
                </Button>
              )}

              <Link
                href="/"
                className="mt-4 block text-center text-xs text-ndim underline-offset-4 hover:text-nlo hover:underline"
              >
                {t.home}
              </Link>
              <p className="mt-3 text-center text-xs leading-relaxed text-ndim">
                {t.doneNote}
              </p>
            </div>
          </>
        ) : (
          <>
            <header className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goBack}
                aria-label={t.back}
                className="inline-flex h-11 items-center gap-2 rounded-full px-2 text-sm text-nlo transition-colors duration-200 hover:text-nhi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              >
                <BackIcon />
                <span>{t.back}</span>
              </button>

              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="raha-moon shrink-0"
                  style={{ width: 18, height: 18 }}
                />
                <span className="text-sm text-nlo">
                  {lang === "ar" ? BRAND.arabic : BRAND.latin}
                </span>
              </div>
            </header>

            <div className="mt-8">
              <p className="text-xs leading-relaxed text-ndim">
                {t.progressLead}{" "}
                <span dir="ltr" className="ltr-inline text-nlo">
                  {step}
                </span>{" "}
                {t.progressTail}
              </p>
              <Progress
                dir="ltr"
                value={(step / TOTAL_STEPS) * 100}
                aria-label={t.progressAria}
                className="mt-3 h-1.5 bg-nchip [&_[data-slot=progress-indicator]]:bg-gold"
              />
            </div>

            <div key={step} className="mt-8 flex flex-1 flex-col">
              {step === 1 ? (
                <>
                  <h2
                    id={headingId}
                    className="text-2xl leading-snug font-medium text-nhi"
                  >
                    {t.step1Title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-nlo">
                    {t.step1Hint}
                  </p>

                  <label className="mt-6 block">
                    <span className="mb-2 block text-xs text-ndim">
                      {t.birthDateLabel}
                    </span>
                    <input
                      type="date"
                      dir="ltr"
                      value={answers.birthDate}
                      max={initial.today || undefined}
                      onChange={(event) =>
                        setAnswers((current) => ({
                          ...current,
                          birthDate: event.target.value,
                        }))
                      }
                      aria-label={t.birthDateLabel}
                      className="h-14 w-full rounded-2xl border border-nline bg-ncard px-4 text-lg text-nhi transition-colors [color-scheme:dark] focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/30 focus-visible:outline-none"
                    />
                  </label>

                  {parts && dateValid ? (
                    <p
                      aria-live="polite"
                      className="mt-4 rounded-2xl bg-gold/10 px-4 py-3 text-sm leading-relaxed text-gold"
                    >
                      {formatAge(lang, parts.months, parts.days)}
                    </p>
                  ) : answers.birthDate ? (
                    <p className="mt-4 text-sm text-nlo">{t.ageInvalid}</p>
                  ) : null}
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <h2
                    id={headingId}
                    className="text-2xl leading-snug font-medium text-nhi"
                  >
                    {t.step2Title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-nlo">
                    {t.step2Hint}
                  </p>

                  <div
                    role="radiogroup"
                    aria-labelledby={headingId}
                    className="mt-6 space-y-3"
                  >
                    {problemOptions.map((option) => (
                      <OptionCard
                        key={option.value}
                        title={option.title}
                        hint={option.hint}
                        selected={answers.worstProblem === option.value}
                        onSelect={() =>
                          setAnswers((current) => ({
                            ...current,
                            worstProblem: option.value,
                          }))
                        }
                      />
                    ))}
                  </div>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <h2
                    id={headingId}
                    className="text-2xl leading-snug font-medium text-nhi"
                  >
                    {t.step3Title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-nlo">
                    {t.step3Hint}
                  </p>

                  <div
                    role="radiogroup"
                    aria-labelledby={headingId}
                    className="mt-6 space-y-3"
                  >
                    {wakeOptions.map((option) => (
                      <OptionCard
                        key={option.value}
                        title={option.title}
                        selected={answers.wakePattern === option.value}
                        onSelect={() =>
                          setAnswers((current) => ({
                            ...current,
                            wakePattern: option.value,
                          }))
                        }
                      />
                    ))}
                  </div>
                </>
              ) : null}

              {step === 4 ? (
                <>
                  <h2
                    id={headingId}
                    className="text-2xl leading-snug font-medium text-nhi"
                  >
                    {t.step4Title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-nlo">
                    {t.step4Hint}
                  </p>

                  <div
                    role="radiogroup"
                    aria-labelledby={headingId}
                    className="mt-6 space-y-3"
                  >
                    {goalOptions.map((option) => (
                      <OptionCard
                        key={option.value}
                        title={option.title}
                        selected={answers.priorityGoal === option.value}
                        onSelect={() =>
                          setAnswers((current) => ({
                            ...current,
                            priorityGoal: option.value,
                          }))
                        }
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            <footer className="mt-auto pt-8">
              <Button
                type="button"
                onClick={goForward}
                disabled={!canContinue}
                className="h-12 w-full rounded-full bg-gold px-6 text-base font-normal text-goldink hover:bg-gold/90 focus-visible:ring-gold/60 disabled:bg-nchip disabled:text-ndim disabled:opacity-100"
              >
                {step < TOTAL_STEPS ? t.next : t.finish}
              </Button>
              <p className="mt-4 text-center text-xs leading-relaxed text-ndim">
                {t.privacyNote}
              </p>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
