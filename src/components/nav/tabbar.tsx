"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, MessageCircle, Moon, TrendingUp } from "lucide-react";
import { localIsoDate } from "@/lib/age";
import { NOTIFY, TABBAR } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { scheduleAfternoonNudge } from "@/lib/notifications";
import { useNights } from "@/lib/store/nights";

type TabId = "today" | "ask" | "library" | "progress";

const SOON_NOTICE_MS = 2800;

/** وقت الإشعار النهاري — بعد الظهر (docs/engine.md §6). */
const AFTERNOON_NUDGE_TIME = "14:00";

/**
 * شريط التنقل السفلي — يظهر من الشاشة 03 فصاعداً.
 * «اليوم» مفعّل الآن؛ الثلاثة الأخرى تعرض رسالة لطيفة بدل وجهة غير مبنية.
 */
export function TabBar({ active = "today" }: { active?: TabId }) {
  const lang = useLang();
  const t = TABBAR[lang];
  const nights = useNights((state) => state.nights);
  const [soon, setSoon] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  // الإشعار النهاري: لطيف واحد بعد الظهر إن لم يُسجَّل الصباح — لا مطاردة،
  // ولا إشعار ليلي (الحارس في showReminder يمنع أي إرسال بعد 19:00).
  useEffect(() => {
    const cancel = scheduleAfternoonNudge({
      time: AFTERNOON_NUDGE_TIME,
      title: NOTIFY[lang].nudgeTitle,
      body: NOTIFY[lang].nudgeBody,
      shouldSend: () => {
        const today = localIsoDate();
        return !nights.some((night) => night.date === today);
      },
    });

    return cancel;
  }, [lang, nights]);

  const showSoon = () => {
    setSoon(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSoon(false), SOON_NOTICE_MS);
  };

  const tabs = [
    // «اليوم» يمر ببوابة /today: تسجيل الليلة صباحاً، وإلا خطة اليوم.
    { id: "today" as const, label: t.today, icon: Moon, href: "/today" },
    { id: "ask" as const, label: t.ask, icon: MessageCircle, href: "/ask" },
    // «المكتبة» تفتح مكتبة النوم (الشاشة 09).
    { id: "library" as const, label: t.library, icon: BookOpen, href: "/library" },
    { id: "progress" as const, label: t.progress, icon: TrendingUp, href: "/progress" },
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
