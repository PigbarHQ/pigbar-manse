import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { GET as analyzeWelfareAttachment } from "../app/api/welfare/attachment/analyze/route";
import { GET as fetchLongTermCareFacilityDetail } from "../app/api/welfare/facilities/long-term-care/detail/route";
import { GET as searchLongTermCareFacilities } from "../app/api/welfare/facilities/long-term-care/list/route";
import { evaluationAForLongTermAdminSym, normalizeLongTermCareFacilityKey } from "../src/lib/welfare/ltc-evaluation-a";
import { longTermCareCodesFor } from "../src/lib/welfare/ltc-service-type-map";
import { fetchLocalWelfareDetail, fetchLocalWelfareList, fetchNationalWelfareDetail, fetchNationalWelfareList, parseXmlToJson, WelfareApiError } from "../src/lib/welfare/national";

process.env.LONG_TERM_CARE_SERVICE_KIND_DELAY_MS ??= "0";
process.env.LONG_TERM_CARE_ACCEPTANCE_DETAIL_DELAY_MS ??= "0";

test("Long-term care 전체 facility type expands to all known LTC serviceKind codes", () => {
  assert.deepEqual(longTermCareCodesFor("전체"), [
    "B03",
    "C03",
    "B01",
    "C01",
    "B05",
    "C05",
    "B02",
    "C02",
    "B04",
    "C04",
    "C06",
    "A01",
    "A02",
    "A03",
    "A04",
    "A05",
    "AAA",
    "S41",
  ]);
  assert.equal(longTermCareCodesFor("전체").includes(""), false);
});

test("Long-term care evaluation A index maps facility symbol as lookup key", () => {
  const records = evaluationAForLongTermAdminSym("11144000012");

  assert.equal(records.length > 0, true);
  assert.equal(records[0].facilitySymbol, "1-11440-00012");
  assert.equal(normalizeLongTermCareFacilityKey(records[0].facilitySymbol), "11144000012");
  assert.equal(records[0].facilityName, "시립서부노인전문요양센터");
  assert.equal(records[0].aGradeCount, 6);
});

test("Welfare XML parser and normalizer create list response without exposing service key to UI", async () => {
  const previousKey = process.env.DATA_GO_KR_SERVICE_KEY;
  const calls: string[] = [];
  process.env.DATA_GO_KR_SERVICE_KEY = "test-secret-key";

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);
    return new Response(`
      <response>
        <body>
          <servList>
            <servId>SVC001</servId>
            <servNm>노인맞춤돌봄서비스</servNm>
            <jurMnofNm>보건복지부</jurMnofNm>
            <jurOrgNm>복지로</jurOrgNm>
            <servDgst>돌봄이 필요한 노인을 지원합니다.</servDgst>
            <lifeArray>노년</lifeArray>
            <intrsThemaArray>돌봄</intrsThemaArray>
            <trgterIndvdlArray>노인</trgterIndvdlArray>
            <sprtCycNm>수시</sprtCycNm>
            <srvPvsnNm>서비스</srvPvsnNm>
            <onapPsbltYn>Y</onapPsbltYn>
            <inqNum>129</inqNum>
            <servDtlLink>https://example.test/detail</servDtlLink>
          </servList>
        </body>
      </response>
    `);
  }) as typeof fetch;

  const result = await fetchNationalWelfareList("노인", { lifeArray: "006" });
  const calledUrl = new URL(calls[0]);

  assert.equal(result.source, "bokjiro-national");
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].source, "bokjiro-national");
  assert.equal(result.items[0].id, "SVC001");
  assert.equal(result.items[0].name, "노인맞춤돌봄서비스");
  assert.equal(result.items[0].provider, "복지로");
  assert.equal(result.items[0].region, "전국");
  assert.equal(result.items[0].ministry, "보건복지부");
  assert.equal(result.items[0].detailLink, "https://example.test/detail");
  assert.equal(calledUrl.pathname.endsWith("/NationalWelfarelistV001"), true);
  assert.equal(calledUrl.searchParams.get("callTp"), "L");
  assert.equal(calledUrl.searchParams.get("lifeArray"), "006");
  assert.equal(calledUrl.searchParams.get("searchWrd"), "노인");
  assert.equal(calledUrl.searchParams.get("serviceKey"), "test-secret-key");

  process.env.DATA_GO_KR_SERVICE_KEY = previousKey;
});

test("Welfare API 429 is surfaced as a retryable welfare API error", async () => {
  const previousKey = process.env.DATA_GO_KR_SERVICE_KEY;
  process.env.DATA_GO_KR_SERVICE_KEY = "test-secret-key";

  globalThis.fetch = (async () => new Response("<response><resultCode>429</resultCode></response>", {
    status: 429,
    headers: {
      "retry-after": "60",
    },
  })) as typeof fetch;

  await assert.rejects(
    () => fetchNationalWelfareList("429-rate-limit-test"),
    (error) => {
      assert.equal(error instanceof WelfareApiError, true);
      assert.equal((error as WelfareApiError).status, 429);
      assert.equal((error as WelfareApiError).retryAfter, "60");
      assert.match((error as Error).message, /요청 제한/);
      return true;
    },
  );

  process.env.DATA_GO_KR_SERVICE_KEY = previousKey;
});

test("Welfare detail normalizer maps required detail fields", async () => {
  const previousKey = process.env.DATA_GO_KR_SERVICE_KEY;
  process.env.DATA_GO_KR_SERVICE_KEY = "test-secret-key";

  globalThis.fetch = (async () => new Response(`
    <response>
      <body>
        <servDtl>
          <servId>SVC001</servId>
          <servNm>노인맞춤돌봄서비스</servNm>
          <jurMnofNm>보건복지부</jurMnofNm>
          <servDgst>요약</servDgst>
          <tgtrDtlCn>지원대상</tgtrDtlCn>
          <slctCritCn>선정기준</slctCritCn>
          <alwServCn>지원내용</alwServCn>
          <aplyMtdCn>신청방법</aplyMtdCn>
          <inqplCtadr>129</inqplCtadr>
          <hmpgUrl>https://example.test</hmpgUrl>
          <baslawNm>사회보장급여법</baslawNm>
          <basfrmNm>신청서</basfrmNm>
        </servDtl>
      </body>
    </response>
  `)) as typeof fetch;

  const result = await fetchNationalWelfareDetail("SVC001");

  assert.equal(result.source, "bokjiro-national");
  assert.equal(result.item.source, "bokjiro-national");
  assert.equal(result.item.id, "SVC001");
  assert.equal(result.item.provider, "보건복지부");
  assert.equal(result.item.region, "전국");
  assert.equal(result.item.targetDetail, "지원대상");
  assert.equal(result.item.selectionCriteria, "선정기준");
  assert.equal(result.item.benefitContent, "지원내용");
  assert.equal(result.item.applicationMethods, "신청방법");
  assert.deepEqual(result.item.applicationLinks, []);
  assert.deepEqual(result.item.contacts, ["129"]);
  assert.deepEqual(result.item.homepages, ["https://example.test"]);
  assert.deepEqual(result.item.laws, ["사회보장급여법"]);
  assert.deepEqual(result.item.forms, [
    {
      name: "신청서",
      url: "",
      extension: "",
    },
  ]);

  process.env.DATA_GO_KR_SERVICE_KEY = previousKey;
});

