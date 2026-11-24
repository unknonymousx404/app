import type { Metadata, Viewport } from "next";
import { El_Messiri, Jost } from "next/font/google";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const elMessiri = El_Messiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-el-messiri",
  display: "swap",
});

// Jost خط هندسي لاتيني فقط (لا يدعم العربية) — للاتيني، والعربية تبقى El Messiri.
const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-jost",
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
      className={`${elMessiri.variable} ${jost.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-night-deep font-sans text-nhi">
        {children}
      </body>
    </html>
  );
}
