"use client";

import { useRouter } from "next/navigation";
import { useDemoMode } from "@/lib/demo";
import { DEMO_BADGE } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { useNights } from "@/lib/store/nights";
import { useProfile } from "@/lib/store/profile";

/**
 * شارة وضع العرض — ثابتة أعلى كل شاشة تُعرض فيها بيانات العائلة التجريبية.
 * زرها يغلق العرض (يمسح ملف ليان ولياليها التجريبية) ويعيد إلى معالج
 * ملف الطفل (الشاشة 02). لا بيانات ليان بلا هذه الشارة أبداً.
 */
export function DemoBadge() {
  const demo = useDemoMode();
  const lang = useLang();
  const t = DEMO_BADGE[lang];
  const router = useRouter();
  const exitDemo = useProfile((state) => state.exitDemo);
  const clearDemoNights = useNights((state) => state.clearDemoNights);

  if (!demo) return null;

  const exit = () => {
    // ليالي العرض وحدها تُمسح — لا نلمس ليالي مستخدم حقيقي.
    clearDemoNights();
    exitDemo();
    router.push("/profile");
  };

  return (
    <aside
      aria-label={t.aria}
      className="mb-5 rounded-2xl border border-gold/50 bg-gold/10 px-3.5 py-3"
    >
      <p className="text-xs leading-relaxed font-medium text-gold">{t.text}</p>
      <button
        type="button"
        onClick={exit}
        className="mt-2 inline-flex min-h-11 items-center rounded-full border border-gold/40 bg-gold/15 px-3.5 text-xs text-gold transition-colors hover:bg-gold/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      >
        {t.exit}
      </button>
    </aside>
  );
}
