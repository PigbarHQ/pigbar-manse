import { parseXmlToJson, WelfareApiError } from "@/src/lib/welfare/national";
import {
  FACILITY_TYPES,
  codeForLongTermCareLabel,
  getFacilityTypeOption,
  labelForLongTermCareCode,
  longTermCareCodesFor,
  type FacilityType,
} from "@/src/lib/welfare/ltc-service-type-map";

export { FACILITY_TYPES, type FacilityType } from "@/src/lib/welfare/ltc-service-type-map";
export { FACILITY_TYPE_GROUPS, FACILITY_TYPE_OPTIONS, labelForLongTermCareCode } from "@/src/lib/welfare/ltc-service-type-map";

export type FacilityCandidate = {
  id: string;
  source: string;
  name: string;
  facilityType: FacilityType;
  region: string;
  address: string;
  phone: string;
  homepage: string;
  latitude: number | null;
  longitude: number | null;
  raw: unknown;
};

export type FacilityDetailSection = {
  id: string;
  title: string;
  endpoint: string;
  description: string;
  status: "ok" | "empty" | "error";
  items: Record<string, unknown>[];
  raw: unknown;
  error?: string;
};

export type FacilityDetailBundle = {
  source: string;
  fetchedAt: string;
  longTermAdminSym: string;
  adminPttnCd: string;
  sections: FacilityDetailSection[];
};

type AddressResolution = {
  address: string;
  source: "ltc-readable" | "local-road-address-data" | "juso-road-address" | "ltc-code-fallback";
  keyword?: string;
  error?: string;
  raw?: unknown;
};

type LocalRoadAddress = {
  roadAddress: string;
  zipNo: string;
  roadCode: string;
  buildingMain: string;
  buildingSub: string;
  rawLine: string;
};

export type FacilityDataSourceStatus = {
  facilityType: FacilityType;
  candidateName: string;
  provider: string;
  dataUrl: string;
  status: "available" | "needs-source-confirmation";
  message: string;
};

export type FacilitySearchInput = {
  ctpvNm: string;
  sggNm: string;
  facilityType: FacilityType;
  facilityName?: string;
};

const LONG_TERM_CARE_LIST_BASE_URL = "https://apis.data.go.kr/B550928/searchLtcInsttService02";
const LONG_TERM_CARE_LIST_PATH = "/getLtcInsttSeachList02";
const LONG_TERM_CARE_LIST_NUM_ROWS = 100;
const LONG_TERM_CARE_LIST_MAX_PAGES = 5;
const LONG_TERM_CARE_SERVICE_KIND_DELAY_MS = 500;
const LONG_TERM_CARE_ACCEPTANCE_DETAIL_DELAY_MS = 100;
const LONG_TERM_CARE_DETAIL_BASE_URL = "https://apis.data.go.kr/B550928/getLtcInsttDetailInfoService02";
const LONG_TERM_CARE_GENERAL_DETAIL_PATH = "/getGeneralSttusDetailInfoItem02";
const LONG_TERM_CARE_ACCEPTANCE_DETAIL_PATH = "/getAceptncNmprDetailInfoItem02";
const LONG_TERM_CARE_SOURCE = "nhis-long-term-care";
const DEFAULT_ROAD_ADDRESS_DATA_DIR = "/Users/thezoooz/Downloads/202606_도로명주소 한글_전체분";
const localRoadAddressCache = new Map<string, Promise<Map<string, LocalRoadAddress>>>();

const ROAD_ADDRESS_FILE_BY_REGION_NAME: Record<string, string> = {
  서울: "rnaddrkor_seoul.txt",
  부산: "rnaddrkor_busan.txt",
  대구: "rnaddrkor_daegu.txt",
  인천: "rnaddrkor_incheon.txt",
  광주: "rnaddrkor_jeonnamgwangju.txt",
  대전: "rnaddrkor_daejeon.txt",
  울산: "rnaddrkor_ulsan.txt",
  세종: "rnaddrkor_sejong.txt",
  경기: "rnaddrkor_gyunggi.txt",
  강원: "rnaddrkor_gangwon.txt",
  충북: "rnaddrkor_chungbuk.txt",
  충청북: "rnaddrkor_chungbuk.txt",
  충남: "rnaddrkor_chungnam.txt",
  충청남: "rnaddrkor_chungnam.txt",
  전북: "rnaddrkor_jeonbuk.txt",
  전라북: "rnaddrkor_jeonbuk.txt",
  전남: "rnaddrkor_jeonnamgwangju.txt",
  전라남: "rnaddrkor_jeonnamgwangju.txt",
  경북: "rnaddrkor_gyeongbuk.txt",
  경상북: "rnaddrkor_gyeongbuk.txt",
  경남: "rnaddrkor_gyeongnam.txt",
  경상남: "rnaddrkor_gyeongnam.txt",
  제주: "rnaddrkor_jeju.txt",
};

