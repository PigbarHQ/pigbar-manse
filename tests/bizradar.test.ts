import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { GET as fetchTenderAttachments } from "../app/api/bizradar/tenders/attachments/route";
import { GET as fetchTenderBasePrice } from "../app/api/bizradar/tenders/base-price/route";
import { GET as fetchTenderHistory } from "../app/api/bizradar/tenders/history/route";
import { GET as fetchTenderLicenses } from "../app/api/bizradar/tenders/licenses/route";
import { GET as listTenders } from "../app/api/bizradar/tenders/list/route";
import { GET as fetchTenderRegions } from "../app/api/bizradar/tenders/regions/route";
import { POST as importCompanyKnowledge } from "../app/api/bizradar/company/import/route";
import { BIZRADAR_COMPANY_PROFILE_STORAGE_KEY, parseCompanyListInput } from "../src/lib/bizradar/company";
import { buildCompanyProfileDraftFromText, extractCompanyKnowledgeText } from "../src/lib/bizradar/companyKnowledge";
import { buildCompanyTenderMatch, formatTenderAmount, normalizeTenderContractMethod, normalizeTenderItem, parseTenderKeywords, summarizeCompanyMatch, tenderBusinessTypeLabel } from "../src/lib/bizradar";

test("BizRadar tender normalizer maps G2B bid fields to TenderOpportunity", () => {
  const item = normalizeTenderItem({
    bidNtceNo: "R25BK00000001",
    bidNtceOrd: "000",
    bidNtceNm: "AI 기반 상담 시스템 구축",
    ntceInsttNm: "조달청",
    dminsttNm: "인천광역시",
    bidNtceDt: "2026-07-14 10:00:00",
    bidBeginDt: "2026-07-15 10:00:00",
    bidClseDt: "2026-07-20 10:00:00",
    opengDt: "2026-07-21 11:00:00",
    presmptPrce: "100000000",
    cntrctCnclsMthdNm: "일반경쟁",
    bidMethdNm: "전자입찰",
    prtcptPsblRgnNm: "인천광역시, 서울특별시",
    indstrytyNm: "소프트웨어사업자",
  }, "service");

  assert.equal(item.bidNoticeNo, "R25BK00000001");
  assert.equal(item.bidNoticeOrd, "000");
  assert.equal(item.title, "AI 기반 상담 시스템 구축");
  assert.equal(item.businessType, "service");
  assert.equal(item.orderingAgency, "조달청");
  assert.equal(item.demandAgency, "인천광역시");
  assert.equal(item.estimatedPrice, 100000000);
  assert.equal(normalizeTenderItem({ presmptPrce: "0", bidNtceNm: "금액 미공개" }, "service").estimatedPrice, undefined);
  assert.deepEqual(item.allowedRegions, ["인천광역시", "서울특별시"]);
  assert.deepEqual(item.licenseRestrictions, ["소프트웨어사업자"]);
});

test("BizRadar tender list route calls confirmed G2B service endpoint without exposing key to client", async () => {
  const previousKey = process.env.DATA_GO_KR_SERVICE_KEY;
  const calls: string[] = [];
  process.env.DATA_GO_KR_SERVICE_KEY = "test-secret-key";

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);
    return new Response(JSON.stringify({
      response: {
        header: {
          resultCode: "00",
          resultMsg: "정상",
        },
        body: {
          items: [
            {
              bidNtceNo: "R25BK00000001",
              bidNtceOrd: "000",
              bidNtceNm: "AI 기반 상담 시스템 구축",
              ntceInsttNm: "조달청",
              dminsttNm: "인천광역시",
            },
          ],
          totalCount: 1,
        },
      },
    }));
  }) as typeof fetch;

  const response = await listTenders(new Request("http://localhost/api/bizradar/tenders/list?businessType=service&keyword=AI&demandAgencyName=%EC%9D%B8%EC%B2%9C%EA%B4%91%EC%97%AD%EC%8B%9C&noticeStartDate=2026-07-01&noticeEndDate=2026-07-31"));
  const payload = await response.json();
  const calledUrl = new URL(calls[0]);
  const clientSource = readFileSync("src/components/bizradar/BizRadarTendersClient.tsx", "utf-8");

  assert.equal(response.status, 200);
  assert.equal(payload.operation, "getBidPblancListInfoServcPPSSrch");
  assert.equal(payload.items.length, 1);
  assert.equal(payload.items[0].title, "AI 기반 상담 시스템 구축");
  assert.equal(calledUrl.pathname.endsWith("/getBidPblancListInfoServcPPSSrch"), true);
  assert.equal(calledUrl.searchParams.get("ServiceKey"), "test-secret-key");
  assert.equal(calledUrl.searchParams.get("type"), "json");
  assert.equal(calledUrl.searchParams.get("bidNtceNm"), "AI");
  assert.equal(calledUrl.searchParams.get("dminsttNm"), "인천광역시");
  assert.equal(calledUrl.searchParams.get("inqryBgnDt"), "202607010000");
  assert.equal(calledUrl.searchParams.get("inqryEndDt"), "202607312359");
  assert.equal(clientSource.includes("DATA_GO_KR_SERVICE_KEY"), false);
  assert.equal(clientSource.includes("ServiceKey"), false);

  process.env.DATA_GO_KR_SERVICE_KEY = previousKey;
});

