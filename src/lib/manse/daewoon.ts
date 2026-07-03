import { DateTime } from "luxon";
import { getCanonicalSolarTerms } from "../solarTerms";
import { BRANCHES, STEMS } from "./constants";
import { toPillarInfo } from "./pillarCalculator";
import type {
  CanonicalDaewoonResult,
  DaewoonCycle,
  DaewoonDirection,
  DaewoonStart,
  ManseInput,
  NatalChart,
  PillarInfo,
  Warning,
} from "./types";

function getPillarIndex(pillar: PillarInfo) {
  const stemIndex = STEMS.findIndex((stem) => stem.hanja === pillar.stem.hanja);
  const branchIndex = BRANCHES.findIndex((branch) => branch.hanja === pillar.branch.hanja);

  for (let index = 0; index < 60; index += 1) {
    if (index % 10 === stemIndex && index % 12 === branchIndex) {
      return index;
    }
  }

  return 0;
}

export function getDaewoonDirection(
  gender: ManseInput["gender"],
  yearPillar: PillarInfo,
): DaewoonDirection {
  const isYangYear = yearPillar.stem.yinYang === "yang";
  if ((isYangYear && gender === "male") || (!isYangYear && gender === "female")) {
    return "forward";
  }

  return "backward";
}

function getTermDateTimes(year: number, warnings: Warning[]) {
  const result = getCanonicalSolarTerms(year, "Asia/Seoul");

  result.warnings.forEach((warning) => {
    warnings.push({
      type: warning.type,
      message: warning.message,
      affectedFields: ["daewoonStart"],
    });
  });

  return {
    result,
    terms: result.terms.map((term) => ({
      term,
      dateTime: DateTime.fromISO(term.dateTime, { setZone: true }),
    })),
  };
}

function getNearestTermDiffDays(
  birth: DateTime,
  direction: DaewoonDirection,
  warnings: Warning[],
) {
  const termGroups = [
    getTermDateTimes(birth.year - 1, warnings),
    getTermDateTimes(birth.year, warnings),
    getTermDateTimes(birth.year + 1, warnings),
  ];
  const terms = termGroups
    .flatMap((group) =>
      group.terms.map((item) => ({
        ...item,
        result: group.result,
      })),
    )
    .sort((a, b) => a.dateTime.toMillis() - b.dateTime.toMillis());
  const target =
    direction === "forward"
      ? terms.find((term) => term.dateTime > birth)
      : [...terms].reverse().find((term) => term.dateTime < birth);

  if (!target) {
    return {
      diffDays: 0,
      precision: "estimated" as const,
      source: "approximate-solar-term" as const,
      termUsed: null,
      solarTermEngine: null,
    };
  }

  const approximated = target.result.precision === "estimated";

  return {
    diffDays: Math.abs(target.dateTime.diff(birth, "days").days),
    precision: approximated ? ("estimated" as const) : ("exact" as const),
    source: approximated ? ("approximate-solar-term" as const) : ("solar-term" as const),
    termUsed: {
      name: target.term.name,
      dateTime: target.term.dateTime,
      utcDateTime: target.term.dateTimeUtc,
      provider: target.result.provider,
      precision: target.result.precision,
      source: target.result.source,
      fallbackUsed: target.result.fallbackUsed,
    },
    solarTermEngine: {
      provider: target.result.provider,
      version: target.result.providerVersion,
      precision: target.result.precision,
      source: target.result.source,
      fallbackUsed: target.result.fallbackUsed,
    },
  };
}

export function calculateDaewoonStart(
  birth: DateTime,
  direction: DaewoonDirection,
  warnings: Warning[],
): DaewoonStart {
  const nearestTerm = getNearestTermDiffDays(birth, direction, warnings);
  const diffDays = nearestTerm.diffDays;
  // 대운수 환산 기준: 3일 = 1년, 1일 = 4개월, 1시간 = 5일.
  const totalMonths = Math.round(diffDays * 4);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const age = years + (months > 0 ? 1 : 0);
  const days = Math.round(diffDays);

  return {
    age,
    years,
    months,
    days,
    ageYears: years,
    ageMonths: months,
    ageDays: days,
    precision: nearestTerm.precision,
    source: nearestTerm.source,
    termUsed: nearestTerm.termUsed,
    solarTermEngine: nearestTerm.solarTermEngine,
  };
}

export function buildCanonicalDaewoonResult(
  input: Required<ManseInput>,
  natalChart: NatalChart,
  birthForLuck: DateTime,
  currentDateTime: DateTime,
  warnings: Warning[],
): CanonicalDaewoonResult {
  const direction = getDaewoonDirection(input.gender, natalChart.pillars.year);
  const start = calculateDaewoonStart(birthForLuck, direction, warnings);
  const monthIndex = getPillarIndex(natalChart.pillars.month);
  const dayStem = natalChart.pillars.day.stem;
  const cycles: DaewoonCycle[] = [];
  const firstStart = birthForLuck.plus({
    years: start.years,
    months: start.months,
    days: start.days,
  });

  for (let step = 1; step <= 10; step += 1) {
    const index =
      direction === "forward"
        ? (monthIndex + step + 60) % 60
        : (monthIndex - step + 60) % 60;
    const stem = STEMS[index % 10];
    const branch = BRANCHES[index % 12];
    const pillar = toPillarInfo(
      `${stem.hangul}${branch.hangul}`,
      `${stem.hanja}${branch.hanja}`,
      dayStem,
    );
    const age = start.age + (step - 1) * 10;
    const startDateTime = firstStart.plus({ years: (step - 1) * 10 });
    const endDateTime = firstStart.plus({ years: step * 10 });

    cycles.push({
      ...pillar,
      index: step,
      age,
      startYear: startDateTime.year,
      endYear: endDateTime.year,
      startDateTime: startDateTime.toISO() ?? "",
      endDateTime: endDateTime.toISO() ?? "",
    });
  }

  const current =
    cycles.find((cycle) => {
      const startDateTime = DateTime.fromISO(cycle.startDateTime, { setZone: true });
      const endDateTime = DateTime.fromISO(cycle.endDateTime, { setZone: true });

      return currentDateTime >= startDateTime && currentDateTime < endDateTime;
    }) ?? null;

  return {
    direction,
    start,
    cycles,
    current,
    solarTermEngine: start.solarTermEngine,
  };
}
