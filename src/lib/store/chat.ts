"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChatMessage {
  id: string;
  role: "mother" | "raha";
  text: string;
  createdAt: string;
  template?: string;
  /** الدرس الذي يوسّد به الرد — قابل للفتح مباشرة في المكتبة. */
  lessonId?: string;
  /** رد توعوي (أقل من 4 أشهر أو سقف الأسئلة): لا نعرض تعديل خطة. */
  hidePlanActions?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  tomorrowQuestions: string[];
  addMessage: (message: ChatMessage) => void;
  scheduleTomorrow: (question: string) => void;
  clear: () => void;
}

export const useChat = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      tomorrowQuestions: [],
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      scheduleTomorrow: (question) => set((state) => ({ tomorrowQuestions: [...state.tomorrowQuestions, question] })),
      clear: () => set({ messages: [], tomorrowQuestions: [] }),
    }),
    { name: "raha.chat", version: 1, partialize: ({ messages, tomorrowQuestions }) => ({ messages, tomorrowQuestions }) },
  ),
);
