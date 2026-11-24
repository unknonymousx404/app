import type { Metadata, Viewport } from "next";
import { Alexandria } from "next/font/google";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "700", "800"],
  variable: "--font-alexandria",
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
      className={`${alexandria.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-night-deep font-sans text-nhi">
        {children}
      </body>
    </html>
  );
}
