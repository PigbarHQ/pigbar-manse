import type { DecisionAnalysis, DecisionDomain } from "@/src/lib/decision";
import { domainTitle } from "./domainText";

export type ServiceMonthlyTone = "ACTIVE" | "PREPARE" | "CAUTION" | "MIXED" | "STABLE";

export type ServiceMonthlyStrategy = {
  month: number;
  tone: ServiceMonthlyTone;
  title: string;
  goodFor: string[];
  watchFor: string[];
  summary: string;
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function monthDomains(index: Record<DecisionDomain, number[]>, month: number) {
  return (Object.entries(index) as Array<[DecisionDomain, number[]]>)
    .filter(([, months]) => months.includes(month))
    .map(([domain]) => domain);
}

function isWatchOnlyDomain(domain: DecisionDomain) {
  return domain === "health" || domain === "stress" || domain === "legalRisk";
}

function hasResourceSignal(decision: DecisionAnalysis, month: number) {
  return decision.domainDecisions.some((domain) =>
    [...domain.bestMonths, ...domain.cautionMonths].some((item) => item.month === month && item.reasonCodes.some((code) => /RESOURCE/.test(code))),
  );
}

function toneFor(input: { goodFor: string[]; watchFor: string[]; resource: boolean }): ServiceMonthlyTone {
  if (input.goodFor.length > 0 && input.watchFor.length > 0) return "MIXED";
  if (input.goodFor.length >= 3 && input.watchFor.length <= 1) return "ACTIVE";
  if (input.watchFor.length >= 3) return "CAUTION";
  if (input.resource) return "PREPARE";
  return "STABLE";
}

function titleFor(tone: ServiceMonthlyTone, goodFor: string[], watchFor: string[]) {
  if (tone === "MIXED") return "변화와 책임이 함께 나타나는 달";
  if (tone === "ACTIVE") return `${goodFor.slice(0, 2).join("·")} 신호가 모이는 달`;
  if (tone === "CAUTION") return "점검과 조율이 필요한 달";
  if (tone === "PREPARE") return "준비와 문서 정리에 유리한 달";
  if (watchFor.length > 0) return "차분한 확인이 필요한 달";
  return "흐름을 안정적으로 유지하는 달";
}

function summaryFor(tone: ServiceMonthlyTone, goodFor: string[], watchFor: string[]) {
  const goodText = compactDomainList(goodFor);
  const watchText = compactDomainList(watchFor);

  if (tone === "MIXED") {
    return `${goodText} 신호가 있으나 ${watchText} 점검 신호도 함께 나타납니다. 새로운 가능성과 기존 조건을 함께 보는 달입니다.`;
  }
  if (tone === "ACTIVE") {
    return `${goodText} 신호가 함께 잡히는 달입니다. 올해 중 실행력을 비교적 적극적으로 활용할 수 있는 구간으로 볼 수 있습니다.`;
  }
  if (tone === "CAUTION") {
    return "여러 영역에서 변동성 신호가 함께 나타납니다. 새로운 결정은 조건 확인과 준비의 비중이 커지는 달입니다.";
  }
  if (tone === "PREPARE") {
    return "문서, 지원, 준비와 관련된 신호가 비교적 안정적으로 나타납니다. 계획을 정리하거나 필요한 기반을 다지는 데 적합합니다.";
  }
  return "강하게 치우친 신호가 적은 달입니다. 기존 흐름을 정리하고 필요한 조건을 차분히 확인하기에 적합합니다.";
}

function compactDomainList(values: string[]) {
  if (values.length >= 10) return "여러 영역";
  if (values.length > 5) return `${values.slice(0, 3).join(", ")} 등 여러 영역`;
  return values.join(", ");
}

export function buildServiceMonthlyStrategy(decision: DecisionAnalysis): ServiceMonthlyStrategy[] {
  return Array.from({ length: 12 }, (_, index) => index + 1).map((month) => {
    const bestDomains = monthDomains(decision.decisionSummaryIndex.bestMonthsByDomain, month);
    const cautionDomains = monthDomains(decision.decisionSummaryIndex.cautionMonthsByDomain, month);
    const goodFor = unique(bestDomains.filter((domain) => !isWatchOnlyDomain(domain)).map(domainTitle));
    const watchFor = unique([...cautionDomains, ...bestDomains.filter(isWatchOnlyDomain)].map(domainTitle));
    const resource = hasResourceSignal(decision, month);
    const tone = toneFor({ goodFor, watchFor, resource });

    return {
      month,
      tone,
      title: titleFor(tone, goodFor, watchFor),
      goodFor,
      watchFor,
      summary: summaryFor(tone, goodFor, watchFor),
    };
  });
}
