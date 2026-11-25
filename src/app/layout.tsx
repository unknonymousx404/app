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

// Agrave Pro خط لاتيني فقط (لا يدعم العربية) — للإنجليزية.
// ملف متغيّر محلي مرخّص OFL (الترخيص بجانبه في fonts/agrave_pro_OFL.txt).
const agravePro = localFont({
  src: "./fonts/agrave_pro.ttf",
  weight: "100 700",
  variable: "--font-agrave-pro",
  display: "swap",
});

// الإنجليزية هي اللغة الافتراضية — تُبنى البيانات الوصفية عليها قبل hydration.
export const metadata: Metadata = {
  title: BRAND.storeEn,
  description: BRAND.taglineEn,
  applicationName: BRAND.latin,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: BRAND.latin,
  },
  icons: {
    icon: [{ url: "/icon-crescent.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon-crescent.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#101735",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${elMessiri.variable} ${agravePro.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-night-deep font-sans text-nhi">
        {children}
      </body>
    </html>
  );
}
