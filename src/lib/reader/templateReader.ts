import type { DecisionAnalysis, DecisionDomain, DomainDecision } from "@/src/lib/decision";
import { TEMPLATE_READER_CAUTION_NOTES } from "./disclaimers";
import { buildServiceDomainReport } from "./domainMeaning";
import { domainTitle } from "./domainText";
import { evidenceLabel } from "./evidenceLabels";
import { buildMonthHighlights, displayMonthSplit } from "./monthText";
import { buildServiceMonthlyStrategy } from "./monthlyStrategy";
import { buildServiceTimingSummary } from "./serviceTiming";
import { summaryForStatus } from "./statusText";
import type { ReaderDomainReport, ReaderDomainSummary, ReaderReport, TemplateReaderInput } from "./types";

function domainTitleList(domains: DecisionDomain[], limit = 3) {
  return domains.slice(0, limit).map(domainTitle).join("·");
}

function headline(topOpportunities: ReaderDomainSummary[], highRiskOpportunities: ReaderDomainSummary[], topRisks: ReaderDomainSummary[]) {
  if (topOpportunities.length > 0 && highRiskOpportunities.length > 0) {
    return `${domainTitleList(topOpportunities.map((item) => item.domain))} 쪽 기회가 먼저 보이고, ${domainTitleList(highRiskOpportunities.map((item) => item.domain), 2)}은 변동성도 함께 살펴야 합니다.`;
  }
  if (topOpportunities.length > 0) {
    return `${domainTitleList(topOpportunities.map((item) => item.domain))} 쪽 기회 신호가 상대적으로 선명합니다.`;
  }
  if (highRiskOpportunities.length > 0) {
    return `${domainTitleList(highRiskOpportunities.map((item) => item.domain))} 쪽은 기회와 변동성이 함께 나타납니다.`;
  }
  if (topRisks.length > 0) {
    return `${domainTitleList(topRisks.map((item) => item.domain))} 쪽 리스크 관리가 먼저 보입니다.`;
  }

  return "전반적인 흐름을 영역별로 점검했습니다.";
}

function executiveSummary(
  topOpportunities: ReaderDomainSummary[],
  highRiskOpportunities: ReaderDomainSummary[],
  topRisks: ReaderDomainSummary[],
  timingSummary: ReturnType<typeof buildServiceTimingSummary>,
) {
  const opportunityNames = domainTitleList([...topOpportunities, ...highRiskOpportunities].map((item) => item.domain), 3);
  const riskNames = domainTitleList(topRisks.map((item) => item.domain), 3);
  const lines: string[] = [];

  if (opportunityNames) {
    lines.push(`올해는 ${opportunityNames} 쪽에서 활용 가능한 신호가 먼저 보입니다.`);
  } else {
    lines.push("올해는 한 영역으로 강하게 몰리기보다 조건을 차분히 살피는 흐름입니다.");
  }

  if (riskNames) {
    lines.push(`다만 ${riskNames}은 변동성과 부담 신호를 함께 관리해야 합니다.`);
  }

  if (timingSummary.activeLabel && timingSummary.mixedLabel && timingSummary.cautionLabel) {
    lines.push(`핵심 활용 시기는 ${timingSummary.activeLabel}, 변화 검토 시기는 ${timingSummary.mixedLabel}, 점검 시기는 ${timingSummary.cautionLabel}입니다.`);
  } else if (timingSummary.activeLabel && timingSummary.cautionLabel) {
    lines.push(`핵심 활용 시기는 ${timingSummary.activeLabel}, 점검 시기는 ${timingSummary.cautionLabel}입니다.`);
  } else if (timingSummary.activeLabel) {
    lines.push(`핵심 활용 시기는 ${timingSummary.activeLabel}입니다.`);
  } else if (timingSummary.cautionLabel) {
    lines.push(`점검 시기는 ${timingSummary.cautionLabel}입니다.`);
  }

  return lines;
}

function evidenceBullets(decision: DecisionAnalysis, domain: DecisionDomain) {
  const evidence = decision.decisionEvidence[domain];
  if (!evidence) return [];

  return [
    ...evidence.positiveEvidenceCodes.map((code) => ({ type: "긍정 신호", label: evidenceLabel(code) })),
    ...evidence.riskEvidenceCodes.map((code) => ({ type: "리스크 신호", label: evidenceLabel(code) })),
    ...evidence.timingEvidenceCodes.map((code) => ({ type: "시기 신호", label: evidenceLabel(code) })),
  ]
    .filter((item): item is { type: string; label: string } => Boolean(item.label))
    .map((item) => `${item.type}: ${item.label}`)
    .filter((line, index, lines) => lines.indexOf(line) === index)
    .slice(0, 12);
}

