"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FormEvent, useMemo, useRef, useState } from "react";

type WelfareSource = "bokjiro-national" | "bokjiro-local";
type Category = "확인 가능성 높음" | "추가 조건 확인 필요" | "관련 후보" | "제외 가능성 높음";

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
  onlineApplyYn: string;
  contact: string;
  detailLink: string;
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
  applicationLinks: string[];
  contacts: string[];
  homepages: string[];
  laws: string[];
  forms: WelfareFormItem[];
  detailLink: string;
  raw: unknown;
};

type WelfareFormItem = {
  name: string;
  url: string;
  extension: string;
};

type AttachmentCandidate = WelfareFormItem & {
  source: "basfrmList" | "inqplHmpgReldList" | "detailLink" | "raw JSON";
};

type ClassifiedBenefit = WelfareListItem & {
  category: Category;
  reasons: string[];
  matchedKeywords: string[];
};

type FormState = {
  birthYear: string;
  gender: "male" | "female" | "unknown";
  ctpvNm: string;
  sggNm: string;
  livingAlone: boolean;
  basicLivelihood: boolean;
  lowIncome: boolean;
  nearPoverty: boolean;
  disabled: boolean;
  longTermCareGradeYes: boolean;
  longTermCareGradeNo: boolean;
  veteran: boolean;
  dementiaSuspected: boolean;
  mobilityIssue: boolean;
  mealSupport: boolean;
  careNeed: boolean;
  jobInterest: boolean;
  housingSupport: boolean;
  energyDiscountInterest: boolean;
  interests: string;
};

type DetailState = {
  benefit: ClassifiedBenefit;
  detail: WelfareDetailItem;
};

type ExtractedCondition = {
  key: string;
  label: string;
  description: string;
  matched: boolean;
  applyKey?: keyof FormState;
  applyLabel?: string;
};

type AttachmentAnalysis = {
  fileName: string;
  fileType: string;
  fileSize: number;
  extractedText: string;
  extractedTextPreview: string;
  extractedTextLength: number;
  summary: {
    지원대상: string;
    선정기준: string;
    지원내용: string;
    신청방법: string;
    필요서류: string;
    문의처: string;
    주의사항: string;
  };
  warnings: string[];
  error?: string;
};

type AttachmentState = {
  loading: boolean;
  result: AttachmentAnalysis | null;
  error: string;
};

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_FORM: FormState = {
  birthYear: "1944",
  gender: "unknown",
  ctpvNm: "인천광역시",
  sggNm: "미추홀구",
  livingAlone: true,
  basicLivelihood: false,
  lowIncome: false,
  nearPoverty: false,
  disabled: false,
  longTermCareGradeYes: false,
  longTermCareGradeNo: false,
  veteran: false,
  dementiaSuspected: false,
  mobilityIssue: false,
  mealSupport: false,
  careNeed: true,
  jobInterest: false,
  housingSupport: false,
  energyDiscountInterest: false,
  interests: "",
};

function sourceLabel(source: WelfareSource) {
  return source === "bokjiro-local" ? "지자체" : "중앙정부";
}

function paragraph(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.filter(Boolean).join("\n");
  return value?.trim() || "-";
}

function extractExternalUrl(value: string | string[] | undefined) {
  const text = Array.isArray(value) ? value.join(" ") : value;
  return text?.match(/https?:\/\/[^\s,]+/)?.[0] ?? "";
}

