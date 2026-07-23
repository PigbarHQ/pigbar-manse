"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  BIZRADAR_COMPANY_PROFILE_STORAGE_KEY,
  buildCompanyTenderMatch,
  EMPTY_COMPANY_PROFILE,
  formatTenderAmount,
  normalizeTenderContractMethod,
  summarizeCompanyMatch,
  tenderBusinessTypeLabel,
  type BizRadarCompanyProfile,
  type CompanyMatchResult,
  type TenderBusinessType,
  type TenderOpportunity,
} from "@/src/lib/bizradar";

type TenderListPayload = {
  items: TenderOpportunity[];
  operation: string;
  fetchedAt: string;
  error?: string;
};

type TenderSupplementPayload = {
  supported?: boolean;
  operation?: string;
  items?: Record<string, unknown>[];
  raw?: unknown;
  error?: string;
};

type TenderSupplementState = {
  licenses: TenderSupplementPayload | null;
  regions: TenderSupplementPayload | null;
  basePrice: TenderSupplementPayload | null;
  history: TenderSupplementPayload | null;
  attachments: TenderSupplementPayload | null;
};

const BUSINESS_TYPES: { value: Exclude<TenderBusinessType, "unknown">; label: string }[] = [
  { value: "service", label: "용역" },
  { value: "goods", label: "물품" },
  { value: "construction", label: "공사" },
  { value: "foreign", label: "외자" },
];

