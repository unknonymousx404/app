"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type Ref,
} from "react";
import { toBlob } from "html-to-image";
import Link from "next/link";
import { ChevronDown, Share2, Sparkles } from "lucide-react";
import { DemoBadge } from "@/components/demo-badge";
import { InstallBanner } from "@/components/install-banner";
import { TabBar } from "@/components/nav/tabbar";
import { NightTasksCard } from "@/components/screens/night-tasks-card";
import { TonightMissionCard } from "@/components/screens/tonight-mission";
import { Button } from "@/components/ui/button";
import { ageParts } from "@/lib/age";
import { BRAND } from "@/lib/brand";
import { useChildName } from "@/lib/child-name";
import { ageRulesForMonths } from "@/lib/engine/age-rules";
import {
  buildFirstPlan,
  type FirstPlan,
  type PlanPillar,
  type PlanTimelineItem,
} from "@/lib/engine/first-plan";
import {
  PLAN,
  fillText,
  formatAgeMonths,
  formatPlanReason,
  type Lang,
} from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import {
  DEMO_PROFILE,
  isProfileComplete,
  useProfile,
} from "@/lib/store/profile";
import { usePlan } from "@/lib/store/plan";

// بوابة التركيب: الخادم يعرض الهيكل، والعميل يعرض الخطة المحفوظة/المولدة.
function subscribeToHydration(): () => void {
  return () => {};
}
function getHydrated(): boolean {
  return true;
}
function getHydratedOnServer(): boolean {
  return false;
}

function ReasonPanel({
  id,
  label,
  text,
}: {
  id: string;
  label: string;
  text: string;
}) {
  return (
    <div
      id={id}
      className="mt-2 rounded-2xl border border-gold/20 bg-nsoft/80 px-3.5 py-3"
    >
      <p className="text-[11px] font-medium text-gold">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-nmd">{text}</p>
    </div>
  );
}

function TimelineRow({
  item,
  label,
  detail,
  reason,
  whyLabel,
  open,
  last,
  onToggle,
}: {
  item: PlanTimelineItem;
  label: string;
  detail: string;
  reason: string;
  whyLabel: string;
  open: boolean;
  last: boolean;
  onToggle: () => void;
}) {
  const panelId = `timeline-reason-${item.id}`;

  return (
    <li className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${label} — ${whyLabel}`}
        className="flex w-full items-start gap-3 rounded-xl text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      >
        <span className="w-12 shrink-0 pt-0.5 text-end text-sm text-nmd">
          <span dir="ltr" className="ltr-inline">
            {item.time}
          </span>
        </span>

        <span
          aria-hidden="true"
          className="relative flex w-4 shrink-0 justify-center self-stretch"
        >
          {last ? null : (
            <span className="absolute top-3 bottom-[-6px] w-px bg-nline" />
          )}
          <span
            className={`relative z-10 mt-1.5 size-2.5 rounded-full ring-4 ${
              open ? "bg-gold ring-gold/20" : "bg-gold/80 ring-gold/10"
            }`}
          />
        </span>

        <span className="min-w-0 flex-1 pb-5">
          <span className="flex items-start justify-between gap-2">
            <span className="min-w-0">
              <span className="block text-base leading-snug text-nhi">
                {label}
              </span>
              <span className="mt-0.5 block text-sm leading-relaxed text-nlo">
                {detail}
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className={`mt-1 h-4 w-4 shrink-0 text-ndim transition-transform duration-200 ${
                open ? "rotate-180 text-gold" : ""
              }`}
            />
          </span>
        </span>
      </button>

      {open ? (
        <div className="ps-[5.5rem]">
          <ReasonPanel id={panelId} label={whyLabel} text={reason} />
        </div>
      ) : null}
    </li>
  );
}

function PillarRow({
  pillar,
  title,
  subtitle,
  reason,
  whyLabel,
  open,
  onToggle,
}: {
  pillar: PlanPillar;
  title: string;
  subtitle: string;
  reason: string;
  whyLabel: string;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = `pillar-reason-${pillar.id}`;

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${title} — ${whyLabel}`}
        className={`w-full rounded-2xl border p-3.5 text-start transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
          open
            ? "border-gold/40 bg-gold/10"
            : "border-nline bg-nsoft/60 hover:border-nedge"
        }`}
      >
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="inline-flex rounded-full bg-gold/10 px-2.5 py-1 text-xs leading-none text-gold">
              {title}
            </span>
            <span className="mt-2 block text-xs leading-relaxed text-nlo">
              {subtitle}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`mt-0.5 h-4 w-4 shrink-0 text-ndim transition-transform duration-200 ${
              open ? "rotate-180 text-gold" : ""
            }`}
          />
        </span>
      </button>

      {open ? (
        <ReasonPanel id={panelId} label={whyLabel} text={reason} />
      ) : null}
    </li>
  );
}

