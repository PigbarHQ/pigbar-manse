import { convertCalendar } from "./calendarConversion";
import { getBirthDateTime, getLocalMeanDateTime, getTimeCorrection } from "./localMeanTime";
import { calculateCurrentLuck } from "./currentLuck";
import { calculateNatalChart, pillarInfoToSajuPillar } from "./pillarCalculator";
import { assertValidManseInput, normalizeManseInput } from "./validators";
import type {
  CurrentLuckSummary,
  Luck,
  ManseInput,
  ManseResult,
  NatalChart,
  SajuOutput,
  Warning,
} from "./types";

export * from "./types";
export { CITY_OPTIONS } from "./constants";
export { calculateLocalMeanTimeOffsetMinutes } from "./localMeanTime";

function buildSajuOutput(natalChart: NatalChart): SajuOutput {
  return {
    year: pillarInfoToSajuPillar(natalChart.pillars.year),
    month: pillarInfoToSajuPillar(natalChart.pillars.month),
    day: pillarInfoToSajuPillar(natalChart.pillars.day),
    hour: natalChart.pillars.hour ? pillarInfoToSajuPillar(natalChart.pillars.hour) : null,
  };
}

function buildCurrentLuckSummary(luck: Luck): CurrentLuckSummary {
  return {
    daeun: luck.currentDaewoon ? pillarInfoToSajuPillar(luck.currentDaewoon) : null,
    year: pillarInfoToSajuPillar(luck.currentSewoon),
    month: pillarInfoToSajuPillar(luck.currentWolwoon),
    day: pillarInfoToSajuPillar(luck.currentIljin),
    hour: luck.currentTimePillar ? pillarInfoToSajuPillar(luck.currentTimePillar) : null,
  };
}

function dedupeWarnings(warnings: Warning[]) {
  return Array.from(new Map(warnings.map((warning) => [warning.type, warning])).values());
}

export function calculateManse(rawInput: ManseInput): ManseResult {
  const input = assertValidManseInput(rawInput);
  const warnings: Warning[] = [];
  const calendarConversion = convertCalendar(input);
  const calculationInput = {
    ...input,
    birthDate: calendarConversion.solarDate,
    calendarType: "solar" as const,
    isLeapMonth: calendarConversion.isLeapMonth,
  };
  const timeCorrection = getTimeCorrection(calculationInput);

  if (!calendarConversion.verifiedByKoreanLunarCalendar) {
    warnings.push({
      type: "CALENDAR_CONVERSION_VERIFICATION_FAILED",
      message: "korean-lunar-calendar 보조 검증과 변환 결과가 일치하지 않습니다.",
      affectedFields: ["calendarType", "birthDate", "isLeapMonth"],
    });
  }

  if (input.calendarType === "lunar") {
    warnings.push({
      type: "LUNAR_INPUT_CONVERTED",
      message: "음력 입력은 한국 음력 변환 후 양력 기준으로 명조를 계산했습니다.",
      affectedFields: ["calendarType", "isLeapMonth", "birthDate"],
    });
  }

  if (input.unknownTime) {
    warnings.push({
      type: "UNKNOWN_TIME_USED",
      message: "태어난 시간을 모르는 입력이므로 시주와 시주 의존 해석의 신뢰도를 낮춥니다.",
      affectedFields: ["birthTime", "hourPillar"],
    });
  }

  const natalChart = calculateNatalChart(calculationInput, warnings);
  const birthForLuck =
    input.birthTime === null || !input.useLocalMeanTime
      ? getBirthDateTime(calculationInput)
      : getLocalMeanDateTime(calculationInput);
  const luck = calculateCurrentLuck(input, natalChart, birthForLuck, warnings);
  const uniqueWarnings = dedupeWarnings(warnings);
  const saju = buildSajuOutput(natalChart);
  const daeun = luck.canonicalDaewoon;
  const currentLuck = buildCurrentLuckSummary(luck);
  const confidence = {
    overall: input.unknownTime ? ("medium" as const) : ("high" as const),
    hourPillar: input.unknownTime ? ("low" as const) : ("high" as const),
    reason: input.unknownTime ? "태어난 시간이 없어 시주 및 시주 의존 항목을 제한했습니다." : null,
  };
  const blueprintInput = {
    confirmedPillars: natalChart.pillars,
    confidence,
    structureOnlyData: {
      fiveElementsDistribution: natalChart.fiveElementsDistribution,
      tenGods: natalChart.tenGods,
      hiddenStems: natalChart.hiddenStems,
      twelveStages: natalChart.twelveStages,
      luck: {
        direction: luck.direction,
        daeun,
        currentSewoon: luck.currentSewoon,
        currentWolwoon: luck.currentWolwoon,
        currentIljin: luck.currentIljin,
        currentTimePillar: input.unknownTime ? null : luck.currentTimePillar,
      },
    },
  };

  return {
    input: normalizeManseInput(rawInput),
    timeCorrection,
    calendarConversion,
    saju,
    natalChart,
    tenGods: natalChart.tenGods,
    twelveStages: natalChart.twelveStages,
    daeun,
    currentLuck,
    luck,
    warnings: uniqueWarnings,
    display: {
      saju,
      daeun,
      currentLuck,
      warnings: uniqueWarnings,
    },
    blueprintInput,
    analysisInput: blueprintInput,
    debug: {
      engine: "@fullstackfamily/manseryeok",
      solarTermEngine: daeun.solarTermEngine,
      lunarConversion: calendarConversion,
      timeCorrection,
      warnings: uniqueWarnings,
    },
  };
}
