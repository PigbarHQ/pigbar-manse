export type TenderBusinessType = "service" | "goods" | "construction" | "foreign" | "unknown";

export type TenderOpportunity = {
  id: string;
  bidNoticeNo: string;
  bidNoticeOrd?: string;
  title: string;
  businessType: TenderBusinessType;
  orderingAgency?: string;
  demandAgency?: string;
  noticeDate?: string;
  bidStartDate?: string;
  bidCloseDate?: string;
  openingDate?: string;
  estimatedPrice?: number;
  basePrice?: number;
  contractMethod?: string;
  bidMethod?: string;
  allowedRegions?: string[];
  licenseRestrictions?: string[];
  detailUrl?: string;
  attachments?: {
    name: string;
    url: string;
  }[];
  raw: unknown;
};

export type TenderSearchInput = {
  businessType: TenderBusinessType;
  keyword?: string;
  keywords?: string[];
  keywordMode?: "and";
  noticeStartDate?: string;
  noticeEndDate?: string;
  demandAgencyName?: string;
  bidNoticeNo?: string;
  regionRestriction?: TenderRestrictionFilter;
  licenseRestriction?: TenderRestrictionFilter;
  pageNo?: number;
  numOfRows?: number;
};

export type TenderRestrictionFilter = "all" | "yes" | "no";

export type TenderDetailInput = {
  businessType: TenderBusinessType;
  bidNoticeNo: string;
  bidNoticeOrd?: string;
};

export type TenderSupplementKind = "licenses" | "regions" | "base-price" | "history" | "attachments";

export type TenderSupplementInput = TenderDetailInput & {
  kind: TenderSupplementKind;
};

export type TenderListResponse = {
  source: "g2b-bid-public-info";
  operation: string;
  endpoint: string;
  fetchedAt: string;
  items: TenderOpportunity[];
  searchKeywords?: string[];
  keywordMode?: "and";
  raw: unknown;
};

export type TenderSupplementResponse = {
  source: "g2b-bid-public-info";
  kind: TenderSupplementKind;
  operation?: string;
  endpoint?: string;
  supported: boolean;
  fetchedAt: string;
  items: Record<string, unknown>[];
  raw: unknown;
};

export const BIZRADAR_TENDER_BASE_URL = "http://apis.data.go.kr/1230000/ad/BidPublicInfoService";

export const TENDER_SEARCH_OPERATIONS: Record<Exclude<TenderBusinessType, "unknown">, string> = {
  construction: "getBidPblancListInfoCnstwkPPSSrch",
  service: "getBidPblancListInfoServcPPSSrch",
  foreign: "getBidPblancListInfoFrgcptPPSSrch",
  goods: "getBidPblancListInfoThngPPSSrch",
};

export const TENDER_REFERENCE_OPERATIONS = {
  licenseRestrictions: "getBidPblancListInfoLicenseLimit",
  allowedRegions: "getBidPblancListInfoPrtcptPsblRgn",
  eorderAttachments: "getBidPblancListInfoEorderAtchFileInfo",
  goodsBasePrice: "getBidPblancListInfoThngBsisAmount",
  constructionBasePrice: "getBidPblancListInfoCnstwkBsisAmount",
  serviceBasePrice: "getBidPblancListInfoServcBsisAmount",
  goodsHistory: "getBidPblancListInfoChgHstryThng",
  constructionHistory: "getBidPblancListInfoChgHstryCnstwk",
  serviceHistory: "getBidPblancListInfoChgHstryServc",
};

const TENDER_BASE_PRICE_OPERATIONS: Partial<Record<TenderBusinessType, string>> = {
  construction: TENDER_REFERENCE_OPERATIONS.constructionBasePrice,
  goods: TENDER_REFERENCE_OPERATIONS.goodsBasePrice,
  service: TENDER_REFERENCE_OPERATIONS.serviceBasePrice,
};

const TENDER_HISTORY_OPERATIONS: Partial<Record<TenderBusinessType, string>> = {
  construction: TENDER_REFERENCE_OPERATIONS.constructionHistory,
  goods: TENDER_REFERENCE_OPERATIONS.goodsHistory,
  service: TENDER_REFERENCE_OPERATIONS.serviceHistory,
};

export class BizRadarApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "BizRadarApiError";
    this.status = status;
  }
}

