import type { ManseResult } from "@/src/lib/manse";
import type { BlueprintParagraph } from "../types";

export type ClassicalAnalysisSection = {
  id: string;
  order: number;
  title: string;
  layers: Array<{
    sajuOriginal: string[];
    classical: string[];
    blueprint: string[];
  }>;
  body: string[];
  evidence: NonNullable<BlueprintParagraph["referenceEvidence"]>;
};

export type ClassicalAnalysisInput = {
  subject: {
    name: string;
    birthDate: string;
    birthTime: string | null;
    birthPlace: string;
  };
  pillars: {
    year: string;
    month: string;
    day: string;
    hour: string | null;
  };
  tenGods: Record<string, string | null>;
  elements: Record<string, number>;
  hiddenStems: ManseResult["natalChart"]["hiddenStems"];
  twelveStages: ManseResult["twelveStages"];
  luck: {
    daeun: string | null;
    year: string;
    month: string;
    day: string;
  };
  warnings: string[];
};

export type ClassicalAnalysis = {
  mode: "classical-myeongli";
  input: ClassicalAnalysisInput;
  suggestedTitle: string;
  sections: ClassicalAnalysisSection[];
};