test("Welfare detail normalizer supports wantedDtl response shape", async () => {
  const previousKey = process.env.DATA_GO_KR_SERVICE_KEY;
  process.env.DATA_GO_KR_SERVICE_KEY = "test-secret-key";

  globalThis.fetch = (async () => new Response(`
    <response>
      <wantedDtl>
        <servId>WLF00001133</servId>
        <servNm>장애인 건강검진기관 지원</servNm>
        <jurMnofNm>보건복지부 장애인건강과</jurMnofNm>
        <tgtrDtlCn>건강검진을 시행하는 기관 중 장애인 건강검진 기관을 지정하여 지원하고 있으며, 노인 등 거동이 불편한 분들도 이용이 가능합니다.</tgtrDtlCn>
        <slctCritCn>지원대상의 내용을 참고해 주시기 바랍니다.</slctCritCn>
        <alwServCn>장애친화적인 시설장비인력을 갖춘 장애인 건강검진기관을 지정지원하여, 장애인에게 안전한 건강검진 서비스를 제공합니다.</alwServCn>
        <rprsCtadr>129</rprsCtadr>
        <wlfareInfoOutlCn>장애인 건강검진기관을 지정·지원하여 장애인의 건강검진 이용 접근성을 보장하고, 장애인·비장애인 수검률 격차를 해소하고자 합니다.</wlfareInfoOutlCn>
        <applmetList>
          <servSeDetailNm>신청기관연락처목록</servSeDetailNm>
          <servSeDetailLink>거주지 읍/면/동 주민센터, 장애인 건강검진기관에서 ‘서비스 신청’</servSeDetailLink>
        </applmetList>
        <inqplCtadrList>
          <servSeDetailNm>보건복지상담센터</servSeDetailNm>
          <servSeDetailLink>129</servSeDetailLink>
        </inqplCtadrList>
        <inqplHmpgReldList>
          <servSeDetailNm>보건복지상담센터</servSeDetailNm>
          <servSeDetailLink>http://www.129.go.kr</servSeDetailLink>
        </inqplHmpgReldList>
        <inqplHmpgReldList>
          <servSeDetailNm>PDF 안내서</servSeDetailNm>
          <servSeDetailLink>https://www.bokjiro.go.kr/form/guide.pdf</servSeDetailLink>
        </inqplHmpgReldList>
        <baslawList>
          <servSeDetailNm>장애인 건강권 및 의료접근성 보장에 관한 법률</servSeDetailNm>
        </baslawList>
        <basfrmList>
          <wlfareInfoReldNm>2026년 운영기준</wlfareInfoReldNm>
          <wlfareInfoReldCn>https://www.bokjiro.go.kr/form/standard.hwpx</wlfareInfoReldCn>
        </basfrmList>
        <basfrmList>
          <wlfareInfoReldNm>2026년 신청서식.pdf</wlfareInfoReldNm>
          <wlfareInfoReldCn>https://www.bokjiro.go.kr/form/getDownload.do?fileId=123</wlfareInfoReldCn>
        </basfrmList>
      </wantedDtl>
    </response>
  `)) as typeof fetch;

  const result = await fetchNationalWelfareDetail("WLF00001133");

  assert.equal(result.item.id, "WLF00001133");
  assert.equal(result.item.source, "bokjiro-national");
  assert.equal(result.item.name, "장애인 건강검진기관 지원");
  assert.equal(result.item.provider, "보건복지부 장애인건강과");
  assert.equal(result.item.ministry, "보건복지부 장애인건강과");
  assert.match(result.item.summary, /건강검진 이용 접근성/);
  assert.match(result.item.targetDetail, /노인 등 거동이 불편한 분들도 이용/);
  assert.match(result.item.selectionCriteria, /지원대상/);
  assert.match(result.item.benefitContent, /장애친화적인 시설장비인력/);
  assert.match(result.item.applicationMethods, /서비스 신청/);
  assert.deepEqual(result.item.applicationLinks, ["신청기관연락처목록: 거주지 읍/면/동 주민센터, 장애인 건강검진기관에서 ‘서비스 신청’"]);
  assert.deepEqual(result.item.contacts, ["보건복지상담센터: 129"]);
  assert.deepEqual(result.item.homepages, ["보건복지상담센터: http://www.129.go.kr", "PDF 안내서: https://www.bokjiro.go.kr/form/guide.pdf"]);
  assert.deepEqual(result.item.laws, ["장애인 건강권 및 의료접근성 보장에 관한 법률"]);
  assert.deepEqual(result.item.forms, [
    {
      name: "2026년 운영기준",
      url: "https://www.bokjiro.go.kr/form/standard.hwpx",
      extension: "",
    },
    {
      name: "2026년 신청서식.pdf",
      url: "https://www.bokjiro.go.kr/form/getDownload.do?fileId=123",
      extension: "pdf",
    },
  ]);
  assert.match(result.item.homepages.join("\n"), /guide\.pdf/);

  process.env.DATA_GO_KR_SERVICE_KEY = previousKey;
});

test("Welfare test UI and API routes keep service key on the server", () => {
  const workspaceSource = readFileSync(new URL("../src/components/blueprint/BlueprintClassicalWorkspace.tsx", import.meta.url), "utf8");
  const pageSource = readFileSync(new URL("../src/components/welfare/WelfareTestClient.tsx", import.meta.url), "utf8");
  const listRouteSource = readFileSync(new URL("../app/api/welfare/national/list/route.ts", import.meta.url), "utf8");
  const detailRouteSource = readFileSync(new URL("../app/api/welfare/national/detail/route.ts", import.meta.url), "utf8");
  const localListRouteSource = readFileSync(new URL("../app/api/welfare/local/list/route.ts", import.meta.url), "utf8");
  const localDetailRouteSource = readFileSync(new URL("../app/api/welfare/local/detail/route.ts", import.meta.url), "utf8");
  const welfareLibSource = readFileSync(new URL("../src/lib/welfare/national.ts", import.meta.url), "utf8");

  assert.match(workspaceSource, /복지혜택 테스트/);
  assert.match(workspaceSource, /href="\/welfare-test"/);
  assert.match(pageSource, /검색어/);
  assert.match(pageSource, /노년 대상만 보기/);
  assert.match(pageSource, /lifeArray/);
  assert.match(pageSource, /인천광역시/);
  assert.match(pageSource, /미추홀구/);
  assert.match(pageSource, /ctpvNm/);
  assert.match(pageSource, /sggNm/);
  assert.match(pageSource, /서비스명/);
  assert.match(pageSource, /제공기관/);
  assert.match(pageSource, /지역/);
  assert.match(pageSource, /서비스요약/);
  assert.match(pageSource, /지원대상/);
  assert.match(pageSource, /선정기준/);
  assert.match(pageSource, /지원내용/);
  assert.match(pageSource, /신청방법/);
  assert.match(pageSource, /문의처/);
  assert.match(pageSource, /근거법령/);
  assert.match(pageSource, /원문 링크/);
  assert.match(pageSource, /상세 응답 raw JSON/);
  assert.match(pageSource, /상담용 추천 후보/);
  assert.match(pageSource, /생활지원/);
  assert.match(pageSource, /보호·돌봄/);
  assert.match(pageSource, /일자리/);
  assert.match(pageSource, /주거/);
  assert.match(pageSource, /안전·위기/);
  assert.match(pageSource, /에너지/);
  assert.match(pageSource, /저소득/);
  assert.match(pageSource, /장애인/);
  assert.match(pageSource, /selectedId/);
  assert.match(pageSource, /scrollIntoView/);
  assert.match(pageSource, /생애주기/);
  assert.match(pageSource, /관심주제/);
  assert.match(pageSource, /가구유형/);
  assert.match(pageSource, /온라인/);
  assert.match(pageSource, /Promise\.allSettled/);
  assert.match(pageSource, /중앙정부/);
  assert.match(pageSource, /지자체/);
  assert.match(pageSource, /\/api\/welfare\/national\/list/);
  assert.match(pageSource, /\/api\/welfare\/national\/detail/);
  assert.match(pageSource, /\/api\/welfare\/local\/list/);
  assert.match(pageSource, /\/api\/welfare\/local\/detail/);
  assert.doesNotMatch(pageSource, /DATA_GO_KR_SERVICE_KEY|serviceKey/);
  assert.match(listRouteSource, /fetchNationalWelfareList/);
  assert.match(listRouteSource, /lifeArray/);
  assert.match(detailRouteSource, /fetchNationalWelfareDetail/);
  assert.match(localListRouteSource, /fetchLocalWelfareList/);
  assert.match(localListRouteSource, /인천광역시/);
  assert.match(localListRouteSource, /미추홀구/);
  assert.match(localListRouteSource, /ctpvNm/);
  assert.match(localListRouteSource, /sggNm/);
  assert.match(localListRouteSource, /lifeArray/);
  assert.match(localDetailRouteSource, /fetchLocalWelfareDetail/);
  assert.match(welfareLibSource, /LocalGovernmentWelfareInformations/);
  assert.match(welfareLibSource, /LcgvWelfarelist/);
  assert.match(welfareLibSource, /LcgvWelfaredetailed/);
  assert.match(welfareLibSource, /DATA_GO_KR_SERVICE_KEY/);
});

