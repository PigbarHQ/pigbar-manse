import { parseXmlToJson, WelfareApiError } from "@/src/lib/welfare/national";
import {
  FACILITY_TYPES,
  codeForLongTermCareLabel,
  getFacilityTypeOption,
  labelForLongTermCareCode,
  longTermCareCodesFor,
  type FacilityType,
} from "@/src/lib/welfare/ltc-service-type-map";
import type { LongTermCareEvaluationARecord } from "@/src/lib/welfare/ltc-evaluation-a";

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
  generalDetail: Record<string, unknown> | null;
  addressResolution: AddressResolution | null;
  evaluationA?: LongTermCareEvaluationARecord[];
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
  includeAcceptanceDetails?: boolean;
};

const LONG_TERM_CARE_LIST_BASE_URL = "https://apis.data.go.kr/B550928/searchLtcInsttService02";
const LONG_TERM_CARE_LIST_PATH = "/getLtcInsttSeachList02";
const LONG_TERM_CARE_LIST_NUM_ROWS = 100;
const LONG_TERM_CARE_LIST_MAX_PAGES = 5;
const LONG_TERM_CARE_SERVICE_KIND_DELAY_MS = 100;
const LONG_TERM_CARE_ACCEPTANCE_DETAIL_DELAY_MS = 10;
const LONG_TERM_CARE_SERVICE_KIND_CONCURRENCY = 3;
const LONG_TERM_CARE_ACCEPTANCE_DETAIL_CONCURRENCY = 5;
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
    siGunGuCdByName: {
      종로구: "110",
      중구: "140",
      용산구: "170",
      성동구: "200",
      광진구: "215",
      동대문구: "230",
      중랑구: "260",
      성북구: "290",
      강북구: "305",
      도봉구: "320",
      노원구: "350",
      은평구: "380",
      서대문구: "410",
      마포구: "440",
      양천구: "470",
      강서구: "500",
      구로구: "530",
      금천구: "545",
      영등포구: "560",
      동작구: "590",
      관악구: "620",
      서초구: "650",
      강남구: "680",
      송파구: "710",
      강동구: "740",
    },
  },
  부산광역시: {
    siDoCd: "26",
    siGunGuCdByName: {
      중구: "110",
      서구: "140",
      동구: "170",
      영도구: "200",
      부산진구: "230",
      동래구: "260",
      남구: "290",
      북구: "320",
      해운대구: "350",
      사하구: "380",
      금정구: "410",
      강서구: "440",
      연제구: "470",
      수영구: "500",
      사상구: "530",
      기장군: "710",
    },
  },
  대구광역시: {
    siDoCd: "27",
    siGunGuCdByName: {
      중구: "110",
      동구: "140",
      서구: "170",
      남구: "200",
      북구: "230",
      수성구: "260",
      달서구: "290",
      달성군: "710",
      군위군: "720",
    },
  },
  인천광역시: {
    siDoCd: "28",
    siGunGuCdByName: {
      제물포구: "125",
      영종구: "155",
      미추홀구: "177",
      연수구: "185",
      남동구: "200",
      부평구: "237",
      계양구: "245",
      서해구: "275",
      검단구: "290",
      강화군: "710",
      옹진군: "720",
    },
  },
  광주광역시: {
    siDoCd: "29",
    siGunGuCdByName: {
      동구: "110",
      서구: "140",
      남구: "155",
      북구: "170",
      광산구: "200",
    },
  },
  대전광역시: {
    siDoCd: "30",
    siGunGuCdByName: {
      동구: "110",
      중구: "140",
      서구: "170",
      유성구: "200",
      대덕구: "230",
    },
  },
  울산광역시: {
    siDoCd: "31",
    siGunGuCdByName: {
      중구: "110",
      남구: "140",
      동구: "170",
      북구: "200",
      울주군: "710",
    },
  },
  세종특별자치시: {
    siDoCd: "36",
    siGunGuCdByName: {
      세종시: "110",
    },
  },
  경기도: {
    siDoCd: "41",
    siGunGuCdByName: {
      "수원시 장안구": "111",
      "수원시 권선구": "113",
      "수원시 팔달구": "115",
      "수원시 영통구": "117",
      "성남시 수정구": "131",
      "성남시 중원구": "133",
      "성남시 분당구": "135",
      의정부시: "150",
      "안양시 만안구": "171",
      "안양시 동안구": "173",
      "부천시 원미구": "192",
      "부천시 소사구": "194",
      "부천시 오정구": "196",
      광명시: "210",
      평택시: "220",
      동두천시: "250",
      "안산시 상록구": "271",
      "안산시 단원구": "273",
      "고양시 덕양구": "281",
      "고양시 일산동구": "285",
      "고양시 일산서구": "287",
      과천시: "290",
      구리시: "310",
      남양주시: "360",
      오산시: "370",
      시흥시: "390",
      군포시: "410",
      의왕시: "430",
      하남시: "450",
      "용인시 처인구": "461",
      "용인시 기흥구": "463",
      "용인시 수지구": "465",
      파주시: "480",
      이천시: "500",
      안성시: "550",
      김포시: "570",
      "화성시 만세구": "591",
      "화성시 효행구": "593",
      "화성시 병점구": "595",
      "화성시 동탄구": "597",
      광주시: "610",
      양주시: "630",
      포천시: "650",
      여주시: "670",
      연천군: "800",
      가평군: "820",
      양평군: "830",
    },
  },
  강원도: {
    siDoCd: "51",
    siGunGuCdByName: {
      춘천시: "110",
      원주시: "130",
      강릉시: "150",
      동해시: "170",
      태백시: "190",
      속초시: "210",
      삼척시: "230",
      홍천군: "720",
      횡성군: "730",
      영월군: "750",
      평창군: "760",
      정선군: "770",
      철원군: "780",
      화천군: "790",
      양구군: "800",
      인제군: "810",
      고성군: "820",
      양양군: "830",
    },
  },
  강원특별자치도: {
    siDoCd: "51",
    siGunGuCdByName: {
      춘천시: "110",
      원주시: "130",
      강릉시: "150",
      동해시: "170",
      태백시: "190",
      속초시: "210",
      삼척시: "230",
      홍천군: "720",
      횡성군: "730",
      영월군: "750",
      평창군: "760",
      정선군: "770",
      철원군: "780",
      화천군: "790",
      양구군: "800",
      인제군: "810",
      고성군: "820",
      양양군: "830",
    },
  },
  충청북도: {
    siDoCd: "43",
    siGunGuCdByName: {
      "청주시 상당구": "111",
      "청주시 서원구": "112",
      "청주시 흥덕구": "113",
      "청주시 청원구": "114",
      충주시: "130",
      제천시: "150",
      보은군: "720",
      옥천군: "730",
      영동군: "740",
      증평군: "745",
      진천군: "750",
      괴산군: "760",
      음성군: "770",
      단양군: "800",
    },
  },
  충청남도: {
    siDoCd: "44",
    siGunGuCdByName: {
      "천안시 동남구": "131",
      "천안시 서북구": "133",
      공주시: "150",
      보령시: "180",
      아산시: "200",
      서산시: "210",
      논산시: "230",
      계룡시: "250",
      당진시: "270",
      금산군: "710",
      부여군: "760",
      서천군: "770",
      청양군: "790",
      홍성군: "800",
      예산군: "810",
      태안군: "825",
    },
  },
  전라북도: {
    siDoCd: "52",
    siGunGuCdByName: {
      "전주시 완산구": "111",
      "전주시 덕진구": "113",
      군산시: "130",
      익산시: "140",
      정읍시: "180",
      남원시: "190",
      김제시: "210",
      완주군: "710",
      진안군: "720",
      무주군: "730",
      장수군: "740",
      임실군: "750",
      순창군: "770",
      고창군: "790",
      부안군: "800",
    },
  },
  전북특별자치도: {
    siDoCd: "52",
    siGunGuCdByName: {
      "전주시 완산구": "111",
      "전주시 덕진구": "113",
      군산시: "130",
      익산시: "140",
      정읍시: "180",
      남원시: "190",
      김제시: "210",
      완주군: "710",
      진안군: "720",
      무주군: "730",
      장수군: "740",
      임실군: "750",
      순창군: "770",
      고창군: "790",
      부안군: "800",
    },
  },
  전라남도: {
    siDoCd: "46",
    siGunGuCdByName: {
      목포시: "110",
      여수시: "130",
      순천시: "150",
      나주시: "170",
      광양시: "230",
      담양군: "710",
      곡성군: "720",
      구례군: "730",
      고흥군: "740",
      보성군: "750",
      화순군: "760",
      장흥군: "770",
      강진군: "780",
      해남군: "790",
      영암군: "800",
      무안군: "810",
      함평군: "820",
      영광군: "830",
      장성군: "840",
      완도군: "850",
      진도군: "860",
      신안군: "870",
    },
  },
  경상북도: {
    siDoCd: "47",
    siGunGuCdByName: {
      "포항시 남구": "111",
      "포항시 북구": "113",
      경주시: "130",
      김천시: "150",
      안동시: "170",
      구미시: "190",
      영주시: "210",
      영천시: "230",
      상주시: "250",
      문경시: "280",
      경산시: "290",
      의성군: "730",
      청송군: "750",
      영양군: "760",
      영덕군: "770",
      청도군: "820",
      고령군: "830",
      성주군: "840",
      칠곡군: "850",
      예천군: "900",
      봉화군: "920",
      울진군: "930",
      울릉군: "940",
    },
  },
  경상남도: {
    siDoCd: "48",
    siGunGuCdByName: {
      "창원시 의창구": "121",
      "창원시 성산구": "123",
      "창원시 마산합포구": "125",
      "창원시 마산회원구": "127",
      "창원시 진해구": "129",
      진주시: "170",
      통영시: "220",
      사천시: "240",
      김해시: "250",
      밀양시: "270",
      거제시: "310",
      양산시: "330",
      의령군: "720",
      함안군: "730",
      창녕군: "740",
      고성군: "820",
      남해군: "840",
      하동군: "850",
      산청군: "860",
      함양군: "870",
      거창군: "880",
      합천군: "890",
    },
  },
  제주특별자치도: {
    siDoCd: "50",
    siGunGuCdByName: {
      제주시: "110",
      서귀포시: "130",
    },
  },
  전남광주통합특별시: {
    siDoCd: "12",
    siGunGuCdByName: {
      목포시: "110",
      여수시: "130",
      순천시: "150",
      나주시: "170",
      광양시: "190",
      동구: "210",
      서구: "240",
      남구: "270",
      북구: "300",
      광산구: "330",
      담양군: "710",
      곡성군: "720",
      구례군: "730",
      고흥군: "740",
      보성군: "750",
      화순군: "760",
      장흥군: "770",
      강진군: "780",
      해남군: "790",
      영암군: "800",
      무안군: "810",
      함평군: "820",
      영광군: "830",
      장성군: "840",
      완도군: "850",
      진도군: "860",
      신안군: "870",
    },
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

function serviceKindConcurrency() {
  const configured = Number(process.env.LONG_TERM_CARE_SERVICE_KIND_CONCURRENCY);
  return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : LONG_TERM_CARE_SERVICE_KIND_CONCURRENCY;
}

function acceptanceDetailConcurrency() {
  const configured = Number(process.env.LONG_TERM_CARE_ACCEPTANCE_DETAIL_CONCURRENCY);
  return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : LONG_TERM_CARE_ACCEPTANCE_DETAIL_CONCURRENCY;
}

async function mapInParallelBatches<T, R>(
  items: T[],
  batchSize: number,
  delayBetweenBatchesMs: number,
  mapper: (item: T, index: number) => Promise<R>,
) {
  const results: R[] = [];
  const safeBatchSize = Math.max(1, Math.floor(batchSize));

  for (let start = 0; start < items.length; start += safeBatchSize) {
    if (start > 0 && delayBetweenBatchesMs > 0) await delay(delayBetweenBatchesMs);
    const batch = items.slice(start, start + safeBatchSize);
    const batchResults = await Promise.all(batch.map((item, batchIndex) => mapper(item, start + batchIndex)));
    results.push(...batchResults);
  }

  return results;
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
  const detailAddr = pick(record, ["detailAddr"]);
  const directAddress = pick(record, ["addr", "address", "roadAddr", "roadAddrPart1", "insttAddr", "lctnAddr", "rnAdres"]);
  const roadName = pick(record, ["roadNm", "roadName"]);
  const buildingNo = buildingNoFrom(record);
  if (roadName) return [roadName, buildingNo, detailAddr].filter(Boolean).join(" ");
  if (directAddress && !/^\d/.test(directAddress) && !/^\d+번지/.test(directAddress)) return directAddress;
  return "";
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

function isUsableRoadName(roadName: string) {
  const value = roadName.trim();
  if (!value || /^\d+$/.test(value)) return false;
  return /[A-Za-z가-힣]/.test(value);
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
  if (!roadCode || !roadName || !buildingMain || !isUsableRoadName(roadName)) return null;

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

export async function fetchFacilityDetailBundle(longTermAdminSym: string, adminPttnCd: string, input?: Pick<FacilitySearchInput, "ctpvNm" | "sggNm">): Promise<FacilityDetailBundle> {
  const [generalDetail, sections] = await Promise.all([
    fetchLongTermCareGeneralDetail({ longTermAdminSym, adminPttnCd }),
    Promise.all(LONG_TERM_CARE_DETAIL_SECTIONS.map((section) =>
      fetchLongTermCareDetailSection(section, longTermAdminSym, adminPttnCd),
    )),
  ]);
  const addressResolution = generalDetail
    ? await resolveAddress(generalDetail, {
      ctpvNm: input?.ctpvNm ?? "",
      sggNm: input?.sggNm ?? "",
      facilityType: "전체",
    })
    : null;

  return {
    source: LONG_TERM_CARE_SOURCE,
    fetchedAt: new Date().toISOString(),
    longTermAdminSym,
    adminPttnCd,
    generalDetail,
    addressResolution,
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
  const rawResults = (await mapInParallelBatches(
    serviceKindCodes,
    serviceKindConcurrency(),
    serviceKindDelayMs(),
    async (serviceKind) => {
    const pages = await fetchLongTermCareListPages({
      siDoCd: codes.siDoCd,
      siGunGuCd: codes.siGunGuCd,
      serviceKind,
      adminNm: input.facilityName?.trim() ?? "",
    });
    return pages.map((raw, pageIndex) => ({
      serviceKind,
      pageNo: pageIndex + 1,
      raw,
    }));
  },
  )).flat();

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
  if (input.includeAcceptanceDetails ?? true) {
    const recordsWithAcceptance = await mapInParallelBatches(
      uniqueRecords,
      acceptanceDetailConcurrency(),
      acceptanceDetailDelayMs(),
      async (record) => {
      const acceptanceRecord = await fetchLongTermCareAcceptanceDetail(record);
      return mergeLongTermCareRecord(record, null, acceptanceRecord);
    },
    );
    enrichedRecords.push(...recordsWithAcceptance);
  } else {
    enrichedRecords.push(...uniqueRecords.map((record) => mergeLongTermCareRecord(record, null, null)));
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