const ROAD_ADDRESS_FILE_BY_ROAD_CODE_PREFIX: Record<string, string> = {
  "11": "rnaddrkor_seoul.txt",
  "26": "rnaddrkor_busan.txt",
  "27": "rnaddrkor_daegu.txt",
  "28": "rnaddrkor_incheon.txt",
  "29": "rnaddrkor_jeonnamgwangju.txt",
  "30": "rnaddrkor_daejeon.txt",
  "31": "rnaddrkor_ulsan.txt",
  "36": "rnaddrkor_sejong.txt",
  "41": "rnaddrkor_gyunggi.txt",
  "42": "rnaddrkor_gangwon.txt",
  "43": "rnaddrkor_chungbuk.txt",
  "44": "rnaddrkor_chungnam.txt",
  "45": "rnaddrkor_jeonbuk.txt",
  "46": "rnaddrkor_jeonnamgwangju.txt",
  "47": "rnaddrkor_gyeongbuk.txt",
  "48": "rnaddrkor_gyeongnam.txt",
  "50": "rnaddrkor_jeju.txt",
  "51": "rnaddrkor_gangwon.txt",
  "52": "rnaddrkor_jeonbuk.txt",
};

export const REGION_CODES: Record<string, { siDoCd: string; siGunGuCdByName: Record<string, string> }> = {
  서울특별시: {
    siDoCd: "11",
    siGunGuCdByName: {},
  },
  부산광역시: {
    siDoCd: "26",
    siGunGuCdByName: {},
  },
  대구광역시: {
    siDoCd: "27",
    siGunGuCdByName: {},
  },
  인천광역시: {
    siDoCd: "28",
    siGunGuCdByName: {
      중구: "110",
      동구: "140",
      미추홀구: "177",
      연수구: "185",
      남동구: "200",
      부평구: "237",
      계양구: "245",
      서구: "260",
      강화군: "710",
      옹진군: "720",
    },
  },
  광주광역시: {
    siDoCd: "29",
    siGunGuCdByName: {},
  },
  대전광역시: {
    siDoCd: "30",
    siGunGuCdByName: {},
  },
  울산광역시: {
    siDoCd: "31",
    siGunGuCdByName: {},
  },
  세종특별자치시: {
    siDoCd: "36",
    siGunGuCdByName: {},
  },
  경기도: {
    siDoCd: "41",
    siGunGuCdByName: {},
  },
  강원도: {
    siDoCd: "42",
    siGunGuCdByName: {},
  },
  강원특별자치도: {
    siDoCd: "51",
    siGunGuCdByName: {},
  },
  충청북도: {
    siDoCd: "43",
    siGunGuCdByName: {},
  },
  충청남도: {
    siDoCd: "44",
    siGunGuCdByName: {},
  },
  전라북도: {
    siDoCd: "45",
    siGunGuCdByName: {},
  },
  전북특별자치도: {
    siDoCd: "52",
    siGunGuCdByName: {},
  },
  전라남도: {
    siDoCd: "46",
    siGunGuCdByName: {},
  },
  경상북도: {
    siDoCd: "47",
    siGunGuCdByName: {},
  },
  경상남도: {
    siDoCd: "48",
    siGunGuCdByName: {},
  },
  제주특별자치도: {
    siDoCd: "50",
    siGunGuCdByName: {},
  },
};

