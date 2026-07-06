import type { FutureDaeun, FutureEvidence, FuturePillar, FutureRelations, FutureSignal, FutureSignalGroups } from "./types";
import { relationCount } from "./relations";

const tenGodGroups = {
  wealth: ["정재", "편재"],
  officer: ["정관", "편관"],
  output: ["식신", "상관"],
  resource: ["정인", "편인"],
} as const;

function signal(
  code: string,
  label: string,
  weight: number,
  sourcePaths: string[],
  sourceRules: string[],
  values?: FutureSignal["values"],
): FutureSignal {
  return {
    kind: "fact",
    code,
    label,
    weight: Math.min(5, Math.max(1, weight)),
    confidence: Number(Math.min(1, Math.max(0.35, weight / 5)).toFixed(2)),
    sourcePaths,
    sourceRules,
    values,
  };
}

function supports(pillar: FuturePillar | FutureDaeun | null, tenGods: readonly string[]) {
  return Boolean(pillar?.tenGod && tenGods.includes(pillar.tenGod));
}

function relationSignals(prefix: string, labelPrefix: string, relations: FutureRelations, sourcePath: string) {
  return [
    ...(relations.clashes.length > 0
      ? [signal(`${prefix}_HAS_CLASH`, `${labelPrefix}-has-clash`, relations.clashes.length, [`${sourcePath}.clashes`], ["clash relation count > 0"], { count: relations.clashes.length })]
      : []),
    ...(relations.heavenlyStemCombinations.length + relations.earthlyBranchCombinations.length > 0
      ? [
          signal(`${prefix}_HAS_COMBINATION`, `${labelPrefix}-has-combination`, relations.heavenlyStemCombinations.length + relations.earthlyBranchCombinations.length, [sourcePath], ["stem or branch combination count > 0"], {
            heavenlyStemCombinations: relations.heavenlyStemCombinations.length,
            earthlyBranchCombinations: relations.earthlyBranchCombinations.length,
          }),
        ]
      : []),
  ];
}

function supportSignal(prefix: string, labelPrefix: string, pillar: FuturePillar | FutureDaeun | null, sourcePath: string) {
  if (!pillar) return [];

  return [
    ...(supports(pillar, tenGodGroups.wealth)
      ? [signal(`${prefix}_SUPPORTS_WEALTH`, `${labelPrefix}-supports-wealth`, 2, [sourcePath], ["pillar ten-god in wealth group"], { tenGod: pillar.tenGod })]
      : []),
    ...(supports(pillar, tenGodGroups.officer)
      ? [signal(`${prefix}_SUPPORTS_OFFICER`, `${labelPrefix}-supports-officer`, 2, [sourcePath], ["pillar ten-god in officer group"], { tenGod: pillar.tenGod })]
      : []),
    ...(supports(pillar, tenGodGroups.resource)
      ? [signal(`${prefix}_SUPPORTS_RESOURCE`, `${labelPrefix}-supports-resource`, 2, [sourcePath], ["pillar ten-god in resource group"], { tenGod: pillar.tenGod })]
      : []),
    ...(supports(pillar, tenGodGroups.output)
      ? [signal(`${prefix}_SUPPORTS_OUTPUT`, `${labelPrefix}-supports-output`, 2, [sourcePath], ["pillar ten-god in output group"], { tenGod: pillar.tenGod })]
      : []),
  ];
}

