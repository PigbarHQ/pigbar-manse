import { DateTime } from "luxon";
import { astronomyEngineSolarTermProvider } from "./astronomyEngine";
import { astronomicalSolarTermProvider } from "./astronomical";
import { approximateSolarTermProvider } from "./approximate";
import { KASI_SOLAR_TERM_FIXTURES } from "./fixtures";
import { manseryeokSolarTermProvider } from "./manseryeok";
import type { SolarTerm, SolarTermProvider, SolarTermResult } from "./types";

export type SolarTermComparison = {
  year: number;
  name: string;
  longitude: number;
  astronomicalLocalDateTime: string;
  referenceLocalDateTime: string;
  differenceMinutes: number;
};

export type SolarTermValidationReport = {
  count: number;
  averageDifferenceMinutes: number;
  medianDifferenceMinutes: number;
  maxDifferenceMinutes: number;
  withinOneMinuteRatio: number;
  withinFiveMinutesRatio: number;
  overTenMinuteItems: SolarTermComparison[];
  maxDifferenceItem: SolarTermComparison | null;
};

export type ProviderPairComparison = {
  year: number;
  name: string;
  longitude: number;
  leftProvider: string;
  rightProvider: string;
  leftUtcDateTime: string;
  leftLocalDateTime: string;
  rightUtcDateTime: string;
  rightLocalDateTime: string;
  differenceMinutes: number;
};

export type ProviderPairStats = {
  pair: string;
  count: number;
  averageDifferenceMinutes: number;
  medianDifferenceMinutes: number;
  maxDifferenceMinutes: number;
  withinOneMinuteRatio: number;
  withinFiveMinutesRatio: number;
  overTenMinuteCount: number;
  maxDifferenceItem: ProviderPairComparison | null;
};

export type ThreeWaySolarTermValidationReport = {
  startYear: number;
  endYear: number;
  timezone: string;
  countPerPair: number;
  astronomyEngineVsMeeus: ProviderPairStats;
  astronomyEngineVsManseryeok: ProviderPairStats;
  meeusVsManseryeok: ProviderPairStats;
};

export type SingleSolarTermComparisonReport = {
  year: number;
  name: string;
  longitude: number;
  timezone: string;
  astronomyEngine: SolarTerm;
  meeus: SolarTerm;
  manseryeok: SolarTerm;
  pairwise: {
    astronomyEngineVsMeeusMinutes: number;
    astronomyEngineVsManseryeokMinutes: number;
    meeusVsManseryeokMinutes: number;
  };
};

export type KasiProviderComparison = {
  year: number;
  termName: string;
  longitude: number;
  provider: string;
  providerUtcDateTime: string;
  providerKstDateTime: string;
  expectedKst: string;
  differenceSeconds: number;
  differenceMinutes: number;
};

export type KasiProviderStats = {
  provider: string;
  fixtureCount: number;
  averageDifferenceSeconds: number;
  medianDifferenceSeconds: number;
  maxDifferenceSeconds: number;
  averageDifferenceMinutes: number;
  medianDifferenceMinutes: number;
  maxDifferenceMinutes: number;
  withinOneMinuteRatio: number;
  withinTwoMinutesRatio: number;
  overTwoMinuteItems: KasiProviderComparison[];
  maxDifferenceItem: KasiProviderComparison | null;
};

export type KasiValidationReport = {
  fixtureCount: number;
  astronomyEngine: KasiProviderStats;
  meeus: KasiProviderStats;
};

function differenceMinutes(a: string, b: string) {
  const left = DateTime.fromISO(a, { setZone: true });
  const right = DateTime.fromISO(b, { setZone: true });
  return Math.abs(left.diff(right, "minutes").minutes);
}

