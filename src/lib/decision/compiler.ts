import { collectDecisionEvidence } from "./evidence";
import { DECISION_DOMAIN_RULES, DECISION_DOMAINS } from "./domains";
import {
  DECISION_SCORING,
  clampScore,
  confidenceForEvidence,
  directionForScore,
  gradeForScore,
  opportunityDirectionForScore,
  readerStatusForScores,
  riskDirectionForScore,
  riskGradeForScore,
  riskScoreForEvidence,
} from "./scoring";
import { isGlobalRiskCode } from "./riskPolicy";
import type { DecisionAnalysis, DecisionCompilerInput, DecisionDomain, DecisionEvidence, DecisionEvidenceEntry, DecisionMonth, DomainDecision } from "./types";

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function monthForDomain(input: DecisionCompilerInput, domain: DecisionDomain, mode: "best" | "caution"): DecisionMonth[] {
  const rule = DECISION_DOMAIN_RULES[domain];

  return input.futureCompiler.monthlyTimingIndex.flatMap((month) => {
    const intensity = input.futureCompiler.relationIntensity.find((item) => item.month === month.month)?.intensity ?? "LOW";
    const reasonCodes = month.activeTimingCodes.filter((code) =>
      mode === "best"
        ? rule.timingCodePatterns.some((pattern) => pattern.test(code)) && intensity !== "HIGH"
        : intensity === "HIGH" || rule.riskCodePatterns.some((pattern) => pattern.test(code)),
    );

    return reasonCodes.length
      ? [{
          month: month.month,
          ganji: month.ganji,
          reasonCodes,
          relationIntensity: intensity,
        }]
      : [];
  });
}

function compileDomainDecision(input: DecisionCompilerInput, domain: DecisionDomain): { decision: DomainDecision; evidence: DecisionEvidenceEntry } {
  const rule = DECISION_DOMAIN_RULES[domain];
  const collected = collectDecisionEvidence(input.blindCompiler, input.futureCompiler, rule);
  const bestMonths = monthForDomain(input, domain, "best");
  const cautionMonths = monthForDomain(input, domain, "caution");
  const positiveScore = collected.positiveEvidenceCodes.length * DECISION_SCORING.positiveWeight;
  const riskScore = collected.riskEvidenceCodes.length * DECISION_SCORING.riskWeight;
  const timingScore = Math.min(12, collected.timingEvidenceCodes.length * DECISION_SCORING.timingWeight + bestMonths.length);
  const severeRisk = cautionMonths.some((month) => month.relationIntensity === "HIGH");
  const finalScore = clampScore(DECISION_SCORING.baseScore + positiveScore + riskScore + timingScore + (severeRisk ? DECISION_SCORING.highRelationRisk : 0));
  const opportunityScore = finalScore;
  const calibratedRisk = riskScoreForEvidence({
    domain,
    riskCodes: collected.riskEvidenceCodes,
    cautionMonths,
  });
  const opportunityGrade = gradeForScore(opportunityScore);
  const riskGrade = riskGradeForScore(calibratedRisk.riskScore);
  const opportunityDirection = opportunityDirectionForScore(opportunityScore);
  const riskDirection = riskDirectionForScore(calibratedRisk.riskScore);
  const readerStatus = readerStatusForScores({ opportunityScore, riskScore: calibratedRisk.riskScore });
  const grade = gradeForScore(finalScore);
  const hasDirectSevereRisk = collected.riskEvidenceCodes.some((code) => !isGlobalRiskCode(code) && /LEGAL|ACCIDENT|CLASH_CLUSTER|PALACE_RELATION|PUNISHMENT|HARM/.test(code));
  const direction = directionForScore({
    score: finalScore,
    riskCount: collected.riskEvidenceCodes.length,
    severeRisk: hasDirectSevereRisk,
    hasCautionMonth: cautionMonths.length > 0,
  });
  const confidence = confidenceForEvidence({
    positiveCount: collected.positiveEvidenceCodes.length,
    riskCount: collected.riskEvidenceCodes.length,
    timingCount: collected.timingEvidenceCodes.length,
  });
  const evidence: DecisionEvidenceEntry = {
    baseScore: DECISION_SCORING.baseScore,
    positiveScore,
    directRiskScore: calibratedRisk.directRiskScore,
    globalRiskScore: calibratedRisk.globalRiskScore,
    riskScore,
    timingScore,
    finalScore,
    positiveEvidenceCodes: collected.positiveEvidenceCodes,
    riskEvidenceCodes: collected.riskEvidenceCodes,
    timingEvidenceCodes: collected.timingEvidenceCodes,
    sourceSignalGroups: collected.sourceSignalGroups,
    occurrences: collected.occurrences,
  };

  return {
    decision: {
      domain,
      opportunityScore,
      directRiskScore: calibratedRisk.directRiskScore,
      globalRiskScore: calibratedRisk.globalRiskScore,
      riskScore: calibratedRisk.riskScore,
      opportunityGrade,
      riskGrade,
      opportunityDirection,
      riskDirection,
      readerStatus,
      score: finalScore,
      grade,
      direction,
      confidence,
      positiveEvidenceCodes: collected.positiveEvidenceCodes,
      riskEvidenceCodes: collected.riskEvidenceCodes,
      timingEvidenceCodes: collected.timingEvidenceCodes,
      bestMonths,
      cautionMonths,
      sourceSignalGroups: collected.sourceSignalGroups,
      sourcePaths: collected.sourcePaths,
      sourceRules: collected.sourceRules,
    },
    evidence,
  };
}

