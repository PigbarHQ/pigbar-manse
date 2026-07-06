import type { ElementName, Gender, YinYang } from "@/src/lib/manse";

export type CompactSajuPillar = {
  gan: string;
  ji: string;
  ganKo: string;
  jiKo: string;
  ganElement: ElementName;
  jiElement: ElementName;
  ganYinYang: YinYang;
  jiYinYang: YinYang;
  tenGod: string | null;
  twelveStage: string | null;
};

export type CompactHiddenStem = {
  key: string;
  hangul: string;
  hanja: string;
  element: ElementName;
  yinYang: YinYang;
  tenGod: string;
};

export type CompactSignal = {
  code: string;
  label: string;
  weight: number;
  sourcePaths: string[];
  values?: Record<string, string | number | boolean | null>;
};

export type CompactCandidate = {
  code: string;
  label: string;
  score: number;
  sourcePaths: string[];
  values?: Record<string, string | number | boolean | null>;
};

export type CompactRelation = {
  type: "combination" | "clash";
  name: string;
  positions: string[];
  values: string[];
};

export type CompactSajuAnalysis = {
  version: "1.0.0";
  subject: {
    name: string | null;
    gender: Gender;
    birthDate: string;
    birthTime: string | null;
    calendarType: "solar" | "lunar";
    isLeapMonth: boolean;
    birthplace: string;
    unknownTime: boolean;
  };
  pillars: {
    year: CompactSajuPillar;
    month: CompactSajuPillar;
    day: CompactSajuPillar;
    hour: CompactSajuPillar | null;
  };
  dayMaster: {
    stem: string;
    stemKo: string;
    element: ElementName;
    yinYang: YinYang;
  };
  monthCommand: {
    branch: string;
    branchKo: string;
    element: ElementName;
    yinYang: YinYang;
    hiddenStems: CompactHiddenStem[];
  };
  fiveElementsCount: Record<ElementName, number>;
  fiveElementsBalance: {
    dominant: ElementName[];
    weak: ElementName[];
    missing: ElementName[];
    min: number;
    max: number;
    spread: number;
    total: number;
  };
  tenGodsByStem: Record<"year" | "month" | "day" | "hour", string | null>;
  tenGodsByBranchHidden: Record<"year" | "month" | "day" | "hour", CompactHiddenStem[]>;
  tenGodsCount: Record<string, number>;
  heavenlyStemRelations: CompactRelation[];
  earthlyBranchRelations: CompactRelation[];
  hiddenStems: Record<"year" | "month" | "day" | "hour", CompactHiddenStem[]>;
  roots: Array<{
    position: "year" | "month" | "day" | "hour";
    branch: string;
    branchKo: string;
    rootType: "sameStem" | "sameElement";
    matchedHiddenStem: string;
    matchedHiddenStemKo: string;
    weight: number;
  }>;
  seasonalStrength: {
    monthElementRelation: "peer" | "resource" | "output" | "wealth" | "officer";
    monthBranchElement: ElementName;
    supportScore: number;
    drainScore: number;
    candidate: "strong" | "balanced" | "weak";
    sourcePaths: string[];
  };
  strengthCandidates: CompactCandidate[];
  structureCandidates: CompactCandidate[];
  usefulGodCandidates: CompactCandidate[];
  unfavorableGodCandidates: CompactCandidate[];
  wealthProfileSignals: CompactSignal[];
  careerProfileSignals: CompactSignal[];
  businessProfileSignals: CompactSignal[];
  relationshipSignals: CompactSignal[];
  healthSignals: CompactSignal[];
  futureInputKeys: {
    daeunDirection: string;
    currentDaeun: string | null;
    currentYear: string;
    currentMonth: string;
    currentDay: string;
    currentHour: string | null;
    daeunCycles: Array<{
      index: number;
      ganji: string;
      startYear: number;
      endYear: number;
      startDateTime: string;
      endDateTime: string;
    }>;
  };
};
