"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { getLesson, pick } from "@/lib/content/library";
import { NIGHT_TASKS } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { tasksForDate, useTasks } from "@/lib/store/tasks";

/**
 * بطاقة «مهام الليلة من المكتبة» — تظهر في خطة اليوم (الشاشتان 03 و06).
 * مهمة الليل تُضاف من الدرس في شاشة 09 وتظهر هنا لتُنفَّذ في ليلتها.
 */
export function NightTasksCard({ date }: { date: string }) {
  const lang = useLang();
  const t = NIGHT_TASKS[lang];

  const tasks = useTasks((state) => state.tasks);
  const toggleTask = useTasks((state) => state.toggleTask);

  const todays = tasksForDate(tasks, date);

  if (todays.length === 0) return null;

  return (
    <section
      aria-labelledby="night-tasks-title"
      className="mt-5 rounded-3xl border border-gold/30 bg-ncard p-4"
    >
      <h2
        id="night-tasks-title"
        className="text-base leading-snug font-medium text-nhi"
      >
        {t.title}
      </h2>

      <ul className="mt-3 space-y-2">
        {todays.map((task) => {
          const lesson = getLesson(task.lessonId);
          if (!lesson) return null;

          const taskText = pick(lesson.task, lang);

          return (
            <li
              key={task.id}
              className="rounded-2xl border border-nline bg-nsoft/50 px-3 py-2.5"
            >
              <div className="flex items-start gap-2.5">
                <button
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  aria-pressed={task.done}
                  aria-label={`${taskText} — ${t.done}`}
                  className={`mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full border ${
                    task.done
                      ? "border-ngreen/50 bg-ngreen/20 text-ngreen"
                      : "border-nedge bg-nchip/40 text-ndim"
                  }`}
                >
                  {task.done ? (
                    <Check aria-hidden="true" className="h-5 w-5" />
                  ) : null}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs leading-relaxed ${
                      task.done ? "text-ndim line-through" : "text-nmd"
                    }`}
                  >
                    {taskText}
                  </p>
                  <Link
                    href={`/library?lesson=${encodeURIComponent(lesson.id)}`}
                    className="mt-1 inline-flex min-h-11 items-center text-[11px] text-gold underline underline-offset-4"
                  >
                    {pick(lesson.title, lang)}
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