function differenceSeconds(a: string, b: string) {
  const left = DateTime.fromISO(a, { setZone: true });
  const right = DateTime.fromISO(b, { setZone: true });
  return Math.abs(left.diff(right, "seconds").seconds);
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function getTerm(result: SolarTermResult, name: string) {
  const term = result.terms.find((item) => item.name === name);
  if (!term) {
    throw new Error(`Missing ${name} in ${result.source} ${result.year}`);
  }

  return term;
}

function compareTerms(
  year: number,
  leftProvider: string,
  left: SolarTerm,
  rightProvider: string,
  right: SolarTerm,
): ProviderPairComparison {
  return {
    year,
    name: left.name,
    longitude: left.longitude,
    leftProvider,
    rightProvider,
    leftUtcDateTime: left.utcDateTime,
    leftLocalDateTime: left.localDateTime,
    rightUtcDateTime: right.utcDateTime,
    rightLocalDateTime: right.localDateTime,
    differenceMinutes: differenceMinutes(left.localDateTime, right.localDateTime),
  };
}

function summarizePair(pair: string, comparisons: ProviderPairComparison[]): ProviderPairStats {
  const differences = comparisons.map((item) => item.differenceMinutes);
  const total = differences.reduce((sum, value) => sum + value, 0);
  const maxDifferenceMinutes = Math.max(...differences);
  const maxDifferenceItem =
    comparisons.find((item) => item.differenceMinutes === maxDifferenceMinutes) ?? null;

  return {
    pair,
    count: comparisons.length,
    averageDifferenceMinutes: total / comparisons.length,
    medianDifferenceMinutes: median(differences),
    maxDifferenceMinutes,
    withinOneMinuteRatio:
      comparisons.filter((item) => item.differenceMinutes <= 1).length / comparisons.length,
    withinFiveMinutesRatio:
      comparisons.filter((item) => item.differenceMinutes <= 5).length / comparisons.length,
    overTenMinuteCount: comparisons.filter((item) => item.differenceMinutes > 10).length,
    maxDifferenceItem,
  };
}

function summarizeKasiProvider(
  provider: string,
  comparisons: KasiProviderComparison[],
): KasiProviderStats {
  const seconds = comparisons.map((item) => item.differenceSeconds);
  const minutes = comparisons.map((item) => item.differenceMinutes);
  const totalSeconds = seconds.reduce((sum, value) => sum + value, 0);
  const maxDifferenceSeconds = Math.max(...seconds);
  const maxDifferenceItem =
    comparisons.find((item) => item.differenceSeconds === maxDifferenceSeconds) ?? null;

  return {
    provider,
    fixtureCount: comparisons.length,
    averageDifferenceSeconds: totalSeconds / comparisons.length,
    medianDifferenceSeconds: median(seconds),
    maxDifferenceSeconds,
    averageDifferenceMinutes: totalSeconds / comparisons.length / 60,
    medianDifferenceMinutes: median(minutes),
    maxDifferenceMinutes: maxDifferenceSeconds / 60,
    withinOneMinuteRatio:
      comparisons.filter((item) => item.differenceSeconds <= 60).length / comparisons.length,
    withinTwoMinutesRatio:
      comparisons.filter((item) => item.differenceSeconds <= 120).length / comparisons.length,
    overTwoMinuteItems: comparisons.filter((item) => item.differenceSeconds > 120),
    maxDifferenceItem,
  };
}

function compareProviderWithKasi(
  providerName: string,
  provider: SolarTermProvider,
): KasiProviderComparison[] {
  const cache = new Map<number, SolarTermResult>();

  return KASI_SOLAR_TERM_FIXTURES.map((fixture) => {
    const result =
      cache.get(fixture.year) ?? provider.getTermsByYear(fixture.year, "Asia/Seoul");
    cache.set(fixture.year, result);

    const term = getTerm(result, fixture.termName);
    const differenceSecondsValue = differenceSeconds(term.localDateTime, fixture.expectedKst);

    return {
      year: fixture.year,
      termName: fixture.termName,
      longitude: fixture.longitude,
      provider: providerName,
      providerUtcDateTime: term.utcDateTime,
      providerKstDateTime: term.localDateTime,
      expectedKst: fixture.expectedKst,
      differenceSeconds: differenceSecondsValue,
      differenceMinutes: differenceSecondsValue / 60,
    };
  });
}

export function compareKasiFixtures(): KasiValidationReport {
  const astronomyEngine = compareProviderWithKasi(
    "Astronomy Engine",
    astronomyEngineSolarTermProvider,
  );
  const meeus = compareProviderWithKasi("Meeus", astronomicalSolarTermProvider);

  return {
    fixtureCount: KASI_SOLAR_TERM_FIXTURES.length,
    astronomyEngine: summarizeKasiProvider("Astronomy Engine", astronomyEngine),
    meeus: summarizeKasiProvider("Meeus", meeus),
  };
}

function getYearTerms(provider: SolarTermProvider, year: number, timezone: string) {
  return provider.getTermsByYear(year, timezone);
}

export function compare2020Ipchun(timezone = "Asia/Seoul"): SingleSolarTermComparisonReport {
  const year = 2020;
  const name = "입춘";
  const astronomyEngine = getTerm(
    getYearTerms(astronomyEngineSolarTermProvider, year, timezone),
    name,
  );
  const meeus = getTerm(getYearTerms(astronomicalSolarTermProvider, year, timezone), name);
  const manseryeok = getTerm(getYearTerms(manseryeokSolarTermProvider, year, timezone), name);

  return {
    year,
    name,
    longitude: astronomyEngine.longitude,
    timezone,
    astronomyEngine,
    meeus,
    manseryeok,
    pairwise: {
      astronomyEngineVsMeeusMinutes: differenceMinutes(
        astronomyEngine.localDateTime,
        meeus.localDateTime,
      ),
      astronomyEngineVsManseryeokMinutes: differenceMinutes(
        astronomyEngine.localDateTime,
        manseryeok.localDateTime,
      ),
      meeusVsManseryeokMinutes: differenceMinutes(meeus.localDateTime, manseryeok.localDateTime),
    },
  };
}

export function compareThreeSolarTermProviders(
  startYear = 2020,
  endYear = 2030,
  timezone = "Asia/Seoul",
): ThreeWaySolarTermValidationReport {
  const aeVsMeeus: ProviderPairComparison[] = [];
  const aeVsManseryeok: ProviderPairComparison[] = [];
  const meeusVsManseryeok: ProviderPairComparison[] = [];

  for (let year = startYear; year <= endYear; year += 1) {
    const astronomyEngine = astronomyEngineSolarTermProvider.getTermsByYear(year, timezone);
    const meeus = astronomicalSolarTermProvider.getTermsByYear(year, timezone);
    const manseryeok = manseryeokSolarTermProvider.getTermsByYear(year, timezone);

    astronomyEngine.terms.forEach((term) => {
      const meeusTerm = getTerm(meeus, term.name);
      const manseryeokTerm = getTerm(manseryeok, term.name);

      aeVsMeeus.push(
        compareTerms(year, "Astronomy Engine", term, "Meeus", meeusTerm),
      );
      aeVsManseryeok.push(
        compareTerms(year, "Astronomy Engine", term, "manseryeok", manseryeokTerm),
      );
      meeusVsManseryeok.push(
        compareTerms(year, "Meeus", meeusTerm, "manseryeok", manseryeokTerm),
      );
    });
  }

  return {
    startYear,
    endYear,
    timezone,
    countPerPair: aeVsMeeus.length,
    astronomyEngineVsMeeus: summarizePair("Astronomy Engine vs Meeus", aeVsMeeus),
    astronomyEngineVsManseryeok: summarizePair("Astronomy Engine vs manseryeok", aeVsManseryeok),
    meeusVsManseryeok: summarizePair("Meeus vs manseryeok", meeusVsManseryeok),
  };
}

export function compareAstronomicalWithManseryeok(
  startYear = 2020,
  endYear = 2030,
  timezone = "Asia/Seoul",
): SolarTermValidationReport {
  const comparisons: SolarTermComparison[] = [];

  for (let year = startYear; year <= endYear; year += 1) {
    const astronomical = astronomicalSolarTermProvider.getTermsByYear(year, timezone);
    const reference = manseryeokSolarTermProvider.getTermsByYear(year, timezone);

    astronomical.terms.forEach((term) => {
      const referenceTerm = reference.terms.find((item) => item.name === term.name);
      if (!referenceTerm) {
        throw new Error(`Missing reference term ${term.name} ${year}`);
      }

      comparisons.push({
        year,
        name: term.name,
        longitude: term.longitude,
        astronomicalLocalDateTime: term.localDateTime,
        referenceLocalDateTime: referenceTerm.localDateTime,
        differenceMinutes: differenceMinutes(term.localDateTime, referenceTerm.localDateTime),
      });
    });
  }

  const differences = comparisons.map((item) => item.differenceMinutes);
  const total = differences.reduce((sum, value) => sum + value, 0);
  const maxDifferenceMinutes = Math.max(...differences);
  const maxDifferenceItem =
    comparisons.find((item) => item.differenceMinutes === maxDifferenceMinutes) ?? null;

  return {
    count: comparisons.length,
    averageDifferenceMinutes: total / comparisons.length,
    medianDifferenceMinutes: median(differences),
    maxDifferenceMinutes,
    withinOneMinuteRatio:
      comparisons.filter((item) => item.differenceMinutes <= 1).length / comparisons.length,
    withinFiveMinutesRatio:
      comparisons.filter((item) => item.differenceMinutes <= 5).length / comparisons.length,
    overTenMinuteItems: comparisons.filter((item) => item.differenceMinutes > 10),
    maxDifferenceItem,
  };
}

export function get1974DaewoonSolarTermSample(timezone = "Asia/Seoul") {
  const birth = DateTime.fromISO("1974-07-30T03:17:54.720+09:00", { setZone: true });
  const astronomyEngine = astronomyEngineSolarTermProvider.getTermsByYear(1974, timezone);
  const astronomical = astronomicalSolarTermProvider.getTermsByYear(1974, timezone);
  const approximate = approximateSolarTermProvider.getTermsByYear(1974, timezone);
  const nextAstronomyEngine = astronomyEngine.terms
    .map((term) => ({ ...term, dt: DateTime.fromISO(term.localDateTime, { setZone: true }) }))
    .find((term) => term.dt > birth);
  const nextAstronomical = astronomical.terms
    .map((term) => ({ ...term, dt: DateTime.fromISO(term.localDateTime, { setZone: true }) }))
    .find((term) => term.dt > birth);
  const nextApproximate = approximate.terms
    .map((term) => ({ ...term, dt: DateTime.fromISO(term.localDateTime, { setZone: true }) }))
    .find((term) => term.dt > birth);

  if (!nextAstronomyEngine || !nextAstronomical || !nextApproximate) {
    throw new Error("Unable to find next solar term for 1974 sample");
  }

  function convertTermDifference(term: { dt: DateTime }) {
    const raw = term.dt.diff(birth, ["days", "hours", "minutes"]).toObject();
    const totalHours = term.dt.diff(birth, "hours").hours;
    const totalDays = term.dt.diff(birth, "days").days;
    const convertedTotalDays = totalDays * 120;
    const years = Math.floor(convertedTotalDays / 360);
    const remainingAfterYears = convertedTotalDays - years * 360;
    const months = Math.floor(remainingAfterYears / 30);
    const days = Math.round(remainingAfterYears - months * 30);
    const firstDaewoonStart = birth.plus({ years, months, days });

    return {
      rawTermDifference: {
        days: Math.trunc(raw.days ?? 0),
        hours: Math.trunc(raw.hours ?? 0),
        minutes: Math.round(raw.minutes ?? 0),
        totalHours,
        totalDays,
      },
      traditionalConversion: {
        rule: "3 days = 1 year",
        years,
        months,
        days,
      },
      displayDaewoonAge: years + (months > 0 || days > 0 ? 1 : 0),
      firstDaewoonStartDateTime: firstDaewoonStart.toISO({ suppressMilliseconds: true }),
    };
  }

  const astronomyEngineStart = convertTermDifference(nextAstronomyEngine);
  const meeusStart = convertTermDifference(nextAstronomical);
  const approximateStart = convertTermDifference(nextApproximate);

  return {
    birthDateTime: birth.toISO({ suppressMilliseconds: true }),
    nextAstronomyEngineTerm: {
      name: nextAstronomyEngine.name,
      longitude: nextAstronomyEngine.longitude,
      utcDateTime: nextAstronomyEngine.utcDateTime,
      localDateTime: nextAstronomyEngine.localDateTime,
    },
    nextAstronomicalTerm: {
      name: nextAstronomical.name,
      longitude: nextAstronomical.longitude,
      utcDateTime: nextAstronomical.utcDateTime,
      localDateTime: nextAstronomical.localDateTime,
    },
    nextApproximateTerm: {
      name: nextApproximate.name,
      longitude: nextApproximate.longitude,
      utcDateTime: nextApproximate.utcDateTime,
      localDateTime: nextApproximate.localDateTime,
    },
    astronomicalMinusApproximateMinutes: differenceMinutes(
      nextAstronomical.localDateTime,
      nextApproximate.localDateTime,
    ),
    astronomyEngineMinusAstronomicalMinutes: differenceMinutes(
      nextAstronomyEngine.localDateTime,
      nextAstronomical.localDateTime,
    ),
    astronomyEngineMinusApproximateMinutes: differenceMinutes(
      nextAstronomyEngine.localDateTime,
      nextApproximate.localDateTime,
    ),
    rawTermDifference: astronomyEngineStart.rawTermDifference,
    traditionalConversion: astronomyEngineStart.traditionalConversion,
    convertedStartAge: {
      years: astronomyEngineStart.traditionalConversion.years,
      months: astronomyEngineStart.traditionalConversion.months,
      days: astronomyEngineStart.traditionalConversion.days,
    },
    displayAge: astronomyEngineStart.displayDaewoonAge,
    displayDaewoonAge: astronomyEngineStart.displayDaewoonAge,
    firstDaewoonStartDateTime: astronomyEngineStart.firstDaewoonStartDateTime,
    providerDaewoonStarts: {
      astronomyEngine: astronomyEngineStart,
      meeus: meeusStart,
      approximate: approximateStart,
    },
    precision: "astronomy-engine",
    source: "astronomy-engine-solar-term",
  };
}
