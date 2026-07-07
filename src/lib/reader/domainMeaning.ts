import type { DomainDecision } from "@/src/lib/decision";
import { domainShortCopy } from "./domainShortCopy";
import { domainTitle } from "./domainText";
import { evidenceMeaning, sourceGroupMeaning } from "./evidenceMeaning";
import { serviceLabelForDecision } from "./serviceLabels";

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function meanings(codes: string[]) {
  return semanticUnique(unique(codes.map((code) => evidenceMeaning(code)).filter((value): value is string => Boolean(value)))).slice(0, 6);
}

function groupMeanings(groups: string[]) {
  return semanticUnique(unique(groups.map((group) => sourceGroupMeaning(group)).filter((value): value is string => Boolean(value)))).slice(0, 4);
}

function semanticUnique(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = semanticKey(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function semanticKey(value: string) {
  if (/실행|생산|표현/.test(value)) return "output";
  if (/성과|재물|거래/.test(value)) return "wealth";
  if (/책임|역할|직장|권한|평가|상사|규칙/.test(value)) return "career-authority";
  if (/충돌|변동성/.test(value)) return "relation-pressure";
  if (/계약|규정|문서|법적/.test(value)) return "contract-legal";
  if (/피로|스트레스|몸|균형|리듬|부담|압박/.test(value)) return "health-stress";
  return value;
}

function userFriendlyStatus(decision: DomainDecision) {
  if (decision.opportunityScore >= 70 && decision.riskScore < 50) return "활용 신호가 비교적 선명한 영역";
  if (decision.opportunityScore >= 70 && decision.riskScore >= 50) return "기회와 주의가 함께 있는 영역";
  if (decision.opportunityScore >= 50 && decision.riskScore >= 50) return "주의와 준비가 필요한 영역";
  if (decision.riskScore >= 50) return "점검을 우선해야 하는 영역";
  return "차분히 흐름을 보는 영역";
}

function headline(decision: DomainDecision) {
  if (decision.domain === "career") return "조직 안의 책임과 역할 변화에 신경 쓸 시기입니다.";
  if (decision.domain === "business") return "실행·생산·성과 흐름을 활용할 수 있는 영역입니다.";
  if (decision.domain === "businessStart") return "새로운 일을 시작할 때 조건과 속도를 함께 봐야 합니다.";
  if (decision.domain === "businessExpansion") return "확장 신호는 있으나 관계와 계약 조건을 함께 살펴야 합니다.";
  if (decision.domain === "health") return "몸의 균형과 피로 신호를 점검해야 하는 영역입니다.";
  if (decision.domain === "stress") return "부담이 여러 방향으로 분산되는 흐름을 살펴야 합니다.";
  if (decision.domain === "wealth") return "재물·거래·성과 흐름을 현실적으로 점검할 영역입니다.";
  if (decision.domain === "investment") return "투자·배분과 관련된 기회와 변동성을 함께 봐야 합니다.";
  if (decision.domain === "contract") return "계약과 문서 조건을 차분히 확인해야 하는 영역입니다.";
  if (decision.domain === "mobility" || decision.domain === "travel") return "이동과 변화가 생기기 쉬운 영역입니다.";
  if (decision.domain === "leadership") return "앞에서 조율하고 책임지는 역할이 두드러질 수 있습니다.";
  if (decision.domain === "communication") return "말과 표현이 관계와 성과에 영향을 주는 영역입니다.";
  return `${domainTitle(decision.domain)} 영역은 올해의 주요 흐름 안에서 차분히 살펴볼 지점입니다.`;
}

function summary(decision: DomainDecision) {
  const title = domainTitle(decision.domain);
  const groups = new Set(decision.sourceSignalGroups);

  if (decision.domain === "career" && (groups.has("organizationSignals") || groups.has("authoritySignals") || groups.has("stressSignals") || groups.has("legalRiskSignals"))) {
    return "직장 자체가 나쁘다는 의미는 아닙니다. 다만 올해는 조직 안에서 책임, 역할, 평가, 규칙과 관련된 신호가 강하게 나타납니다. 업무 부담이나 조직 변화에 대응해야 하는 흐름으로 읽는 것이 적절합니다.";
  }

  if (decision.domain === "business") {
    return "사업 영역은 실행·생산·영업·재물 흐름이 함께 잡히는 구조입니다. 성과를 만들기 위한 움직임에는 긍정적인 신호가 있으나, 계약이나 사람 관계가 얽히는 달에는 변동성 신호도 함께 나타납니다.";
  }

  if (decision.domain === "health") {
    return "건강이 나쁘다는 뜻이 아닙니다. 다만 현재 흐름에서는 피로, 스트레스, 몸의 균형 관리에 신경 쓸 필요가 있다는 신호가 강합니다. 구체적인 건강 판단은 의료 전문가의 영역입니다.";
  }

  if (decision.domain === "stress") {
    return "스트레스가 반드시 커진다는 뜻은 아닙니다. 여러 책임과 변동 신호가 겹칠 수 있으므로 부담이 한곳에 쌓이지 않도록 흐름을 나누어 보는 것이 좋습니다.";
  }

  if (decision.riskScore >= 50 && decision.opportunityScore >= 70) {
    return `${title} 영역은 활용할 수 있는 신호와 점검이 필요한 신호가 함께 있습니다. 좋은 조건과 부담 조건이 동시에 나타나는 영역입니다.`;
  }

  if (decision.opportunityScore >= 70) {
    return `${title} 영역은 올해 비교적 활용 가능한 신호가 선명합니다. 힘이 살아나는 조건을 함께 살펴볼 영역입니다.`;
  }

  if (decision.riskScore >= 50) {
    return `${title} 영역은 나쁘다는 뜻이 아니라 점검해야 할 신호가 상대적으로 많다는 의미입니다. 부담이 커지는 지점을 차분히 살펴볼 영역입니다.`;
  }

  return `${title} 영역은 크게 치우치지 않고 차분히 확인할 영역입니다.`;
}

function timingSummary(decision: DomainDecision) {
  const best = decision.bestMonths.map((month) => `${month.month}월`).slice(0, 4);
  const caution = decision.cautionMonths.map((month) => `${month.month}월`).slice(0, 4);

  if (best.length > 0 && caution.length > 0) {
    return `${best.join(", ")}에는 활용 신호가 있고, ${caution.join(", ")}에는 조건 확인과 조율 신호가 함께 나타납니다.`;
  }
  if (best.length > 0) return `${best.join(", ")}에는 활용하기 좋은 신호가 비교적 선명합니다.`;
  if (caution.length > 0) return `${caution.join(", ")}에는 조건 확인과 조율이 필요한 신호가 나타납니다.`;
  return "특정 월에 강하게 치우친 신호는 크지 않습니다.";
}

export function buildServiceDomainReport(decision: DomainDecision) {
  const serviceLabel = serviceLabelForDecision(decision);

  return {
    domain: decision.domain,
    title: domainTitle(decision.domain),
    serviceLevel: serviceLabel.serviceLevel,
    label: serviceLabel.label,
    stars: serviceLabel.stars,
    shortSummary: domainShortCopy(decision.domain, serviceLabel.serviceLevel),
    headline: headline(decision),
    summary: summary(decision),
    positiveMeanings: semanticUnique(unique([...meanings(decision.positiveEvidenceCodes), ...groupMeanings(decision.sourceSignalGroups)])).slice(0, 6),
    cautionMeanings: meanings(decision.riskEvidenceCodes).slice(0, 6),
    timingSummary: timingSummary(decision),
    userFriendlyStatus: userFriendlyStatus(decision),
  };
}
