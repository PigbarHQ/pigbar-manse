import type { DecisionAnalysis, DecisionDomain, DecisionGrade, ReaderStatus } from "@/src/lib/decision";

export type ReaderDomainReport = {
  domain: DecisionDomain;
  title: string;
  opportunityScore: number;
  directRiskScore: number;
  globalRiskScore: number;
  riskScore: number;
  opportunityGrade: DecisionGrade;
  riskGrade: DecisionGrade;
  readerStatus: ReaderStatus;
  summary: string;
  evidenceBullets: string[];
  bestMonths: number[];
  cautionMonths: number[];
  displayBestMonths: number[];
  displayCautionMonths: number[];
  cautionText: string;
};

export type ReaderDomainSummary = {
  domain: DecisionDomain;
  title: string;
  opportunityScore: number;
  directRiskScore: number;
  globalRiskScore: number;
  riskScore: number;
  readerStatus: ReaderStatus;
};

export type ReaderReport = {
  version: "1.0.0";
  generatedAt: string;
  targetYear: number;
  source: {
    decisionCompilerVersion: DecisionAnalysis["source"]["decisionCompilerVersion"];
    readerVersion: "0.1.0";
    usesGpt: false;
  };
  headline: string;
  overallSummary: string[];
  domainReports: ReaderDomainReport[];
  visibleDomainReports: ReaderDomainReport[];
  topOpportunities: ReaderDomainSummary[];
  highRiskOpportunities: ReaderDomainSummary[];
  topRisks: ReaderDomainSummary[];
  monthHighlights: string[];
  condensedMonthHighlights: string[];
  cautionNotes: string[];
  disclaimer: string[];
};

export type TemplateReaderInput = {
  decisionAnalysis: DecisionAnalysis;
  userProfile?: unknown;
  targetYear?: number;
};
