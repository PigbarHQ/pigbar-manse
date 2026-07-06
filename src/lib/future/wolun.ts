import { BRANCHES, STEMS } from "@/src/lib/manse/constants";
import type { CompactSajuAnalysis } from "@/src/lib/blind";
import { compileYearGanji } from "./saeun";
import type { FutureMonthPillar } from "./types";

const monthBranches = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];

function firstMonthStemIndex(yearStem: string) {
  if (["甲", "己"].includes(yearStem)) return 2;
  if (["乙", "庚"].includes(yearStem)) return 4;
  if (["丙", "辛"].includes(yearStem)) return 6;
  if (["丁", "壬"].includes(yearStem)) return 8;
  return 0;
}

export function compileMonthlyGanji(blind: CompactSajuAnalysis, targetYear: number): FutureMonthPillar[] {
  const year = compileYearGanji(blind, targetYear);
  const firstStem = firstMonthStemIndex(year.gan);

  return monthBranches.map((branchHanja, index) => {
    const stem = STEMS[(firstStem + index) % 10];
    const branch = BRANCHES.find((item) => item.hanja === branchHanja) ?? BRANCHES[0];
    const pillar = compileYearGanji(blind, 1984 + ((firstStem + index) % 60));

    return {
      month: index + 1,
      ganji: `${stem.hangul}${branch.hangul}`,
      ganjiHanja: `${stem.hanja}${branch.hanja}`,
      gan: stem.hanja,
      ji: branch.hanja,
      ganKo: stem.hangul,
      jiKo: branch.hangul,
      tenGod: pillar.tenGod,
    };
  });
}