const LONG_TERM_CARE_DETAIL_SECTIONS = [
  {
    id: "institutionEtc",
    title: "기관기타",
    path: "/getInsttEtcDetailInfoItem02",
    description: "장기요양시설 기관기타 상세 정보조회(홈페이지주소, 교통편, 주차시설)",
  },
  {
    id: "acceptanceStatus",
    title: "입소인원",
    path: LONG_TERM_CARE_ACCEPTANCE_DETAIL_PATH,
    description: "장기요양시설 입소인원 상세 정보조회(정원, 현원, 대기인원)",
  },
  {
    id: "staffStatus",
    title: "인력현황",
    path: "/getStaffSttusDetailInfoItem02",
    description: "장기요양시설 인력현황조회(사무업무 인원, 의료진 인원, 요양보호사, 영양사, 조리사 등)",
  },
  {
    id: "facilityStatus",
    title: "시설현황",
    path: "/getInsttSttusDetailInfoItem02",
    description: "장기요양시설 현황조회(침실, 특수침실, 의료 및 간호사실, 작업 및 일상동작훈련실, 화장실 등)",
  },
  {
    id: "welfareToolStatus",
    title: "복지용구 현황",
    path: "/getWlfareToolDetailInfoList02",
    description: "장기요양시설 복지용구현황 목록 조회(신고내역, 장비명, 제조사, 모델명, 용도, 기타)",
  },
  {
    id: "nonBenefitStatus",
    title: "비급여현황",
    path: "/getNonBenefitSttusDetailInfoList02",
    description: "장기요양시설 비급여현황 목록 조회(비급여항목, 금액, 산출근거, 등록일)",
  },
  {
    id: "contractedInstitutions",
    title: "협약기관 현황",
    path: "/getConvInsttDetailInfoList02",
    description: "장기요양시설 협약기관 현황 목록 조회(협약기관명, 협약기간)",
  },
  {
    id: "programStatus",
    title: "프로그램현황",
    path: "/getProgramSttusDetailInfoList02",
    description: "장기요양시설 프로그램운영사항 목록 조회(프로그램종류, 제목, 대상, 주기, 장소)",
  },
] as const;

export const FACILITY_DATA_SOURCE_STATUSES: FacilityDataSourceStatus[] = [
  ...FACILITY_TYPES.filter((facilityType) => getFacilityTypeOption(facilityType)?.category === "돌봄 서비스").map((facilityType) => ({
    facilityType,
    candidateName: `국민건강보험공단 장기요양기관 검색 서비스 + ${facilityType} 코드`,
    provider: "국민건강보험공단",
    dataUrl: "https://apis.data.go.kr/B550928/searchLtcInsttService02",
    status: "available" as const,
    message: `공식 REST/XML API가 확인되어 ${facilityType} 조회에 사용합니다.`,
  })),
  {
    facilityType: "치매안심센터",
    candidateName: "치매안심센터 기관 정보 데이터 후보",
    provider: "중앙치매센터 / 보건복지부",
    dataUrl: "",
    status: "needs-source-confirmation",
    message: "이 기관 종류는 아직 공식 API 또는 공개 데이터 소스 확인이 필요합니다.",
  },
  {
    facilityType: "보건소",
    candidateName: "보건기관 또는 공공보건의료기관 데이터 후보",
    provider: "보건복지부 / 지방자치단체",
    dataUrl: "",
    status: "needs-source-confirmation",
    message: "이 기관 종류는 아직 공식 API 또는 공개 데이터 소스 확인이 필요합니다.",
  },
  {
    facilityType: "주민센터",
    candidateName: "주민센터 기관 정보 데이터 후보",
    provider: "행정안전부 / 지방자치단체",
    dataUrl: "",
    status: "needs-source-confirmation",
    message: "이 기관 종류는 아직 공식 API 또는 공개 데이터 소스 확인이 필요합니다.",
  },
  {
    facilityType: "복지관",
    candidateName: "복지관 기관 정보 데이터 후보",
    provider: "보건복지부 / 지방자치단체",
    dataUrl: "",
    status: "needs-source-confirmation",
    message: "이 기관 종류는 아직 공식 API 또는 공개 데이터 소스 확인이 필요합니다.",
  },
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return value === undefined || value === null || value === "" ? [] : [value];
}

function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(", ");
  const record = asRecord(value);
  if (typeof record.text === "string") return record.text.trim();
  return "";
}

function pick(record: Record<string, unknown>, names: string[]) {
  for (const name of names) {
    const value = text(record[name]);
    if (value) return value;
  }
  return "";
}

function collectRecords(value: unknown, names: string[], results: Record<string, unknown>[] = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectRecords(item, names, results));
    return results;
  }

  const record = asRecord(value);
  Object.entries(record).forEach(([key, item]) => {
    if (names.includes(key)) {
      asArray(item).forEach((candidate) => {
        const candidateRecord = asRecord(candidate);
        if (Object.keys(candidateRecord).length > 0) results.push(candidateRecord);
      });
    }
    if (typeof item === "object" && item !== null) collectRecords(item, names, results);
  });

  return results;
}