export function BizRadarTendersClient() {
  const [businessType, setBusinessType] = useState<Exclude<TenderBusinessType, "unknown">>("service");
  const [keyword, setKeyword] = useState("");
  const [noticeStartDate, setNoticeStartDate] = useState("2026-07-01");
  const [noticeEndDate, setNoticeEndDate] = useState("2026-07-31");
  const [demandAgencyName, setDemandAgencyName] = useState("");
  const [bidNoticeNo, setBidNoticeNo] = useState("");
  const [regionRestriction, setRegionRestriction] = useState("all");
  const [licenseRestriction, setLicenseRestriction] = useState("all");
  const [items, setItems] = useState<TenderOpportunity[]>([]);
  const [selected, setSelected] = useState<TenderOpportunity | null>(null);
  const [supplements, setSupplements] = useState<TenderSupplementState>({
    licenses: null,
    regions: null,
    basePrice: null,
    history: null,
    attachments: null,
  });
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<BizRadarCompanyProfile>(() => loadStoredCompanyProfile());
  const [status, setStatus] = useState("조회 전입니다. 검색 조건을 입력한 뒤 조회해 주세요.");
  const [isLoading, setIsLoading] = useState(false);

  const selectedBusinessLabel = useMemo(
    () => BUSINESS_TYPES.find((item) => item.value === businessType)?.label ?? "업무구분",
    [businessType],
  );

  async function searchTenders() {
    setIsLoading(true);
    setStatus("나라장터 입찰공고를 조회하고 있습니다.");
    setSelected(null);
    resetSupplements();

    try {
      const params = new URLSearchParams({
        businessType,
        keyword,
        noticeStartDate,
        noticeEndDate,
      });
      if (demandAgencyName.trim()) params.set("demandAgencyName", demandAgencyName.trim());
      if (bidNoticeNo.trim()) params.set("bidNoticeNo", bidNoticeNo.trim());
      if (regionRestriction !== "all") params.set("regionRestriction", regionRestriction);
      if (licenseRestriction !== "all") params.set("licenseRestriction", licenseRestriction);
      const response = await fetch(`/api/bizradar/tenders/list?${params.toString()}`);
      const payload = await response.json() as TenderListPayload;

      if (!response.ok) {
        setItems([]);
        setStatus(payload.error || "입찰공고 조회에 실패했습니다.");
        return;
      }

      setItems(payload.items || []);
      setStatus(
        payload.items?.length
          ? `${selectedBusinessLabel} 입찰공고 ${payload.items.length}건을 표시합니다. 검색 방식: 기본 AND 검색`
          : "조회 결과가 없습니다. 검색어 또는 기간을 조정해 보세요.",
      );
    } catch (error) {
      setItems([]);
      setStatus(error instanceof Error ? error.message : "입찰공고 조회에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-8 text-[#172033]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-[18px] border border-[#d8e0f0] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#4169e1]">Pigbar BizRadar</p>
          <h1 className="mt-2 text-3xl font-black">나라장터 입찰공고 검색</h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#65708a]">
            조달청 나라장터 입찰공고정보서비스 문서를 기준으로 검색 구조를 만들었습니다. 현재는 업무구분, 검색어, 공고일 기간으로 목록을 조회합니다.
          </p>
        </header>

        <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-[18px] border border-[#d8e0f0] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">검색 조건</h2>
            <div className="mt-5 flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm font-black">
                업무구분
                <select
                  className="h-11 rounded-[10px] border border-[#c9d3e6] bg-white px-3 text-sm font-bold outline-none focus:border-[#4169e1] focus:bg-[#f7f9ff]"
                  value={businessType}
                  onChange={(event) => setBusinessType(event.target.value as Exclude<TenderBusinessType, "unknown">)}
                >
                  {BUSINESS_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-black">
                검색키워드
                <textarea
                  className="min-h-24 rounded-[10px] border border-[#c9d3e6] bg-white px-3 py-3 text-sm font-bold leading-6 outline-none focus:border-[#4169e1] focus:bg-[#f7f9ff]"
                  placeholder="인증, 개발"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                />
                <span className="text-xs font-bold leading-5 text-[#7a8499]">
                  기본은 AND 검색입니다. 흐릿한 예시는 검색값으로 보내지지 않고, 입력한 내용만 조회합니다.
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-2 text-sm font-black">
                  공고 시작일
                  <input
                    className="h-11 rounded-[10px] border border-[#c9d3e6] bg-white px-3 text-sm font-bold outline-none focus:border-[#4169e1] focus:bg-[#f7f9ff]"
                    type="date"
                    value={noticeStartDate}
                    onChange={(event) => setNoticeStartDate(event.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-black">
                  공고 종료일
                  <input
                    className="h-11 rounded-[10px] border border-[#c9d3e6] bg-white px-3 text-sm font-bold outline-none focus:border-[#4169e1] focus:bg-[#f7f9ff]"
                    type="date"
                    value={noticeEndDate}
                    onChange={(event) => setNoticeEndDate(event.target.value)}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2 text-sm font-black">
                수요기관명
                <input
                  className="h-11 rounded-[10px] border border-[#c9d3e6] bg-white px-3 text-sm font-bold outline-none focus:border-[#4169e1] focus:bg-[#f7f9ff]"
                  onChange={(event) => setDemandAgencyName(event.target.value)}
                  placeholder="예: 인천광역시"
                  value={demandAgencyName}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-black">
                공고번호
                <input
                  className="h-11 rounded-[10px] border border-[#c9d3e6] bg-white px-3 text-sm font-bold outline-none focus:border-[#4169e1] focus:bg-[#f7f9ff]"
                  onChange={(event) => setBidNoticeNo(event.target.value)}
                  placeholder="예: R25BK..."
                  value={bidNoticeNo}
                />
                <span className="text-xs font-bold leading-5 text-[#7a8499]">공고번호를 입력하면 해당 번호 기준으로 조회합니다.</span>
              </label>
              <label className="flex flex-col gap-2 text-sm font-black">
                지역 제한 여부
                <select
                  className="h-11 rounded-[10px] border border-[#c9d3e6] bg-white px-3 text-sm font-bold outline-none focus:border-[#4169e1] focus:bg-[#f7f9ff]"
                  onChange={(event) => setRegionRestriction(event.target.value)}
                  value={regionRestriction}
                >
                  <option value="all">전체</option>
                  <option value="yes">지역 제한 있음</option>
                  <option value="no">지역 제한 없음</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-black">
                면허 제한 여부
                <select
                  className="h-11 rounded-[10px] border border-[#c9d3e6] bg-white px-3 text-sm font-bold outline-none focus:border-[#4169e1] focus:bg-[#f7f9ff]"
                  onChange={(event) => setLicenseRestriction(event.target.value)}
                  value={licenseRestriction}
                >
                  <option value="all">전체</option>
                  <option value="yes">면허 제한 있음</option>
                  <option value="no">면허 제한 없음</option>
                </select>
              </label>

              <button
                className="h-12 rounded-[10px] bg-[#2446c8] text-sm font-black text-white shadow-sm transition hover:bg-[#1c369c] disabled:opacity-60"
                disabled={isLoading}
                onClick={searchTenders}
                type="button"
              >
                {isLoading ? "조회 중..." : "입찰공고 조회"}
              </button>
              <p className="rounded-[10px] bg-[#f2f5fb] p-3 text-xs font-bold leading-5 text-[#66728a]">{status}</p>
            </div>
          </aside>

          <section className="flex flex-col gap-5">
            <div className="rounded-[18px] border border-[#d8e0f0] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black">검색 결과</h2>
                <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-black text-[#2446c8]">{items.length}건</span>
              </div>
              <div className="mt-4 grid gap-3">
                {items.length === 0 ? (
                  <div className="rounded-[14px] border border-dashed border-[#c9d3e6] p-8 text-center text-sm font-bold text-[#7a8499]">
                    실제 조회 결과가 있을 때 이 영역에 입찰공고 카드가 표시됩니다.
                  </div>
                ) : items.map((item) => (
                  <TenderCard
                    isSelected={selected?.id === item.id}
                    item={item}
                    key={item.id}
                    onSelect={() => selectTender(item)}
                    onShowAttachments={() => selectTender(item, "attachments")}
                    onShowParticipation={() => selectTender(item, "participation")}
                  />
                ))}
              </div>
            </div>

            <TenderDetailPanel companyProfile={companyProfile} isLoading={isDetailLoading} item={selected} onReloadCompany={reloadCompanyProfile} supplements={supplements} />
          </section>
        </section>
      </div>
    </main>
  );

  async function selectTender(item: TenderOpportunity, targetSection?: "participation" | "attachments") {
    setSelected(item);
    resetSupplements();
    setIsDetailLoading(true);

    const params = new URLSearchParams({
      businessType: item.businessType,
      bidNoticeNo: item.bidNoticeNo,
    });
    if (item.bidNoticeOrd) params.set("bidNoticeOrd", item.bidNoticeOrd);

    const [licenses, regions, basePrice, history, attachments] = await Promise.all([
      safeSupplementFetch(`/api/bizradar/tenders/licenses?${params.toString()}`),
      safeSupplementFetch(`/api/bizradar/tenders/regions?${params.toString()}`),
      safeSupplementFetch(`/api/bizradar/tenders/base-price?${params.toString()}`),
      safeSupplementFetch(`/api/bizradar/tenders/history?${params.toString()}`),
      safeSupplementFetch(`/api/bizradar/tenders/attachments?${params.toString()}`),
    ]);

    setSupplements({ licenses, regions, basePrice, history, attachments });
    setIsDetailLoading(false);
    if (targetSection) {
      requestAnimationFrame(() => scrollToTenderSection(targetSection));
    }
  }

  function resetSupplements() {
    setSupplements({
      licenses: null,
      regions: null,
      basePrice: null,
      history: null,
      attachments: null,
    });
  }

  function reloadCompanyProfile() {
    setCompanyProfile(loadStoredCompanyProfile());
  }
}

function scrollToTenderSection(section: "participation" | "attachments") {
  const element = document.getElementById(`tender-${section}`);
  element?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function safeSupplementFetch(url: string): Promise<TenderSupplementPayload> {
  try {
    const response = await fetch(url);
    const payload = await response.json() as TenderSupplementPayload;
    if (!response.ok) return { ...payload, items: [], supported: false };
    return payload;
  } catch (error) {
    return {
      supported: false,
      items: [],
      error: error instanceof Error ? error.message : "조회 실패",
    };
  }
}

function TenderCard({
  item,
  isSelected,
  onSelect,
  onShowAttachments,
  onShowParticipation,
}: {
  item: TenderOpportunity;
  isSelected: boolean;
  onSelect: () => void;
  onShowAttachments: () => void;
  onShowParticipation: () => void;
}) {
  return (
    <article className={`rounded-[14px] border p-4 transition ${isSelected ? "border-[#2446c8] bg-[#f6f8ff]" : "border-[#d8e0f0] bg-white hover:bg-[#fbfcff]"}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black text-[#4169e1]">{tenderBusinessTypeLabel(item.businessType)} · {normalizeTenderContractMethod(item.contractMethod)}</p>
          <h3 className="mt-1 text-lg font-black leading-7">{value(item.title)}</h3>
          <p className="mt-2 text-sm font-bold text-[#65708a]">발주기관 {value(item.orderingAgency)} · 수요기관 {value(item.demandAgency)}</p>
        </div>
        <button className="h-10 rounded-[10px] border border-[#c9d3e6] px-4 text-sm font-black transition hover:bg-[#eef2ff]" onClick={onSelect} type="button">
          상세보기
        </button>
      </div>
      <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
        <Info label="공고번호" value={[item.bidNoticeNo, item.bidNoticeOrd].filter(Boolean).join(" / ")} />
        <Info label="공고일시" value={item.noticeDate} />
        <Info label="입찰마감" value={item.bidCloseDate} />
        <Info label="개찰일" value={item.openingDate} />
        <Info label="추정가격" value={formatTenderAmount(item.estimatedPrice)} />
        <Info label="입찰방식" value={item.bidMethod} />
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-full bg-[#2446c8] px-4 py-2 text-xs font-black text-white" onClick={onSelect} type="button">상세보기</button>
        <button className="rounded-full bg-[#eef2ff] px-4 py-2 text-xs font-black text-[#2446c8] transition hover:bg-[#dfe6ff]" onClick={onShowParticipation} type="button">참가조건 확인</button>
        <button className="rounded-full bg-[#eef2ff] px-4 py-2 text-xs font-black text-[#2446c8] transition hover:bg-[#dfe6ff]" onClick={onShowAttachments} type="button">첨부파일 보기</button>
      </div>
    </article>
  );
}

function TenderDetailPanel({
  item,
  supplements,
  isLoading,
  companyProfile,
  onReloadCompany,
}: {
  item: TenderOpportunity | null;
  supplements: TenderSupplementState;
  isLoading: boolean;
  companyProfile: BizRadarCompanyProfile;
  onReloadCompany: () => void;
}) {
  if (!item) {
    return (
      <section className="rounded-[18px] border border-[#d8e0f0] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black">상세 패널</h2>
        <p className="mt-3 text-sm font-bold leading-6 text-[#65708a]">공고 카드를 선택하면 입찰공고 기본정보, 일정, 기관, 참가조건 확인 영역이 표시됩니다.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[18px] border border-[#d8e0f0] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-black">입찰공고 상세</h2>
        {isLoading ? <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-black text-[#2446c8]">상세 API 조회 중</span> : null}
      </div>
      <div className="mt-4 grid gap-5">
        <CompanyMatchCard companyProfile={companyProfile} item={item} onReloadCompany={onReloadCompany} supplements={supplements} />
        <TenderSummaryCard item={item} supplements={supplements} />
        <DetailGroup title="입찰공고 기본정보">
          <Info label="공고명" value={item.title} />
          <Info label="업무구분" value={tenderBusinessTypeLabel(item.businessType)} />
          <Info label="공고번호" value={[item.bidNoticeNo, item.bidNoticeOrd].filter(Boolean).join(" / ")} />
          <Info label="발주기관" value={item.orderingAgency} />
          <Info label="수요기관" value={item.demandAgency} />
          <Info label="계약방법" value={normalizeTenderContractMethod(item.contractMethod)} />
          <Info label="입찰방식" value={item.bidMethod} />
        </DetailGroup>
        <DetailGroup title="입찰 일정">
          <Info label="공고일시" value={item.noticeDate} />
          <Info label="입찰 시작일" value={item.bidStartDate} />
          <Info label="입찰 마감일" value={item.bidCloseDate} />
          <Info label="개찰일" value={item.openingDate} />
        </DetailGroup>
        <DetailGroup title="기초금액">
          <Info label="목록 추정가격" value={formatTenderAmount(item.estimatedPrice)} />
          <Info label="목록 기초금액" value={formatTenderAmount(item.basePrice)} />
          <SupplementRows payload={supplements.basePrice} preferredKeys={["bssamt", "bssAmt", "rsrvtnPrce", "plnprc", "basePrice"]} />
        </DetailGroup>
        <DetailGroup id="tender-participation" title="참가조건">
          <Info label="계약방법" value={normalizeTenderContractMethod(item.contractMethod)} />
          <Info label="입찰방식" value={item.bidMethod} />
          <p className="text-sm font-bold leading-6 text-[#7a8499]">참가 가능성 판정은 아직 하지 않습니다. 면허제한과 참가가능지역 원문을 확인해 주세요.</p>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-black text-[#8a96ad]">면허제한 요약</p>
              <TagList emptyLabel="면허제한 정보 없음" tags={summaryTags(item.licenseRestrictions, supplements.licenses, ["lcnsLmtNm", "licenseNm", "indstrytyNm"])} />
            </div>
            <div>
              <p className="mb-2 text-xs font-black text-[#8a96ad]">참가가능지역 요약</p>
              <TagList emptyLabel="참가가능지역 정보 없음" tags={summaryTags(item.allowedRegions, supplements.regions, ["prtcptPsblRgnNm", "rgnNm"])} />
            </div>
          </div>
        </DetailGroup>
        <DetailGroup title="참가가능지역">
          <TagList emptyLabel="정보 없음" tags={summaryTags(item.allowedRegions, supplements.regions, ["prtcptPsblRgnNm", "rgnNm"])} />
          <SupplementRows payload={supplements.regions} preferredKeys={["prtcptPsblRgnNm", "rgnNm", "rgnLmtYn", "prtcptPsblRgnCd"]} />
        </DetailGroup>
        <DetailGroup title="면허제한">
          <TagList emptyLabel="정보 없음" tags={summaryTags(item.licenseRestrictions, supplements.licenses, ["lcnsLmtNm", "licenseNm", "indstrytyNm"])} />
          <SupplementRows payload={supplements.licenses} preferredKeys={["lcnsLmtNm", "licenseNm", "indstrytyNm", "lcnsLmtCd", "indstrytyCd"]} />
        </DetailGroup>
        <DetailGroup id="tender-attachments" title="첨부파일">
          {item.attachments?.length ? item.attachments.map((attachment) => (
            <a className="text-sm font-black text-[#2446c8] underline" href={attachment.url} key={`${attachment.name}-${attachment.url}`} rel="noopener noreferrer" target="_blank">
              {attachment.name}
            </a>
          )) : <p className="text-sm font-bold text-[#7a8499]">정보 없음</p>}
          <SupplementRows payload={supplements.attachments} preferredKeys={["fileNm", "atchFileNm", "docNm", "fileUrl", "atchFileUrl"]} />
        </DetailGroup>
        <DetailGroup title="변경이력">
          <SupplementRows payload={supplements.history} preferredKeys={["chgDt", "chgHstry", "chgRsn", "bidNtceOrd", "bidNtceSttusNm"]} />
        </DetailGroup>
        <DetailGroup title="Raw">
          <details className="rounded-[12px] border border-[#d8e0f0] bg-white p-3">
            <summary className="cursor-pointer text-sm font-black text-[#2446c8]">Raw JSON 보기</summary>
            <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-[10px] bg-[#101828] p-4 text-xs leading-5 text-[#dbe5ff]">
              {JSON.stringify({
                item,
                supplements,
              }, null, 2)}
            </pre>
          </details>
        </DetailGroup>
      </div>
      <div className="mt-5">
        {item.detailUrl ? (
          <a className="inline-flex h-10 items-center rounded-[10px] bg-[#172033] px-4 text-sm font-black text-white" href={item.detailUrl} rel="noopener noreferrer" target="_blank">
            원문 링크 열기
          </a>
        ) : (
          <span className="text-sm font-bold text-[#7a8499]">원문 링크 정보 없음</span>
        )}
      </div>
    </section>
  );
}

function CompanyMatchCard({
  item,
  supplements,
  companyProfile,
  onReloadCompany,
}: {
  item: TenderOpportunity;
  supplements: TenderSupplementState;
  companyProfile: BizRadarCompanyProfile;
  onReloadCompany: () => void;
}) {
  const matchResults = buildCompanyTenderMatch(hasCompanyProfile(companyProfile) ? companyProfile : null, {
    title: item.title,
    businessType: item.businessType,
    contractMethod: item.contractMethod,
    bidMethod: item.bidMethod,
    allowedRegions: summaryTags(item.allowedRegions, supplements.regions, ["prtcptPsblRgnNm", "rgnNm"]),
    licenseRestrictions: summaryTags(item.licenseRestrictions, supplements.licenses, ["lcnsLmtNm", "licenseNm", "indstrytyNm"]),
    summaryText: tenderComparisonText(item, supplements),
  });
  const summary = summarizeCompanyMatch(matchResults);

  return (
    <article className="rounded-[18px] border border-[#c7d2fe] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#4169e1]">Company Match</p>
          <h3 className="mt-2 text-2xl font-black">우리 회사 적합도</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-[#65708a]">
            {hasCompanyProfile(companyProfile) ? `${companyProfile.companyName} 프로필 기준으로 규칙 비교했습니다.` : "회사 프로필을 등록하면 이 공고와 자동 비교합니다."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SummaryPill tone="blue">Match {summary.match}</SummaryPill>
          <SummaryPill tone="dark">Mismatch {summary.mismatch}</SummaryPill>
          <SummaryPill tone="gray">추가 확인 {summary.unknown}</SummaryPill>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {matchResults.map((result) => (
          <CompanyMatchItem key={result.key} result={result} />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <a className="inline-flex h-10 items-center rounded-[10px] bg-[#172033] px-4 text-sm font-black text-white" href="/bizradar/company">
          회사 프로필 수정
        </a>
        <button className="h-10 rounded-[10px] border border-[#c9d3e6] bg-white px-4 text-sm font-black text-[#36445f] transition hover:bg-[#f7f9ff]" onClick={onReloadCompany} type="button">
          프로필 다시 읽기
        </button>
      </div>
    </article>
  );
}

function CompanyMatchItem({ result }: { result: CompanyMatchResult }) {
  const tone = result.status === "Match"
    ? "border-[#b7e4c7] bg-[#f3fff7] text-[#126b35]"
    : result.status === "Mismatch"
      ? "border-[#ffd0d0] bg-[#fff7f7] text-[#b42318]"
      : "border-[#f2dfaa] bg-[#fffaf0] text-[#8a5a00]";
  const label = result.status === "Unknown" ? "추가 확인" : result.status;

  return (
    <div className={`rounded-[14px] border p-4 ${tone}`}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-black">{result.label}</h4>
        <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-black">{label}</span>
      </div>
      <p className="mt-3 text-sm font-bold leading-6">{result.message}</p>
      {result.evidence.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {result.evidence.map((evidence) => (
            <span className="rounded-full bg-white/75 px-2 py-1 text-[11px] font-black" key={evidence}>{evidence}</span>
          ))}
        </div>
      ) : null}
      <details className="mt-3 rounded-[10px] bg-white/70 p-3">
        <summary className="cursor-pointer text-xs font-black">판단 기준 보기</summary>
        <div className="mt-2 grid gap-2 text-xs font-bold leading-5">
          <p>{companyMatchCriteria(result.key)}</p>
          <p>판단 결과: {label}</p>
          <p>판단 근거: {result.message}</p>
          <p>확인된 값: {result.evidence.length ? result.evidence.join(", ") : "추가 확인 필요"}</p>
        </div>
      </details>
    </div>
  );
}

function TenderSummaryCard({ item, supplements }: { item: TenderOpportunity; supplements: TenderSupplementState }) {
  const licenseTags = summaryTags(item.licenseRestrictions, supplements.licenses, ["lcnsLmtNm", "licenseNm", "indstrytyNm"]);
  const regionTags = summaryTags(item.allowedRegions, supplements.regions, ["prtcptPsblRgnNm", "rgnNm"]);
  const basePrice = firstAmount(supplements.basePrice, ["bssamt", "bssAmt", "rsrvtnPrce", "plnprc", "basePrice"]) ?? item.basePrice ?? item.estimatedPrice;
  const attachmentCount = (item.attachments?.length ?? 0) + countSupplementItems(supplements.attachments);
  const historyCount = countSupplementItems(supplements.history);

  return (
    <article className="rounded-[18px] border border-[#b9c8ff] bg-gradient-to-br from-[#f7f9ff] to-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <SummaryPill tone="blue">{tenderBusinessTypeLabel(item.businessType)}</SummaryPill>
            <SummaryPill tone="dark">{normalizeTenderContractMethod(item.contractMethod)}</SummaryPill>
            <SummaryPill tone="gray">{value(item.bidMethod)}</SummaryPill>
          </div>
          <h3 className="mt-4 text-2xl font-black leading-8 text-[#172033]">{value(item.title)}</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-[#65708a]">
            {value(item.demandAgency)} 수요 · {value(item.orderingAgency)} 발주 · 마감 {value(item.bidCloseDate)}
          </p>
        </div>
        <div className="rounded-[16px] border border-[#d8e0f0] bg-white px-5 py-4 text-right">
          <p className="text-xs font-black text-[#8a96ad]">기초금액/추정가격</p>
          <p className="mt-1 text-2xl font-black text-[#2446c8]">{formatTenderAmount(basePrice)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric label="첨부파일" value={`${attachmentCount}개`} />
        <SummaryMetric label="변경이력" value={`${historyCount}건`} />
        <SummaryMetric label="공고번호" value={[item.bidNoticeNo, item.bidNoticeOrd].filter(Boolean).join(" / ") || "정보 없음"} />
        <SummaryMetric label="개찰일" value={value(item.openingDate)} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-black text-[#8a96ad]">면허제한</p>
          <TagList emptyLabel="정보 없음" tags={licenseTags} />
        </div>
        <div>
          <p className="mb-2 text-xs font-black text-[#8a96ad]">참가가능지역</p>
          <TagList emptyLabel="정보 없음" tags={regionTags} />
        </div>
      </div>
    </article>
  );
}

function SupplementRows({ payload, preferredKeys }: { payload: TenderSupplementPayload | null; preferredKeys: string[] }) {
  if (!payload) return <p className="text-sm font-bold text-[#7a8499]">정보 없음</p>;
  if (payload.error) return <p className="text-sm font-bold text-[#7a8499]">정보 없음</p>;
  if (payload.supported === false) return <p className="text-sm font-bold text-[#7a8499]">정보 없음</p>;
  if (!payload.items?.length) return <p className="text-sm font-bold text-[#7a8499]">정보 없음</p>;

  return (
    <div className="grid gap-2">
      {payload.items.map((row, index) => (
        <div className="rounded-[10px] border border-[#e1e7f2] bg-white p-3" key={index}>
          {preferredKeys.map((key) => {
            const displayValue = display(row[key]);
            if (!displayValue) return null;
            return <Info key={key} label={key} value={displayValue} />;
          })}
          {preferredKeys.every((key) => !display(row[key])) ? (
            <pre className="max-h-36 overflow-auto whitespace-pre-wrap text-xs font-bold leading-5 text-[#65708a]">{JSON.stringify(row, null, 2)}</pre>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function DetailGroup({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <div className="scroll-mt-6 rounded-[14px] border border-[#e1e7f2] bg-[#fbfcff] p-4" id={id}>
      <h3 className="mb-3 text-sm font-black text-[#2446c8]">{title}</h3>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function companyMatchCriteria(key: CompanyMatchResult["key"]) {
  if (key === "industry") return "회사 프로필의 업종 키워드가 공고명, 업무구분, 상세 API 텍스트에 포함되는지 확인합니다.";
  if (key === "licenses") return "공고의 면허제한 값과 회사 프로필의 보유 면허 값을 부분 일치 기준으로 비교합니다.";
  if (key === "directProduction") return "공고 상세 텍스트에 직접생산 요구 단서가 있는지 보고, 회사 프로필의 직접생산 정보 존재 여부를 비교합니다.";
  if (key === "region") return "공고의 참가가능지역과 회사 프로필의 지역을 비교합니다. 전국 공고는 지역 적합으로 봅니다.";
  if (key === "technologies") return "회사 프로필의 기술 키워드가 공고명 또는 상세 API 텍스트에 나타나는지 확인합니다.";
  if (key === "certifications") return "회사 프로필의 보유 인증 키워드가 공고명 또는 상세 API 텍스트에 나타나는지 확인합니다.";
  return "회사 프로필의 주요 실적 키워드가 공고명 또는 상세 API 텍스트와 연결되는지 확인합니다.";
}

function Info({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <dt className="text-xs font-black text-[#8a96ad]">{label}</dt>
      <dd className="mt-1 text-sm font-bold text-[#26334d]">{value === undefined || value === "" ? "정보 없음" : value}</dd>
    </div>
  );
}

function SummaryPill({ children, tone }: { children: ReactNode; tone: "blue" | "dark" | "gray" }) {
  const className = tone === "blue"
    ? "bg-[#2446c8] text-white"
    : tone === "dark"
      ? "bg-[#172033] text-white"
      : "bg-[#eef2f8] text-[#4f5d75]";

  return <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>{children}</span>;
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-[#d8e0f0] bg-white p-3">
      <p className="text-xs font-black text-[#8a96ad]">{label}</p>
      <p className="mt-1 text-sm font-black text-[#26334d]">{value}</p>
    </div>
  );
}

function TagList({ tags, emptyLabel }: { tags: string[]; emptyLabel: string }) {
  if (!tags.length) return <p className="text-sm font-bold text-[#7a8499]">{emptyLabel}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span className="rounded-full border border-[#c8d3ea] bg-white px-3 py-1 text-xs font-black text-[#36445f]" key={tag}>{tag}</span>
      ))}
    </div>
  );
}

function value(input?: string) {
  return input || "정보 없음";
}

function display(input: unknown) {
  if (input === undefined || input === null || input === "") return "";
  if (typeof input === "string" || typeof input === "number") return String(input);
  return JSON.stringify(input);
}

function summaryTags(seed: string[] | undefined, payload: TenderSupplementPayload | null, keys: string[]) {
  return uniqueValues([
    ...(seed ?? []),
    ...extractSupplementValues(payload, keys),
  ]).slice(0, 8);
}

function extractSupplementValues(payload: TenderSupplementPayload | null, keys: string[]) {
  if (!payload?.items?.length) return [];
  return payload.items.flatMap((row) => keys.map((key) => display(row[key]))).filter(Boolean);
}

function countSupplementItems(payload: TenderSupplementPayload | null) {
  if (payload?.supported === false) return 0;
  return payload?.items?.length ?? 0;
}

function firstAmount(payload: TenderSupplementPayload | null, keys: string[]) {
  if (!payload?.items?.length) return undefined;
  for (const row of payload.items) {
    for (const key of keys) {
      const parsed = Number(display(row[key]).replace(/[^\d.-]/g, ""));
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return undefined;
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function tenderComparisonText(item: TenderOpportunity, supplements: TenderSupplementState) {
  return [
    item.title,
    item.contractMethod,
    item.bidMethod,
    item.orderingAgency,
    item.demandAgency,
    JSON.stringify(item.raw),
    JSON.stringify(supplements.licenses?.items ?? []),
    JSON.stringify(supplements.regions?.items ?? []),
    JSON.stringify(supplements.basePrice?.items ?? []),
    JSON.stringify(supplements.attachments?.items ?? []),
  ].filter(Boolean).join(" ");
}

function hasCompanyProfile(profile: BizRadarCompanyProfile) {
  return Boolean(profile.companyName.trim());
}

function loadStoredCompanyProfile() {
  if (typeof window === "undefined") return EMPTY_COMPANY_PROFILE;

  const saved = window.localStorage.getItem(BIZRADAR_COMPANY_PROFILE_STORAGE_KEY);
  if (!saved) return EMPTY_COMPANY_PROFILE;

  try {
    return {
      ...EMPTY_COMPANY_PROFILE,
      ...JSON.parse(saved),
    } as BizRadarCompanyProfile;
  } catch {
    return EMPTY_COMPANY_PROFILE;
  }
}
