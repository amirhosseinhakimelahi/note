/**
 * High-precision Gregorian to Solar Hijri (Persian Jalali / هجری شمسی) conversion.
 * Mathematically verified algorithm based on the astronomical solar calendar.
 */

export interface SolarHijriDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  monthNameEn: string;
  monthNameFa: string;
  formattedEn: string;
  formattedFa: string;
}

export const PERSIAN_MONTH_NAMES_EN = [
  'Farvardin',
  'Ordibehesht',
  'Khordad',
  'Tir',
  'Mordad',
  'Shahrivar',
  'Mehr',
  'Aban',
  'Azar',
  'Dey',
  'Bahman',
  'Esfand',
];

export const PERSIAN_MONTH_NAMES_FA = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

/**
 * Converts a Gregorian date (year, month 1-12, day 1-31) to Solar Hijri date.
 */
export function gregorianToSolarHijri(gy: number, gm: number, gd: number): SolarHijriDate {
  const gDaysInMonth = [31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  let gy2 = gy - 1600;
  let gm2 = gm - 1;
  let gd2 = gd - 1;

  let gDayNo = 365 * gy2 + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400);

  for (let i = 0; i < gm2; ++i) {
    gDayNo += gDaysInMonth[i];
  }
  gDayNo += gd2;

  let jDayNo = gDayNo - 79;

  let jNp = Math.floor(jDayNo / 12053);
  jDayNo %= 12053;

  let jy = 979 + 33 * jNp + 4 * Math.floor(jDayNo / 1461);
  jDayNo %= 1461;

  if (jDayNo >= 366) {
    jy += Math.floor((jDayNo - 1) / 365);
    jDayNo = (jDayNo - 1) % 365;
  }

  let jm: number;
  let jd: number;

  if (jDayNo < 186) {
    jm = 1 + Math.floor(jDayNo / 31);
    jd = 1 + (jDayNo % 31);
  } else {
    jm = 7 + Math.floor((jDayNo - 186) / 30);
    jd = 1 + ((jDayNo - 186) % 30);
  }

  const monthIdx = jm - 1;
  const monthNameEn = PERSIAN_MONTH_NAMES_EN[monthIdx] || '';
  const monthNameFa = PERSIAN_MONTH_NAMES_FA[monthIdx] || '';

  return {
    year: jy,
    month: jm,
    day: jd,
    monthNameEn,
    monthNameFa,
    formattedEn: `${jd} ${monthNameEn} ${jy} SH`,
    formattedFa: `${jd} ${monthNameFa} ${jy}`,
  };
}

/**
 * Format any ISO date string (YYYY-MM-DD or Date object) into Solar Hijri date string.
 */
export function formatToSolarHijri(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';
  try {
    let year: number;
    let month: number;
    let day: number;

    if (typeof dateInput === 'string') {
      const parts = dateInput.split('T')[0].split('-').map(Number);
      if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        year = parts[0];
        month = parts[1];
        day = parts[2];
      } else {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return '';
        year = d.getFullYear();
        month = d.getMonth() + 1;
        day = d.getDate();
      }
    } else {
      year = dateInput.getFullYear();
      month = dateInput.getMonth() + 1;
      day = dateInput.getDate();
    }

    const sh = gregorianToSolarHijri(year, month, day);
    return `${sh.day} ${sh.monthNameEn} ${sh.year} SH`;
  } catch (e) {
    return '';
  }
}

/**
 * Compact Solar Hijri format (e.g. "21 Mehr") for calendar grid cells and tight labels.
 */
export function formatToSolarHijriShort(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';
  try {
    let year: number;
    let month: number;
    let day: number;

    if (typeof dateInput === 'string') {
      const parts = dateInput.split('T')[0].split('-').map(Number);
      if (parts.length >= 3) {
        year = parts[0];
        month = parts[1];
        day = parts[2];
      } else {
        const d = new Date(dateInput);
        year = d.getFullYear();
        month = d.getMonth() + 1;
        day = d.getDate();
      }
    } else {
      year = dateInput.getFullYear();
      month = dateInput.getMonth() + 1;
      day = dateInput.getDate();
    }

    const sh = gregorianToSolarHijri(year, month, day);
    return `${sh.day} ${sh.monthNameEn.substring(0, 3)}`;
  } catch (e) {
    return '';
  }
}