function extractExtension(value: string) {
  return value.match(/\.(hwp|hwpx|pdf|doc|docx|xls|xlsx|zip)(?:\?|#|$)/i)?.[1]?.toUpperCase() ?? "";
}

function displayExtension(value: string) {
  return value ? value.toUpperCase() : "";
}

function hasAttachmentExtension(value: string) {
  return /\.(pdf|hwp|hwpx|doc|docx|xls|xlsx)(?:\?|#|$)/i.test(value);
}

function buttonLabel(value: string) {
  return value.replace(/https?:\/\/[^\s,]+/g, "").replace(/\s*:\s*$/, "").trim() || value;
}

function extractFileUrls(value: string) {
  return Array.from(value.matchAll(/https?:\/\/[^\s"'<>]+/g))
    .map((match) => match[0].replace(/[),.;\]}]+$/, ""))
    .filter(hasAttachmentExtension);
}

function fileNameFromUrl(value: string) {
  try {
    const url = new URL(value);
    return decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() ?? "") || value;
  } catch {
    return value;
  }
}

function collectAttachmentCandidates(detail: WelfareDetailItem, detailUrl: string): AttachmentCandidate[] {
  const candidates = new Map<string, AttachmentCandidate>();
  const addCandidate = (candidate: AttachmentCandidate) => {
    if (!candidate.url || !hasAttachmentExtension(candidate.url)) return;
    candidates.set(candidate.url, {
      ...candidate,
      extension: candidate.extension || extractExtension(candidate.url),
      name: candidate.name || fileNameFromUrl(candidate.url),
    });
  };

  detail.forms.forEach((form) => addCandidate({ ...form, source: "basfrmList" }));
  detail.homepages.flatMap(extractFileUrls).forEach((url) => addCandidate({ name: fileNameFromUrl(url), url, extension: extractExtension(url), source: "inqplHmpgReldList" }));
  if (detailUrl && hasAttachmentExtension(detailUrl)) addCandidate({ name: fileNameFromUrl(detailUrl), url: detailUrl, extension: extractExtension(detailUrl), source: "detailLink" });
  extractFileUrls(JSON.stringify(detail.raw)).forEach((url) => addCandidate({ name: fileNameFromUrl(url), url, extension: extractExtension(url), source: "raw JSON" }));

  return Array.from(candidates.values());
}

function collectBasfrmAttachmentCandidates(detail: WelfareDetailItem): AttachmentCandidate[] {
  return detail.forms
    .filter((form) => form.url && ["pdf", "hwp", "hwpx", "doc", "docx", "xls", "xlsx"].includes(form.extension))
    .map((form) => ({
      ...form,
      extension: form.extension,
      name: form.name || fileNameFromUrl(form.url),
      source: "basfrmList" as const,
    }));
}

function collectNonBasfrmAttachmentCandidates(detail: WelfareDetailItem, detailUrl: string) {
  const basfrmUrls = new Set(detail.forms.map((form) => form.url).filter(Boolean));
  return collectAttachmentCandidates(detail, detailUrl).filter((candidate) => candidate.source !== "basfrmList" && !basfrmUrls.has(candidate.url));
}

function findRawField(value: unknown, fieldName: string): unknown[] {
  if (Array.isArray(value)) return value.flatMap((item) => findRawField(item, fieldName));
  if (!value || typeof value !== "object") return [];

  return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => [
    ...(key === fieldName ? [item] : []),
    ...findRawField(item, fieldName),
  ]);
}

function itemKey(item: Pick<WelfareListItem, "source" | "id">) {
  return `${item.source}:${item.id}`;
}

function ageFromBirthYear(birthYear: string) {
  const year = Number(birthYear);
  if (!Number.isFinite(year) || year < 1900) return null;
  return CURRENT_YEAR - year;
}

function buildKeywords(form: FormState) {
  const keywords = new Set(["노인", "어르신"]);
  const age = ageFromBirthYear(form.birthYear);

  form.interests
    .split(/[\s,，/]+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => keywords.add(value));

  if (age !== null && age >= 65) keywords.add("노년");
  if (form.livingAlone) {
    keywords.add("독거");
    keywords.add("노인맞춤돌봄");
    keywords.add("안전확인");
    keywords.add("돌봄");
  }
  if (form.basicLivelihood || form.nearPoverty || form.lowIncome) {
    keywords.add("저소득");
    keywords.add("기초생활");
    keywords.add("차상위");
  }
  if (form.disabled) keywords.add("장애인");
  if (form.longTermCareGradeYes || form.longTermCareGradeNo) {
    keywords.add("장기요양");
    keywords.add("돌봄");
    keywords.add("방문요양");
    keywords.add("주야간보호");
  }
  if (form.dementiaSuspected) {
    keywords.add("치매");
    keywords.add("인지");
    keywords.add("치매안심");
  }
  if (form.mobilityIssue) {
    keywords.add("이동");
    keywords.add("돌봄");
    keywords.add("재가");
  }
  if (form.mealSupport) {
    keywords.add("식사");
    keywords.add("급식");
    keywords.add("밑반찬");
  }
  if (form.careNeed) {
    keywords.add("돌봄");
    keywords.add("요양");
  }
  if (form.jobInterest) {
    keywords.add("노인일자리");
    keywords.add("일자리");
  }
  if (form.housingSupport) keywords.add("주거");
  if (form.energyDiscountInterest) {
    keywords.add("에너지");
    keywords.add("요금감면");
    keywords.add("전기");
    keywords.add("가스");
    keywords.add("통신");
  }
  if (form.veteran) {
    keywords.add("보훈");
    keywords.add("국가유공자");
  }

  return Array.from(keywords).slice(0, 18);
}

function textForBenefit(item: WelfareListItem) {
  return [item.name, item.summary, item.lifeCycle, item.theme, item.targetGroup, item.provider, item.region].join(" ");
}

function classifyBenefit(item: WelfareListItem, form: FormState, keywords: string[]): ClassifiedBenefit {
  const haystack = textForBenefit(item);
  const matchedKeywords = keywords.filter((keyword) => haystack.includes(keyword));
  const reasons: string[] = [];
  let score = 0;

  if (item.source === "bokjiro-local") {
    score += 2;
    reasons.push("거주 지역 기준으로 확인할 수 있는 지자체 서비스입니다.");
  }
  if (/노인|어르신|노년|고령|65세/.test(haystack)) {
    score += 2;
    reasons.push("노년 대상 표현이 확인됩니다.");
  }
  if (matchedKeywords.length > 0) {
    score += Math.min(3, matchedKeywords.length);
    reasons.push(`상담 키워드와 연결됩니다: ${matchedKeywords.slice(0, 3).join(", ")}`);
  }
  if ((form.basicLivelihood || form.nearPoverty || form.lowIncome) && /저소득|기초생활|차상위|수급|생계/.test(haystack)) {
    score += 2;
    reasons.push("저소득 또는 기초생활 관련 조건과 연결될 수 있습니다.");
  }
  if (form.disabled && /장애/.test(haystack)) {
    score += 2;
    reasons.push("장애 관련 조건과 연결될 수 있습니다.");
  }
  if ((form.longTermCareGradeYes || form.longTermCareGradeNo) && /장기요양|요양|돌봄|방문|주야간/.test(haystack)) {
    score += 1;
    reasons.push("장기요양 또는 돌봄 관련 확인이 필요합니다.");
  }
  if (form.dementiaSuspected && /치매|인지|기억|정신/.test(haystack)) {
    score += 2;
    reasons.push("치매 또는 인지 관련 조건과 연결될 수 있습니다.");
  }
  if (form.mobilityIssue && /이동|거동|재가|방문|돌봄|장애/.test(haystack)) {
    score += 1;
    reasons.push("거동 불편 또는 재가 지원 조건과 연결될 수 있습니다.");
  }
  if (form.mealSupport && /식사|급식|밑반찬|도시락|영양/.test(haystack)) {
    score += 2;
    reasons.push("식사 지원 관련 조건과 연결될 수 있습니다.");
  }
  if (form.careNeed && /돌봄|보호|요양|방문|안전확인/.test(haystack)) {
    score += 2;
    reasons.push("돌봄 필요 조건과 연결될 수 있습니다.");
  }
  if (form.jobInterest && /일자리|취업|고용|근로|사회활동/.test(haystack)) {
    score += 2;
    reasons.push("일자리 또는 사회활동 관심과 연결될 수 있습니다.");
  }
  if (form.housingSupport && /주거|주택|임대|전세|월세|집수리/.test(haystack)) {
    score += 2;
    reasons.push("주거 지원 관심과 연결될 수 있습니다.");
  }
  if (form.energyDiscountInterest && /에너지|요금|전기|가스|통신|난방|연탄|등유/.test(haystack)) {
    score += 2;
    reasons.push("에너지 또는 요금 감면 관심과 연결될 수 있습니다.");
  }
  if (form.veteran && /보훈|국가유공자|유공자/.test(haystack)) {
    score += 2;
    reasons.push("보훈 관련 조건과 연결될 수 있습니다.");
  }
  if (/아동|청소년|청년|영유아|임산부|임신|출산/.test(haystack) && !/노인|어르신|고령/.test(haystack)) {
    return {
      ...item,
      category: "제외 가능성 높음",
      reasons: ["현재 입력 조건과 다른 생애주기 서비스로 보입니다."],
      matchedKeywords,
    };
  }

  const category: Category = score >= 5 ? "확인 가능성 높음" : score >= 3 ? "추가 조건 확인 필요" : score >= 1 ? "관련 후보" : "제외 가능성 높음";

  return {
    ...item,
    category,
    reasons: reasons.length > 0 ? reasons : ["공개 정보만으로는 조건을 판단하기 어렵습니다."],
    matchedKeywords,
  };
}

function extractDetailConditions(detail: WelfareDetailItem, form: FormState): ExtractedCondition[] {
  const text = [detail.name, detail.summary, detail.targetDetail, detail.selectionCriteria, detail.benefitContent].join("\n");
  const age = ageFromBirthYear(form.birthYear);
  const conditions: ExtractedCondition[] = [];

  if (/65세\s*이상|65세이상|노인/.test(text)) {
    conditions.push({
      key: "age-65",
      label: "65세 이상",
      description: age === null ? "출생연도로 만 65세 이상 여부 확인이 필요합니다." : `입력 기준 추정 연령은 ${age}세입니다.`,
      matched: age !== null && age >= 65,
    });
  }

  if (/65세\s*미만|64세\s*이하|노인성\s*질병/.test(text)) {
    conditions.push({
      key: "senile-disease",
      label: "65세 미만 노인성 질병",
      description: "치매, 뇌혈관 질환, 파킨슨병 등 노인성 질병 여부를 별도 확인해야 합니다.",
      matched: form.dementiaSuspected,
      applyKey: "dementiaSuspected",
      applyLabel: "치매 의심 조건 반영",
    });
  }

  if (/장기요양\s*[1-5]등급|장기요양.*등급|인지지원등급|장기요양인정/.test(text)) {
    conditions.push({
      key: "long-term-care-grade",
      label: "장기요양등급 또는 인지지원등급",
      description: "장기요양 1~5등급 또는 인지지원등급 여부 확인이 필요합니다.",
      matched: form.longTermCareGradeYes,
      applyKey: "longTermCareGradeYes",
      applyLabel: "장기요양등급 있음 반영",
    });
  }

  if (/치매|인지지원/.test(text)) {
    conditions.push({
      key: "dementia",
      label: "치매 또는 인지 관련 상태",
      description: "치매 진단, 인지지원등급, 치매안심센터 상담 여부를 확인할 수 있습니다.",
      matched: form.dementiaSuspected,
      applyKey: "dementiaSuspected",
      applyLabel: "치매 의심 조건 반영",
    });
  }

  if (/소득수준과\s*상관없이|소득.*상관없이/.test(text)) {
    conditions.push({
      key: "income-independent",
      label: "소득수준 무관",
      description: "이 문장 기준으로는 소득 조건보다 연령·질병·등급 조건 확인이 우선입니다.",
      matched: true,
    });
  }

  if (/의료급여수급권자|의료급여\s*수급/.test(text)) {
    conditions.push({
      key: "medical-aid",
      label: "의료급여수급권자 여부",
      description: "의료급여수급권자 여부는 담당기관 또는 주민센터 확인이 필요합니다.",
      matched: form.basicLivelihood,
      applyKey: "basicLivelihood",
      applyLabel: "기초생활수급자 조건 반영",
    });
  }

  if (/거동|일상생활.*도움|심신의 기능상태|다른 사람의 도움/.test(text)) {
    conditions.push({
      key: "mobility-care",
      label: "일상생활 도움 필요",
      description: "거동 불편, 돌봄 필요, 일상생활 도움 정도를 상담 조건으로 확인할 수 있습니다.",
      matched: form.mobilityIssue || form.careNeed,
      applyKey: "careNeed",
      applyLabel: "돌봄 필요 조건 반영",
    });
  }

  return Array.from(new Map(conditions.map((condition) => [condition.key, condition])).values());
}

async function fetchList(source: WelfareSource, searchWrd: string, form: FormState) {
  const route = source === "bokjiro-local" ? "/api/welfare/local/list" : "/api/welfare/national/list";
  const params = new URLSearchParams({ searchWrd, lifeArray: "006" });

  if (source === "bokjiro-local") {
    params.set("ctpvNm", form.ctpvNm);
    params.set("sggNm", form.sggNm);
  }

  const response = await fetch(`${route}?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) throw new Error(data.error ?? `${sourceLabel(source)} 목록 조회 실패`);
  return (data.items ?? []) as WelfareListItem[];
}

async function fetchDetail(item: WelfareListItem) {
  const route = item.source === "bokjiro-local" ? "/api/welfare/local/detail" : "/api/welfare/national/detail";
  const response = await fetch(`${route}?servId=${encodeURIComponent(item.id)}`);
  const data = await response.json();

  if (!response.ok) throw new Error(data.error ?? "상세 조회 실패");
  return data.item as WelfareDetailItem;
}

export function WelfareCheckClient() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<ClassifiedBenefit[]>([]);
  const [detailState, setDetailState] = useState<DetailState | null>(null);
  const [status, setStatus] = useState("조건을 입력하고 혜택 후보를 조회하세요.");
  const [loading, setLoading] = useState(false);
  const detailRef = useRef<HTMLElement>(null);
  const requestIdRef = useRef(0);

  const grouped = useMemo(() => {
    const groups: Record<Category, ClassifiedBenefit[]> = {
      "확인 가능성 높음": [],
      "추가 조건 확인 필요": [],
      "관련 후보": [],
      "제외 가능성 높음": [],
    };
    benefits.forEach((benefit) => groups[benefit.category].push(benefit));
    return groups;
  }, [benefits]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function runSearch(nextForm: FormState) {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setDetailState(null);
    setStatus("조건을 반영해 중앙정부와 지자체 혜택 후보를 조회하고 있습니다.");

    try {
      const nextKeywords = buildKeywords(nextForm);
      if (requestIdRef.current === requestId) setKeywords(nextKeywords);

      const calls = nextKeywords.flatMap((keyword) => [
        fetchList("bokjiro-national", keyword, nextForm),
        fetchList("bokjiro-local", keyword, nextForm),
      ]);
      const results = await Promise.allSettled(calls);
      const successfulItems = results
        .filter((result): result is PromiseFulfilledResult<WelfareListItem[]> => result.status === "fulfilled")
        .flatMap((result) => result.value);

      if (successfulItems.length === 0) {
        const firstError = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
        throw new Error(firstError?.reason instanceof Error ? firstError.reason.message : "조회 결과가 없습니다.");
      }

      const deduped = Array.from(new Map(successfulItems.map((item) => [itemKey(item), item])).values());
      const classified = deduped
        .map((item) => classifyBenefit(item, nextForm, nextKeywords))
        .sort((left, right) => categoryRank(left.category) - categoryRank(right.category) || right.matchedKeywords.length - left.matchedKeywords.length);

      if (requestIdRef.current !== requestId) return;
      setBenefits(classified);
      const primaryCount = classified.filter((item) => item.category === "확인 가능성 높음" || item.category === "추가 조건 확인 필요").length;
      setStatus(`기본 표시 ${primaryCount}개 / 전체 조회 후보 ${classified.length}개입니다. 관련 후보와 제외 가능성 높은 항목은 접힌 상세 영역에 보관했습니다.`);
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      setBenefits([]);
      setStatus(error instanceof Error ? error.message : "조회 중 오류가 발생했습니다.");
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }

  async function search(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    await runSearch(form);
  }

  async function openDetail(benefit: ClassifiedBenefit) {
    setLoading(true);
    setStatus("상세정보를 조회하고 있습니다.");

    try {
      const detail = await fetchDetail(benefit);
      setDetailState({ benefit, detail });
      setStatus("상세정보를 불러왔습니다. 주민센터/담당기관 확인이 필요합니다.");
      window.setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "상세 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#fff7fb_0%,#ffffff_46%,#ffeaf2_100%)] px-4 py-8 text-[#2f1724] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-[#a50034]">Pigbar Welfare</p>
            <h1 className="mt-3 text-3xl font-black">복지혜택 조건 조회</h1>
            <p className="mt-2 text-sm font-bold text-[#7a4b5f]">조건을 선택한 뒤 조회 버튼을 누르면 복지혜택 후보를 조회합니다. 수급 가능 여부를 단정하지 않습니다.</p>
          </div>
          <Link className="inline-flex h-10 items-center rounded-[4px] border border-[#e186ad]/65 px-4 text-sm font-black text-[#a50034]" href="/">
            Manse로 돌아가기
          </Link>
        </header>

        <form className="mt-8 grid gap-4 rounded-[12px] border border-[#e186ad]/65 bg-white/90 p-4 shadow-[0_18px_48px_rgba(165,0,52,0.08)] lg:grid-cols-4" onSubmit={search}>
          <Field label="출생연도">
            <input className={inputClass} onChange={(event) => updateForm("birthYear", event.target.value)} value={form.birthYear} />
          </Field>
          <Field label="성별">
            <select className={inputClass} onChange={(event) => updateForm("gender", event.target.value as FormState["gender"])} value={form.gender}>
              <option value="unknown">모름/무관</option>
              <option value="female">여성</option>
              <option value="male">남성</option>
            </select>
          </Field>
          <Field label="광역자치단체">
            <input className={inputClass} onChange={(event) => updateForm("ctpvNm", event.target.value)} value={form.ctpvNm} />
          </Field>
          <Field label="기초자치단체">
            <input className={inputClass} onChange={(event) => updateForm("sggNm", event.target.value)} value={form.sggNm} />
          </Field>
          <div className="grid gap-3 rounded-[8px] border border-[#e186ad]/45 bg-white/75 p-3 lg:col-span-2">
            <p className="text-xs font-black text-[#a50034]">조건</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Check label="독거" onChange={(value) => updateForm("livingAlone", value)} value={form.livingAlone} />
              <Check label="기초생활수급자" onChange={(value) => updateForm("basicLivelihood", value)} value={form.basicLivelihood} />
              <Check label="차상위" onChange={(value) => updateForm("nearPoverty", value)} value={form.nearPoverty} />
              <Check label="저소득" onChange={(value) => updateForm("lowIncome", value)} value={form.lowIncome} />
              <Check label="장애인" onChange={(value) => updateForm("disabled", value)} value={form.disabled} />
              <Check label="장기요양등급 있음" onChange={(value) => updateForm("longTermCareGradeYes", value)} value={form.longTermCareGradeYes} />
              <Check label="장기요양등급 없음" onChange={(value) => updateForm("longTermCareGradeNo", value)} value={form.longTermCareGradeNo} />
              <Check label="국가유공자 여부" onChange={(value) => updateForm("veteran", value)} value={form.veteran} />
              <Check label="치매 의심" onChange={(value) => updateForm("dementiaSuspected", value)} value={form.dementiaSuspected} />
              <Check label="거동 불편" onChange={(value) => updateForm("mobilityIssue", value)} value={form.mobilityIssue} />
              <Check label="식사 지원 필요" onChange={(value) => updateForm("mealSupport", value)} value={form.mealSupport} />
              <Check label="돌봄 필요" onChange={(value) => updateForm("careNeed", value)} value={form.careNeed} />
              <Check label="일자리 관심" onChange={(value) => updateForm("jobInterest", value)} value={form.jobInterest} />
              <Check label="주거 지원 필요" onChange={(value) => updateForm("housingSupport", value)} value={form.housingSupport} />
              <Check label="에너지/요금 감면 관심" onChange={(value) => updateForm("energyDiscountInterest", value)} value={form.energyDiscountInterest} />
            </div>
          </div>
          <Field className="lg:col-span-2" label="상담 키워드 또는 관심영역">
            <textarea
              className={`${inputClass} min-h-[116px] py-3`}
              onChange={(event) => updateForm("interests", event.target.value)}
              placeholder="예: 돌봄, 생활지원, 주거, 에너지"
              value={form.interests}
            />
            <span className="text-xs font-bold text-[#9b6b7d]">
              필요한 관심어가 있을 때만 입력하세요. 비워두면 선택한 조건을 기준으로 검색합니다.
            </span>
          </Field>
          <div className="flex flex-col gap-3 lg:col-span-4">
            <button className="h-12 rounded-[4px] bg-[#a50034] px-5 text-sm font-black text-white disabled:opacity-60" disabled={loading} type="submit">
              {loading ? "조회 중..." : "지금 다시 조회"}
            </button>
            <p className="text-sm font-bold text-[#7a4b5f]">{status}</p>
            {keywords.length > 0 ? <p className="text-xs font-bold text-[#9b6b7d]">검색 키워드: {keywords.join(", ")}</p> : null}
          </div>
        </form>

        <section className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4">
            <ResultGroup benefits={grouped["확인 가능성 높음"]} category="확인 가능성 높음" onOpen={openDetail} />
            <ResultGroup benefits={grouped["추가 조건 확인 필요"]} category="추가 조건 확인 필요" onOpen={openDetail} />
            <SecondaryResultGroups
              excluded={grouped["제외 가능성 높음"]}
              related={grouped["관련 후보"]}
              onOpen={openDetail}
            />
          </div>

          <aside className="grid content-start gap-5">
            <Checklist high={grouped["확인 가능성 높음"]} needsCheck={grouped["추가 조건 확인 필요"]} form={form} />
            <section className="scroll-mt-6 rounded-[12px] border border-[#e186ad]/55 bg-white/85 p-4" ref={detailRef}>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a50034]">Benefit Detail</p>
                <h2 className="mt-2 text-2xl font-black">상세정보</h2>
              </div>
              {detailState ? (
                <DetailPanel
                  form={form}
                  key={itemKey(detailState.benefit)}
                  onApplyCondition={(key) => updateForm(key, true as FormState[typeof key])}
                  state={detailState}
                />
              ) : (
                <p className="mt-4 text-sm font-bold text-[#7a4b5f]">혜택 카드를 선택하면 지원대상, 선정기준, 신청방법이 표시됩니다.</p>
              )}
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}

function categoryRank(category: Category) {
  return {
    "확인 가능성 높음": 0,
    "추가 조건 확인 필요": 1,
    "관련 후보": 2,
    "제외 가능성 높음": 3,
  }[category];
}

const inputClass = "w-full rounded-[4px] border border-[#e186ad]/45 bg-white px-3 text-sm font-bold text-[#2f1724] outline-none min-h-11";

function Field({ children, className = "", label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <label className={`grid gap-1 ${className}`}>
      <span className="text-xs font-black text-[#a50034]">{label}</span>
      {children}
    </label>
  );
}

function Check({ label, onChange, value }: { label: string; onChange: (value: boolean) => void; value: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm font-bold text-[#3f2432]">
      <input checked={value} className="size-4 accent-[#a50034]" onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      {label}
    </label>
  );
}

function ResultGroup({ benefits, category, onOpen }: { benefits: ClassifiedBenefit[]; category: Category; onOpen: (benefit: ClassifiedBenefit) => void }) {
  return (
    <section className="rounded-[12px] border border-[#e186ad]/55 bg-white/75 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black">{category}</h2>
        <span className="rounded-full border border-[#e186ad]/55 px-2.5 py-1 text-xs font-black text-[#a50034]">{benefits.length}개</span>
      </div>
      <div className="mt-4 grid gap-3">
        {benefits.slice(0, category === "제외 가능성 높음" ? 6 : 12).map((benefit) => (
          <button className="rounded-[8px] border border-[#e186ad]/65 bg-white p-4 text-left transition hover:bg-[#fff0f6]" key={itemKey(benefit)} onClick={() => onOpen(benefit)} type="button">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="inline-flex rounded-full border border-[#e186ad]/65 bg-white/85 px-2 py-1 text-[10px] font-black text-[#a50034]">{sourceLabel(benefit.source)}</span>
                <p className="mt-2 font-black text-[#a50034]">{benefit.name || "-"}</p>
                <p className="mt-1 text-xs font-bold text-[#7a4b5f]">{benefit.provider || benefit.region || "-"}</p>
              </div>
              <span className="rounded-full bg-[#a50034] px-2.5 py-1 text-[11px] font-black text-white">{benefit.category}</span>
            </div>
            <p className="mt-2 line-clamp-3 text-sm font-bold leading-6 text-[#3f2432]">{benefit.summary || "-"}</p>
            <p className="mt-3 text-xs font-black text-[#a50034]">{categoryPhrase(benefit.category)}</p>
            <ul className="mt-2 grid gap-1 text-xs font-bold leading-5 text-[#7a4b5f]">
              {benefit.reasons.slice(0, 2).map((reason) => (
                <li key={reason}>- {reason}</li>
              ))}
            </ul>
          </button>
        ))}
        {benefits.length === 0 ? <p className="text-sm font-bold text-[#7a4b5f]">해당 분류의 혜택 후보가 없습니다.</p> : null}
      </div>
    </section>
  );
}

function SecondaryResultGroups({
  excluded,
  onOpen,
  related,
}: {
  excluded: ClassifiedBenefit[];
  onOpen: (benefit: ClassifiedBenefit) => void;
  related: ClassifiedBenefit[];
}) {
  const count = related.length + excluded.length;

  return (
    <details className="rounded-[12px] border border-[#e186ad]/55 bg-white/75 p-4">
      <summary className="cursor-pointer text-lg font-black text-[#2f1724]">
        관련 후보 / 제외 가능성 높은 항목 {count}개 보기
      </summary>
      <p className="mt-2 text-xs font-bold leading-5 text-[#7a4b5f]">
        검색은 OR 방식으로 넓게 가져오고, 기본 화면에는 조건과 가까운 후보만 먼저 보여줍니다.
      </p>
      <div className="mt-4 grid gap-4">
        <ResultGroup benefits={related} category="관련 후보" onOpen={onOpen} />
        <ResultGroup benefits={excluded} category="제외 가능성 높음" onOpen={onOpen} />
      </div>
    </details>
  );
}

function categoryPhrase(category: Category) {
  if (category === "확인 가능성 높음") return "확인 가능성이 높습니다. 주민센터/담당기관 확인이 필요합니다.";
  if (category === "추가 조건 확인 필요") return "조건 확인이 필요합니다. 담당기관 확인이 필요합니다.";
  if (category === "관련 후보") return "관련 후보입니다. 공개 정보만으로는 조건이 불명확합니다.";
  return "현재 입력 조건에서는 제외 가능성이 높습니다.";
}

function Checklist({ form, high, needsCheck }: { form: FormState; high: ClassifiedBenefit[]; needsCheck: ClassifiedBenefit[] }) {
  const topItems = [...high.slice(0, 5), ...needsCheck.slice(0, 5)];

  return (
    <section className="rounded-[12px] border border-[#e186ad]/45 bg-white/85 p-4">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a50034]">Checklist</p>
      <h2 className="mt-2 text-2xl font-black">신청/문의 체크리스트</h2>
      <div className="mt-4 grid gap-3 text-sm font-bold leading-6 text-[#3f2432]">
        <p>아래 항목은 신청 확정이 아니라 문의 순서입니다.</p>
        <ul className="grid gap-2">
          <li className="rounded-[8px] border border-[#e186ad]/45 bg-white/70 p-3">□ 주민센터 문의: {form.ctpvNm} {form.sggNm} 기준 서비스 조건 확인</li>
          <li className="rounded-[8px] border border-[#e186ad]/45 bg-white/70 p-3">□ 129 문의: 중앙정부 서비스 지원대상과 신청방법 확인</li>
          {(form.longTermCareGradeYes || form.longTermCareGradeNo || form.careNeed || form.mobilityIssue) ? <li className="rounded-[8px] border border-[#e186ad]/45 bg-white/70 p-3">□ 장기요양등급 상담: 등급 여부와 돌봄 필요 상태 확인</li> : null}
          {form.dementiaSuspected ? <li className="rounded-[8px] border border-[#e186ad]/45 bg-white/70 p-3">□ 치매안심센터 문의: 인지·치매 관련 상담 확인</li> : null}
          {form.energyDiscountInterest ? <li className="rounded-[8px] border border-[#e186ad]/45 bg-white/70 p-3">□ 전기/가스/통신 감면 확인: 요금 감면 조건 확인</li> : null}
          {topItems.map((item) => (
            <li className="rounded-[8px] border border-[#e186ad]/45 bg-white/70 p-3" key={itemKey(item)}>
              □ {item.name} - {item.provider || sourceLabel(item.source)}에 조건 확인
            </li>
          ))}
          <li className="rounded-[8px] border border-[#e186ad]/45 bg-white/70 p-3">□ 주민센터 또는 담당기관에 지원대상과 선정기준 확인</li>
          <li className="rounded-[8px] border border-[#e186ad]/45 bg-white/70 p-3">□ 신분증, 가족관계, 소득 관련 서류 필요 여부 확인</li>
        </ul>
      </div>
    </section>
  );
}

function DetailPanel({
  form,
  onApplyCondition,
  state,
}: {
  form: FormState;
  onApplyCondition: (key: keyof FormState) => void;
  state: DetailState;
}) {
  const { benefit, detail } = state;
  const detailUrl = extractExternalUrl(detail.detailLink || benefit.detailLink || detail.homepages);
  const [attachmentStates, setAttachmentStates] = useState<Record<string, AttachmentState>>({});
  const basfrmCandidates = collectBasfrmAttachmentCandidates(detail);
  const sourcePageCandidates = collectNonBasfrmAttachmentCandidates(detail, detailUrl);
  const basfrmRaw = findRawField(detail.raw, "basfrmList");
  const detailConditions = extractDetailConditions(detail, form);

  async function analyzeAttachment(url: string, fileName: string) {
    setAttachmentStates((current) => ({
      ...current,
      [url]: { loading: true, result: null, error: "" },
    }));

    try {
      const response = await fetch(`/api/welfare/attachment/analyze?url=${encodeURIComponent(url)}&fileName=${encodeURIComponent(fileName)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "첨부파일 분석 실패");

      setAttachmentStates((current) => ({
        ...current,
        [url]: { loading: false, result: data as AttachmentAnalysis, error: "" },
      }));
    } catch (error) {
      setAttachmentStates((current) => ({
        ...current,
        [url]: {
          loading: false,
          result: null,
          error: error instanceof Error ? error.message : "첨부파일 분석 중 오류가 발생했습니다.",
        },
      }));
    }
  }

  return (
    <div className="mt-4 grid gap-4 text-sm font-bold leading-6 text-[#3f2432]">
      <section className="grid gap-4 rounded-[10px] border border-[#e186ad]/55 bg-white/70 p-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a50034]">API Detail</p>
          <h3 className="mt-1 text-lg font-black text-[#a50034]">API 상세정보</h3>
        </div>
        <p className="rounded-[8px] border border-[#e186ad]/65 bg-white p-3 text-[#a50034]">{categoryPhrase(benefit.category)}</p>
        <DetailRow label="서비스명" value={detail.name || benefit.name} />
        <DetailRow label="제공기관" value={detail.provider || detail.ministry || benefit.provider} />
        <DetailRow label="지원대상" value={detail.targetDetail} />
        <DetailRow label="선정기준" value={detail.selectionCriteria} />
        <DetailRow label="지원내용" value={detail.benefitContent || detail.summary || benefit.summary} />
        <DetailRow label="신청방법" value={detail.applicationMethods} />
        <DetailRow label="문의처" value={paragraph(detail.contacts) || benefit.contact} />
        <DetailRow label="온라인 신청 가능 여부" value={benefit.onlineApplyYn === "Y" ? "온라인 신청 가능으로 표시됩니다." : benefit.onlineApplyYn === "N" ? "온라인 신청 여부는 담당기관 확인이 필요합니다." : benefit.onlineApplyYn || "확인 필요"} />
        <DetailButtonSection label="신청기관 / 신청방법" values={detail.applicationLinks.length > 0 ? detail.applicationLinks : detail.applicationMethods.split("\n")} />
        <DetailButtonSection label="문의처" values={detail.contacts} />
        <DetailButtonSection label="관련 홈페이지" values={detail.homepages} />
        <DetailButtonSection label="근거법령" values={detail.laws} />
      </section>
      <ConditionInsightSection conditions={detailConditions} onApplyCondition={onApplyCondition} />
      <section className="grid gap-4 rounded-[10px] border border-[#e186ad]/55 bg-white/70 p-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a50034]">Bokjiro Source Page</p>
          <h3 className="mt-1 text-lg font-black text-[#a50034]">복지로 원페이지 정보</h3>
        </div>
        <DetailLinkRow href={detailUrl} />
        <p className="rounded-[8px] border border-[#e186ad]/65 bg-white p-3 text-xs font-bold leading-5 text-[#7a2e50]">복지로 원페이지의 첨부파일 목록과 API 응답의 첨부파일 목록이 다를 수 있습니다.</p>
        <SourcePageCandidateSection values={sourcePageCandidates} />
      </section>
      <section className="grid gap-4 rounded-[10px] border border-[#e186ad]/55 bg-white/70 p-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a50034]">Attachment Analysis</p>
          <h3 className="mt-1 text-lg font-black text-[#a50034]">첨부파일 분석 결과</h3>
        </div>
        <AttachmentSection analyses={attachmentStates} onAnalyze={analyzeAttachment} values={basfrmCandidates} />
        <AttachmentDebug basfrmRaw={basfrmRaw} forms={detail.forms} requests={basfrmCandidates.map((candidate) => `/api/welfare/attachment/analyze?url=${encodeURIComponent(candidate.url)}&fileName=${encodeURIComponent(candidate.name)}`)} />
      </section>
      <details className="rounded-[8px] border border-[#e186ad]/45 bg-white/70 p-3">
        <summary className="cursor-pointer text-xs font-black text-[#a50034]">raw JSON</summary>
        <pre className="mt-3 max-h-[360px] overflow-auto whitespace-pre-wrap break-words text-xs font-bold leading-5 text-[#5f4050]">
          {JSON.stringify(detail.raw, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function SourcePageCandidateSection({ values }: { values: AttachmentCandidate[] }) {
  const items = Array.from(new Map(values.map((value) => [value.url || value.name, value])).values());

  return (
    <section className="rounded-[8px] border border-[#e186ad]/45 bg-white/70 p-3">
      <p className="text-xs font-black text-[#a50034]">원페이지에서만 확인 가능한 파일 후보</p>
      {items.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {items.map((item) => (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-[#e186ad]/45 bg-white/70 p-2" key={`${item.source}:${item.url}`}>
              <div>
                <p className="text-xs font-black text-[#3f2432]">
                  {item.name} {item.extension ? `(${item.extension})` : ""}
                </p>
                <p className="mt-1 text-[11px] font-bold text-[#9b6b7d]">출처: {item.source}</p>
              </div>
              <a className="rounded-[4px] border border-[#e186ad]/65 bg-white/85 px-3 py-1.5 text-xs font-black text-[#a50034]" href={item.url} rel="noopener noreferrer" target="_blank">
                원문 열기 ↗
              </a>
            </div>
          ))}
          <p className="text-xs font-bold text-[#7a4b5f]">API `basfrmList`에 없는 파일은 자동 분석하지 않습니다. 복지로 원페이지에서 직접 확인해 주세요.</p>
        </div>
      ) : (
        <p className="mt-2 text-xs font-bold text-[#7a4b5f]">API 응답에서 별도 원페이지 파일 후보를 찾지 못했습니다.</p>
      )}
    </section>
  );
}

function ConditionInsightSection({
  conditions,
  onApplyCondition,
}: {
  conditions: ExtractedCondition[];
  onApplyCondition: (key: keyof FormState) => void;
}) {
  return (
    <section className="grid gap-3 rounded-[10px] border border-[#e186ad]/55 bg-[#fff7fb] p-3">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a50034]">Condition Insight</p>
        <h3 className="mt-1 text-lg font-black text-[#a50034]">상세 조건 분석</h3>
        <p className="mt-1 text-xs font-bold leading-5 text-[#7a4b5f]">지원대상과 선정기준에서 상담 입력으로 확인해야 할 조건을 뽑았습니다. 수급 가능 여부를 확정하지 않습니다.</p>
      </div>
      {conditions.length > 0 ? (
        <div className="grid gap-2">
          {conditions.map((condition) => (
            <div className="rounded-[8px] border border-[#e186ad]/45 bg-white p-3" key={condition.key}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-[#2f1724]">{condition.label}</p>
                  <p className="mt-1 text-xs font-bold leading-5 text-[#7a4b5f]">{condition.description}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${condition.matched ? "bg-[#a50034] text-white" : "bg-[#ffe8f1] text-[#a50034]"}`}>
                  {condition.matched ? "입력 조건과 일치" : "확인 필요"}
                </span>
              </div>
              {condition.applyKey && !condition.matched ? (
                <button
                  className="mt-3 rounded-[4px] border border-[#e186ad]/65 bg-white px-3 py-2 text-xs font-black text-[#a50034] transition hover:bg-[#fff0f6]"
                  onClick={() => onApplyCondition(condition.applyKey as keyof FormState)}
                  type="button"
                >
                  {condition.applyLabel ?? "입력 조건에 반영"}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-[8px] border border-[#e186ad]/45 bg-white p-3 text-xs font-bold text-[#7a4b5f]">지원대상/선정기준에서 자동으로 뽑을 수 있는 조건을 찾지 못했습니다.</p>
      )}
    </section>
  );
}

function AttachmentDebug({ basfrmRaw, forms, requests }: { basfrmRaw: unknown[]; forms: WelfareFormItem[]; requests: string[] }) {
  return (
    <details className="rounded-[8px] border border-[#e186ad]/45 bg-white/70 p-3">
      <summary className="cursor-pointer text-xs font-black text-[#a50034]">첨부파일 디버그</summary>
      <div className="mt-3 grid gap-3">
        <DebugBlock label="API basfrmList 원본" value={basfrmRaw.length > 0 ? basfrmRaw : "raw JSON에 basfrmList가 없거나 비어 있습니다."} />
        <DebugBlock label="정규화된 forms 배열" value={forms} />
        <DebugBlock label="첨부파일 분석 요청 URL" value={requests.length > 0 ? requests : "분석 요청 대상이 없습니다."} />
      </div>
    </details>
  );
}

function DebugBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="text-xs font-black text-[#a50034]">{label}</p>
      <pre className="mt-2 max-h-[180px] overflow-auto whitespace-pre-wrap break-words rounded-[6px] bg-white/85 p-2 text-xs font-bold leading-5 text-[#5f4050]">{typeof value === "string" ? value : JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}

function AttachmentSection({
  analyses,
  onAnalyze,
  values,
}: {
  analyses: Record<string, AttachmentState>;
  onAnalyze: (url: string, fileName: string) => void;
  values: AttachmentCandidate[];
}) {
  const items = Array.from(new Map(values.filter((value) => value.name || value.url).map((value) => [value.url || value.name, value])).values());

  return (
    <section className="rounded-[8px] border border-[#e186ad]/45 bg-white/70 p-3">
      <p className="text-xs font-black text-[#a50034]">서식/자료</p>
      {items.length > 0 ? (
        <div className="mt-3 grid gap-3">
          {items.map((item) => {
            const analysis = item.url ? analyses[item.url] : null;

            return (
              <div className="rounded-[6px] border border-[#e186ad]/45 bg-white/70 p-3" key={`${item.name}:${item.url}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-[#a50034]">
                      {item.name || "서식/자료"} {item.extension ? `(${displayExtension(item.extension)})` : ""}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#7a4b5f]">파일 확장자: {displayExtension(item.extension) || "확인 필요"}</p>
                    <p className="mt-1 text-xs font-bold text-[#9b6b7d]">출처: {item.source}</p>
                  </div>
                  {item.url ? (
                    <div className="flex flex-wrap gap-2">
                      <a className="rounded-[4px] border border-[#e186ad]/65 bg-white/85 px-3 py-2 text-xs font-black text-[#a50034]" href={item.url} rel="noopener noreferrer" target="_blank">
                        원문 열기 ↗
                      </a>
                      {item.extension === "hwp" || item.extension === "hwpx" ? (
                        <span className="rounded-[4px] border border-[#e186ad]/65 bg-white/70 px-3 py-2 text-xs font-black text-[#3f2432]">HWP 분석 미지원</span>
                      ) : item.extension === "pdf" ? (
                        <button className="rounded-[4px] border border-[#e186ad]/65 bg-[#a50034] px-3 py-2 text-xs font-black text-white disabled:opacity-60" disabled={analysis?.loading} onClick={() => onAnalyze(item.url, item.name)} type="button">
                          {analysis?.loading ? "분석 중..." : "내용 분석"}
                        </button>
                      ) : (
                        <span className="rounded-[4px] border border-[#e186ad]/65 bg-white/70 px-3 py-2 text-xs font-black text-[#3f2432]">분석 미지원</span>
                      )}
                    </div>
                  ) : (
                    <span className="rounded-[4px] border border-[#e186ad]/65 bg-white/70 px-3 py-2 text-xs font-black text-[#3f2432]">링크 없음</span>
                  )}
                </div>
                {analysis?.error ? <p className="mt-3 text-xs font-bold text-[#b00020]">{analysis.error}</p> : null}
                {analysis?.result ? <AttachmentAnalysisPanel analysis={analysis.result} /> : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-2 text-xs font-bold text-[#7a4b5f]">표시할 항목이 없습니다.</p>
      )}
    </section>
  );
}

function AttachmentAnalysisPanel({ analysis }: { analysis: AttachmentAnalysis }) {
  const extractionSucceeded = analysis.extractedText.trim().length > 0;

  return (
    <div className="mt-3 grid gap-3 rounded-[6px] border border-[#e186ad]/45 bg-white p-3">
      <div className="grid gap-1 text-xs font-bold text-[#3f2432]">
        <p>파일명: {analysis.fileName}</p>
        <p>파일 형식: {analysis.fileType.toUpperCase()}</p>
        <p>파일 크기: {Math.ceil(analysis.fileSize / 1024).toLocaleString()} KB</p>
        <p>추출 성공/실패: {extractionSucceeded ? `성공 (${analysis.extractedTextLength.toLocaleString()}자)` : "미지원 또는 추출 텍스트 없음"}</p>
      </div>
      <div className="grid gap-2">
        <p className="text-xs font-black text-[#a50034]">요약 결과</p>
        <dl className="grid gap-1 text-xs font-bold text-[#3f2432]">
          <SummaryRow label="지원대상" value={analysis.summary.지원대상} />
          <SummaryRow label="선정기준" value={analysis.summary.선정기준} />
          <SummaryRow label="지원내용" value={analysis.summary.지원내용} />
          <SummaryRow label="신청방법" value={analysis.summary.신청방법} />
          <SummaryRow label="필요서류" value={analysis.summary.필요서류} />
          <SummaryRow label="문의처" value={analysis.summary.문의처} />
          <SummaryRow label="주의사항" value={analysis.summary.주의사항} />
        </dl>
      </div>
      {analysis.warnings.length > 0 ? (
        <ul className="grid gap-1 text-xs font-bold text-[#7a2e50]">
          {analysis.warnings.map((warning) => (
            <li key={warning}>- {warning}</li>
          ))}
        </ul>
      ) : null}
      <details className="rounded-[4px] border border-[#e186ad]/45 bg-white/70 p-2">
        <summary className="cursor-pointer text-xs font-black text-[#a50034]">원문 일부 보기</summary>
        <pre className="mt-2 max-h-[220px] overflow-auto whitespace-pre-wrap break-words text-xs font-bold leading-5 text-[#5f4050]">{analysis.extractedTextPreview || analysis.extractedText || "추출된 원문 텍스트가 없습니다."}</pre>
      </details>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[86px_1fr] gap-2">
      <dt className="text-[#a50034]">{label}</dt>
      <dd>{value || "AI 요약 전입니다."}</dd>
    </div>
  );
}

function DetailLinkRow({ href }: { href: string }) {
  return (
    <div className="rounded-[8px] border border-[#e186ad]/45 bg-white/70 p-3">
      <p className="text-xs font-black text-[#a50034]">상세링크</p>
      {href ? (
        <div className="mt-3 grid gap-3">
          <a
            className="inline-flex w-fit items-center gap-2 rounded-[4px] border border-[#e186ad]/45 bg-[#a50034] px-4 py-2 text-sm font-black text-white transition hover:bg-[#8f002c]"
            href={href}
            rel="noopener noreferrer"
            target="_blank"
          >
            복지로 상세보기 <span aria-hidden="true">↗</span>
          </a>
          <p className="text-xs font-bold leading-5 text-[#7a4b5f]">※ 복지로 상세페이지에서 첨부파일, 운영기준, 신청서식을 확인할 수 있습니다.</p>
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-wrap">상세링크 없음</p>
      )}
    </div>
  );
}

function DetailButtonSection({ label, values }: { label: string; values: string[] }) {
  const items = Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

  return (
    <section className="rounded-[8px] border border-[#e186ad]/45 bg-white/70 p-3">
      <p className="text-xs font-black text-[#a50034]">{label}</p>
      {items.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => {
            const href = extractExternalUrl(item);
            const extension = extractExtension(item);
            const labelText = `${buttonLabel(item)}${extension ? ` (${extension})` : ""}`;

            return href ? (
              <a className="inline-flex items-center gap-1 rounded-[4px] border border-[#e186ad]/65 bg-white/85 px-3 py-2 text-xs font-black text-[#a50034]" href={href} key={item} rel="noopener noreferrer" target="_blank">
                {labelText} <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <span className="inline-flex rounded-[4px] border border-[#e186ad]/65 bg-white/70 px-3 py-2 text-xs font-black text-[#3f2432]" key={item}>
                {labelText}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="mt-2 text-xs font-bold text-[#7a4b5f]">표시할 항목이 없습니다.</p>
      )}
    </section>
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
