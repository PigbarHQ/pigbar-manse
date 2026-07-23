"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";

type WelfareListItem = {
  source: WelfareSource;
  id: string;
  name: string;
  provider: string;
  region: string;
  ministry: string;
  organization: string;
  summary: string;
  lifeCycle: string;
  theme: string;
  targetGroup: string;
  supportCycle: string;
  provisionType: string;
  onlineApplyYn: string;
  contact: string;
};

type WelfareDetailItem = {
  source: WelfareSource;
  id: string;
  name: string;
  provider: string;
  region: string;
  ministry: string;
  summary: string;
  targetDetail: string;
  selectionCriteria: string;
  benefitContent: string;
  applicationMethods: string;
  contacts: string[];
  homepages: string[];
  laws: string[];
  detailLink: string;
  raw: unknown;
};

type WelfareSource = "bokjiro-national" | "bokjiro-local";

type WelfareListResponse = {
  source: WelfareSource;
  items: WelfareListItem[];
  error?: string;
};

export type DayCareEvaluationRow = {
  facilityName: string;
  facilityCode: string;
  evaluationGrade: string;
};

function paragraph(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.filter(Boolean).join("\n");
  return value?.trim() || "-";
}

function sourceLabel(source: WelfareSource) {
  return source === "bokjiro-local" ? "지자체" : "중앙정부";
}

const MEMO_TAG_RULES = [
  { label: "노년", pattern: /노년|노인|어르신|고령|65세/ },
  { label: "생활지원", pattern: /생활|생계|기초|급여|비용|지원금|수당/ },
  { label: "보호·돌봄", pattern: /돌봄|보호|요양|간병|방문|안전확인/ },
  { label: "일자리", pattern: /일자리|취업|고용|직업|근로/ },
  { label: "주거", pattern: /주거|주택|임대|전세|월세|집수리/ },
  { label: "안전·위기", pattern: /위기|긴급|안전|학대|폭력|재난|응급/ },
  { label: "에너지", pattern: /에너지|난방|전기|가스|연탄|등유/ },
  { label: "저소득", pattern: /저소득|차상위|기초생활|수급|빈곤/ },
  { label: "장애인", pattern: /장애/ },
];

function itemKey(item: Pick<WelfareListItem, "source" | "id">) {
  return `${item.source}:${item.id}`;
}

function memoTags(item: WelfareListItem | WelfareDetailItem) {
  const haystack = [
    item.name,
    item.summary,
    "lifeCycle" in item ? item.lifeCycle : "",
    "theme" in item ? item.theme : "",
    "targetGroup" in item ? item.targetGroup : "",
    "targetDetail" in item ? item.targetDetail : "",
  ].join(" ");
  return MEMO_TAG_RULES.filter((rule) => rule.pattern.test(haystack)).map((rule) => rule.label);
}

function sortCandidates(items: WelfareListItem[]) {
  return [...items].sort((left, right) => {
    const tagDelta = memoTags(right).length - memoTags(left).length;
    if (tagDelta !== 0) return tagDelta;
    if (left.source !== right.source) return left.source === "bokjiro-local" ? -1 : 1;
    return left.name.localeCompare(right.name, "ko");
  });
}