export async function fetchTenderOpportunities(input: TenderSearchInput): Promise<TenderListResponse> {
  const businessType = normalizeBusinessType(input.businessType);
  if (businessType === "unknown") {
    throw new BizRadarApiError("지원하지 않는 업무구분입니다.", 400);
  }

  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!serviceKey) {
    throw new BizRadarApiError("DATA_GO_KR_SERVICE_KEY not found", 500);
  }

  if (input.bidNoticeNo?.trim()) {
    return fetchTenderOpportunitySingle(input, businessType, serviceKey);
  }

  const keywords = parseTenderKeywords(input.keywords?.length ? input.keywords : input.keyword);
  const primaryKeyword = keywords[0] ?? input.keyword;
  const response = await fetchTenderOpportunitySingle({ ...input, keyword: primaryKeyword }, businessType, serviceKey);
  const keywordFilteredItems = filterTenderItemsByAllKeywords(response.items, keywords);

  return {
    ...response,
    items: filterTenderItemsByRestrictions(keywordFilteredItems, input),
    searchKeywords: keywords,
    keywordMode: "and",
    raw: {
      primaryKeyword,
      allKeywords: keywords,
      restrictions: {
        demandAgencyName: input.demandAgencyName,
        regionRestriction: input.regionRestriction ?? "all",
        licenseRestriction: input.licenseRestriction ?? "all",
      },
      filter: "첫 키워드로 나라장터 API를 조회한 뒤 전체 키워드를 포함한 결과만 남깁니다.",
      response: response.raw,
    },
  };
}

async function fetchTenderOpportunitySingle(input: TenderSearchInput, businessType: Exclude<TenderBusinessType, "unknown">, serviceKey: string): Promise<TenderListResponse> {
  const operation = TENDER_SEARCH_OPERATIONS[businessType];
  const endpoint = `${BIZRADAR_TENDER_BASE_URL}/${operation}`;
  const url = new URL(endpoint);
  url.searchParams.set("ServiceKey", serviceKey);
  url.searchParams.set("type", "json");
  url.searchParams.set("pageNo", String(input.pageNo ?? 1));
  url.searchParams.set("numOfRows", String(input.numOfRows ?? 20));

  if (input.bidNoticeNo?.trim()) {
    url.searchParams.set("inqryDiv", "2");
    url.searchParams.set("bidNtceNo", input.bidNoticeNo.trim());
  } else {
    url.searchParams.set("inqryDiv", "1");
    url.searchParams.set("inqryBgnDt", compactTenderDate(input.noticeStartDate, false));
    url.searchParams.set("inqryEndDt", compactTenderDate(input.noticeEndDate, true));

    if (input.keyword?.trim()) {
      url.searchParams.set("bidNtceNm", input.keyword.trim());
    }
    if (input.demandAgencyName?.trim()) {
      url.searchParams.set("dminsttNm", input.demandAgencyName.trim());
    }
  }

  const response = await fetch(url);
  const rawText = await response.text();

  if (!response.ok) {
    throw new BizRadarApiError(`나라장터 API failed: ${response.status}`, response.status);
  }

  const raw = parseTenderPayload(rawText);
  const apiResultCode = firstString(raw, ["response.header.resultCode", "header.resultCode", "resultCode"]);
  const apiResultMessage = firstString(raw, ["response.header.resultMsg", "response.header.resultMessage", "header.resultMsg", "resultMessage"]);
  if (apiResultCode && !["00", "0", "NORMAL_CODE"].includes(apiResultCode)) {
    throw new BizRadarApiError(`나라장터 API 오류: ${apiResultMessage || apiResultCode}`, 502);
  }

  return {
    source: "g2b-bid-public-info",
    operation,
    endpoint,
    fetchedAt: new Date().toISOString(),
    items: collectTenderRows(raw).map((item) => normalizeTenderItem(item, businessType)),
    searchKeywords: input.keyword?.trim() ? [input.keyword.trim()] : [],
    keywordMode: "and",
    raw,
  };
}

export async function fetchTenderDetail(input: TenderDetailInput) {
  const result = await fetchTenderOpportunities({
    businessType: input.businessType,
    bidNoticeNo: input.bidNoticeNo,
    pageNo: 1,
    numOfRows: 10,
  });
  const item = result.items.find((candidate) => {
    if (!input.bidNoticeOrd) return true;
    return candidate.bidNoticeOrd === input.bidNoticeOrd;
  }) ?? result.items[0] ?? null;

  return {
    ...result,
    item,
  };
}

