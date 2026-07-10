export type FacilityCategory = "돌봄 서비스" | "상담기관" | "전체";

export type FacilityType =
  | "주간보호센터"
  | "방문요양"
  | "방문간호"
  | "방문목욕"
  | "단기보호"
  | "복지용구"
  | "요양원"
  | "치매안심센터"
  | "보건소"
  | "주민센터"
  | "복지관"
  | "전체";

export type LongTermCareFacilityCodeInfo = {
  code: string;
  name: string;
};

export type FacilityTypeOption = {
  category: FacilityCategory;
  label: FacilityType;
  codes: LongTermCareFacilityCodeInfo[];
  sourceStatus: "available" | "needs-source-confirmation";
};

export const LONG_TERM_CARE_FACILITY_TYPE_LABELS: Record<string, string> = {
  A01: "노인요양시설",
  A02: "노인전문요양시설",
  A03: "노인요양시설(개정법)",
  A04: "노인요양공동생활가정",
  A05: "노인요양시설(단기보호 전환)",
  AAA: "입소시설",
  B01: "재가노인복지시설 방문요양",
  B02: "재가노인복지시설 방문목욕",
  B03: "재가노인복지시설 주야간보호",
  B04: "재가노인복지시설 단기보호",
  B05: "재가노인복지시설 방문간호",
  C01: "재가장기요양기관 방문요양",
  C02: "재가장기요양기관 방문목욕",
  C03: "재가장기요양기관 주야간보호",
  C04: "재가장기요양기관 단기보호",
  C05: "재가장기요양기관 방문간호",
  C06: "재가장기요양기관 복지용구",
  S41: "치매전담형 노인요양공동생활가정",
  Z01: "기타",
};

const ltcCodes = (...codes: string[]) => codes.map((code) => ({
  code,
  name: LONG_TERM_CARE_FACILITY_TYPE_LABELS[code] ?? "확인 필요",
}));

export const FACILITY_TYPE_OPTIONS: FacilityTypeOption[] = [
  {
    category: "돌봄 서비스",
    label: "주간보호센터",
    codes: ltcCodes("B03", "C03"),
    sourceStatus: "available",
  },
  {
    category: "돌봄 서비스",
    label: "방문요양",
    codes: ltcCodes("B01", "C01"),
    sourceStatus: "available",
  },
  {
    category: "돌봄 서비스",
    label: "방문간호",
    codes: ltcCodes("B05", "C05"),
    sourceStatus: "available",
  },
  {
    category: "돌봄 서비스",
    label: "방문목욕",
    codes: ltcCodes("B02", "C02"),
    sourceStatus: "available",
  },
  {
    category: "돌봄 서비스",
    label: "단기보호",
    codes: ltcCodes("B04", "C04"),
    sourceStatus: "available",
  },
  {
    category: "돌봄 서비스",
    label: "복지용구",
    codes: ltcCodes("C06"),
    sourceStatus: "available",
  },
  {
    category: "돌봄 서비스",
    label: "요양원",
    codes: ltcCodes("A01", "A02", "A03", "A04", "A05", "AAA", "S41"),
    sourceStatus: "available",
  },
  {
    category: "상담기관",
    label: "치매안심센터",
    codes: [],
    sourceStatus: "needs-source-confirmation",
  },
  {
    category: "상담기관",
    label: "보건소",
    codes: [],
    sourceStatus: "needs-source-confirmation",
  },
  {
    category: "상담기관",
    label: "주민센터",
    codes: [],
    sourceStatus: "needs-source-confirmation",
  },
  {
    category: "상담기관",
    label: "복지관",
    codes: [],
    sourceStatus: "needs-source-confirmation",
  },
  {
    category: "전체",
    label: "전체",
    codes: [],
    sourceStatus: "available",
  },
];

export const FACILITY_TYPES = FACILITY_TYPE_OPTIONS.map((option) => option.label);

export const FACILITY_TYPE_GROUPS = ["돌봄 서비스", "상담기관", "전체"] as const;

export function getFacilityTypeOption(facilityType: FacilityType) {
  return FACILITY_TYPE_OPTIONS.find((option) => option.label === facilityType);
}

export function longTermCareCodesFor(facilityType: FacilityType) {
  const option = getFacilityTypeOption(facilityType);
  if (!option) return [];
  if (facilityType === "전체") {
    return Array.from(new Set(FACILITY_TYPE_OPTIONS
      .filter((item) => item.category === "돌봄 서비스")
      .flatMap((item) => item.codes.map((code) => code.code))));
  }
  return option.codes.map((item) => item.code);
}

export function labelForLongTermCareCode(code: string) {
  return LONG_TERM_CARE_FACILITY_TYPE_LABELS[code] ?? "확인 필요";
}

export function codeForLongTermCareLabel(value: string) {
  const normalized = value.trim();
  if (!normalized) return "";
  if (LONG_TERM_CARE_FACILITY_TYPE_LABELS[normalized]) return normalized;
  return Object.entries(LONG_TERM_CARE_FACILITY_TYPE_LABELS).find(([, label]) => label === normalized)?.[0] ?? "";
}