test("BizRadar tender list route uses primary keyword once and filters by all keywords", async () => {
  const previousKey = process.env.DATA_GO_KR_SERVICE_KEY;
  const calls: string[] = [];
  process.env.DATA_GO_KR_SERVICE_KEY = "test-secret-key";

  globalThis.fetch = (async (input: string | URL | Request) => {
    calls.push(String(input));
    const items = [
      { bidNtceNo: "R25BK00000001", bidNtceOrd: "000", bidNtceNm: "AI 기반 상담 시스템 구축" },
      { bidNtceNo: "R25BK00000002", bidNtceOrd: "000", bidNtceNm: "AI 인증 플랫폼 구축", prtcptPsblRgnNm: "인천광역시", indstrytyNm: "소프트웨어사업자" },
      { bidNtceNo: "R25BK00000003", bidNtceOrd: "000", bidNtceNm: "AI 인증 운영 사업", prtcptPsblRgnNm: "서울특별시" },
    ];
    return new Response(JSON.stringify({
      response: {
        header: { resultCode: "00", resultMsg: "정상" },
        body: { items, totalCount: items.length },
      },
    }));
  }) as typeof fetch;

  const response = await listTenders(new Request("http://localhost/api/bizradar/tenders/list?businessType=service&keyword=AI,%20%EC%9D%B8%EC%A6%9D&regionRestriction=yes&licenseRestriction=yes&noticeStartDate=2026-07-01&noticeEndDate=2026-07-31"));
  const payload = await response.json();
  const calledKeywords = calls.map((call) => new URL(call).searchParams.get("bidNtceNm"));

  assert.equal(response.status, 200);
  assert.deepEqual(parseTenderKeywords("AI, 인증\n결제"), ["AI", "인증", "결제"]);
  assert.deepEqual(calledKeywords, ["AI"]);
  assert.equal(payload.items.length, 1);
  assert.equal(payload.items[0].title, "AI 인증 플랫폼 구축");
  assert.deepEqual(payload.searchKeywords, ["AI", "인증"]);
  assert.equal(payload.keywordMode, "and");

  process.env.DATA_GO_KR_SERVICE_KEY = previousKey;
});

test("BizRadar tender search UI explains default AND keyword behavior without selector", () => {
  const clientSource = readFileSync("src/components/bizradar/BizRadarTendersClient.tsx", "utf-8");

  assert.equal(clientSource.includes('useState("")'), true);
  assert.equal(clientSource.includes('placeholder="인증, 개발"'), true);
  assert.equal(clientSource.includes("기본은 AND 검색입니다."), true);
  assert.equal(clientSource.includes("입력한 내용만 조회합니다."), true);
  assert.equal(clientSource.includes("setDemandAgencyName"), true);
  assert.equal(clientSource.includes("setBidNoticeNo"), true);
  assert.equal(clientSource.includes("setRegionRestriction"), true);
  assert.equal(clientSource.includes("setLicenseRestriction"), true);
  assert.equal(clientSource.includes("API 연동 후 제공"), false);
  assert.equal(clientSource.includes("OR 검색"), false);
  assert.equal(clientSource.includes("AND 후처리"), false);
  assert.equal(clientSource.includes("keywordMode"), false);
});

