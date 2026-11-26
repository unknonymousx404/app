"use client";

import { Suspense } from "react";
import { ProfileGate } from "@/components/profile-gate";
import { Screen09 } from "@/components/screens/screen-09";

// الشاشة 09 — مكتبة النوم: 15 درساً علاجياً.
// useSearchParams يحتاج حدّ Suspense في البناء الإنتاجي (Next 16).
export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <main className="flex h-dvh justify-center bg-night-deep sm:items-center">
          <div className="flex h-dvh w-full max-w-[420px] items-center justify-center bg-night sm:h-[min(860px,calc(100dvh-4rem))] sm:rounded-[2.5rem] sm:border sm:border-frame">
            <div
              aria-hidden="true"
              className="raha-moon"
              style={{ width: 24, height: 24 }}
            />
          </div>
        </main>
      }
    >
      <ProfileGate>
        <Screen09 />
      </ProfileGate>
    </Suspense>
  );
}
