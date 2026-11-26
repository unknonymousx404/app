"use client";

import { DemoBadge } from "@/components/demo-badge";

import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Minus, Pencil, Plus } from "lucide-react";
import { TabBar } from "@/components/nav/tabbar";
import { Button } from "@/components/ui/button";
import { TimeField12 } from "@/components/ui/time-field-12";
import { ageParts, localIsoDate } from "@/lib/age";
import { BRAND } from "@/lib/brand";
import { useChildName } from "@/lib/child-name";
import {
  ageRulesForMonths,
  formatClock,
  parseClock,
} from "@/lib/engine/age-rules";
import { buildFirstPlan } from "@/lib/engine/first-plan";
import {
  NIGHTS,
  fillText,
  formatAgeMonths,
  formatTime,
  type Lang,
} from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import {
  DEMO_PROFILE,
  isProfileComplete,
  useProfile,
} from "@/lib/store/profile";
import { usePlan } from "@/lib/store/plan";
import {
  averageWakeCount,
  useNights,
  type MorningMood,
  type NightRecord,
} from "@/lib/store/nights";

// بوابة التركيب: الخادم يعرض الهيكل، والعميل يعرض التسجيل المحفوظ.
function subscribeToHydration(): () => void {
  return () => {};
}
function getHydrated(): boolean {
  return true;
}
function getHydratedOnServer(): boolean {
  return false;
}

// خيارات وقت النوم: وقت النوم المتوقع في خطة أمس ± 25 دقيقة كحد أقصى.
const SLEEP_OFFSETS = [-20, -10, 0, 10, 20] as const;
const MAX_WAKE_COUNT = 20;

