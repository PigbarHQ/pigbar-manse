import type { ElementName, Gender, YinYang } from "@/src/lib/manse";

export type BlindCompilerPillar = {
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

export type BlindCompilerHiddenStem = {
  key: string;
  hangul: string;
  hanja: string;
  element: ElementName;
  yinYang: YinYang;
  tenGod: string;
};

export type BlindCompilerRelation = {
  name: string;
  positions: string[];
  values: string[];
};

export type BlindCompilerCandidate = {
  code: string;
  label: string;
  score: number;
  sourcePaths: string[];
  values?: Record<string, string | number | boolean | null>;
};

export type BlindCompilerSignal = {
  kind: "fact";
  code: string;
  label: string;
  weight: number;
  confidence: number;
  sourcePaths: string[];
  sourceRules: string[];
  values?: Record<string, string | number | boolean | null | string[] | number[] | boolean[]>;
};

export type BlindSignal = BlindCompilerSignal;
export type BlindSignalGroup = BlindSignal[];

export type EvidenceCategorySummary = {
  factCodes: string[];
  candidateCodes: string[];
  sourceSignalGroups: string[];
};

export type BlindEvidenceSummary = Record<
  "wealth" | "business" | "career" | "relationship" | "health" | "contract" | "investment" | "mobility",
  EvidenceCategorySummary
>;

export type CompactSajuAnalysis = {
  version: "1.0.0";
  inputMeta: {
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
    year: BlindCompilerPillar;
    month: BlindCompilerPillar;
    day: BlindCompilerPillar;
    hour: BlindCompilerPillar | null;
  };
  dayMaster: {
    stem: string;
    stemKo: string;
    element: ElementName;
    yinYang: YinYang;
  };
  fiveElements: {
    counts: Record<ElementName, number>;
    balance: {
      min: number;
      max: number;
      spread: number;
      total: number;
      missing: ElementName[];
    };
    strongest: ElementName[];
    weakest: ElementName[];
  };
  tenGods: {
    byStem: Record<"year" | "month" | "day" | "hour", string | null>;
    byBranchHidden: Record<"year" | "month" | "day" | "hour", BlindCompilerHiddenStem[]>;
    counts: Record<string, number>;
  };
  hiddenStems: Record<"year" | "month" | "day" | "hour", BlindCompilerHiddenStem[]>;
  relations: {
    heavenlyStemCombinations: BlindCompilerRelation[];
    earthlyBranchCombinations: BlindCompilerRelation[];
    clashes: BlindCompilerRelation[];
    punishments: BlindCompilerRelation[];
    harms: BlindCompilerRelation[];
    destructions: BlindCompilerRelation[];
  };
  roots: {
    dayMasterRoots: Array<{
      position: "year" | "month" | "day" | "hour";
      branch: string;
      branchKo: string;
      rootType: "sameStem" | "sameElement";
      matchedHiddenStem: string;
      matchedHiddenStemKo: string;
      weight: number;
    }>;
    tenGodRoots: Record<string, string[]>;
  };
  seasonalContext: {
    monthBranch: string;
    monthBranchKo: string;
    season: "spring" | "summer" | "autumn" | "winter" | "transitional";
    seasonalElement: ElementName;
    dayMasterSeasonalSupport: {
      relation: "peer" | "resource" | "output" | "wealth" | "officer";
      supportScore: number;
      drainScore: number;
      candidate: "strong" | "balanced" | "weak";
    };
  };
  candidates: {
    strengthCandidates: BlindCompilerCandidate[];
    structureCandidates: BlindCompilerCandidate[];
    usefulGodCandidates: BlindCompilerCandidate[];
    unfavorableGodCandidates: BlindCompilerCandidate[];
  };
  signals: {
    wealthSignals: BlindCompilerSignal[];
    careerSignals: BlindCompilerSignal[];
    businessSignals: BlindCompilerSignal[];
    relationshipSignals: BlindCompilerSignal[];
    healthSignals: BlindCompilerSignal[];
    leadershipSignals: BlindCompilerSignal[];
    organizationSignals: BlindCompilerSignal[];
    authoritySignals: BlindCompilerSignal[];
    managementSignals: BlindCompilerSignal[];
    entrepreneurSignals: BlindCompilerSignal[];
    salesSignals: BlindCompilerSignal[];
    creativitySignals: BlindCompilerSignal[];
    studySignals: BlindCompilerSignal[];
    reputationSignals: BlindCompilerSignal[];
    partnershipSignals: BlindCompilerSignal[];
    mobilitySignals: BlindCompilerSignal[];
    contractSignals: BlindCompilerSignal[];
    legalRiskSignals: BlindCompilerSignal[];
    familySignals: BlindCompilerSignal[];
    spouseSignals: BlindCompilerSignal[];
    childrenSignals: BlindCompilerSignal[];
    parentSignals: BlindCompilerSignal[];
    accidentSignals: BlindCompilerSignal[];
    travelSignals: BlindCompilerSignal[];
    overseasSignals: BlindCompilerSignal[];
    propertySignals: BlindCompilerSignal[];
    investmentSignals: BlindCompilerSignal[];
    cashflowSignals: BlindCompilerSignal[];
    stressSignals: BlindCompilerSignal[];
    communicationSignals: BlindCompilerSignal[];
  };
  evidenceSummary: BlindEvidenceSummary;
};