test("BizRadar entry and pages are present", () => {
  const workspaceSource = readFileSync("src/components/blueprint/BlueprintClassicalWorkspace.tsx", "utf-8");
  const homeSource = readFileSync("app/bizradar/page.tsx", "utf-8");
  const tendersSource = readFileSync("app/bizradar/tenders/page.tsx", "utf-8");
  const companyPageSource = readFileSync("app/bizradar/company/page.tsx", "utf-8");
  const companyImportPageSource = readFileSync("app/bizradar/company/import/page.tsx", "utf-8");
  const companyClientSource = readFileSync("src/components/bizradar/BizRadarCompanyClient.tsx", "utf-8");
  const companyImportClientSource = readFileSync("src/components/bizradar/BizRadarCompanyImportClient.tsx", "utf-8");

  assert.equal(workspaceSource.includes('href="/bizradar"'), true);
  assert.equal(workspaceSource.includes("BizRadar"), true);
  assert.equal(homeSource.includes("나라장터 입찰공고"), true);
  assert.equal(homeSource.includes('href="/bizradar/company"'), true);
  assert.equal(homeSource.includes('href="/bizradar/company/import"'), true);
  assert.equal(tendersSource.includes("BizRadarTendersClient"), true);
  assert.equal(companyPageSource.includes("BizRadarCompanyClient"), true);
  assert.equal(companyImportPageSource.includes("BizRadarCompanyImportClient"), true);
  assert.equal(companyClientSource.includes("window.localStorage"), true);
  assert.equal(companyClientSource.includes('href="/bizradar/company/import"'), true);
  assert.equal(companyClientSource.includes("회사명"), true);
  assert.equal(companyClientSource.includes("사업자번호(선택)"), true);
  assert.equal(companyClientSource.includes("직접생산"), true);
  assert.equal(companyImportClientSource.includes("localStorage.setItem"), true);
  assert.equal(companyImportClientSource.includes('fetch("/api/bizradar/company/import"'), true);
  assert.equal(companyImportClientSource.includes("accept={ACCEPTED_TYPES}"), true);
});

test("BizRadar tender supplement routes call confirmed detail endpoints", async () => {
  const previousKey = process.env.DATA_GO_KR_SERVICE_KEY;
  const calls: string[] = [];
  process.env.DATA_GO_KR_SERVICE_KEY = "test-secret-key";

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);
    return new Response(JSON.stringify({
      response: {
        header: {
          resultCode: "00",
          resultMsg: "정상",
        },
        body: {
          items: [
            {
              bidNtceNo: "R25BK00000001",
              bidNtceOrd: "000",
              lcnsLmtNm: "소프트웨어사업자",
              prtcptPsblRgnNm: "인천광역시",
              bssamt: "1000000",
              chgHstry: "변경 없음",
              fileNm: "공고서.pdf",
            },
          ],
        },
      },
    }));
  }) as typeof fetch;

  const requestUrl = "http://localhost/api/bizradar/tenders/detail?businessType=service&bidNoticeNo=R25BK00000001&bidNoticeOrd=000";
  const responses = await Promise.all([
    fetchTenderLicenses(new Request(requestUrl)),
    fetchTenderRegions(new Request(requestUrl)),
    fetchTenderBasePrice(new Request(requestUrl)),
    fetchTenderHistory(new Request(requestUrl)),
    fetchTenderAttachments(new Request(requestUrl)),
  ]);
  const payloads = await Promise.all(responses.map((response) => response.json()));
  const calledPaths = calls.map((call) => new URL(call).pathname);

  assert.deepEqual(responses.map((response) => response.status), [200, 200, 200, 200, 200]);
  assert.equal(payloads[0].operation, "getBidPblancListInfoLicenseLimit");
  assert.equal(payloads[1].operation, "getBidPblancListInfoPrtcptPsblRgn");
  assert.equal(payloads[2].operation, "getBidPblancListInfoServcBsisAmount");
  assert.equal(payloads[3].operation, "getBidPblancListInfoChgHstryServc");
  assert.equal(payloads[4].operation, "getBidPblancListInfoEorderAtchFileInfo");
  assert.equal(calledPaths.some((path) => path.endsWith("/getBidPblancListInfoLicenseLimit")), true);
  assert.equal(calledPaths.some((path) => path.endsWith("/getBidPblancListInfoPrtcptPsblRgn")), true);
  assert.equal(calledPaths.some((path) => path.endsWith("/getBidPblancListInfoServcBsisAmount")), true);
  assert.equal(calledPaths.some((path) => path.endsWith("/getBidPblancListInfoChgHstryServc")), true);
  assert.equal(calledPaths.some((path) => path.endsWith("/getBidPblancListInfoEorderAtchFileInfo")), true);

  process.env.DATA_GO_KR_SERVICE_KEY = previousKey;
});

test("BizRadar tender supplement route returns unsupported without fake data when endpoint is not confirmed", async () => {
  const previousKey = process.env.DATA_GO_KR_SERVICE_KEY;
  process.env.DATA_GO_KR_SERVICE_KEY = "test-secret-key";

  const response = await fetchTenderBasePrice(new Request("http://localhost/api/bizradar/tenders/base-price?businessType=foreign&bidNoticeNo=R25BK00000001"));
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.supported, false);
  assert.deepEqual(payload.items, []);
  assert.equal(payload.raw.businessType, "foreign");

  process.env.DATA_GO_KR_SERVICE_KEY = previousKey;
});