function findTextByKey(value: unknown, key: string): string {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findTextByKey(item, key);
      if (found) return found;
    }
    return "";
  }

  const record = asRecord(value);
  for (const [recordKey, item] of Object.entries(record)) {
    if (recordKey === key) {
      const found = text(item);
      if (found) return found;
    }
    if (typeof item === "object" && item !== null) {
      const found = findTextByKey(item, key);
      if (found) return found;
    }
  }

  return "";
}

function totalCountFrom(raw: unknown) {
  const totalCount = Number(findTextByKey(raw, "totalCount"));
  return Number.isFinite(totalCount) && totalCount > 0 ? totalCount : 0;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function serviceKindDelayMs() {
  const configured = Number(process.env.LONG_TERM_CARE_SERVICE_KIND_DELAY_MS);
  return Number.isFinite(configured) && configured >= 0 ? configured : LONG_TERM_CARE_SERVICE_KIND_DELAY_MS;
}

function acceptanceDetailDelayMs() {
  const configured = Number(process.env.LONG_TERM_CARE_ACCEPTANCE_DETAIL_DELAY_MS);
  return Number.isFinite(configured) && configured >= 0 ? configured : LONG_TERM_CARE_ACCEPTANCE_DETAIL_DELAY_MS;
}

function phoneFrom(record: Record<string, unknown>) {
  const parts = [pick(record, ["locTelNo_1", "locTelNo1"]), pick(record, ["locTelNo_2", "locTelNo2"]), pick(record, ["locTelNo_3", "locTelNo3"])].filter(Boolean);
  return parts.length > 0 ? parts.join("-") : pick(record, ["telNo", "phone", "locTelNo"]);
}

function buildingNoFrom(record: Record<string, unknown>) {
  const buildingMain = pick(record, ["gunmulMlno"]);
  const buildingSub = pick(record, ["gunmulSlno"]);
  return [buildingMain, buildingSub && buildingSub !== "0" ? buildingSub : ""].filter(Boolean).join("-");
}

function readableAddressFrom(record: Record<string, unknown>) {
  const detailAddr = pick(record, ["detailAddr", "addr", "address"]);
  const roadName = pick(record, ["roadNm", "roadName"]);
  const buildingNo = buildingNoFrom(record);
  const humanAddress = [roadName, buildingNo, detailAddr].filter(Boolean).join(" ") || detailAddr;
  return roadName || detailAddr ? humanAddress : "";
}

function codeAddressFrom(record: Record<string, unknown>) {
  const roadCode = pick(record, ["roadNmCd"]);
  const postNo = pick(record, ["hmPostNo", "zip", "zipCode"]);
  const buildingNo = buildingNoFrom(record);

  return [
    postNo ? `우편번호 ${postNo}` : "",
    roadCode ? `도로명코드 ${roadCode}` : "",
    buildingNo ? `건물번호 ${buildingNo}` : "",
  ].filter(Boolean).join(" / ");
}

function addressFrom(record: Record<string, unknown>) {
  return readableAddressFrom(record) || codeAddressFrom(record);
}

function numberText(value: unknown) {
  const textValue = text(value);
  if (!textValue) return "";
  const numeric = Number(textValue);
  return Number.isFinite(numeric) ? String(numeric) : textValue.replace(/^0+(\d)/, "$1");
}

function localRoadAddressFileName(input: FacilitySearchInput, roadCode: string) {
  const regionMatch = Object.entries(ROAD_ADDRESS_FILE_BY_REGION_NAME).find(([regionName]) => input.ctpvNm.includes(regionName));
  if (regionMatch) return regionMatch[1];
  return ROAD_ADDRESS_FILE_BY_ROAD_CODE_PREFIX[roadCode.slice(0, 2)] ?? "";
}

function localRoadAddressKey(roadCode: string, buildingMain: string, buildingSub: string) {
  return `${roadCode}:${numberText(buildingMain)}:${numberText(buildingSub || "0") || "0"}`;
}

function parseLocalRoadAddressLine(line: string): LocalRoadAddress | null {
  const fields = line.replace(/\r$/, "").split("|");
  if (fields.length < 17) return null;

  const siNm = fields[2] ?? "";
  const sggNm = fields[3] ?? "";
  const roadCode = fields[9] ?? "";
  const roadName = fields[10] ?? "";
  const buildingMain = numberText(fields[12]);
  const buildingSub = numberText(fields[13] || "0") || "0";
  const zipNo = fields[16] ?? "";
  const buildingName = fields[22] || fields[21] || "";
  if (!roadCode || !roadName || !buildingMain) return null;

  const buildingNo = buildingSub && buildingSub !== "0" ? `${buildingMain}-${buildingSub}` : buildingMain;
  const roadAddress = [siNm, sggNm, roadName, buildingNo].filter(Boolean).join(" ");

  return {
    roadAddress: buildingName ? `${roadAddress} (${buildingName})` : roadAddress,
    zipNo,
    roadCode,
    buildingMain,
    buildingSub,
    rawLine: line,
  };
}

async function loadLocalRoadAddressMap(fileName: string) {
  const dataDir = process.env.ROAD_ADDRESS_DATA_DIR?.trim() || DEFAULT_ROAD_ADDRESS_DATA_DIR;
  const filePath = `${dataDir.replace(/\/$/, "")}/${fileName}`;

  if (!localRoadAddressCache.has(filePath)) {
    localRoadAddressCache.set(filePath, (async () => {
      const { readFile } = await import("node:fs/promises");
      const buffer = await readFile(filePath);
      const text = new TextDecoder("euc-kr").decode(buffer);
      const map = new Map<string, LocalRoadAddress>();
      text.split(/\n/).forEach((line) => {
        if (!line.trim()) return;
        const parsed = parseLocalRoadAddressLine(line);
        if (!parsed) return;
        map.set(localRoadAddressKey(parsed.roadCode, parsed.buildingMain, parsed.buildingSub), parsed);
      });
      return map;
    })());
  }

  return localRoadAddressCache.get(filePath)!;
}

async function fetchLocalRoadAddress(record: Record<string, unknown>, input: FacilitySearchInput): Promise<AddressResolution | null> {
  const roadCode = pick(record, ["roadNmCd"]);
  const buildingMain = pick(record, ["gunmulMlno"]);
  const buildingSub = pick(record, ["gunmulSlno"]) || "0";
  const fileName = localRoadAddressFileName(input, roadCode);
  if (!fileName || !roadCode || !buildingMain) return null;

  try {
    const map = await loadLocalRoadAddressMap(fileName);
    const matched = map.get(localRoadAddressKey(roadCode, buildingMain, buildingSub));
    if (!matched) return null;
    return {
      address: matched.roadAddress,
      source: "local-road-address-data",
      keyword: `${roadCode} ${buildingMain}${buildingSub && buildingSub !== "0" ? `-${buildingSub}` : ""}`,
      raw: matched,
    };
  } catch (error) {
    return {
      address: "",
      source: "ltc-code-fallback",
      error: error instanceof Error ? error.message : "로컬 도로명주소 파일 조회 실패",
    };
  }
}

function jusoKeywordCandidates(record: Record<string, unknown>, input: FacilitySearchInput) {
  const roadCode = pick(record, ["roadNmCd"]);
  const buildingNo = buildingNoFrom(record);
  const detailAddr = pick(record, ["detailAddr", "addr", "address"]);
  return Array.from(new Set([
    readableAddressFrom(record),
    detailAddr ? [input.ctpvNm, input.sggNm, detailAddr].filter(Boolean).join(" ") : "",
    roadCode && buildingNo ? `${roadCode} ${buildingNo}` : "",
    roadCode && buildingNo ? [input.ctpvNm, input.sggNm, roadCode, buildingNo].filter(Boolean).join(" ") : "",
    buildingNo ? [input.ctpvNm, input.sggNm, buildingNo].filter(Boolean).join(" ") : "",
  ].filter(Boolean)));
}

function isMatchingJusoAddress(candidate: Record<string, unknown>, record: Record<string, unknown>) {
  const roadCode = pick(record, ["roadNmCd"]);
  const buildingMain = numberText(record.gunmulMlno);
  const buildingSub = numberText(record.gunmulSlno || "0") || "0";
  const candidateRoadCode = pick(candidate, ["rnMgtSn"]);
  const candidateMain = numberText(candidate.buldMnnm);
  const candidateSub = numberText(candidate.buldSlno || "0") || "0";

  if (roadCode && candidateRoadCode && roadCode !== candidateRoadCode) return false;
  if (buildingMain && candidateMain && buildingMain !== candidateMain) return false;
  if (buildingSub && candidateSub && buildingSub !== candidateSub) return false;
  return Boolean(pick(candidate, ["roadAddr", "roadAddrPart1"]));
}

async function fetchJusoAddress(record: Record<string, unknown>, input: FacilitySearchInput): Promise<AddressResolution | null> {
  const confmKey = process.env.JUSO_CONFIRM_KEY?.trim();
  if (!confmKey) return null;

  const keywords = jusoKeywordCandidates(record, input);
  for (const keyword of keywords) {
    try {
      const url = new URL("https://business.juso.go.kr/addrlink/addrLinkApi.do");
      url.searchParams.set("confmKey", confmKey);
      url.searchParams.set("currentPage", "1");
      url.searchParams.set("countPerPage", "10");
      url.searchParams.set("keyword", keyword);
      url.searchParams.set("resultType", "json");
      url.searchParams.set("firstSort", "road");

      const response = await fetch(url, { cache: "no-store" });
      const raw = await response.json() as unknown;
      const results = collectRecords(raw, ["juso"]);
      const matched = results.find((candidate) => isMatchingJusoAddress(candidate, record)) ?? results.at(0);
      if (response.ok && matched) {
        const roadAddr = pick(matched, ["roadAddr", "roadAddrPart1"]);
        if (roadAddr) {
          return {
            address: roadAddr,
            source: "juso-road-address",
            keyword,
            raw: matched,
          };
        }
      }
    } catch (error) {
      return {
        address: "",
        source: "ltc-code-fallback",
        keyword,
        error: error instanceof Error ? error.message : "주소 검색 API 호출 실패",
      };
    }
  }

  return null;
}

async function resolveAddress(record: Record<string, unknown>, input: FacilitySearchInput): Promise<AddressResolution> {
  const readableAddress = readableAddressFrom(record);
  if (readableAddress) return { address: readableAddress, source: "ltc-readable" };

  const localAddress = await fetchLocalRoadAddress(record, input);
  if (localAddress?.address) return localAddress;

  const jusoAddress = await fetchJusoAddress(record, input);
  if (jusoAddress?.address) return jusoAddress;

  return {
    address: codeAddressFrom(record),
    source: "ltc-code-fallback",
    keyword: localAddress?.keyword || jusoAddress?.keyword,
    error: localAddress?.error || jusoAddress?.error,
  };
}

function regionFrom(record: Record<string, unknown>, input: FacilitySearchInput) {
  const siDo = pick(record, ["siDoNm", "sidoNm"]) || input.ctpvNm;
  const siGunGu = pick(record, ["siGunGuNm", "sigunguNm"]) || input.sggNm;
  return [siDo, siGunGu].filter(Boolean).join(" ");
}

function normalizeLongTermCareItem(record: Record<string, unknown>, input: FacilitySearchInput, addressResolution?: AddressResolution): FacilityCandidate {
  const adminPttnCd = pick(record, ["adminPttnCd", "serviceKind"]);
  const normalizedAdminPttnCd = sourceCodeFromRecord(record);
  const serviceKindName = pick(record, ["serviceKindNm", "adminPttnNm"]) || labelForLongTermCareCode(normalizedAdminPttnCd || adminPttnCd);
  return {
    id: pick(record, ["longTermAdminSym", "id"]),
    source: "국민건강보험공단 장기요양기관 검색 서비스",
    name: pick(record, ["adminNm", "name"]),
    facilityType: input.facilityType,
    region: regionFrom(record, input),
    address: addressResolution?.address || addressFrom(record),
    phone: phoneFrom(record),
    homepage: pick(record, ["hmpgAddr", "homepage", "url"]),
    latitude: null,
    longitude: null,
    raw: {
      ...record,
      sourceCode: normalizedAdminPttnCd || adminPttnCd,
      sourceKindName: serviceKindName,
      addressResolution: addressResolution ?? null,
    },
  };
}

function mergeLongTermCareRecord(listRecord: Record<string, unknown>, detailRecord: Record<string, unknown> | null, acceptanceRecord: Record<string, unknown> | null = null) {
  return {
    ...listRecord,
    ...(detailRecord ?? {}),
    rawList: listRecord,
    rawGeneralDetail: detailRecord,
    rawAcceptanceDetail: acceptanceRecord,
  };
}

function regionCodes(input: FacilitySearchInput) {
  const region = REGION_CODES[input.ctpvNm];
  return {
    siDoCd: region?.siDoCd ?? "",
    siGunGuCd: region?.siGunGuCdByName[input.sggNm] ?? "",
  };
}

function isLongTermCareSearch(facilityType: FacilityType) {
  return getFacilityTypeOption(facilityType)?.sourceStatus === "available";
}

function serviceKindCodesFor(facilityType: FacilityType) {
  return longTermCareCodesFor(facilityType);
}

function matchesFacilityName(record: Record<string, unknown>, facilityName?: string) {
  const keyword = facilityName?.trim();
  if (!keyword) return true;
  return pick(record, ["adminNm", "name"]).includes(keyword);
}

function sourceCodeFromRecord(record: Record<string, unknown>) {
  const directCode = pick(record, ["adminPttnCd", "serviceKind", "sourceCode"]);
  if (directCode && codeForLongTermCareLabel(directCode)) return directCode;
  const labelCode = codeForLongTermCareLabel(pick(record, ["serviceKindNm", "adminPttnNm", "sourceKindName"]));
  return labelCode || directCode;
}

async function fetchLongTermCareXml(baseUrl: string, path: string, params: Record<string, string>) {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY?.trim();
  if (!serviceKey) throw new Error("DATA_GO_KR_SERVICE_KEY not found");

  const url = new URL(`${baseUrl}${path}`);
  Object.entries({ serviceKey, ...params }).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  const response = await fetch(url, { cache: "no-store" });
  const xml = await response.text();
  const raw = parseXmlToJson(xml);

  if (!response.ok) {
    throw new WelfareApiError(response.status, response.headers.get("retry-after") ?? "");
  }

  return raw;
}

async function fetchLongTermCareListPages(params: Record<string, string>) {
  const firstPage = await fetchLongTermCareXml(LONG_TERM_CARE_LIST_BASE_URL, LONG_TERM_CARE_LIST_PATH, {
    ...params,
    pageNo: "1",
    numOfRows: String(LONG_TERM_CARE_LIST_NUM_ROWS),
  });
  const totalCount = totalCountFrom(firstPage);
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / LONG_TERM_CARE_LIST_NUM_ROWS) : 1;
  const pageLimit = Math.min(totalPages, LONG_TERM_CARE_LIST_MAX_PAGES);
  const pages = [firstPage];

  if (pageLimit > 1) {
    const restPages = await Promise.all(Array.from({ length: pageLimit - 1 }, (_, index) =>
      fetchLongTermCareXml(LONG_TERM_CARE_LIST_BASE_URL, LONG_TERM_CARE_LIST_PATH, {
        ...params,
        pageNo: String(index + 2),
        numOfRows: String(LONG_TERM_CARE_LIST_NUM_ROWS),
      }),
    ));
    pages.push(...restPages);
  }

  return pages;
}

