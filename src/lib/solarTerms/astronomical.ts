import { DateTime } from "luxon";
import { SOLAR_TERM_DEFINITIONS } from "./definitions";
import type { SolarTermDefinition, SolarTermProvider, SolarTermResult } from "./types";

const dayMs = 86_400_000;
const j2000 = 2_451_545;

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function signedAngularDifference(value: number, target: number) {
  return ((normalizeDegrees(value - target) + 540) % 360) - 180;
}

function julianDayFromUnixMs(ms: number) {
  return ms / dayMs + 2_440_587.5;
}

function apparentSolarLongitudeFromUnixMs(ms: number) {
  const jd = julianDayFromUnixMs(ms);
  const t = (jd - j2000) / 36_525;
  const l0 = normalizeDegrees(280.46646 + 36_000.76983 * t + 0.0003032 * t * t);
  const m = normalizeDegrees(357.52911 + 35_999.05029 * t - 0.0001537 * t * t);
  const omega = normalizeDegrees(125.04 - 1_934.136 * t);
  const mRad = (m * Math.PI) / 180;
  const omegaRad = (omega * Math.PI) / 180;
  const center =
    Math.sin(mRad) * (1.914602 - 0.004817 * t - 0.000014 * t * t) +
    Math.sin(2 * mRad) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * mRad) * 0.000289;

  return normalizeDegrees(l0 + center - 0.00569 - 0.00478 * Math.sin(omegaRad));
}

function bracketTerm(year: number, term: SolarTermDefinition) {
  const center = Date.UTC(year, term.approximateMonth - 1, term.approximateDay, 12);
  return {
    start: center - 5 * dayMs,
    end: center + 5 * dayMs,
  };
}

function findCrossingUnixMs(year: number, term: SolarTermDefinition) {
  const bracket = bracketTerm(year, term);
  let low = bracket.start;
  let high = bracket.end;
  let lowDiff = signedAngularDifference(apparentSolarLongitudeFromUnixMs(low), term.longitude);
  let highDiff = signedAngularDifference(apparentSolarLongitudeFromUnixMs(high), term.longitude);

  if (lowDiff > 0 || highDiff < 0) {
    const scanStep = 6 * 60 * 60 * 1000;
    let previous = bracket.start;
    let previousDiff = signedAngularDifference(
      apparentSolarLongitudeFromUnixMs(previous),
      term.longitude,
    );

    for (let cursor = previous + scanStep; cursor <= bracket.end; cursor += scanStep) {
      const cursorDiff = signedAngularDifference(
        apparentSolarLongitudeFromUnixMs(cursor),
        term.longitude,
      );

      if (previousDiff <= 0 && cursorDiff >= 0) {
        low = previous;
        high = cursor;
        lowDiff = previousDiff;
        highDiff = cursorDiff;
        break;
      }

      previous = cursor;
      previousDiff = cursorDiff;
    }
  }

  if (lowDiff > 0 || highDiff < 0) {
    throw new Error(`Unable to bracket ${term.name} ${year}`);
  }

  for (let index = 0; index < 60; index += 1) {
    const mid = (low + high) / 2;
    const midDiff = signedAngularDifference(
      apparentSolarLongitudeFromUnixMs(mid),
      term.longitude,
    );

    if (midDiff >= 0) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return high;
}

export class AstronomicalSolarTermProvider implements SolarTermProvider {
  getTermsByYear(year: number, timezone: string): SolarTermResult {
    const terms = SOLAR_TERM_DEFINITIONS.map((term) => {
      const unixMs = findCrossingUnixMs(year, term);
      const utc = DateTime.fromMillis(unixMs, { zone: "utc" });
      const local = utc.setZone(timezone);

      return {
        name: term.name,
        nameHanja: term.nameHanja,
        longitude: term.longitude,
        utcDateTime: utc.toISO({ suppressMilliseconds: true }) ?? "",
        localDateTime: local.toISO({ suppressMilliseconds: true }) ?? "",
      };
    });

    return {
      year,
      timezone,
      precision: "astronomical",
      source: "meeus-low-precision-apparent-solar-longitude",
      terms,
    };
  }
}

export const astronomicalSolarTermProvider = new AstronomicalSolarTermProvider();
