import { DateTime } from "luxon";
import { SOLAR_TERM_DEFINITIONS } from "./definitions";
import type { SolarTermProvider, SolarTermResult } from "./types";

export class ApproximateSolarTermProvider implements SolarTermProvider {
  getTermsByYear(year: number, timezone: string): SolarTermResult {
    const terms = SOLAR_TERM_DEFINITIONS.map((term) => {
      const local = DateTime.fromObject(
        {
          year,
          month: term.approximateMonth,
          day: term.approximateDay,
          hour: 0,
          minute: 0,
        },
        { zone: timezone },
      );

      return {
        name: term.name,
        nameHanja: term.nameHanja,
        longitude: term.longitude,
        utcDateTime: local.toUTC().toISO({ suppressMilliseconds: true }) ?? "",
        localDateTime: local.toISO({ suppressMilliseconds: true }) ?? "",
      };
    });

    return {
      year,
      timezone,
      precision: "approximate",
      source: "fixed-month-day-fallback",
      terms,
    };
  }
}

export const approximateSolarTermProvider = new ApproximateSolarTermProvider();