test("BizRadar tender summary helpers normalize labels and amount for fast reading", () => {
  assert.equal(tenderBusinessTypeLabel("service"), "용역");
  assert.equal(tenderBusinessTypeLabel("goods"), "물품");
  assert.equal(normalizeTenderContractMethod("제한경쟁입찰"), "제한경쟁");
  assert.equal(normalizeTenderContractMethod("일반경쟁"), "일반경쟁");
  assert.equal(normalizeTenderContractMethod("협상에 의한 계약"), "협상계약");
  assert.equal(formatTenderAmount(100000000), "1억원");
  assert.equal(formatTenderAmount(125000000), "1.3억원");
  assert.equal(formatTenderAmount(1000000), "100만원");
  assert.equal(formatTenderAmount(0), "정보 없음");
  assert.equal(formatTenderAmount(undefined), "정보 없음");

  const clientSource = readFileSync("src/components/bizradar/BizRadarTendersClient.tsx", "utf-8");
  assert.equal(clientSource.includes("TenderSummaryCard"), true);
  assert.equal(clientSource.includes("면허제한"), true);
  assert.equal(clientSource.includes("참가가능지역"), true);
  assert.equal(clientSource.includes("첨부파일"), true);
  assert.equal(clientSource.includes("변경이력"), true);
  assert.equal(clientSource.includes("Raw JSON 보기"), true);
});

test("BizRadar company profile uses LocalStorage key and parses list inputs", () => {
  assert.equal(BIZRADAR_COMPANY_PROFILE_STORAGE_KEY, "pigbar.bizradar.companyProfile.v1");
  assert.deepEqual(parseCompanyListInput("AI 상담, 데이터 수집\n웹 서비스 개발"), ["AI 상담", "데이터 수집", "웹 서비스 개발"]);

  const companySource = readFileSync("src/components/bizradar/BizRadarCompanyClient.tsx", "utf-8");
  assert.equal(companySource.includes("fetch("), false);
  assert.equal(companySource.includes("localStorage.setItem"), true);
  assert.equal(companySource.includes("localStorage.removeItem"), true);
});

test("BizRadar Company Match engine compares company profile with tender requirements by rule", () => {
  const results = buildCompanyTenderMatch({
    companyName: "피그바랩",
    businessRegistrationNumber: "",
    industry: "소프트웨어 개발",
    region: "인천광역시 미추홀구",
    employeeCount: "5~9명",
    revenueRange: "1억~5억",
    technologies: ["AI 상담", "데이터 수집"],
    certifications: ["벤처기업확인"],
    licenses: ["소프트웨어사업자"],
    directProduction: "정보시스템개발서비스 직접생산",
    majorPerformances: ["공공기관 상담 시스템 구축"],
  }, {
    title: "AI 상담 시스템 구축",
    businessType: "service",
    contractMethod: "제한경쟁",
    bidMethod: "전자입찰",
    allowedRegions: ["인천광역시"],
    licenseRestrictions: ["소프트웨어사업자"],
    summaryText: "소프트웨어 개발 AI 상담 데이터 수집 벤처기업확인 직접생산 공공기관 상담 시스템",
  });
  const summary = summarizeCompanyMatch(results);
  const clientSource = readFileSync("src/components/bizradar/BizRadarTendersClient.tsx", "utf-8");

  assert.equal(results.find((result) => result.key === "licenses")?.status, "Match");
  assert.equal(results.find((result) => result.key === "region")?.status, "Match");
  assert.equal(results.find((result) => result.key === "directProduction")?.status, "Match");
  assert.equal(summary.match >= 5, true);
  assert.equal(clientSource.includes("CompanyMatchCard"), true);
  assert.equal(clientSource.includes("추가 확인"), true);
  assert.equal(clientSource.includes("판단 기준 보기"), true);
  assert.equal(clientSource.includes("companyMatchCriteria"), true);
  assert.equal(clientSource.includes("회사 프로필 수정"), true);
});