function emptyDomainMonthIndex(domains: DecisionDomain[]) {
  return domains.reduce((index, domain) => {
    index[domain] = [];
    return index;
  }, {} as Record<DecisionDomain, number[]>);
}

function topCodes(decisions: DomainDecision[], key: "positiveEvidenceCodes" | "riskEvidenceCodes") {
  const counts = new Map<string, number>();
  decisions.forEach((decision) => {
    decision[key].forEach((code) => counts.set(code, (counts.get(code) ?? 0) + 1));
  });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 12)
    .map(([code]) => code);
}

export function compileDecisionInput(input: DecisionCompilerInput): DecisionAnalysis {
  const domains = input.targetDomain ? [input.targetDomain] : DECISION_DOMAINS;
  const compiled = domains.map((domain) => compileDomainDecision(input, domain));
  const domainDecisions = compiled.map((item) => item.decision);
  const decisionEvidence = Object.fromEntries(compiled.map((item) => [item.decision.domain, item.evidence])) as DecisionEvidence;
  const bestMonthsByDomain = emptyDomainMonthIndex(domains);
  const cautionMonthsByDomain = emptyDomainMonthIndex(domains);

  domainDecisions.forEach((decision) => {
    bestMonthsByDomain[decision.domain] = unique(decision.bestMonths.map((month) => String(month.month))).map(Number);
    cautionMonthsByDomain[decision.domain] = unique(decision.cautionMonths.map((month) => String(month.month))).map(Number);
  });

  return {
    version: "1.0.0",
    generatedAt: input.futureCompiler.generatedAt,
    targetYear: input.targetYear,
    source: {
      blindCompilerVersion: input.blindCompiler.version,
      futureCompilerVersion: input.futureCompiler.version,
      decisionCompilerVersion: "1.0.0",
      usesGpt: false,
    },
    domainDecisions,
    decisionEvidence,
    decisionSummaryIndex: {
      veryHighDomains: domainDecisions.filter((decision) => decision.grade === "VERY_HIGH").map((decision) => decision.domain),
      cautionDomains: domainDecisions.filter((decision) => decision.direction === "CAUTION").map((decision) => decision.domain),
      riskDomains: domainDecisions.filter((decision) => decision.direction === "RISK").map((decision) => decision.domain),
      highOpportunityDomains: domainDecisions.filter((decision) => decision.opportunityScore >= 70).map((decision) => decision.domain),
      highRiskDomains: domainDecisions.filter((decision) => decision.riskScore >= 50).map((decision) => decision.domain),
      highOpportunityHighRiskDomains: domainDecisions.filter((decision) => decision.readerStatus === "HIGH_OPPORTUNITY_HIGH_RISK").map((decision) => decision.domain),
      highOpportunityLowRiskDomains: domainDecisions.filter((decision) => decision.readerStatus === "HIGH_OPPORTUNITY_LOW_RISK").map((decision) => decision.domain),
      lowOpportunityHighRiskDomains: domainDecisions.filter((decision) => decision.readerStatus === "LOW_OPPORTUNITY_HIGH_RISK").map((decision) => decision.domain),
      topPositiveEvidence: topCodes(domainDecisions, "positiveEvidenceCodes"),
      topRiskEvidence: topCodes(domainDecisions, "riskEvidenceCodes"),
      bestMonthsByDomain,
      cautionMonthsByDomain,
    },
  };
}