test("Welfare check UI builds condition keywords and keeps eligibility wording safe", () => {
  const pageSource = readFileSync(new URL("../app/welfare-check/page.tsx", import.meta.url), "utf8");
  const clientSource = readFileSync(new URL("../src/components/welfare/WelfareCheckClient.tsx", import.meta.url), "utf8");

  assert.match(pageSource, /WelfareCheckClient/);
  assert.match(clientSource, /출생연도/);
  assert.match(clientSource, /성별/);
  assert.match(clientSource, /광역자치단체/);
  assert.match(clientSource, /기초자치단체/);
  assert.match(clientSource, /독거/);
  assert.match(clientSource, /기초생활수급자/);
  assert.match(clientSource, /차상위/);
  assert.match(clientSource, /저소득/);
  assert.match(clientSource, /장애인/);
  assert.match(clientSource, /장기요양등급 있음/);
  assert.match(clientSource, /장기요양등급 없음/);
  assert.match(clientSource, /국가유공자/);
  assert.match(clientSource, /치매 의심/);
  assert.match(clientSource, /거동 불편/);
  assert.match(clientSource, /식사 지원 필요/);
  assert.match(clientSource, /돌봄 필요/);
  assert.match(clientSource, /일자리 관심/);
  assert.match(clientSource, /주거 지원 필요/);
  assert.match(clientSource, /에너지\/요금 감면 관심/);
  assert.match(clientSource, /상담 키워드 또는 관심영역/);
  assert.match(clientSource, /조건을 선택한 뒤 조회 버튼을 누르면/);
  assert.match(clientSource, /필요한 관심어가 있을 때만 입력하세요/);
  assert.match(clientSource, /interests: ""/);
  assert.doesNotMatch(clientSource, /useEffect/);
  assert.match(clientSource, /buildKeywords/);
  assert.match(clientSource, /노인/);
  assert.match(clientSource, /어르신/);
  assert.match(clientSource, /노년/);
  assert.match(clientSource, /노인맞춤돌봄/);
  assert.match(clientSource, /안전확인/);
  assert.match(clientSource, /돌봄/);
  assert.match(clientSource, /생활지원/);
  assert.match(clientSource, /저소득/);
  assert.match(clientSource, /기초생활/);
  assert.match(clientSource, /차상위/);
  assert.match(clientSource, /장애인/);
  assert.match(clientSource, /장기요양/);
  assert.match(clientSource, /방문요양/);
  assert.match(clientSource, /주야간보호/);
  assert.match(clientSource, /치매/);
  assert.match(clientSource, /인지/);
  assert.match(clientSource, /치매안심/);
  assert.match(clientSource, /이동/);
  assert.match(clientSource, /재가/);
  assert.match(clientSource, /식사/);
  assert.match(clientSource, /급식/);
  assert.match(clientSource, /밑반찬/);
  assert.match(clientSource, /노인일자리/);
  assert.match(clientSource, /주거/);
  assert.match(clientSource, /요금감면/);
  assert.match(clientSource, /전기/);
  assert.match(clientSource, /가스/);
  assert.match(clientSource, /통신/);
  assert.match(clientSource, /보훈/);
  assert.match(clientSource, /Promise\.allSettled/);
  assert.match(clientSource, /\/api\/welfare\/national\/list/);
  assert.match(clientSource, /\/api\/welfare\/local\/list/);
  assert.match(clientSource, /\/api\/welfare\/national\/detail/);
  assert.match(clientSource, /\/api\/welfare\/local\/detail/);
  assert.match(clientSource, /확인 가능성 높음/);
  assert.match(clientSource, /추가 조건 확인 필요/);
  assert.match(clientSource, /관련 후보/);
  assert.match(clientSource, /제외 가능성 높음/);
  assert.match(clientSource, /관련 후보 \/ 제외 가능성 높은 항목/);
  assert.match(clientSource, /검색은 OR 방식으로 넓게 가져오고/);
  assert.match(clientSource, /기본 표시/);
  assert.match(clientSource, /전체 조회 후보/);
  assert.match(clientSource, /확인 가능성이 높습니다/);
  assert.match(clientSource, /조건 확인이 필요합니다/);
  assert.match(clientSource, /담당기관 확인이 필요합니다/);
  assert.match(clientSource, /관련 후보입니다/);
  assert.match(clientSource, /서비스명/);
  assert.match(clientSource, /API 상세정보/);
  assert.match(clientSource, /복지로 원페이지 정보/);
  assert.match(clientSource, /첨부파일 분석 결과/);
  assert.match(clientSource, /제공기관/);
  assert.match(clientSource, /지원대상/);
  assert.match(clientSource, /선정기준/);
  assert.match(clientSource, /상세 조건 분석/);
  assert.match(clientSource, /지원대상과 선정기준에서 상담 입력으로 확인해야 할 조건/);
  assert.match(clientSource, /65세 이상/);
  assert.match(clientSource, /65세 미만 노인성 질병/);
  assert.match(clientSource, /장기요양등급 또는 인지지원등급/);
  assert.match(clientSource, /장기요양등급 있음 반영/);
  assert.match(clientSource, /입력 조건과 일치/);
  assert.match(clientSource, /확인 필요/);
  assert.match(clientSource, /지원내용/);
  assert.match(clientSource, /신청방법/);
  assert.match(clientSource, /문의처/);
  assert.match(clientSource, /온라인 신청 가능 여부/);
  assert.match(clientSource, /상세링크/);
  assert.match(clientSource, /복지로 상세보기/);
  assert.match(clientSource, /신청기관 \/ 신청방법/);
  assert.match(clientSource, /관련 홈페이지/);
  assert.match(clientSource, /근거법령/);
  assert.match(clientSource, /서식\/자료/);
  assert.match(clientSource, /원문 열기/);
  assert.match(clientSource, /내용 분석/);
  assert.match(clientSource, /\/api\/welfare\/attachment\/analyze/);
  assert.match(clientSource, /fileName=/);
  assert.match(clientSource, /추출 성공\/실패/);
  assert.match(clientSource, /원문 일부 보기/);
  assert.match(clientSource, /collectAttachmentCandidates/);
  assert.match(clientSource, /collectBasfrmAttachmentCandidates/);
  assert.match(clientSource, /collectNonBasfrmAttachmentCandidates/);
  assert.match(clientSource, /inqplHmpgReldList/);
  assert.match(clientSource, /detailLink/);
  assert.match(clientSource, /raw JSON/);
  assert.match(clientSource, /HWP 분석 미지원/);
  assert.match(clientSource, /분석 미지원/);
  assert.match(clientSource, /원페이지에서만 확인 가능한 파일 후보/);
  assert.match(clientSource, /복지로 원페이지의 첨부파일 목록과 API 응답의 첨부파일 목록이 다를 수 있습니다/);
  assert.match(clientSource, /API `basfrmList`에 없는 파일은 자동 분석하지 않습니다/);
  assert.match(clientSource, /첨부파일 디버그/);
  assert.match(clientSource, /API basfrmList 원본/);
  assert.match(clientSource, /정규화된 forms 배열/);
  assert.match(clientSource, /첨부파일 분석 요청 URL/);
  assert.match(clientSource, /applicationLinks/);
  assert.match(clientSource, /forms/);
  assert.doesNotMatch(clientSource, /원문 상세\/첨부 확인/);
  assert.doesNotMatch(clientSource, /\/api\/welfare\/source-page/);
  assert.match(clientSource, /detail\.detailLink \|\| benefit\.detailLink \|\| detail\.homepages/);
  assert.match(clientSource, /href=\{href\}/);
  assert.match(clientSource, /target="_blank"/);
  assert.match(clientSource, /rel="noopener noreferrer"/);
  assert.match(clientSource, /상세링크 없음/);
  assert.match(clientSource, /복지로 상세페이지에서 첨부파일, 운영기준, 신청서식을 확인할 수 있습니다/);
  assert.match(clientSource, /신청\/문의 체크리스트/);
  assert.match(clientSource, /주민센터 문의/);
  assert.match(clientSource, /129 문의/);
  assert.match(clientSource, /장기요양등급 상담/);
  assert.match(clientSource, /치매안심센터 문의/);
  assert.match(clientSource, /전기\/가스\/통신 감면 확인/);
  assert.match(clientSource, /raw JSON/);
  assert.doesNotMatch(clientSource, /DATA_GO_KR_SERVICE_KEY|serviceKey/);
  assert.doesNotMatch(clientSource, /받을 수 있음/);
  assert.doesNotMatch(clientSource, /받을 수 있습니다/);
  assert.doesNotMatch(clientSource, /대상입니다/);
  assert.doesNotMatch(clientSource, /신청 가능합니다/);
});

