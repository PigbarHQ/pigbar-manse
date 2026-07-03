import { DateTime } from "luxon";
import type { ManseInput } from "./types";

export function normalizeManseInput(input: ManseInput): Required<ManseInput> {
  const unknownTime = input.unknownTime ?? input.birthTime === null;

  return {
    ...input,
    name: input.name ?? "",
    birthPlace: {
      ...input.birthPlace,
      label: input.birthPlace.label ?? input.birthPlace.name,
    },
    birthTime: unknownTime ? null : input.birthTime,
    unknownTime,
    useLocalMeanTime: input.useLocalMeanTime ?? true,
    ziHourRule: input.ziHourRule ?? "midnight",
    daewoonDirectionRule: input.daewoonDirectionRule ?? "standard",
  };
}

export function validateManseInput(input: ManseInput): string[] {
  const errors: string[] = [];
  const normalized = normalizeManseInput(input);
  const birthDate = DateTime.fromISO(normalized.birthDate, {
    zone: normalized.birthPlace.timezone,
  });
  const current = DateTime.fromISO(normalized.currentDateTime, {
    setZone: true,
  });

  if (!birthDate.isValid) {
    errors.push("birthDate must be a valid ISO date such as 1974-07-30.");
  }
  if (normalized.birthTime !== null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(normalized.birthTime)) {
    errors.push("birthTime must be null or HH:mm in 24-hour format.");
  }
  if (!current.isValid) {
    errors.push("currentDateTime must be a valid ISO datetime.");
  }
  if (normalized.birthPlace.timezone !== "Asia/Seoul") {
    errors.push("Only Asia/Seoul timezone is supported for Korean manse calculation.");
  }
  if (!Number.isFinite(normalized.birthPlace.longitude)) {
    errors.push("birthPlace.longitude must be a finite number.");
  }
  if (!Number.isFinite(normalized.birthPlace.latitude)) {
    errors.push("birthPlace.latitude must be a finite number.");
  }

  return errors;
}

export function assertValidManseInput(input: ManseInput): Required<ManseInput> {
  const errors = validateManseInput(input);
  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  return normalizeManseInput(input);
}