async function fetchList(source: WelfareSource, searchWrd: string, elderlyOnly: boolean, region?: { ctpvNm: string; sggNm: string }): Promise<WelfareListResponse> {
  const route = source === "bokjiro-local" ? "/api/welfare/local/list" : "/api/welfare/national/list";
  const params = new URLSearchParams({ searchWrd });

  if (elderlyOnly) params.set("lifeArray", "006");

  if (source === "bokjiro-local" && region) {
    params.set("ctpvNm", region.ctpvNm);
    params.set("sggNm", region.sggNm);
  }

  const response = await fetch(`${route}?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) throw new Error(data.error ?? `${sourceLabel(source)} 목록 조회 실패`);

  return {
    source,
    items: data.items ?? [],
  };
}

export function WelfareTestClient({ dayCareEvaluationRows = [] }: { dayCareEvaluationRows?: DayCareEvaluationRow[] }) {
  const [searchWrd, setSearchWrd] = useState("노인");
  const [ctpvNm, setCtpvNm] = useState("인천광역시");
  const [sggNm, setSggNm] = useState("미추홀구");
  const [elderlyOnly, setElderlyOnly] = useState(true);
  const [items, setItems] = useState<WelfareListItem[]>([]);
  const [detail, setDetail] = useState<WelfareDetailItem | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState("검색어를 입력하고 조회해보세요.");
  const [loading, setLoading] = useState(false);
  const detailRef = useRef<HTMLElement>(null);

  async function search(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setLoading(true);
    setDetail(null);
    setSelectedId(null);
    setStatus("목록을 조회하고 있습니다.");

    try {
      const [nationalResult, localResult] = await Promise.allSettled([
        fetchList("bokjiro-national", searchWrd, elderlyOnly),
        fetchList("bokjiro-local", searchWrd, elderlyOnly, { ctpvNm, sggNm }),
      ]);
      const successfulResults = [nationalResult, localResult].filter((result): result is PromiseFulfilledResult<WelfareListResponse> => result.status === "fulfilled");
      const failedResults = [nationalResult, localResult].filter((result): result is PromiseRejectedResult => result.status === "rejected");
      const mergedItems = sortCandidates(successfulResults.flatMap((result) => result.value.items));
      const nationalCount = nationalResult.status === "fulfilled" ? nationalResult.value.items.length : 0;
      const localCount = localResult.status === "fulfilled" ? localResult.value.items.length : 0;

      if (successfulResults.length === 0) {
        throw new Error(failedResults.map((result) => result.reason instanceof Error ? result.reason.message : "목록 조회 실패").join(" / "));
      }

      setItems(mergedItems);
      setStatus(`중앙정부 ${nationalCount}건, 지자체 ${localCount}건을 불러왔습니다.${failedResults.length > 0 ? " 일부 API는 응답하지 않았습니다." : ""}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "목록 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(item: WelfareListItem) {
    setLoading(true);
    setSelectedId(itemKey(item));
    setStatus("상세정보를 조회하고 있습니다.");

    try {
      const route = item.source === "bokjiro-local" ? "/api/welfare/local/detail" : "/api/welfare/national/detail";
      const response = await fetch(`${route}?servId=${encodeURIComponent(item.id)}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error ?? "상세 조회 실패");

      setDetail(data.item ?? null);
      setStatus("상세정보를 불러왔습니다.");
      window.setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "상세 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#fff7fb_0%,#ffffff_46%,#ffeaf2_100%)] px-4 py-8 text-[#2f1724] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-[#a50034]">Pigbar Manse</p>
            <h1 className="mt-3 text-3xl font-black">복지혜택 테스트</h1>
            <p className="mt-2 text-sm font-bold text-[#7a4b5f]">공공데이터포털 중앙정부·지자체 복지서비스 API 통합 검색 확인 화면입니다.</p>
          </div>
          <Link className="inline-flex h-10 items-center rounded-[4px] border border-[#e186ad]/65 px-4 text-sm font-black text-[#a50034]" href="/">
            Manse로 돌아가기
          </Link>
        </div>

        <form className="mt-8 grid gap-3 rounded-[12px] border border-[#e186ad]/65 bg-white/90 p-4 shadow-[0_18px_48px_rgba(165,0,52,0.08)] md:grid-cols-[1.2fr_1fr_1fr_auto]" onSubmit={search}>
          <label className="grid gap-1">
            <span className="text-xs font-black text-[#a50034]">검색어</span>
            <input
              className="h-11 rounded-[4px] border border-[#e186ad]/45 bg-white px-3 text-sm font-bold text-[#2f1724] outline-none"
              onChange={(event) => setSearchWrd(event.target.value)}
              placeholder="검색어"
              value={searchWrd}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-black text-[#a50034]">광역</span>
            <input
              className="h-11 rounded-[4px] border border-[#e186ad]/45 bg-white px-3 text-sm font-bold text-[#2f1724] outline-none"
              onChange={(event) => setCtpvNm(event.target.value)}
              placeholder="광역"
              value={ctpvNm}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-black text-[#a50034]">기초</span>
            <input
              className="h-11 rounded-[4px] border border-[#e186ad]/45 bg-white px-3 text-sm font-bold text-[#2f1724] outline-none"
              onChange={(event) => setSggNm(event.target.value)}
              placeholder="기초"
              value={sggNm}
            />
          </label>
          <button className="h-11 self-end rounded-[4px] bg-[#a50034] px-5 text-sm font-black text-white disabled:opacity-60" disabled={loading} type="submit">
            {loading ? "조회 중..." : "검색"}
          </button>
          <label className="flex items-center gap-2 md:col-span-4">
            <input
              checked={elderlyOnly}
              className="size-4 accent-[#a50034]"
              onChange={(event) => setElderlyOnly(event.target.checked)}
              type="checkbox"
            />
            <span className="text-sm font-black text-[#a50034]">노년 대상만 보기</span>
            <span className="text-xs font-bold text-[#7a4b5f]">중앙정부와 지자체 조회에 생애주기 필터를 함께 적용합니다.</span>
          </label>
        </form>

        <p className="mt-3 text-sm font-bold text-[#7a4b5f]">{status}</p>

        <section className="mt-6 rounded-[12px] border border-[#e186ad]/55 bg-white/85 p-4 shadow-[0_18px_42px_rgba(165,0,52,0.08)]">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a50034]">Michuhol Day Care</p>
              <h2 className="mt-2 text-2xl font-black">인천 미추홀구 주간보호센터 평가표</h2>
              <p className="mt-2 text-sm font-bold text-[#7a4b5f]">장기요양기관 평가 결과 파일 기준으로 주야간보호 급여만 따로 모았습니다.</p>
            </div>
            <span className="rounded-full border border-[#e186ad]/65 bg-[#fff7fb] px-3 py-1 text-xs font-black text-[#a50034]">
              {dayCareEvaluationRows.length}개 기관
            </span>
          </div>
          <div className="mt-4 overflow-hidden rounded-[8px] border border-[#e186ad]/45">
            <table className="w-full border-collapse bg-white text-left text-sm">
              <thead className="bg-[#fff0f6] text-xs font-black text-[#a50034]">
                <tr>
                  <th className="border-b border-[#e186ad]/35 px-4 py-3">기관명</th>
                  <th className="border-b border-[#e186ad]/35 px-4 py-3">기관 코드</th>
                  <th className="border-b border-[#e186ad]/35 px-4 py-3">평가등급</th>
                </tr>
              </thead>
              <tbody className="font-bold text-[#3f2432]">
                {dayCareEvaluationRows.map((row) => (
                  <tr className="transition hover:bg-[#fff7fb]" key={`${row.facilityCode}:${row.facilityName}`}>
                    <td className="border-b border-[#f0c3d6]/50 px-4 py-3">{row.facilityName}</td>
                    <td className="border-b border-[#f0c3d6]/50 px-4 py-3">{row.facilityCode}</td>
                    <td className="border-b border-[#f0c3d6]/50 px-4 py-3">
                      <span className="inline-flex rounded-full bg-[#a50034] px-2.5 py-1 text-xs font-black text-white">{row.evaluationGrade || "-"}</span>
                    </td>
                  </tr>
                ))}
                {dayCareEvaluationRows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-5 text-center text-sm font-bold text-[#7a4b5f]" colSpan={3}>
                      표시할 평가 자료가 없습니다.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[12px] border border-[#e186ad]/55 bg-white/75 p-4">
            <h2 className="text-lg font-black">상담용 추천 후보</h2>
            <div className="mt-4 grid gap-3">
              {items.map((item) => (
                <button
                  className={`rounded-[8px] border p-4 text-left transition hover:bg-[#fff0f6] ${
                    selectedId === itemKey(item)
                      ? "border-[#e186ad]/65 bg-[#ffd4e5] shadow-[0_16px_36px_rgba(165,0,52,0.14)]"
                      : "border-[#e186ad]/65 bg-white"
                  }`}
                  key={itemKey(item)}
                  onClick={() => loadDetail(item)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="mb-2 inline-flex rounded-full border border-[#e186ad]/65 bg-white/85 px-2 py-1 text-[10px] font-black text-[#a50034]">
                        {sourceLabel(item.source)}
                      </span>
                      <p className="font-black text-[#a50034]">{item.name || "-"}</p>
                      <p className="mt-1 text-xs font-bold text-[#7a4b5f]">{item.provider || "-"}</p>
                      <p className="mt-1 text-xs font-bold text-[#9b6b7d]">{item.region || "-"}</p>
                    </div>
                    {selectedId === itemKey(item) ? <span className="shrink-0 rounded-full bg-[#a50034] px-2 py-1 text-[10px] font-black text-white">선택됨</span> : null}
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm font-bold leading-6 text-[#3f2432]">{item.summary || "-"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {memoTags(item).map((tag) => (
                      <span className="rounded-full bg-[#a50034] px-2.5 py-1 text-[11px] font-black text-white" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge label="생애주기" value={item.lifeCycle} />
                    <Badge label="관심주제" value={item.theme} />
                    <Badge label="가구유형" value={item.targetGroup} />
                    <Badge label="온라인" value={item.onlineApplyYn === "Y" ? "신청 가능" : item.onlineApplyYn === "N" ? "확인 필요" : item.onlineApplyYn} />
                  </div>
                </button>
              ))}
              {items.length === 0 ? <p className="text-sm font-bold text-[#7a4b5f]">검색 결과가 없습니다.</p> : null}
            </div>
          </section>

          <section className="scroll-mt-6 rounded-[12px] border border-[#e186ad]/55 bg-white/85 p-4 shadow-[0_18px_42px_rgba(165,0,52,0.10)]" ref={detailRef}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a50034]">Selected Service</p>
                <h2 className="mt-2 text-2xl font-black">상세정보</h2>
              </div>
              {detail?.id ? (
                <div className="flex flex-wrap justify-end gap-2">
                  <span className="rounded-full border border-[#e186ad]/45 px-3 py-1 text-xs font-black text-[#a50034]">{sourceLabel(detail.source)}</span>
                  <span className="rounded-full border border-[#e186ad]/45 px-3 py-1 text-xs font-black text-[#a50034]">{detail.id}</span>
                </div>
              ) : null}
            </div>
            {detail ? (
              <div className="mt-4 grid gap-4 text-sm font-bold leading-6 text-[#3f2432]">
                <DetailRow label="서비스명" value={detail.name} />
                <DetailRow label="제공기관" value={detail.provider || detail.ministry} />
                <DetailRow label="지역" value={detail.region} />
                <DetailRow label="서비스요약" value={detail.summary} />
                <DetailRow label="지원대상" value={detail.targetDetail} />
                <DetailRow label="선정기준" value={detail.selectionCriteria} />
                <DetailRow label="지원내용" value={detail.benefitContent} />
                <DetailRow label="신청방법" value={detail.applicationMethods} />
                <DetailRow label="문의처" value={paragraph(detail.contacts)} />
                <DetailRow label="근거법령" value={paragraph(detail.laws)} />
                <DetailRow label="원문 링크" value={detail.detailLink || paragraph(detail.homepages)} />
                <details className="rounded-[8px] border border-[#e186ad]/45 bg-white/70 p-3">
                  <summary className="cursor-pointer text-xs font-black text-[#a50034]">상세 응답 raw JSON</summary>
                  <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap break-words text-xs font-bold leading-5 text-[#5f4050]">
                    {JSON.stringify(detail.raw, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="mt-4 text-sm font-bold text-[#7a4b5f]">목록에서 항목을 선택하면 상세정보가 표시됩니다.</p>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  if (!value) return null;

  return (
    <span className="rounded-full border border-[#e186ad]/55 bg-white/75 px-2.5 py-1 text-[11px] font-black text-[#5f4050]">
      <span className="text-[#a50034]">{label}</span> {value}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[#e186ad]/45 bg-white/70 p-3">
      <p className="text-xs font-black text-[#a50034]">{label}</p>
      <p className="mt-2 whitespace-pre-wrap">{value || "-"}</p>
    </div>
  );
}