test("Welfare facilities page exposes facility source discovery without mock results", () => {
  const workspaceSource = readFileSync(new URL("../src/components/blueprint/BlueprintClassicalWorkspace.tsx", import.meta.url), "utf8");
  const pageSource = readFileSync(new URL("../app/welfare-facilities/page.tsx", import.meta.url), "utf8");
  const clientSource = readFileSync(new URL("../src/components/welfare/WelfareFacilitiesClient.tsx", import.meta.url), "utf8");
  const facilitiesSource = readFileSync(new URL("../src/lib/welfare/facilities.ts", import.meta.url), "utf8");
  const ltcServiceTypeMapSource = readFileSync(new URL("../src/lib/welfare/ltc-service-type-map.ts", import.meta.url), "utf8");
  const docsSource = readFileSync(new URL("../docs/facility-data-sources.md", import.meta.url), "utf8");

  assert.match(workspaceSource, /지역 기관\/시설 찾기/);
  assert.match(workspaceSource, /href="\/welfare-facilities"/);
  assert.match(pageSource, /WelfareFacilitiesClient/);
  assert.match(clientSource, /이 화면은 복지 혜택이 아니라 지역 내 관련 기관\/시설 정보를 확인하기 위한 테스트 화면입니다/);
  assert.match(clientSource, /인천광역시/);
  assert.match(clientSource, /미추홀구/);
  assert.match(facilitiesSource, /장기요양기관/);
  assert.match(ltcServiceTypeMapSource, /주간보호센터/);
  assert.match(ltcServiceTypeMapSource, /방문요양/);
  assert.match(ltcServiceTypeMapSource, /방문간호/);
  assert.match(ltcServiceTypeMapSource, /방문목욕/);
  assert.match(ltcServiceTypeMapSource, /단기보호/);
  assert.match(ltcServiceTypeMapSource, /복지용구/);
  assert.match(ltcServiceTypeMapSource, /요양원/);
  assert.match(ltcServiceTypeMapSource, /치매안심센터/);
  assert.match(ltcServiceTypeMapSource, /보건소/);
  assert.match(ltcServiceTypeMapSource, /주민센터/);
  assert.match(ltcServiceTypeMapSource, /복지관/);
  assert.match(ltcServiceTypeMapSource, /전체/);
  assert.match(ltcServiceTypeMapSource, /돌봄 서비스/);
  assert.match(ltcServiceTypeMapSource, /상담기관/);
  assert.doesNotMatch(ltcServiceTypeMapSource, /\| "사회복지시설"|label: "사회복지시설"/);
  assert.doesNotMatch(ltcServiceTypeMapSource, /\| "노인복지시설"|label: "노인복지시설"/);
  assert.match(clientSource, /기관 조회/);
  assert.match(facilitiesSource, /이 기관 종류는 아직 공식 API 또는 공개 데이터 소스 확인이 필요합니다/);
  assert.match(clientSource, /조회 결과가 없습니다/);
  assert.match(clientSource, /조건을 바꿔 다시 조회해보세요/);
  assert.match(clientSource, /기관 후보 공통 스키마/);
  assert.match(clientSource, /기관명/);
  assert.match(clientSource, /Detail APIs/);
  assert.match(clientSource, /장기요양기관 상세 정보/);
  assert.match(facilitiesSource, /협약기관 현황/);
  assert.match(facilitiesSource, /프로그램현황/);
  assert.match(facilitiesSource, /인력현황/);
  assert.match(facilitiesSource, /시설현황/);
  assert.match(facilitiesSource, /비급여현황/);
  assert.match(facilitiesSource, /기관기타/);
  assert.match(facilitiesSource, /입소인원/);
  assert.match(facilitiesSource, /복지용구 현황/);
  assert.match(clientSource, /기관 종류/);
  assert.match(clientSource, /기관명 일부/);
  assert.match(clientSource, /facilityName/);
  assert.match(clientSource, /주소/);
  assert.match(clientSource, /전화번호/);
  assert.match(clientSource, /제공기관/);
  assert.match(clientSource, /원문 열기/);
  assert.match(facilitiesSource, /FacilityCandidate/);
  assert.match(facilitiesSource, /latitude: number \| null/);
  assert.match(facilitiesSource, /longitude: number \| null/);
  assert.match(facilitiesSource, /searchLtcInsttService02/);
  assert.match(facilitiesSource, /getLtcInsttSeachList02/);
  assert.match(ltcServiceTypeMapSource, /B03/);
  assert.match(ltcServiceTypeMapSource, /C03/);
  assert.match(ltcServiceTypeMapSource, /재가노인복지시설 주야간보호/);
  assert.match(ltcServiceTypeMapSource, /재가장기요양기관 주야간보호/);
  assert.match(ltcServiceTypeMapSource, /B01/);
  assert.match(ltcServiceTypeMapSource, /C01/);
  assert.match(ltcServiceTypeMapSource, /재가노인복지시설 방문요양/);
  assert.match(ltcServiceTypeMapSource, /재가장기요양기관 방문요양/);
  assert.match(ltcServiceTypeMapSource, /재가노인복지시설 방문목욕/);
  assert.match(ltcServiceTypeMapSource, /재가장기요양기관 방문목욕/);
  assert.match(ltcServiceTypeMapSource, /재가장기요양기관 복지용구/);
  assert.match(ltcServiceTypeMapSource, /치매전담형 노인요양공동생활가정/);
  assert.doesNotMatch(clientSource, /화면용 기관종류/);
  assert.doesNotMatch(clientSource, /원본 기관유형명/);
  assert.match(clientSource, /기관 유형/);
  assert.match(clientSource, /originalTypeCodeLabel/);
  assert.match(clientSource, /NON_BENEFIT_KIND_LABELS/);
  assert.match(clientSource, /식재료비/);
  assert.match(clientSource, /상급침실사용료/);
  assert.match(clientSource, /PROGRAM_TYPE_LABELS/);
  assert.match(clientSource, /인지기능향상/);
  assert.match(clientSource, /운동보조/);
  assert.match(clientSource, /WELFARE_TOOL_REPORT_LABELS/);
  assert.match(clientSource, /소독장비/);
  assert.match(clientSource, /세정장비/);
  assert.match(clientSource, /주소 출처/);
  assert.match(clientSource, /로컬 도로명주소 파일 치환/);
  assert.match(clientSource, /도로명주소 검색 API 보정/);
  assert.match(clientSource, /\/api\/welfare\/facilities\/long-term-care\/list/);
  assert.match(clientSource, /\/api\/welfare\/facilities\/long-term-care\/detail/);
  assert.match(facilitiesSource, /getConvInsttDetailInfoList02/);
  assert.match(facilitiesSource, /getProgramSttusDetailInfoList02/);
  assert.match(facilitiesSource, /getStaffSttusDetailInfoItem02/);
  assert.match(facilitiesSource, /getInsttSttusDetailInfoItem02/);
  assert.match(facilitiesSource, /getNonBenefitSttusDetailInfoList02/);
  assert.match(facilitiesSource, /getInsttEtcDetailInfoItem02/);
  assert.match(facilitiesSource, /getAceptncNmprDetailInfoItem02/);
  assert.match(facilitiesSource, /getWlfareToolDetailInfoList02/);
  assert.match(facilitiesSource, /JUSO_CONFIRM_KEY/);
  assert.match(facilitiesSource, /ROAD_ADDRESS_DATA_DIR/);
  assert.match(facilitiesSource, /rnaddrkor_incheon\.txt/);
  assert.match(facilitiesSource, /rnaddrkor_busan\.txt/);
  assert.match(facilitiesSource, /rnaddrkor_gyunggi\.txt/);
  assert.match(facilitiesSource, /rnaddrkor_jeonnamgwangju\.txt/);
  assert.match(facilitiesSource, /business\.juso\.go\.kr\/addrlink\/addrLinkApi\.do/);
  assert.doesNotMatch(clientSource, /DATA_GO_KR_SERVICE_KEY|serviceKey/);
  assert.match(docsSource, /Facility Data Sources/);
  assert.match(docsSource, /국민건강보험공단 장기요양기관 검색 서비스/);
  assert.match(docsSource, /getLtcInsttSeachList02/);
  assert.match(docsSource, /기관 종류/);
  assert.match(docsSource, /REST API 여부/);
  assert.match(docsSource, /파일 데이터 여부/);
  assert.match(docsSource, /지역 검색 가능 여부/);
  assert.match(docsSource, /좌표 제공 여부/);
  assert.match(docsSource, /연락처 제공 여부/);
});