export async function fetchTenderSupplement(input: TenderSupplementInput): Promise<TenderSupplementResponse> {
  const operation = tenderSupplementOperation(input.kind, input.businessType);
  if (!operation) {
    return {
      source: "g2b-bid-public-info",
      kind: input.kind,
      supported: false,
      fetchedAt: new Date().toISOString(),
      items: [],
      raw: {
        reason: "문서에서 해당 업무구분의 Endpoint가 확인되지 않았습니다.",
        businessType: input.businessType,
        kind: input.kind,
      },
    };
  }

  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!serviceKey) {
    throw new BizRadarApiError("DATA_GO_KR_SERVICE_KEY not found", 500);
  }

  const endpoint = `${BIZRADAR_TENDER_BASE_URL}/${operation}`;
  const url = new URL(endpoint);
  url.searchParams.set("ServiceKey", serviceKey);
  url.searchParams.set("type", "json");
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", "100");
  url.searchParams.set("bidNtceNo", input.bidNoticeNo);
  if (input.bidNoticeOrd) {
    url.searchParams.set("bidNtceOrd", input.bidNoticeOrd);
  }

  const response = await fetch(url);
  const rawText = await response.text();

  if (!response.ok) {
    throw new BizRadarApiError(`나라장터 API failed: ${response.status}`, response.status);
  }

  const raw = parseTenderPayload(rawText);
  const apiResultCode = firstString(raw, ["response.header.resultCode", "header.resultCode", "resultCode"]);
  const apiResultMessage = firstString(raw, ["response.header.resultMsg", "response.header.resultMessage", "header.resultMsg", "resultMessage"]);
  if (apiResultCode && !["00", "0", "NORMAL_CODE"].includes(apiResultCode)) {
    throw new BizRadarApiError(`나라장터 API 오류: ${apiResultMessage || apiResultCode}`, 502);
  }

  return {
    source: "g2b-bid-public-info",
    kind: input.kind,
    operation,
    endpoint,
    supported: true,
    fetchedAt: new Date().toISOString(),
    items: collectTenderRows(raw),
    raw,
  };
}

export function normalizeTenderItem(raw: Record<string, unknown>, businessType: TenderBusinessType): TenderOpportunity {
  const bidNoticeNo = text(raw.bidNtceNo);
  const bidNoticeOrd = text(raw.bidNtceOrd);
  const title = text(raw.bidNtceNm) || "정보 없음";

  return {
    id: [bidNoticeNo, bidNoticeOrd, text(raw.bidClsfcNo)].filter(Boolean).join("-") || title,
    bidNoticeNo,
    bidNoticeOrd,
    title,
    businessType,
    orderingAgency: text(raw.ntceInsttNm),
    demandAgency: text(raw.dminsttNm),
    noticeDate: text(raw.bidNtceDt) || text(raw.bidNtceDate),
    bidStartDate: text(raw.bidBeginDt),
    bidCloseDate: text(raw.bidClseDt) || text(raw.bidClseDate),
    openingDate: text(raw.opengDt),
    estimatedPrice: amount(raw.presmptPrce) ?? amount(raw.asignBdgtAmt),
    basePrice: amount(raw.bssamt) ?? amount(raw.bssAmt),
    contractMethod: text(raw.cntrctCnclsMthdNm),
    bidMethod: text(raw.bidMethdNm),
    allowedRegions: splitList(text(raw.prtcptPsblRgnNm) || text(raw.prtcptLmtRgnNm)),
    licenseRestrictions: splitList(text(raw.indstrytyNm) || text(raw.indstrytyCdNm)),
    detailUrl: text(raw.bidNtceDtlUrl) || text(raw.bidNtceUrl),
    attachments: normalizeAttachments(raw),
    raw,
  };
}

export function tenderBusinessTypeLabel(input: TenderBusinessType) {
  if (input === "service") return "용역";
  if (input === "goods") return "물품";
  if (input === "construction") return "공사";
  if (input === "foreign") return "외자";
  return "정보 없음";
}

export function normalizeTenderContractMethod(input?: string) {
  const value = text(input);
  if (!value) return "정보 없음";
  if (value.includes("수의")) return "수의계약";
  if (value.includes("제한")) return "제한경쟁";
  if (value.includes("일반")) return "일반경쟁";
  if (value.includes("지명")) return "지명경쟁";
  if (value.includes("협상")) return "협상계약";
  if (value.includes("종합심사")) return "종합심사";
  if (value.includes("적격심사")) return "적격심사";
  return value;
}

export function formatTenderAmount(input?: number) {
  if (input === undefined || input <= 0) return "정보 없음";
  if (input >= 100000000) {
    const value = input / 100000000;
    return `${Number.isInteger(value) ? value.toLocaleString("ko-KR") : value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}억원`;
  }
  if (input >= 10000) {
    const value = input / 10000;
    return `${Number.isInteger(value) ? value.toLocaleString("ko-KR") : value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}만원`;
  }
  return `${input.toLocaleString("ko-KR")}원`;
}

export function parseTenderKeywords(input?: string | string[]) {
  const values = Array.isArray(input) ? input : [input ?? ""];
  return Array.from(new Set(
    values
      .flatMap((value) => value.split(/,|\n/))
      .map((value) => value.trim())
      .filter(Boolean),
  ));
}

