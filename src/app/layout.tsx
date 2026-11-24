import type { Metadata, Viewport } from "next";
import { El_Messiri } from "next/font/google";
import localFont from "next/font/local";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const elMessiri = El_Messiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-el-messiri",
  display: "swap",
});

// Agrave Pro خط لاتيني فقط (لا يدعم العربية) — للاتيني، والعربية تبقى El Messiri.
// ملف متغيّر محلي مرخّص OFL (الترخيص بجانبه في fonts/agrave_pro_OFL.txt).
const agravePro = localFont({
  src: "./fonts/agrave_pro.ttf",
  weight: "100 700",
  variable: "--font-agrave-pro",
  display: "swap",
});

export const metadata: Metadata = {
  title: BRAND.storeAr,
  description: BRAND.taglineAr,
};

export const viewport: Viewport = {
  themeColor: "#101735",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${elMessiri.variable} ${agravePro.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-night-deep font-sans text-nhi">
        {children}
      </body>
    </html>
  );
}
