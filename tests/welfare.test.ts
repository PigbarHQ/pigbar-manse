import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fetchLocalWelfareDetail, fetchLocalWelfareList, fetchNationalWelfareDetail, fetchNationalWelfareList, parseXmlToJson } from "../src/lib/welfare/national";

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
  assert.equal(calledUrl.pathname.endsWith("/NationalWelfarelistV001"), true);
  assert.equal(calledUrl.searchParams.get("callTp"), "L");
  assert.equal(calledUrl.searchParams.get("lifeArray"), "006");
  assert.equal(calledUrl.searchParams.get("searchWrd"), "노인");
  assert.equal(calledUrl.searchParams.get("serviceKey"), "test-secret-key");

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
  assert.deepEqual(result.item.contacts, ["129"]);
  assert.deepEqual(result.item.homepages, ["https://example.test"]);
  assert.deepEqual(result.item.laws, ["사회보장급여법"]);
  assert.deepEqual(result.item.forms, ["신청서"]);

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
        <baslawList>
          <servSeDetailNm>장애인 건강권 및 의료접근성 보장에 관한 법률</servSeDetailNm>
        </baslawList>
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
  assert.deepEqual(result.item.contacts, ["보건복지상담센터: 129"]);
  assert.deepEqual(result.item.homepages, ["보건복지상담센터: http://www.129.go.kr"]);
  assert.deepEqual(result.item.laws, ["장애인 건강권 및 의료접근성 보장에 관한 법률"]);

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
