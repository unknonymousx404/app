"use client";

import { DemoBadge } from "@/components/demo-badge";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  BellRing,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Moon,
  Play,
  Square,
} from "lucide-react";
import { TabBar } from "@/components/nav/tabbar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TimeField12 } from "@/components/ui/time-field-12";
import { ageParts, localIsoDate } from "@/lib/age";
import { BRAND } from "@/lib/brand";
import { useChildName } from "@/lib/child-name";
import { createChime } from "@/lib/audio";
import { formatClock, parseClock } from "@/lib/engine/age-rules";
import {
  buildRoutineSchedule,
  delaysFromLatestNight,
  defaultOrder,
  getTemplate,
  moveStep,
  ROUTINE_TEMPLATES,
  totalDelayMinutes,
  type RoutineStepId,
} from "@/lib/engine/routines";
import {
  ROUTINE,
  fillText,
  formatAgeMonths,
  formatTime,
  routineStepText,
  routineTemplateNote,
} from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { isNightNow } from "@/lib/night";
import {
  askReminderPermission,
  reminderPermission,
  scheduleEveningReminder,
  type ReminderPermission,
} from "@/lib/notifications";
import {
  DEMO_PROFILE,
  isProfileComplete,
  useProfile,
} from "@/lib/store/profile";
import { usePlan } from "@/lib/store/plan";
import { useRoutine } from "@/lib/store/routine";

// بوابة التركيب — الخادم يعرض الهيكل، والعميل يبني الروتين.
function subscribeToHydration(): () => void {
  return () => {};
}
function getHydrated(): boolean {
  return true;
}
function getHydratedOnServer(): boolean {
  return false;
}

/** بداية الروتين عند غياب خطة اليوم. */
const DEFAULT_ROUTINE_START = "19:00";
/** فارق التنبيه عن بداية الروتين — عشر دقائق (docs/engine.md §6). */
const REMINDER_LEAD_MINUTES = 10;
/** في وضع التطوير يقتصر المؤقت على ثوانٍ لتسهيل الاختبار. */
const DEV_TIMER_SECONDS = 10;
const MINUTES_STEP = 5;

/** المؤقت الدائري — حلقة تتناقص مع الوقت المتبقي. */
function RingTimer({
  total,
  remaining,
  label,
}: {
  total: number;
  remaining: number;
  label: string;
}) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const label2 = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <svg
      viewBox="0 0 88 88"
      width="88"
      height="88"
      role="img"
      aria-label={`${label} ${label2}`}
      className="shrink-0"
    >
      <circle
        cx="44"
        cy="44"
        r={radius}
        fill="none"
        strokeWidth="4"
        className="stroke-nline"
      />
      <circle
        cx="44"
        cy="44"
        r={radius}
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - ratio)}
        transform="rotate(-90 44 44)"
        className="stroke-gold transition-[stroke-dashoffset] duration-1000 ease-linear"
      />
      <text
        x="44"
        y="49"
        textAnchor="middle"
        className="fill-nhi text-[15px] font-medium"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {label2}
      </text>
    </svg>
  );
}