test("BizRadar Company Match reports mismatch and unknown without AI or DB", () => {
  const results = buildCompanyTenderMatch({
    companyName: "피그바랩",
    businessRegistrationNumber: "",
    industry: "소프트웨어 개발",
    region: "서울특별시",
    employeeCount: "",
    revenueRange: "",
    technologies: [],
    certifications: [],
    licenses: [],
    directProduction: "",
    majorPerformances: [],
  }, {
    title: "시설 공사",
    businessType: "construction",
    allowedRegions: ["인천광역시"],
    licenseRestrictions: ["정보통신공사업"],
    summaryText: "시설 공사 면허 제한",
  });
  const summary = summarizeCompanyMatch(results);
  const clientSource = readFileSync("src/components/bizradar/BizRadarTendersClient.tsx", "utf-8");

  assert.equal(results.find((result) => result.key === "licenses")?.status, "Mismatch");
  assert.equal(results.find((result) => result.key === "region")?.status, "Mismatch");
  assert.equal(results.find((result) => result.key === "technologies")?.status, "Unknown");
  assert.equal(summary.mismatch >= 2, true);
  assert.equal(clientSource.includes("openai"), false);
  assert.equal(clientSource.includes("fetch(\"/api/bizradar/company"), false);
  assert.equal(clientSource.includes("참가조건 확인 · 준비 중"), false);
  assert.equal(clientSource.includes("첨부파일 보기 · 준비 중"), false);
  assert.equal(clientSource.includes("tender-participation"), true);
  assert.equal(clientSource.includes("tender-attachments"), true);
});

test("BizRadar Company Knowledge extracts simple PDF text and builds fallback profile", async () => {
  const document = await extractCompanyKnowledgeText(
    "회사소개서.pdf",
    Buffer.from("%PDF-1.7\n(회사명: 피그바랩) Tj\n(업종: 소프트웨어 개발) Tj\n(인천광역시 미추홀구 AI 상담 데이터 플랫폼 구축 실적 벤처기업확인 소프트웨어사업자 직접생산확인) Tj\n%%EOF"),
  );
  const profile = buildCompanyProfileDraftFromText(document.extractedText);

  assert.equal(document.fileType, "pdf");
  assert.equal(document.extractedText.includes("피그바랩"), true);
  assert.equal(profile.companyName, "피그바랩");
  assert.equal(profile.industry.includes("소프트웨어"), true);
  assert.equal(profile.region, "인천광역시 미추홀구");
  assert.equal(profile.technologies.includes("AI"), true);
  assert.equal(profile.certifications.includes("벤처기업"), true);
  assert.equal(profile.licenses.includes("소프트웨어사업자"), true);
});

test("BizRadar Company Knowledge import route uses OpenAI for draft profile and keeps DB out", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousModel = process.env.OPENAI_BLUEPRINT_MODEL;
  process.env.OPENAI_API_KEY = "sk-test-company-knowledge";
  process.env.OPENAI_BLUEPRINT_MODEL = "gpt-5.5";

  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    assert.equal(String(input), "https://api.openai.com/v1/responses");
    assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer sk-test-company-knowledge");
    return new Response(JSON.stringify({
      output_text: JSON.stringify({
        companyName: "피그바랩",
        businessRegistrationNumber: "123-45-67890",
        industry: "소프트웨어 개발 및 공급업",
        region: "인천광역시 미추홀구",
        employeeCount: "5~9명",
        revenueRange: "1억~5억",
        technologies: ["AI 상담", "데이터 수집"],
        certifications: ["벤처기업확인"],
        licenses: ["소프트웨어사업자"],
        directProduction: "정보시스템개발서비스 직접생산 확인",
        majorPerformances: ["공공기관 상담 시스템 구축"],
      }),
    }));
  }) as typeof fetch;

  const formData = new FormData();
  formData.append("files", new File([
    Buffer.from("%PDF-1.7\n(회사명: 피그바랩) Tj\n(소프트웨어 개발 AI 상담 공공기관 상담 시스템 구축) Tj\n%%EOF"),
  ], "profile.pdf", { type: "application/pdf" }));

  const response = await importCompanyKnowledge(new Request("http://localhost/api/bizradar/company/import", {
    method: "POST",
    body: formData,
  }));
  const payload = await response.json();
  const routeSource = readFileSync("app/api/bizradar/company/import/route.ts", "utf-8");
  const clientSource = readFileSync("src/components/bizradar/BizRadarCompanyImportClient.tsx", "utf-8");

  assert.equal(response.status, 200);
  assert.equal(payload.source, "bizradar-company-import");
  assert.equal(payload.usesAi, true);
  assert.equal(payload.model, "gpt-5.5");
  assert.equal(payload.draftProfile.companyName, "피그바랩");
  assert.equal(payload.draftProfile.technologies.includes("AI 상담"), true);
  assert.equal(routeSource.includes("database"), false);
  assert.equal(routeSource.includes("prisma"), false);
  assert.equal(clientSource.includes("localStorage.setItem"), true);

  process.env.OPENAI_API_KEY = previousKey;
  process.env.OPENAI_BLUEPRINT_MODEL = previousModel;
});
