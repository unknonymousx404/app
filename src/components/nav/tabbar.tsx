"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, MessageCircle, Moon, TrendingUp } from "lucide-react";
import { TABBAR } from "@/lib/i18n";
import { useLang } from "@/lib/lang";

type TabId = "today" | "ask" | "library" | "progress";

const SOON_NOTICE_MS = 2800;

/**
 * شريط التنقل السفلي — يظهر من الشاشة 03 فصاعداً.
 * «اليوم» مفعّل الآن؛ الثلاثة الأخرى تعرض رسالة لطيفة بدل وجهة غير مبنية.
 */
export function TabBar({ active = "today" }: { active?: TabId }) {
  const lang = useLang();
  const t = TABBAR[lang];
  const [soon, setSoon] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const showSoon = () => {
    setSoon(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSoon(false), SOON_NOTICE_MS);
  };

  const tabs = [
    { id: "today" as const, label: t.today, icon: Moon, href: "/plan" },
    { id: "ask" as const, label: t.ask, icon: MessageCircle },
    { id: "library" as const, label: t.library, icon: BookOpen },
    { id: "progress" as const, label: t.progress, icon: TrendingUp },
  ];

  return (
    <nav
      aria-label={t.navAria}
      className="relative z-20 shrink-0 border-t border-nline/80 bg-night/95 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur"
    >
      {soon ? (
        <p
          role="status"
          className="absolute inset-x-4 bottom-full mb-2 rounded-2xl border border-gold/25 bg-ncard px-3 py-2 text-center text-xs leading-relaxed text-gold shadow-lg shadow-night-deep/50"
        >
          {t.soon}
        </p>
      ) : null}

      <ul className="grid grid-cols-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          const className = `mx-auto flex min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[11px] leading-none transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
            isActive
              ? "text-gold"
              : "text-nlo hover:bg-nsoft/70 hover:text-nhi"
          }`;

          return (
            <li key={tab.id}>
              {tab.href ? (
                <Link
                  href={tab.href}
                  aria-label={tab.label}
                  aria-current={isActive ? "page" : undefined}
                  className={className}
                >
                  <Icon
                    aria-hidden="true"
                    className="h-5 w-5"
                    strokeWidth={isActive ? 2 : 1.6}
                  />
                  <span>{tab.label}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={showSoon}
                  aria-label={tab.label}
                  className={className}
                >
                  <Icon
                    aria-hidden="true"
                    className="h-5 w-5"
                    strokeWidth={1.6}
                  />
                  <span>{tab.label}</span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
