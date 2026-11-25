"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { TabBar } from "@/components/nav/tabbar";
import { NightTasksCard } from "@/components/screens/night-tasks-card";
import { Button } from "@/components/ui/button";
import { ageParts, localIsoDate } from "@/lib/age";
import { BRAND } from "@/lib/brand";
import { survivalGuideForAge } from "@/lib/content/library";
import { ageRulesForMonths } from "@/lib/engine/age-rules";
import {
  applyAdjustments,
  proposeAdjustments,
  type AdjustmentElement,
  type AdjustmentRecord,
} from "@/lib/engine/adjuster";
import { buildFirstPlan, type FirstPlan } from "@/lib/engine/first-plan";
import {
  ADJUSTMENTS,
  fillText,
  formatAdjustmentReason,
  formatAgeMonths,
  type Lang,
} from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { DEMO_PROFILE, isProfileComplete, useProfile } from "@/lib/store/profile";
import { usePlan } from "@/lib/store/plan";
import {
  useNights,
  type MorningMood,
} from "@/lib/store/nights";
import {
  groupByDate,
  recordsForDate,
  useAdjustments,
} from "@/lib/store/adjustments";

// بوابة التركيب: الخادم يعرض الهيكل، والعميل يعرض خطة اليوم المعدّلة.
function subscribeToHydration(): () => void {
  return () => {};
}
function getHydrated(): boolean {
  return true;
}
function getHydratedOnServer(): boolean {
  return false;
}

const HISTORY_PAGE_SIZE = 3;

function elementLabel(lang: Lang, element: AdjustmentElement): string {
  const t = ADJUSTMENTS[lang];
  if (element === "bedtime") return t.elementBedtime;
  if (element === "nap") return t.elementNap;
  if (element === "feed") return t.elementFeed;
  return t.elementRoutine;
}

function statusLabel(lang: Lang, record: AdjustmentRecord): string {
  const t = ADJUSTMENTS[lang];
  if (record.status === "rejected") return t.statusRejected;
  if (record.status === "applied") return t.statusApplied;
  return t.statusPending;
}

/** «قبل ← بعد» بأرقام لاتينية معزولة داخل الصفحة RTL. */
function TimePair({
  lang,
  from,
  to,
  aria,
}: {
  lang: Lang;
  from: string;
  to: string;
  aria: string;
}) {
  return (
    <span
      aria-label={aria}
      className="inline-flex items-center gap-2 text-2xl leading-none font-medium tabular-nums"
    >
      <span dir="ltr" className="text-nlo ltr-inline">
        {from}
      </span>
      <ArrowLeft
        aria-hidden="true"
        className={`h-4 w-4 shrink-0 text-gold ${lang === "en" ? "rotate-180" : ""}`}
      />
      <span dir="ltr" className="text-gold ltr-inline">
        {to}
      </span>
    </span>
  );
}

function AdjustmentCard({
  lang,
  record,
  onReject,
}: {
  lang: Lang;
  record: AdjustmentRecord;
  onReject: (record: AdjustmentRecord) => void;
}) {
  const t = ADJUSTMENTS[lang];
  const rejected = record.status === "rejected";
  const label = elementLabel(lang, record.element);
  const titleId = `adjustment-${record.id}`;

  const statusTone =
    record.status === "rejected"
      ? "border-nline bg-nsoft/60 text-ndim"
      : record.status === "applied"
        ? "border-ngreen/30 bg-ngreen/10 text-ngreen"
        : "border-gold/30 bg-gold/10 text-gold";

  return (
    <section
      aria-labelledby={titleId}
      className={`mt-4 rounded-3xl border p-4 ${
        rejected ? "border-nline bg-nsoft/50" : "border-gold/30 bg-ncard"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id={titleId}
          className={`rounded-full px-2.5 py-1 text-xs leading-none ${
            rejected ? "bg-nchip/60 text-nlo" : "bg-gold/10 text-gold"
          }`}
        >
          {label}
        </h2>
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] leading-none ${statusTone}`}
        >
          {statusLabel(lang, record)}
        </span>
      </div>

      <div className={`mt-3 ${rejected ? "opacity-70" : ""}`}>
        <TimePair
          lang={lang}
          from={record.from}
          to={record.to}
          aria={fillText(t.changeAria, { from: record.from, to: record.to })}
        />
      </div>

      <p className="mt-3 text-[11px] font-medium text-gold">{t.reasonLabel}</p>
      <p className="mt-1 text-sm leading-relaxed text-nmd">
        {formatAdjustmentReason(lang, record)}
      </p>

      {rejected ? null : (
        <Button
          type="button"
          onClick={() => onReject(record)}
          aria-label={fillText(t.rejectAria, {
            element: label,
            from: record.from,
            to: record.to,
          })}
          className="mt-4 h-11 w-full rounded-full border border-nedge bg-nchip/40 px-4 text-sm font-normal text-nmd hover:bg-nchip hover:text-nhi focus-visible:ring-gold/60"
        >
          <X aria-hidden="true" className="h-4 w-4" />
          {t.rejectCta}
        </Button>
      )}
    </section>
  );
}

