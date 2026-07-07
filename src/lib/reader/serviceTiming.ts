import type { DecisionDomain } from "@/src/lib/decision";
import { domainTitle } from "./domainText";
import type { ServiceMonthlyStrategy } from "./monthlyStrategy";

export type ServiceTimingSummary = {
  primaryActiveMonths: number[];
  primaryMixedMonths: number[];
  primaryCautionMonths: number[];
  activeLabel: string;
  mixedLabel: string;
  cautionLabel: string;
};

function monthLabel(months: number[]) {
  return months.map((month) => `${month}월`).join(", ");
}

function compactMonthLabel(months: number[]) {
  return months.map((month) => `${month}월`).join("·");
}

function priorityFor(month: ServiceMonthlyStrategy) {
  const goodCount = month.goodFor.length;
  const watchCount = month.watchFor.length;

  if (month.tone === "ACTIVE") return goodCount * 3 - watchCount;
  if (month.tone === "PREPARE") return goodCount * 2 + 1;
  if (month.tone === "MIXED") return goodCount + watchCount * 2;
  if (month.tone === "CAUTION") return watchCount * 3;
  return 0;
}

function sortedMonths(monthlyStrategy: ServiceMonthlyStrategy[], tones: ServiceMonthlyStrategy["tone"][]) {
  return monthlyStrategy
    .filter((month) => tones.includes(month.tone))
    .sort((left, right) => priorityFor(right) - priorityFor(left) || left.month - right.month);
}

export function buildServiceTimingSummary(monthlyStrategy: ServiceMonthlyStrategy[]): ServiceTimingSummary {
  const primaryActiveMonths = sortedMonths(monthlyStrategy, ["ACTIVE", "PREPARE"]).slice(0, 2).map((month) => month.month);
  const primaryMixedMonths = sortedMonths(monthlyStrategy, ["MIXED"]).slice(0, 1).map((month) => month.month);
  const primaryCautionMonths = sortedMonths(monthlyStrategy, ["CAUTION"]).slice(0, 4).map((month) => month.month);

  return {
    primaryActiveMonths,
    primaryMixedMonths,
    primaryCautionMonths,
    activeLabel: monthLabel(primaryActiveMonths),
    mixedLabel: monthLabel(primaryMixedMonths),
    cautionLabel: compactMonthLabel(primaryCautionMonths),
  };
}

export function timingLineForDomain(input: {
  domain: DecisionDomain;
  timing: ServiceTimingSummary;
  activeMonths: number[];
  cautionMonths: number[];
}) {
  const active = input.activeMonths.filter((month) => input.timing.primaryActiveMonths.includes(month));
  const mixed = input.activeMonths.filter((month) => input.timing.primaryMixedMonths.includes(month));
  const caution = input.cautionMonths.filter((month) => input.timing.primaryCautionMonths.includes(month));
  const parts: string[] = [];

  if (active.length > 0) parts.push(`${monthLabel(active)}에는 활용 신호가 있습니다`);
  if (mixed.length > 0) parts.push(`${monthLabel(mixed)}에는 변화 검토 신호가 있습니다`);
  if (caution.length > 0) parts.push(`${compactMonthLabel(caution)}에는 점검 신호가 함께 나타납니다`);

  if (parts.length === 0) return `${domainTitle(input.domain)}은 핵심 월보다 전체 흐름 안에서 차분히 볼 영역입니다.`;
  return `${parts.join(", ")}.`;
}
