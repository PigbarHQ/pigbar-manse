import { DateTime } from "luxon";
import { STANDARD_MERIDIAN_LONGITUDE } from "./constants";
import type { ManseInput, TimeCorrection } from "./types";

export function calculateLocalMeanTimeOffsetMinutes(longitude: number) {
  return (longitude - STANDARD_MERIDIAN_LONGITUDE) * 4;
}

export function getBirthDateTime(input: Required<ManseInput>) {
  const time = input.birthTime ?? "12:00";
  return DateTime.fromISO(`${input.birthDate}T${time}`, {
    zone: input.birthPlace.timezone,
  });
}

export function getLocalMeanDateTime(input: Required<ManseInput>) {
  const standard = getBirthDateTime(input);
  if (input.birthTime === null || !input.useLocalMeanTime) {
    return standard;
  }

  return standard.plus({
    minutes: calculateLocalMeanTimeOffsetMinutes(input.birthPlace.longitude),
  });
}

export function getTimeCorrection(input: Required<ManseInput>): TimeCorrection {
  const standard = input.birthTime === null ? null : getBirthDateTime(input);
  const local = input.birthTime === null ? null : getLocalMeanDateTime(input);
  const offsetMinutes = input.useLocalMeanTime
    ? calculateLocalMeanTimeOffsetMinutes(input.birthPlace.longitude)
    : 0;
  const standardDateTime = standard?.toISO() ?? null;
  const correctedDateTime = local?.toISO() ?? null;

  return {
    enabled: input.useLocalMeanTime,
    standardMeridian: STANDARD_MERIDIAN_LONGITUDE,
    localLongitude: input.birthPlace.longitude,
    offsetMinutes,
    standardDateTime,
    correctedDateTime,
    standardTime: standardDateTime,
    localMeanTime: correctedDateTime,
    applied: input.useLocalMeanTime && input.birthTime !== null,
  };
}
