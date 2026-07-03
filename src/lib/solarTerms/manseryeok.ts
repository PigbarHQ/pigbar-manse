import { getSolarTermsByYear } from "@fullstackfamily/manseryeok";
import { DateTime } from "luxon";
import { SOLAR_TERM_DEFINITIONS } from "./definitions";
import type { SolarTermName, SolarTermProvider, SolarTermResult } from "./types";

function toSolarTermName(name: string): SolarTermName {
  const definition = SOLAR_TERM_DEFINITIONS.find((term) => term.name === name);
  if (!definition) {
    throw new Error(`Unsupported solar term name: ${name}`);
  }

  return definition.name;
}

export class ManseryeokSolarTermProvider implements SolarTermProvider {
  getTermsByYear(year: number, timezone: string): SolarTermResult {
    const terms = getSolarTermsByYear(year).map((term) => {
      const local = DateTime.fromObject(
        {
          year: term.year,
          month: term.month,
          day: term.day,
          hour: term.hour,
          minute: term.minute,
        },
        { zone: timezone },
      );

      return {
        name: toSolarTermName(term.name),
        nameHanja: term.nameHanja,
        longitude: term.longitude,
        utcDateTime: local.toUTC().toISO({ suppressMilliseconds: true }) ?? "",
        localDateTime: local.toISO({ suppressMilliseconds: true }) ?? "",
      };
    });

    return {
      year,
      timezone,
      precision: "manseryeok",
      source: "@fullstackfamily/manseryeok",
      terms,
    };
  }
}

export const manseryeokSolarTermProvider = new ManseryeokSolarTermProvider();
