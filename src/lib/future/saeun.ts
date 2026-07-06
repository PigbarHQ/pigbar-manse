import { BRANCHES, STEMS } from "@/src/lib/manse/constants";
import type { CompactSajuAnalysis } from "@/src/lib/blind";
import type { FuturePillar } from "./types";

function cycleIndexForYear(year: number) {
  return ((year - 1984) % 60 + 60) % 60;
}

function tenGodForStem(blind: CompactSajuAnalysis, stemHanja: string) {
  const dayElement = blind.dayMaster.element;
  const dayPolarity = blind.dayMaster.yinYang;
  const target = STEMS.find((stem) => stem.hanja === stemHanja) ?? STEMS[0];
  const samePolarity = dayPolarity === target.yinYang;
  const generates: Record<string, string> = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };
  const controls: Record<string, string> = { wood: "earth", fire: "metal", earth: "water", metal: "wood", water: "fire" };

  if (dayElement === target.element) return samePolarity ? "비견" : "겁재";
  if (generates[dayElement] === target.element) return samePolarity ? "식신" : "상관";
  if (controls[dayElement] === target.element) return samePolarity ? "편재" : "정재";
  if (controls[target.element] === dayElement) return samePolarity ? "편관" : "정관";
  return samePolarity ? "편인" : "정인";
}

export function compileYearGanji(blind: CompactSajuAnalysis, year: number): FuturePillar {
  const index = cycleIndexForYear(year);
  const stem = STEMS[index % 10];
  const branch = BRANCHES[index % 12];

  return {
    ganji: `${stem.hangul}${branch.hangul}`,
    ganjiHanja: `${stem.hanja}${branch.hanja}`,
    gan: stem.hanja,
    ji: branch.hanja,
    ganKo: stem.hangul,
    jiKo: branch.hangul,
    tenGod: tenGodForStem(blind, stem.hanja),
  };
}
