import type { BranchInfo, ElementName, ManseResult, PillarInfo, StemInfo } from "@/src/lib/manse";
import type { CompactCandidate, CompactHiddenStem, CompactRelation, CompactSajuAnalysis, CompactSajuPillar, CompactSignal } from "./types";

const positions = ["year", "month", "day", "hour"] as const;
type Position = (typeof positions)[number];

const elementGenerates: Record<ElementName, ElementName> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

const elementControls: Record<ElementName, ElementName> = {
  wood: "earth",
  fire: "metal",
  earth: "water",
  metal: "wood",
  water: "fire",
};

const heavenlyStemCombinations: Array<[string, string, string]> = [
  ["甲", "己", "갑기합"],
  ["乙", "庚", "을경합"],
  ["丙", "辛", "병신합"],
  ["丁", "壬", "정임합"],
  ["戊", "癸", "무계합"],
];

const heavenlyStemClashes: Array<[string, string, string]> = [
  ["甲", "庚", "갑경충"],
  ["乙", "辛", "을신충"],
  ["丙", "壬", "병임충"],
  ["丁", "癸", "정계충"],
];

const earthlyBranchCombinations: Array<[string, string, string]> = [
  ["子", "丑", "자축합"],
  ["寅", "亥", "인해합"],
  ["卯", "戌", "묘술합"],
  ["辰", "酉", "진유합"],
  ["巳", "申", "사신합"],
  ["午", "未", "오미합"],
];

const earthlyBranchClashes: Array<[string, string, string]> = [
  ["子", "午", "자오충"],
  ["丑", "未", "축미충"],
  ["寅", "申", "인신충"],
  ["卯", "酉", "묘유충"],
  ["辰", "戌", "진술충"],
  ["巳", "亥", "사해충"],
];

function relationOfElement(dayElement: ElementName, targetElement: ElementName): "peer" | "resource" | "output" | "wealth" | "officer" {
  if (dayElement === targetElement) return "peer";
  if (elementGenerates[targetElement] === dayElement) return "resource";
  if (elementGenerates[dayElement] === targetElement) return "output";
  if (elementControls[dayElement] === targetElement) return "wealth";
  return "officer";
}

function tenGodForStem(dayStem: StemInfo, targetStem: StemInfo) {
  const relation = relationOfElement(dayStem.element, targetStem.element);
  const samePolarity = dayStem.yinYang === targetStem.yinYang;

  if (relation === "peer") return samePolarity ? "비견" : "겁재";
  if (relation === "resource") return samePolarity ? "편인" : "정인";
  if (relation === "output") return samePolarity ? "식신" : "상관";
  if (relation === "wealth") return samePolarity ? "편재" : "정재";
  return samePolarity ? "편관" : "정관";
}

function compactHiddenStem(dayStem: StemInfo, stem: StemInfo): CompactHiddenStem {
  return {
    key: stem.key,
    hangul: stem.hangul,
    hanja: stem.hanja,
    element: stem.element,
    yinYang: stem.yinYang,
    tenGod: tenGodForStem(dayStem, stem),
  };
}

function compactPillar(pillar: PillarInfo | null): CompactSajuPillar | null {
  if (pillar === null) return null;

  return {
    gan: pillar.stem.hanja,
    ji: pillar.branch.hanja,
    ganKo: pillar.stem.hangul,
    jiKo: pillar.branch.hangul,
    ganElement: pillar.stem.element,
    jiElement: pillar.branch.element,
    ganYinYang: pillar.stem.yinYang,
    jiYinYang: pillar.branch.yinYang,
    tenGod: pillar.tenGod,
    twelveStage: pillar.twelveStage,
  };
}

function orderedPillars(manse: ManseResult) {
  return {
    year: manse.natalChart.pillars.year,
    month: manse.natalChart.pillars.month,
    day: manse.natalChart.pillars.day,
    hour: manse.natalChart.pillars.hour,
  };
}

function countItems(items: Array<string | null | undefined>) {
  return items.reduce<Record<string, number>>((counts, item) => {
    if (item) counts[item] = (counts[item] ?? 0) + 1;
    return counts;
  }, {});
}

