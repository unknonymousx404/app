"use client";

import { DemoBadge } from "@/components/demo-badge";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowUp, BookOpen, CalendarClock, MessageCircle, Plus } from "lucide-react";
import { TabBar } from "@/components/nav/tabbar";
import { Button } from "@/components/ui/button";
import { ageParts, localIsoDate } from "@/lib/age";
import { ASK_DAILY_LIMIT, consumeAskQuestion, useAskUsage } from "@/lib/ask-usage";
import { BRAND } from "@/lib/brand";
import { buildBaseAnswer, type BaseAnswer } from "@/lib/engine/answers";
import {
  buildSafetyAnswer,
  buildStaticAskAnswer,
  buildUnderFourAnswer,
  detectQuestionLang,
} from "@/lib/engine/ask-content";
import { formatClock, parseClock, ageRulesForMonths } from "@/lib/engine/age-rules";
import type { Adjustment } from "@/lib/engine/adjuster";
import { applyAdjustments } from "@/lib/engine/adjuster";
import { buildFirstPlan } from "@/lib/engine/first-plan";
import { hasRedFlag } from "@/lib/engine/safety";
import { ASK, formatAge, formatTime } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { useChat, type ChatMessage } from "@/lib/store/chat";
import { DEMO_PROFILE, isProfileComplete, useProfile } from "@/lib/store/profile";
import { usePlan } from "@/lib/store/plan";
import { useAdjustments } from "@/lib/store/adjustments";

// بوابة التركيب: الخادم يعرض الهيكل، والعميل يبني الخطة.
// بوابة التركيب تمنع قراءة الوقت أثناء التصيير المسبق (Next 16).
function subscribeToHydration(): () => void {
  return () => {};
}
function getHydrated(): boolean {
  return true;
}
function getHydratedOnServer(): boolean {
  return false;
}

function TypingDots({ label }: { label: string }) {  return (
    <div role="status" aria-label={label} className="flex items-center gap-1.5 text-xs text-nlo">
      <span>{label}</span>
      <span className="flex gap-1" aria-hidden="true">
        <i className="size-1.5 animate-pulse rounded-full bg-gold" />
        <i className="size-1.5 animate-pulse rounded-full bg-gold [animation-delay:150ms]" />
        <i className="size-1.5 animate-pulse rounded-full bg-gold [animation-delay:300ms]" />
      </span>
    </div>
  );
}

function MessageBubble({ message, t }: { message: ChatMessage; t: typeof ASK.ar }) {
  const mother = message.role === "mother";
  return (
    <article className={`flex ${mother ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[88%] ${mother ? "items-start" : "items-end"} flex flex-col`}>
        <p className="mb-1 px-1 text-[11px] text-ndim">{mother ? t.motherLabel : t.rahaLabel}</p>
        <div className={`rounded-3xl px-4 py-3 text-sm leading-relaxed ${mother ? "rounded-ss-md bg-nchip text-nhi" : "rounded-ee-md border border-gold/45 bg-nsoft text-nmd"}`}>
          {message.text}
        </div>
      </div>
    </article>
  );
}

