import type { DecisionDomain, ReaderStatus } from "@/src/lib/decision";

export type ServiceLevel = "GOOD" | "NORMAL" | "CAUTION" | "MIXED";

export type ServiceLabel = {
  serviceLevel: ServiceLevel;
  label: "좋음" | "보통" | "주의" | "기회와 주의";
  stars: 1 | 2 | 3 | 4 | 5;
  shortSummary: string;
};

type ServiceLabelInput = {
  domain: DecisionDomain;
  opportunityScore: number;
  riskScore: number;
  readerStatus: ReaderStatus;
};

function isRiskFirstDomain(domain: DecisionDomain) {
  return domain === "health" || domain === "stress" || domain === "legalRisk";
}

function clampStars(value: number): 1 | 2 | 3 | 4 | 5 {
  return Math.max(1, Math.min(5, Math.round(value))) as 1 | 2 | 3 | 4 | 5;
}

function shortSummaryFor(level: ServiceLevel) {
  if (level === "GOOD") return "활용 신호가 비교적 선명합니다.";
  if (level === "MIXED") return "기회와 점검 신호가 함께 있습니다.";
  if (level === "CAUTION") return "주의 깊게 살펴볼 신호가 강합니다.";
  return "크게 치우치지 않고 차분히 볼 영역입니다.";
}

export function serviceLabelForDecision(input: ServiceLabelInput): ServiceLabel {
  const { domain, opportunityScore, riskScore } = input;

  if (isRiskFirstDomain(domain) && riskScore >= 70) {
    return {
      serviceLevel: "CAUTION",
      label: "주의",
      stars: 1,
      shortSummary: shortSummaryFor("CAUTION"),
    };
  }

  if (opportunityScore >= 80 && riskScore < 50) {
    return {
      serviceLevel: "GOOD",
      label: "좋음",
      stars: clampStars(opportunityScore >= 90 ? 5 : 4),
      shortSummary: shortSummaryFor("GOOD"),
    };
  }

  if (opportunityScore >= 70 && riskScore < 50) {
    return {
      serviceLevel: "GOOD",
      label: "좋음",
      stars: 4,
      shortSummary: shortSummaryFor("GOOD"),
    };
  }

  if (opportunityScore >= 70 && riskScore >= 50) {
    return {
      serviceLevel: "MIXED",
      label: "기회와 주의",
      stars: 3,
      shortSummary: shortSummaryFor("MIXED"),
    };
  }

  if (riskScore >= 70) {
    return {
      serviceLevel: "CAUTION",
      label: "주의",
      stars: riskScore >= 85 ? 1 : 2,
      shortSummary: shortSummaryFor("CAUTION"),
    };
  }

  if (opportunityScore >= 50 && opportunityScore <= 69 && riskScore < 70) {
    return {
      serviceLevel: "NORMAL",
      label: "보통",
      stars: 3,
      shortSummary: shortSummaryFor("NORMAL"),
    };
  }

  return {
    serviceLevel: "NORMAL",
    label: "보통",
    stars: 3,
    shortSummary: shortSummaryFor("NORMAL"),
  };
}
