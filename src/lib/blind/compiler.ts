import type { BranchInfo, ElementName, ManseResult, PillarInfo, StemInfo } from "@/src/lib/manse";
import type {
  BlindCompilerCandidate,
  BlindCompilerHiddenStem,
  BlindCompilerPillar,
  BlindCompilerRelation,
  BlindCompilerSignal,
  CompactSajuAnalysis,
} from "./types";

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

const branchCombinations: Array<[string, string, string]> = [
  ["子", "丑", "자축합"],
  ["寅", "亥", "인해합"],
  ["卯", "戌", "묘술합"],
  ["辰", "酉", "진유합"],
  ["巳", "申", "사신합"],
  ["午", "未", "오미합"],
];

const clashes: Array<[string, string, string]> = [
  ["甲", "庚", "갑경충"],
  ["乙", "辛", "을신충"],
  ["丙", "壬", "병임충"],
  ["丁", "癸", "정계충"],
  ["子", "午", "자오충"],
  ["丑", "未", "축미충"],
  ["寅", "申", "인신충"],
  ["卯", "酉", "묘유충"],
  ["辰", "戌", "진술충"],
  ["巳", "亥", "사해충"],
];

const punishments: Array<[string, string, string]> = [
  ["寅", "巳", "인사형"],
  ["巳", "申", "사신형"],
  ["丑", "戌", "축술형"],
  ["戌", "未", "술미형"],
  ["子", "卯", "자묘형"],
];

const harms: Array<[string, string, string]> = [
  ["子", "未", "자미해"],
  ["丑", "午", "축오해"],
  ["寅", "巳", "인사해"],
  ["卯", "辰", "묘진해"],
  ["申", "亥", "신해해"],
  ["酉", "戌", "유술해"],
];

const destructions: Array<[string, string, string]> = [
  ["子", "酉", "자유파"],
  ["丑", "辰", "축진파"],
  ["寅", "亥", "인해파"],
  ["卯", "午", "묘오파"],
  ["巳", "申", "사신파"],
  ["未", "戌", "미술파"],
];

const branchSeason: Record<string, { season: CompactSajuAnalysis["seasonalContext"]["season"]; element: ElementName }> = {
  寅: { season: "spring", element: "wood" },
  卯: { season: "spring", element: "wood" },
  辰: { season: "transitional", element: "earth" },
  巳: { season: "summer", element: "fire" },
  午: { season: "summer", element: "fire" },
  未: { season: "transitional", element: "earth" },
  申: { season: "autumn", element: "metal" },
  酉: { season: "autumn", element: "metal" },
  戌: { season: "transitional", element: "earth" },
  亥: { season: "winter", element: "water" },
  子: { season: "winter", element: "water" },
  丑: { season: "transitional", element: "earth" },
};

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