async function fetchLongTermCareSingleDetail(record: Record<string, unknown>, path: string) {
  const longTermAdminSym = pick(record, ["longTermAdminSym"]);
  const adminPttnCd = sourceCodeFromRecord(record) || pick(record, ["requestedServiceKind"]);
  if (!longTermAdminSym || !adminPttnCd) return null;

  try {
    const raw = await fetchLongTermCareXml(LONG_TERM_CARE_DETAIL_BASE_URL, path, {
      longTermAdminSym,
      adminPttnCd,
    });
    return collectRecords(raw, ["item", "items"]).at(0) ?? asRecord(raw);
  } catch {
    return null;
  }
}

async function fetchLongTermCareGeneralDetail(record: Record<string, unknown>) {
  return fetchLongTermCareSingleDetail(record, LONG_TERM_CARE_GENERAL_DETAIL_PATH);
}

async function fetchLongTermCareAcceptanceDetail(record: Record<string, unknown>) {
  return fetchLongTermCareSingleDetail(record, LONG_TERM_CARE_ACCEPTANCE_DETAIL_PATH);
}

async function fetchLongTermCareDetailSection(section: typeof LONG_TERM_CARE_DETAIL_SECTIONS[number], longTermAdminSym: string, adminPttnCd: string): Promise<FacilityDetailSection> {
  try {
    const raw = await fetchLongTermCareXml(LONG_TERM_CARE_DETAIL_BASE_URL, section.path, {
      longTermAdminSym,
      adminPttnCd,
    });
    const items = collectRecords(raw, ["item"]);
    const fallbackRecord = asRecord(raw);
    const sectionItems = items.length > 0 ? items : Object.keys(fallbackRecord).length > 0 ? [fallbackRecord] : [];

    return {
      id: section.id,
      title: section.title,
      endpoint: section.path,
      description: section.description,
      status: sectionItems.length > 0 ? "ok" : "empty",
      items: sectionItems,
      raw,
    };
  } catch (error) {
    return {
      id: section.id,
      title: section.title,
      endpoint: section.path,
      description: section.description,
      status: "error",
      items: [],
      raw: null,
      error: error instanceof Error ? error.message : "상세 API 조회 실패",
    };
  }
}