function elementBalance(counts: Record<ElementName, number>): CompactSajuAnalysis["fiveElementsBalance"] {
  const values = Object.values(counts);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const entries = Object.entries(counts) as Array<[ElementName, number]>;

  return {
    dominant: entries.filter(([, value]) => value === max).map(([element]) => element),
    weak: entries.filter(([, value]) => value === min).map(([element]) => element),
    missing: entries.filter(([, value]) => value === 0).map(([element]) => element),
    min,
    max,
    spread: max - min,
    total: values.reduce((sum, value) => sum + value, 0),
  };
}

function relationPairs(
  source: Record<Position, string | null>,
  definitions: Array<[string, string, string]>,
  type: CompactRelation["type"],
): CompactRelation[] {
  const present = positions
    .map((position) => ({ position, value: source[position] }))
    .filter((item): item is { position: Position; value: string } => Boolean(item.value));
  const relations: CompactRelation[] = [];

  for (const [left, right, name] of definitions) {
    const leftHits = present.filter((item) => item.value === left);
    const rightHits = present.filter((item) => item.value === right);

    leftHits.forEach((leftHit) => {
      rightHits.forEach((rightHit) => {
        relations.push({
          type,
          name,
          positions: [leftHit.position, rightHit.position],
          values: [left, right],
        });
      });
    });
  }

  return relations;
}

function buildRelations(pillars: ReturnType<typeof orderedPillars>) {
  const stems = Object.fromEntries(positions.map((position) => [position, pillars[position]?.stem.hanja ?? null])) as Record<Position, string | null>;
  const branches = Object.fromEntries(positions.map((position) => [position, pillars[position]?.branch.hanja ?? null])) as Record<Position, string | null>;

  return {
    heavenlyStemRelations: [
      ...relationPairs(stems, heavenlyStemCombinations, "combination"),
      ...relationPairs(stems, heavenlyStemClashes, "clash"),
    ],
    earthlyBranchRelations: [
      ...relationPairs(branches, earthlyBranchCombinations, "combination"),
      ...relationPairs(branches, earthlyBranchClashes, "clash"),
    ],
  };
}

function buildRoots(dayStem: StemInfo, pillars: ReturnType<typeof orderedPillars>): CompactSajuAnalysis["roots"] {
  return positions.flatMap((position) => {
    const pillar = pillars[position];
    if (!pillar) return [];

    return pillar.hiddenStems
      .filter((stem) => stem.key === dayStem.key || stem.element === dayStem.element)
      .map((stem) => ({
        position,
        branch: pillar.branch.hanja,
        branchKo: pillar.branch.hangul,
        rootType: stem.key === dayStem.key ? "sameStem" as const : "sameElement" as const,
        matchedHiddenStem: stem.hanja,
        matchedHiddenStemKo: stem.hangul,
        weight: stem.key === dayStem.key ? 1 : 0.65,
      }));
  });
}

function candidate(code: string, label: string, score: number, sourcePaths: string[], values?: CompactCandidate["values"]): CompactCandidate {
  return { code, label, score, sourcePaths, values };
}

function signal(code: string, label: string, weight: number, sourcePaths: string[], values?: CompactSignal["values"]): CompactSignal {
  return { code, label, weight, sourcePaths, values };
}

function buildSeasonalStrength(dayStem: StemInfo, monthBranch: BranchInfo, roots: CompactSajuAnalysis["roots"], counts: Record<ElementName, number>) {
  const monthElementRelation = relationOfElement(dayStem.element, monthBranch.element);
  const resourceElement = Object.entries(elementGenerates).find(([, generated]) => generated === dayStem.element)?.[0] as ElementName;
  const supportScore =
    (counts[dayStem.element] ?? 0) +
    (counts[resourceElement] ?? 0) * 0.8 +
    roots.reduce((sum, root) => sum + root.weight, 0);
  const drainScore = Object.entries(counts).reduce((sum, [element, value]) => {
    const relation = relationOfElement(dayStem.element, element as ElementName);
    return relation === "output" || relation === "wealth" || relation === "officer" ? sum + value : sum;
  }, 0);
  const candidateValue: CompactSajuAnalysis["seasonalStrength"]["candidate"] =
    supportScore >= drainScore + 2 ? "strong" : drainScore >= supportScore + 2 ? "weak" : "balanced";

  return {
    monthElementRelation,
    monthBranchElement: monthBranch.element,
    supportScore: Number(supportScore.toFixed(2)),
    drainScore: Number(drainScore.toFixed(2)),
    candidate: candidateValue,
    sourcePaths: ["natalChart.pillars.month.branch", "natalChart.fiveElementsDistribution", "roots"],
  };
}