test("Long-term care facility detail route calls all NHIS detail APIs by facility id and type code", async () => {
  const previousKey = process.env.DATA_GO_KR_SERVICE_KEY;
  const calls: string[] = [];
  process.env.DATA_GO_KR_SERVICE_KEY = "test-secret-key";

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);
    if (url.includes("getProgramSttusDetailInfoList02")) {
      return new Response(`
        <response>
          <body>
            <items>
              <item>
                <longTermAdminSym>22817700001</longTermAdminSym>
                <adminPttnCd>C03</adminPttnCd>
                <programTitle>인지활동 프로그램</programTitle>
                <place>프로그램실</place>
              </item>
            </items>
          </body>
        </response>
      `);
    }

    return new Response(`
      <response>
        <body>
          <item>
            <longTermAdminSym>22817700001</longTermAdminSym>
            <adminPttnCd>C03</adminPttnCd>
          </item>
        </body>
      </response>
    `);
  }) as typeof fetch;

  const response = await fetchLongTermCareFacilityDetail(new Request("http://localhost/api/welfare/facilities/long-term-care/detail?longTermAdminSym=22817700001&adminPttnCd=C03"));
  const data = await response.json();
  const calledUrls = calls.map((call) => new URL(call));

  assert.equal(response.status, 200);
  assert.equal(data.longTermAdminSym, "22817700001");
  assert.equal(data.adminPttnCd, "C03");
  assert.equal(data.generalDetail.longTermAdminSym, "22817700001");
  assert.equal(data.sections.length, 8);
  assert.deepEqual(data.sections.map((section: { endpoint: string }) => section.endpoint), [
    "/getInsttEtcDetailInfoItem02",
    "/getAceptncNmprDetailInfoItem02",
    "/getStaffSttusDetailInfoItem02",
    "/getInsttSttusDetailInfoItem02",
    "/getWlfareToolDetailInfoList02",
    "/getNonBenefitSttusDetailInfoList02",
    "/getConvInsttDetailInfoList02",
    "/getProgramSttusDetailInfoList02",
  ]);
  assert.equal(data.sections.find((section: { id: string }) => section.id === "programStatus").items[0].programTitle, "인지활동 프로그램");
  assert.equal(calledUrls.length, 9);
  assert.equal(calledUrls.some((url) => url.pathname.endsWith("/getLtcInsttDetailInfoService02/getGeneralSttusDetailInfoItem02")), true);
  assert.equal(calledUrls.every((url) => url.searchParams.get("longTermAdminSym") === "22817700001"), true);
  assert.equal(calledUrls.every((url) => url.searchParams.get("adminPttnCd") === "C03"), true);
  assert.equal(calledUrls.every((url) => url.searchParams.get("serviceKey") === "test-secret-key"), true);

  process.env.DATA_GO_KR_SERVICE_KEY = previousKey;
});

test("Long-term care facility detail route attaches evaluation A records by facility symbol", async () => {
  const previousKey = process.env.DATA_GO_KR_SERVICE_KEY;
  process.env.DATA_GO_KR_SERVICE_KEY = "test-secret-key";

  globalThis.fetch = (async () => new Response(`
    <response>
      <body>
        <item>
          <longTermAdminSym>11144000012</longTermAdminSym>
          <adminPttnCd>A03</adminPttnCd>
          <adminNm>시립서부노인전문요양센터</adminNm>
        </item>
      </body>
    </response>
  `)) as typeof fetch;

  const response = await fetchLongTermCareFacilityDetail(new Request("http://localhost/api/welfare/facilities/long-term-care/detail?longTermAdminSym=11144000012&adminPttnCd=A03"));
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.evaluationA.length > 0, true);
  assert.equal(data.evaluationA[0].facilitySymbol, "1-11440-00012");
  assert.equal(normalizeLongTermCareFacilityKey(data.evaluationA[0].facilitySymbol), "11144000012");
  assert.equal(data.evaluationA[0].facilityName, "시립서부노인전문요양센터");

  process.env.DATA_GO_KR_SERVICE_KEY = previousKey;
});

test("Long-term care facilities route calls NHIS list API and normalizes facility candidates", async () => {
  const previousKey = process.env.DATA_GO_KR_SERVICE_KEY;
  const previousJusoKey = process.env.JUSO_CONFIRM_KEY;
  const previousRoadAddressDir = process.env.ROAD_ADDRESS_DATA_DIR;
  const calls: string[] = [];
  process.env.DATA_GO_KR_SERVICE_KEY = "test-secret-key";
  process.env.ROAD_ADDRESS_DATA_DIR = join(tmpdir(), "pigbar-missing-road-address-data");
  delete process.env.JUSO_CONFIRM_KEY;

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);
    if (url.includes("/getLtcInsttDetailInfoService02/getAceptncNmprDetailInfoItem02")) {
      return new Response(`
        <response>
          <body>
            <item>
              <longTermAdminSym>22817700001</longTermAdminSym>
              <adminPttnCd>C03</adminPttnCd>
              <fmNowPer>2</fmNowPer>
              <maNowPer>3</maNowPer>
            </item>
          </body>
        </response>
      `);
    }

    if (url.includes("/getLtcInsttDetailInfoService02/getGeneralSttusDetailInfoItem02")) {
      return new Response(`
        <response>
          <body>
            <item>
              <longTermAdminSym>22817700001</longTermAdminSym>
              <adminPttnCd>C03</adminPttnCd>
              <adminNm>미추홀 주야간보호센터</adminNm>
              <hmPostNo>22100</hmPostNo>
              <roadNmCd>281771000000</roadNmCd>
              <gunmulMlno>15</gunmulMlno>
              <gunmulSlno>2</gunmulSlno>
              <locTelNo_1>032</locTelNo_1>
              <locTelNo_2>123</locTelNo_2>
              <locTelNo_3>4567</locTelNo_3>
              <longTermPeribRgtDt>20260101</longTermPeribRgtDt>
            </item>
          </body>
        </response>
      `);
    }

    return new Response(`
      <response>
        <header>
          <resultCode>00</resultCode>
          <resultMsg>NORMAL SERVICE.</resultMsg>
        </header>
        <body>
          <items>
            <item>
              <longTermAdminSym>22817700001</longTermAdminSym>
              <serviceKind>C03</serviceKind>
              <adminPttnCd>C03</adminPttnCd>
              <adminNm>미추홀 주야간보호센터</adminNm>
              <siDoCd>28</siDoCd>
              <siGunGuCd>177</siGunGuCd>
              <hmPostNo>22100</hmPostNo>
              <roadNmCd>281771000000</roadNmCd>
              <gunmulMlno>15</gunmulMlno>
              <gunmulSlno>2</gunmulSlno>
              <locTelNo_1>032</locTelNo_1>
              <locTelNo_2>123</locTelNo_2>
              <locTelNo_3>4567</locTelNo_3>
            </item>
            <item>
              <longTermAdminSym>22817700002</longTermAdminSym>
              <serviceKind>C03</serviceKind>
              <adminPttnCd>C03</adminPttnCd>
              <adminNm>다른 주야간보호센터</adminNm>
              <siDoCd>28</siDoCd>
              <siGunGuCd>177</siGunGuCd>
            </item>
            <item>
              <longTermAdminSym>22817700001</longTermAdminSym>
              <serviceKind>C02</serviceKind>
              <adminPttnCd>C02</adminPttnCd>
              <adminNm>미추홀 주야간보호센터</adminNm>
              <siDoCd>28</siDoCd>
              <siGunGuCd>177</siGunGuCd>
              <detailAddr>371번지 11호</detailAddr>
              <roadNmCd>281771000000</roadNmCd>
              <gunmulMlno>15</gunmulMlno>
              <gunmulSlno>2</gunmulSlno>
            </item>
          </items>
        </body>
      </response>
    `);
  }) as typeof fetch;

  const response = await searchLongTermCareFacilities(new Request("http://localhost/api/welfare/facilities/long-term-care/list?ctpvNm=인천광역시&sggNm=미추홀구&facilityType=주간보호센터&facilityName=미추홀"));
  const data = await response.json();
  const calledUrls = calls.map((call) => new URL(call));

  assert.equal(response.status, 200);
  assert.equal(data.source, "nhis-long-term-care");
  assert.equal(data.items.length, 1);
  assert.equal(data.items[0].id, "22817700001");
  assert.equal(data.items[0].name, "미추홀 주야간보호센터");
  assert.equal(data.items[0].facilityType, "주간보호센터");
  assert.equal(data.items[0].raw.sourceCode, "C03");
  assert.equal(data.items[0].raw.sourceKindName, "재가장기요양기관 주야간보호");
  assert.equal(data.items[0].raw.rawAcceptanceDetail.fmNowPer, "2");
  assert.equal(data.items[0].raw.rawAcceptanceDetail.maNowPer, "3");
  assert.equal(data.items[0].region, "인천광역시 미추홀구");
  assert.equal(data.items[0].address, "우편번호 22100 / 도로명코드 281771000000 / 건물번호 15-2");
  assert.equal(data.items[0].phone, "032-123-4567");
  assert.equal(calledUrls.length, 3);
  assert.equal(calledUrls[0].pathname.endsWith("/searchLtcInsttService02/getLtcInsttSeachList02"), true);
  assert.equal(calledUrls[0].searchParams.get("siDoCd"), "28");
  assert.equal(calledUrls[0].searchParams.get("siGunGuCd"), "177");
  assert.equal(calledUrls[0].searchParams.get("serviceKind"), "B03");
  assert.equal(calledUrls[0].searchParams.get("adminNm"), "미추홀");
  assert.equal(calledUrls[0].searchParams.get("numOfRows"), "100");
  assert.equal(calledUrls[1].searchParams.get("serviceKind"), "C03");
  assert.equal(calledUrls[1].searchParams.get("adminNm"), "미추홀");
  assert.equal(calledUrls.some((url) => url.pathname.endsWith("/getLtcInsttDetailInfoService02/getGeneralSttusDetailInfoItem02")), false);
  assert.equal(calledUrls[2].pathname.endsWith("/getLtcInsttDetailInfoService02/getAceptncNmprDetailInfoItem02"), true);
  assert.equal(calledUrls[2].searchParams.get("longTermAdminSym"), "22817700001");
  assert.equal(calledUrls[2].searchParams.get("adminPttnCd"), "C03");
  assert.equal(calledUrls[0].searchParams.get("serviceKey"), "test-secret-key");

  process.env.DATA_GO_KR_SERVICE_KEY = previousKey;
  if (previousJusoKey === undefined) {
    delete process.env.JUSO_CONFIRM_KEY;
  } else {
    process.env.JUSO_CONFIRM_KEY = previousJusoKey;
  }
  if (previousRoadAddressDir === undefined) {
    delete process.env.ROAD_ADDRESS_DATA_DIR;
  } else {
    process.env.ROAD_ADDRESS_DATA_DIR = previousRoadAddressDir;
  }
});