/** بطاقة حالة اليوم حين لا تعديل: تثبيت، استقرار، أو نقص ليالٍ. */
function ModeCard({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone?: string;
}) {
  return (
    <section
      aria-labelledby="adjustment-mode-title"
      className="mt-6 rounded-3xl border border-nline bg-ncard p-5"
    >
      <h2
        id="adjustment-mode-title"
        className="text-base leading-snug font-medium text-nhi"
      >
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-nmd">{body}</p>
      {tone ? (
        <p className="mt-3 border-t border-nline/70 pt-3 text-xs leading-relaxed text-ndim">
          {tone}
        </p>
      ) : null}
    </section>
  );
}

export function Screen06() {
  const lang = useLang();
  const t = ADJUSTMENTS[lang];
  const profile = useProfile();
  const storedPlan = usePlan((state) => state.plan);
  const storedBase = usePlan((state) => state.base);
  const savePlan = usePlan((state) => state.savePlan);
  const clearPlan = usePlan((state) => state.clearPlan);
  const nights = useNights((state) => state.nights);
  const saveNight = useNights((state) => state.saveNight);
  const clearNights = useNights((state) => state.clearNights);
  const records = useAdjustments((state) => state.records);
  const recordDay = useAdjustments((state) => state.recordDay);
  const rejectRecord = useAdjustments((state) => state.reject);
  const clearAdjustments = useAdjustments((state) => state.clear);

  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrated,
    getHydratedOnServer,
  );

  const [devOffset, setDevOffset] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const [rejectedNotice, setRejectedNotice] = useState<{
    element: AdjustmentElement;
    time: string;
  } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [devSeeded, setDevSeeded] = useState(false);

  const devMode =
    hydrated &&
    new URLSearchParams(window.location.search).get("dev") === "1";

  // زر التطوير يحرّك اليوم نفسه لا البيانات — لاختبار قاعدة الثلاثة أيام.
  // لا يُقرأ الوقت على الخادم: Next يرفض `new Date()` أثناء prerender.
  const todayDate = useMemo(() => {
    if (!hydrated) return null;
    const date = new Date();
    date.setDate(date.getDate() + devOffset);
    return date;
  }, [devOffset, hydrated]);

  const todayIso = todayDate ? localIsoDate(todayDate) : null;

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";

    const title =
      lang === "ar"
        ? `${BRAND.arabic} — ${t.docTitle}`
        : `${BRAND.latin} — ${t.docTitle}`;

    const applyTitle = () => {
      document.title = title;
      const titles = Array.from(document.querySelectorAll("title"));
      for (const extra of titles.slice(1)) extra.remove();
    };

    applyTitle();
    const timer = window.setTimeout(applyTitle, 150);
    return () => window.clearTimeout(timer);
  }, [lang, t.docTitle]);

  const { birthDate, worstProblem, wakePattern, priorityGoal } =
    isProfileComplete(profile) ? profile : DEMO_PROFILE;

  const age = useMemo(
    () =>
      (todayDate ? ageParts(birthDate, todayDate) : null) ?? {
        months: 0,
        days: 0,
      },
    [birthDate, todayDate],
  );

  const rules = useMemo(() => ageRulesForMonths(age.months), [age.months]);

  // دليل النجاة المناسب لعمر ليان — يفتح من وضع الطوارئ (docs/engine.md §4).
  const survivalLesson = useMemo(
    () => survivalGuideForAge(age.months),
    [age.months],
  );

  // خطة الأمس: الأصل المحفوظ مع خطة اليوم إن أُعيد فتح اليوم نفسه،
  // وإلا خطة الأمس المحفوظة، وإلا خطة أولى مولدة من الملف.
  const base = useMemo<FirstPlan | null>(() => {
    if (!hydrated || !todayIso || !todayDate) return null;

    if (storedPlan?.date === todayIso && storedBase) return storedBase;
    if (storedPlan && storedPlan.date < todayIso) return storedPlan;

    return buildFirstPlan(
      { birthDate, worstProblem, wakePattern, priorityGoal },
      rules,
      todayDate,
    );
  }, [
    hydrated,
    todayIso,
    storedPlan,
    storedBase,
    birthDate,
    worstProblem,
    wakePattern,
    priorityGoal,
    rules,
    todayDate,
  ]);

  const todayNight = useMemo(
    () =>
      todayIso
        ? (nights.find((night) => night.date === todayIso) ?? null)
        : null,
    [nights, todayIso],
  );

  const emergency = Boolean(todayNight?.emergency);

  const result = useMemo(() => {
    if (!base || !todayIso) return null;

    return proposeAdjustments({
      today: todayIso,
      nights,
      plan: {
        bedtime: base.bedtime,
        routineStart: base.routineStart,
        lastFeed: base.lastFeed,
        expectedSleep: base.expectedSleep,
      },
      rules,
      history: records,
      emergency,
    });
  }, [base, todayIso, nights, rules, records, emergency]);

  // تثبيت اليوم مرة واحدة: تسجيل التعديلات وحفظ خطة اليوم المعدّلة.
  useEffect(() => {
    if (!hydrated || !base || !result || !todayIso) return;
    if (storedPlan?.date === todayIso && storedBase?.date === base.date) {
      return;
    }

    if (!records.some((record) => record.date === todayIso)) {
      recordDay(todayIso, result.adjustments);
    }

    savePlan(
      { ...applyAdjustments(base, result.adjustments), date: todayIso },
      base,
    );
  }, [
    hydrated,
    base,
    result,
    todayIso,
    storedPlan,
    storedBase,
    records,
    recordDay,
    savePlan,
  ]);

  const todayRecords = useMemo(
    () => (todayIso ? recordsForDate(records, todayIso) : []),
    [records, todayIso],
  );

  const displayed: AdjustmentRecord[] = useMemo(() => {
    if (todayRecords.length > 0) return todayRecords;
    if (!result || !todayIso) return [];
    return result.adjustments.map((adjustment) => ({
      ...adjustment,
      date: todayIso,
    }));
  }, [todayRecords, result, todayIso]);

  const handleReject = (record: AdjustmentRecord) => {
    if (!base || !todayIso || record.status === "rejected") return;

    rejectRecord(todayIso, record.id);

    const next = displayed.map((entry) =>
      entry.id === record.id
        ? { ...entry, status: "rejected" as const }
        : entry,
    );

    savePlan({ ...applyAdjustments(base, next), date: todayIso }, base);
    setRejectedNotice({ element: record.element, time: record.from });
  };

  const historyDays = useMemo(() => groupByDate(records), [records]);
  const historyPages = Math.max(
    1,
    Math.ceil(historyDays.length / HISTORY_PAGE_SIZE),
  );
  const pageDays = historyDays.slice(
    historyPage * HISTORY_PAGE_SIZE,
    historyPage * HISTORY_PAGE_SIZE + HISTORY_PAGE_SIZE,
  );

  const shownAdjustments = emergency ? [] : displayed;

  const modeCopy = useMemo(() => {
    if (!result) return null;
    if (result.mode === "hold") {
      return { title: t.holdTitle, body: t.holdBody, tone: t.holdTone };
    }
    if (result.mode === "cautious") {
      return { title: t.cautiousTitle, body: t.cautiousBody };
    }
    if (result.mode === "rejected") {
      return { title: t.rejectedHoldTitle, body: t.rejectedHoldBody };
    }
    if (result.mode === "floor") {
      return { title: t.floorTitle, body: t.floorBody };
    }
    if (result.trend.kind === "insufficient") {
      return { title: t.insufficientTitle, body: t.insufficientBody };
    }
    return { title: t.steadyTitle, body: t.steadyBody };
  }, [result, t]);

  // ------------------------- بيانات التطوير فقط -------------------------
  const seedNights = (
    rows: { offset: number; sleep: string; wakes: number; mood: MorningMood }[],
  ) => {
    clearNights();
    clearAdjustments();
    clearPlan();

    for (const row of rows) {
      const date = new Date();
      date.setDate(date.getDate() + devOffset - row.offset);
      saveNight({
        date: localIsoDate(date),
        sleepTime: row.sleep,
        wakeCount: row.wakes,
        morningMood: row.mood,
      });
    }

    setAcknowledged(false);
    setRejectedNotice(null);
    setHistoryOpen(false);
    setDevSeeded(true);
  };

  if (!hydrated || !todayIso || !base || !result) {
    return (
      <main className="flex h-dvh justify-center bg-night-deep sm:items-center">
        <div className="flex h-dvh w-full max-w-[420px] items-center justify-center bg-night sm:h-[min(860px,calc(100dvh-4rem))] sm:rounded-[2.5rem] sm:border sm:border-frame">
          <div
            aria-hidden="true"
            className="raha-moon"
            style={{ width: 24, height: 24 }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-dvh justify-center bg-night-deep sm:items-center">
      <div className="flex h-dvh w-full max-w-[420px] flex-col bg-night sm:h-[min(860px,calc(100dvh-4rem))] sm:rounded-[2.5rem] sm:border sm:border-frame">
        <div className="no-scrollbar flex-1 overflow-y-auto px-6 pt-6 pb-8 sm:px-7">
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
              {t.headerTitle}
            </h1>
            <p className="mt-1 text-sm text-nlo">
              {fillText(t.headerSubline, {
                age: formatAgeMonths(lang, age.months),
              })}
            </p>

            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1.5 text-xs leading-none text-gold">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-gold" />
              {t.updatedEyebrow}
            </p>
          </header>

          {emergency ? (
            <section
              aria-labelledby="adjustment-emergency-title"
              className="mt-6 rounded-3xl border border-gold/30 p-5"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--color-nblue), var(--color-nsoft))",
              }}
            >
              <h2
                id="adjustment-emergency-title"
                className="text-base font-medium text-gold"
              >
                {t.emergencyTitle}
              </h2>
              <p className="mt-2 text-lg leading-relaxed text-nhi">
                {t.emergencyBody}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-nmd">
                {t.emergencyNote}
              </p>

              <Link
                href={`/library?lesson=${encodeURIComponent(survivalLesson.id)}`}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 text-xs text-gold"
              >
                <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                {t.survivalLink}
              </Link>
              <p className="mt-2 text-[11px] text-ndim">{t.survivalHint}</p>
            </section>
          ) : shownAdjustments.length > 0 ? (
            <div className="mt-6">
              <p className="text-[11px] font-medium text-gold">
                {t.adjustEyebrow}
              </p>
              {shownAdjustments.map((record) => (
                <AdjustmentCard
                  key={record.id}
                  lang={lang}
                  record={record}
                  onReject={handleReject}
                />
              ))}
              <p className="mt-2 px-1 text-[11px] leading-relaxed text-ndim">
                {t.revertNote}
              </p>
            </div>
          ) : modeCopy ? (
            <ModeCard
              title={modeCopy.title}
              body={modeCopy.body}
              tone={modeCopy.tone}
            />
          ) : null}

          {rejectedNotice ? (
            <p
              role="status"
              className="mt-4 rounded-2xl border border-ngreen/30 bg-ngreen/10 px-4 py-3 text-center text-xs leading-relaxed text-ngreen"
            >
              {fillText(t.rejectedNotice, {
                element: elementLabel(lang, rejectedNotice.element),
                time: rejectedNotice.time,
              })}
            </p>
          ) : null}

          {!emergency && result.trend.earlyWarning ? (
            <section
              aria-labelledby="adjustment-warning-title"
              className="mt-5 rounded-3xl border border-gold/40 bg-gold/10 p-4"
            >
              <h2
                id="adjustment-warning-title"
                className="inline-flex items-center gap-2 text-sm font-medium text-gold"
              >
                <Sparkles aria-hidden="true" className="h-4 w-4" />
                {t.earlyWarningTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-nmd">
                {t.earlyWarningBody}
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-ndim">
                {t.earlyWarningHint}
              </p>
            </section>
          ) : null}

          <section
            aria-labelledby="adjustment-pillars-title"
            className="mt-5 rounded-3xl border border-nline bg-ncard p-4"
          >
            <h2
              id="adjustment-pillars-title"
              className="text-base leading-snug font-medium text-nhi"
            >
              {t.pillarsTitle}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-nlo">
              {t.pillarsBody}
            </p>
            <ul className="mt-3 space-y-2">
              {[t.pillarRoutine, t.pillarFeed, t.pillarResponse].map(
                (label) => (
                  <li
                    key={label}
                    className="flex items-center gap-2 text-sm text-nmd"
                  >
                    <Check
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-ngreen"
                    />
                    {label}
                  </li>
                ),
              )}
            </ul>
          </section>

          <NightTasksCard date={todayIso} />

          <div className="mt-6">
            <Button
              type="button"
              onClick={() => setAcknowledged(true)}
              className="h-12 w-full rounded-full bg-gold px-6 text-base font-normal text-goldink hover:bg-gold/90 focus-visible:ring-gold/60"
            >
              {t.ackCta}
            </Button>

            {acknowledged ? (
              <>
                <p
                  role="status"
                  className="mt-3 text-center text-xs leading-relaxed text-ngreen"
                >
                  {t.ackNotice}
                </p>
                <Link
                  href="/routine"
                  className="mt-3 flex h-12 w-full items-center justify-center rounded-full border border-gold/40 bg-gold/10 px-6 text-sm font-normal text-gold hover:bg-gold/20"
                >
                  {t.openRoutine}
                </Link>
              </>
            ) : null}
          </div>

          <section aria-labelledby="adjustment-history-toggle" className="mt-8">
            <button
              id="adjustment-history-toggle"
              type="button"
              onClick={() => {
                setHistoryOpen((open) => !open);
                setHistoryPage(0);
              }}
              aria-expanded={historyOpen}
              aria-controls="adjustment-history"
              className="flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl border border-nline bg-nsoft/60 px-4 text-sm text-nmd transition-colors hover:border-nedge hover:text-nhi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              {t.historyToggle}
              <ChevronDown
                aria-hidden="true"
                className={`h-4 w-4 transition-transform duration-200 ${
                  historyOpen ? "rotate-180 text-gold" : "text-ndim"
                }`}
              />
            </button>

            {historyOpen ? (
              <div
                id="adjustment-history"
                className="mt-3 rounded-3xl border border-nline bg-ncard p-4"
              >
                <h2 className="text-sm font-medium text-nhi">
                  {t.historyTitle}
                </h2>

                {historyDays.length === 0 ? (
                  <p className="mt-2 text-xs leading-relaxed text-nlo">
                    {t.historyEmpty}
                  </p>
                ) : (
                  <>
                    <ul className="mt-3 space-y-3">
                      {pageDays.map((day) => (
                        <li key={day.date}>
                          <p className="text-[11px] text-ndim">
                            <span dir="ltr" className="ltr-inline">
                              {day.date}
                            </span>
                            {day.date === todayIso ? ` · ${t.historyToday}` : ""}
                          </p>
                          <ul className="mt-1.5 space-y-2">
                            {day.records.map((record) => (
                              <li
                                key={`${record.date}-${record.id}`}
                                className="flex items-center justify-between gap-3 border-b border-nline/60 pb-2 text-sm last:border-b-0 last:pb-0"
                              >
                                <span className="min-w-0">
                                  <span className="block text-xs text-nlo">
                                    {elementLabel(lang, record.element)}
                                  </span>
                                  <span
                                    dir="ltr"
                                    className="mt-0.5 block text-xs text-nmd ltr-inline"
                                  >
                                    {record.from} ← {record.to}
                                  </span>
                                </span>
                                <span
                                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] leading-relaxed ${
                                    record.status === "rejected"
                                      ? "border-nedge/60 text-ndim"
                                      : "border-ngreen/30 text-ngreen"
                                  }`}
                                >
                                  {statusLabel(lang, record)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-nline/70 pt-3">
                      <button
                        type="button"
                        onClick={() => setHistoryPage((page) => page + 1)}
                        disabled={historyPage >= historyPages - 1}
                        className="min-h-11 rounded-full border border-nline px-4 text-xs text-nmd transition-colors hover:border-nedge hover:text-nhi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:opacity-40"
                      >
                        {t.historyOlder}
                      </button>

                      <span className="text-[11px] text-ndim">
                        {fillText(t.historyPage, {
                          page: historyPage + 1,
                          total: historyPages,
                        })}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setHistoryPage((page) => Math.max(0, page - 1))
                        }
                        disabled={historyPage === 0}
                        className="min-h-11 rounded-full border border-nline px-4 text-xs text-nmd transition-colors hover:border-nedge hover:text-nhi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:opacity-40"
                      >
                        {t.historyNewer}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </section>

          {devMode ? (
            <section
              aria-labelledby="adjustment-dev-title"
              className="mt-8 rounded-2xl border border-dashed border-nedge/70 p-4"
            >
              <h2
                id="adjustment-dev-title"
                className="text-[11px] font-medium text-ndim"
              >
                {t.devTitle}
              </h2>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    seedNights([
                      { offset: 2, sleep: "19:40", wakes: 5, mood: "hard" },
                      { offset: 1, sleep: "19:30", wakes: 3, mood: "tired" },
                      { offset: 0, sleep: "19:20", wakes: 1, mood: "rested" },
                    ])
                  }
                  className="min-h-11 rounded-full border border-nline bg-nchip/40 px-3 text-xs text-nmd hover:border-nedge hover:text-nhi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                >
                  {t.devImproving}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    seedNights([
                      { offset: 2, sleep: "19:15", wakes: 1, mood: "rested" },
                      { offset: 1, sleep: "19:30", wakes: 3, mood: "tired" },
                      { offset: 0, sleep: "19:45", wakes: 5, mood: "hard" },
                    ])
                  }
                  className="min-h-11 rounded-full border border-nline bg-nchip/40 px-3 text-xs text-nmd hover:border-nedge hover:text-nhi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                >
                  {t.devDeteriorating}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    seedNights([
                      { offset: 2, sleep: "19:20", wakes: 2, mood: "rested" },
                      { offset: 1, sleep: "19:40", wakes: 5, mood: "hard" },
                      { offset: 0, sleep: "19:15", wakes: 2, mood: "rested" },
                    ])
                  }
                  className="min-h-11 rounded-full border border-nline bg-nchip/40 px-3 text-xs text-nmd hover:border-nedge hover:text-nhi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                >
                  {t.devVolatile}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    clearNights();
                    clearAdjustments();
                    clearPlan();
                    setDevSeeded(false);
                    setRejectedNotice(null);
                  }}
                  className="min-h-11 rounded-full border border-dashed border-nedge/70 px-3 text-xs text-ndim hover:text-nlo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                >
                  {t.devReset}
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectedNotice(null);
                    setDevOffset((offset) => offset + 1);
                  }}
                  className="min-h-11 rounded-full border border-nline bg-nchip/40 px-3 text-xs text-nmd hover:border-nedge hover:text-nhi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                >
                  {fillText(t.devDayForward, { days: devOffset + 1 })}
                </button>

                {devOffset > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setRejectedNotice(null);
                      setDevOffset(0);
                    }}
                    className="min-h-11 rounded-full border border-dashed border-nedge/70 px-3 text-xs text-ndim hover:text-nlo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                  >
                    {t.devDayReset}
                  </button>
                ) : null}
              </div>

              {devSeeded ? (
                <p role="status" className="mt-2 text-[11px] text-ngreen">
                  {t.devSeeded}
                </p>
              ) : null}
            </section>
          ) : null}
        </div>

        <TabBar active="today" />
      </div>
    </main>
  );
}
