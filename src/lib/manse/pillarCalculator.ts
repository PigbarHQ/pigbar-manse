import { calculateSaju, calculateSajuSimple } from "@fullstackfamily/manseryeok";
import type { SajuResult } from "@fullstackfamily/manseryeok";
import { DateTime } from "luxon";
import { BRANCHES, ELEMENT_CONTROLS, ELEMENT_CREATES, ELEMENT_ORDER, STEMS } from "./constants";
import { convertCalendar } from "./calendarConversion";
import { getBirthDateTime } from "./localMeanTime";
import type {
  BranchInfo,
  ElementName,
  ManseInput,
  NatalChart,
  PillarInfo,
  SajuPillar,
  StemInfo,
  Warning,
} from "./types";

const twelveStageNames = [
  "장생",
  "목욕",
  "관대",
  "건록",
  "제왕",
  "쇠",
  "병",
  "사",
  "묘",
  "절",
  "태",
  "양",
];

function findStem(hanja: string, hangul: string): StemInfo {
  return (
    STEMS.find((stem) => stem.hanja === hanja || stem.hangul === hangul) ??
    STEMS[0]
  );
}

function findBranch(hanja: string, hangul: string): BranchInfo {
  return (
    BRANCHES.find((branch) => branch.hanja === hanja || branch.hangul === hangul) ??
    BRANCHES[0]
  );
}

export function getTenGod(dayStem: StemInfo, targetStem: StemInfo) {
  const samePolarity = dayStem.yinYang === targetStem.yinYang;

  if (dayStem.element === targetStem.element) {
    return samePolarity ? "비견" : "겁재";
  }
  if (ELEMENT_CREATES[dayStem.element] === targetStem.element) {
    return samePolarity ? "식신" : "상관";
  }
  if (ELEMENT_CONTROLS[dayStem.element] === targetStem.element) {
    return samePolarity ? "편재" : "정재";
  }
  if (ELEMENT_CONTROLS[targetStem.element] === dayStem.element) {
    return samePolarity ? "편관" : "정관";
  }

  return samePolarity ? "편인" : "정인";
}

function getTwelveStage(dayStem: StemInfo, branch: BranchInfo) {
  const stemIndex = STEMS.findIndex((stem) => stem.hanja === dayStem.hanja);
  const branchIndex = BRANCHES.findIndex((item) => item.hanja === branch.hanja);
  const offset = dayStem.yinYang === "yang" ? branchIndex - stemIndex : stemIndex - branchIndex;
  return twelveStageNames[(offset + 120) % 12];
}

export function toPillarInfo(
  hangul: string,
  hanja: string,
  dayStem: StemInfo,
): PillarInfo {
  const stem = findStem(hanja.slice(0, 1), hangul.slice(0, 1));
  const branch = findBranch(hanja.slice(1, 2), hangul.slice(1, 2));

  return {
    ganji: hangul,
    ganjiHanja: hanja,
    stem,
    branch,
    tenGod: getTenGod(dayStem, stem),
    element: stem.element,
    yinYang: stem.yinYang,
    hiddenStems: branch.hiddenStems,
    twelveStage: getTwelveStage(dayStem, branch),
  };
}

function getSolarDateTimeForCalculation(input: Required<ManseInput>, useLocalMeanTime: boolean) {
  const conversion = convertCalendar(input);
  const base = DateTime.fromISO(
    `${conversion.solarDate}T${input.birthTime ?? "12:00"}`,
    { zone: input.birthPlace.timezone },
  );

  return useLocalMeanTime && input.birthTime !== null
    ? base.plus({
        minutes: (input.birthPlace.longitude - 135) * 4,
      })
    : base;
}

function calculateSajuAt(input: Required<ManseInput>, useLocalMeanTime: boolean) {
  const dt = getSolarDateTimeForCalculation(input, useLocalMeanTime);

  if (input.birthTime === null) {
    return calculateSajuSimple(dt.year, dt.month, dt.day);
  }

  return useLocalMeanTime
    ? calculateSaju(dt.year, dt.month, dt.day, dt.hour, dt.minute, {
        longitude: 135,
        applyTimeCorrection: false,
      })
    : calculateSajuSimple(dt.year, dt.month, dt.day, dt.hour);
}

