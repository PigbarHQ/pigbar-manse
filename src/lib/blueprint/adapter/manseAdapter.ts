import type { ManseResult, SajuPillar } from "@/src/lib/manse";
import type { BlueprintRuntimeWarning, CanonicalManseInput, CanonicalOptionalPillar, CanonicalPillar } from "../types/runtime";

type PathReadResult = {
  path: string;
  value: unknown;
  missing: boolean;
  warning: BlueprintRuntimeWarning | null;
};

function warning(code: string, message: string, path: string, severity: BlueprintRuntimeWarning["severity"]) {
  return { code, message, path, severity };
}

function requireValue<T>(value: T | null | undefined, path: string, warnings: BlueprintRuntimeWarning[]): T {
  if (value === null || value === undefined) {
    const item = warning("MISSING_FATAL_FIELD", `Required canonical field is missing: ${path}`, path, "fatal");
    warnings.push(item);
    throw new Error(item.message);
  }

  return value;
}

function optionalValue<T>(
  value: T | null | undefined,
  path: string,
  warnings: BlueprintRuntimeWarning[],
  message: string,
): T | null {
  if (value === null || value === undefined) {
    warnings.push(warning("MISSING_OPTIONAL_FIELD", message, path, "warning"));
    return null;
  }

  return value;
}

function pillarLabel(pillar: SajuPillar) {
  return `${pillar.ganKo}${pillar.jiKo}`;
}

function canonicalPillar(pillar: SajuPillar, confidence: number): CanonicalPillar {
  return {
    gan: pillar.gan,
    ji: pillar.ji,
    ganKo: pillar.ganKo,
    jiKo: pillar.jiKo,
    label: pillarLabel(pillar),
    confidence,
  };
}

function canonicalOptionalPillar(pillar: SajuPillar | null, confidence: number): CanonicalOptionalPillar {
  if (pillar === null) {
    return null;
  }

  return canonicalPillar(pillar, confidence);
}

function providerReliability(manse: ManseResult) {
  const engine = manse.debug.solarTermEngine;
  if (engine === null) {
    return 0.72;
  }

  if (engine.fallbackUsed) {
    return 0.76;
  }

  if (engine.precision === "astronomical") {
    return 0.98;
  }

  if (engine.precision === "astronomical-fallback") {
    return 0.86;
  }

  return 0.7;
}

function timeReliability(manse: ManseResult) {
  if (manse.input.unknownTime) {
    return 0.62;
  }

  if (manse.timeCorrection.applied) {
    return 0.94;
  }

  return 0.88;
}

function currentDaeun(manse: ManseResult, warnings: BlueprintRuntimeWarning[]) {
  const current = optionalValue(
    manse.daeun.current,
    "luck.currentDaeun",
    warnings,
    "Current daeun is missing; timing-dependent confidence will be lowered.",
  );

  if (current === null) {
    return null;
  }

  return {
    ganji: current.ganji,
    startDateTime: current.startDateTime,
    endDateTime: current.endDateTime,
    index: current.index,
  };
}

function rawWarnings(manse: ManseResult): BlueprintRuntimeWarning[] {
  return manse.warnings.map((item) =>
    warning(`MANSE_${item.type}`, item.message, item.affectedFields.join("."), "warning"),
  );
}

export function adaptManseToCanonical(manse: ManseResult): CanonicalManseInput {
  const warnings: BlueprintRuntimeWarning[] = rawWarnings(manse);
  const hour = optionalValue(
    manse.saju.hour,
    "pillars.hour",
    warnings,
    manse.input.unknownTime
      ? "Hour pillar is intentionally missing because unknownTime=true; hour-dependent features will be lowered."
      : "Hour pillar is missing unexpectedly; hour-dependent features will be lowered.",
  );
  const dayStem = requireValue(manse.natalChart.pillars.day.stem, "dayMaster", warnings);

  return {
    pillars: {
      year: canonicalPillar(requireValue(manse.saju.year, "pillars.year", warnings), 0.98),
      month: canonicalPillar(requireValue(manse.saju.month, "pillars.month", warnings), 0.98),
      day: canonicalPillar(requireValue(manse.saju.day, "pillars.day", warnings), 0.98),
      hour: canonicalOptionalPillar(hour, manse.input.unknownTime ? 0.62 : 0.94),
    },
    dayMaster: {
      gan: dayStem.hanja,
      ganKo: dayStem.hangul,
      element: dayStem.element,
      yinYang: dayStem.yinYang,
    },
    elements: manse.natalChart.fiveElementsDistribution,
    tenGods: manse.tenGods,
    hiddenStems: manse.natalChart.hiddenStems,
    twelveStages: manse.twelveStages,
    relations: {
      stems: {},
      branches: {},
    },
    luck: {
      daeun: manse.daeun,
      currentDaeun: currentDaeun(manse, warnings),
      currentYear: canonicalPillar(requireValue(manse.currentLuck.year, "luck.currentYear", warnings), 0.94),
      currentMonth: canonicalPillar(requireValue(manse.currentLuck.month, "luck.currentMonth", warnings), 0.9),
      currentDay: canonicalPillar(requireValue(manse.currentLuck.day, "luck.currentDay", warnings), 0.86),
      currentHour: canonicalOptionalPillar(manse.currentLuck.hour, manse.input.unknownTime ? 0.5 : 0.8),
    },
    provenance: {
      inputName: manse.input.name || null,
      unknownTime: manse.input.unknownTime,
      timeCorrection: manse.timeCorrection,
      solarTermEngine: manse.debug.solarTermEngine,
      calendarConversionVerified: manse.calendarConversion.verifiedByKoreanLunarCalendar,
      providerReliability: providerReliability(manse),
      timeReliability: timeReliability(manse),
      warnings,
      rawWarningCount: manse.warnings.length,
    },
  };
}

export function readCanonicalPath(canonical: CanonicalManseInput, path: string): PathReadResult {
  const segments = path.split(".");
  let current: unknown = canonical;

  for (const segment of segments) {
    if (current === null || typeof current !== "object") {
      return {
        path,
        value: undefined,
        missing: true,
        warning: warning("MISSING_CANONICAL_PATH", `Canonical path is missing: ${path}`, path, "warning"),
      };
    }

    const record = current as Record<string, unknown>;
    if (!Object.prototype.hasOwnProperty.call(record, segment)) {
      return {
        path,
        value: undefined,
        missing: true,
        warning: warning("MISSING_CANONICAL_PATH", `Canonical path is missing: ${path}`, path, "warning"),
      };
    }

    current = record[segment];
  }

  if (current === null || current === undefined) {
    return {
      path,
      value: current,
      missing: true,
      warning: warning("EMPTY_CANONICAL_PATH", `Canonical path is empty: ${path}`, path, "warning"),
    };
  }

  return {
    path,
    value: current,
    missing: false,
    warning: null,
  };
}
