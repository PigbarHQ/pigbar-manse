const EXACT_LABELS: Record<string, string> = {
  BUSINESS_OUTPUT_PRESENT: "생산/표현 신호가 확인됨",
  BUSINESS_OUTPUT_COUNT_GE_2: "실행·생산 관련 신호가 반복됨",
  BUSINESS_INDIRECT_WEALTH_PRESENT_FACT: "사업성과 재물 흐름이 함께 잡힘",
  CURRENT_DAEUN_SUPPORTS_WEALTH: "현재 대운에서 재물 관련 신호가 활성화됨",
  CURRENT_YEAR_SUPPORTS_WEALTH: "해당 연도에 재물 관련 신호가 활성화됨",
  MONTH_SUPPORTS_WEALTH: "특정 월에 재물 관련 신호가 활성화됨",
  CURRENT_DAEUN_SUPPORTS_OUTPUT: "현재 대운에서 생산/표현 관련 신호가 활성화됨",
  CURRENT_YEAR_SUPPORTS_OUTPUT: "해당 연도에 생산/표현 관련 신호가 활성화됨",
  MONTH_SUPPORTS_OUTPUT: "특정 월에 생산/표현 관련 신호가 활성화됨",
  CURRENT_DAEUN_SUPPORTS_OFFICER: "현재 대운에서 책임/제도 관련 신호가 활성화됨",
  CURRENT_YEAR_SUPPORTS_OFFICER: "해당 연도에 책임/제도 관련 신호가 활성화됨",
  MONTH_SUPPORTS_OFFICER: "특정 월에 책임/제도 관련 신호가 활성화됨",
  CURRENT_DAEUN_SUPPORTS_RESOURCE: "현재 대운에서 준비/학습 관련 신호가 활성화됨",
  CURRENT_YEAR_SUPPORTS_RESOURCE: "해당 연도에 준비/학습 관련 신호가 활성화됨",
  MONTH_SUPPORTS_RESOURCE: "특정 월에 준비/학습 관련 신호가 활성화됨",
  HEALTH_MISSING_ELEMENT: "균형 점검이 필요한 신호가 있음",
  HEALTH_ELEMENT_SPREAD: "여러 요소가 넓게 분포함",
  STRESS_ELEMENT_SPREAD_GE_3_FACT: "부담 신호가 여러 갈래로 분산됨",
  STRESS_OFFICER_COUNT_GE_2_FACT: "책임/압박 관련 신호가 반복됨",
  STRESS_CLASH_CLUSTER_FACT: "충돌성 부담 신호가 모여 있음",
  ACCIDENT_RELATION_COUNT_GE_2_FACT: "변동성 관계 신호가 반복됨",
  LEGAL_RELATION_PRESENT_FACT: "계약/규칙 관련 주의 신호가 있음",
  SPOUSE_PALACE_RELATION_PRESENT_FACT: "관계 자리의 변동 신호가 있음",
  CASHFLOW_PEER_WEALTH_CO_OCCURRENCE_FACT: "재물 흐름과 경쟁성 신호가 함께 나타남",
  WEALTH_TENGOD_PRESENT: "재물 관련 기본 신호가 확인됨",
  WEALTH_TENGOD_CLUSTER: "재물 관련 신호가 모여 있음",
  WEALTH_HIDDEN_ONLY: "재물 관련 신호가 드러나기보다 내부에 놓임",
  HEALTH_MONTH_RELATION_PRESSURE: "특정 월에 관계 압력이 높아짐",
  HEALTH_MONTH_CLASH_PRESSURE: "특정 월에 충돌성 압력이 나타남",
  HEALTH_MONTH_PUNISHMENT_HARM_PRESSURE: "특정 월에 마찰성 압력이 나타남",
};

const PATTERN_LABELS: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^HIGH_RELATION_MONTH_(\d+)$/, (match) => `${match[1]}월에 충돌/변동 신호가 강함`],
  [/^MONTH_SUPPORTS_(WEALTH|OUTPUT|OFFICER|RESOURCE)$/, (match) => {
    const labels: Record<string, string> = {
      WEALTH: "재물",
      OUTPUT: "생산/표현",
      OFFICER: "책임/제도",
      RESOURCE: "준비/학습",
    };
    return `특정 월에 ${labels[match[1]]} 관련 신호가 활성화됨`;
  }],
  [/^CURRENT_YEAR_HAS_CLASH$/, () => "해당 연도에 충돌/변동 신호가 있음"],
  [/^CURRENT_YEAR_HAS_COMBINATION$/, () => "해당 연도에 결합/연결 신호가 있음"],
  [/^MONTH_HAS_CLASH$/, () => "특정 월에 충돌/변동 신호가 있음"],
  [/^MONTH_HAS_COMBINATION$/, () => "특정 월에 결합/연결 신호가 있음"],
  [/^.*WEALTH.*$/, () => "재물 관련 신호가 확인됨"],
  [/^.*OUTPUT.*$/, () => "생산/표현 관련 신호가 확인됨"],
  [/^.*OFFICER.*$/, () => "책임/제도 관련 신호가 확인됨"],
  [/^.*RESOURCE.*$/, () => "준비/학습 관련 신호가 확인됨"],
  [/^.*CLASH.*$/, () => "충돌/변동 관련 신호가 확인됨"],
  [/^.*COMBINATION.*$/, () => "결합/연결 관련 신호가 확인됨"],
  [/^.*HEALTH.*$/, () => "건강 영역의 점검 신호가 확인됨"],
  [/^.*STRESS.*$/, () => "부담 관리 신호가 확인됨"],
  [/^.*LEGAL.*$/, () => "계약/규칙 관련 주의 신호가 확인됨"],
];

export function evidenceLabel(code: string) {
  if (EXACT_LABELS[code]) return EXACT_LABELS[code];

  for (const [pattern, label] of PATTERN_LABELS) {
    const match = code.match(pattern);
    if (match) return label(match);
  }

  return null;
}

