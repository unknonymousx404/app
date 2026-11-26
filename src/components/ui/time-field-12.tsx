"use client";

import { useMemo } from "react";
import { TIME, type Lang } from "@/lib/i18n";

/**
 * حقل وقت بنظام 12 ساعة — بديل `input[type=time]` الذي يعرض 24 ساعة في
 * متصفحات كثيرة. القيمة الداخلية تبقى HH:mm بنظام 24 لتوافق المخازن والمحرك.
 */
export function TimeField12({
  value,
  onChange,
  lang,
  label,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  lang: Lang;
  label: string;
  className?: string;
}) {
  const t = TIME[lang];

  const [rawHour, rawMinute] = value.split(":");
  const parsedHour = Number(rawHour);
  const parsedMinute = Number(rawMinute);
  const hours = Number.isFinite(parsedHour) ? ((parsedHour % 24) + 24) % 24 : 20;
  const minutes = Number.isFinite(parsedMinute) ? parsedMinute : 0;

  const isPm = hours >= 12;
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;

  const minuteOptions = useMemo(() => {
    const options = Array.from({ length: 12 }, (_, index) => index * 5);
    if (!options.includes(minutes)) options.push(minutes);
    return options.sort((a, b) => a - b);
  }, [minutes]);

  const emit = (nextHour12: number, nextMinute: number, pm: boolean) => {
    const base = nextHour12 % 12;
    const nextHour = pm ? base + 12 : base;
    onChange(
      `${String(nextHour).padStart(2, "0")}:${String(nextMinute).padStart(2, "0")}`,
    );
  };

  const selectClass =
    "h-11 w-16 rounded-2xl border border-nline bg-nsoft px-2 text-center text-sm text-nhi tabular-nums outline-none focus-visible:border-gold/60 focus-visible:ring-2 focus-visible:ring-gold/40";

  return (
    <div
      role="group"
      aria-label={label}
      dir="ltr"
      className={`flex items-center gap-2 ${className}`}
    >
      <select
        aria-label={t.hourAria}
        value={hour12}
        onChange={(event) => emit(Number(event.target.value), minutes, isPm)}
        className={selectClass}
      >
        {Array.from({ length: 12 }, (_, index) => index + 1).map((hour) => (
          <option key={hour} value={hour}>
            {hour}
          </option>
        ))}
      </select>

      <span aria-hidden="true" className="text-sm text-ndim">
        :
      </span>

      <select
        aria-label={t.minuteAria}
        value={minutes}
        onChange={(event) => emit(hour12, Number(event.target.value), isPm)}
        className={selectClass}
      >
        {minuteOptions.map((minute) => (
          <option key={minute} value={minute}>
            {String(minute).padStart(2, "0")}
          </option>
        ))}
      </select>

      <div
        role="group"
        aria-label={t.periodAria}
        className="flex overflow-hidden rounded-2xl border border-nline"
      >
        {[
          { key: "am", label: t.am, pm: false },
          { key: "pm", label: t.pm, pm: true },
        ].map((option) => {
          const selected = option.pm === isPm;

          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={selected}
              onClick={() => emit(hour12, minutes, option.pm)}
              className={`h-11 min-w-14 px-2 text-xs transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
                selected
                  ? "bg-gold/15 text-gold"
                  : "bg-ncard text-ndim hover:text-nmd"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