function compactPillar(pillar: PillarInfo | null): BlindCompilerPillar | null {
  if (!pillar) return null;

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

function compactHiddenStem(dayStem: StemInfo, stem: StemInfo): BlindCompilerHiddenStem {
  return {
    key: stem.key,
    hangul: stem.hangul,
    hanja: stem.hanja,
    element: stem.element,
    yinYang: stem.yinYang,
    tenGod: tenGodForStem(dayStem, stem),
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

function buildRelations(source: Record<Position, string | null>, definitions: Array<[string, string, string]>): BlindCompilerRelation[] {
  const present = positions
    .map((position) => ({ position, value: source[position] }))
    .filter((item): item is { position: Position; value: string } => Boolean(item.value));

  return definitions.flatMap(([left, right, name]) => {
    const leftHits = present.filter((item) => item.value === left);
    const rightHits = present.filter((item) => item.value === right);
    return leftHits.flatMap((leftHit) =>
      rightHits.map((rightHit) => ({
        name,
        positions: [leftHit.position, rightHit.position],
        values: [left, right],
      })),
    );
  });
}

function candidate(code: string, label: string, score: number, sourcePaths: string[], values?: BlindCompilerCandidate["values"]): BlindCompilerCandidate {
  return { code, label, score, sourcePaths, values };
}

function signal(
  code: string,
  label: string,
  weight: number,
  sourcePaths: string[],
  sourceRules: string[],
  values?: BlindCompilerSignal["values"],
  confidence = Math.min(1, Math.max(0.35, weight / 5)),
): BlindCompilerSignal {
  return {
    kind: "fact",
    code: factCode(code),
    label: factLabel(label),
    weight: Math.min(5, Math.max(1, weight)),
    confidence: Number(confidence.toFixed(2)),
    sourcePaths,
    sourceRules,
    values,
  };
}

function factCode(code: string) {
  return code
    .replace(/BUSINESS_OUTPUT_ACTIVE/g, "BUSINESS_OUTPUT_COUNT_GE_2")
    .replace(/BUSINESS_MARKET_ORIENTED_SIGNAL/g, "BUSINESS_INDIRECT_WEALTH_PRESENT_FACT")
    .replace(/BUSINESS_STABLE_REVENUE_SIGNAL/g, "BUSINESS_DIRECT_WEALTH_PRESENT_FACT")
    .replace(/RELATIONSHIP_PEER_COMPETITION_SIGNAL/g, "RELATIONSHIP_PEER_COUNT_GE_2_FACT")
    .replace(/LEADERSHIP_SELF_ASSERTION_SIGNAL/g, "LEADERSHIP_PEER_COUNT_GE_2_FACT")
    .replace(/ORGANIZATION_FORMAL_ROLE_SIGNAL/g, "ORGANIZATION_DIRECT_OFFICER_PRESENT_FACT")
    .replace(/AUTHORITY_PRESSURE_SIGNAL/g, "AUTHORITY_OFFICER_COUNT_GE_2_FACT")
    .replace(/AUTHORITY_DYNAMIC_PRESSURE_SIGNAL/g, "AUTHORITY_INDIRECT_OFFICER_PRESENT_FACT")
    .replace(/MANAGEMENT_OUTPUT_CONTROL_MIX/g, "MANAGEMENT_OUTPUT_OFFICER_CO_OCCURRENCE")
    .replace(/ENTREPRENEUR_INDEPENDENT_ACTION_SIGNAL/g, "ENTREPRENEUR_PEER_OUTPUT_CO_OCCURRENCE_FACT")
    .replace(/STUDY_CERTIFICATION_SUPPORT_SIGNAL/g, "STUDY_RESOURCE_OFFICER_CO_OCCURRENCE_FACT")
    .replace(/REPUTATION_EXPRESSION_AUTHORITY_TENSION/g, "REPUTATION_OUTPUT_OFFICER_CO_OCCURRENCE")
    .replace(/CONTRACT_FORMALITY_SIGNAL/g, "CONTRACT_OFFICER_PRESENT_FACT")
    .replace(/CONTRACT_DOCUMENT_SUPPORT_SIGNAL/g, "CONTRACT_RESOURCE_OFFICER_CO_OCCURRENCE_FACT")
    .replace(/LEGAL_RELATION_RISK_SIGNAL/g, "LEGAL_RELATION_PRESENT_FACT")
    .replace(/SPOUSE_PALACE_RELATION_SIGNAL/g, "SPOUSE_PALACE_RELATION_PRESENT_FACT")
    .replace(/ACCIDENT_RELATION_COMPLEXITY_SIGNAL/g, "ACCIDENT_RELATION_COUNT_GE_2_FACT")
    .replace(/INVESTMENT_REGULATED_ASSET_SIGNAL/g, "INVESTMENT_WEALTH_OFFICER_CO_OCCURRENCE_FACT")
    .replace(/INVESTMENT_COMPETITION_RISK_SIGNAL/g, "INVESTMENT_WEALTH_PEER_COUNT_GE_2_FACT")
    .replace(/CASHFLOW_COMPETITION_SIGNAL/g, "CASHFLOW_PEER_WEALTH_CO_OCCURRENCE_FACT")
    .replace(/STRESS_ELEMENT_IMBALANCE_SIGNAL/g, "STRESS_ELEMENT_SPREAD_GE_3_FACT")
    .replace(/STRESS_OFFICER_PRESSURE_SIGNAL/g, "STRESS_OFFICER_COUNT_GE_2_FACT")
    .replace(/_SIGNAL$/g, "_FACT")
    .replace(/RISK/g, "RELATION")
    .replace(/PRESSURE/g, "COUNT")
    .replace(/COMPETITION/g, "CO_OCCURRENCE")
    .replace(/TENSION/g, "CO_OCCURRENCE")
    .replace(/IMBALANCE/g, "SPREAD")
    .replace(/ACTIVE/g, "COUNT_GE_2")
    .replace(/ORIENTED/g, "PRESENT");
}

function factLabel(label: string) {
  return label
    .replace(/business-output-active/g, "business-output-count-ge-2")
    .replace(/market-oriented-signal/g, "indirect-wealth-present-fact")
    .replace(/stable-revenue-signal/g, "direct-wealth-present-fact")
    .replace(/peer-competition-signal/g, "peer-count-ge-2-fact")
    .replace(/self-assertion-signal/g, "peer-count-ge-2-fact")
    .replace(/formal-role-signal/g, "direct-officer-present-fact")
    .replace(/authority-pressure-signal/g, "officer-count-ge-2-fact")
    .replace(/dynamic-pressure-signal/g, "indirect-officer-present-fact")
    .replace(/output-control-mix/g, "output-officer-co-occurrence")
    .replace(/independent-action-signal/g, "peer-output-co-occurrence-fact")
    .replace(/certification-support-signal/g, "resource-officer-co-occurrence-fact")
    .replace(/expression-authority-tension/g, "output-officer-co-occurrence")
    .replace(/formality-signal/g, "officer-present-fact")
    .replace(/document-support-signal/g, "resource-officer-co-occurrence-fact")
    .replace(/relation-risk-signal/g, "relation-present-fact")
    .replace(/spouse-palace-relation-signal/g, "spouse-palace-relation-present-fact")
    .replace(/relation-complexity-signal/g, "relation-count-ge-2-fact")
    .replace(/regulated-asset-signal/g, "wealth-officer-co-occurrence-fact")
    .replace(/competition-risk-signal/g, "wealth-peer-count-ge-2-fact")
    .replace(/competition-signal/g, "peer-wealth-co-occurrence-fact")
    .replace(/element-imbalance-signal/g, "element-spread-ge-3-fact")
    .replace(/officer-pressure-signal/g, "officer-count-ge-2-fact")
    .replace(/-signal$/g, "-fact")
    .replace(/risk/g, "relation")
    .replace(/pressure/g, "count")
    .replace(/competition/g, "co-occurrence")
    .replace(/tension/g, "co-occurrence")
    .replace(/imbalance/g, "spread")
    .replace(/active/g, "count-ge-2")
    .replace(/oriented/g, "present");
}

function elementBalance(counts: Record<ElementName, number>): CompactSajuAnalysis["fiveElements"] {
  const entries = Object.entries(counts) as Array<[ElementName, number]>;
  const values = entries.map(([, value]) => value);
  const max = Math.max(...values);
  const min = Math.min(...values);

  return {
    counts,
    balance: {
      min,
      max,
      spread: max - min,
      total: values.reduce((sum, value) => sum + value, 0),
      missing: entries.filter(([, value]) => value === 0).map(([element]) => element),
    },
    strongest: entries.filter(([, value]) => value === max).map(([element]) => element),
    weakest: entries.filter(([, value]) => value === min).map(([element]) => element),
  };
}

function buildDayMasterRoots(dayStem: StemInfo, pillars: ReturnType<typeof orderedPillars>): CompactSajuAnalysis["roots"]["dayMasterRoots"] {
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

function buildSeasonalContext(dayStem: StemInfo, monthBranch: BranchInfo, roots: CompactSajuAnalysis["roots"]["dayMasterRoots"], counts: Record<ElementName, number>) {
  const season = branchSeason[monthBranch.hanja] ?? { season: "transitional" as const, element: monthBranch.element };
  const relation = relationOfElement(dayStem.element, monthBranch.element);
  const resourceElement = Object.entries(elementGenerates).find(([, generated]) => generated === dayStem.element)?.[0] as ElementName;
  const supportScore =
    (counts[dayStem.element] ?? 0) +
    (counts[resourceElement] ?? 0) * 0.8 +
    roots.reduce((sum, root) => sum + root.weight, 0);
  const drainScore = Object.entries(counts).reduce((sum, [element, value]) => {
    const elementRelation = relationOfElement(dayStem.element, element as ElementName);
    return elementRelation === "output" || elementRelation === "wealth" || elementRelation === "officer" ? sum + value : sum;
  }, 0);
  const strength: CompactSajuAnalysis["seasonalContext"]["dayMasterSeasonalSupport"]["candidate"] =
    supportScore >= drainScore + 2 ? "strong" : drainScore >= supportScore + 2 ? "weak" : "balanced";

  return {
    monthBranch: monthBranch.hanja,
    monthBranchKo: monthBranch.hangul,
    season: season.season,
    seasonalElement: season.element,
    dayMasterSeasonalSupport: {
      relation,
      supportScore: Number(supportScore.toFixed(2)),
      drainScore: Number(drainScore.toFixed(2)),
      candidate: strength,
    },
  };
}

function structureCandidates(tenGodsCount: Record<string, number>) {
  return Object.entries(tenGodsCount)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 5)
    .map(([tenGod, count]) => candidate(`STRUCTURE_TENGOD_${tenGod}`, tenGod, count, ["tenGods.counts"], { count }));
}

function signalFromTenGod(code: string, label: string, tenGodsCount: Record<string, number>, tenGods: readonly string[]) {
  const weight = tenGods.reduce((sum, tenGod) => sum + (tenGodsCount[tenGod] ?? 0), 0);
  return weight > 0
    ? [
        signal(code, label, weight, ["tenGods.counts"], [`${tenGods.join("/")} count > 0`], {
          tenGods: tenGods.join(","),
          count: weight,
        }),
      ]
    : [];
}

const tenGodGroups = {
  wealth: ["정재", "편재"],
  officer: ["정관", "편관"],
  output: ["식신", "상관"],
  peer: ["비견", "겁재"],
  resource: ["정인", "편인"],
} as const;

function tenGodCount(counts: Record<string, number>, tenGods: readonly string[]) {
  return tenGods.reduce((sum, tenGod) => sum + (counts[tenGod] ?? 0), 0);
}

function hasTenGod(counts: Record<string, number>, tenGod: string) {
  return (counts[tenGod] ?? 0) > 0;
}

function byStemCount(byStem: CompactSajuAnalysis["tenGods"]["byStem"], tenGods: readonly string[]) {
  return positions.filter((position) => {
    const tenGod = byStem[position];
    return tenGod ? tenGods.includes(tenGod) : false;
  }).length;
}

function hiddenCount(hiddenStems: CompactSajuAnalysis["hiddenStems"], tenGods: readonly string[]) {
  return positions.reduce(
    (sum, position) => sum + hiddenStems[position].filter((stem) => tenGods.includes(stem.tenGod)).length,
    0,
  );
}

function relationCount(relations: CompactSajuAnalysis["relations"]) {
  return relations.clashes.length + relations.punishments.length + relations.harms.length + relations.destructions.length;
}

function hasDayOrHourRelation(relations: BlindCompilerRelation[]) {
  return relations.some((relation) => relation.positions.includes("day") || relation.positions.includes("hour"));
}

function relationNames(relations: BlindCompilerRelation[]) {
  return relations.map((relation) => relation.name);
}

function buildFeatureSignals(input: {
  byStem: CompactSajuAnalysis["tenGods"]["byStem"];
  counts: Record<string, number>;
  fiveElements: CompactSajuAnalysis["fiveElements"];
  hiddenStems: CompactSajuAnalysis["hiddenStems"];
  relations: CompactSajuAnalysis["relations"];
  gender: CompactSajuAnalysis["inputMeta"]["gender"];
}): CompactSajuAnalysis["signals"] {
  const { byStem, counts, fiveElements, hiddenStems, relations, gender } = input;
  const wealthCount = tenGodCount(counts, tenGodGroups.wealth);
  const officerCount = tenGodCount(counts, tenGodGroups.officer);
  const outputCount = tenGodCount(counts, tenGodGroups.output);
  const peerCount = tenGodCount(counts, tenGodGroups.peer);
  const resourceCount = tenGodCount(counts, tenGodGroups.resource);
  const wealthPresent = wealthCount > 0;
  const officerPresent = officerCount > 0;
  const outputPresent = outputCount > 0;
  const peerPresent = peerCount > 0;
  const resourcePresent = resourceCount > 0;
  const relationTotal = relationCount(relations);
  const clashNames = relationNames(relations.clashes);
  const relationalComplexityNames = relationNames([
    ...relations.clashes,
    ...relations.punishments,
    ...relations.harms,
    ...relations.destructions,
  ]);
  const spouseStars = gender === "male" ? tenGodGroups.wealth : tenGodGroups.officer;
  const spouseCount = tenGodCount(counts, spouseStars);
  const spouseStemCount = byStemCount(byStem, spouseStars);
  const spouseHiddenCount = hiddenCount(hiddenStems, spouseStars);
  const wealthStemCount = byStemCount(byStem, tenGodGroups.wealth);
  const wealthHiddenCount = hiddenCount(hiddenStems, tenGodGroups.wealth);

  const wealthSignals = [
    ...signalFromTenGod("WEALTH_TENGOD_PRESENT", "wealth-ten-god-present", counts, tenGodGroups.wealth),
    ...(wealthCount >= 2
      ? [signal("WEALTH_TENGOD_CLUSTER", "wealth-ten-god-cluster", wealthCount, ["tenGods.counts"], ["wealth ten-god count >= 2"], { count: wealthCount })]
      : []),
    ...(wealthHiddenCount > 0 && wealthStemCount === 0
      ? [
          signal(
            "WEALTH_HIDDEN_ONLY",
            "wealth-hidden-only",
            wealthHiddenCount,
            ["tenGods.byBranchHidden", "tenGods.byStem"],
            ["wealth ten-god exists only in hidden stems"],
            { hiddenCount: wealthHiddenCount },
          ),
        ]
      : []),
  ];

  const careerSignals = [
    ...signalFromTenGod("CAREER_OFFICER_PRESENT", "officer-ten-god-present", counts, tenGodGroups.officer),
    ...(resourcePresent && officerPresent
      ? [
          signal("CAREER_RESOURCE_OFFICER_LINK", "resource-officer-link", Math.min(5, resourceCount + officerCount), ["tenGods.counts"], [
            "resource ten-god present",
            "officer ten-god present",
          ], { resourceCount, officerCount }),
        ]
      : []),
  ];

  const businessSignals = [
    ...signalFromTenGod("BUSINESS_OUTPUT_PRESENT", "output-ten-god-present", counts, tenGodGroups.output),
    ...(outputCount >= 2
      ? [signal("BUSINESS_OUTPUT_ACTIVE", "business-output-active", outputCount, ["tenGods.counts"], ["output ten-god count >= 2"], { count: outputCount })]
      : []),
    ...(hasTenGod(counts, "편재")
      ? [signal("BUSINESS_MARKET_ORIENTED_SIGNAL", "market-oriented-signal", counts.편재, ["tenGods.counts.편재"], ["indirect wealth present"], { count: counts.편재 })]
      : []),
    ...(hasTenGod(counts, "정재")
      ? [signal("BUSINESS_STABLE_REVENUE_SIGNAL", "stable-revenue-signal", counts.정재, ["tenGods.counts.정재"], ["direct wealth present"], { count: counts.정재 })]
      : []),
  ];

  const relationshipSignals = [
    ...signalFromTenGod("RELATIONSHIP_PEER_PRESENT", "peer-ten-god-present", counts, tenGodGroups.peer),
    ...(peerCount >= 2
      ? [signal("RELATIONSHIP_PEER_COMPETITION_SIGNAL", "peer-competition-signal", peerCount, ["tenGods.counts"], ["peer ten-god count >= 2"], { count: peerCount })]
      : []),
  ];

  const healthSignals = [
    ...(fiveElements.balance.missing.length > 0
      ? [
          signal("HEALTH_MISSING_ELEMENT", "missing-element", fiveElements.balance.missing.length, ["fiveElements.balance"], ["five element missing count > 0"], {
            missing: fiveElements.balance.missing,
          }),
        ]
      : []),
    ...(fiveElements.balance.spread >= 3
      ? [signal("HEALTH_ELEMENT_SPREAD", "element-spread", fiveElements.balance.spread, ["fiveElements.balance"], ["five element spread >= 3"], { spread: fiveElements.balance.spread })]
      : []),
  ];

  return {
    wealthSignals,
    careerSignals,
    businessSignals,
    relationshipSignals,
    healthSignals,
    leadershipSignals: [
      ...(peerPresent && officerPresent
        ? [signal("LEADERSHIP_PEER_AUTHORITY_MIX", "peer-authority-mix", Math.min(5, peerCount + officerCount), ["tenGods.counts"], ["peer ten-god present", "officer ten-god present"], { peerCount, officerCount })]
        : []),
      ...(peerCount >= 2
        ? [signal("LEADERSHIP_SELF_ASSERTION_SIGNAL", "self-assertion-signal", peerCount, ["tenGods.counts"], ["peer ten-god count >= 2"], { count: peerCount })]
        : []),
    ],
    organizationSignals: [
      ...(hasTenGod(counts, "정관")
        ? [signal("ORGANIZATION_FORMAL_ROLE_SIGNAL", "formal-role-signal", counts.정관, ["tenGods.counts.정관"], ["direct officer present"], { count: counts.정관 })]
        : []),
    ],
    authoritySignals: [
      ...(officerCount >= 2
        ? [signal("AUTHORITY_PRESSURE_SIGNAL", "authority-pressure-signal", officerCount, ["tenGods.counts"], ["officer ten-god count >= 2"], { count: officerCount })]
        : []),
      ...(hasTenGod(counts, "편관")
        ? [signal("AUTHORITY_DYNAMIC_PRESSURE_SIGNAL", "dynamic-pressure-signal", counts.편관, ["tenGods.counts.편관"], ["indirect officer present"], { count: counts.편관 })]
        : []),
    ],
    managementSignals: [
      ...(outputPresent && officerPresent
        ? [signal("MANAGEMENT_OUTPUT_CONTROL_MIX", "output-control-mix", Math.min(5, outputCount + officerCount), ["tenGods.counts"], ["output ten-god present", "officer ten-god present"], { outputCount, officerCount })]
        : []),
    ],
    entrepreneurSignals: [
      ...(outputPresent && wealthPresent
        ? [signal("ENTREPRENEUR_OUTPUT_WEALTH_LINK", "output-wealth-link", Math.min(5, outputCount + wealthCount), ["tenGods.counts"], ["output ten-god present", "wealth ten-god present"], { outputCount, wealthCount })]
        : []),
      ...(peerPresent && outputPresent
        ? [signal("ENTREPRENEUR_INDEPENDENT_ACTION_SIGNAL", "independent-action-signal", Math.min(5, peerCount + outputCount), ["tenGods.counts"], ["peer ten-god present", "output ten-god present"], { peerCount, outputCount })]
        : []),
    ],
    salesSignals: [
      ...(outputPresent && wealthPresent
        ? [signal("SALES_OUTPUT_WEALTH_LINK", "output-wealth-link", Math.min(5, outputCount + wealthCount), ["tenGods.counts"], ["output ten-god present", "wealth ten-god present"], { outputCount, wealthCount })]
        : []),
    ],
    creativitySignals: [
      ...(hasTenGod(counts, "상관")
        ? [signal("CREATIVITY_HURTING_OFFICER_SIGNAL", "hurting-officer-signal", counts.상관, ["tenGods.counts.상관"], ["hurting officer present"], { count: counts.상관 })]
        : []),
      ...(hasTenGod(counts, "식신")
        ? [signal("CREATIVITY_FOOD_GOD_SIGNAL", "food-god-signal", counts.식신, ["tenGods.counts.식신"], ["food god present"], { count: counts.식신 })]
        : []),
    ],
    studySignals: [
      ...(resourcePresent
        ? [signal("STUDY_RESOURCE_PRESENT", "resource-present", resourceCount, ["tenGods.counts"], ["resource ten-god present"], { count: resourceCount })]
        : []),
      ...(resourceCount >= 2
        ? [signal("STUDY_RESOURCE_CLUSTER", "resource-cluster", resourceCount, ["tenGods.counts"], ["resource ten-god count >= 2"], { count: resourceCount })]
        : []),
      ...(resourcePresent && officerPresent
        ? [signal("STUDY_CERTIFICATION_SUPPORT_SIGNAL", "certification-support-signal", Math.min(5, resourceCount + officerCount), ["tenGods.counts"], ["resource ten-god present", "officer ten-god present"], { resourceCount, officerCount })]
        : []),
    ],
    reputationSignals: [
      ...(outputPresent && officerPresent
        ? [signal("REPUTATION_EXPRESSION_AUTHORITY_TENSION", "expression-authority-tension", Math.min(5, outputCount + officerCount), ["tenGods.counts"], ["output ten-god present", "officer ten-god present"], { outputCount, officerCount })]
        : []),
    ],
    partnershipSignals: [
      ...(peerPresent
        ? [signal("PARTNERSHIP_PEER_PRESENT", "peer-present", peerCount, ["tenGods.counts"], ["peer ten-god present"], { count: peerCount })]
        : []),
      ...(wealthPresent && peerPresent
        ? [signal("PARTNERSHIP_WEALTH_PEER_MIX", "wealth-peer-mix", Math.min(5, wealthCount + peerCount), ["tenGods.counts"], ["wealth ten-god present", "peer ten-god present"], { wealthCount, peerCount })]
        : []),
    ],
    mobilitySignals: [
      ...(relations.clashes.length > 0
        ? [signal("MOBILITY_CLASH_SIGNAL", "clash-signal", relations.clashes.length, ["relations.clashes"], ["clash relation count > 0"], { names: clashNames })]
        : []),
      ...(hasDayOrHourRelation(relations.clashes)
        ? [signal("MOBILITY_PERSONAL_AXIS_SIGNAL", "personal-axis-signal", 3, ["relations.clashes"], ["clash relation includes day or hour position"], { names: clashNames })]
        : []),
    ],
    contractSignals: [
      ...(officerPresent
        ? [signal("CONTRACT_FORMALITY_SIGNAL", "formality-signal", officerCount, ["tenGods.counts"], ["officer ten-god present"], { count: officerCount })]
        : []),
      ...(officerPresent && resourcePresent
        ? [signal("CONTRACT_DOCUMENT_SUPPORT_SIGNAL", "document-support-signal", Math.min(5, officerCount + resourceCount), ["tenGods.counts"], ["officer ten-god present", "resource ten-god present"], { officerCount, resourceCount })]
        : []),
    ],
    legalRiskSignals: [
      ...(relationTotal > 0
        ? [signal("LEGAL_RELATION_RISK_SIGNAL", "relation-risk-signal", Math.min(5, relationTotal), ["relations"], ["clash/punishment/harm/destruction count > 0"], { names: relationalComplexityNames })]
        : []),
    ],
    familySignals: [
      ...(resourcePresent
        ? [signal("FAMILY_RESOURCE_SIGNAL", "resource-signal", resourceCount, ["tenGods.counts"], ["resource ten-god present"], { count: resourceCount })]
        : []),
      ...(peerPresent
        ? [signal("FAMILY_PEER_SIGNAL", "peer-signal", peerCount, ["tenGods.counts"], ["peer ten-god present"], { count: peerCount })]
        : []),
    ],
    spouseSignals: [
      ...(spouseCount > 0
        ? [signal("SPOUSE_STAR_PRESENT", "spouse-star-present", spouseCount, ["tenGods.counts"], [`${gender} spouse star count > 0`], { spouseStars: [...spouseStars], count: spouseCount })]
        : []),
      ...(spouseHiddenCount > 0 && spouseStemCount === 0
        ? [signal("SPOUSE_STAR_HIDDEN_ONLY", "spouse-star-hidden-only", spouseHiddenCount, ["tenGods.byBranchHidden", "tenGods.byStem"], [`${gender} spouse star exists only in hidden stems`], { hiddenCount: spouseHiddenCount })]
        : []),
      ...(hasDayOrHourRelation([...relations.clashes, ...relations.punishments, ...relations.harms, ...relations.destructions])
        ? [signal("SPOUSE_PALACE_RELATION_SIGNAL", "spouse-palace-relation-signal", 3, ["relations"], ["relation includes day or hour position"], { names: relationalComplexityNames })]
        : []),
    ],
    childrenSignals: [
      ...(outputPresent
        ? [signal("CHILDREN_STAR_PRESENT", "children-star-present", outputCount, ["tenGods.counts"], ["output ten-god present"], { count: outputCount })]
        : []),
      ...(outputCount >= 2
        ? [signal("CHILDREN_OUTPUT_CLUSTER", "children-output-cluster", outputCount, ["tenGods.counts"], ["output ten-god count >= 2"], { count: outputCount })]
        : []),
    ],
    parentSignals: [
      ...(resourcePresent
        ? [signal("PARENT_RESOURCE_PRESENT", "parent-resource-present", resourceCount, ["tenGods.counts"], ["resource ten-god present"], { count: resourceCount })]
        : []),
      ...(resourceCount >= 2
        ? [signal("PARENT_RESOURCE_CLUSTER", "parent-resource-cluster", resourceCount, ["tenGods.counts"], ["resource ten-god count >= 2"], { count: resourceCount })]
        : []),
    ],
    accidentSignals: [
      ...(relations.clashes.length > 0 && relationTotal >= 2
        ? [signal("ACCIDENT_RELATION_COMPLEXITY_SIGNAL", "relation-complexity-signal", Math.min(5, relationTotal), ["relations"], ["clash count > 0", "total relation count >= 2"], { names: relationalComplexityNames })]
        : []),
    ],
    travelSignals: [
      ...(relations.clashes.some((relation) => ["인신충", "사해충"].includes(relation.name))
        ? [signal("TRAVEL_MOBILITY_SIGNAL", "travel-mobility-signal", 3, ["relations.clashes"], ["mobile clash candidate present"], { names: clashNames.filter((name) => ["인신충", "사해충"].includes(name)) })]
        : []),
    ],
    overseasSignals: [
      ...(relations.clashes.some((relation) => ["인신충", "사해충"].includes(relation.name))
        ? [signal("OVERSEAS_MOBILITY_CANDIDATE", "overseas-mobility-candidate", 2, ["relations.clashes"], ["mobile clash candidate present"], { names: clashNames.filter((name) => ["인신충", "사해충"].includes(name)) })]
        : []),
    ],
    propertySignals: [
      ...(fiveElements.counts.earth > 0
        ? [signal("PROPERTY_EARTH_PRESENT", "earth-present", fiveElements.counts.earth, ["fiveElements.counts.earth"], ["earth element count > 0"], { count: fiveElements.counts.earth })]
        : []),
    ],
    investmentSignals: [
      ...(wealthPresent
        ? [signal("INVESTMENT_WEALTH_STAR_PRESENT", "wealth-star-present", wealthCount, ["tenGods.counts"], ["wealth ten-god present"], { count: wealthCount })]
        : []),
      ...(wealthPresent && officerPresent
        ? [signal("INVESTMENT_REGULATED_ASSET_SIGNAL", "regulated-asset-signal", Math.min(5, wealthCount + officerCount), ["tenGods.counts"], ["wealth ten-god present", "officer ten-god present"], { wealthCount, officerCount })]
        : []),
      ...(wealthPresent && peerCount >= 2
        ? [signal("INVESTMENT_COMPETITION_RISK_SIGNAL", "competition-risk-signal", Math.min(5, wealthCount + peerCount), ["tenGods.counts"], ["wealth ten-god present", "peer ten-god count >= 2"], { wealthCount, peerCount })]
        : []),
    ],
    cashflowSignals: [
      ...(peerCount >= 2 && wealthPresent
        ? [signal("CASHFLOW_COMPETITION_SIGNAL", "competition-signal", Math.min(5, peerCount + wealthCount), ["tenGods.counts"], ["peer ten-god count >= 2", "wealth ten-god present"], { peerCount, wealthCount })]
        : []),
      ...(outputCount >= 2 && wealthPresent
        ? [signal("OUTPUT_TO_WEALTH_SIGNAL", "output-to-wealth-signal", Math.min(5, outputCount + wealthCount), ["tenGods.counts"], ["output ten-god count >= 2", "wealth ten-god present"], { outputCount, wealthCount })]
        : []),
    ],
    stressSignals: [
      ...(fiveElements.balance.spread >= 3
        ? [signal("STRESS_ELEMENT_IMBALANCE_SIGNAL", "element-imbalance-signal", fiveElements.balance.spread, ["fiveElements.balance"], ["five element spread >= 3"], { spread: fiveElements.balance.spread })]
        : []),
      ...(officerCount >= 2
        ? [signal("STRESS_OFFICER_PRESSURE_SIGNAL", "officer-pressure-signal", officerCount, ["tenGods.counts"], ["officer ten-god count >= 2"], { count: officerCount })]
        : []),
      ...(relations.clashes.length >= 2
        ? [signal("STRESS_CLASH_CLUSTER_SIGNAL", "clash-cluster-signal", relations.clashes.length, ["relations.clashes"], ["clash count >= 2"], { names: clashNames })]
        : []),
    ],
    communicationSignals: [
      ...(outputPresent
        ? [signal("COMMUNICATION_OUTPUT_PRESENT", "output-present", outputCount, ["tenGods.counts"], ["output ten-god present"], { count: outputCount })]
        : []),
      ...(outputCount >= 2
        ? [signal("COMMUNICATION_OUTPUT_CLUSTER", "output-cluster", outputCount, ["tenGods.counts"], ["output ten-god count >= 2"], { count: outputCount })]
        : []),
    ],
  };
}

function evidenceCategory(signals: CompactSajuAnalysis["signals"], groups: string[]) {
  const factCodes: string[] = [];
  const candidateCodes: string[] = [];

  groups.forEach((group) => {
    const groupSignals = signals[group as keyof CompactSajuAnalysis["signals"]] ?? [];
    groupSignals.forEach((item) => {
      if (item.code.includes("CANDIDATE")) {
        candidateCodes.push(item.code);
      } else {
        factCodes.push(item.code);
      }
    });
  });

  return {
    factCodes,
    candidateCodes,
    sourceSignalGroups: groups.filter((group) => (signals[group as keyof CompactSajuAnalysis["signals"]] ?? []).length > 0),
  };
}

function buildEvidenceSummary(signals: CompactSajuAnalysis["signals"]): CompactSajuAnalysis["evidenceSummary"] {
  return {
    wealth: evidenceCategory(signals, ["wealthSignals", "cashflowSignals"]),
    business: evidenceCategory(signals, ["businessSignals", "entrepreneurSignals", "salesSignals"]),
    career: evidenceCategory(signals, ["careerSignals", "organizationSignals", "authoritySignals", "managementSignals"]),
    relationship: evidenceCategory(signals, ["relationshipSignals", "partnershipSignals", "spouseSignals", "familySignals"]),
    health: evidenceCategory(signals, ["healthSignals", "stressSignals", "accidentSignals"]),
    contract: evidenceCategory(signals, ["contractSignals", "legalRiskSignals", "reputationSignals"]),
    investment: evidenceCategory(signals, ["investmentSignals", "propertySignals", "cashflowSignals"]),
    mobility: evidenceCategory(signals, ["mobilitySignals", "travelSignals", "overseasSignals"]),
  };
}

export function compileBlindInput(manseResult: ManseResult): CompactSajuAnalysis {
  const pillars = orderedPillars(manseResult);
  const dayStem = pillars.day.stem;
  const hiddenStems = Object.fromEntries(
    positions.map((position) => [
      position,
      (pillars[position]?.hiddenStems ?? []).map((stem) => compactHiddenStem(dayStem, stem)),
    ]),
  ) as CompactSajuAnalysis["hiddenStems"];
  const byStem = Object.fromEntries(positions.map((position) => [position, pillars[position]?.tenGod ?? null])) as CompactSajuAnalysis["tenGods"]["byStem"];
  const counts = countItems([
    ...Object.values(byStem),
    ...positions.flatMap((position) => hiddenStems[position].map((stem) => stem.tenGod)),
  ]);
  const stems = Object.fromEntries(positions.map((position) => [position, pillars[position]?.stem.hanja ?? null])) as Record<Position, string | null>;
  const branches = Object.fromEntries(positions.map((position) => [position, pillars[position]?.branch.hanja ?? null])) as Record<Position, string | null>;
  const fiveElements = elementBalance(manseResult.natalChart.fiveElementsDistribution);
  const dayMasterRoots = buildDayMasterRoots(dayStem, pillars);
  const seasonalContext = buildSeasonalContext(dayStem, pillars.month.branch, dayMasterRoots, fiveElements.counts);
  const relations = {
    heavenlyStemCombinations: buildRelations(stems, heavenlyStemCombinations),
    earthlyBranchCombinations: buildRelations(branches, branchCombinations),
    clashes: [...buildRelations(stems, clashes), ...buildRelations(branches, clashes)],
    punishments: buildRelations(branches, punishments),
    harms: buildRelations(branches, harms),
    destructions: buildRelations(branches, destructions),
  };
  const usefulCandidates = [
    ...fiveElements.balance.missing.map((element) => candidate(`USEFUL_MISSING_${element}`, element, 0.72, [`fiveElements.counts.${element}`], { count: 0 })),
    ...fiveElements.weakest.map((element) => candidate(`USEFUL_WEAK_${element}`, element, 0.55, [`fiveElements.counts.${element}`], { count: fiveElements.balance.min })),
  ];
  const signals = buildFeatureSignals({
    byStem,
    counts,
    fiveElements,
    hiddenStems,
    relations,
    gender: manseResult.input.gender,
  });

  return {
    version: "1.0.0",
    inputMeta: {
      name: manseResult.input.name || null,
      gender: manseResult.input.gender,
      birthDate: manseResult.input.birthDate,
      birthTime: manseResult.input.birthTime,
      calendarType: manseResult.input.calendarType,
      isLeapMonth: manseResult.input.isLeapMonth,
      birthplace: manseResult.input.birthPlace.name,
      unknownTime: manseResult.input.unknownTime,
    },
    pillars: {
      year: compactPillar(pillars.year) as BlindCompilerPillar,
      month: compactPillar(pillars.month) as BlindCompilerPillar,
      day: compactPillar(pillars.day) as BlindCompilerPillar,
      hour: compactPillar(pillars.hour),
    },
    dayMaster: {
      stem: dayStem.hanja,
      stemKo: dayStem.hangul,
      element: dayStem.element,
      yinYang: dayStem.yinYang,
    },
    fiveElements,
    tenGods: {
      byStem,
      byBranchHidden: hiddenStems,
      counts,
    },
    hiddenStems,
    relations,
    roots: {
      dayMasterRoots,
      tenGodRoots: Object.fromEntries(
        Object.entries(counts).map(([tenGod]) => [
          tenGod,
          positions.filter((position) => hiddenStems[position].some((stem) => stem.tenGod === tenGod)),
        ]),
      ),
    },
    seasonalContext,
    candidates: {
      strengthCandidates: [
        candidate(
          `STRENGTH_${seasonalContext.dayMasterSeasonalSupport.candidate.toUpperCase()}`,
          seasonalContext.dayMasterSeasonalSupport.candidate,
          seasonalContext.dayMasterSeasonalSupport.supportScore - seasonalContext.dayMasterSeasonalSupport.drainScore,
          ["seasonalContext", "roots.dayMasterRoots", "fiveElements.counts"],
        ),
      ],
      structureCandidates: structureCandidates(counts),
      usefulGodCandidates: usefulCandidates,
      unfavorableGodCandidates: fiveElements.strongest.map((element) =>
        candidate(`UNFAVORABLE_STRONG_${element}`, element, 0.58 + fiveElements.balance.spread * 0.05, [`fiveElements.counts.${element}`], {
          count: fiveElements.balance.max,
        }),
      ),
    },
    signals,
    evidenceSummary: buildEvidenceSummary(signals),
  };
}