export function Screen04() {
  const lang = useLang();
  const t = ROUTINE[lang];
  const childName = useChildName();

  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrated,
    getHydratedOnServer,
  );

  const profileState = useProfile();
  const storedPlan = usePlan((state) => state.plan);

  const templateId = useRoutine((state) => state.templateId);
  const orders = useRoutine((state) => state.orders);
  const minutesMap = useRoutine((state) => state.minutes);
  const startOverride = useRoutine((state) => state.startOverride);
  const reminderEnabled = useRoutine((state) => state.reminderEnabled);
  const reminderTime = useRoutine((state) => state.reminderTime);
  const checked = useRoutine((state) => state.checked);
  const checkedDate = useRoutine((state) => state.checkedDate);
  const delays = useRoutine((state) => state.delays);

  const setTemplate = useRoutine((state) => state.setTemplate);
  const setOrder = useRoutine((state) => state.setOrder);
  const setStepMinutes = useRoutine((state) => state.setStepMinutes);
  const setStartOverride = useRoutine((state) => state.setStartOverride);
  const toggleStep = useRoutine((state) => state.toggleStep);
  const recordDelay = useRoutine((state) => state.recordDelay);
  const setReminder = useRoutine((state) => state.setReminder);

  const [night, setNight] = useState(false);
  const [editing, setEditing] = useState(false);
  const [runningStep, setRunningStep] = useState<RoutineStepId | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [timerFinished, setTimerFinished] = useState(false);
  const [delayNotice, setDelayNotice] = useState<string | null>(null);
  const [templateNotice, setTemplateNotice] = useState<string | null>(null);
  const [reminderNotice, setReminderNotice] = useState<string | null>(null);
  const [permission, setPermission] = useState<ReminderPermission>(() =>
    typeof window === "undefined" ? "default" : reminderPermission(),
  );

  const remainingRef = useRef(0);
  const dragIndex = useRef<number | null>(null);
  const chimeRef = useRef<(() => void) | null>(null);

  const getChime = useCallback(() => {
    if (!chimeRef.current) chimeRef.current = createChime();
    return chimeRef.current;
  }, []);

  // ------------------------- اليوم والوضع الليلي -------------------------

  const today = useMemo(() => (hydrated ? new Date() : null), [hydrated]);
  const todayIso = today ? localIsoDate(today) : null;

  const devMode = useMemo(() => {
    if (!hydrated) return false;
    return new URLSearchParams(window.location.search).get("dev") === "1";
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    const check = () => {
      const forced =
        new URLSearchParams(window.location.search).get("night") === "1";
      setNight(forced || isNightNow());
    };

    check();
    const timer = window.setInterval(check, 60_000);
    return () => window.clearInterval(timer);
  }, [hydrated]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
    document.title = `${lang === "ar" ? BRAND.arabic : BRAND.latin} — ${t.docTitle}`;
  }, [lang, t.docTitle]);

  const profile = useMemo(
    () => (isProfileComplete(profileState) ? profileState : DEMO_PROFILE),
    [profileState],
  );

  const age = useMemo(
    () =>
      (today ? ageParts(profile.birthDate, today) : null) ?? {
        months: 0,
        days: 0,
      },
    [profile.birthDate, today],
  );

  // ------------------------- القالب والترتيب -------------------------

  const template = getTemplate(templateId);

  const order = useMemo(() => {
    const ids = template.steps.map((step) => step.id);
    const saved = orders[templateId];
    const base = saved && saved.length > 0 ? saved : defaultOrder(templateId);

    // الترتيب المحفوظ قد يكون من قالب أقدم — نُبقي الخطوات الصالحة ونُكمل الناقص.
    const kept = base.filter((id) => ids.includes(id));
    const missing = ids.filter((id) => !kept.includes(id));
    return [...kept, ...missing];
  }, [orders, templateId, template]);

  const minutesOverride = minutesMap[templateId];

  const stepDuration = useCallback(
    (stepId: RoutineStepId) =>
      minutesOverride?.[stepId] ??
      template.steps.find((step) => step.id === stepId)?.minutes ??
      0,
    [minutesOverride, template],
  );

  const planStart = storedPlan?.routineStart ?? DEFAULT_ROUTINE_START;
  const startClock = startOverride ?? planStart;

  const tonightDelays = useMemo(
    () => (todayIso ? delays.filter((delay) => delay.date === todayIso) : []),
    [delays, todayIso],
  );

  const tomorrowDelays = useMemo(
    () => (todayIso ? delaysFromLatestNight(delays, todayIso) : []),
    [delays, todayIso],
  );

  const schedule = useMemo(
    () =>
      buildRoutineSchedule(
        template,
        order,
        startClock,
        tonightDelays,
        minutesOverride,
      ),
    [template, order, startClock, tonightDelays, minutesOverride],
  );

  const totalMinutes = useMemo(
    () => schedule.reduce((sum, step) => sum + step.minutes, 0),
    [schedule],
  );

  // ------------------------- التعليم والخطوة الحالية -------------------------

  const checkedSteps = useMemo(
    () => (checkedDate === todayIso ? checked : []),
    [checked, checkedDate, todayIso],
  );

  const doneCount = schedule.filter((step) =>
    checkedSteps.includes(step.id),
  ).length;

  const currentStep = useMemo(
    () =>
      schedule.find((step) => !checkedSteps.includes(step.id)) ?? null,
    [schedule, checkedSteps],
  );

  // ------------------------- المؤقت -------------------------

  const timerTotal = useMemo(() => {
    if (!currentStep) return 0;
    return devMode ? DEV_TIMER_SECONDS : currentStep.minutes * 60;
  }, [currentStep, devMode]);

  useEffect(() => {
    if (runningStep === null) return;

    const timer = window.setInterval(() => {
      remainingRef.current -= 1;
      setRemaining(Math.max(remainingRef.current, 0));

      if (remainingRef.current <= 0) {
        window.clearInterval(timer);
        setRunningStep(null);
        setTimerFinished(true);
        getChime()();
        if (todayIso) toggleStep(runningStep, todayIso);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [runningStep, todayIso, toggleStep, getChime]);

  const startTimer = () => {
    if (!currentStep) return;
    getChime(); // تهيئة الصوت بإيماءة المستخدم
    remainingRef.current = timerTotal;
    setRemaining(timerTotal);
    setTimerFinished(false);
    setRunningStep(currentStep.id);
  };

  const stopTimer = () => {
    setRunningStep(null);
    remainingRef.current = 0;
    setRemaining(0);
  };

  // ------------------------- التأخير -------------------------

  const markDelay = () => {
    if (!currentStep || !todayIso) return;

    recordDelay(currentStep.id, MINUTES_STEP, todayIso);

    const total = totalDelayMinutes([
      ...tonightDelays.filter((delay) => delay.stepId !== currentStep.id),
      { date: todayIso, stepId: currentStep.id, minutes: MINUTES_STEP },
    ]);

    setDelayNotice(
      fillText(t.delayNoticeShifted, { minutes: total }),
    );
  };

  // ------------------------- تذكير المساء -------------------------

  const defaultReminderTime = useMemo(
    () =>
      formatClock(
        parseClock(startClock) - REMINDER_LEAD_MINUTES,
      ),
    [startClock],
  );

  const effectiveReminderTime = reminderTime ?? defaultReminderTime;

  useEffect(() => {
    if (!hydrated || !reminderEnabled) return;

    const cancel = scheduleEveningReminder({
      time: effectiveReminderTime,
      title: fillText(t.reminderNotifyTitle, {
        time: formatTime(lang, effectiveReminderTime),
      }),
      body: t.reminderNotifyBody,
    });

    return cancel;
  }, [hydrated, reminderEnabled, effectiveReminderTime, lang, t]);

  const toggleReminder = async () => {
    if (reminderEnabled) {
      setReminder(false, null);
      setReminderNotice(t.reminderOff);
      return;
    }

    const result = await askReminderPermission();
    setPermission(result);

    if (result === "granted") {
      setReminder(true, effectiveReminderTime);
      setReminderNotice(t.reminderScheduled);
      return;
    }

    if (result === "denied") {
      setReminderNotice(t.reminderDenied);
      return;
    }

    setReminderNotice(t.reminderUnsupported);
  };

  // ------------------------- إعادة الترتيب -------------------------

  const reorder = (from: number, to: number) => {
    setOrder(templateId, moveStep(order, from, to));
  };

  const onHandlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    index: number,
  ) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragIndex.current = index;
  };

  const onHandlePointerMove = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    const from = dragIndex.current;
    if (from === null) return;

    const element = document.elementFromPoint(
      event.clientX,
      event.clientY,
    );
    const item = element?.closest("[data-step-index]");
    if (!item) return;

    const to = Number(item.getAttribute("data-step-index"));
    if (!Number.isFinite(to) || to === from) return;

    reorder(from, to);
    dragIndex.current = to;
  };

  const onHandlePointerUp = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragIndex.current = null;
  };

  const onHandleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key === "ArrowUp" && index > 0) {
      event.preventDefault();
      reorder(index, index - 1);
      return;
    }
    if (event.key === "ArrowDown" && index < order.length - 1) {
      event.preventDefault();
      reorder(index, index + 1);
    }
  };

  const adjustMinutes = (stepId: RoutineStepId, delta: number) => {
    const next = Math.max(MINUTES_STEP, stepDuration(stepId) + delta);
    setStepMinutes(templateId, stepId, next);
  };

  // ------------------------- العرض -------------------------

  if (!hydrated || !todayIso) {
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

  const donePercent =
    schedule.length > 0 ? Math.round((doneCount / schedule.length) * 100) : 0;

  return (
    <main className="flex h-dvh justify-center bg-night-deep sm:items-center">
      <div
        className={`flex h-dvh w-full max-w-[420px] flex-col bg-night sm:h-[min(860px,calc(100dvh-4rem))] sm:rounded-[2.5rem] sm:border sm:border-frame ${
          night ? "theme-night" : ""
        }`}
      >
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
              {t.headerTitle}
            </h1>
            <p className="mt-1 text-sm text-nlo">
              {fillText(t.headerSubline, {
                name: childName,
                age: formatAgeMonths(lang, age.months),
              })}
            </p>

            {night ? (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1.5 text-xs text-gold">
                <Moon aria-hidden="true" className="h-3.5 w-3.5" />
                {t.nightBadge}
              </p>
            ) : null}
          </header>

          {/* ملخّص الروتين وشريط التقدّم */}
          <section className="mt-5 rounded-3xl border border-nline bg-ncard p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-nlo">
                {fillText(t.summarySteps, {
                  count: schedule.length,
                  minutes: totalMinutes,
                })}
              </span>
              <span className="text-xs font-medium text-gold">
                {fillText(t.summaryDone, {
                  done: doneCount,
                  total: schedule.length,
                })}
              </span>
            </div>
            <Progress
              value={donePercent}
              aria-label={t.progressAria}
              className="mt-3"
            />
          </section>

          {/* قائمة الخطوات */}
          <ol className="mt-4 space-y-2">
            {schedule.map((step) => {
              const isDone = checkedSteps.includes(step.id);
              const isCurrent = currentStep?.id === step.id;
              const text = routineStepText(lang, step.id);

              return (
                <li
                  key={step.id}
                  data-step-index={step.index}
                  className={`rounded-3xl border px-3 py-3 transition-colors ${
                    isCurrent
                      ? "border-gold/50 bg-gold/10"
                      : isDone
                        ? "border-ngreen/30 bg-ngreen/10"
                        : "border-nline bg-ncard"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => toggleStep(step.id, todayIso)}
                      aria-pressed={isDone}
                      aria-label={`${text.title} — ${isDone ? t.stateDone : isCurrent ? t.nowLabel : t.stateNext}`}
                      className={`mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full border ${
                        isDone
                          ? "border-ngreen/50 bg-ngreen/20 text-ngreen"
                          : isCurrent
                            ? "border-gold/60 bg-gold/20 text-gold"
                            : "border-nedge bg-nchip/40 text-ndim"
                      }`}
                    >
                      {isDone ? (
                        <Check aria-hidden="true" className="h-5 w-5" />
                      ) : (
                        <span aria-hidden="true" className="text-xs">
                          {step.index + 1}
                        </span>
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {isCurrent ? (
                          <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] leading-none font-medium text-goldink">
                            {t.nowLabel}
                          </span>
                        ) : null}
                        <span
                          className={`text-sm leading-snug font-medium ${
                            isDone ? "text-ngreen" : "text-nhi"
                          }`}
                        >
                          {text.title}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-nlo">
                        {text.guide}
                      </p>

                      {editing ? (
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => adjustMinutes(step.id, -MINUTES_STEP)}
                            aria-label={fillText(t.minutesDecrease, {
                              minutes: MINUTES_STEP,
                              step: text.title,
                            })}
                            className="flex size-11 items-center justify-center rounded-full border border-nline bg-nchip/40 text-nmd hover:bg-nchip"
                          >
                            <ChevronDown aria-hidden="true" className="h-4 w-4" />
                          </button>
                          <span
                            dir="ltr"
                            className="ltr-inline min-w-14 text-center text-xs text-nlo"
                          >
                            {step.minutes} {t.minutesShort}
                          </span>
                          <button
                            type="button"
                            onClick={() => adjustMinutes(step.id, MINUTES_STEP)}
                            aria-label={fillText(t.minutesIncrease, {
                              minutes: MINUTES_STEP,
                              step: text.title,
                            })}
                            className="flex size-11 items-center justify-center rounded-full border border-nline bg-nchip/40 text-nmd hover:bg-nchip"
                          >
                            <ChevronUp aria-hidden="true" className="h-4 w-4" />
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span
                        dir="ltr"
                        className="ltr-inline text-xs text-nlo tabular-nums"
                      >
                        {formatTime(lang, step.startTime)}
                      </span>
                      {editing ? (
                        <button
                          type="button"
                          onPointerDown={(event) =>
                            onHandlePointerDown(event, step.index)
                          }
                          onPointerMove={onHandlePointerMove}
                          onPointerUp={onHandlePointerUp}
                          onPointerCancel={onHandlePointerUp}
                          onKeyDown={(event) =>
                            onHandleKeyDown(event, step.index)
                          }
                          aria-label={`${text.title} — ${t.orderHint}`}
                          style={{ touchAction: "none" }}
                          className="flex size-11 items-center justify-center rounded-full border border-nline bg-nchip/40 text-nlo hover:bg-nchip"
                        >
                          <GripVertical
                            aria-hidden="true"
                            className="h-4 w-4"
                          />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* الخطوة الحالية والمؤقت */}
          {currentStep ? (
            <section className="mt-4 rounded-3xl border border-gold/35 bg-ncard p-5">
              <div className="flex items-start gap-4">
                <RingTimer
                  total={timerTotal}
                  remaining={remaining}
                  label={t.timerAria.replace("{step}", routineStepText(lang, currentStep.id).title)}
                />

                <div className="min-w-0 flex-1">
                  <h2 className="text-base leading-snug font-medium text-nhi">
                    {routineStepText(lang, currentStep.id).title}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-nlo">
                    {routineStepText(lang, currentStep.id).guide}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {runningStep === currentStep.id ? (
                      <Button
                        type="button"
                        onClick={stopTimer}
                        className="h-11 flex-1 rounded-full bg-gold px-4 text-sm font-medium text-goldink hover:bg-gold/90"
                      >
                        <Square aria-hidden="true" className="h-4 w-4" />
                        {t.timerStop}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={startTimer}
                        className="h-11 flex-1 rounded-full bg-gold px-4 text-sm font-medium text-goldink hover:bg-gold/90"
                      >
                        <Play aria-hidden="true" className="h-4 w-4" />
                        {t.timerStart}
                      </Button>
                    )}

                    <Button
                      type="button"
                      onClick={markDelay}
                      className="h-11 rounded-full border border-nedge bg-nchip/40 px-4 text-xs font-normal text-nmd hover:bg-nchip"
                    >
                      {t.delayCta}
                    </Button>
                  </div>
                </div>
              </div>

              {timerFinished ? (
                <p
                  role="status"
                  className="mt-3 rounded-2xl border border-ngreen/30 bg-ngreen/10 px-4 py-2.5 text-center text-xs text-ngreen"
                >
                  {t.timerFinished}
                </p>
              ) : null}

              {delayNotice ? (
                <p
                  role="status"
                  className="mt-3 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-center text-xs leading-relaxed text-gold"
                >
                  {delayNotice}
                </p>
              ) : null}
            </section>
          ) : (
            <p className="mt-4 rounded-3xl border border-ngreen/30 bg-ngreen/10 px-4 py-4 text-center text-sm text-ngreen">
              {t.timerFinished}
            </p>
          )}

          {/* تنويه الثبات */}
          <p className="mt-4 rounded-2xl border border-nline/70 bg-nsoft/40 px-4 py-3 text-center text-xs leading-relaxed text-ndim">
            {t.consistencyNotice}
          </p>

          {/* تعديل الروتين */}
          <section className="mt-4">
            <button
              type="button"
              onClick={() => setEditing((value) => !value)}
              aria-expanded={editing}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-nedge bg-nchip/30 px-4 text-xs text-nmd hover:bg-nchip"
            >
              {editing ? (
                <ChevronUp aria-hidden="true" className="h-4 w-4" />
              ) : (
                <ChevronDown aria-hidden="true" className="h-4 w-4" />
              )}
              {t.editToggle}
            </button>

            {editing ? (
              <div className="mt-3 space-y-4">
                <div>
                  <p className="text-xs font-medium text-gold">{t.templateLabel}</p>
                  <p className="mt-1 text-[11px] text-ndim">{t.templateHint}</p>

                  <ul className="mt-2 space-y-2">
                    {ROUTINE_TEMPLATES.map((entry) => {
                      const name = entry.steps
                        .map((step) => routineStepText(lang, step.id).title)
                        .join(" · ");
                      const selected = entry.id === templateId;

                      return (
                        <li key={entry.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setTemplate(entry.id);
                              setTemplateNotice(t.templateApplied);
                            }}
                            aria-pressed={selected}
                            className={`w-full rounded-2xl border px-4 py-3 text-start ${
                              selected
                                ? "border-gold/50 bg-gold/10"
                                : "border-nline bg-ncard hover:bg-nsoft"
                            }`}
                          >
                            <span className="block text-sm leading-snug font-medium text-nhi">
                              {name}
                            </span>
                            <span className="mt-1 block text-[11px] leading-relaxed text-nlo">
                              {routineTemplateNote(lang, entry.id)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  {templateNotice ? (
                    <p
                      role="status"
                      className="mt-2 text-center text-[11px] text-gold"
                    >
                      {templateNotice}
                    </p>
                  ) : null}
                </div>

                <div>
                  <p className="text-xs font-medium text-gold">{t.orderLabel}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ndim">
                    {t.orderHint}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gold">
                    {t.startTimeLabel}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ndim">
                    {t.startTimeHint}
                  </p>
                  <TimeField12
                    label={t.startTimeLabel}
                    lang={lang}
                    value={startClock}
                    onChange={(next) => setStartOverride(next || null)}
                    className="mt-2"
                  />
                </div>

                <p className="text-[11px] leading-relaxed text-ndim">
                  {t.stepMinutesHint}
                </p>
              </div>
            ) : null}
          </section>

          {/* تذكير المساء — إشعار واحد فقط */}
          <section className="mt-4 rounded-3xl border border-nline bg-ncard p-4">
            <h2 className="inline-flex items-center gap-2 text-base font-medium text-nhi">
              <BellRing aria-hidden="true" className="h-4 w-4 text-gold" />
              {t.reminderTitle}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-nlo">
              {t.reminderBody}
            </p>

            <p className="mt-3 text-xs font-medium text-gold">
              {t.reminderTimeLabel}
            </p>
            <TimeField12
              label={t.reminderTimeLabel}
              lang={lang}
              value={effectiveReminderTime}
              onChange={(next) =>
                setReminder(reminderEnabled, next || defaultReminderTime)
              }
              className="mt-2"
            />
            <p className="mt-1 text-[11px] leading-relaxed text-ndim">
              {t.reminderTimeHint}
            </p>

            <Button
              type="button"
              onClick={toggleReminder}
              className={`mt-3 h-11 w-full rounded-full px-4 text-sm font-medium ${
                reminderEnabled
                  ? "border border-nedge bg-nchip/40 text-nmd hover:bg-nchip"
                  : "bg-gold text-goldink hover:bg-gold/90"
              }`}
            >
              {reminderEnabled ? t.reminderDisable : t.reminderEnable}
            </Button>

            {permission === "granted" && !reminderEnabled ? (
              <p className="mt-2 text-center text-[11px] text-ndim">
                {t.reminderGranted}
              </p>
            ) : null}

            {reminderNotice ? (
              <p
                role="status"
                className="mt-2 rounded-2xl border border-gold/25 bg-gold/10 px-3 py-2 text-center text-[11px] leading-relaxed text-gold"
              >
                {reminderNotice}
              </p>
            ) : null}
          </section>

          {tomorrowDelays.length > 0 ? (
            <p className="mt-3 text-center text-[11px] leading-relaxed text-ndim">
              {fillText(t.delayNoticeShifted, {
                minutes: totalDelayMinutes(tomorrowDelays),
              })}
            </p>
          ) : null}
        </div>

        <TabBar active="today" />
      </div>
    </main>
  );
}
