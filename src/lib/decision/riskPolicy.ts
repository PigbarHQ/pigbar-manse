import type { DecisionDomain } from "./types";

export const RISK_ONLY_EVIDENCE_CODES = new Set([
  "HEALTH_MISSING_ELEMENT",
  "HEALTH_ELEMENT_SPREAD",
  "STRESS_ELEMENT_SPREAD_GE_3_FACT",
  "STRESS_OFFICER_COUNT_GE_2_FACT",
  "STRESS_CLASH_CLUSTER_FACT",
  "ACCIDENT_RELATION_COUNT_GE_2_FACT",
  "LEGAL_RELATION_PRESENT_FACT",
  "SPOUSE_PALACE_RELATION_PRESENT_FACT",
  "CASHFLOW_PEER_WEALTH_CO_OCCURRENCE_FACT",
  "HEALTH_MONTH_RELATION_PRESSURE",
  "HEALTH_MONTH_CLASH_PRESSURE",
  "HEALTH_MONTH_PUNISHMENT_HARM_PRESSURE",
  "MONTHLY_RELATION_COUNT_FACT",
  "CURRENT_YEAR_HAS_CLASH",
  "MONTH_HAS_CLASH",
]);

export const STRONG_GLOBAL_RISK_DOMAINS = new Set<DecisionDomain>([
  "health",
  "stress",
  "legalRisk",
  "contract",
  "relationship",
  "spouse",
  "mobility",
  "travel",
]);

export const WEAK_GLOBAL_RISK_DOMAINS = new Set<DecisionDomain>([
  "business",
  "businessStart",
  "businessExpansion",
  "wealth",
  "investment",
  "leadership",
  "communication",
  "study",
]);

export function isGlobalRiskCode(code: string) {
  return /^HIGH_RELATION_MONTH_\d+$/.test(code);
}

export function globalRiskWeightForDomain(domain: DecisionDomain) {
  if (STRONG_GLOBAL_RISK_DOMAINS.has(domain)) return 10;
  if (WEAK_GLOBAL_RISK_DOMAINS.has(domain)) return 5;
  return 7;
}
