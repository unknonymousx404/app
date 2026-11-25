"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// مهام الليلة القادمة من مكتبة النوم — docs/screens.md § الشاشة 09:
// «كل درس ينتهي بمهمة ليلة مقترحة قابلة للإضافة إلى الخطة بنقرة».
// تُخزَّن الخطة الليلية هنا وتظهر في خطة اليوم (الشاشتان 03 و06).

export interface NightTask {
  /** معرّف المهمة — فريدة داخل اليوم. */
  id: string;
  /** معرّف الدرس في المكتبة — النص يُقرأ منه فلا يتكرر هنا. */
  lessonId: string;
  /** YYYY-MM-DD محلي — الليلة التي تنتمي إليها المهمة. */
  date: string;
  done: boolean;
}

interface TasksState {
  tasks: NightTask[];
  /** إضافة مهمة — بلا تكرار في نفس الليلة. */
  addTask: (lessonId: string, date: string) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  clearDay: (date: string) => void;
}

export const useTasks = create<TasksState>()(
  persist(
    (set) => ({
      tasks: [],

      addTask: (lessonId, date) =>
        set((state) => {
          const exists = state.tasks.some(
            (task) => task.lessonId === lessonId && task.date === date,
          );
          if (exists) return state;

          return {
            tasks: [
              ...state.tasks,
              {
                id: `${date}-${lessonId}`,
                lessonId,
                date,
                done: false,
              },
            ],
          };
        }),

      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, done: !task.done } : task,
          ),
        })),

      removeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        })),

      clearDay: (date) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.date !== date),
        })),
    }),
    {
      name: "raha.tasks",
      version: 1,
      partialize: ({ tasks }) => ({ tasks }),
    },
  ),
);

/** مهام ليلة بعينها — للاستخدام في الشاشتين 03 و06. */
export function tasksForDate(
  tasks: NightTask[],
  date: string,
): NightTask[] {
  return tasks.filter((task) => task.date === date);
}
