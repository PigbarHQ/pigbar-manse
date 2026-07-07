import type { DecisionDomain } from "@/src/lib/decision";
import type { ServiceLevel } from "./serviceLabels";

const copyByDomain: Partial<Record<DecisionDomain, Record<ServiceLevel, string>>> = {
  wealth: {
    GOOD: "성과와 재물 흐름을 활용하기 좋은 구간입니다.",
    NORMAL: "재물 흐름은 차분히 확인할 영역입니다.",
    CAUTION: "지출, 분산, 현금흐름을 점검하는 편이 좋습니다.",
    MIXED: "성과 기회는 있으나 돈의 흐름과 분산을 함께 봐야 합니다.",
  },
  career: {
    GOOD: "직장 안에서 역할과 책임을 활용할 수 있는 흐름입니다.",
    NORMAL: "직장 흐름은 크게 치우치지 않고 안정적으로 보는 영역입니다.",
    CAUTION: "직장 자체가 나쁘다는 뜻은 아니며, 역할·평가·책임 변화를 점검할 시기입니다.",
    MIXED: "기회와 책임이 함께 나타나므로 역할 변화와 부담을 함께 살펴야 합니다.",
  },
  business: {
    GOOD: "실행, 생산, 성과 흐름이 비교적 뚜렷합니다.",
    NORMAL: "사업 흐름은 조건을 확인하며 차분히 볼 영역입니다.",
    CAUTION: "사업 자체보다 계약, 사람, 속도 조절이 중요합니다.",
    MIXED: "성과 기회는 있으나 계약과 사람 관계를 함께 점검해야 합니다.",
  },
  businessStart: {
    GOOD: "새로운 일을 시작하는 힘이 비교적 뚜렷합니다.",
    NORMAL: "시작보다 준비 조건을 먼저 살펴볼 영역입니다.",
    CAUTION: "시작 자체보다 계약, 자금, 사람 조건을 조심스럽게 봐야 합니다.",
    MIXED: "시작 신호는 있으나 부담 조건도 함께 나타납니다.",
  },
  businessExpansion: {
    GOOD: "확장과 성장 쪽 신호가 비교적 선명합니다.",
    NORMAL: "확장은 속도보다 조건을 확인하며 보는 영역입니다.",
    CAUTION: "확장 자체보다 비용, 계약, 관계 부담을 점검해야 합니다.",
    MIXED: "확장 기회는 있으나 변동성과 부담을 함께 봐야 합니다.",
  },
  health: {
    GOOD: "컨디션 관리 흐름은 비교적 안정적으로 볼 수 있습니다.",
    NORMAL: "건강은 기본 관리와 생활 리듬을 유지하는 것이 중요합니다.",
    CAUTION: "건강이 나쁘다는 뜻은 아니며, 피로·스트레스·몸의 균형 관리 신호가 강합니다.",
    MIXED: "활동성은 있으나 회복과 관리 리듬을 함께 챙겨야 합니다.",
  },
  legalRisk: {
    GOOD: "문서와 조건을 차분히 확인하면 큰 무리는 적은 흐름입니다.",
    NORMAL: "문서와 조건을 차분히 확인하면 큰 무리는 적은 흐름입니다.",
    CAUTION: "계약, 문서, 규정, 책임 범위를 명확히 확인하는 편이 좋습니다.",
    MIXED: "기회가 있더라도 문서와 조건 확인을 함께 가져가야 합니다.",
  },
  stress: {
    GOOD: "부담 신호가 크게 몰리지 않아 리듬을 안정적으로 볼 수 있습니다.",
    NORMAL: "부담은 생활 리듬 안에서 차분히 관리할 영역입니다.",
    CAUTION: "책임과 변동 신호가 겹치므로 피로와 긴장도를 살펴야 합니다.",
    MIXED: "활동 신호와 부담 신호가 함께 나타납니다.",
  },
  investment: {
    GOOD: "배분과 성과 흐름을 활용할 여지가 있습니다.",
    NORMAL: "투자는 조건을 확인하며 차분히 볼 영역입니다.",
    CAUTION: "분산, 변동성, 현금흐름을 함께 점검해야 합니다.",
    MIXED: "성과 신호는 있으나 변동성도 함께 나타납니다.",
  },
  contract: {
    GOOD: "계약과 문서 흐름을 활용할 여지가 있습니다.",
    NORMAL: "계약 조건은 차분히 확인하면 무리가 적은 편입니다.",
    CAUTION: "문서, 조건, 책임 범위를 꼼꼼히 살펴야 합니다.",
    MIXED: "계약 기회와 조건 점검이 함께 필요한 흐름입니다.",
  },
};

const genericCopy: Record<ServiceLevel, string> = {
  GOOD: "활용 가능한 신호가 비교적 선명합니다.",
  NORMAL: "크게 치우치지 않고 차분히 볼 영역입니다.",
  CAUTION: "주의 깊게 살펴볼 신호가 강합니다.",
  MIXED: "기회와 점검 신호가 함께 나타납니다.",
};

export function domainShortCopy(domain: DecisionDomain, level: ServiceLevel) {
  return copyByDomain[domain]?.[level] ?? genericCopy[level];
}
