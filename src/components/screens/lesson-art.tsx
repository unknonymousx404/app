"use client";

import type { LessonArtId } from "@/lib/content/library";

/**
 * رسم واحد بسيط لكل درس — docs/screens.md § الشاشة 09:
 * «الدروس بقوالب نصية موحدة + رسم واحد لكل درس (سرعة تحميل على أضعف شبكة)».
 *
 * SVG خالص بلا صور ولا ملفات — يُرسم فوراً بألوان اللوحة المعتمدة فقط.
 */
export function LessonArt({
  art,
  className,
}: {
  art: LessonArtId;
  className?: string;
}) {
  const svgProps = {
    viewBox: "0 0 120 80",
    role: "presentation" as const,
    "aria-hidden": true,
    className,
  };

  switch (art) {
    case "steps":
      return (
        <svg {...svgProps}>
          <rect
            x="14"
            y="52"
            width="18"
            height="12"
            rx="4"
            className="fill-nsoft stroke-nedge"
            strokeWidth="2"
          />
          <rect
            x="38"
            y="40"
            width="18"
            height="24"
            rx="4"
            className="fill-nsoft stroke-nlo"
            strokeWidth="2"
          />
          <rect
            x="62"
            y="28"
            width="18"
            height="36"
            rx="4"
            className="fill-gold/20 stroke-gold"
            strokeWidth="2"
          />
          <rect
            x="86"
            y="16"
            width="18"
            height="48"
            rx="4"
            className="fill-nsoft stroke-nedge"
            strokeWidth="2"
          />
        </svg>
      );

    case "moon":
      return (
        <svg {...svgProps}>
          <path
            d="M72 10c-14 4-22 16-22 30s10 26 24 28a26 26 0 0 0 0-58Z"
            className="fill-gold/20 stroke-gold"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="28" cy="20" r="2" className="fill-nlo" />
          <circle cx="18" cy="44" r="1.5" className="fill-nlo" />
          <circle cx="38" cy="62" r="1.5" className="fill-nlo" />
        </svg>
      );

    case "clock":
      return (
        <svg {...svgProps}>
          <circle
            cx="60"
            cy="40"
            r="26"
            className="fill-nsoft stroke-nedge"
            strokeWidth="2"
          />
          <path
            d="M60 40V24"
            className="stroke-gold"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M60 40l12 8"
            className="stroke-nlo"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case "bowl":
      return (
        <svg {...svgProps}>
          <path
            d="M28 44h64c0 14-14 22-32 22s-32-8-32-22Z"
            className="fill-nsoft stroke-gold"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M50 30c0-6 6-6 6-12M64 32c0-5 5-5 5-10"
            className="stroke-nlo"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );

    case "hands":
      return (
        <svg {...svgProps}>
          <path
            d="M24 56c0-18 16-30 36-30s36 12 36 30"
            className="stroke-gold"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <circle
            cx="60"
            cy="40"
            r="10"
            className="fill-gold/20 stroke-gold"
            strokeWidth="2"
          />
        </svg>
      );

    case "family":
      return (
        <svg {...svgProps}>
          <circle
            cx="32"
            cy="28"
            r="7"
            className="fill-nsoft stroke-nlo"
            strokeWidth="2"
          />
          <path
            d="M20 58c0-9 5-16 12-16s12 7 12 16"
            className="stroke-nlo"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <circle
            cx="60"
            cy="22"
            r="9"
            className="fill-gold/20 stroke-gold"
            strokeWidth="2"
          />
          <path
            d="M45 60c0-11 7-20 15-20s15 9 15 20"
            className="stroke-gold"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <circle
            cx="90"
            cy="32"
            r="6"
            className="fill-nsoft stroke-nlo"
            strokeWidth="2"
          />
          <path
            d="M80 58c0-8 4-14 10-14s10 6 10 14"
            className="stroke-nlo"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );

    case "book":
      return (
        <svg {...svgProps}>
          <path
            d="M60 24c-10-8-24-8-34-4v36c10-4 24-4 34 4 10-8 24-8 34-4V20c-10-4-24-4-34 4Z"
            className="fill-nsoft stroke-gold"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M60 24v36"
            className="stroke-gold"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case "bed":
    default:
      return (
        <svg {...svgProps}>
          <path
            d="M20 56V30M20 44h80M100 56V44"
            className="stroke-nlo"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M28 44a10 10 0 0 1 20 0"
            className="stroke-gold"
            strokeWidth="2"
            fill="none"
          />
          <circle
            cx="86"
            cy="22"
            r="7"
            className="fill-gold/20 stroke-gold"
            strokeWidth="2"
          />
        </svg>
      );
  }
}
