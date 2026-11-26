"use client";

import { DemoBadge } from "@/components/demo-badge";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Clock, Plus, Search } from "lucide-react";
import { TabBar } from "@/components/nav/tabbar";
import { LessonArt } from "@/components/screens/lesson-art";
import { Button } from "@/components/ui/button";
import { ageParts, localIsoDate } from "@/lib/age";
import { BRAND } from "@/lib/brand";
import {
  getLesson,
  lessonParagraphs,
  pick,
  searchLessons,
  survivalGuideForAge,
  type LessonCategory,
} from "@/lib/content/library";
import { LIBRARY, fillText } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { DEMO_PROFILE, isProfileComplete, useProfile } from "@/lib/store/profile";
import { useTasks } from "@/lib/store/tasks";

// بوابة التركيب — الخادم يعرض الهيكل، والعميل يبني المكتبة.
// تمنع قراءة الوقت أثناء التصيير المسبق (Next 16).
function subscribeToHydration(): () => void {
  return () => {};
}
function getHydrated(): boolean {
  return true;
}
function getHydratedOnServer(): boolean {
  return false;
}

type Filter = LessonCategory | "all";

const FILTERS: { id: Filter; labelKey: keyof typeof LIBRARY.ar }[] = [
  { id: "all", labelKey: "filterAll" },
  { id: "regression", labelKey: "filterRegression" },
  { id: "nap", labelKey: "filterNap" },
  { id: "behavior", labelKey: "filterBehavior" },
  { id: "context", labelKey: "filterContext" },
  { id: "dad", labelKey: "filterDad" },
];

