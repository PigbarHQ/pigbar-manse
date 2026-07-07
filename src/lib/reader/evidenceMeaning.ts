const EXACT_MEANINGS: Record<string, string> = {
  CAREER_OFFICER_PRESENT: "직장·책임·역할 관련 신호가 확인됩니다.",
  CAREER_RESOURCE_OFFICER_LINK: "책임을 감당할 수 있는 보호·지원 신호가 함께 나타납니다.",
  ORGANIZATION_DIRECT_OFFICER_PRESENT_FACT: "조직 안에서 공식적인 역할이나 책임이 강조되는 구조입니다.",
  AUTHORITY_OFFICER_COUNT_GE_2_FACT: "권한·평가·상사·규칙과 관련된 신호가 반복됩니다.",
  AUTHORITY_INDIRECT_OFFICER_PRESENT_FACT: "직접적인 권한보다 간접적인 압박이나 책임 신호가 나타납니다.",
  MANAGEMENT_OUTPUT_OFFICER_CO_OCCURRENCE: "실행력과 관리 책임이 함께 작동하는 구조입니다.",
  STRESS_CLASH_CLUSTER_FACT: "충돌·변동성·심리적 압박 신호가 함께 나타납니다.",
  LEGAL_RELATION_PRESENT_FACT: "계약·규정·문서·법적 검토와 관련된 주의 신호가 있습니다.",
  CASHFLOW_PEER_WEALTH_CO_OCCURRENCE_FACT: "돈의 흐름과 경쟁·분산 신호가 함께 나타납니다.",
  MONTH_SUPPORTS_OFFICER: "특정 월에 직장·책임 관련 신호가 활성화됩니다.",
  MONTH_SUPPORTS_RESOURCE: "특정 월에 문서·지원·준비 관련 신호가 활성화됩니다.",
  MONTH_SUPPORTS_WEALTH: "특정 월에 재물·거래·성과 관련 신호가 활성화됩니다.",
  BUSINESS_OUTPUT_PRESENT: "실행·생산·표현과 관련된 신호가 확인됩니다.",
  BUSINESS_OUTPUT_COUNT_GE_2: "실행과 생산에 해당하는 신호가 반복됩니다.",
  BUSINESS_INDIRECT_WEALTH_PRESENT_FACT: "성과와 재물 흐름이 함께 잡히는 신호가 있습니다.",
  BUSINESS_DIRECT_WEALTH_PRESENT_FACT: "성과가 구체적인 결과로 이어질 수 있는 신호가 있습니다.",
  WEALTH_TENGOD_PRESENT: "재물·거래·성과와 관련된 기본 신호가 확인됩니다.",
  WEALTH_TENGOD_CLUSTER: "재물·거래·성과 관련 신호가 여러 번 나타납니다.",
  HEALTH_MISSING_ELEMENT: "몸의 균형과 리듬을 점검해야 하는 신호가 있습니다.",
  HEALTH_ELEMENT_SPREAD: "몸과 생활 리듬을 여러 방향에서 관리해야 하는 흐름입니다.",
  STRESS_ELEMENT_SPREAD_GE_3_FACT: "부담이 한 가지가 아니라 여러 갈래로 분산되는 신호가 있습니다.",
  STRESS_OFFICER_COUNT_GE_2_FACT: "책임·압박과 관련된 신호가 반복됩니다.",
  ACCIDENT_RELATION_COUNT_GE_2_FACT: "이동·변동과 관련된 주의 신호가 반복됩니다.",
  SPOUSE_PALACE_RELATION_PRESENT_FACT: "가까운 관계의 자리에서 조율이 필요한 신호가 있습니다.",
};

const GROUP_MEANINGS: Record<string, string> = {
  careerSignals: "직장과 역할에 관한 신호가 포함되어 있습니다.",
  organizationSignals: "조직 안의 위치와 공식 책임에 관한 신호가 포함되어 있습니다.",
  authoritySignals: "권한, 평가, 규칙, 상사와 관련된 신호가 포함되어 있습니다.",
  managementSignals: "관리 책임과 운영 흐름에 관한 신호가 포함되어 있습니다.",
  stressSignals: "부담과 압박을 점검해야 하는 신호가 포함되어 있습니다.",
  legalRiskSignals: "계약, 규정, 문서 검토와 관련된 주의 신호가 포함되어 있습니다.",
  businessSignals: "실행, 생산, 사업 흐름에 관한 신호가 포함되어 있습니다.",
  entrepreneurSignals: "새로운 시도와 독립적 실행에 관한 신호가 포함되어 있습니다.",
  salesSignals: "성과를 밖으로 드러내는 흐름과 관련된 신호가 포함되어 있습니다.",
  wealthSignals: "재물, 거래, 성과와 관련된 신호가 포함되어 있습니다.",
  cashflowSignals: "돈의 흐름과 분산을 함께 점검해야 하는 신호가 포함되어 있습니다.",
  healthSignals: "몸의 리듬과 균형을 점검해야 하는 신호가 포함되어 있습니다.",
  accidentSignals: "이동과 변동 과정에서 조심스럽게 살필 신호가 포함되어 있습니다.",
  contractTimingSignals: "계약, 문서, 규정과 관련된 시기 신호가 포함되어 있습니다.",
  careerTimingSignals: "직장과 책임이 활성화되는 시기 신호가 포함되어 있습니다.",
};

export function evidenceMeaning(code: string) {
  if (EXACT_MEANINGS[code]) return EXACT_MEANINGS[code];

  const highRelation = code.match(/^HIGH_RELATION_MONTH_(\d+)$/);
  if (highRelation) return `${highRelation[1]}월에 충돌·변동성 신호가 강합니다.`;

  if (/MONTH_SUPPORTS_OUTPUT/.test(code)) return "특정 월에 실행·생산 관련 신호가 활성화됩니다.";
  if (/MONTH_SUPPORTS_RESOURCE/.test(code)) return "특정 월에 문서·지원·준비 관련 신호가 활성화됩니다.";
  if (/MONTH_SUPPORTS_OFFICER/.test(code)) return "특정 월에 직장·책임 관련 신호가 활성화됩니다.";
  if (/MONTH_SUPPORTS_WEALTH/.test(code)) return "특정 월에 재물·거래·성과 관련 신호가 활성화됩니다.";
  if (/CLASH/.test(code)) return "충돌·변동성 신호가 나타납니다.";
  if (/COMBINATION/.test(code)) return "연결과 조율에 해당하는 신호가 나타납니다.";

  return null;
}

export function sourceGroupMeaning(group: string) {
  return GROUP_MEANINGS[group] ?? null;
}