function formatAverage(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** قالب فيه {value}: الرقم لاتيني معزول داخل جملة عربية/إنجليزية. */
function ValueText({
  template,
  value,
}: {
  template: string;
  value: ReactNode;
}) {
  const [before, after] = template.split("{value}");
  return (
    <>
      {before}
      <span dir="ltr" className="ltr-inline">
        {value}
      </span>
      {after ?? ""}
    </>
  );
}

function Chip({
  selected,
  onClick,
  ariaLabel,
  ariaExpanded,
  faint,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  faint?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
        selected
          ? "border-gold bg-gold/15 text-gold"
          : faint
            ? "border-dashed border-nedge/70 bg-transparent text-ndim hover:border-nedge hover:text-nlo"
            : "border-nline bg-nchip/40 text-nmd hover:border-nedge hover:text-nhi"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * نموذج التسجيل — ثلاث بطاقات، كل إجابة بنقرة واحدة.
 * الكيبورد في «وقت آخر» وحده، وهو استثناء موثق في docs/screens.md.
 */
function NightForm({
  lang,
  options,
  planBedtime,
  average,
  initial,
  onSave,
  onEmergency,
}: {
  lang: Lang;
  options: string[];
  planBedtime: string;
  average: number | null;
  initial: NightRecord | null;
  onSave: (draft: Omit<NightRecord, "date" | "emergency">) => void;
  onEmergency: (draft: Omit<NightRecord, "date" | "emergency">) => void;
}) {
  const t = NIGHTS[lang];
  const name = useChildName();

  const [sleepTime, setSleepTime] = useState<string | null>(
    initial?.sleepTime ?? null,
  );
  const [customOpen, setCustomOpen] = useState(
    initial ? !options.includes(initial.sleepTime) : false,
  );
  const [wakeCount, setWakeCount] = useState(initial?.wakeCount ?? 0);
  const [mood, setMood] = useState<MorningMood | null>(
    initial?.morningMood ?? null,
  );
  const [emergencyOn, setEmergencyOn] = useState(
    Boolean(initial?.emergency),
  );

  const ready = Boolean(sleepTime) && Boolean(mood);

  const moods: { id: MorningMood; label: string }[] = [
    { id: "rested", label: t.moodRested },
    { id: "tired", label: t.moodTired },
    { id: "hard", label: t.moodHard },
  ];

  const save = () => {
    if (!sleepTime || !mood) return;
    onSave({ sleepTime, wakeCount, morningMood: mood });
  };

  const activateEmergency = () => {
    const time = sleepTime ?? planBedtime;
    const nextMood = mood ?? "hard";

    setSleepTime(time);
    setMood(nextMood);
    setEmergencyOn(true);
    onEmergency({ sleepTime: time, wakeCount, morningMood: nextMood });
  };

  return (
    <>
      {/* بطاقة 1 — وقت النوم، مشتق من خطة أمس */}
      <section
        aria-labelledby="night-sleep-title"
        className="mt-6 rounded-3xl border border-nline bg-ncard p-4"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
          <h2
            id="night-sleep-title"
            className="text-base leading-snug font-medium text-nhi"
          >
            {fillText(t.cardSleepTitle, { name })}
          </h2>
          <span className="text-[11px] text-ndim">{t.cardSleepHint}</span>
        </div>

        <div
          role="group"
          aria-labelledby="night-sleep-title"
          className="mt-3 flex flex-wrap gap-2"
        >
          {options.map((time) => (
            <Chip
              key={time}
              selected={!customOpen && sleepTime === time}
              onClick={() => {
                setSleepTime(time);
                setCustomOpen(false);
              }}
            >
              <span dir="ltr" className="ltr-inline">
                {formatTime(lang, time)}
              </span>
            </Chip>
          ))}

          <Chip
            faint
            selected={customOpen}
            ariaLabel={t.otherTimeAria}
            ariaExpanded={customOpen}
            onClick={() => {
              setCustomOpen(true);
              setSleepTime(null);
            }}
          >
            {t.otherTime}
          </Chip>
        </div>

        {customOpen ? (
          <TimeField12
            label={fillText(t.timePickerAria, { name })}
            lang={lang}
            value={sleepTime ?? planBedtime}
            onChange={(next) => setSleepTime(next || null)}
            className="mt-3"
          />
        ) : null}
      </section>

      {/* بطاقة 2 — عدّاد الاستيقاظ + متوسط الأسبوع من المخزن */}
      <section
        aria-labelledby="night-wake-title"
        className="mt-4 rounded-3xl border border-nline bg-ncard p-4"
      >
        <h2
          id="night-wake-title"
          className="text-base leading-snug font-medium text-nhi"
        >
          {t.cardWakeTitle}
        </h2>

        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setWakeCount((value) => Math.max(0, value - 1))}
            disabled={wakeCount === 0}
            aria-label={t.wakeDecrease}
            className="flex size-11 items-center justify-center rounded-full border border-nline bg-nchip/50 text-nhi transition-colors duration-200 hover:border-nedge hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:opacity-40"
          >
            <Minus aria-hidden="true" className="h-4 w-4" />
          </button>

          <span
            aria-label={t.wakeValueAria}
            aria-live="polite"
            className="text-4xl leading-none font-medium text-nhi tabular-nums"
          >
            <span dir="ltr" className="ltr-inline">
              {wakeCount}
            </span>
          </span>

          <button
            type="button"
            onClick={() =>
              setWakeCount((value) => Math.min(MAX_WAKE_COUNT, value + 1))
            }
            aria-label={t.wakeIncrease}
            className="flex size-11 items-center justify-center rounded-full border border-nline bg-nchip/50 text-nhi transition-colors duration-200 hover:border-nedge hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-nlo">
          {average === null ? (
            t.wakeAverageNone
          ) : (
            <ValueText
              template={t.wakeAverage}
              value={formatAverage(average)}
            />
          )}
        </p>
      </section>

      {/* بطاقة 3 — مزاج الصباح */}
      <section
        aria-labelledby="night-mood-title"
        className="mt-4 rounded-3xl border border-nline bg-ncard p-4"
      >
        <h2
          id="night-mood-title"
          className="text-base leading-snug font-medium text-nhi"
        >
          {t.cardMoodTitle}
        </h2>

        <div
          role="group"
          aria-labelledby="night-mood-title"
          className="mt-3 flex flex-wrap gap-2"
        >
          {moods.map((entry) => (
            <Chip
              key={entry.id}
              selected={mood === entry.id}
              onClick={() => setMood(entry.id)}
            >
              {entry.label}
            </Chip>
          ))}
        </div>
      </section>

      <div className="mt-6">
        <Button
          type="button"
          onClick={save}
          disabled={!ready}
          className="h-12 w-full rounded-full bg-gold px-6 text-base font-normal text-goldink hover:bg-gold/90 focus-visible:ring-gold/60 disabled:opacity-50"
        >
          {t.saveCta}
        </Button>

        <Button
          type="button"
          onClick={activateEmergency}
          className="mt-3 h-11 w-full rounded-full border border-gold/40 bg-transparent px-6 text-sm font-normal text-gold/90 hover:bg-gold/10 focus-visible:ring-gold/60"
        >
          {t.emergencyCta}
        </Button>

        {emergencyOn ? (
          <p
            role="status"
            className="mt-3 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-center text-xs leading-relaxed text-gold"
          >
            {t.emergencyOn}
          </p>
        ) : null}

        <p className="mt-4 text-center text-[11px] leading-relaxed text-ndim">
          {emergencyOn ? t.emergencyTone : t.notice}
        </p>
      </div>
    </>
  );
}

/** وضع العرض بعد التسجيل — مع تعديل متاح دائماً. */
function NightSummary({
  lang,
  night,
  justSaved,
  onEdit,
}: {
  lang: Lang;
  night: NightRecord;
  justSaved: boolean;
  onEdit: () => void;
}) {
  const t = NIGHTS[lang];

  const moodLabel =
    night.morningMood === "rested"
      ? t.moodRested
      : night.morningMood === "tired"
        ? t.moodTired
        : t.moodHard;

  const rows: { id: string; label: string; value: ReactNode }[] = [
    {
      id: "sleep",
      label: t.summarySleep,
      value: (
        <span dir="ltr" className="ltr-inline">
          {formatTime(lang, night.sleepTime)}
        </span>
      ),
    },
    {
      id: "wakes",
      label: t.summaryWakes,
      value: (
        <span dir="ltr" className="ltr-inline">
          {night.wakeCount}
        </span>
      ),
    },
    { id: "mood", label: t.summaryMood, value: moodLabel },
  ];

  return (
    <>
      {justSaved ? (
        <p
          role="status"
          className="mt-5 rounded-2xl border border-ngreen/30 bg-ngreen/10 px-4 py-3 text-center text-sm leading-relaxed text-ngreen"
        >
          {t.savedNotice}
        </p>
      ) : null}

      {night.emergency ? (
        <section
          aria-labelledby="night-emergency-title"
          className="mt-5 rounded-3xl border border-gold/30 bg-nsoft p-5"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--color-nblue), var(--color-nsoft))",
          }}
        >
          <h2
            id="night-emergency-title"
            className="text-base font-medium text-gold"
          >
            {t.emergencyBannerTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-nmd">
            {t.emergencyBannerBody}
          </p>
        </section>
      ) : null}

      <section
        aria-labelledby="night-summary-title"
        className="mt-5 rounded-3xl border border-nline bg-ncard p-4"
      >
        <h2
          id="night-summary-title"
          className="text-base leading-snug font-medium text-nhi"
        >
          {t.summaryTitle}
        </h2>

        <ul className="mt-3 space-y-2.5">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 border-b border-nline/60 pb-2.5 text-sm last:border-b-0 last:pb-0"
            >
              <span className="text-nlo">{row.label}</span>
              <span className="font-medium text-nhi">{row.value}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6">
        <Button
          type="button"
          onClick={onEdit}
          className="h-11 w-full rounded-full border border-nedge bg-nchip/40 px-6 text-sm font-normal text-nmd hover:bg-nchip hover:text-nhi focus-visible:ring-gold/60"
        >
          <Pencil aria-hidden="true" className="h-4 w-4" />
          {t.edit}
        </Button>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-ndim">
          {night.emergency ? t.emergencyTone : t.notice}
        </p>
      </div>
    </>
  );
}