export async function fetchFacilityDetailBundle(longTermAdminSym: string, adminPttnCd: string): Promise<FacilityDetailBundle> {
  const sections = await Promise.all(LONG_TERM_CARE_DETAIL_SECTIONS.map((section) =>
    fetchLongTermCareDetailSection(section, longTermAdminSym, adminPttnCd),
  ));

  return {
    source: LONG_TERM_CARE_SOURCE,
    fetchedAt: new Date().toISOString(),
    longTermAdminSym,
    adminPttnCd,
    sections,
  };
}

export function dataSourceStatusesFor(facilityType: FacilityType) {
  if (facilityType === "전체") return FACILITY_DATA_SOURCE_STATUSES;
  return FACILITY_DATA_SOURCE_STATUSES.filter((item) => item.facilityType === facilityType);
}

export async function searchFacilityCandidates(input: FacilitySearchInput) {
  if (!isLongTermCareSearch(input.facilityType)) {
    return {
      source: LONG_TERM_CARE_SOURCE,
      fetchedAt: new Date().toISOString(),
      items: [] as FacilityCandidate[],
      raw: null,
    };
  }

  const codes = regionCodes(input);
  const serviceKindCodes = serviceKindCodesFor(input.facilityType);
  const rawResults = [];

  for (const [index, serviceKind] of serviceKindCodes.entries()) {
    if (index > 0) await delay(serviceKindDelayMs());
    const pages = await fetchLongTermCareListPages({
      siDoCd: codes.siDoCd,
      siGunGuCd: codes.siGunGuCd,
      serviceKind,
      adminNm: input.facilityName?.trim() ?? "",
    });
    rawResults.push(...pages.map((raw, pageIndex) => ({
      serviceKind,
      pageNo: pageIndex + 1,
      raw,
    })));
  }

  const requestedServiceKindCodes = new Set(serviceKindCodes);
  const records = rawResults.flatMap(({ raw, serviceKind }) =>
    collectRecords(raw, ["item", "items"]).map((item) => ({ ...item, requestedServiceKind: serviceKind })),
  ).filter((item) => {
    const sourceCode = sourceCodeFromRecord(item) || pick(item, ["requestedServiceKind"]);
    return pick(item, ["longTermAdminSym", "adminNm"]) &&
      matchesFacilityName(item, input.facilityName) &&
      (!sourceCode || requestedServiceKindCodes.has(sourceCode));
  });
  const uniqueRecords = Array.from(new Map(records.map((record) => {
    const id = pick(record, ["longTermAdminSym", "id"]);
    const sourceCode = sourceCodeFromRecord(record);
    return [`${id}:${sourceCode}`, record] as const;
  })).values());
  const enrichedRecords: Record<string, unknown>[] = [];
  for (const record of uniqueRecords) {
    const detailRecord = await fetchLongTermCareGeneralDetail(record);
    await delay(acceptanceDetailDelayMs());
    const acceptanceRecord = await fetchLongTermCareAcceptanceDetail(record);
    enrichedRecords.push(mergeLongTermCareRecord(record, detailRecord, acceptanceRecord));
  }
  const items = await Promise.all(enrichedRecords.map(async (record) => {
    const addressResolution = await resolveAddress(record, input);
    return normalizeLongTermCareItem(record, input, addressResolution);
  }));

  return {
    source: LONG_TERM_CARE_SOURCE,
    fetchedAt: new Date().toISOString(),
    items,
    raw: rawResults.map((result) => result.raw),
  };
}
