import { SearchSunLongitude } from "astronomy-engine";
import { DateTime } from "luxon";
import { SOLAR_TERM_DEFINITIONS } from "./definitions";
import type { SolarTermDefinition, SolarTermProvider, SolarTermResult } from "./types";

const searchWindowDays = 10;

function searchStart(year: number, term: SolarTermDefinition) {
  return new Date(Date.UTC(year, term.approximateMonth - 1, term.approximateDay - 5, 0, 0, 0));
}

export class AstronomyEngineSolarTermProvider implements SolarTermProvider {
  getTermsByYear(year: number, timezone: string): SolarTermResult {
    const terms = SOLAR_TERM_DEFINITIONS.map((term) => {
      const found = SearchSunLongitude(term.longitude, searchStart(year, term), searchWindowDays);
      if (!found) {
        throw new Error(`Astronomy Engine could not find ${term.name} ${year}`);
      }

      const utc = DateTime.fromJSDate(found.date, { zone: "utc" });
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
      precision: "astronomy-engine",
      source: "astronomy-engine@2.1.19 SearchSunLongitude",
      terms,
    };
  }
}

export const astronomyEngineSolarTermProvider = new AstronomyEngineSolarTermProvider();
