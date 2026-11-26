"use client";

import { DemoBadge } from "@/components/demo-badge";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type Ref,
} from "react";
import { toBlob } from "html-to-image";
import Link from "next/link";
import {
  Award,
  Check,
  Lock,
  Moon,
  Share2,
  Sparkles,
  TrendingDown,
  X,
} from "lucide-react";
import { TabBar } from "@/components/nav/tabbar";
import { Button } from "@/components/ui/button";
import { ageParts, localIsoDate } from "@/lib/age";
import { BRAND } from "@/lib/brand";
import { useChildName } from "@/lib/child-name";
import { survivalGuideForAge } from "@/lib/content/library";
import {
  computeProgress,
  hoursLabel,
  weekdayIndex,
  type Achievement,
  type AchievementId,
  type ProgressDay,
} from "@/lib/engine/progress";
import {
  PROGRESS,
  WEEKDAYS,
  fillText,
  formatAgeMonths,
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
  useNights,
  type MorningMood,
} from "@/lib/store/nights";

// بوابة التركيب: الخادم يعرض الهيكل، والعميل يحسب التقدم من المخزن.
function subscribeToHydration(): () => void {
  return () => {};
}
function getHydrated(): boolean {
  return true;
}
function getHydratedOnServer(): boolean {
  return false;
}

type ProgressKey = keyof typeof PROGRESS.ar;

const BADGE_KEYS: Record<AchievementId, ProgressKey> = {
  "first-full-night": "badgeFirstFullNight",
  "first-week": "badgeFirstWeek",
  "steady-week": "badgeSteadyWeek",
  "first-improvement": "badgeFirstImprovement",
};

const BADGE_ORDER: AchievementId[] = [
  "first-full-night",
  "first-week",
  "steady-week",
  "first-improvement",
];

/** يملأ قالباً بقيم، ويُعزل الأرقام داخل span لاتيني (ltr) داخل الصفحة RTL. */
function TemplateText({
  template,
  params,
  numeric = [],
}: {
  template: string;
  params: Record<string, string | number>;
  numeric?: string[];
}) {
  const parts = template.split(/(\{\w+\})/g);
  return (
    <>
      {parts.map((part, index) => {
        const match = /^\{(\w+)\}$/.exec(part);
        if (!match) return <span key={index}>{part}</span>;
        const value = params[match[1]];
        if (value === undefined) return <span key={index}>{part}</span>;
        return numeric.includes(match[1]) ? (
          <span key={index} dir="ltr" className="ltr-inline">
            {String(value)}
          </span>
        ) : (
          <span key={index}>{String(value)}</span>
        );
      })}
    </>
  );
}

