import { globalRiskWeightForDomain, isGlobalRiskCode } from "./riskPolicy";
import type { DecisionDirection, DecisionDomain, DecisionGrade, OpportunityDirection, ReaderStatus, RiskDirection } from "./types";

export const DECISION_SCORING = {
  baseScore: 50,
  positiveWeight: 4,
  riskWeight: -5,
  timingWeight: 2,
  highRelationRisk: -10,
  low: 39,
  mid: 59,
  high: 79,
  favorable: 75,
  caution: 54,
  riskBaseScore: 20,
  highRelationRiskWeight: 10,
  severeRiskCodeWeight: 15,
  generalRiskCodeWeight: 5,
} as const;

export function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function gradeForScore(score: number): DecisionGrade {
  if (score <= DECISION_SCORING.low) return "LOW";
  if (score <= DECISION_SCORING.mid) return "MID";
  if (score <= DECISION_SCORING.high) return "HIGH";
  return "VERY_HIGH";
}

export function directionForScore(input: { score: number; riskCount: number; severeRisk: boolean; hasCautionMonth: boolean }): DecisionDirection {
  if (input.score < 40 || input.severeRisk) return "RISK";
  if (input.score <= DECISION_SCORING.caution || input.hasCautionMonth) return "CAUTION";
  if (input.score >= DECISION_SCORING.favorable && input.riskCount <= 1) return "FAVORABLE";
  return "NEUTRAL";
}

export function confidenceForEvidence(input: { positiveCount: number; riskCount: number; timingCount: number }) {
  const total = input.positiveCount + input.riskCount + input.timingCount;
  return Number(Math.min(0.95, 0.35 + total * 0.06).toFixed(2));
}

export function riskGradeForScore(score: number): DecisionGrade {
  if (score <= 29) return "LOW";
  if (score <= 49) return "MID";
  if (score <= 69) return "HIGH";
  return "VERY_HIGH";
}

export function riskDirectionForScore(score: number): RiskDirection {
  if (score <= 29) return "LOW";
  if (score <= 49) return "CAUTION";
  if (score <= 69) return "HIGH";
  return "RISK";
}

export function opportunityDirectionForScore(score: number): OpportunityDirection {
  if (score >= 70) return "FAVORABLE";
  if (score >= 50) return "NEUTRAL";
  return "WEAK";
}

export function riskScoreForEvidence(input: { domain: DecisionDomain; riskCodes: string[]; cautionMonths: Array<{ month: number; relationIntensity: string }> }) {
  const globalMonthCodes = input.cautionMonths
    .filter((month) => month.relationIntensity === "HIGH")
    .map((month) => `HIGH_RELATION_MONTH_${month.month}`);
  const globalRiskCodes = Array.from(new Set([...input.riskCodes.filter(isGlobalRiskCode), ...globalMonthCodes]));
  const directRiskCodes = input.riskCodes.filter((code) => !isGlobalRiskCode(code));
  const severeRiskCodes = directRiskCodes.filter((code) => /LEGAL|ACCIDENT|CLASH_CLUSTER|PALACE_RELATION|PUNISHMENT|HARM/.test(code)).length;
  const generalRiskCodes = Math.max(0, directRiskCodes.length - severeRiskCodes);
  const directRiskScore = clampScore(
    DECISION_SCORING.riskBaseScore +
      severeRiskCodes * DECISION_SCORING.severeRiskCodeWeight +
      generalRiskCodes * DECISION_SCORING.generalRiskCodeWeight,
  );
  const globalRiskScore = clampScore(globalRiskCodes.length * globalRiskWeightForDomain(input.domain));

  return {
    directRiskScore,
    globalRiskScore,
    riskScore: clampScore(directRiskScore + globalRiskScore * 0.35),
  };
}

export function readerStatusForScores(input: { opportunityScore: number; riskScore: number }): ReaderStatus {
  if (input.opportunityScore >= 70 && input.riskScore < 50) return "HIGH_OPPORTUNITY_LOW_RISK";
  if (input.opportunityScore >= 70 && input.riskScore >= 50) return "HIGH_OPPORTUNITY_HIGH_RISK";
  if (input.opportunityScore >= 50 && input.riskScore < 50) return "MID_OPPORTUNITY_LOW_RISK";
  if (input.opportunityScore >= 50 && input.riskScore >= 50) return "MID_OPPORTUNITY_HIGH_RISK";
  if (input.opportunityScore < 50 && input.riskScore < 50) return "LOW_OPPORTUNITY_LOW_RISK";
  if (input.opportunityScore < 50 && input.riskScore >= 50) return "LOW_OPPORTUNITY_HIGH_RISK";
  return "NEUTRAL";
}