test("Long-term care facilities route fetches additional pages when totalCount exceeds one page", async () => {
  const previousKey = process.env.DATA_GO_KR_SERVICE_KEY;
  const previousJusoKey = process.env.JUSO_CONFIRM_KEY;
  const previousRoadAddressDir = process.env.ROAD_ADDRESS_DATA_DIR;
  const calls: string[] = [];
  process.env.DATA_GO_KR_SERVICE_KEY = "test-secret-key";
  process.env.ROAD_ADDRESS_DATA_DIR = join(tmpdir(), "pigbar-missing-road-address-data");
  delete process.env.JUSO_CONFIRM_KEY;

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = new URL(String(input));
    calls.push(url.toString());

    if (url.pathname.endsWith("/getGeneralSttusDetailInfoItem02")) {
      const id = url.searchParams.get("longTermAdminSym") ?? "";
      return new Response(`
        <response>
          <body>
            <item>
              <longTermAdminSym>${id}</longTermAdminSym>
              <adminPttnCd>C05</adminPttnCd>
              <adminNm>제물포구 방문간호 ${id}</adminNm>
            </item>
          </body>
        </response>
      `);
    }

    if (url.pathname.endsWith("/getAceptncNmprDetailInfoItem02")) {
      return new Response("<response><body></body></response>");
    }

    const pageNo = url.searchParams.get("pageNo");
    const itemId = pageNo === "2" ? "22814000002" : "22814000001";
    return new Response(`
      <response>
        <body>
          <totalCount>101</totalCount>
          <items>
            <item>
              <longTermAdminSym>${itemId}</longTermAdminSym>
              <serviceKind>C05</serviceKind>
              <adminPttnCd>C05</adminPttnCd>
              <adminNm>제물포구 방문간호 ${pageNo}</adminNm>
              <siDoCd>28</siDoCd>
              <siGunGuCd>140</siGunGuCd>
            </item>
          </items>
        </body>
      </response>
    `);
  }) as typeof fetch;

  const response = await searchLongTermCareFacilities(new Request("http://localhost/api/welfare/facilities/long-term-care/list?ctpvNm=인천광역시&sggNm=제물포구&facilityType=방문간호"));
  const data = await response.json();
  const calledUrls = calls.map((call) => new URL(call));
  const listCalls = calledUrls.filter((url) => url.pathname.endsWith("/searchLtcInsttService02/getLtcInsttSeachList02"));

  assert.equal(response.status, 200);
  assert.equal(data.items.length, 2);
  assert.equal(listCalls.some((url) => url.searchParams.get("serviceKind") === "C05" && url.searchParams.get("pageNo") === "2"), true);
  assert.equal(listCalls.every((url) => url.searchParams.get("numOfRows") === "100"), true);

  process.env.DATA_GO_KR_SERVICE_KEY = previousKey;
  if (previousJusoKey === undefined) {
    delete process.env.JUSO_CONFIRM_KEY;
  } else {
    process.env.JUSO_CONFIRM_KEY = previousJusoKey;
  }
  if (previousRoadAddressDir === undefined) {
    delete process.env.ROAD_ADDRESS_DATA_DIR;
  } else {
    process.env.ROAD_ADDRESS_DATA_DIR = previousRoadAddressDir;
  }
});

test("Long-term care facilities route resolves Incheon road address from local road address file before Juso", async () => {
  const previousKey = process.env.DATA_GO_KR_SERVICE_KEY;
  const previousJusoKey = process.env.JUSO_CONFIRM_KEY;
  const previousRoadAddressDir = process.env.ROAD_ADDRESS_DATA_DIR;
  const tempDir = mkdtempSync(join(tmpdir(), "pigbar-road-address-"));
  const calls: string[] = [];
  process.env.DATA_GO_KR_SERVICE_KEY = "test-secret-key";
  process.env.ROAD_ADDRESS_DATA_DIR = tempDir;
  process.env.JUSO_CONFIRM_KEY = "juso-confirm-key";

  writeFileSync(
    join(tempDir, "rnaddrkor_incheon.txt"),
    "28177100000001500002|2817710000|Incheon|Michuhol|Test-dong||0|1|1|281771000000|Test-ro|0|15|2|2817750000|Test-dong|22100||20260601|0||||\n",
  );

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);
    if (url.includes("/getLtcInsttDetailInfoService02/getGeneralSttusDetailInfoItem02")) {
      return new Response(`
        <response>
          <body>
            <item>
              <longTermAdminSym>22817700001</longTermAdminSym>
              <adminPttnCd>C03</adminPttnCd>
              <adminNm>미추홀 주야간보호센터</adminNm>
              <hmPostNo>22100</hmPostNo>
              <roadNmCd>281771000000</roadNmCd>
              <gunmulMlno>15</gunmulMlno>
              <gunmulSlno>2</gunmulSlno>
            </item>
          </body>
        </response>
      `);
    }

    return new Response(`
      <response>
        <body>
          <items>
            <item>
              <longTermAdminSym>22817700001</longTermAdminSym>
              <serviceKind>C03</serviceKind>
              <adminPttnCd>C03</adminPttnCd>
              <adminNm>미추홀 주야간보호센터</adminNm>
              <siDoCd>28</siDoCd>
              <siGunGuCd>177</siGunGuCd>
              <roadNmCd>281771000000</roadNmCd>
              <gunmulMlno>15</gunmulMlno>
              <gunmulSlno>2</gunmulSlno>
            </item>
          </items>
        </body>
      </response>
    `);
  }) as typeof fetch;

  const response = await searchLongTermCareFacilities(new Request("http://localhost/api/welfare/facilities/long-term-care/list?ctpvNm=인천광역시&sggNm=미추홀구&facilityType=주간보호센터"));
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.items.length, 1);
  assert.equal(data.items[0].address, "Incheon Michuhol Test-ro 15-2");
  assert.equal(data.items[0].raw.addressResolution.source, "local-road-address-data");
  assert.equal(calls.some((call) => call.includes("business.juso.go.kr")), false);

  process.env.DATA_GO_KR_SERVICE_KEY = previousKey;
  if (previousJusoKey === undefined) {
    delete process.env.JUSO_CONFIRM_KEY;
  } else {
    process.env.JUSO_CONFIRM_KEY = previousJusoKey;
  }
  if (previousRoadAddressDir === undefined) {
    delete process.env.ROAD_ADDRESS_DATA_DIR;
  } else {
    process.env.ROAD_ADDRESS_DATA_DIR = previousRoadAddressDir;
  }
  rmSync(tempDir, { force: true, recursive: true });
});

