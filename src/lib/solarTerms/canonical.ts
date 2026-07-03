import { DateTime } from "luxon";
import { astronomicalSolarTermProvider } from "./astronomical";
import { astronomyEngineSolarTermProvider } from "./astronomyEngine";
import { approximateSolarTermProvider } from "./approximate";
import { JEOLGI_NAMES } from "./definitions";
import type { SolarTerm, SolarTermProvider } from "./types";

export type CanonicalSolarTermPrecision =
  | "astronomical"
  | "astronomical-fallback"
  | "estimated";

export type CanonicalSolarTermWarning = {
  type: string;
  message: string;
};

export type CanonicalSolarTerm = SolarTerm & {
  dateTime: string;
  dateTimeUtc: string;
};

export type CanonicalSolarTermResult = {
  year: number;
  timezone: string;
  provider: "astronomy-engine" | "meeus" | "approximate";
  providerVersion: string | null;
  precision: CanonicalSolarTermPrecision;
  source: "astronomy-engine" | "meeus" | "approximate";
  fallbackUsed: boolean;
  warnings: CanonicalSolarTermWarning[];
  terms: CanonicalSolarTerm[];
};

export type SolarTermEngineProvenance = Pick<
  CanonicalSolarTermResult,
  "provider" | "providerVersion" | "precision" | "source" | "fallbackUsed"
>;

type ProviderCandidate = {
  provider: CanonicalSolarTermResult["provider"];
  providerVersion: string | null;
  precision: CanonicalSolarTermPrecision;
  source: CanonicalSolarTermResult["source"];
  fallbackUsed: boolean;
  warning?: CanonicalSolarTermWarning;
  instance: SolarTermProvider;
};

const candidates: ProviderCandidate[] = [
  {
    provider: "astronomy-engine",
    providerVersion: "2.1.19",
    precision: "astronomical",
    source: "astronomy-engine",
    fallbackUsed: false,
    instance: astronomyEngineSolarTermProvider,
  },
  {
    provider: "meeus",
    providerVersion: null,
    precision: "astronomical-fallback",
    source: "meeus",
    fallbackUsed: true,
    warning: {
      type: "ASTRONOMY_ENGINE_SOLAR_TERMS_FAILED",
      message: "Astronomy Engine 절기 계산에 실패하여 자체 Meeus provider로 대운수를 계산했습니다.",
    },
    instance: astronomicalSolarTermProvider,
  },
  {
    provider: "approximate",
    providerVersion: null,
    precision: "estimated",
    source: "approximate",
    fallbackUsed: true,
    warning: {
      type: "APPROXIMATE_SOLAR_TERMS_USED",
      message:
        "정밀 절기 계산 provider가 모두 실패하여 월별 절입 근사값으로 대운수를 계산했습니다.",
    },
    instance: approximateSolarTermProvider,
  },
];

function asCanonicalTerm(term: SolarTerm): CanonicalSolarTerm {
  return {
    ...term,
    dateTime: term.localDateTime,
    dateTimeUtc: term.utcDateTime,
  };
}

function validateTerms(terms: CanonicalSolarTerm[]) {
  if (terms.length === 0) {
    throw new Error("No jeolgi solar terms returned");
  }

  terms.forEach((term) => {
    const dateTime = DateTime.fromISO(term.dateTime, { setZone: true });
    if (!dateTime.isValid) {
      throw new Error(`Invalid solar term datetime: ${term.name} ${term.dateTime}`);
    }
  });
}

export function getCanonicalSolarTerms(
  year: number,
  timezone = "Asia/Seoul",
): CanonicalSolarTermResult {
  const warnings: CanonicalSolarTermWarning[] = [];

  for (const candidate of candidates) {
    try {
      const result = candidate.instance.getTermsByYear(year, timezone);
      const terms = result.terms
        .filter((term) => JEOLGI_NAMES.has(term.name))
        .map(asCanonicalTerm);

      validateTerms(terms);

      return {
        year,
        timezone,
        provider: candidate.provider,
        providerVersion: candidate.providerVersion,
        precision: candidate.precision,
        source: candidate.source,
        fallbackUsed: candidate.fallbackUsed,
        warnings,
        terms,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (candidate.warning) {
        warnings.push({
          type: candidate.warning.type,
          message: `${candidate.warning.message} (${message})`,
        });
      }
    }
  }

  throw new Error(`No solar term provider succeeded for ${year}`);
}
