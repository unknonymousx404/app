"use client";

import { useMemo, useSyncExternalStore } from "react";
import { ProfileGate } from "@/components/profile-gate";
import { Screen03 } from "@/components/screens/screen-03";
import { Screen05 } from "@/components/screens/screen-05";

// بوابة تبويب «اليوم» — منطق بسيط ومقصود، يُعدّل من هنا وحده:
// صباحاً (قبل الظهر) يفتح تبويب «اليوم» الشاشة 05 — نموذج التسجيل إن لم
// يُسجَّل اليوم، ووضع العرض مع «تعديل التسجيل» إن سُجّل.
// بعد الظهر يفتح خطة اليوم (03)، فلا مطاردة ولا تذكير بالقياس.
const MORNING_HOUR_LIMIT = 12;

function subscribeToHydration(): () => void {
  return () => {};
}
function getHydrated(): boolean {
  return true;
}
function getHydratedOnServer(): boolean {
  return false;
}

export default function TodayPage() {
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrated,
    getHydratedOnServer,
  );

  const morning = useMemo(
    () => (hydrated ? new Date().getHours() < MORNING_HOUR_LIMIT : null),
    [hydrated],
  );

  if (morning === null) {
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

  return (
    <ProfileGate>
      {morning ? <Screen05 /> : <Screen03 />}
    </ProfileGate>
  );
}