/** بطاقة الأسبوع — سبعة أعمدة فقط، مقياس واحد: أطول نوم متصل. */
function WeekBars({ lang, days }: { lang: Lang; days: ProgressDay[] }) {
  const t = PROGRESS[lang];
  const maxMinutes = Math.max(
    ...days.map((day) => day.longestMinutes),
    6 * 60,
  );

  return (
    <section
      aria-labelledby="progress-week-title"
      className="mt-4 rounded-3xl border border-nline bg-ncard p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <h2
          id="progress-week-title"
          className="text-base leading-snug font-medium text-nhi"
        >
          {t.weekTitle}
        </h2>
        <span className="text-[11px] text-ndim">{t.weekSubtitle}</span>
      </div>

      <ul className="mt-4 flex items-end justify-between gap-1.5">
        {days.map((day) => {
          const weekday = WEEKDAYS[lang][weekdayIndex(day.date)];
          const ratio =
            day.hasRecord && maxMinutes > 0
              ? Math.max(0.06, day.longestMinutes / maxMinutes)
              : 0;
          const fillClass = day.committed ? "bg-ngreen" : "bg-nblue";
          const label = day.hasRecord
            ? fillText(t.barAria, {
                day: weekday,
                hours: hoursLabel(day.longestMinutes),
              })
            : fillText(t.barEmptyAria, { day: weekday });

          return (
            <li
              key={day.date}
              className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
            >
              <span
                aria-hidden="true"
                className="text-[10px] leading-none text-nlo tabular-nums"
              >
                {day.hasRecord ? (
                  <span dir="ltr" className="ltr-inline">
                    {hoursLabel(day.longestMinutes)}
                  </span>
                ) : (
                  "—"
                )}
              </span>

              <div
                role="img"
                aria-label={label}
                className="relative flex h-28 w-full items-end overflow-hidden rounded-lg bg-nsoft/70"
              >
                <span
                  aria-hidden="true"
                  className={`w-full rounded-lg transition-[height] duration-500 ${fillClass}`}
                  style={{ height: `${ratio * 100}%` }}
                />
              </div>

              <span className="w-full truncate text-center text-[10px] leading-none text-ndim">
                {weekday}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex items-center gap-4 border-t border-nline/60 pt-3 text-[11px] text-nlo">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-sm bg-ngreen" />
          {t.legendGood}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-sm bg-nblue" />
          {t.legendNormal}
        </span>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-ndim">{t.weekHint}</p>
    </section>
  );
}

/** شارة إنجاز — زر إن كانت مفتوحة (أول ليلة كاملة)، وإلا عنصر ساكن. */
function AchievementBadge({
  lang,
  achievement,
  onOpenCelebration,
}: {
  lang: Lang;
  achievement: Achievement;
  onOpenCelebration?: () => void;
}) {
  const t = PROGRESS[lang];
  const label = t[BADGE_KEYS[achievement.id]];
  const state = achievement.unlocked ? t.badgeUnlocked : t.badgeLocked;
  const canOpen = achievement.unlocked && achievement.id === "first-full-night";

  const content = (
    <>
      <span
        aria-hidden="true"
        className={`flex size-10 items-center justify-center rounded-full ${
          achievement.unlocked
            ? "bg-gold/15 text-gold"
            : "bg-nchip/60 text-ndim"
        }`}
      >
        {achievement.unlocked ? (
          <Award className="h-5 w-5" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
      </span>
      <span className="min-w-0 flex-1 text-start">
        <span
          className={`block text-xs leading-snug font-medium ${
            achievement.unlocked ? "text-nhi" : "text-nlo"
          }`}
        >
          {label}
        </span>
        <span
          className={`mt-0.5 block text-[10px] ${
            achievement.unlocked ? "text-ngreen" : "text-ndim"
          }`}
        >
          {state}
        </span>
      </span>
      {achievement.unlocked ? (
        <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-ngreen" />
      ) : null}
    </>
  );

  if (canOpen) {
    return (
      <button
        type="button"
        onClick={onOpenCelebration}
        aria-label={fillText(t.badgeAria, { badge: label, state })}
        className="flex min-h-11 w-full items-center gap-2.5 rounded-2xl border border-gold/40 bg-gold/10 px-3 py-2.5 transition-colors hover:bg-gold/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      >
        {content}
      </button>
    );
  }

  return (
    <div
      aria-label={fillText(t.badgeAria, { badge: label, state })}
      className="flex min-h-11 w-full items-center gap-2.5 rounded-2xl border border-nline bg-nsoft/50 px-3 py-2.5"
    >
      {content}
    </div>
  );
}

/** بطاقة المشاركة النظيفة للاحتفال — لا اسم ولا عمر ولا بيانات خاصة. */
function CelebrationCard({
  lang,
  cardRef,
}: {
  lang: Lang;
  cardRef: Ref<HTMLDivElement>;
}) {
  const t = PROGRESS[lang];
  return (
    <div
      ref={cardRef}
      aria-hidden="true"
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="pointer-events-none fixed top-0 left-0 -z-10 w-[420px] bg-night-deep p-7 text-nhi"
    >
      <div className="flex items-center justify-center pt-4">
        <span
          aria-hidden="true"
          className="raha-moon"
          style={{ width: 96, height: 96 }}
        />
      </div>

      <p className="mt-6 text-center text-xs text-gold">
        {t.celebrateCardEyebrow}
      </p>
      <h2 className="mt-1 text-center text-2xl leading-snug text-nhi">
        {t.celebrateCardTitle}
      </h2>
      <p className="mt-3 text-center text-sm leading-relaxed text-nmd">
        {t.celebrateCardBody}
      </p>

      <p className="mt-6 text-center text-sm leading-relaxed text-nlo">
        {t.celebrateCardTagline}
      </p>
      <p className="mt-5 border-t border-nline pt-4 text-center text-xs text-ndim">
        {t.celebrateCardFooter}
      </p>
    </div>
  );
}

export function Screen08() {
  const lang = useLang();
  const t = PROGRESS[lang];
  const name = useChildName();

  const profile = useProfile();
  const storedPlan = usePlan((state) => state.plan);
  const nights = useNights((state) => state.nights);
  const saveNight = useNights((state) => state.saveNight);
  const clearNights = useNights((state) => state.clearNights);

  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrated,
    getHydratedOnServer,
  );

  const todayIso = hydrated ? localIsoDate() : null;
  const devMode =
    hydrated &&
    new URLSearchParams(window.location.search).get("dev") === "1";

  const [celebrating, setCelebrating] = useState(false);
  const [shareStatus, setShareStatus] = useState<
    "idle" | "working" | "done" | "error"
  >("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const shareBlobRef = useRef<Blob | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [seeded, setSeeded] = useState(false);

  const { birthDate } = isProfileComplete(profile) ? profile : DEMO_PROFILE;

  // لا قراءة وقت أثناء prerender — التاريخ يُبنى بعد التركيب فقط (Next 16).
  const todayDate = useMemo(
    () => (hydrated ? new Date() : null),
    [hydrated],
  );

  const age = useMemo(
    () =>
      (todayDate ? ageParts(birthDate, todayDate) : null) ?? {
        months: 0,
        days: 0,
      },
    [birthDate, todayDate],
  );

  const planBedtime = storedPlan?.bedtime ?? null;

  const summary = useMemo(() => {
    if (!hydrated || !todayIso) return null;
    return computeProgress(nights, todayIso, planBedtime);
  }, [hydrated, todayIso, nights, planBedtime]);

  // اللغة والاتجاه والعنوان على مستوى الوثيقة.
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

  // إغلاق الاحتفال بمفتاح Escape.
  useEffect(() => {
    if (!celebrating) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCelebrating(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [celebrating]);

  // تحرير رابط المعاينة عند مغادرة الشاشة.
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  if (!hydrated || !todayIso || !summary) {
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

  const survivalLesson = survivalGuideForAge(age.months);
  const recentMinutes =
    summary.weekAverageMinutes ?? summary.baselineMinutes ?? 0;

  // نص الخلاصة: انحدار → تهدئة، تحسن → احتفال، وإلا ثبات.
  let story: ReactNode;
  if (summary.regression) {
    story = (
      <TemplateText
        template={t.storyRegression}
        params={{ name }}
      />
    );
  } else if (
    summary.improvementStreak >= 2 &&
    summary.weekAverageMinutes !== null &&
    summary.baselineMinutes !== null
  ) {
    const template = summary.baselineIsPrevious
      ? t.storyImprovingPrev
      : t.storyImprovingStart;
    story = (
      <TemplateText
        template={template}
        params={{
          n: summary.improvementStreak,
          name,
          recent: hoursLabel(summary.weekAverageMinutes),
          prev: hoursLabel(summary.baselineMinutes),
        }}
        numeric={["n", "recent", "prev"]}
      />
    );
  } else {
    story = (
      <TemplateText
        template={t.storySteady}
        params={{ name, recent: hoursLabel(recentMinutes) }}
        numeric={["recent"]}
      />
    );
  }

  const nextAchievement = summary.nextAchievement;
  const badges = BADGE_ORDER.map(
    (id) => summary.achievements.find((entry) => entry.id === id)!,
  );

  // ------------------------- الاحتفال والمشاركة -------------------------

  const prepareImage = async (): Promise<Blob | null> => {
    if (!shareRef.current) return null;

    setShareStatus("working");
    setPreviewUrl(null);

    try {
      await document.fonts.ready;
      const blob = await toBlob(shareRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      if (!blob) throw new Error("empty image");

      shareBlobRef.current = blob;

      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreviewUrl(url);
      setShareStatus("idle");
      return blob;
    } catch {
      shareBlobRef.current = null;
      setShareStatus("error");
      return null;
    }
  };

  const openCelebration = () => {
    setShareStatus("idle");
    setPreviewUrl(null);
    setCelebrating(true);
    void prepareImage();
  };

  const shareCelebration = async () => {
    if (shareStatus === "working") return;

    const blob = shareBlobRef.current ?? (await prepareImage());
    if (!blob) return;

    setShareStatus("working");

    try {
      const file = new File([blob], "raha-first-night.png", {
        type: "image/png",
      });
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
        share?: (data?: ShareData) => Promise<void>;
      };

      const canShareFile =
        typeof nav.share === "function" &&
        typeof nav.canShare === "function" &&
        nav.canShare({ files: [file] });

      if (canShareFile) {
        try {
          await nav.share?.({ files: [file], title: t.celebrateTitle });
          setShareStatus("done");
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            setShareStatus("idle");
            return;
          }
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "raha-first-night.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setShareStatus("done");
    } catch {
      setShareStatus("error");
    }
  };

  const shareMessage =
    shareStatus === "working"
      ? t.celebrateWorking
      : shareStatus === "done"
        ? t.celebrateDone
        : shareStatus === "error"
          ? t.celebrateError
          : null;

  // ------------------------- بيانات التطوير -------------------------

  const seed = (
    rows: { sleep: string; wakes: number; mood: MorningMood }[],
  ) => {
    clearNights();
    rows.forEach((row, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (rows.length - 1 - index));
      saveNight({
        date: localIsoDate(date),
        sleepTime: row.sleep,
        wakeCount: row.wakes,
        morningMood: row.mood,
      });
    });
    setSeeded(true);
  };

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
              {t.headerTitle}
            </h1>
            <p className="mt-1 text-sm text-nlo">
              {fillText(t.headerSubline, {
                name,
                age: formatAgeMonths(lang, age.months),
              })}
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1.5 text-xs leading-none text-gold">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              {t.eyebrow}
            </p>
          </header>

          {summary.totalNights === 0 ? (
            <section
              aria-labelledby="progress-empty-title"
              className="mt-6 rounded-3xl border border-nline bg-ncard p-5"
            >
              <h2
                id="progress-empty-title"
                className="text-base font-medium text-nhi"
              >
                {t.emptyTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-nmd">
                {t.emptyBody}
              </p>
            </section>
          ) : (
            <>
              {/* البطاقة الذهبية — الخلاصة بقصة إنسانية */}
              <section
                aria-labelledby="progress-summary-title"
                className="mt-6 rounded-3xl border border-gold/30 p-5"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--color-nblue), var(--color-nsoft))",
                }}
              >
                <div className="flex items-center gap-2 text-gold">
                  {summary.regression ? (
                    <TrendingDown aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <Sparkles aria-hidden="true" className="h-4 w-4" />
                  )}
                  <h2
                    id="progress-summary-title"
                    className="text-xs font-medium"
                  >
                    {t.summaryEyebrow}
                  </h2>
                </div>
                <p className="mt-2 text-base leading-relaxed text-nhi">
                  {story}
                </p>

                {summary.regression ? (
                  <div className="mt-4">
                    <Link
                      href={`/library?lesson=${encodeURIComponent(survivalLesson.id)}`}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 text-xs text-gold"
                    >
                      <Moon aria-hidden="true" className="h-4 w-4" />
                      {t.regressionLink}
                    </Link>
                    <p className="mt-2 text-[11px] text-ndim">
                      {t.regressionHint}
                    </p>
                  </div>
                ) : null}
              </section>

              <WeekBars lang={lang} days={summary.days} />

              {/* الإنجاز القادم */}
              <section
                aria-labelledby="progress-next-title"
                className="mt-4 rounded-3xl border border-nline bg-ncard p-4"
              >
                <h2
                  id="progress-next-title"
                  className="text-base leading-snug font-medium text-nhi"
                >
                  {t.nextTitle}
                </h2>

                {nextAchievement ? (
                  <>
                    <p className="mt-2 text-sm leading-relaxed text-nmd">
                      {t[BADGE_KEYS[nextAchievement.id]]}
                    </p>
                    <p className="mt-1 text-xs text-nlo">{t.nextHint}</p>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-nsoft">
                      <div
                        className="h-full rounded-full bg-gold transition-[width] duration-500"
                        style={{ width: `${nextAchievement.ratio * 100}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-ndim">
                      {fillText(t.nextProgress, {
                        current: nextAchievement.current,
                        target: nextAchievement.target,
                      })}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-nmd">
                    {t.nextAllDone}
                  </p>
                )}
              </section>

              {/* شارات الإنجازات */}
              <section
                aria-labelledby="progress-badges-title"
                className="mt-4"
              >
                <h2
                  id="progress-badges-title"
                  className="text-base leading-snug font-medium text-nhi"
                >
                  {t.badgesTitle}
                </h2>
                <ul className="mt-3 grid grid-cols-1 gap-2">
                  {badges.map((achievement) => (
                    <li key={achievement.id}>
                      <AchievementBadge
                        lang={lang}
                        achievement={achievement}
                        onOpenCelebration={openCelebration}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}

          <p className="mt-5 rounded-2xl border border-nline/70 bg-nsoft/40 px-4 py-3 text-center text-xs leading-relaxed text-ndim">
            {t.disclaimer}
          </p>

          {devMode ? (
            <section
              aria-labelledby="progress-dev-title"
              className="mt-8 rounded-2xl border border-dashed border-nedge/70 p-4"
            >
              <h2
                id="progress-dev-title"
                className="text-[11px] font-medium text-ndim"
              >
                {t.devTitle}
              </h2>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    seed([
                      { sleep: "19:30", wakes: 7, mood: "tired" },
                      { sleep: "19:30", wakes: 6, mood: "tired" },
                      { sleep: "19:30", wakes: 5, mood: "tired" },
                      { sleep: "19:30", wakes: 4, mood: "rested" },
                      { sleep: "19:30", wakes: 3, mood: "rested" },
                      { sleep: "19:30", wakes: 2, mood: "rested" },
                      { sleep: "19:30", wakes: 1, mood: "rested" },
                    ])
                  }
                  className="min-h-11 rounded-full border border-nline bg-nchip/40 px-3 text-xs text-nmd transition-colors hover:border-nedge hover:text-nhi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                >
                  {t.devImproving}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    seed([
                      { sleep: "19:30", wakes: 6, mood: "tired" },
                      { sleep: "19:30", wakes: 5, mood: "rested" },
                      { sleep: "19:30", wakes: 4, mood: "rested" },
                      { sleep: "19:30", wakes: 3, mood: "rested" },
                      { sleep: "19:30", wakes: 2, mood: "rested" },
                      { sleep: "19:30", wakes: 1, mood: "rested" },
                      { sleep: "19:30", wakes: 0, mood: "rested" },
                    ])
                  }
                  className="min-h-11 rounded-full border border-gold/40 bg-gold/10 px-3 text-xs text-gold transition-colors hover:bg-gold/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                >
                  {t.devFullNight}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    seed([
                      { sleep: "19:30", wakes: 1, mood: "rested" },
                      { sleep: "19:30", wakes: 2, mood: "rested" },
                      { sleep: "19:30", wakes: 3, mood: "tired" },
                      { sleep: "19:30", wakes: 4, mood: "tired" },
                      { sleep: "19:30", wakes: 5, mood: "hard" },
                      { sleep: "19:30", wakes: 6, mood: "hard" },
                      { sleep: "19:30", wakes: 7, mood: "hard" },
                    ])
                  }
                  className="min-h-11 rounded-full border border-nline bg-nchip/40 px-3 text-xs text-nmd transition-colors hover:border-nedge hover:text-nhi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                >
                  {t.devRegression}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    clearNights();
                    setSeeded(false);
                  }}
                  className="min-h-11 rounded-full border border-dashed border-nedge/70 px-3 text-xs text-ndim transition-colors hover:text-nlo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                >
                  {t.devReset}
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

        <TabBar active="progress" />
      </div>

      <CelebrationCard lang={lang} cardRef={shareRef} />

      {celebrating ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="progress-celebrate-title"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-night-deep/95 p-6 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={() => setCelebrating(false)}
            aria-label={t.celebrateClose}
            className="absolute top-4 end-4 flex size-11 items-center justify-center rounded-full border border-nedge bg-nchip/40 text-nmd hover:bg-nchip"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>

          <span
            aria-hidden="true"
            className="raha-moon"
            style={{ width: 112, height: 112 }}
          />

          <div className="text-center">
            <h2
              id="progress-celebrate-title"
              className="text-2xl leading-snug font-medium text-gold"
            >
              {t.celebrateTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-nmd">
              {fillText(t.celebrateBody, { name })}
            </p>
          </div>

          {previewUrl ? (
            <div className="w-full max-w-[280px] overflow-hidden rounded-3xl border border-nline bg-night-deep shadow-2xl shadow-night-deep/60">
              {/* معاينة من blob محلي — لا تمر بالشبكة. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={t.celebratePreviewTitle}
                className="mx-auto block max-h-[32dvh] w-auto max-w-full object-contain"
              />
            </div>
          ) : null}

          <div className="w-full max-w-[320px]">
            <Button
              type="button"
              onClick={shareCelebration}
              disabled={shareStatus === "working"}
              className="h-11 w-full rounded-full bg-gold px-6 text-sm font-normal text-goldink hover:bg-gold/90 focus-visible:ring-gold/60 disabled:opacity-60"
            >
              <Share2 aria-hidden="true" className="h-4 w-4" />
              {shareStatus === "working" ? t.celebrateWorking : t.celebrateShare}
            </Button>

            {shareMessage ? (
              <p
                role="status"
                className={`mt-2 text-center text-xs leading-relaxed ${
                  shareStatus === "error" ? "text-ndim" : "text-gold"
                }`}
              >
                {shareMessage}
              </p>
            ) : null}

            <p className="mt-2 text-center text-[11px] leading-relaxed text-ndim">
              {t.celebrateNote}
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}