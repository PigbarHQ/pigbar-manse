import type { DecisionAnalysis, DecisionDomain } from "@/src/lib/decision";
import { domainTitle } from "./domainText";

function monthList(months: number[]) {
  return months.length > 0 ? months.map((month) => `${month}월`).join(", ") : "";
}

export function displayMonthSplit(bestMonths: number[], cautionMonths: number[]) {
  const cautionSet = new Set(cautionMonths);
  return {
    bestMonths: bestMonths.filter((month) => !cautionSet.has(month)),
    cautionMonths,
  };
}

export function buildMonthHighlights(decision: DecisionAnalysis, domains = Object.keys(decision.decisionSummaryIndex.bestMonthsByDomain) as DecisionDomain[]) {
  const highlights: string[] = [];

  domains.forEach((domain) => {
    const split = displayMonthSplit(
      decision.decisionSummaryIndex.bestMonthsByDomain[domain] ?? [],
      decision.decisionSummaryIndex.cautionMonthsByDomain[domain] ?? [],
    );
    const bestMonths = split.bestMonths;
    const cautionMonths = decision.decisionSummaryIndex.cautionMonthsByDomain[domain] ?? [];

    if (bestMonths.length > 0) {
      highlights.push(`${domainTitle(domain)}: 유리 신호 월 ${monthList(bestMonths)}`);
    }
    if (cautionMonths.length > 0) {
      highlights.push(`${domainTitle(domain)}: 주의 신호 월 ${monthList(cautionMonths)}`);
    }
  });

  return highlights;
}
