import type { CompactSajuAnalysis } from "@/src/lib/blind";
import type { FutureAnalysis, FutureSignal } from "@/src/lib/future";

export type DecisionDomain =
  | "wealth"
  | "career"
  | "business"
  | "jobChange"
  | "businessStart"
  | "businessExpansion"
  | "partnership"
  | "investment"
  | "property"
  | "contract"
  | "relationship"
  | "spouse"
  | "family"
  | "children"
  | "parent"
  | "health"
  | "stress"
  | "mobility"
  | "travel"
  | "overseas"
  | "study"
  | "reputation"
  | "legalRisk"
  | "communication"
  | "leadership";

export type DecisionGrade = "LOW" | "MID" | "HIGH" | "VERY_HIGH";
export type DecisionDirection = "FAVORABLE" | "NEUTRAL" | "CAUTION" | "RISK";
export type OpportunityDirection = "FAVORABLE" | "NEUTRAL" | "WEAK";
export type RiskDirection = "LOW" | "CAUTION" | "HIGH" | "RISK";
export type ReaderStatus =
  | "HIGH_OPPORTUNITY_LOW_RISK"
  | "HIGH_OPPORTUNITY_HIGH_RISK"
  | "MID_OPPORTUNITY_LOW_RISK"
  | "MID_OPPORTUNITY_HIGH_RISK"
  | "LOW_OPPORTUNITY_LOW_RISK"
  | "LOW_OPPORTUNITY_HIGH_RISK"
  | "NEUTRAL";

export type DecisionMonth = {
  month: number;
  ganji: string;
  reasonCodes: string[];
  relationIntensity: "LOW" | "MEDIUM" | "HIGH";
};

export type DomainDecision = {
  domain: DecisionDomain;
  opportunityScore: number;
  directRiskScore: number;
  globalRiskScore: number;
  riskScore: number;
  opportunityGrade: DecisionGrade;
  riskGrade: DecisionGrade;
  opportunityDirection: OpportunityDirection;
  riskDirection: RiskDirection;
  readerStatus: ReaderStatus;
  score: number;
  grade: DecisionGrade;
  direction: DecisionDirection;
  confidence: number;
  positiveEvidenceCodes: string[];
  riskEvidenceCodes: string[];
  timingEvidenceCodes: string[];
  bestMonths: DecisionMonth[];
  cautionMonths: DecisionMonth[];
  sourceSignalGroups: string[];
  sourcePaths: string[];
  sourceRules: string[];
};

export type DecisionEvidenceEntry = {
  baseScore: number;
  positiveScore: number;
  directRiskScore: number;
  globalRiskScore: number;
  riskScore: number;
  timingScore: number;
  finalScore: number;
  positiveEvidenceCodes: string[];
  riskEvidenceCodes: string[];
  timingEvidenceCodes: string[];
  sourceSignalGroups: string[];
  occurrences: Array<{
    code: string;
    month?: number;
    ganji?: string;
    sourcePaths: string[];
    values?: FutureSignal["values"];
  }>;
};

export type DecisionEvidence = Record<DecisionDomain, DecisionEvidenceEntry>;

export type DecisionSummaryIndex = {
  veryHighDomains: DecisionDomain[];
  cautionDomains: DecisionDomain[];
  riskDomains: DecisionDomain[];
  highOpportunityDomains: DecisionDomain[];
  highRiskDomains: DecisionDomain[];
  highOpportunityHighRiskDomains: DecisionDomain[];
  highOpportunityLowRiskDomains: DecisionDomain[];
  lowOpportunityHighRiskDomains: DecisionDomain[];
  topPositiveEvidence: string[];
  topRiskEvidence: string[];
  bestMonthsByDomain: Record<DecisionDomain, number[]>;
  cautionMonthsByDomain: Record<DecisionDomain, number[]>;
};

export type DecisionAnalysis = {
  version: "1.0.0";
  generatedAt: string;
  targetYear: number;
  source: {
    blindCompilerVersion: CompactSajuAnalysis["version"];
    futureCompilerVersion: FutureAnalysis["version"];
    decisionCompilerVersion: "1.0.0";
    usesGpt: false;
  };
  domainDecisions: DomainDecision[];
  decisionEvidence: DecisionEvidence;
  decisionSummaryIndex: DecisionSummaryIndex;
};

export type DecisionCompilerInput = {
  blindCompiler: CompactSajuAnalysis;
  futureCompiler: FutureAnalysis;
  targetYear: number;
  targetDomain?: DecisionDomain;
};