export function Screen09() {
  const lang = useLang();
  const t = LIBRARY[lang];
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  // الرابط ينقل إلى درس بعينه (من وضع الطوارئ في 06 ومن ردّ راحة في 07).
  // مصدر الحقيقة هو عنوان الصفحة نفسه — فتعمل أزرار المتصفح كما يجب.
  const openLessonId = searchParams.get("lesson");

  const tasks = useTasks((state) => state.tasks);
  const addTask = useTasks((state) => state.addTask);
  const profile = useProfile();

  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrated,
    getHydratedOnServer,
  );

  const todayIso = useMemo(
    () => (hydrated ? localIsoDate(new Date()) : ""),
    [hydrated],
  );

  // عمر الطفل من ملفه — شارة «الأنسب لعمر طفلك» في المكتبة.
  // في وضع العرض وحده يُستخدم ملف العائلة المرجعية.
  const ageFitLessonId = useMemo(() => {
    if (!hydrated) return null;
    const source = isProfileComplete(profile) ? profile : DEMO_PROFILE;
    const age = ageParts(source.birthDate);
    return age === null ? null : survivalGuideForAge(age.months).id;
  }, [hydrated, profile]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
    document.title = `${lang === "ar" ? BRAND.arabic : BRAND.latin} — ${t.docTitle}`;
  }, [lang, t.docTitle]);

  const results = useMemo(
    () => searchLessons(query, filter),
    [query, filter],
  );

  // ------------------------- بوابة التركيب -------------------------
  // لا نص يُرسم قبل أن تُقرأ اللغة والتاريخ من المتصفح — فلا وميض
  // بلغة افتراضية قبل أول سطر (قاعدة 2: ثنائية كاملة من أول سطر).
  if (!hydrated) {
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

  const openLesson = (id: string) => {
    router.push(`/library?lesson=${encodeURIComponent(id)}`);
  };

  const closeLesson = () => {
    router.push("/library");
  };

  const lesson = openLessonId ? getLesson(openLessonId) : undefined;

  // ------------------------- صفحة الدرس -------------------------

  if (lesson) {
    const alreadyAdded = tasks.some(
      (task) => task.lessonId === lesson.id && task.date === todayIso,
    );

    const paragraphs = lessonParagraphs(lesson, lang);

    return (
      <main className="flex h-dvh justify-center bg-night-deep sm:items-center">
        <div className="flex h-dvh w-full max-w-[420px] flex-col bg-night sm:h-[min(860px,calc(100dvh-4rem))] sm:rounded-[2.5rem] sm:border sm:border-frame">
          <div className="no-scrollbar flex-1 overflow-y-auto px-6 pt-6 pb-8 sm:px-7">
            <DemoBadge />

            <button
              type="button"
              onClick={closeLesson}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-nedge bg-nchip/40 px-4 text-xs text-nmd hover:bg-nchip"
            >
              <ArrowLeft
                aria-hidden="true"
                className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`}
              />
              {t.backToLibrary}
            </button>

            <h1 className="mt-4 text-2xl leading-snug font-medium text-nhi">
              {pick(lesson.title, lang)}
            </h1>

            {lesson.id === ageFitLessonId ? (
              <p className="mt-2 inline-flex rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11px] text-gold">
                {t.ageFitBadge}
              </p>
            ) : null}
            <p className="mt-2 text-sm leading-relaxed text-nlo">
              {pick(lesson.description, lang)}
            </p>

            <div className="mt-4 flex items-center gap-2 text-xs text-dim">
              <Clock aria-hidden="true" className="h-3.5 w-3.5" />
              <span dir="ltr" className="ltr-inline">
                {fillText(t.minutesLabel, { minutes: lesson.minutes })}
              </span>
            </div>

            <div className="mt-4 rounded-3xl border border-nline bg-ncard p-4">
              <LessonArt art={lesson.art} className="mx-auto h-24 w-full" />
            </div>

            <article className="mt-5 space-y-3">
              {paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-sm leading-[1.9] text-nmd"
                >
                  {paragraph}
                </p>
              ))}
            </article>

            <section className="mt-6 rounded-3xl border border-gold/35 bg-gold/10 p-5">
              <h2 className="text-base font-medium text-gold">
                {t.taskTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-nmd">
                {pick(lesson.task, lang)}
              </p>
              <Button
                type="button"
                onClick={() => addTask(lesson.id, todayIso)}
                disabled={alreadyAdded}
                className="mt-4 h-11 w-full rounded-full bg-gold px-4 text-sm font-medium text-goldink hover:bg-gold/90 disabled:bg-nchip disabled:text-ndim"
              >
                {alreadyAdded ? (
                  <Check aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <Plus aria-hidden="true" className="h-4 w-4" />
                )}
                {alreadyAdded ? t.taskAlready : t.addTask}
              </Button>
            </section>
          </div>

          <TabBar active="library" />
        </div>
      </main>
    );
  }

  // ------------------------- قائمة الدروس -------------------------

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
            <p className="mt-1 text-sm leading-relaxed text-nlo">
              {t.headerBody}
            </p>
          </header>

          {/* حقل البحث */}
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-nline bg-ncard px-3 focus-within:border-gold/60">
            <Search
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-ndim"
            />
            <label htmlFor="library-search" className="sr-only">
              {t.searchLabel}
            </label>
            <input
              id="library-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.searchPlaceholder}
              className="h-11 w-full bg-transparent px-1 text-sm text-nhi outline-none placeholder:text-ndim"
            />
          </div>

          {/* رقائق التصفية */}
          <div className="mt-3 flex flex-wrap gap-2">
            {FILTERS.map((entry) => {
              const selected = filter === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setFilter(entry.id)}
                  aria-pressed={selected}
                  className={`min-h-11 shrink-0 rounded-full border px-4 text-xs transition-colors ${
                    selected
                      ? "border-gold/50 bg-gold/15 text-gold"
                      : "border-nline bg-nchip/40 text-nlo hover:bg-nchip hover:text-nhi"
                  }`}
                >
                  {t[entry.labelKey]}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-dim">
            {fillText(t.resultsCount, { count: results.length })}
          </p>

          {results.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-nline bg-ncard px-4 py-4 text-center text-sm leading-relaxed text-nlo">
              {t.noResults}
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {results.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => openLesson(entry.id)}
                    className="w-full rounded-3xl border border-nline bg-ncard px-4 py-4 text-start transition-colors hover:bg-nsoft"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-sm leading-snug font-medium text-nhi">
                          {pick(entry.title, lang)}
                        </h2>
                        {entry.id === ageFitLessonId ? (
                          <span className="mt-1.5 inline-flex rounded-full bg-gold/15 px-2 py-0.5 text-[10px] text-gold">
                            {t.ageFitBadge}
                          </span>
                        ) : null}
                      </div>
                      <span
                        dir="ltr"
                        className="ltr-inline shrink-0 text-[11px] text-ndim"
                      >
                        {fillText(t.minutesLabel, { minutes: entry.minutes })}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-nlo">
                      {pick(entry.description, lang)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <TabBar active="library" />
      </div>
    </main>
  );
}
