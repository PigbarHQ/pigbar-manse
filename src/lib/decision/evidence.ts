import type { CompactSajuAnalysis } from "@/src/lib/blind";
import type { FutureAnalysis, FutureSignal } from "@/src/lib/future";
import type { DecisionDomainRule } from "./domains";
import { RISK_ONLY_EVIDENCE_CODES } from "./riskPolicy";

type SignalLike = {
  code: string;
  sourcePaths: string[];
  sourceRules: string[];
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function signalGroup(blind: CompactSajuAnalysis, group: string): SignalLike[] {
  const signals = blind.signals[group as keyof CompactSajuAnalysis["signals"]];
  return Array.isArray(signals) ? signals : [];
}

function futureSignalGroup(future: FutureAnalysis, group: string): FutureSignal[] {
  const signals = future.futureSignals[group as keyof FutureAnalysis["futureSignals"]];
  return Array.isArray(signals) ? signals : [];
}

function blindEvidenceCodes(blind: CompactSajuAnalysis, key: string) {
  const entry = blind.evidenceSummary[key as keyof CompactSajuAnalysis["evidenceSummary"]];
  return entry ? [...entry.factCodes, ...entry.candidateCodes] : [];
}

function futureEvidenceCodes(future: FutureAnalysis, key: string) {
  const entry = future.futureEvidence[key as keyof FutureAnalysis["futureEvidence"]];
  return entry ? [...entry.factCodes, ...entry.candidateCodes] : [];
}

function futureOccurrences(future: FutureAnalysis, key: string) {
  const entry = future.futureEvidence[key as keyof FutureAnalysis["futureEvidence"]];
  return entry?.occurrences ?? [];
}

export function collectDecisionEvidence(blind: CompactSajuAnalysis, future: FutureAnalysis, rule: DecisionDomainRule) {
  const positiveSignals = rule.blindPositiveSignalGroups.flatMap((group) => signalGroup(blind, group));
  const riskSignals = rule.blindRiskSignalGroups.flatMap((group) => signalGroup(blind, group));
  const timingSignals = rule.futureTimingSignalGroups.flatMap((group) => futureSignalGroup(future, group));
  const positiveCandidates = unique([
    ...rule.blindEvidenceKeys.flatMap((key) => blindEvidenceCodes(blind, key)),
    ...positiveSignals.map((item) => item.code),
    ...rule.futureEvidenceKeys.flatMap((key) => futureEvidenceCodes(future, key)),
  ]);
  const riskOnlyCandidates = positiveCandidates.filter((code) => RISK_ONLY_EVIDENCE_CODES.has(code));
  const riskEvidenceCodes = unique([
    ...riskSignals.map((item) => item.code),
    ...riskOnlyCandidates,
    ...future.relationIntensity.filter((item) => item.intensity === "HIGH").map((item) => `HIGH_RELATION_MONTH_${item.month}`),
  ]).filter((code) => RISK_ONLY_EVIDENCE_CODES.has(code) || rule.riskCodePatterns.length === 0 || rule.riskCodePatterns.some((pattern) => pattern.test(code)));
  const positiveEvidenceCodes = positiveCandidates.filter((code) => !RISK_ONLY_EVIDENCE_CODES.has(code) && !riskEvidenceCodes.includes(code));
  const timingEvidenceCodes = unique([
    ...timingSignals.map((item) => item.code),
    ...rule.futureEvidenceKeys.flatMap((key) => futureEvidenceCodes(future, key)),
  ]);
  const sourceSignalGroups = unique([
    ...rule.blindPositiveSignalGroups,
    ...rule.blindRiskSignalGroups,
    ...rule.futureTimingSignalGroups,
  ]);
  const sourcePaths = unique([
    ...positiveSignals.flatMap((item) => item.sourcePaths),
    ...riskSignals.flatMap((item) => item.sourcePaths),
    ...timingSignals.flatMap((item) => item.sourcePaths),
  ]);
  const sourceRules = unique([
    ...positiveSignals.flatMap((item) => item.sourceRules),
    ...riskSignals.flatMap((item) => item.sourceRules),
    ...timingSignals.flatMap((item) => item.sourceRules),
  ]);
  const occurrences = rule.futureEvidenceKeys.flatMap((key) => futureOccurrences(future, key));

  return {
    positiveEvidenceCodes,
    riskEvidenceCodes,
    timingEvidenceCodes,
    sourceSignalGroups,
    sourcePaths,
    sourceRules,
    occurrences,
  };
}
