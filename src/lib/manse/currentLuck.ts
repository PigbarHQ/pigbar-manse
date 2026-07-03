import { calculateSaju } from "@fullstackfamily/manseryeok";
import { DateTime } from "luxon";
import { toPillarInfo } from "./pillarCalculator";
import type { Luck, LuckPillar, ManseInput, NatalChart, Warning } from "./types";
import { buildCanonicalDaewoonResult } from "./daewoon";

function asLuckPillar(
  hangul: string,
  hanja: string,
  natalChart: NatalChart,
): LuckPillar {
  return toPillarInfo(hangul, hanja, natalChart.pillars.day.stem);
}

export function calculateCurrentLuck(
  input: Required<ManseInput>,
  natalChart: NatalChart,
  birthForLuck: DateTime,
  warnings: Warning[],
): Luck {
  const current = DateTime.fromISO(input.currentDateTime, { setZone: true }).setZone("Asia/Seoul");
  const canonicalDaewoon = buildCanonicalDaewoonResult(
    input,
    natalChart,
    birthForLuck,
    current,
    warnings,
  );
  const currentSaju = calculateSaju(
    current.year,
    current.month,
    current.day,
    current.hour,
    current.minute,
    { applyTimeCorrection: false },
  );

  return {
    daewoonStart: canonicalDaewoon.start,
    direction: canonicalDaewoon.direction,
    daewoonList: canonicalDaewoon.cycles,
    currentDaewoon: canonicalDaewoon.current,
    canonicalDaewoon,
    currentSewoon: asLuckPillar(
      currentSaju.yearPillar,
      currentSaju.yearPillarHanja,
      natalChart,
    ),
    currentWolwoon: asLuckPillar(
      currentSaju.monthPillar,
      currentSaju.monthPillarHanja,
      natalChart,
    ),
    currentIljin: asLuckPillar(
      currentSaju.dayPillar,
      currentSaju.dayPillarHanja,
      natalChart,
    ),
    currentTimePillar:
      currentSaju.hourPillar && currentSaju.hourPillarHanja
        ? asLuckPillar(currentSaju.hourPillar, currentSaju.hourPillarHanja, natalChart)
        : null,
  };
}
