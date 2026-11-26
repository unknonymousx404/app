"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useProfileGate } from "@/lib/demo";

/**
 * حارس المسارات — docs/ai-log/2026-11-27.md §2.
 * أي مسار خطط/مكتبة/محادثة/تقدم بلا ملف طفل محفوظ وبلا ?demo=1 يُحوَّل
 * تلقائياً إلى معالج ملف الطفل (الشاشة 02). لا تُرسم الشاشة قبل الحسم،
 * فلا وميض لبيانات ليان ولا خطة يتيمة.
 */
export function ProfileGate({ children }: { children: ReactNode }) {
  const status = useProfileGate();
  const router = useRouter();

  useEffect(() => {
    if (status === "closed") router.replace("/profile");
  }, [status, router]);

  if (status !== "open") {
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

  return <>{children}</>;
}