/**
 * بطاقة المشاركة النظيفة — لا اسم ولا عمر ولا نمط استيقاظ.
 * تُرسم خارج الشاشة ثم تُصدَّر صورة عند الضغط على «شاركي الخطة».
 */
function ShareCard({
  plan,
  lang,
  cardRef,
}: {
  plan: FirstPlan;
  lang: Lang;
  cardRef: Ref<HTMLDivElement>;
}) {
  const t = PLAN[lang];
  const timeline = [
    { id: "routine" as const, label: t.timelineRoutine },
    { id: "feed" as const, label: t.timelineFeed },
    { id: "bed" as const, label: t.timelineBed },
    { id: "sleep" as const, label: t.timelineSleep },
  ];

  return (
    <div
      ref={cardRef}
      aria-hidden="true"
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="pointer-events-none fixed top-0 left-0 -z-10 w-[420px] bg-night-deep p-7 text-nhi"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="raha-moon shrink-0"
          style={{ width: 28, height: 28 }}
        />
        <span className="text-lg text-gold">
          {lang === "ar" ? BRAND.arabic : BRAND.latin}
        </span>
      </div>

      <p className="mt-7 text-xs text-gold">{t.shareCardEyebrow}</p>
      <h2 className="mt-1 text-2xl leading-snug text-nhi">
        {t.shareCardTitle}
      </h2>

      <div className="mt-5 rounded-2xl border border-nline bg-ncard p-4">
        <ul className="space-y-3">
          {plan.timeline.map((item) => {
            const copy = timeline.find((entry) => entry.id === item.id);
            return (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 border-b border-nline/60 pb-3 last:border-b-0 last:pb-0"
              >
                <span className="text-sm leading-snug text-nhi">
                  {copy?.label}
                </span>
                <span className="shrink-0 text-sm text-gold">
                  <span dir="ltr" className="ltr-inline">
                    {item.time}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4 space-y-2">
        <p className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs text-gold">
          {fillText(t.pillarTimingTitle, {
            advance: plan.advanceMinutes,
          })}
        </p>
        <p className="inline-flex rounded-full border border-nline bg-nsoft px-3 py-1.5 text-xs text-nmd">
          {t.pillarRoutineTitle}
        </p>
        <p className="inline-flex rounded-full border border-nline bg-nsoft px-3 py-1.5 text-xs text-nmd">
          {t.pillarResponseTitle}
        </p>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-nlo">
        {t.shareCardTagline}
      </p>
      <p className="mt-5 border-t border-nline pt-4 text-xs text-ndim">
        {t.shareCardFooter}
      </p>
    </div>
  );
}

export function Screen03() {
  const lang = useLang();
  const t = PLAN[lang];
  const childName = useChildName();
  const profile = useProfile();
  const storedPlan = usePlan((state) => state.plan);
  const savePlan = usePlan((state) => state.savePlan);

  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrated,
    getHydratedOnServer,
  );

  const [openId, setOpenId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [sharePreview, setSharePreview] = useState(false);
  const [shareStatus, setShareStatus] = useState<
    "idle" | "working" | "done" | "error"
  >("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const shareBlobRef = useRef<Blob | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  // اللغة والاتجاه على مستوى الوثيقة — كما في الشاشتين 01 و02.
  // Next 16 قد يعيد إدراج عنوان التبويب بعد انتقال العميل، فنثبّته بعد
  // اكتمال الانتقال ونزيل أي عنوان مكرر.
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

  // إغلاق معاينة المشاركة بمفتاح Escape.
  useEffect(() => {
    if (!sharePreview) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSharePreview(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sharePreview]);

  // تحرير رابط المعاينة عند مغادرة الشاشة.
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const source = isProfileComplete(profile) ? profile : DEMO_PROFILE;
  const { birthDate, worstProblem, wakePattern, priorityGoal } = source;

  const plan = useMemo(() => {
    if (!hydrated) return null;

    const today = new Date();
    const age = ageParts(birthDate, today) ?? { months: 0, days: 0 };
    const rules = ageRulesForMonths(age.months);

    return buildFirstPlan(
      { birthDate, worstProblem, wakePattern, priorityGoal },
      rules,
      today,
    );
  }, [hydrated, birthDate, worstProblem, wakePattern, priorityGoal]);

  // خطة اليوم تُحفظ محلياً مرة واحدة؛ تغيّر الملف أو اليوم يعني خطة جديدة.
  useEffect(() => {
    if (!plan) return;
    if (
      storedPlan?.date === plan.date &&
      storedPlan.inputFingerprint === plan.inputFingerprint
    ) {
      return;
    }
    savePlan(plan);
  }, [plan, storedPlan, savePlan]);

  if (!hydrated || !plan) {
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

  const timelineCopy = {
    routine: { label: t.timelineRoutine, detail: t.detailRoutine },
    feed: { label: t.timelineFeed, detail: t.detailFeed },
    bed: { label: t.timelineBed, detail: t.detailBed },
    sleep: { label: t.timelineSleep, detail: t.detailSleep },
  } satisfies Record<
    PlanTimelineItem["id"],
    { label: string; detail: string }
  >;

  const responseSubtitle =
    plan.wakePattern === "frequent-random"
      ? t.pillarResponseRandom
      : plan.wakePattern === "early-riser"
        ? t.pillarResponseEarly
        : t.pillarResponseFixed;

  const pillarCopy = {
    timing: {
      title: fillText(t.pillarTimingTitle, { advance: plan.advanceMinutes }),
      subtitle: fillText(t.pillarTimingSubtitle, {
        from: plan.baselineBedtime,
        to: plan.bedtime,
      }),
    },
    routine: {
      title: t.pillarRoutineTitle,
      subtitle: t.pillarRoutineSubtitle,
    },
    response: {
      title: t.pillarResponseTitle,
      subtitle: responseSubtitle,
    },
  } satisfies Record<PlanPillar["id"], { title: string; subtitle: string }>;

  const toggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  // توليد صورة الخطة مرة واحدة: تُعرض معاينة مطابقة تماماً للملف المحفوظ.
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

  const openSharePreview = () => {
    setSharePreview(true);
    void prepareImage();
  };

  const sharePlan = async () => {
    if (shareStatus === "working") return;

    const blob = shareBlobRef.current ?? (await prepareImage());
    if (!blob) return;

    setShareStatus("working");

    try {
      const file = new File([blob], "raha-plan.png", { type: "image/png" });
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
          await nav.share?.({ files: [file], title: t.shareTitle });
          setShareStatus("done");
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            setShareStatus("idle");
            return;
          }
          // فشل المشاركة الأصلية لا يمنع الحفظ المحلي.
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "raha-plan.png";
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
      ? t.shareWorking
      : shareStatus === "done"
        ? t.shareDone
        : shareStatus === "error"
          ? t.shareError
          : null;

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
              {fillText(t.headerTitle, { name: childName })}
            </h1>
            <p className="mt-1 text-sm text-nlo">
              {fillText(t.headerSubline, {
                name: childName,
                age: formatAgeMonths(lang, plan.ageMonths),
              })}
            </p>
          </header>

          <InstallBanner />

          <TonightMissionCard
            plan={plan}
            worstProblem={worstProblem}
            childName={childName}
          />

          <section className="mt-7" aria-labelledby="tonight-title">
            <div className="flex items-end justify-between gap-3">
              <h2
                id="tonight-title"
                className="text-lg font-medium text-nhi"
              >
                {t.tonightTitle}
              </h2>
              <span className="text-[11px] text-ndim">{t.tonightHint}</span>
            </div>

            <div className="mt-3 rounded-3xl border border-nline bg-ncard p-4">
              <ul>
                {plan.timeline.map((item, index) => {
                  const copy = timelineCopy[item.id];
                  const id = `timeline-${item.id}`;
                  return (
                    <TimelineRow
                      key={item.id}
                      item={item}
                      label={copy.label}
                      detail={copy.detail}
                      reason={formatPlanReason(lang, item.reason)}
                      whyLabel={t.whyLabel}
                      open={openId === id}
                      last={index === plan.timeline.length - 1}
                      onToggle={() => toggle(id)}
                    />
                  );
                })}
              </ul>
            </div>
          </section>

          <section className="mt-6" aria-labelledby="pillars-title">
            <h2
              id="pillars-title"
              className="text-lg font-medium text-nhi"
            >
              {t.pillarsTitle}
            </h2>

            <ul className="mt-3 space-y-2.5">
              {plan.pillars.map((pillar) => {
                const copy = pillarCopy[pillar.id];
                const id = `pillar-${pillar.id}`;
                return (
                  <PillarRow
                    key={pillar.id}
                    pillar={pillar}
                    title={copy.title}
                    subtitle={copy.subtitle}
                    reason={formatPlanReason(lang, pillar.reason)}
                    whyLabel={t.whyLabel}
                    open={openId === id}
                    onToggle={() => toggle(id)}
                  />
                );
              })}
            </ul>
          </section>

          <section
            aria-labelledby="why-title"
            className="mt-6 rounded-3xl border border-gold/30 bg-nsoft p-5"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--color-nblue), var(--color-nsoft))",
            }}
          >
            <div className="flex items-center gap-2 text-gold">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              <h2 id="why-title" className="text-base font-medium">
                {t.whyTitle}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-nmd">
              {fillText(t.whyBody, {
                name: childName,
                age: formatAgeMonths(lang, plan.ageMonths),
              })}
            </p>
          </section>

          <NightTasksCard date={plan.date} />

          <div className="mt-7">
            {started ? (
              <>
                <p
                  role="status"
                  className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-center text-sm leading-relaxed text-gold"
                >
                  {fillText(t.startedNotice, { time: plan.routineStart })}
                </p>
                <Link
                  href="/routine"
                  className="mt-3 flex h-12 w-full items-center justify-center rounded-full bg-gold px-6 text-base font-normal text-goldink hover:bg-gold/90 focus-visible:ring-gold/60"
                >
                  {t.openRoutine}
                </Link>
              </>
            ) : (
              <Button
                type="button"
                onClick={() => setStarted(true)}
                className="h-12 w-full rounded-full bg-gold px-6 text-base font-normal text-goldink hover:bg-gold/90 focus-visible:ring-gold/60"
              >
                {t.startCta}
              </Button>
            )}

            <Button
              type="button"
              onClick={openSharePreview}
              aria-label={t.shareAria}
              className="mt-3 h-11 w-full rounded-full border border-nedge bg-nchip/40 px-6 text-sm font-normal text-nmd hover:bg-nchip hover:text-nhi focus-visible:ring-gold/60"
            >
              <Share2 aria-hidden="true" className="h-4 w-4" />
              {t.shareCta}
            </Button>

            <p className="mt-3 text-center text-[11px] leading-relaxed text-ndim">
              {t.shareNote}
            </p>
          </div>
        </div>

        <TabBar />
      </div>

      <ShareCard plan={plan} lang={lang} cardRef={shareRef} />

      {sharePreview ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-preview-title"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-night-deep/90 p-4 backdrop-blur-sm"
        >
          <div className="text-center">
            <h2 id="share-preview-title" className="text-sm text-nhi">
              {t.sharePreviewTitle}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-nlo">
              {t.sharePreviewHint}
            </p>
          </div>

          <div className="w-full max-w-[420px] overflow-hidden rounded-3xl border border-nline bg-night-deep shadow-2xl shadow-night-deep/60">
            {previewUrl ? (
              // معاينة من blob محلي — لا تمر بالشبكة ولا تحتاج تحسين Next.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={t.sharePreviewTitle}
                className="mx-auto block max-h-[64dvh] w-auto max-w-full object-contain"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex aspect-[3/4] w-full items-center justify-center bg-night-deep"
              >
                <div className="raha-moon" style={{ width: 24, height: 24 }} />
              </div>
            )}
          </div>

          <div className="w-full max-w-[420px]">
            <Button
              type="button"
              onClick={sharePlan}
              disabled={shareStatus === "working"}
              className="h-11 w-full rounded-full bg-gold px-6 text-sm font-normal text-goldink hover:bg-gold/90 focus-visible:ring-gold/60 disabled:opacity-60"
            >
              {shareStatus === "working" ? t.shareWorking : t.shareSave}
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

            <Button
              type="button"
              onClick={() => setSharePreview(false)}
              className="mt-2 h-11 w-full rounded-full border border-nedge bg-nchip/40 px-6 text-sm font-normal text-nmd hover:bg-nchip hover:text-nhi focus-visible:ring-gold/60"
            >
              {t.shareClose}
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
