"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  dataSourceStatusesFor,
  FACILITY_TYPE_GROUPS,
  FACILITY_TYPE_OPTIONS,
  labelForLongTermCareCode,
  REGION_CODES,
  type FacilityCandidate,
  type FacilityDataSourceStatus,
  type FacilityDetailBundle,
  type FacilityDetailSection,
  type FacilityType,
} from "@/src/lib/welfare/facilities";
import type { LongTermCareEvaluationARecord } from "@/src/lib/welfare/ltc-evaluation-a";
import { longTermCareCodesFor } from "@/src/lib/welfare/ltc-service-type-map";

type SearchState = {
  ctpvNm: string;
  sggNm: string;
  facilityType: FacilityType;
  facilityName: string;
  validOnly: boolean;
};

const DEFAULT_SEARCH: SearchState = {
  ctpvNm: "인천광역시",
  sggNm: "미추홀구",
  facilityType: "주간보호센터",
  facilityName: "",
  validOnly: true,
};

function sortKoreanNames(names: string[]) {
  return [...names].sort((left, right) => left.localeCompare(right, "ko-KR"));
}

export function WelfareFacilitiesClient() {
  const [form, setForm] = useState<SearchState>(DEFAULT_SEARCH);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<FacilityCandidate[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [selectedItem, setSelectedItem] = useState<FacilityCandidate | null>(null);
  const [detailBundle, setDetailBundle] = useState<FacilityDetailBundle | null>(null);
  const [sourceStatuses, setSourceStatuses] = useState<FacilityDataSourceStatus[]>([]);
  const [status, setStatus] = useState("지역과 기관 종류를 선택한 뒤 기관 조회를 눌러주세요.");
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchDurationMs, setSearchDurationMs] = useState<number | null>(null);
  const regionLabel = useMemo(() => [form.ctpvNm, form.sggNm].filter(Boolean).join(" "), [form.ctpvNm, form.sggNm]);
  const requestPreview = useMemo(() => buildRequestPreview(form, selectedItem, searchDurationMs), [form, selectedItem, searchDurationMs]);
  const ctpvOptions = useMemo(() => sortKoreanNames(Object.keys(REGION_CODES)), []);
  const sggOptions = useMemo(() => sortKoreanNames(Object.keys(REGION_CODES[form.ctpvNm]?.siGunGuCdByName ?? {})), [form.ctpvNm]);

  function updateForm<K extends keyof SearchState>(key: K, value: SearchState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateCtpv(value: string) {
    const nextSggOptions = sortKoreanNames(Object.keys(REGION_CODES[value]?.siGunGuCdByName ?? {}));
    setForm((current) => ({
      ...current,
      ctpvNm: value,
      sggNm: nextSggOptions.includes(current.sggNm) ? current.sggNm : nextSggOptions[0] ?? "",
    }));
  }

  async function selectFacility(item: FacilityCandidate) {
    const key = facilityKey(item);
    const sourceCode = sourceCodeOf(item);
    setSelectedKey(key);
    setSelectedItem(item);
    setDetailBundle(null);

    if (!item.id || !sourceCode) return;

    setDetailLoading(true);
    try {
      const params = new URLSearchParams({
        longTermAdminSym: item.id,
        adminPttnCd: sourceCode,
        ctpvNm: form.ctpvNm,
        sggNm: form.sggNm,
      });
      const response = await fetch(`/api/welfare/facilities/long-term-care/detail?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "기관 상세 조회 실패");
      setDetailBundle(data);
    } catch (error) {
      setDetailBundle({
        source: "nhis-long-term-care",
        fetchedAt: new Date().toISOString(),
        longTermAdminSym: item.id,
        adminPttnCd: sourceCode,
        generalDetail: null,
        addressResolution: null,
        sections: [{
          id: "detailError",
          title: "상세조회 오류",
          endpoint: "",
          description: "기관 상세 API 호출 중 오류가 발생했습니다.",
          status: "error",
          items: [],
          raw: null,
          error: error instanceof Error ? error.message : "기관 상세 조회 실패",
        }],
      });
    } finally {
      setDetailLoading(false);
    }
  }

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const startedAt = performance.now();
    if (form.facilityType === "전체" && !form.facilityName.trim()) {
      setResults([]);
      setSearched(true);
      setSelectedKey("");
      setSelectedItem(null);
      setDetailBundle(null);
      setSearchDurationMs(0);
      setStatus("전체 검색은 조회 범위가 넓습니다. 기관명 일부를 입력한 뒤 조회해주세요.");
      return;
    }

    setLoading(true);
    setSearchDurationMs(null);
    setStatus("기관 정보를 조회하고 있습니다.");
    setSelectedKey("");
    setSelectedItem(null);
    setDetailBundle(null);

    try {
      const nextSourceStatuses = dataSourceStatusesFor(form.facilityType);
      setSourceStatuses(nextSourceStatuses);

      if (nextSourceStatuses.every((item) => item.status === "needs-source-confirmation")) {
        setResults([]);
        setSearched(true);
        setStatus("해당 기관 종류는 아직 공식 API 또는 공개 데이터 소스 확인이 필요합니다.");
        return;
      }

      const params = new URLSearchParams({
        ctpvNm: form.ctpvNm,
        sggNm: form.sggNm,
        facilityType: form.facilityType,
        includeAcceptanceDetails: shouldUseOccupancyFilter(form.facilityType, form.validOnly) ? "true" : "false",
      });
      if (form.facilityName.trim()) params.set("facilityName", form.facilityName.trim());
      const response = await fetch(`/api/welfare/facilities/long-term-care/list?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error ?? "기관 조회 실패");

      const allItems = Array.isArray(data.items) ? data.items as FacilityCandidate[] : [];
      const appliesOccupancyFilter = shouldUseOccupancyFilter(form.facilityType, form.validOnly);
      const items = appliesOccupancyFilter ? allItems.filter((item) => (currentOccupancyFrom(item) ?? 0) > 0) : allItems;
      setResults(items);
      setSearched(true);
      setStatus(appliesOccupancyFilter
        ? `유효 기관 ${items.length}개를 표시합니다. 전체 조회 결과는 ${allItems.length}개입니다.`
        : `기관 ${items.length}개를 불러왔습니다.`);
      if (items[0]) void selectFacility(items[0]);
    } catch (error) {
      setResults([]);
      setSelectedKey("");
      setSelectedItem(null);
      setDetailBundle(null);
      setSearched(true);
      setStatus(error instanceof Error ? error.message : "기관 조회 중 오류가 발생했습니다.");
    } finally {
      setSearchDurationMs(Math.round(performance.now() - startedAt));
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#fff7fb_0%,#ffffff_46%,#ffeaf2_100%)] px-4 py-8 text-[#2f1724] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-6xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-[#a50034]">Pigbar Welfare</p>
            <h1 className="mt-3 text-3xl font-black">지역 기관/시설 찾기</h1>
            <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-[#7a4b5f]">
              이 화면은 복지 혜택이 아니라 지역 내 관련 기관/시설 정보를 확인하기 위한 테스트 화면입니다. 화면은 보호자 언어로 보여주고, 내부 조회는 국민건강보험공단 장기요양기관 코드 기준으로 처리합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex h-10 items-center rounded-[4px] border border-[#e186ad]/65 px-4 text-sm font-black text-[#a50034]" href="/welfare-check">
              복지혜택 조회
            </Link>
            <Link className="inline-flex h-10 items-center rounded-[4px] border border-[#e186ad]/65 px-4 text-sm font-black text-[#a50034]" href="/">
              Manse로 돌아가기
            </Link>
          </div>
        </header>

        <form className="mt-8 grid gap-4 rounded-[12px] border border-[#e186ad]/65 bg-white/90 p-4 shadow-[0_18px_48px_rgba(165,0,52,0.08)] md:grid-cols-[1fr_1fr_1fr_1fr_auto]" onSubmit={search}>
          <label className="grid gap-1">
            <span className="text-xs font-black text-[#a50034]">광역자치단체</span>
            <select className={inputClass} onChange={(event) => updateCtpv(event.target.value)} value={form.ctpvNm}>
              {ctpvOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-black text-[#a50034]">기초자치단체</span>
            <select className={inputClass} onChange={(event) => updateForm("sggNm", event.target.value)} value={form.sggNm}>
              {sggOptions.length === 0 ? <option value="">전체</option> : null}
              {sggOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-black text-[#a50034]">기관 종류</span>
            <select className={inputClass} onChange={(event) => updateForm("facilityType", event.target.value as FacilityType)} value={form.facilityType}>
              {FACILITY_TYPE_GROUPS.map((category) => (
                <optgroup key={category} label={category}>
                  {FACILITY_TYPE_OPTIONS.filter((option) => option.category === category).map((option) => (
                    <option key={option.label} value={option.label}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-black text-[#a50034]">기관명 일부</span>
            <input
              className={inputClass}
              onChange={(event) => updateForm("facilityName", event.target.value)}
              placeholder="예: 예명, 미추홀"
              value={form.facilityName}
            />
          </label>
          <label className="flex h-11 items-center gap-2 self-end rounded-[4px] border border-[#e186ad]/55 bg-white px-3 text-sm font-black text-[#a50034] transition hover:bg-[#fff0f6]">
            <input
              checked={form.validOnly}
              className="h-4 w-4 accent-[#a50034]"
              onChange={(event) => updateForm("validOnly", event.target.checked)}
              type="checkbox"
            />
            유효 기관만
          </label>
          <button className="h-11 self-end rounded-[4px] bg-[#a50034] px-5 text-sm font-black text-white disabled:opacity-60" disabled={loading} type="submit">
            {loading ? "조회 중..." : "기관 조회"}
          </button>
        </form>
        <p className="mt-3 text-sm font-bold text-[#7a4b5f]">{status}</p>
        <RequestPreviewPanel preview={requestPreview} />

        <section className="mt-6 rounded-[12px] border border-[#e186ad]/55 bg-white/80 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a50034]">Facility Search</p>
              <h2 className="mt-2 text-2xl font-black">검색 결과</h2>
              <p className="mt-1 text-sm font-bold text-[#7a4b5f]">
                {searched ? `${regionLabel || "지역 미입력"} / ${form.facilityType} 기준으로 확인했습니다.` : "지역과 기관 종류를 선택한 뒤 기관 조회를 눌러주세요."}
              </p>
            </div>
            {searched ? <span className="rounded-full border border-[#e186ad]/65 px-3 py-1 text-xs font-black text-[#a50034]">기관 결과 {results.length}개</span> : null}
          </div>

          {searched ? (
            <div className="mt-5 grid gap-4">
              {results.length > 0 ? (
                <p className="rounded-[10px] border border-[#e186ad]/45 bg-[#fff7fb] p-3 text-sm font-bold leading-6 text-[#7a4b5f]">
                  같은 기관명이 두 번 보일 수 있습니다. 국민건강보험공단 API는 같은 기관기호라도 원본 기관유형 코드가 다르면 별도 결과로 내려주며,
                  상세조회도 기관기호와 기관유형 코드 조합으로 조회되어 내용이 달라질 수 있습니다.
                </p>
              ) : null}
              {results.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
                  <div className="grid content-start gap-3">
                    {results.map((item) => (
                      <FacilityListItem
                        item={item}
                        key={facilityKey(item)}
                        onSelect={() => void selectFacility(item)}
                        selected={selectedKey === facilityKey(item)}
                      />
                    ))}
                  </div>
                  <FacilityDetailPanel
                    detailBundle={detailBundle}
                    detailLoading={detailLoading}
                    item={selectedItem}
                  />
                </div>
              ) : null}
              {results.length === 0 ? (
                <div className="rounded-[10px] border border-[#e186ad]/55 bg-[#fff7fb] p-4">
                  <p className="text-sm font-black text-[#a50034]">조회 결과가 없습니다.</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#7a4b5f]">
                    지역, 기관 종류, 기관명 일부 조건을 바꿔 다시 조회해보세요. 장기요양기관 공개 API는 조건에 따라 결과가 적거나 없을 수 있습니다.
                  </p>
                </div>
              ) : null}
              <DataSourceNoticeList items={sourceStatuses} />
            </div>
          ) : (
            <p className="mt-5 rounded-[10px] border border-[#e186ad]/45 bg-[#fff7fb] p-4 text-sm font-bold text-[#7a4b5f]">
              현재 단계에서는 공식 데이터 소스가 확인된 기관만 표시합니다. 확인되지 않은 기관 종류는 “해당 기관 데이터 소스 확인 필요”로 안내합니다.
            </p>
          )}
        </section>

        <section className="mt-6 rounded-[12px] border border-[#e186ad]/55 bg-white/75 p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a50034]">Common Schema</p>
          <h2 className="mt-2 text-xl font-black">기관 후보 공통 스키마</h2>
          <pre className="mt-4 overflow-auto rounded-[8px] border border-[#e186ad]/45 bg-white p-4 text-xs font-bold leading-6 text-[#5f3145]">
{`{
  id,
  source,
  name,
  facilityType,
  region,
  address,
  phone,
  homepage,
  latitude,
  longitude,
  raw
}`}
          </pre>
        </section>
      </section>
    </main>
  );
}

const inputClass = "h-11 rounded-[4px] border border-[#e186ad]/55 bg-white px-3 text-sm font-bold text-[#2f1724] outline-none transition hover:bg-[#fff0f6] focus:bg-[#fff0f6]";

type RequestPreview = {
  listEndpoint: string;
  listCalls: Array<{
    pageNo: string;
    numOfRows: string;
    maxPages: string;
    siDoCd: string;
    siGunGuCd: string;
    serviceKind: string;
    adminNm: string;
  }>;
  detailEndpoint: string;
  detailParams: {
    longTermAdminSym: string;
    adminPttnCd: string;
  } | null;
  searchDurationMs: number | null;
};

function RequestPreviewPanel({ preview }: { preview: RequestPreview }) {
  return (
    <section className="mt-4 rounded-[10px] border border-[#e186ad]/55 bg-white/85 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a50034]">Request Preview</p>
          <h2 className="mt-1 text-lg font-black">실제 조회 파라미터</h2>
        </div>
        <span className="rounded-full border border-[#e186ad]/65 bg-[#fff7fb] px-3 py-1 text-xs font-black text-[#a50034]">인증키 미표시</span>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-[8px] border border-[#e186ad]/35 bg-[#fff7fb] p-3">
          <p className="text-xs font-black text-[#a50034]">목록조회</p>
          <p className="mt-1 break-all text-xs font-bold text-[#7a4b5f]">{preview.listEndpoint}</p>
          <div className="mt-3 grid gap-2">
            {preview.listCalls.map((call) => (
              <dl className="grid grid-cols-2 gap-2 rounded-[6px] bg-white p-3 text-xs font-bold text-[#3f2432]" key={`${call.serviceKind || "all"}:${call.siDoCd}:${call.siGunGuCd}`}>
                <dt className="text-[#a50034]">pageNo</dt>
                <dd>{call.pageNo}</dd>
                <dt className="text-[#a50034]">numOfRows</dt>
                <dd>{call.numOfRows}</dd>
                <dt className="text-[#a50034]">maxPages</dt>
                <dd>{call.maxPages}</dd>
                <dt className="text-[#a50034]">siDoCd</dt>
                <dd>{call.siDoCd || "-"}</dd>
                <dt className="text-[#a50034]">siGunGuCd</dt>
                <dd>{call.siGunGuCd || "-"}</dd>
                <dt className="text-[#a50034]">serviceKind</dt>
                <dd>{call.serviceKind || "전체"}</dd>
                <dt className="text-[#a50034]">adminNm</dt>
                <dd>{call.adminNm || "-"}</dd>
              </dl>
            ))}
          </div>
        </div>
        <div className="rounded-[8px] border border-[#e186ad]/35 bg-[#fff7fb] p-3">
          <p className="text-xs font-black text-[#a50034]">상세조회</p>
          <p className="mt-1 break-all text-xs font-bold text-[#7a4b5f]">{preview.detailEndpoint}</p>
          {preview.detailParams ? (
            <dl className="mt-3 grid grid-cols-2 gap-2 rounded-[6px] bg-white p-3 text-xs font-bold text-[#3f2432]">
              <dt className="text-[#a50034]">longTermAdminSym</dt>
              <dd>{preview.detailParams.longTermAdminSym}</dd>
              <dt className="text-[#a50034]">adminPttnCd</dt>
              <dd>{preview.detailParams.adminPttnCd}</dd>
            </dl>
          ) : (
            <p className="mt-3 rounded-[6px] bg-white p-3 text-xs font-bold text-[#7a4b5f]">검색 결과에서 기관을 선택하면 상세조회 값이 표시됩니다.</p>
          )}
          <div className="mt-3 rounded-[6px] bg-white p-3 text-xs font-bold text-[#3f2432]">
            <span className="text-[#a50034]">이번 조회 처리 시간</span>
            <span className="ml-2">{formatDuration(preview.searchDurationMs)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function buildRequestPreview(form: SearchState, selectedItem: FacilityCandidate | null, searchDurationMs: number | null): RequestPreview {
  const region = REGION_CODES[form.ctpvNm];
  const siDoCd = region?.siDoCd ?? "";
  const siGunGuCd = region?.siGunGuCdByName[form.sggNm] ?? "";
  const serviceKindCodes = longTermCareCodesFor(form.facilityType);
  const adminNm = form.facilityName.trim();
  const selectedSourceCode = selectedItem ? sourceCodeOf(selectedItem) : "";

  return {
    listEndpoint: "https://apis.data.go.kr/B550928/searchLtcInsttService02/getLtcInsttSeachList02",
    listCalls: serviceKindCodes.map((serviceKind) => ({
      pageNo: "1부터",
      numOfRows: "100",
      maxPages: "최대 5",
      siDoCd,
      siGunGuCd,
      serviceKind,
      adminNm,
    })),
    detailEndpoint: "https://apis.data.go.kr/B550928/getLtcInsttDetailInfoService02/*",
    detailParams: selectedItem && selectedItem.id && selectedSourceCode ? {
      longTermAdminSym: selectedItem.id,
      adminPttnCd: selectedSourceCode,
    } : null,
    searchDurationMs,
  };
}

function formatDuration(durationMs: number | null) {
  if (durationMs === null) return "아직 조회 전";
  if (durationMs < 1000) return `${durationMs}ms`;
  return `${(durationMs / 1000).toFixed(1)}초`;
}

function shouldUseOccupancyFilter(facilityType: FacilityType, validOnly: boolean) {
  return validOnly && facilityType !== "복지용구" && facilityType !== "단기보호";
}

function shouldShowOccupancy(facilityType: FacilityType) {
  return facilityType !== "복지용구" && facilityType !== "단기보호";
}

function FacilityListItem({ item, onSelect, selected }: { item: FacilityCandidate; onSelect: () => void; selected: boolean }) {
  const raw = item.raw && typeof item.raw === "object" && !Array.isArray(item.raw) ? item.raw as Record<string, unknown> : {};
  const sourceKindName = typeof raw.sourceKindName === "string" ? raw.sourceKindName : "";
  const sourceCode = sourceCodeOf(item);
  const sourceKindLabel = sourceKindName || (sourceCode ? labelForLongTermCareCode(sourceCode) : "");
  const showOccupancy = shouldShowOccupancy(item.facilityType);
  const currentOccupancy = showOccupancy ? currentOccupancyFrom(item) : null;
  const isEmptyOccupancy = showOccupancy && currentOccupancy === 0;
  const evaluationA = evaluationAFromItem(item);
  const evaluationSummary = evaluationASummary(evaluationA);
  const cardClass = selected
    ? isEmptyOccupancy
      ? "border-[#8a8f98] bg-[#f1f2f4]"
      : "border-[#a50034] bg-[#fff0f6]"
    : isEmptyOccupancy
      ? "border-[#c7cbd1] bg-[#f6f7f8] hover:bg-[#eef0f2]"
      : "border-[#e186ad]/55 bg-white hover:bg-[#fff7fb]";
  const badgeClass = isEmptyOccupancy
    ? "inline-flex rounded-full border border-[#c7cbd1] bg-white px-2 py-1 text-[10px] font-black text-[#6d737c]"
    : "inline-flex rounded-full border border-[#e186ad]/65 bg-white px-2 py-1 text-[10px] font-black text-[#a50034]";

  return (
    <button
      className={`rounded-[10px] border p-4 text-left transition ${cardClass}`}
      onClick={onSelect}
      type="button"
    >
      <div className="flex flex-wrap gap-2">
        <span className={badgeClass}>{item.facilityType}</span>
        {sourceKindLabel ? <span className={badgeClass}>{sourceKindLabel}</span> : null}
        {currentOccupancy !== null ? <span className={badgeClass}>현원 {currentOccupancy}명</span> : null}
        {evaluationA.length > 0 ? <span className={badgeClass}>평가 우수 {evaluationSummary.maxCount}회</span> : null}
      </div>
      <p className={`mt-3 text-[11px] font-black ${isEmptyOccupancy ? "text-[#6d737c]" : "text-[#a50034]"}`}>기관명</p>
      <h3 className={`mt-1 text-base font-black ${isEmptyOccupancy ? "text-[#555b64]" : "text-[#2f1724]"}`}>{item.name}</h3>
      {evaluationA.length > 0 ? (
        <p className="mt-2 text-xs font-black text-[#a50034]">평가 우수 이력: {evaluationSummary.benefitTypes || "장기요양기관"}</p>
      ) : null}
    </button>
  );
}

function FacilityDetailPanel({ detailBundle, detailLoading, item }: { detailBundle: FacilityDetailBundle | null; detailLoading: boolean; item: FacilityCandidate | null }) {
  if (!item) {
    return (
      <section className="rounded-[10px] border border-[#e186ad]/55 bg-white p-5">
        <p className="text-sm font-black text-[#a50034]">기관을 선택해주세요.</p>
        <p className="mt-2 text-sm font-bold text-[#7a4b5f]">좌측 검색 결과에서 기관을 선택하면 상세 API 결과가 이 영역에 표시됩니다.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[10px] border border-[#e186ad]/65 bg-white p-4">
      <FacilityOverview detailBundle={detailBundle} item={item} />
      <div className="mt-5 border-t border-[#e186ad]/35 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a50034]">Detail APIs</p>
            <h3 className="mt-2 text-xl font-black">장기요양기관 상세 정보</h3>
          </div>
          {detailLoading ? <span className="rounded-full bg-[#fff0f6] px-3 py-1 text-xs font-black text-[#a50034]">상세 조회 중...</span> : null}
        </div>
        <p className="mt-2 text-sm font-bold leading-6 text-[#7a4b5f]">
          선택한 기관의 기관기호와 원본 기관유형코드로 국민건강보험공단 상세 API 8종을 조회합니다.
        </p>
        <div className="mt-4 grid gap-3">
          {detailBundle?.sections.map((section) => (
            <FacilityDetailSectionCard section={section} key={section.id} />
          ))}
          {!detailLoading && !detailBundle ? (
            <p className="rounded-[8px] border border-[#e186ad]/45 bg-[#fff7fb] p-4 text-sm font-bold text-[#7a4b5f]">상세 자료를 불러오는 중이거나 표시할 상세 자료가 없습니다.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function FacilityOverview({ detailBundle, item }: { detailBundle: FacilityDetailBundle | null; item: FacilityCandidate }) {
  const raw = item.raw && typeof item.raw === "object" && !Array.isArray(item.raw) ? item.raw as Record<string, unknown> : {};
  const sourceKindName = typeof raw.sourceKindName === "string" ? raw.sourceKindName : "";
  const rawList = raw.rawList && typeof raw.rawList === "object" && !Array.isArray(raw.rawList) ? raw.rawList as Record<string, unknown> : {};
  const bundledGeneralDetail = detailBundle?.generalDetail && typeof detailBundle.generalDetail === "object" && !Array.isArray(detailBundle.generalDetail)
    ? detailBundle.generalDetail
    : {};
  const rawDetail = Object.keys(bundledGeneralDetail).length > 0
    ? bundledGeneralDetail
    : raw.rawGeneralDetail && typeof raw.rawGeneralDetail === "object" && !Array.isArray(raw.rawGeneralDetail) ? raw.rawGeneralDetail as Record<string, unknown> : {};
  const bundledAddressResolution = detailBundle?.addressResolution && typeof detailBundle.addressResolution === "object" && !Array.isArray(detailBundle.addressResolution)
    ? detailBundle.addressResolution as Record<string, unknown>
    : {};
  const listAddressResolution = raw.addressResolution && typeof raw.addressResolution === "object" && !Array.isArray(raw.addressResolution) ? raw.addressResolution as Record<string, unknown> : {};
  const addressResolution = Object.keys(bundledAddressResolution).length > 0 ? bundledAddressResolution : listAddressResolution;
  const detailStatus = Object.keys(rawDetail).length > 0 ? "일반현황 상세조회 반영" : "목록조회 기준";
  const sourceCode = rawTextFrom(rawDetail, rawList, raw, "adminPttnCd", "serviceKind", "sourceCode");
  const addressSource = typeof addressResolution.source === "string" ? addressResolution.source : "";
  const resolvedAddress = rawTextFromRecord(addressResolution, "address");

  function rawText(...names: string[]) {
    for (const name of names) {
      const value = rawDetail[name] ?? rawList[name] ?? raw[name];
      if (typeof value === "string" && value.trim()) return value.trim();
      if (typeof value === "number" || typeof value === "boolean") return String(value);
    }
    return "";
  }

  const originalTypeName = sourceKindName || "확인 필요";
  const originalTypeCodeLabel = sourceCode ? labelForLongTermCareCode(sourceCode) : originalTypeName;
  const detailAddress = firstAddress(
    resolvedAddress,
    overviewAddressFrom(rawDetail),
    overviewAddressFrom(rawList),
    overviewAddressFrom(raw),
    item.address,
  );
  const detailPhone = firstText(
    overviewPhoneFrom(rawDetail),
    overviewPhoneFrom(rawList),
    overviewPhoneFrom(raw),
    item.phone,
  );
  const evaluationA = evaluationAFromDetailBundle(detailBundle);
  const listEvaluationA = evaluationAFromItem(item);
  const displayedEvaluationA = evaluationA.length > 0 ? evaluationA : listEvaluationA;

  return (
    <article>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {sourceKindName ? <span className="inline-flex rounded-full border border-[#e186ad]/65 bg-[#fff7fb] px-2 py-1 text-[10px] font-black text-[#a50034]">{sourceKindName}</span> : null}
          <span className={sourceKindName ? "ml-2 inline-flex rounded-full border border-[#e186ad]/65 bg-[#fff7fb] px-2 py-1 text-[10px] font-black text-[#a50034]" : "inline-flex rounded-full border border-[#e186ad]/65 bg-[#fff7fb] px-2 py-1 text-[10px] font-black text-[#a50034]"}>{detailStatus}</span>
          <p className="mt-2 text-[11px] font-black text-[#a50034]">기관명</p>
          <h3 className="mt-2 text-lg font-black text-[#a50034]">{item.name}</h3>
          <p className="mt-1 text-sm font-bold text-[#7a4b5f]">{item.source}</p>
        </div>
        {item.homepage ? (
          <a className="rounded-[4px] bg-[#a50034] px-3 py-2 text-xs font-black text-white" href={item.homepage} rel="noopener noreferrer" target="_blank">
            원문 열기 ↗
          </a>
        ) : null}
      </div>
      <dl className="mt-4 grid gap-2 text-sm font-bold text-[#3f2432] sm:grid-cols-2">
        <div>
          <dt className="text-xs font-black text-[#a50034]">주소</dt>
          <dd>{detailAddress || "-"}</dd>
          {addressSource ? <dd className="mt-1 text-xs text-[#7a4b5f]">주소 출처: {addressSourceLabel(addressSource)}</dd> : null}
        </div>
        <div>
          <dt className="text-xs font-black text-[#a50034]">전화번호</dt>
          <dd>{detailPhone || "-"}</dd>
        </div>
        <div>
          <dt className="text-xs font-black text-[#a50034]">기관기호</dt>
          <dd>{item.id || "-"}</dd>
        </div>
        <div>
          <dt className="text-xs font-black text-[#a50034]">기관 유형</dt>
          <dd>{originalTypeCodeLabel}</dd>
        </div>
        <div>
          <dt className="text-xs font-black text-[#a50034]">지정/신고일</dt>
          <dd>{[rawText("longTermPeribRgtDt"), rawText("stpRptDt")].filter(Boolean).join(" / ") || "-"}</dd>
        </div>
      </dl>
      <EvaluationASection records={displayedEvaluationA} />
      <details className="mt-4 rounded-[8px] border border-[#e186ad]/45 bg-[#fff7fb] p-3">
        <summary className="cursor-pointer text-xs font-black text-[#a50034]">상세 원자료 보기</summary>
        <pre className="mt-3 max-h-80 overflow-auto rounded-[6px] bg-white p-3 text-[11px] font-bold leading-5 text-[#5f3145]">
          {JSON.stringify({ list: rawList, generalDetail: rawDetail, addressResolution, evaluationA: displayedEvaluationA }, null, 2)}
        </pre>
      </details>
    </article>
  );
}

function EvaluationASection({ records }: { records: LongTermCareEvaluationARecord[] }) {
  if (records.length === 0) return null;

  return (
    <section className="mt-4 rounded-[8px] border border-[#e186ad]/55 bg-[#fff7fb] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a50034]">Evaluation</p>
          <h4 className="mt-1 text-base font-black text-[#a50034]">평가 우수 이력</h4>
        </div>
        <span className="rounded-full border border-[#e186ad]/65 bg-white px-3 py-1 text-xs font-black text-[#a50034]">
          A등급 5회 이상
        </span>
      </div>
      <p className="mt-2 text-sm font-bold leading-6 text-[#7a4b5f]">
        국민건강보험공단 장기요양기관 평가 자료에서 기관기호가 매칭된 이력입니다.
      </p>
      <div className="mt-3 grid gap-2">
        {records.map((record, index) => (
          <div className="rounded-[8px] bg-white p-3 text-sm font-bold text-[#3f2432]" key={`${record.facilitySymbol}:${record.benefitType}:${index}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[#a50034]">{record.benefitType || "장기요양기관"}</span>
              <span className="rounded-full bg-[#fff0f6] px-2 py-1 text-xs font-black text-[#a50034]">A등급 {record.aGradeCount}회</span>
            </div>
            <dl className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-black text-[#a50034]">평가 주기</dt>
                <dd>{record.cycle || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-black text-[#a50034]">평가 연도</dt>
                <dd>{yearGradesText(record) || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-black text-[#a50034]">자료상 기관명</dt>
                <dd>{record.facilityName || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-black text-[#a50034]">기관기호</dt>
                <dd>{record.facilitySymbol || "-"}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

function overviewAddressFrom(record: Record<string, unknown>) {
  const direct = rawTextFromRecord(record, "addr", "address", "detailAddr", "roadAddr", "roadAddrPart1", "insttAddr", "lctnAddr", "rnAdres");
  if (direct) return direct;

  const roadName = rawTextFromRecord(record, "roadNm", "roadName");
  const buildingMain = rawTextFromRecord(record, "gunmulMlno", "buildingMain");
  const buildingSub = rawTextFromRecord(record, "gunmulSlno", "buildingSub");
  const buildingNo = [buildingMain, buildingSub && buildingSub !== "0" ? buildingSub : ""].filter(Boolean).join("-");
  return roadName ? [roadName, buildingNo].filter(Boolean).join(" ") : "";
}

function evaluationAFromItem(item: FacilityCandidate) {
  const raw = item.raw && typeof item.raw === "object" && !Array.isArray(item.raw) ? item.raw as Record<string, unknown> : {};
  return evaluationAFromUnknown(raw.evaluationA);
}

function evaluationAFromDetailBundle(detailBundle: FacilityDetailBundle | null) {
  return evaluationAFromUnknown(detailBundle?.evaluationA);
}

function evaluationAFromUnknown(value: unknown): LongTermCareEvaluationARecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isEvaluationARecord);
}

function isEvaluationARecord(value: unknown): value is LongTermCareEvaluationARecord {
  return typeof value === "object" && value !== null && !Array.isArray(value) && typeof (value as LongTermCareEvaluationARecord).facilitySymbol === "string";
}

function evaluationASummary(records: LongTermCareEvaluationARecord[]) {
  const maxCount = records.reduce((max, record) => Math.max(max, Number(record.aGradeCount) || 0), 0);
  const benefitTypes = Array.from(new Set(records.map((record) => record.benefitType).filter(Boolean))).slice(0, 3).join(", ");
  return { maxCount, benefitTypes };
}

function yearGradesText(record: LongTermCareEvaluationARecord) {
  return Object.entries(record.yearGrades ?? {})
    .filter(([, grade]) => String(grade).trim())
    .map(([year, grade]) => `${year}년 ${grade}`)
    .join(" · ");
}

function overviewPhoneFrom(record: Record<string, unknown>) {
  const direct = rawTextFromRecord(record, "telNo", "phone", "locTelNo");
  if (direct) return direct;

  const parts = [
    rawTextFromRecord(record, "locTelNo_1", "locTelNo1"),
    rawTextFromRecord(record, "locTelNo_2", "locTelNo2"),
    rawTextFromRecord(record, "locTelNo_3", "locTelNo3"),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join("-") : "";
}

function rawTextFromRecord(record: Record<string, unknown>, ...names: string[]) {
  for (const name of names) {
    const value = record[name];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
  }
  return "";
}

function firstText(...values: string[]) {
  return values.find((value) => value.trim()) ?? "";
}

function isDisplayableAddress(value: string) {
  const address = value.trim();
  if (!address) return false;
  if (!/[가-힣]/.test(address)) return false;
  if (/^\d/.test(address) && /번지/.test(address)) return false;
  if (/^\d[\d\s\-번지호]+[가-힣]?$/.test(address)) return false;
  return true;
}

function firstAddress(...values: string[]) {
  return values.find(isDisplayableAddress) ?? "";
}

function currentOccupancyFrom(item: FacilityCandidate) {
  const raw = item.raw && typeof item.raw === "object" && !Array.isArray(item.raw) ? item.raw as Record<string, unknown> : {};
  const rawList = raw.rawList && typeof raw.rawList === "object" && !Array.isArray(raw.rawList) ? raw.rawList as Record<string, unknown> : {};
  const rawDetail = raw.rawGeneralDetail && typeof raw.rawGeneralDetail === "object" && !Array.isArray(raw.rawGeneralDetail) ? raw.rawGeneralDetail as Record<string, unknown> : {};
  const rawAcceptance = raw.rawAcceptanceDetail && typeof raw.rawAcceptanceDetail === "object" && !Array.isArray(raw.rawAcceptanceDetail) ? raw.rawAcceptanceDetail as Record<string, unknown> : {};
  const female = numberFromRecords([rawAcceptance, rawDetail, rawList, raw], ["fmNowPer", "femaleNowPer", "fmlNowPer"]);
  const male = numberFromRecords([rawAcceptance, rawDetail, rawList, raw], ["maNowPer", "maleNowPer", "mlNowPer"]);
  if (female === null && male === null) return null;
  return (female ?? 0) + (male ?? 0);
}

function numberFromRecords(records: Record<string, unknown>[], names: string[]) {
  for (const record of records) {
    for (const name of names) {
      const value = record[name];
      const parsed = Number(textForDisplay(value));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function FacilityDetailSectionCard({ section }: { section: FacilityDetailSection }) {
  const isExplicitlyEmpty = sectionTotalCount(section.raw) === 0;
  const displayItems = isExplicitlyEmpty ? [] : section.items;

  return (
    <article className="rounded-[10px] border border-[#e186ad]/45 bg-[#fff7fb] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-black text-[#a50034]">{section.title}</h4>
          <p className="mt-1 text-xs font-bold text-[#7a4b5f]">{section.endpoint}</p>
          <p className="mt-1 text-sm font-bold leading-6 text-[#7a4b5f]">{section.description}</p>
        </div>
        <span className="rounded-full border border-[#e186ad]/65 bg-white px-3 py-1 text-xs font-black text-[#a50034]">{sectionStatusLabel(section.status)}</span>
      </div>
      {section.error ? <p className="mt-3 rounded-[6px] bg-white p-3 text-sm font-bold text-[#a50034]">{section.error}</p> : null}
      {displayItems.length > 0 ? (
        <div className="mt-3 grid gap-3">
          {displayItems.map((item, index) => (
            <dl className="grid gap-2 rounded-[8px] bg-white p-3 text-sm font-bold text-[#3f2432] sm:grid-cols-2" key={`${section.id}:${index}`}>
              {displayEntries(item, section.id).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs font-black text-[#a50034]">{fieldLabel(key)}</dt>
                  <dd className="mt-1 break-words">{renderDetailValue(key, value)}</dd>
                </div>
              ))}
            </dl>
          ))}
        </div>
      ) : section.status !== "error" ? (
        <p className="mt-3 rounded-[6px] bg-white p-3 text-sm font-bold text-[#7a4b5f]">{isExplicitlyEmpty ? "없음" : "표시할 상세 자료가 없습니다."}</p>
      ) : null}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-black text-[#a50034]">원본 응답 보기</summary>
        <pre className="mt-2 max-h-72 overflow-auto rounded-[6px] bg-white p-3 text-[11px] font-bold leading-5 text-[#5f3145]">{JSON.stringify(section.raw, null, 2)}</pre>
      </details>
    </article>
  );
}

function displayEntries(record: Record<string, unknown>, sectionId?: string) {
  if (sectionId === "acceptanceStatus") return acceptanceStatusEntries(record);

  return Object.entries(record)
    .filter(([key, value]) => shouldDisplayDetailField(sectionId, key) && !key.startsWith("raw") && value !== undefined && value !== null && textForDisplay(value) !== "")
    .slice(0, 24)
    .map(([key, value]) => [key, valueLabel(key, value)] as const);
}

function acceptanceStatusEntries(record: Record<string, unknown>) {
  const female = numberForDisplay(record.fmNowPer);
  const male = numberForDisplay(record.maNowPer);
  const totalCurrent = female !== null || male !== null ? String((female ?? 0) + (male ?? 0)) : "";
  const entries: [string, string][] = [
    ["totPer", valueLabel("totPer", record.totPer)],
    ["nowPerTotal", totalCurrent],
    ["fmNowPer", valueLabel("fmNowPer", record.fmNowPer)],
    ["maNowPer", valueLabel("maNowPer", record.maNowPer)],
  ];
  return entries.filter(([, value]) => value !== "");
}

function shouldDisplayDetailField(sectionId: string | undefined, key: string) {
  if (sectionId === "generalStatus") return key === "adminFdatType";

  const hiddenBySection: Record<string, string[]> = {
    contractedInstitutions: ["longTermAdminSym"],
    programStatus: ["longTermAdminSym"],
    staffStatus: ["adminPttnCd", "serviceKind", "sourceCode", "longTermAdminSym"],
    facilityStatus: ["adminPttnCd", "serviceKind", "sourceCode", "longTermAdminSym"],
    nonBenefitStatus: ["adminPttnCd", "serviceKind", "sourceCode", "longTermAdminSym"],
    institutionEtc: ["adminPttnCd", "serviceKind", "sourceCode", "longTermAdminSym"],
  };

  return !hiddenBySection[sectionId ?? ""]?.includes(key);
}

function renderDetailValue(key: string, value: string) {
  if (key === "hmpgAddr" || key === "homepage") {
    const href = externalHref(value);
    if (!href) return value;
    return (
      <a className="inline-flex rounded-[4px] bg-[#a50034] px-3 py-2 text-xs font-black text-white" href={href} rel="noopener noreferrer" target="_blank">
        홈페이지 열기 ↗
      </a>
    );
  }
  return value;
}

function externalHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(trimmed)) return `https://${trimmed}`;
  return "";
}

function sectionTotalCount(raw: unknown): number | null {
  const totalCount = findValueByKey(raw, "totalCount");
  if (totalCount === undefined || totalCount === null || textForDisplay(totalCount) === "") return null;
  const parsed = Number(textForDisplay(totalCount));
  return Number.isFinite(parsed) ? parsed : null;
}

function findValueByKey(value: unknown, key: string): unknown {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findValueByKey(item, key);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (typeof value !== "object" || value === null) return undefined;
  const record = value as Record<string, unknown>;
  if (record[key] !== undefined) return record[key];
  for (const child of Object.values(record)) {
    const found = findValueByKey(child, key);
    if (found !== undefined) return found;
  }
  return undefined;
}

function numberForDisplay(value: unknown) {
  const parsed = Number(textForDisplay(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function textForDisplay(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(textForDisplay).filter(Boolean).join(", ");
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return "";
}

const NON_BENEFIT_KIND_LABELS: Record<string, string> = {
  "1": "식재료비",
  "2": "상급침실사용료",
  "3": "이미용비",
  "4": "경관영양유동식비",
  "5": "간식비",
  "6": "상급침실사용료(2인실)",
  "7": "기타(실비수납항목 등)",
};

const PROGRAM_TYPE_LABELS: Record<string, string> = {
  "1": "인지기능향상",
  "2": "운동보조",
  "3": "기타",
};

const WELFARE_TOOL_REPORT_LABELS: Record<string, string> = {
  A: "소독장비",
  B: "세정장비",
  C: "기타",
};

function valueLabel(key: string, value: unknown) {
  const rawValue = textForDisplay(value);
  if (!rawValue) return "";
  if (key === "adminPttnCd" || key === "serviceKind" || key === "sourceCode") return labelForLongTermCareCode(rawValue);
  if (key === "nonpayKind") return NON_BENEFIT_KIND_LABELS[rawValue] ?? rawValue;
  if (key === "pgmType" || key === "programKind" || key === "programType") return PROGRAM_TYPE_LABELS[rawValue] ?? rawValue;
  if (key === "witemRptDesc") return WELFARE_TOOL_REPORT_LABELS[rawValue] ?? rawValue;
  return rawValue;
}

function sectionStatusLabel(status: FacilityDetailSection["status"]) {
  if (status === "ok") return "조회됨";
  if (status === "empty") return "자료 없음";
  return "조회 실패";
}

function fieldLabel(key: string) {
  const labels: Record<string, string> = {
    longTermAdminSym: "장기요양기관기호",
    adminPttnCd: "기관유형",
    serviceKind: "기관유형",
    sourceCode: "기관유형",
    adminNm: "기관명",
    yoyangNm: "협약기관명",
    convInsttNm: "협약기관명",
    adptFrDt: "협약시작일",
    adptToDt: "협약종료일",
    convBgngDt: "협약시작일",
    convEndDt: "협약종료일",
    pgmType: "프로그램종류",
    programKind: "프로그램종류",
    pgmNm: "프로그램명",
    programNm: "프로그램명",
    programTitle: "제목",
    tgtNop: "대상 인원",
    target: "대상",
    cyclTm: "주기",
    cycle: "주기",
    runPlc: "장소",
    place: "장소",
    nonpayKind: "비급여항목 종류",
    prodBase: "산출근거",
    nonpayTgtAmt: "비급여항목 금액",
    uptDt: "등록일",
    witemRptDesc: "신고내역",
    itemName: "장비명",
    mnfCo: "제조사",
    modelNm: "모델명",
    usage: "용도",
    rmk: "기타",
    hmPostNo: "우편번호",
    siDoCd: "시도코드",
    siGunGuCd: "시군구코드",
    HDongCd: "행정동코드",
    BDongCd: "법정동코드",
    riCd: "리코드",
    detailAddr: "상세주소",
    roadNmCd: "도로명코드",
    gunmulMlno: "건물본번",
    gunmulSlno: "건물부번",
    fl: "층",
    locTelNo1: "전화번호 지역",
    locTelNo2: "전화번호 국번",
    locTelNo3: "전화번호 번호",
    locTelNo_1: "전화번호1",
    locTelNo_2: "전화번호2",
    locTelNo_3: "전화번호3",
    longTermPeribRgtDt: "장기요양기관지정일",
    stpRptDt: "설치신고일자",
    equipLong: "시설장",
    hdOfce: "사무국장",
    socWel: "사회복지사",
    chrgDoc: "의사 전임",
    chargeDoc: "의사 촉탁",
    nur: "간호사",
    nurArticle: "간호조무사",
    dent: "치위생사",
    physicalMTret: "물리치료사",
    wrkMTret: "작업치료사",
    recuProt_1: "요양보호사1급",
    recuProt_2: "요양보호사2급",
    recuProt1: "요양보호사1급",
    recuProt2: "요양보호사2급",
    recuProtDelay: "요양보호사유예인원",
    ofceEmp: "사무원",
    nut: "영양사",
    cook: "조리원",
    hygiPrsn: "위생원",
    mgmtPrsn: "관리인",
    suppPrsn: "보조원",
    etcPer: "기타인원",
    prsnRoomReal1: "1인실",
    prsnRoomReal2: "2인실",
    prsnRoomReal3: "3인실",
    prsnRoomReal4: "4인실",
    prsnRoomreal1: "1인실",
    prsnRoomreal2: "2인실",
    prsnRoomreal3: "3인실",
    prsnRoomreal4: "4인실",
    spcAcupRoomReal: "특수침실",
    spcAcupRoomreal: "특수침실",
    ofce: "사무실",
    medRoomReal: "의료 및 간호사실",
    medRoomreal: "의료 및 간호사실",
    funcTrnRoomReal: "작업 및 일상동작훈련실",
    funcTrnRoomreal: "작업 및 일상동작훈련실",
    pgmRoomReal: "프로그램실",
    pgmRoomreal: "프로그램실",
    crmnyPrst: "식당 및 조리실",
    batRoom: "화장실",
    taxPageLong: "세면장 및 목욕실",
    taxRoom: "세탁장 및 건조장",
    totPer: "정원",
    maNowPer: "현원 남",
    fmNowPer: "현원 여",
    maRsvPer: "대기 남",
    fmRsvPer: "대기 여",
    hmpgAddr: "홈페이지",
    tfMth: "교통편",
    traffic: "교통편",
    pkngEquip: "주차시설",
    parking: "주차시설",
    adminFdatType: "기관 설립 유형",
    nowPerTotal: "현원",
  };
  return labels[key] ?? key;
}

function addressSourceLabel(source: string) {
  if (source === "local-road-address-data") return "로컬 도로명주소 파일 치환";
  if (source === "juso-road-address") return "도로명주소 검색 API 보정";
  if (source === "ltc-readable") return "장기요양기관 원본 주소";
  if (source === "ltc-code-fallback") return "장기요양기관 코드 기반 표시";
  return source;
}

function sourceCodeOf(item: FacilityCandidate) {
  const raw = item.raw && typeof item.raw === "object" && !Array.isArray(item.raw) ? item.raw as Record<string, unknown> : {};
  const value = raw.sourceCode ?? raw.adminPttnCd ?? raw.serviceKind;
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function facilityKey(item: FacilityCandidate) {
  return `${item.source}:${item.id}:${sourceCodeOf(item)}`;
}

function rawTextFrom(...args: [Record<string, unknown>, Record<string, unknown>, Record<string, unknown>, ...string[]]) {
  const [primary, secondary, fallback, ...names] = args;
  for (const name of names) {
    const value = primary[name] ?? secondary[name] ?? fallback[name];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
  }
  return "";
}

function DataSourceNoticeList({ items }: { items: FacilityDataSourceStatus[] }) {
  if (items.length === 0) return null;

  return (
    <section className="grid gap-3">
      <h3 className="text-lg font-black">데이터 소스 확인 상태</h3>
      {items.map((item) => (
        <article className="rounded-[10px] border border-[#e186ad]/55 bg-white p-4" key={item.facilityType}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#a50034] px-2.5 py-1 text-[11px] font-black text-white">{item.facilityType}</span>
            <span className="rounded-full border border-[#e186ad]/65 px-2.5 py-1 text-[11px] font-black text-[#a50034]">데이터 소스 확인 필요</span>
          </div>
          <p className="mt-3 font-black text-[#2f1724]">{item.candidateName}</p>
          <p className="mt-1 text-sm font-bold text-[#7a4b5f]">제공기관 후보: {item.provider}</p>
          <p className="mt-2 text-sm font-bold leading-6 text-[#7a4b5f]">{item.message}</p>
          {item.dataUrl ? (
            <a className="mt-3 inline-flex rounded-[4px] border border-[#e186ad]/65 px-3 py-2 text-xs font-black text-[#a50034]" href={item.dataUrl} rel="noopener noreferrer" target="_blank">
              원문 링크 열기 ↗
            </a>
          ) : null}
        </article>
      ))}
    </section>
  );
}
