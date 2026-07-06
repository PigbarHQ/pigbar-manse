import type { DecisionDomain } from "@/src/lib/decision";

export const DOMAIN_TITLES: Record<DecisionDomain, string> = {
  wealth: "재물",
  career: "직장",
  business: "사업",
  jobChange: "이직",
  businessStart: "창업",
  businessExpansion: "확장",
  partnership: "동업",
  investment: "투자",
  property: "부동산",
  contract: "계약",
  relationship: "인간관계",
  spouse: "부부",
  family: "가족",
  children: "자녀",
  parent: "부모",
  health: "건강",
  stress: "스트레스",
  mobility: "이동",
  travel: "여행",
  overseas: "해외",
  study: "학업/자격",
  reputation: "평판",
  legalRisk: "법적 리스크",
  communication: "커뮤니케이션",
  leadership: "리더십",
};

export function domainTitle(domain: DecisionDomain) {
  return DOMAIN_TITLES[domain];
}
