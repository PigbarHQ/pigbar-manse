import type { BizRadarCompanyProfile } from "./company";
import { tenderBusinessTypeLabel, type TenderBusinessType } from "./tenders";

export type CompanyMatchStatus = "Match" | "Mismatch" | "Unknown";

export type CompanyMatchResult = {
  key: "industry" | "licenses" | "directProduction" | "region" | "technologies" | "certifications" | "performances";
  label: string;
  status: CompanyMatchStatus;
  evidence: string[];
  message: string;
};

export type TenderMatchInput = {
  title: string;
  businessType: TenderBusinessType;
  contractMethod?: string;
  bidMethod?: string;
  allowedRegions: string[];
  licenseRestrictions: string[];
  summaryText: string;
};

export function buildCompanyTenderMatch(company: BizRadarCompanyProfile | null, tender: TenderMatchInput): CompanyMatchResult[] {
  if (!company || !company.companyName.trim()) {
    return [
      unknown("industry", "업종", "회사 프로필을 먼저 등록해야 비교할 수 있습니다."),
      unknown("licenses", "면허", "회사 프로필을 먼저 등록해야 비교할 수 있습니다."),
      unknown("directProduction", "직접생산", "회사 프로필을 먼저 등록해야 비교할 수 있습니다."),
      unknown("region", "지역", "회사 프로필을 먼저 등록해야 비교할 수 있습니다."),
      unknown("technologies", "기술", "회사 프로필을 먼저 등록해야 비교할 수 있습니다."),
      unknown("certifications", "인증", "회사 프로필을 먼저 등록해야 비교할 수 있습니다."),
      unknown("performances", "실적", "회사 프로필을 먼저 등록해야 비교할 수 있습니다."),
    ];
  }

  const tenderText = normalizeText([
    tender.title,
    tenderBusinessTypeLabel(tender.businessType),
    tender.contractMethod,
    tender.bidMethod,
    tender.summaryText,
    ...tender.allowedRegions,
    ...tender.licenseRestrictions,
  ].join(" "));

  return [
    matchIndustry(company, tenderText),
    matchLicenses(company, tender.licenseRestrictions),
    matchDirectProduction(company, tenderText),
    matchRegion(company, tender.allowedRegions),
    matchList("technologies", "기술", company.technologies, tenderText, "기술 키워드가 공고명 또는 상세 정보에서 확인됩니다.", "기술 요구가 명확하지 않습니다. 첨부파일 또는 공고문 확인이 필요합니다."),
    matchList("certifications", "인증", company.certifications, tenderText, "보유 인증과 관련된 단서가 확인됩니다.", "인증 요구가 명확하지 않습니다. 공고문 확인이 필요합니다."),
    matchList("performances", "실적", company.majorPerformances, tenderText, "주요 실적과 유사한 사업 단서가 확인됩니다.", "실적 인정 여부는 추가 확인이 필요합니다."),
  ];
}

export function summarizeCompanyMatch(results: CompanyMatchResult[]) {
  return {
    match: results.filter((result) => result.status === "Match").length,
    mismatch: results.filter((result) => result.status === "Mismatch").length,
    unknown: results.filter((result) => result.status === "Unknown").length,
  };
}

function matchIndustry(company: BizRadarCompanyProfile, tenderText: string): CompanyMatchResult {
  if (!company.industry.trim()) return unknown("industry", "업종", "회사 업종이 등록되지 않았습니다.");
  const tokens = tokenize(company.industry);
  if (!tokens.length) return unknown("industry", "업종", "업종 키워드를 만들 수 없습니다.");

  const matched = tokens.filter((token) => tenderText.includes(token));
  if (matched.length) {
    return match("industry", "업종", matched, "회사 업종과 공고 내용이 일부 맞습니다.");
  }

  return unknown("industry", "업종", "업종 적합성은 공고문 세부 내용 확인이 필요합니다.");
}

function matchLicenses(company: BizRadarCompanyProfile, tenderLicenses: string[]): CompanyMatchResult {
  if (!tenderLicenses.length) return unknown("licenses", "면허", "공고에서 면허제한 정보가 확인되지 않았습니다.");
  if (!company.licenses.length) return mismatch("licenses", "면허", tenderLicenses, "공고에 면허제한이 있으나 회사 보유 면허가 등록되지 않았습니다.");

  const matched = tenderLicenses.filter((required) => company.licenses.some((owned) => looselyIncludes(owned, required)));
  if (matched.length) return match("licenses", "면허", matched, "공고 면허제한과 보유 면허가 일부 맞습니다.");

  return mismatch("licenses", "면허", tenderLicenses, "공고 면허제한과 보유 면허가 맞지 않을 수 있습니다.");
}

function matchDirectProduction(company: BizRadarCompanyProfile, tenderText: string): CompanyMatchResult {
  const hasTenderDirectProduction = tenderText.includes("직접생산");
  if (!hasTenderDirectProduction) return unknown("directProduction", "직접생산", "직접생산 요구 여부가 공고 상세에서 명확하지 않습니다.");
  if (!company.directProduction.trim()) return mismatch("directProduction", "직접생산", ["직접생산"], "공고에 직접생산 단서가 있으나 회사 직접생산 정보가 없습니다.");
  return match("directProduction", "직접생산", [company.directProduction], "직접생산 정보가 등록되어 있습니다.");
}

function matchRegion(company: BizRadarCompanyProfile, tenderRegions: string[]): CompanyMatchResult {
  if (!tenderRegions.length) return unknown("region", "지역", "참가가능지역 정보가 확인되지 않았습니다.");
  if (!company.region.trim()) return unknown("region", "지역", "회사 지역이 등록되지 않았습니다.");
  if (tenderRegions.some((region) => normalizeText(region).includes("전국"))) return match("region", "지역", ["전국"], "전국 참여 가능 공고입니다.");

  const matched = tenderRegions.filter((region) => looselyIncludes(company.region, region) || looselyIncludes(region, company.region));
  if (matched.length) return match("region", "지역", matched, "회사 지역과 참가가능지역이 맞습니다.");
  return mismatch("region", "지역", tenderRegions, "회사 지역이 참가가능지역과 다를 수 있습니다.");
}

function matchList(
  key: CompanyMatchResult["key"],
  label: string,
  values: string[],
  tenderText: string,
  matchedMessage: string,
  unknownMessage: string,
): CompanyMatchResult {
  if (!values.length) return unknown(key, label, `${label} 정보가 등록되지 않았습니다.`);

  const matched = values.filter((value) => tokenize(value).some((token) => tenderText.includes(token)));
  if (matched.length) return match(key, label, matched, matchedMessage);
  return unknown(key, label, unknownMessage);
}

function match(key: CompanyMatchResult["key"], label: string, evidence: string[], message: string): CompanyMatchResult {
  return { key, label, status: "Match", evidence: evidence.slice(0, 5), message };
}

function mismatch(key: CompanyMatchResult["key"], label: string, evidence: string[], message: string): CompanyMatchResult {
  return { key, label, status: "Mismatch", evidence: evidence.slice(0, 5), message };
}

function unknown(key: CompanyMatchResult["key"], label: string, message: string): CompanyMatchResult {
  return { key, label, status: "Unknown", evidence: [], message };
}

function looselyIncludes(left: string, right: string) {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);
  if (!normalizedLeft || !normalizedRight) return false;
  return normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft);
}

function tokenize(input: string) {
  return normalizeText(input)
    .split(/[\s/·,()［\][\]{}_-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function normalizeText(input: string) {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}