export function calculateSajuWithManseryeok(
  input: Required<ManseInput>,
  useLocalMeanTime = input.useLocalMeanTime,
) {
  return calculateSajuAt(input, useLocalMeanTime);
}

function getFiveElementsDistribution(pillars: Array<PillarInfo | null>) {
  const counts = Object.fromEntries(ELEMENT_ORDER.map((element) => [element, 0])) as Record<
    ElementName,
    number
  >;

  pillars.forEach((pillar) => {
    if (!pillar) return;
    counts[pillar.stem.element] += 1;
    counts[pillar.branch.element] += 1;
  });

  return counts;
}

function getTenGods(pillars: Array<PillarInfo | null>) {
  return Object.fromEntries(
    pillars
      .filter((pillar): pillar is PillarInfo => pillar !== null)
      .map((pillar) => [pillar.ganji, pillar.tenGod]),
  ) as Record<string, string | null>;
}

function buildNatalChartFromSaju(saju: SajuResult): NatalChart {
  const dayStem = findStem(
    saju.dayPillarHanja.slice(0, 1),
    saju.dayPillar.slice(0, 1),
  );
  const year = toPillarInfo(saju.yearPillar, saju.yearPillarHanja, dayStem);
  const month = toPillarInfo(saju.monthPillar, saju.monthPillarHanja, dayStem);
  const day = toPillarInfo(saju.dayPillar, saju.dayPillarHanja, dayStem);
  day.tenGod = "일간";
  const hour =
    saju.hourPillar && saju.hourPillarHanja
      ? toPillarInfo(saju.hourPillar, saju.hourPillarHanja, dayStem)
      : null;
  const list = [year, month, day, hour];

  return {
    yearPillar: year.ganji,
    monthPillar: month.ganji,
    dayPillar: day.ganji,
    hourPillar: hour?.ganji ?? null,
    pillars: { year, month, day, hour },
    fiveElementsDistribution: getFiveElementsDistribution(list),
    tenGods: getTenGods(list),
    hiddenStems: {
      year: year.hiddenStems,
      month: month.hiddenStems,
      day: day.hiddenStems,
      hour: hour?.hiddenStems ?? [],
    },
    twelveStages: {
      year: year.twelveStage,
      month: month.twelveStage,
      day: day.twelveStage,
      hour: hour?.twelveStage ?? null,
    },
  };
}

export function pillarInfoToSajuPillar(pillar: PillarInfo): SajuPillar {
  return {
    gan: pillar.stem.hanja,
    ji: pillar.branch.hanja,
    ganKo: pillar.stem.hangul,
    jiKo: pillar.branch.hangul,
  };
}

function calculateLateZiVariant(input: Required<ManseInput>) {
  if (input.birthTime === null) return null;
  const standard = getBirthDateTime(input);
  if (standard.hour !== 23) return null;

  const shifted = standard.plus({ days: 1 });
  const shiftedInput = {
    ...input,
    birthDate: shifted.toISODate() ?? input.birthDate,
  };

  return buildNatalChartFromSaju(calculateSajuAt(shiftedInput, input.useLocalMeanTime));
}

export function calculateNatalChart(input: Required<ManseInput>, warnings: Warning[]) {
  const corrected = buildNatalChartFromSaju(calculateSajuAt(input, input.useLocalMeanTime));
  const uncorrected = buildNatalChartFromSaju(calculateSajuAt(input, false));

  if (
    uncorrected.hourPillar !== corrected.hourPillar ||
    uncorrected.monthPillar !== corrected.monthPillar ||
    uncorrected.yearPillar !== corrected.yearPillar
  ) {
    warnings.push({
      type: "TIME_CORRECTION_CHANGED_PILLAR",
      message: "지역시 보정 전후 명조가 달라졌습니다.",
      affectedFields: ["hourPillar", "monthPillar", "yearPillar"],
    });
  }

  const lateZi = calculateLateZiVariant(input);
  if (
    lateZi &&
    (lateZi.dayPillar !== corrected.dayPillar ||
      lateZi.hourPillar !== corrected.hourPillar)
  ) {
    warnings.push({
      type: "ZI_HOUR_RULE_CHANGED_PILLAR",
      message: "자시 경계 기준에 따라 일주 또는 시주가 달라질 수 있습니다.",
      affectedFields: ["ziHourRule", "dayPillar", "hourPillar"],
    });
  }

  return corrected;
}
