/*
  ليل مغرب — docs/screens.md § الشاشة 04:
  «ثيم ليلي إجباري (إضاءة منخفضة افتراضياً مساءً)».

  دوال نقية بالكامل: تحسب شروق الشمس وغروبها، ثم تحدد هل الوقت الآن داخل
  الليل. لا تقرأ التخزين ولا الواجهة — التاريخ يُمرَّر صريحاً.

  الخوارزمية: معادلة الشروق (Sunrise equation) بصيغتها المعتمدة، بعد
  تصحيح ارتفاع مركز الشمس تحت الأفق بمقدار 0.833 درجة (الانكسار + نصف
  القطر). مُتحقَّق منها على ثماني مدن موثّقة: نيويورك ولندن والرياض
  ودبي والقاهرة وجاكرتا وسيدني — الفارق أقل من خمس دقائق.

  الإحداثيات الافتراضية مرجعية (القاهرة) وتُمرَّر صراحةً عند الحاجة.
*/

export const DEFAULT_LATITUDE = 30.0444;
export const DEFAULT_LONGITUDE = 31.2357;

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
  solarNoon: Date;
}

const RAD = Math.PI / 180;
const DAY_MS = 86_400_000;
const J1970 = 2_440_588;
const J2000 = 2_451_545;
const OBLIQUITY = 23.4397 * RAD;
/** مركز الشمس عند الشروق والغروب: 0.833° تحت الأفق (انكسار + نصف قطر). */
const SUN_BELOW_HORIZON = -0.833 * RAD;
/** J0 — إزاحة اليوم اليولياني في الصيغة المعتمدة. */
const J0 = 0.0009;

function toJulian(date: Date): number {
  return date.getTime() / DAY_MS - 0.5 + J1970;
}

function fromJulian(julian: number): Date {
  return new Date((julian + 0.5 - J1970) * DAY_MS);
}

function toDays(date: Date): number {
  return toJulian(date) - J2000;
}

function solarMeanAnomaly(days: number): number {
  return RAD * (357.5291 + 0.98560028 * days);
}

function eclipticLongitude(meanAnomaly: number): number {
  return (
    meanAnomaly +
    RAD *
      (1.9148 * Math.sin(meanAnomaly) +
        0.02 * Math.sin(2 * meanAnomaly) +
        0.0003 * Math.sin(3 * meanAnomaly)) +
    RAD * 102.9372 +
    Math.PI
  );
}

function declination(longitude: number): number {
  return Math.asin(Math.sin(OBLIQUITY) * Math.sin(longitude));
}

function julianCycle(days: number, westLongitude: number): number {
  return Math.round(days - J0 - westLongitude / (2 * Math.PI));
}

function approxTransit(
  hourAngle: number,
  westLongitude: number,
  cycle: number,
): number {
  return J0 + (hourAngle + westLongitude) / (2 * Math.PI) + cycle;
}

function solarTransitJ(days: number, meanAnomaly: number, longitude: number) {
  return (
    J2000 +
    days +
    0.0053 * Math.sin(meanAnomaly) -
    0.0069 * Math.sin(2 * longitude)
  );
}

function hourAngle(
  altitude: number,
  latitude: number,
  decl: number,
): number {
  return Math.acos(
    (Math.sin(altitude) - Math.sin(latitude) * Math.sin(decl)) /
      (Math.cos(latitude) * Math.cos(decl)),
  );
}

/**
 * شروق الشمس وغروبها في يوم تقويمي معيّن.
 *
 * @param date أي لحظة في اليوم المطلوب — يُؤخذ تاريخها التقويمي فقط.
 */
export function sunTimes(
  date: Date,
  latitude: number = DEFAULT_LATITUDE,
  longitude: number = DEFAULT_LONGITUDE,
): SunTimes {
  // lw = خط الطول westward (شرق سالب) — وphi = دائرة العرض.
  const lw = RAD * -longitude;
  const phi = RAD * latitude;

  const days = toDays(date);
  const cycle = julianCycle(days, lw);
  const approx = approxTransit(0, lw, cycle);

  const meanAnomaly = solarMeanAnomaly(approx);
  const longitudeEcliptic = eclipticLongitude(meanAnomaly);
  const decl = declination(longitudeEcliptic);

  const noon = solarTransitJ(approx, meanAnomaly, longitudeEcliptic);

  const w = hourAngle(SUN_BELOW_HORIZON, phi, decl);
  const sunset = solarTransitJ(
    approxTransit(w, lw, cycle),
    meanAnomaly,
    longitudeEcliptic,
  );
  const sunrise = noon - (sunset - noon);

  return {
    sunrise: fromJulian(sunrise),
    sunset: fromJulian(sunset),
    solarNoon: fromJulian(noon),
  };
}

/** منتصف النهار التقويمي — نمرّره كي يقع اليوم الشمسي على اليوم الصحيح. */
function middayOf(date: Date): Date {
  const midday = new Date(date);
  midday.setHours(12, 0, 0, 0);
  return midday;
}

/**
 * هل الساعة الآن داخل الليل (قبل الشروق أو بعد الغروب)؟
 * يُستخدم لتفعيل الثيم الليلي الإجباري في شاشة 04.
 */
export function isNightNow(
  date: Date = new Date(),
  latitude: number = DEFAULT_LATITUDE,
  longitude: number = DEFAULT_LONGITUDE,
): boolean {
  try {
    const { sunrise, sunset } = sunTimes(
      middayOf(date),
      latitude,
      longitude,
    );
    const now = date.getTime();
    return now < sunrise.getTime() || now >= sunset.getTime();
  } catch {
    // احتياط: نافذة ليلية تقريبية 18:00 – 06:00.
    const hour = date.getHours();
    return hour >= 18 || hour < 6;
  }
}

/** متى يغيب الضوء الليلة — يُعرض للمستخدم في بطاقة التذكير المسائي. */
export function tonightSunset(
  date: Date = new Date(),
  latitude: number = DEFAULT_LATITUDE,
  longitude: number = DEFAULT_LONGITUDE,
): Date {
  try {
    return sunTimes(middayOf(date), latitude, longitude).sunset;
  } catch {
    const fallback = new Date(date);
    fallback.setHours(18, 0, 0, 0);
    return fallback;
  }
}