function cautionText(report: DomainDecision) {
  if (report.cautionMonths.length === 0 && report.riskScore < 50) {
    return "";
  }
  const months = report.cautionMonths.map((month) => `${month.month}월`).join(", ");
  return months ? `주의 신호 월: ${months}` : `리스크 점수: ${report.riskScore}`;
}

function domainReport(decision: DecisionAnalysis, item: DomainDecision): ReaderDomainReport {
  const title = domainTitle(item.domain);
  const bestMonths = item.bestMonths.map((month) => month.month);
  const cautionMonths = item.cautionMonths.map((month) => month.month);
  const displayMonths = displayMonthSplit(bestMonths, cautionMonths);

  return {
    domain: item.domain,
    title,
    opportunityScore: item.opportunityScore,
    directRiskScore: item.directRiskScore,
    globalRiskScore: item.globalRiskScore,
    riskScore: item.riskScore,
    opportunityGrade: item.opportunityGrade,
    riskGrade: item.riskGrade,
    readerStatus: item.readerStatus,
    summary: summaryForStatus(title, item.readerStatus),
    evidenceBullets: evidenceBullets(decision, item.domain),
    bestMonths,
    cautionMonths,
    displayBestMonths: displayMonths.bestMonths,
    displayCautionMonths: displayMonths.cautionMonths,
    cautionText: cautionText(item),
  };
}

function domainSummary(item: DomainDecision): ReaderDomainSummary {
  return {
    domain: item.domain,
    title: domainTitle(item.domain),
    opportunityScore: item.opportunityScore,
    directRiskScore: item.directRiskScore,
    globalRiskScore: item.globalRiskScore,
    riskScore: item.riskScore,
    readerStatus: item.readerStatus,
  };
}

function topByDomains(decision: DecisionAnalysis, domains: DecisionDomain[], sortKey: "opportunityScore" | "riskScore") {
  return decision.domainDecisions
    .filter((item) => domains.includes(item.domain))
    .sort((left, right) => right[sortKey] - left[sortKey])
    .slice(0, 5)
    .map(domainSummary);
}

function topOpportunityDomains(decision: DecisionAnalysis, highRisk: boolean) {
  return decision.domainDecisions
    .filter((item) => item.opportunityScore >= 70 && (highRisk ? item.riskScore >= 50 : item.riskScore < 50))
    .sort((left, right) => right.opportunityScore - left.opportunityScore)
    .slice(0, 5)
    .map(domainSummary);
}

export function buildTemplateReaderReport(input: TemplateReaderInput): ReaderReport {
  const decision = input.decisionAnalysis;
  const domainReports = decision.domainDecisions.map((item) => domainReport(decision, item));
  const serviceDomainReports = decision.domainDecisions.map(buildServiceDomainReport);
  const serviceMonthlyStrategy = buildServiceMonthlyStrategy(decision);
  const serviceTimingSummary = buildServiceTimingSummary(serviceMonthlyStrategy);
  const topOpportunities = topOpportunityDomains(decision, false);
  const highRiskOpportunities = topOpportunityDomains(decision, true);
  const topRisks = topByDomains(decision, decision.decisionSummaryIndex.highRiskDomains, "riskScore");
  const condensedDomains = topOpportunities.map((item) => item.domain);
  const visibleDomainReports = domainReports
    .filter((item) => topOpportunities.some((summary) => summary.domain === item.domain) || highRiskOpportunities.some((summary) => summary.domain === item.domain))
    .slice(0, 5);

  return {
    version: "1.0.0",
    generatedAt: decision.generatedAt,
    targetYear: input.targetYear ?? decision.targetYear,
    source: {
      decisionCompilerVersion: decision.source.decisionCompilerVersion,
      readerVersion: "0.1.0",
      usesGpt: false,
    },
    headline: headline(topOpportunities, highRiskOpportunities, topRisks),
    overallSummary: executiveSummary(topOpportunities, highRiskOpportunities, topRisks, serviceTimingSummary),
    domainReports,
    visibleDomainReports,
    topOpportunities,
    highRiskOpportunities,
    topRisks,
    monthHighlights: buildMonthHighlights(decision),
    condensedMonthHighlights: buildMonthHighlights(decision, condensedDomains),
    serviceDomainReports,
    serviceMonthlyStrategy,
    serviceTimingSummary,
    cautionNotes: TEMPLATE_READER_CAUTION_NOTES,
    disclaimer: TEMPLATE_READER_CAUTION_NOTES,
  };
}