export function Screen07() {
  const lang = useLang();
  const t = ASK[lang];
  const profileState = useProfile();
  const addChatSummary = useProfile((state) => state.addChatSummary);
  const storedPlan = usePlan((state) => state.plan);
  const savePlan = usePlan((state) => state.savePlan);
  const recordDay = useAdjustments((state) => state.recordDay);
  const messages = useChat((state) => state.messages);
  const addMessage = useChat((state) => state.addMessage);
  const scheduleTomorrow = useChat((state) => state.scheduleTomorrow);
  const [question, setQuestion] = useState("");
  const [typing, setTyping] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [adjustmentDone, setAdjustmentDone] = useState<string[]>([]);
  const [tomorrowDone, setTomorrowDone] = useState<string[]>([]);
  const usedQuestions = useAskUsage();
  const idleTimer = useRef<number | null>(null);

  const profile = useMemo(() => (isProfileComplete(profileState) ? profileState : DEMO_PROFILE), [profileState]);

  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrated,
    getHydratedOnServer,
  );

  // لا يُقرأ الوقت إلا بعد التركيب — Next 16 يرفض `new Date()` في تصيير
  // مسبق داخل مكوّن عميل.
  const today = useMemo(() => (hydrated ? new Date() : null), [hydrated]);

  const plan = useMemo(() => {
    if (storedPlan) return storedPlan;
    if (!today) return null;
    const parts = ageParts(profile.birthDate, today) ?? { months: 0, days: 0 };
    return buildFirstPlan(profile, ageRulesForMonths(parts.months), today);
  }, [profile, storedPlan, today]);

  const age = useMemo(
    () =>
      (today ? ageParts(profile.birthDate, today) : null) ?? {
        months: 0,
        days: 0,
      },
    [profile.birthDate, today],
  );

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
    document.title = `${lang === "ar" ? BRAND.arabic : BRAND.latin} — ${t.docTitle}`;
  }, [lang, t.docTitle]);

  const summarize = useCallback(() => {
    const lastMother = [...messages].reverse().find((message) => message.role === "mother");
    const lastRaha = [...messages].reverse().find((message) => message.role === "raha");
    if (!lastMother || !lastRaha) return;
    addChatSummary(`${lastMother.text} — ${lastRaha.text.split(".")[0]}`);
  }, [addChatSummary, messages]);

  useEffect(() => {
    const resetIdle = () => {
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(summarize, 30 * 60 * 1000);
    };
    const onVisibility = () => { if (document.visibilityState === "hidden") summarize(); else resetIdle(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", summarize);
    resetIdle();
    return () => {
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", summarize);
    };
  }, [messages, summarize]);

  const submitQuestion = async (event: FormEvent) => {
    event.preventDefault();
    const value = question.trim();
    if (!value || typing || !plan) return;

    addMessage({
      id: `mother-${Date.now()}`,
      role: "mother",
      text: value,
      createdAt: new Date().toISOString(),
    });
    setQuestion("");
    setTyping(true);

    const questionLang = detectQuestionLang(value, lang);
    const safetyFallback = hasRedFlag(value);
    const underFour = age.months < 4;

    let staticAnswer: BaseAnswer;
    try {
      staticAnswer = buildBaseAnswer({
        lang,
        question: value,
        profile,
        plan,
        adjustmentsCount: profileState.adjustments?.length ?? 0,
        lastSummary: profileState.chatSummaries?.at(-1),
      });
    } catch {
      staticAnswer = {
        text: buildStaticAskAnswer(
          questionLang,
          age.months,
          profile.worstProblem,
          {
            routineStart: plan.routineStart,
            lastFeed: plan.lastFeed,
            bedtime: plan.bedtime,
          },
        ),
        template: "general",
      };
    }

    const localFallback = safetyFallback
      ? {
          text: buildSafetyAnswer(questionLang),
          template: "safety" as const,
          lessonId: undefined,
          hidePlanActions: false,
        }
      : underFour
        ? {
            text: buildUnderFourAnswer(questionLang, age.months),
            template: "general" as const,
            lessonId: undefined,
            hidePlanActions: true,
          }
        : {
            text: staticAnswer.text,
            template: staticAnswer.template,
            lessonId: staticAnswer.lessonId,
            hidePlanActions: false,
          };

    // أوقات الخطة داخل ردود AI تُعرض بنظام 12 ساعة — تحويل عرض فقط،
    // لا تغيير للبرومبت ولا للحارس.
    const localizePlanTimes = (text: string) => {
      const times = Array.from(new Set([plan.routineStart, plan.lastFeed, plan.bedtime]));
      return times.reduce((current, time) => {
        const label = formatTime(lang, time);
        if (label === time) return current;
        const escaped = time.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return current.replace(new RegExp(`(?<!\\d)${escaped}(?!\\d)`, "g"), label);
      }, text);
    };

    const pushAnswer = (
      text: string,
      template: string,
      lessonId?: string,
      hidePlanActions = false,
    ) => {
      const answerId = `raha-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      addMessage({
        id: answerId,
        role: "raha",
        text,
        createdAt: new Date().toISOString(),
        template,
        lessonId,
        hidePlanActions,
      });
      setRevealed((current) => ({ ...current, [answerId]: text }));
    };

    const usage = consumeAskQuestion();
    if (!usage.allowed) {
      window.setTimeout(() => {
        pushAnswer(t.limitReply, "general", undefined, true);
        setTyping(false);
      }, 350);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12_000);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: value,
          lang,
          ageMonths: age.months,
          worstProblem: profile.worstProblem,
          plan: {
            routineStart: plan.routineStart,
            lastFeed: plan.lastFeed,
            bedtime: plan.bedtime,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error("ask request failed");

      const data = (await response.json()) as {
        answer?: unknown;
        kind?: unknown;
        fallback?: unknown;
      };
      const answer = typeof data.answer === "string" ? data.answer.trim() : "";
      const kind = typeof data.kind === "string" ? data.kind : "";

      if (!answer || data.fallback === true || kind === "fallback") {
        throw new Error("ask fallback");
      }

      if (safetyFallback || kind === "safety") {
        pushAnswer(answer, "safety");
      } else if (underFour) {
        // لا نثق بأي إجابة غير موسومة من الخادم في هذا العمر.
        if (kind !== "under-four") throw new Error("under four guard");
        pushAnswer(answer, "general", undefined, true);
      } else {
        pushAnswer(
          localizePlanTimes(answer),
          staticAnswer.template,
          staticAnswer.lessonId,
        );
      }
    } catch {
      // رجوع صامت: لا رسالة خطأ أمام الأم، فقط الإجابة الثابتة المكتوبة سلفاً.
      pushAnswer(
        localFallback.text,
        localFallback.template,
        localFallback.lessonId,
        localFallback.hidePlanActions,
      );
    } finally {
      window.clearTimeout(timeout);
      setTyping(false);
    }
  };

  const addTonightAdjustment = (message: ChatMessage) => {
    if (message.hidePlanActions || adjustmentDone.includes(message.id) || !plan) return;
    const from = plan.bedtime;
    const to = formatClock(parseClock(from) - 5);
    const adjustment: Adjustment = {
      id: `chat-bedtime-${message.id}`,
      element: "bedtime",
      from,
      to,
      reason: "bedtime-earlier",
      reasonParams: { minutes: 5, nights: 1, wakesFrom: 0, wakesTo: 0 },
      status: "applied",
    };
    recordDay(localIsoDate(), [adjustment]);
    savePlan({ ...applyAdjustments(plan, [adjustment]), date: plan.date }, storedPlan?.date === plan.date ? storedPlan : null);
    setAdjustmentDone((current) => [...current, message.id]);
  };

  const askTomorrow = (message: ChatMessage) => {
    if (tomorrowDone.includes(message.id)) return;
    const mother = [...messages].reverse().find((entry) => entry.role === "mother" && entry.createdAt <= message.createdAt);
    scheduleTomorrow(mother?.text ?? t.headerTitle);
    setTomorrowDone((current) => [...current, message.id]);
  };

  return (
    <main className="flex h-dvh justify-center bg-night-deep sm:items-center">
      <div className="flex h-dvh w-full max-w-[420px] flex-col bg-night sm:h-[min(860px,calc(100dvh-4rem))] sm:rounded-[2.5rem] sm:border sm:border-frame">
        <div className="no-scrollbar flex-1 overflow-y-auto px-6 pt-6 pb-5 sm:px-7">
          <DemoBadge />

          <header>
            <div className="flex items-center gap-2.5"><span aria-hidden="true" className="raha-moon shrink-0" style={{ width: 17, height: 17 }} /><span className="text-sm text-nlo">{lang === "ar" ? BRAND.arabic : BRAND.latin}</span></div>
            <h1 className="mt-5 text-2xl leading-snug font-medium text-nhi">{t.headerTitle}</h1>
            <p className="mt-1 text-sm leading-relaxed text-nlo">{t.headerBody}</p>
            <p className="mt-3 inline-flex rounded-full border border-gold/25 bg-gold/10 px-3 py-1.5 text-xs text-gold">{formatAge(lang, age.months, age.days)}</p>
          </header>

          <section aria-live="polite" className="mt-7 space-y-4">
            {messages.length === 0 ? <p className="rounded-2xl border border-nline bg-ncard px-4 py-3 text-sm leading-relaxed text-nlo">{t.empty}</p> : null}
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === "raha" && message.template === "safety" && revealed[message.id] ? null : (
                  <MessageBubble message={message} t={t} />
                )}
                {message.role === "raha" && revealed[message.id] ? (
                  message.template === "safety" ? (
                    <section className="mt-3 rounded-2xl border border-gold/45 bg-gold/10 p-4" aria-label={t.safetyTitle}>
                      <h2 className="text-sm font-medium text-gold">{t.safetyTitle}</h2><p className="mt-2 text-sm leading-relaxed text-nmd">{t.safetyBody}</p>
                    </section>
                  ) : (
                    <div className="mt-3 space-y-2 rounded-2xl border border-gold/20 bg-nsoft/50 p-3">
                      {!message.hidePlanActions && message.lessonId ? (
                        <Link
                          href={`/library?lesson=${encodeURIComponent(message.lessonId)}`}
                          className="flex min-h-11 w-full items-center justify-start gap-2 rounded-xl border border-gold/30 bg-gold/10 px-3 text-xs font-normal text-gold hover:bg-gold/20"
                        >
                          <BookOpen aria-hidden="true" className="h-4 w-4" />
                          {t.lessonLink}
                        </Link>
                      ) : null}
                      {!message.hidePlanActions ? (
                        <Button type="button" onClick={() => addTonightAdjustment(message)} disabled={adjustmentDone.includes(message.id)} className="min-h-11 w-full justify-start rounded-xl border border-gold/30 bg-gold/10 px-3 text-start text-xs font-normal text-gold hover:bg-gold/20 disabled:opacity-70"><Plus aria-hidden="true" className="h-4 w-4" />{adjustmentDone.includes(message.id) ? t.adjustmentAdded : t.addAdjustment}</Button>
                      ) : null}
                      <Button type="button" onClick={() => askTomorrow(message)} disabled={tomorrowDone.includes(message.id)} className="min-h-11 w-full justify-start rounded-xl border border-nline bg-nchip/40 px-3 text-start text-xs font-normal text-nmd hover:bg-nchip hover:text-nhi disabled:opacity-70"><CalendarClock aria-hidden="true" className="h-4 w-4" />{tomorrowDone.includes(message.id) ? t.tomorrowAdded : t.askTomorrow}</Button>
                    </div>
                  )
                ) : null}
              </div>
            ))}
            {typing ? <TypingDots label={t.typing} /> : null}
          </section>
        </div>

        <form onSubmit={submitQuestion} className="shrink-0 border-t border-nline/80 bg-night/95 px-4 py-3 backdrop-blur">
          <div className="flex items-end gap-2 rounded-2xl border border-nline bg-ncard p-1.5 focus-within:border-gold/60">
            <label className="sr-only" htmlFor="ask-question">{t.placeholder}</label>
            <textarea id="ask-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={t.placeholder} rows={1} className="max-h-24 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-nhi outline-none placeholder:text-ndim" />
            <Button type="submit" aria-label={t.send} disabled={!question.trim() || typing} className="size-11 shrink-0 rounded-xl bg-gold p-0 text-goldink hover:bg-gold/90 disabled:bg-nchip disabled:text-ndim"><ArrowUp aria-hidden="true" className="h-5 w-5" /></Button>
          </div>
          <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-ndim"><MessageCircle aria-hidden="true" className="h-3 w-3" />{usedQuestions >= ASK_DAILY_LIMIT ? t.limitNote : t.saved}</p>
        </form>
        <TabBar active="ask" />
      </div>
    </main>
  );
}