export function bizRadarErrorStatus(error: unknown) {
  return error instanceof BizRadarApiError ? error.status : 500;
}

export function bizRadarErrorPayload(error: unknown) {
  return {
    error: error instanceof Error ? error.message : "BizRadar API 오류가 발생했습니다.",
  };
}

function normalizeBusinessType(value: TenderBusinessType): TenderBusinessType {
  return value in TENDER_SEARCH_OPERATIONS ? value : "unknown";
}

function filterTenderItemsByAllKeywords(items: TenderOpportunity[], keywords: string[]) {
  if (!keywords.length) return items;
  return items.filter((item) => {
    const text = [
      item.title,
      item.orderingAgency,
      item.demandAgency,
      item.contractMethod,
      item.bidMethod,
      JSON.stringify(item.raw),
    ].join(" ").toLowerCase();
    return keywords.every((keyword) => text.includes(keyword.toLowerCase()));
  });
}

function filterTenderItemsByRestrictions(items: TenderOpportunity[], input: TenderSearchInput) {
  return items.filter((item) => (
    matchesRestrictionFilter(hasTenderRegionRestriction(item), input.regionRestriction)
    && matchesRestrictionFilter(hasTenderLicenseRestriction(item), input.licenseRestriction)
  ));
}

function matchesRestrictionFilter(hasRestriction: boolean, filter: TenderRestrictionFilter | undefined) {
  if (!filter || filter === "all") return true;
  return filter === "yes" ? hasRestriction : !hasRestriction;
}

function hasTenderRegionRestriction(item: TenderOpportunity) {
  if (item.allowedRegions?.length) return true;
  return Boolean(firstString(item.raw, [
    "prtcptPsblRgnNm",
    "prtcptLmtRgnNm",
    "rgnLmtYn",
    "rgnLmt",
  ]));
}

function hasTenderLicenseRestriction(item: TenderOpportunity) {
  if (item.licenseRestrictions?.length) return true;
  return Boolean(firstString(item.raw, [
    "indstrytyNm",
    "indstrytyCdNm",
    "lcnsLmtNm",
    "licenseNm",
    "lcnsLmtYn",
  ]));
}

function tenderSupplementOperation(kind: TenderSupplementKind, businessType: TenderBusinessType) {
  if (kind === "licenses") return TENDER_REFERENCE_OPERATIONS.licenseRestrictions;
  if (kind === "regions") return TENDER_REFERENCE_OPERATIONS.allowedRegions;
  if (kind === "attachments") return TENDER_REFERENCE_OPERATIONS.eorderAttachments;
  if (kind === "base-price") return TENDER_BASE_PRICE_OPERATIONS[businessType];
  if (kind === "history") return TENDER_HISTORY_OPERATIONS[businessType];
  return undefined;
}

function compactTenderDate(value: string | undefined, endOfDay: boolean) {
  const today = new Date();
  const fallback = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const compact = (value || "").replace(/\D/g, "").slice(0, 8) || fallback;
  return `${compact}${endOfDay ? "2359" : "0000"}`;
}

function parseTenderPayload(rawText: string): unknown {
  try {
    return JSON.parse(rawText);
  } catch {
    return { rawText };
  }
}

function collectTenderRows(raw: unknown): Record<string, unknown>[] {
  const body = get(raw, "response.body") ?? get(raw, "body") ?? raw;
  const candidates = [
    get(body, "items.item"),
    get(body, "items"),
    get(body, "item"),
  ];
  const items = candidates.find((candidate) => candidate !== undefined && candidate !== null);
  if (!items) return [];
  if (Array.isArray(items)) return items.filter(isRecord);
  return isRecord(items) ? [items] : [];
}

function normalizeAttachments(raw: Record<string, unknown>) {
  const attachmentName = text(raw.atchFileNm) || text(raw.fileNm);
  const attachmentUrl = text(raw.atchFileUrl) || text(raw.fileUrl);
  if (!attachmentName && !attachmentUrl) return [];
  return [
    {
      name: attachmentName || "첨부파일",
      url: attachmentUrl,
    },
  ];
}

function amount(value: unknown) {
  const parsed = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function splitList(value: string) {
  if (!value) return [];
  return value.split(/[,/|]/).map((item) => item.trim()).filter(Boolean);
}

function text(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function firstString(raw: unknown, paths: string[]) {
  for (const path of paths) {
    const value = get(raw, path);
    const stringValue = text(value);
    if (stringValue) return stringValue;
  }
  return "";
}

function get(raw: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!isRecord(current)) return undefined;
    return current[key];
  }, raw);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