function sortedCounts(counts: Record<string, number>) {
  return Object.entries(counts).sort(([, left], [, right]) => right - left);
}

function buildStrengthCandidates(seasonalStrength: CompactSajuAnalysis["seasonalStrength"], roots: CompactSajuAnalysis["roots"]) {
  return [
    candidate(`STRENGTH_${seasonalStrength.candidate.toUpperCase()}`, seasonalStrength.candidate, seasonalStrength.supportScore - seasonalStrength.drainScore, seasonalStrength.sourcePaths, {
      rootCount: roots.length,
      supportScore: seasonalStrength.supportScore,
      drainScore: seasonalStrength.drainScore,
    }),
  ];
}

function buildStructureCandidates(tenGodsCount: Record<string, number>) {
  return sortedCounts(tenGodsCount)
    .slice(0, 5)
    .map(([tenGod, count]) => candidate(`STRUCTURE_TENGOD_${tenGod}`, tenGod, count, ["tenGodsCount"], { count }));
}

function buildUsefulCandidates(balance: CompactSajuAnalysis["fiveElementsBalance"], seasonalStrength: CompactSajuAnalysis["seasonalStrength"]) {
  const missing = balance.missing.map((element) => candidate(`USEFUL_MISSING_${element}`, element, 0.72, [`fiveElementsCount.${element}`], { count: 0 }));
  const weak = balance.weak
    .filter((element) => !balance.missing.includes(element))
    .map((element) => candidate(`USEFUL_WEAK_${element}`, element, 0.55, [`fiveElementsCount.${element}`], { count: balance.min }));

  return [
    ...missing,
    ...weak,
    candidate(`USEFUL_SEASONAL_${seasonalStrength.candidate}`, seasonalStrength.candidate, 0.45, seasonalStrength.sourcePaths),
  ];
}

function buildUnfavorableCandidates(balance: CompactSajuAnalysis["fiveElementsBalance"]) {
  return balance.dominant.map((element) =>
    candidate(`UNFAVORABLE_DOMINANT_${element}`, element, 0.58 + balance.spread * 0.05, [`fiveElementsCount.${element}`], { count: balance.max }),
  );
}

function signalFromTenGod(code: string, label: string, tenGodsCount: Record<string, number>, tenGods: string[], sourcePaths: string[]) {
  const weight = tenGods.reduce((sum, tenGod) => sum + (tenGodsCount[tenGod] ?? 0), 0);
  return weight > 0 ? [signal(code, label, weight, sourcePaths, { tenGods: tenGods.join(","), count: weight })] : [];
}

function buildProfileSignals(tenGodsCount: Record<string, number>, balance: CompactSajuAnalysis["fiveElementsBalance"], relations: {
  heavenlyStemRelations: CompactRelation[];
  earthlyBranchRelations: CompactRelation[];
}) {
  return {
    wealthProfileSignals: signalFromTenGod("WEALTH_TENGOD_PRESENT", "wealth-ten-god-present", tenGodsCount, ["정재", "편재"], ["tenGodsCount"]),
    careerProfileSignals: signalFromTenGod("CAREER_OFFICER_PRESENT", "officer-ten-god-present", tenGodsCount, ["정관", "편관"], ["tenGodsCount"]),
    businessProfileSignals: [
      ...signalFromTenGod("BUSINESS_OUTPUT_PRESENT", "output-ten-god-present", tenGodsCount, ["식신", "상관"], ["tenGodsCount"]),
      ...(balance.spread >= 3 ? [signal("BUSINESS_ELEMENT_IMBALANCE", "element-imbalance", balance.spread, ["fiveElementsBalance"], { spread: balance.spread })] : []),
    ],
    relationshipSignals: [
      ...signalFromTenGod("RELATIONSHIP_PEER_PRESENT", "peer-ten-god-present", tenGodsCount, ["비견", "겁재"], ["tenGodsCount"]),
      ...(relations.earthlyBranchRelations.length > 0
        ? [signal("RELATIONSHIP_BRANCH_RELATION_PRESENT", "branch-relation-present", relations.earthlyBranchRelations.length, ["earthlyBranchRelations"])]
        : []),
    ],
    healthSignals: [
      ...(balance.missing.length > 0 ? [signal("HEALTH_MISSING_ELEMENT", "missing-element", balance.missing.length, ["fiveElementsBalance"], { missing: balance.missing.join(",") })] : []),
      ...(balance.spread >= 3 ? [signal("HEALTH_ELEMENT_SPREAD", "element-spread", balance.spread, ["fiveElementsBalance"], { spread: balance.spread })] : []),
    ],
  };
}

