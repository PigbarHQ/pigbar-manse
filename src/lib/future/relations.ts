import type { BlindCompilerPillar, BlindCompilerRelation, CompactSajuAnalysis } from "@/src/lib/blind";
import type { FuturePillar, FutureRelations } from "./types";

const positions = ["year", "month", "day", "hour"] as const;
type Position = (typeof positions)[number];

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

function buildRelations(source: Record<string, string | null>, target: string, targetPosition: string, definitions: Array<[string, string, string]>): BlindCompilerRelation[] {
  return Object.entries(source).flatMap(([position, value]) => {
    if (!value) return [];

    return definitions.flatMap(([left, right, name]) => {
      const matched = (value === left && target === right) || (value === right && target === left);
      return matched
        ? [{
            name,
            positions: [position, targetPosition],
            values: [value, target],
          }]
        : [];
    });
  });
}

function natalSource(pillars: CompactSajuAnalysis["pillars"], key: "gan" | "ji") {
  return Object.fromEntries(
    positions.map((position) => {
      const pillar = pillars[position] as BlindCompilerPillar | null;
      return [position, pillar?.[key] ?? null];
    }),
  ) as Record<Position, string | null>;
}

export function relationsAgainstNatal(blind: CompactSajuAnalysis, pillar: FuturePillar, targetPosition: string): FutureRelations {
  const natalStems = natalSource(blind.pillars, "gan");
  const natalBranches = natalSource(blind.pillars, "ji");

  return {
    heavenlyStemCombinations: buildRelations(natalStems, pillar.gan, targetPosition, heavenlyStemCombinations),
    earthlyBranchCombinations: buildRelations(natalBranches, pillar.ji, targetPosition, branchCombinations),
    clashes: [
      ...buildRelations(natalStems, pillar.gan, targetPosition, clashes),
      ...buildRelations(natalBranches, pillar.ji, targetPosition, clashes),
    ],
    punishments: buildRelations(natalBranches, pillar.ji, targetPosition, punishments),
    harms: buildRelations(natalBranches, pillar.ji, targetPosition, harms),
    destructions: buildRelations(natalBranches, pillar.ji, targetPosition, destructions),
  };
}

export function relationCount(relations: FutureRelations) {
  return relations.clashes.length + relations.punishments.length + relations.harms.length + relations.destructions.length;
}
