import KoreanLunarCalendar from "korean-lunar-calendar";
import { lunarToSolar, solarToLunar } from "@fullstackfamily/manseryeok";
import type { CalendarConversion, DateParts, ManseInput } from "./types";

function fmt(parts: DateParts) {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function parseIsoDate(date: string): DateParts {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

function verifySolarDate(parts: DateParts) {
  const calendar = new KoreanLunarCalendar();
  if (!calendar.setSolarDate(parts.year, parts.month, parts.day)) {
    return null;
  }

  return calendar.getLunarCalendar();
}

function convertLunarDateWithKoreanCalendar(parts: DateParts, isLeapMonth: boolean) {
  const calendar = new KoreanLunarCalendar();
  if (!calendar.setLunarDate(parts.year, parts.month, parts.day, isLeapMonth)) {
    return null;
  }

  return calendar.getSolarCalendar();
}

export function convertCalendar(input: Required<ManseInput>): CalendarConversion {
  const parts = parseIsoDate(input.birthDate);

  if (input.calendarType === "solar") {
    const converted = solarToLunar(parts.year, parts.month, parts.day);
    const verification = verifySolarDate(parts);
    const lunarDate = {
      year: converted.lunar.year,
      month: converted.lunar.month,
      day: converted.lunar.day,
    };
    const verificationDiff =
      verification &&
      (verification.year !== lunarDate.year ||
        verification.month !== lunarDate.month ||
        verification.day !== lunarDate.day ||
        Boolean(verification.intercalation) !== converted.lunar.isLeapMonth)
        ? `korean-lunar-calendar=${verification.year}-${verification.month}-${verification.day}/${verification.intercalation}`
        : null;

    return {
      solarDate: fmt(parts),
      lunarDate: fmt(lunarDate),
      isLeapMonth: converted.lunar.isLeapMonth,
      verifiedByKoreanLunarCalendar: verification !== null && verificationDiff === null,
      verificationDiff,
      source: "solar-input",
      manseryeok: converted,
      koreanLunarCalendar: verification,
    };
  }

  const koreanConverted = convertLunarDateWithKoreanCalendar(parts, input.isLeapMonth);
  if (!koreanConverted) {
    throw new Error("입력한 음력 날짜와 윤달 여부를 양력으로 변환할 수 없습니다.");
  }

  const manseryeokConverted = lunarToSolar(parts.year, parts.month, parts.day, input.isLeapMonth);
  const solarDate = {
    year: koreanConverted.year,
    month: koreanConverted.month,
    day: koreanConverted.day,
  };
  const verificationDiff =
    manseryeokConverted.solar.year !== solarDate.year ||
    manseryeokConverted.solar.month !== solarDate.month ||
    manseryeokConverted.solar.day !== solarDate.day
      ? `manseryeok=${manseryeokConverted.solar.year}-${manseryeokConverted.solar.month}-${manseryeokConverted.solar.day}`
      : null;

  return {
    solarDate: fmt(solarDate),
    lunarDate: fmt(parts),
    isLeapMonth: input.isLeapMonth,
    verifiedByKoreanLunarCalendar: verificationDiff === null,
    verificationDiff,
    source: "korean-lunar-calendar",
    manseryeok: manseryeokConverted,
    koreanLunarCalendar: koreanConverted,
  };
}