test("Long-term care facilities route resolves other regions from matching local road address file", async () => {
  const previousKey = process.env.DATA_GO_KR_SERVICE_KEY;
  const previousJusoKey = process.env.JUSO_CONFIRM_KEY;
  const previousRoadAddressDir = process.env.ROAD_ADDRESS_DATA_DIR;
  const tempDir = mkdtempSync(join(tmpdir(), "pigbar-road-address-busan-"));
  process.env.DATA_GO_KR_SERVICE_KEY = "test-secret-key";
  process.env.ROAD_ADDRESS_DATA_DIR = tempDir;
  delete process.env.JUSO_CONFIRM_KEY;

  writeFileSync(
    join(tempDir, "rnaddrkor_busan.txt"),
    "26110100000000700000|2611010000|Busan|Jung|Test-dong||0|1|1|261101000000|Busan-ro|0|7|0|2611050000|Test-dong|48900||20260601|0||||\n",
  );

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes("/getLtcInsttDetailInfoService02/getGeneralSttusDetailInfoItem02")) {
      return new Response(`
        <response>
          <body>
            <item>
              <longTermAdminSym>22611000001</longTermAdminSym>
              <adminPttnCd>C01</adminPttnCd>
              <adminNm>부산 방문요양센터</adminNm>
              <roadNmCd>261101000000</roadNmCd>
              <gunmulMlno>7</gunmulMlno>
              <gunmulSlno>0</gunmulSlno>
            </item>
          </body>
        </response>
      `);
    }

    return new Response(`
      <response>
        <body>
          <items>
            <item>
              <longTermAdminSym>22611000001</longTermAdminSym>
              <serviceKind>C01</serviceKind>
              <adminPttnCd>C01</adminPttnCd>
              <adminNm>부산 방문요양센터</adminNm>
              <siDoCd>26</siDoCd>
              <roadNmCd>261101000000</roadNmCd>
              <gunmulMlno>7</gunmulMlno>
              <gunmulSlno>0</gunmulSlno>
            </item>
          </items>
        </body>
      </response>
    `);
  }) as typeof fetch;

  const response = await searchLongTermCareFacilities(new Request("http://localhost/api/welfare/facilities/long-term-care/list?ctpvNm=부산광역시&sggNm=중구&facilityType=방문요양"));
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.items.length, 1);
  assert.equal(data.items[0].address, "Busan Jung Busan-ro 7");
  assert.equal(data.items[0].raw.addressResolution.source, "local-road-address-data");

  process.env.DATA_GO_KR_SERVICE_KEY = previousKey;
  if (previousJusoKey === undefined) {
    delete process.env.JUSO_CONFIRM_KEY;
  } else {
    process.env.JUSO_CONFIRM_KEY = previousJusoKey;
  }
  if (previousRoadAddressDir === undefined) {
    delete process.env.ROAD_ADDRESS_DATA_DIR;
  } else {
    process.env.ROAD_ADDRESS_DATA_DIR = previousRoadAddressDir;
  }
  rmSync(tempDir, { force: true, recursive: true });
});

test("Long-term care facilities route enriches code-only address with Juso search API when configured", async () => {
  const previousKey = process.env.DATA_GO_KR_SERVICE_KEY;
  const previousJusoKey = process.env.JUSO_CONFIRM_KEY;
  const previousRoadAddressDir = process.env.ROAD_ADDRESS_DATA_DIR;
  const calls: string[] = [];
  process.env.DATA_GO_KR_SERVICE_KEY = "test-secret-key";
  process.env.JUSO_CONFIRM_KEY = "juso-confirm-key";
  process.env.ROAD_ADDRESS_DATA_DIR = join(tmpdir(), "pigbar-missing-road-address-data");

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);
    if (url.includes("business.juso.go.kr/addrlink/addrLinkApi.do")) {
      return Response.json({
        results: {
          common: {
            errorCode: "0",
            errorMessage: "정상",
          },
          juso: [
            {
              roadAddr: "인천광역시 미추홀구 테스트로 15-2",
              roadAddrPart1: "인천광역시 미추홀구 테스트로 15-2",
              zipNo: "22100",
              rnMgtSn: "281771000000",
              buldMnnm: "15",
              buldSlno: "2",
            },
          ],
        },
      });
    }

    if (url.includes("/getLtcInsttDetailInfoService02/getGeneralSttusDetailInfoItem02")) {
      return new Response(`
        <response>
          <body>
            <item>
              <longTermAdminSym>22817700001</longTermAdminSym>
              <adminPttnCd>C03</adminPttnCd>
              <adminNm>미추홀 주야간보호센터</adminNm>
              <hmPostNo>22100</hmPostNo>
              <roadNmCd>281771000000</roadNmCd>
              <gunmulMlno>15</gunmulMlno>
              <gunmulSlno>2</gunmulSlno>
              <locTelNo_1>032</locTelNo_1>
              <locTelNo_2>123</locTelNo_2>
              <locTelNo_3>4567</locTelNo_3>
            </item>
          </body>
        </response>
      `);
    }

    return new Response(`
      <response>
        <body>
          <items>
            <item>
              <longTermAdminSym>22817700001</longTermAdminSym>
              <serviceKind>C03</serviceKind>
              <adminPttnCd>C03</adminPttnCd>
              <adminNm>미추홀 주야간보호센터</adminNm>
              <siDoCd>28</siDoCd>
              <siGunGuCd>177</siGunGuCd>
              <roadNmCd>281771000000</roadNmCd>
              <gunmulMlno>15</gunmulMlno>
              <gunmulSlno>2</gunmulSlno>
            </item>
          </items>
        </body>
      </response>
    `);
  }) as typeof fetch;

  const response = await searchLongTermCareFacilities(new Request("http://localhost/api/welfare/facilities/long-term-care/list?ctpvNm=인천광역시&sggNm=미추홀구&facilityType=주간보호센터"));
  const data = await response.json();
  const calledUrls = calls.map((call) => new URL(call));
  const jusoCall = calledUrls.find((url) => url.hostname === "business.juso.go.kr");

  assert.equal(response.status, 200);
  assert.equal(data.items.length, 1);
  assert.equal(data.items[0].address, "인천광역시 미추홀구 테스트로 15-2");
  assert.equal(data.items[0].raw.addressResolution.source, "juso-road-address");
  assert.equal(jusoCall?.searchParams.get("confmKey"), "juso-confirm-key");
  assert.equal(jusoCall?.searchParams.get("resultType"), "json");
  assert.equal(jusoCall?.searchParams.get("firstSort"), "road");

  process.env.DATA_GO_KR_SERVICE_KEY = previousKey;
  if (previousJusoKey === undefined) {
    delete process.env.JUSO_CONFIRM_KEY;
  } else {
    process.env.JUSO_CONFIRM_KEY = previousJusoKey;
  }
  if (previousRoadAddressDir === undefined) {
    delete process.env.ROAD_ADDRESS_DATA_DIR;
  } else {
    process.env.ROAD_ADDRESS_DATA_DIR = previousRoadAddressDir;
  }
});

