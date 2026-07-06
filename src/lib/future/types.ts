import type { BlindCompilerRelation, BlindCompilerSignal, CompactSajuAnalysis } from "@/src/lib/blind";

export type FuturePillar = {
  ganji: string;
  ganjiHanja: string;
  gan: string;
  ji: string;
  ganKo: string;
  jiKo: string;
  tenGod: string;
};

export type FutureDaeun = FuturePillar & {
  index: number | null;
  startYear: number | null;
  endYear: number | null;
  startDateTime: string | null;
  endDateTime: string | null;
  containsCurrentDate: boolean;
};

export type FutureMonthPillar = FuturePillar & {
  month: number;
};

export type FutureRelations = {
  heavenlyStemCombinations: BlindCompilerRelation[];
  earthlyBranchCombinations: BlindCompilerRelation[];
  clashes: BlindCompilerRelation[];
  punishments: BlindCompilerRelation[];
  harms: BlindCompilerRelation[];
  destructions: BlindCompilerRelation[];
};

export type FutureSignal = BlindCompilerSignal;

export type FutureSignalGroups = {
  sharedMovementSignals: FutureSignal[];
  wealthTimingSignals: FutureSignal[];
  careerTimingSignals: FutureSignal[];
  businessTimingSignals: FutureSignal[];
  relationshipTimingSignals: FutureSignal[];
  healthTimingSignals: FutureSignal[];
  mobilityTimingSignals: FutureSignal[];
  contractTimingSignals: FutureSignal[];
  investmentTimingSignals: FutureSignal[];
  studyTimingSignals: FutureSignal[];
  travelTimingSignals: FutureSignal[];
};

export type FutureEvidenceCategory = {
  factCodes: string[];
  candidateCodes: string[];
  occurrences: Array<{
    code: string;
    month?: number;
    ganji?: string;
    sourcePaths: string[];
    values?: FutureSignal["values"];
  }>;
  sourceSignalGroups: string[];
};

export type FutureEvidence = Record<
  | "wealthTiming"
  | "careerTiming"
  | "businessTiming"
  | "healthTiming"
  | "relationshipTiming"
  | "mobilityTiming"
  | "investmentTiming"
  | "contractTiming",
  FutureEvidenceCategory
>;

export type FutureAnalysis = {
  version: "1.0.0";
  generatedAt: string;
  targetYear: number;
  currentDaeun: FutureDaeun | null;
  currentYearGanji: FuturePillar;
  nextYearGanji: FuturePillar;
  monthlyGanji: FutureMonthPillar[];
  daeunRelations: FutureRelations;
  saeunRelations: FutureRelations;
  monthlyRelations: Array<{
    month: number;
    ganji: string;
    ganjiHanja: string;
    relations: FutureRelations;
  }>;
  relationIntensity: Array<{
    month: number;
    ganji: string;
    relationTotal: number;
    clashCount: number;
    combinationCount: number;
    punishmentCount: number;
    harmCount: number;
    destructionCount: number;
    intensity: "LOW" | "MEDIUM" | "HIGH";
  }>;
  monthlyTimingIndex: Array<{
    month: number;
    ganji: string;
    tenGod: string;
    relationCounts: {
      combinations: number;
      clashes: number;
      punishments: number;
      harms: number;
      destructions: number;
    };
    activeTimingCodes: string[];
    timingGroups: string[];
  }>;
  futureSignals: FutureSignalGroups;
  futureEvidence: FutureEvidence;
  source: {
    futureCompilerVersion: "1.0.0";
    normalizationVersion: "1.0.0";
    generatedAt: string;
    targetYear: number;
    usesGpt: false;
    blindCompilerVersion: CompactSajuAnalysis["version"];
    targetYearRule: "explicit-target-year" | "current-date-year";
    daeunSource: "manse-result" | "unavailable";
  };
};

export type FutureCompilerContext = {
  currentDate: string;
  targetYear?: number;
  daeun?: {
    current?: {
      index: number;
      startYear: number;
      endYear: number;
      startDateTime: string;
      endDateTime: string;
      ganji: string;
      ganjiHanja: string;
      stem: {
        hangul: string;
        hanja: string;
      };
      branch: {
        hangul: string;
        hanja: string;
      };
      tenGod: string;
    } | null;
  };
};
