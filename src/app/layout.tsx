import type { Metadata, Viewport } from "next";
import { El_Messiri, Playpen_Sans_Arabic } from "next/font/google";
import localFont from "next/font/local";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const elMessiri = El_Messiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-el-messiri",
  display: "swap",
});

// Agrave Pro خط لاتيني فقط (لا يدعم العربية) — للإنجليزية.
// ملف متغيّر محلي مرخّص OFL (الترخيص بجانبه في fonts/agrave_pro_OFL.txt).
const agravePro = localFont({
  src: "./fonts/agrave_pro.ttf",
  weight: "100 700",
  variable: "--font-agrave-pro",
  display: "swap",
});

// Playpen Sans Arabic للعناصر العربية البارزة (الشعار والزر والمبدل).
// عبر next/font/google ليصل مُجزّأً (~44KB) بدل الملف الكامل (~758KB).
const playpenArabic = Playpen_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: "variable",
  variable: "--font-playpen-arabic",
  display: "swap",
  adjustFontFallback: false,
});

// الإنجليزية هي اللغة الافتراضية — تُبنى البيانات الوصفية عليها قبل hydration.
export const metadata: Metadata = {
  title: BRAND.storeEn,
  description: BRAND.taglineEn,
};

export const viewport: Viewport = {
  themeColor: "#101735",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${elMessiri.variable} ${agravePro.variable} ${playpenArabic.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-night-deep font-sans text-nhi">
        {children}
      </body>
    </html>
  );
}