test("Welfare attachment analyzer downloads allowed files and blocks local URLs", async () => {
  const previousOpenAiKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  globalThis.fetch = (async (input: string | URL | Request) => {
    assert.equal(String(input), "https://www.bokjiro.go.kr/files/standard.hwp");
    return new Response(new Uint8Array([1, 2, 3, 4]), {
      headers: {
        "content-disposition": "attachment; filename*=UTF-8''%EC%9A%B4%EC%98%81%EA%B8%B0%EC%A4%80.hwp",
        "content-length": "4",
      },
    });
  }) as typeof fetch;

  const response = await analyzeWelfareAttachment(new Request("http://localhost/api/welfare/attachment/analyze?url=https%3A%2F%2Fwww.bokjiro.go.kr%2Ffiles%2Fstandard.hwp"));
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.fileName, "운영기준.hwp");
  assert.equal(data.fileType, "hwp");
  assert.equal(data.fileSize, 4);
  assert.equal(data.extractedText, "");
  assert.equal(data.extractedTextPreview, "");
  assert.equal(data.extractedTextLength, 0);
  assert.deepEqual(data.summary, {
    지원대상: "",
    선정기준: "",
    지원내용: "",
    신청방법: "",
    필요서류: "",
    문의처: "",
    주의사항: "",
  });
  assert.match(data.warnings.join(" "), /HWP 내용 추출 미지원\/변환 실패/);
  assert.match(data.warnings.join(" "), /OPENAI_API_KEY가 없어 AI 요약은 실행하지 않았습니다/);

  const blocked = await analyzeWelfareAttachment(new Request("http://localhost/api/welfare/attachment/analyze?url=http%3A%2F%2Flocalhost%2Fsecret.pdf"));
  const blockedData = await blocked.json();

  assert.equal(blocked.status, 400);
  assert.match(blockedData.error, /Private or local URLs/);

  globalThis.fetch = (async () => new Response(new Uint8Array([1, 2]), {
    headers: {
      "content-length": "2",
      "content-type": "text/html",
    },
  })) as typeof fetch;

  const mismatch = await analyzeWelfareAttachment(new Request("http://localhost/api/welfare/attachment/analyze?url=https%3A%2F%2Fwww.bokjiro.go.kr%2Ffiles%2Fguide.pdf&fileName=guide.pdf"));
  const mismatchData = await mismatch.json();

  assert.equal(mismatch.status, 415);
  assert.match(mismatchData.error, /PDF 확장자이나 실제 파일 헤더가 PDF가 아닙니다/);

  globalThis.fetch = (async (input: string | URL | Request) => {
    assert.equal(String(input), "https://www.bokjiro.go.kr/download/getDownload.do?fileId=pdf");
    return new Response(new Uint8Array([37, 80, 68, 70]), {
      headers: {
        "content-length": "4",
        "content-type": "application/octet-stream;charset=utf-8",
      },
    });
  }) as typeof fetch;

  const pdf = await analyzeWelfareAttachment(new Request("http://localhost/api/welfare/attachment/analyze?url=https%3A%2F%2Fwww.bokjiro.go.kr%2Fdownload%2FgetDownload.do%3FfileId%3Dpdf&fileName=2026_%EB%85%B8%EC%9D%B8%EB%B3%B4%EA%B1%B4%EB%B3%B5%EC%A7%80%EC%82%AC%EC%97%85%EC%95%88%EB%82%B4%281%EA%B6%8C%29.pdf"));
  const pdfData = await pdf.json();

  assert.equal(pdf.status, 200);
  assert.equal(pdfData.fileName, "2026_노인보건복지사업안내(1권).pdf");
  assert.equal(pdfData.fileType, "pdf");
  assert.equal(pdfData.contentType, "application/octet-stream;charset=utf-8");
  assert.match(pdfData.tempPath, /^\/tmp\//);

  globalThis.fetch = (async () => new Response("<html><body>login required</body></html>", {
    headers: {
      "content-length": "40",
      "content-type": "application/pdf",
    },
  })) as typeof fetch;

  const htmlPayload = await analyzeWelfareAttachment(new Request("http://localhost/api/welfare/attachment/analyze?url=https%3A%2F%2Fwww.bokjiro.go.kr%2Fdownload%2FgetDownload.do%3FfileId%3Dhtml&fileName=login.pdf"));
  const htmlPayloadData = await htmlPayload.json();

  assert.equal(htmlPayload.status, 415);
  assert.match(htmlPayloadData.error, /PDF 확장자이나 실제 파일 헤더가 PDF가 아닙니다/);

  if (previousOpenAiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = previousOpenAiKey;
  }
});

test("Local welfare list and detail use local endpoints and Pigbar schema", async () => {
  const previousKey = process.env.DATA_GO_KR_SERVICE_KEY;
  const calls: string[] = [];
  process.env.DATA_GO_KR_SERVICE_KEY = "test-secret-key";

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);

    if (url.includes("LcgvWelfarelist")) {
      return new Response(`
        <response>
          <body>
            <lcgvList>
              <servId>LCG001</servId>
              <servNm>인천 어르신 돌봄 지원</servNm>
              <jurOrgNm>인천광역시</jurOrgNm>
              <servDgst>지역 어르신 돌봄 서비스를 지원합니다.</servDgst>
              <lifeArray>노년</lifeArray>
              <intrsThemaArray>돌봄</intrsThemaArray>
              <trgterIndvdlArray>노인</trgterIndvdlArray>
              <onapPsbltYn>N</onapPsbltYn>
            </lcgvList>
          </body>
        </response>
      `);
    }

    return new Response(`
      <response>
        <body>
          <lcgvDtl>
            <servId>LCG001</servId>
            <servNm>인천 어르신 돌봄 지원</servNm>
            <jurOrgNm>인천광역시</jurOrgNm>
            <wlfareInfoOutlCn>지역 어르신 돌봄 서비스를 지원합니다.</wlfareInfoOutlCn>
            <tgtrDtlCn>인천 거주 어르신</tgtrDtlCn>
            <slctCritCn>지자체 기준 확인</slctCritCn>
            <alwServCn>돌봄 서비스 제공</alwServCn>
            <inqplCtadr>032-000-0000</inqplCtadr>
          </lcgvDtl>
        </body>
      </response>
    `);
  }) as typeof fetch;

  const list = await fetchLocalWelfareList("노인", { ctpvNm: "인천광역시", sggNm: "미추홀구" }, { lifeArray: "006" });
  const detail = await fetchLocalWelfareDetail("LCG001");
  const listUrl = new URL(calls[0]);
  const detailUrl = new URL(calls[1]);

  assert.equal(list.source, "bokjiro-local");
  assert.equal(list.items[0].source, "bokjiro-local");
  assert.equal(list.items[0].id, "LCG001");
  assert.equal(list.items[0].provider, "인천광역시");
  assert.equal(list.items[0].region, "인천광역시");
  assert.equal(list.items[0].ministry, "인천광역시");
  assert.equal(detail.source, "bokjiro-local");
  assert.equal(detail.item.source, "bokjiro-local");
  assert.equal(detail.item.targetDetail, "인천 거주 어르신");
  assert.equal(listUrl.pathname.endsWith("/LcgvWelfarelist"), true);
  assert.equal(detailUrl.pathname.endsWith("/LcgvWelfaredetailed"), true);
  assert.equal(listUrl.searchParams.get("callTp"), "L");
  assert.equal(listUrl.searchParams.get("ctpvNm"), "인천광역시");
  assert.equal(listUrl.searchParams.get("sggNm"), "미추홀구");
  assert.equal(listUrl.searchParams.get("lifeArray"), "006");
  assert.equal(detailUrl.searchParams.get("callTp"), "D");
  assert.equal(listUrl.searchParams.get("serviceKey"), "test-secret-key");

  process.env.DATA_GO_KR_SERVICE_KEY = previousKey;
});

test("Welfare XML parser supports repeated tags", () => {
  const parsed = parseXmlToJson("<root><item><name>A</name></item><item><name>B</name></item></root>");
  const root = parsed.root as { item: Array<{ name: string }> };

  assert.equal(root.item.length, 2);
  assert.equal(root.item[0].name, "A");
  assert.equal(root.item[1].name, "B");
});
