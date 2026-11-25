import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

// PWA خفيفة — بلا Service Worker اليوم (AGENTS.md: اليوم 10).
// التطبيق يُثبَّت من المتصفح كأيقونة على شاشة هاتف الأم بلا متجر.
// الاتجاه RTL لأن راحة عربية أولاً؛ لغة الواجهة تتبدّل وقت التشغيل.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.storeAr,
    short_name: BRAND.arabic,
    description: BRAND.taglineAr,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a1226",
    theme_color: "#101735",
    lang: "ar",
    dir: "rtl",
    categories: ["health", "lifestyle", "parenting"],
    icons: [
      {
        src: "/icon-crescent.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-crescent.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}