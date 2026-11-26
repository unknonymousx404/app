"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Smartphone, X } from "lucide-react";
import { INSTALL } from "@/lib/i18n";
import { useLang } from "@/lib/lang";

// لافتة تثبيت PWA — docs/ai-log/2026-11-27.md §3.
// تختفي بعد التثبيت (standalone أو حدث appinstalled) أو بعد الإخفاء،
// وتُحفظ الحالتان محلياً فلا تعود في كل فتح.

const HIDDEN_KEY = "raha.install.hidden";

function subscribeToHydration(): () => void {
  return () => {};
}
function getMounted(): boolean {
  return true;
}
function getMountedOnServer(): boolean {
  return false;
}

function readHidden(): boolean {
  try {
    return window.localStorage.getItem(HIDDEN_KEY) === "1";
  } catch {
    // التخزين قد يكون معطلاً (تصفح خاص مقيّد) — تبقى اللافتة قابلة للإخفاء.
    return false;
  }
}

function isStandalone(): boolean {
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
    true;
  return (
    iosStandalone ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

function isIos(): boolean {
  const ua = window.navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1)
  );
}

export function InstallBanner() {
  const lang = useLang();
  const t = INSTALL[lang];
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    getMounted,
    getMountedOnServer,
  );
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onInstalled = () => setHidden(true);
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  // لا شيء على الخادم ولا قبل التركيب — فلا اختلاف بين الخادم والعميل.
  if (!mounted || hidden || isStandalone() || readHidden()) return null;

  const ios = isIos();

  const dismiss = () => {
    try {
      window.localStorage.setItem(HIDDEN_KEY, "1");
    } catch {
      // لا تخزين: الإخفاء يسري على هذه الجلسة وحدها.
    }
    setHidden(true);
  };

  return (
    <aside
      aria-label={t.title}
      className="mt-4 flex items-start gap-3 rounded-2xl border border-nline bg-nsoft/70 px-3.5 py-3"
    >
      <Smartphone
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-gold"
      />

      <div className="min-w-0 flex-1">
        <p className="text-xs leading-relaxed text-nmd">{t.title}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-ndim">
          {ios ? t.ios : t.android}
        </p>
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label={t.dismiss}
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-ndim transition-colors hover:text-nhi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </aside>
  );
}
