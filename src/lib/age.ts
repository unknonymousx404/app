// حساب العمر — منطق نقي مشترك بين الشاشات والمحرك.
// كل التواريخ تُقرأ كتاريخ تقويمي محلي، والأيام تُحسب بأرقام UTC لتفادي
// انزياح التوقيت الصيفي عند حساب الفروق.

export interface AgeParts {
  months: number;
  days: number;
}

interface IsoDate {
  year: number;
  month: number;
  day: number;
}

export function parseIsoDate(value: string): IsoDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  // رفض التواريخ غير الموجودة (مثل 30 فبراير).
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

// رقم اليوم في UTC — يمنع انزياح الساعة الصيفية والتوقيت المحلي.
function dayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
}

function birthDayNumber(birthDate: string): number | null {
  const birth = parseIsoDate(birthDate);
  if (!birth) return null;
  return Math.floor(
    Date.UTC(birth.year, birth.month - 1, birth.day) / 86_400_000,
  );
}

/** العمر بالأيام من تاريخ الميلاد حتى اليوم — null إذا كان التاريخ غير صالح. */
export function ageInDays(
  birthDate: string,
  today: Date = new Date(),
): number | null {
  const birth = birthDayNumber(birthDate);
  if (birth === null) return null;
  return dayNumber(today) - birth;
}

/** العمر بالأشهر والأيام التقويمية — null إذا كان التاريخ غير صالح أو في المستقبل. */
export function ageParts(
  birthDate: string,
  today: Date = new Date(),
): AgeParts | null {
  const birth = parseIsoDate(birthDate);
  if (!birth) return null;

  const total = ageInDays(birthDate, today);
  if (total === null || total < 0) return null;

  let months =
    (today.getFullYear() - birth.year) * 12 +
    (today.getMonth() + 1 - birth.month);
  let days = today.getDate() - birth.day;

  if (days < 0) {
    months -= 1;
    // عدد أيام الشهر السابق لشهر اليوم.
    days += new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), 0),
    ).getUTCDate();
  }

  if (months < 0) return null;
  return { months, days };
}

/** تاريخ اليوم بصيغة YYYY-MM-DD بالتوقيت المحلي. */
export function localIsoDate(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