export function Screen05() {
  const lang = useLang();
  const t = NIGHTS[lang];
  const childName = useChildName();
  const router = useRouter();
  const profile = useProfile();
  const storedPlan = usePlan((state) => state.plan);
  const nights = useNights((state) => state.nights);
  const saveNight = useNights((state) => state.saveNight);
  const seedDemoNights = useNights((state) => state.seedDemoNights);
  const clearNights = useNights((state) => state.clearNights);

  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrated,
    getHydratedOnServer,
  );

  // auto: التسجيل إن لم يُسجَّل اليوم، عرض إن سُجّل. edit/view بعد ذلك.
  const [mode, setMode] = useState<"auto" | "edit" | "view">("auto");
  const [justSaved, setJustSaved] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const { birthDate, worstProblem, wakePattern, priorityGoal } =
    isProfileComplete(profile) ? profile : DEMO_PROFILE;

  const todayIso = hydrated ? localIsoDate() : null;
  // زر التطوير مخفي دائماً إلا مع ?dev=1 في الرابط.
  const devMode =
    hydrated && new URLSearchParams(window.location.search).get("dev") === "1";

  // اللغة والاتجاه والعنوان على مستوى الوثيقة — كما في الشاشات 01–03.
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

  // خطة أمس الفعلية: المحفوظة إن وُجدت، وإلا خطة اليوم المولدة من الملف.
  const plan = useMemo(() => {
    if (!hydrated) return null;
    if (storedPlan) return storedPlan;

    const today = new Date();
    const age = ageParts(birthDate, today) ?? { months: 0, days: 0 };

    return buildFirstPlan(
      { birthDate, worstProblem, wakePattern, priorityGoal },
      ageRulesForMonths(age.months),
      today,
    );
  }, [hydrated, storedPlan, birthDate, worstProblem, wakePattern, priorityGoal]);

  const sleepOptions = useMemo(() => {
    if (!plan) return [];
    const base = parseClock(plan.bedtime);
    return SLEEP_OFFSETS.map((offset) => formatClock(base + offset));
  }, [plan]);

  const average = useMemo(
    () => (hydrated ? averageWakeCount(nights, new Date()) : null),
    [hydrated, nights],
  );

  if (!hydrated || !todayIso || !plan) {
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

  const night = nights.find((entry) => entry.date === todayIso) ?? null;
  const showForm = mode === "edit" || (mode === "auto" && !night);

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
              {t.greeting}
            </h1>
            <p className="mt-1 text-sm text-nlo">
              {fillText(t.subline, {
                name: childName,
                age: formatAgeMonths(lang, plan.ageMonths),
              })}
            </p>
          </header>

          {showForm ? (
            <NightForm
              key={night?.date ?? "new"}
              lang={lang}
              options={sleepOptions}
              planBedtime={plan.bedtime}
              average={average}
              initial={night}
              onSave={(draft) => {
                saveNight({
                  date: todayIso,
                  ...draft,
                  emergency: night?.emergency,
                });
                setJustSaved(true);
                setMode("view");
                // الحلقة تُغلق: التسجيل يفتح خطة اليوم المعدّلة مباشرة (06).
                router.push("/plan/today");
              }}
              onEmergency={(draft) => {
                saveNight({ date: todayIso, ...draft, emergency: true });
                setMode("edit");
                // الطوارئ تُكمل في 06 بالقالب الهادئ بلا تعديلات.
                router.push("/plan/today");
              }}
            />
          ) : (
            <NightSummary
              lang={lang}
              night={night as NightRecord}
              justSaved={justSaved}
              onEdit={() => {
                setJustSaved(false);
                setMode("edit");
              }}
            />
          )}

          {devMode ? (
            <section
              aria-labelledby="night-dev-title"
              className="mt-8 rounded-2xl border border-dashed border-nedge/70 p-4"
            >
              <h2
                id="night-dev-title"
                className="text-[11px] font-medium text-ndim"
              >
                {t.devTitle}
              </h2>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    seedDemoNights();
                    setMode("auto");
                    setSeeded(true);
                  }}
                  className="min-h-11 rounded-full border border-nline bg-nchip/40 px-3 text-xs text-nmd transition-colors hover:border-nedge hover:text-nhi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                >
                  {t.devSeed}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    clearNights();
                    setMode("auto");
                    setSeeded(false);
                  }}
                  className="min-h-11 rounded-full border border-dashed border-nedge/70 px-3 text-xs text-ndim transition-colors hover:text-nlo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                >
                  {t.devClear}
                </button>
              </div>

              {seeded ? (
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