function compactFutureInputKeys(manse: ManseResult): CompactSajuAnalysis["futureInputKeys"] {
  return {
    daeunDirection: manse.luck.direction,
    currentDaeun: manse.luck.currentDaewoon?.ganji ?? null,
    currentYear: manse.luck.currentSewoon.ganji,
    currentMonth: manse.luck.currentWolwoon.ganji,
    currentDay: manse.luck.currentIljin.ganji,
    currentHour: manse.luck.currentTimePillar?.ganji ?? null,
    daeunCycles: manse.daeun.cycles.map((cycle) => ({
      index: cycle.index,
      ganji: cycle.ganji,
      startYear: cycle.startYear,
      endYear: cycle.endYear,
      startDateTime: cycle.startDateTime,
      endDateTime: cycle.endDateTime,
    })),
  };
}

export function buildCompactSajuAnalysis(manse: ManseResult): CompactSajuAnalysis {
  const pillars = orderedPillars(manse);
  const dayStem = pillars.day.stem;
  const hiddenStems = Object.fromEntries(
    positions.map((position) => [
      position,
      (pillars[position]?.hiddenStems ?? []).map((stem) => compactHiddenStem(dayStem, stem)),
    ]),
  ) as CompactSajuAnalysis["hiddenStems"];
  const tenGodsByStem = Object.fromEntries(positions.map((position) => [position, pillars[position]?.tenGod ?? null])) as CompactSajuAnalysis["tenGodsByStem"];
  const tenGodsCount = countItems([
    ...Object.values(tenGodsByStem),
    ...positions.flatMap((position) => hiddenStems[position].map((stem) => stem.tenGod)),
  ]);
  const fiveElementsCount = manse.natalChart.fiveElementsDistribution;
  const fiveElementsBalance = elementBalance(fiveElementsCount);
  const relations = buildRelations(pillars);
  const roots = buildRoots(dayStem, pillars);
  const seasonalStrength = buildSeasonalStrength(dayStem, pillars.month.branch, roots, fiveElementsCount);
  const profileSignals = buildProfileSignals(tenGodsCount, fiveElementsBalance, relations);

  return {
    version: "1.0.0",
    subject: {
      name: manse.input.name || null,
      gender: manse.input.gender,
      birthDate: manse.input.birthDate,
      birthTime: manse.input.birthTime,
      calendarType: manse.input.calendarType,
      isLeapMonth: manse.input.isLeapMonth,
      birthplace: manse.input.birthPlace.name,
      unknownTime: manse.input.unknownTime,
    },
    pillars: {
      year: compactPillar(pillars.year) as CompactSajuPillar,
      month: compactPillar(pillars.month) as CompactSajuPillar,
      day: compactPillar(pillars.day) as CompactSajuPillar,
      hour: compactPillar(pillars.hour),
    },
    dayMaster: {
      stem: dayStem.hanja,
      stemKo: dayStem.hangul,
      element: dayStem.element,
      yinYang: dayStem.yinYang,
    },
    monthCommand: {
      branch: pillars.month.branch.hanja,
      branchKo: pillars.month.branch.hangul,
      element: pillars.month.branch.element,
      yinYang: pillars.month.branch.yinYang,
      hiddenStems: pillars.month.hiddenStems.map((stem) => compactHiddenStem(dayStem, stem)),
    },
    fiveElementsCount,
    fiveElementsBalance,
    tenGodsByStem,
    tenGodsByBranchHidden: hiddenStems,
    tenGodsCount,
    heavenlyStemRelations: relations.heavenlyStemRelations,
    earthlyBranchRelations: relations.earthlyBranchRelations,
    hiddenStems,
    roots,
    seasonalStrength,
    strengthCandidates: buildStrengthCandidates(seasonalStrength, roots),
    structureCandidates: buildStructureCandidates(tenGodsCount),
    usefulGodCandidates: buildUsefulCandidates(fiveElementsBalance, seasonalStrength),
    unfavorableGodCandidates: buildUnfavorableCandidates(fiveElementsBalance),
    ...profileSignals,
    futureInputKeys: compactFutureInputKeys(manse),
  };
}
