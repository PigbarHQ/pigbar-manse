import type { CompactSajuAnalysis } from "@/src/lib/blind";
import { compileCurrentDaeun } from "./daeun";
import { relationsAgainstNatal } from "./relations";
import { compileYearGanji } from "./saeun";
import { compileMonthlyGanji } from "./wolun";
import { buildFutureEvidence, buildFutureSignals } from "./signals";
import type { FutureAnalysis, FutureCompilerContext, FutureRelations, FutureSignalGroups } from "./types";

function yearFromDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.getFullYear() : new Date().getFullYear();
}

const emptyRelations = {
  heavenlyStemCombinations: [],
  earthlyBranchCombinations: [],
  clashes: [],
  punishments: [],
  harms: [],
  destructions: [],
};

function relationCounts(relations: FutureRelations) {
  return {
    combinations: relations.heavenlyStemCombinations.length + relations.earthlyBranchCombinations.length,
    clashes: relations.clashes.length,
    punishments: relations.punishments.length,
    harms: relations.harms.length,
    destructions: relations.destructions.length,
  };
}

function relationIntensityFor(month: number, ganji: string, relations: FutureRelations): FutureAnalysis["relationIntensity"][number] {
  const counts = relationCounts(relations);
  const relationTotal = counts.combinations + counts.clashes + counts.punishments + counts.harms + counts.destructions;
  const intensity = relationTotal >= 4 || counts.clashes >= 2 ? "HIGH" : relationTotal >= 2 || counts.clashes >= 1 ? "MEDIUM" : "LOW";

  return {
    month,
    ganji,
    relationTotal,
    clashCount: counts.clashes,
    combinationCount: counts.combinations,
    punishmentCount: counts.punishments,
    harmCount: counts.harms,
    destructionCount: counts.destructions,
    intensity,
  };
}

function signalMonth(value: unknown) {
  return typeof value === "object" && value !== null && "values" in value
    ? (value as { values?: { month?: unknown } }).values?.month
    : undefined;
}

function buildMonthlyTimingIndex(input: {
  monthlyGanji: FutureAnalysis["monthlyGanji"];
  monthlyRelations: FutureAnalysis["monthlyRelations"];
  futureSignals: FutureSignalGroups;
}): FutureAnalysis["monthlyTimingIndex"] {
  return input.monthlyGanji.map((pillar, index) => {
    const relation = input.monthlyRelations[index];
    const activeGroups = Object.entries(input.futureSignals).filter(([, signals]) =>
      signals.some((signal) => signalMonth(signal) === pillar.month),
    );
    const activeTimingCodes = Array.from(
      new Set(activeGroups.flatMap(([, signals]) => signals.filter((signal) => signalMonth(signal) === pillar.month).map((signal) => signal.code))),
    );

    return {
      month: pillar.month,
      ganji: pillar.ganji,
      tenGod: pillar.tenGod,
      relationCounts: relationCounts(relation.relations),
      activeTimingCodes,
      timingGroups: activeGroups.map(([group]) => group),
    };
  });
}

export function compileFutureInput(blindCompiler: CompactSajuAnalysis, context: FutureCompilerContext): FutureAnalysis {
  const targetYear = context.targetYear ?? yearFromDate(context.currentDate);
  const currentDaeun = compileCurrentDaeun(blindCompiler, context);
  const currentYearGanji = compileYearGanji(blindCompiler, targetYear);
  const nextYearGanji = compileYearGanji(blindCompiler, targetYear + 1);
  const monthlyGanji = compileMonthlyGanji(blindCompiler, targetYear);
  const daeunRelations = currentDaeun ? relationsAgainstNatal(blindCompiler, currentDaeun, "daeun") : emptyRelations;
  const saeunRelations = relationsAgainstNatal(blindCompiler, currentYearGanji, "saeun");
  const monthlyRelations = monthlyGanji.map((pillar, index) => ({
    month: index + 1,
    ganji: pillar.ganji,
    ganjiHanja: pillar.ganjiHanja,
    relations: relationsAgainstNatal(blindCompiler, pillar, `month-${index + 1}`),
  }));
  const futureSignals = buildFutureSignals({
    currentDaeun,
    currentYearGanji,
    daeunRelations,
    saeunRelations,
    monthlyRelations,
    monthlyGanji,
  });
  const relationIntensity = monthlyRelations.map((item) => relationIntensityFor(item.month, item.ganji, item.relations));
  const monthlyTimingIndex = buildMonthlyTimingIndex({ monthlyGanji, monthlyRelations, futureSignals });

  return {
    version: "1.0.0",
    generatedAt: context.currentDate,
    targetYear,
    currentDaeun,
    currentYearGanji,
    nextYearGanji,
    monthlyGanji,
    daeunRelations,
    saeunRelations,
    monthlyRelations,
    relationIntensity,
    monthlyTimingIndex,
    futureSignals,
    futureEvidence: buildFutureEvidence(futureSignals),
    source: {
      futureCompilerVersion: "1.0.0",
      normalizationVersion: "1.0.0",
      generatedAt: context.currentDate,
      targetYear,
      usesGpt: false,
      blindCompilerVersion: blindCompiler.version,
      targetYearRule: context.targetYear ? "explicit-target-year" : "current-date-year",
      daeunSource: context.daeun?.current ? "manse-result" : "unavailable",
    },
  };
}