export function buildFutureSignals(input: {
  currentDaeun: FutureDaeun | null;
  currentYearGanji: FuturePillar;
  daeunRelations: FutureRelations;
  saeunRelations: FutureRelations;
  monthlyRelations: Array<{ month: number; relations: FutureRelations; ganji: string; ganjiHanja: string }>;
  monthlyGanji: FuturePillar[];
}): FutureSignalGroups {
  const daeunSupport = supportSignal("CURRENT_DAEUN", "current-daeun", input.currentDaeun, "currentDaeun");
  const yearSupport = supportSignal("CURRENT_YEAR", "current-year", input.currentYearGanji, "currentYearGanji");
  const yearRelations = relationSignals("CURRENT_YEAR", "current-year", input.saeunRelations, "saeunRelations");
  const monthRelationSignals = input.monthlyRelations.flatMap((item) =>
    relationSignals("MONTH", "month", item.relations, `monthlyRelations.${item.month - 1}`).map((fact) => ({
      ...fact,
      values: { ...fact.values, month: item.month, ganji: item.ganji },
    })),
  );
  const monthSupportSignals = input.monthlyGanji.flatMap((pillar, index) =>
    supportSignal("MONTH", "month", pillar, `monthlyGanji.${index}`).map((fact) => ({
      ...fact,
      values: { ...fact.values, month: index + 1, ganji: pillar.ganji },
    })),
  );
  const monthlyRelationTotal = input.monthlyRelations.reduce((sum, item) => sum + relationCount(item.relations), 0);
  const sharedMovementSignals = [
    ...yearRelations.filter((item) => item.code.includes("CLASH")),
    ...monthRelationSignals.filter((item) => item.code.includes("CLASH")),
  ];
  const sharedMovementCodes = sharedMovementSignals.map((item) => item.code);
  const healthMonthSignals = input.monthlyRelations.flatMap((item) => {
    const total = relationCount(item.relations);
    const punishmentHarmCount = item.relations.punishments.length + item.relations.harms.length;

    return [
      ...(total > 0
        ? [signal("HEALTH_MONTH_RELATION_PRESSURE", "health-month-relation-pressure", Math.min(5, total), [`monthlyRelations.${item.month - 1}`], ["monthly relation total > 0"], { month: item.month, ganji: item.ganji, count: total })]
        : []),
      ...(item.relations.clashes.length > 0
        ? [signal("HEALTH_MONTH_CLASH_PRESSURE", "health-month-clash-pressure", item.relations.clashes.length, [`monthlyRelations.${item.month - 1}.relations.clashes`], ["monthly clash count > 0"], { month: item.month, ganji: item.ganji, count: item.relations.clashes.length })]
        : []),
      ...(punishmentHarmCount > 0
        ? [signal("HEALTH_MONTH_PUNISHMENT_HARM_PRESSURE", "health-month-punishment-harm-pressure", punishmentHarmCount, [`monthlyRelations.${item.month - 1}.relations`], ["monthly punishment or harm count > 0"], { month: item.month, ganji: item.ganji, count: punishmentHarmCount })]
        : []),
    ];
  });

  return {
    sharedMovementSignals,
    wealthTimingSignals: [
      ...daeunSupport.filter((item) => item.code.includes("WEALTH")),
      ...yearSupport.filter((item) => item.code.includes("WEALTH")),
      ...monthSupportSignals.filter((item) => item.code.includes("WEALTH")),
    ],
    careerTimingSignals: [
      ...daeunSupport.filter((item) => item.code.includes("OFFICER")),
      ...yearSupport.filter((item) => item.code.includes("OFFICER")),
      ...monthSupportSignals.filter((item) => item.code.includes("OFFICER")),
    ],
    businessTimingSignals: [
      ...daeunSupport.filter((item) => item.code.includes("OUTPUT") || item.code.includes("WEALTH")),
      ...yearSupport.filter((item) => item.code.includes("OUTPUT") || item.code.includes("WEALTH")),
    ],
    relationshipTimingSignals: [
      ...yearRelations,
      ...monthRelationSignals.filter((item) => item.code.includes("COMBINATION")),
    ],
    healthTimingSignals: [
      ...healthMonthSignals,
      ...(monthlyRelationTotal > 0
        ? [signal("MONTHLY_RELATION_COUNT_FACT", "monthly-relation-count-fact", Math.min(5, monthlyRelationTotal), ["monthlyRelations"], ["monthly relation total > 0"], { count: monthlyRelationTotal })]
        : []),
    ],
    mobilityTimingSignals: [
      ...(sharedMovementSignals.length > 0
        ? [signal("MOBILITY_SHARED_MOVEMENT_FACTS_PRESENT", "mobility-shared-movement-facts-present", Math.min(5, sharedMovementSignals.length), ["futureSignals.sharedMovementSignals"], ["shared movement signal count > 0"], { sharedSignalCodes: sharedMovementCodes })]
        : []),
    ],
    contractTimingSignals: [
      ...yearSupport.filter((item) => item.code.includes("OFFICER") || item.code.includes("RESOURCE")),
      ...monthSupportSignals.filter((item) => item.code.includes("OFFICER") || item.code.includes("RESOURCE")),
    ],
    investmentTimingSignals: [
      ...yearSupport.filter((item) => item.code.includes("WEALTH")),
      ...monthSupportSignals.filter((item) => item.code.includes("WEALTH")),
    ],
    studyTimingSignals: [
      ...daeunSupport.filter((item) => item.code.includes("RESOURCE")),
      ...yearSupport.filter((item) => item.code.includes("RESOURCE")),
      ...monthSupportSignals.filter((item) => item.code.includes("RESOURCE")),
    ],
    travelTimingSignals: [
      ...(sharedMovementSignals.length > 0
        ? [signal("TRAVEL_SHARED_MOVEMENT_FACTS_PRESENT", "travel-shared-movement-facts-present", Math.min(5, sharedMovementSignals.length), ["futureSignals.sharedMovementSignals"], ["shared movement signal count > 0"], { sharedSignalCodes: sharedMovementCodes })]
        : []),
    ],
  };
}

function evidenceCategory(signals: FutureSignalGroups, groups: Array<keyof FutureSignalGroups>) {
  const selected = groups.flatMap((group) => signals[group]);
  const factCodes = Array.from(new Set(selected.filter((item) => !item.code.includes("CANDIDATE")).map((item) => item.code)));
  const candidateCodes = Array.from(new Set(selected.filter((item) => item.code.includes("CANDIDATE")).map((item) => item.code)));
  const occurrences = selected.map((item) => ({
    code: item.code,
    month: typeof item.values?.month === "number" ? item.values.month : undefined,
    ganji: typeof item.values?.ganji === "string" ? item.values.ganji : undefined,
    sourcePaths: item.sourcePaths,
    values: item.values,
  }));

  return {
    factCodes,
    candidateCodes,
    occurrences,
    sourceSignalGroups: groups.filter((group) => signals[group].length > 0),
  };
}

export function buildFutureEvidence(signals: FutureSignalGroups): FutureEvidence {
  return {
    wealthTiming: evidenceCategory(signals, ["wealthTimingSignals"]),
    careerTiming: evidenceCategory(signals, ["careerTimingSignals"]),
    businessTiming: evidenceCategory(signals, ["businessTimingSignals"]),
    healthTiming: evidenceCategory(signals, ["healthTimingSignals"]),
    relationshipTiming: evidenceCategory(signals, ["relationshipTimingSignals"]),
    mobilityTiming: evidenceCategory(signals, ["sharedMovementSignals", "mobilityTimingSignals", "travelTimingSignals"]),
    investmentTiming: evidenceCategory(signals, ["investmentTimingSignals"]),
    contractTiming: evidenceCategory(signals, ["contractTimingSignals"]),
  };
}
