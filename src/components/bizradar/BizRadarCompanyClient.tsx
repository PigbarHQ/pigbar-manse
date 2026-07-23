"use client";

import { useState } from "react";
import {
  BIZRADAR_COMPANY_PROFILE_STORAGE_KEY,
  companyListToInput,
  EMPTY_COMPANY_PROFILE,
  parseCompanyListInput,
  type BizRadarCompanyProfile,
} from "@/src/lib/bizradar/company";

const EMPLOYEE_COUNT_OPTIONS = ["1~4명", "5~9명", "10~29명", "30~49명", "50~99명", "100명 이상"];
const REVENUE_RANGE_OPTIONS = ["1억 미만", "1억~5억", "5억~10억", "10억~50억", "50억~100억", "100억 이상"];

export function BizRadarCompanyClient() {
  const [profile, setProfile] = useState<BizRadarCompanyProfile>(() => loadStoredCompanyProfile());
  const [status, setStatus] = useState(profile.updatedAt ? "저장된 회사 프로필을 불러왔습니다." : "브라우저에만 저장됩니다. DB에는 저장하지 않습니다.");

  function updateField<K extends keyof BizRadarCompanyProfile>(key: K, value: BizRadarCompanyProfile[K]) {
    setProfile((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function saveProfile() {
    const nextProfile: BizRadarCompanyProfile = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(BIZRADAR_COMPANY_PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
    setProfile(nextProfile);
    setStatus("회사 프로필을 이 브라우저에 저장했습니다.");
  }

  function clearProfile() {
    window.localStorage.removeItem(BIZRADAR_COMPANY_PROFILE_STORAGE_KEY);
    setProfile(EMPTY_COMPANY_PROFILE);
    setStatus("저장된 회사 프로필을 삭제했습니다.");
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-8 text-[#172033]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-[18px] border border-[#d8e0f0] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#4169e1]">Pigbar BizRadar</p>
          <h1 className="mt-2 text-3xl font-black">우리 회사 등록</h1>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <p className="max-w-3xl text-sm font-semibold leading-6 text-[#65708a]">
              입찰공고와 비교할 회사 조건을 정리합니다. 현재 저장은 LocalStorage만 사용하며 DB 저장은 하지 않습니다.
            </p>
            <a className="inline-flex h-10 items-center rounded-[10px] border border-[#c9d3e6] bg-white px-4 text-sm font-black text-[#172033] transition hover:bg-[#f7f9ff]" href="/bizradar/company/import">
              회사 자료로 자동 생성
            </a>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <form className="rounded-[18px] border border-[#d8e0f0] bg-white p-5 shadow-sm" onSubmit={(event) => event.preventDefault()}>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="회사명" onChange={(value) => updateField("companyName", value)} placeholder="예: 피그바랩" value={profile.companyName} />
              <TextField label="사업자번호(선택)" onChange={(value) => updateField("businessRegistrationNumber", value)} placeholder="예: 123-45-67890" value={profile.businessRegistrationNumber} />
              <TextField label="업종" onChange={(value) => updateField("industry", value)} placeholder="예: 소프트웨어 개발 및 공급업" value={profile.industry} />
              <TextField label="지역" onChange={(value) => updateField("region", value)} placeholder="예: 인천광역시 미추홀구" value={profile.region} />
              <SelectField label="직원수" onChange={(value) => updateField("employeeCount", value)} options={EMPLOYEE_COUNT_OPTIONS} value={profile.employeeCount} />
              <SelectField label="매출구간" onChange={(value) => updateField("revenueRange", value)} options={REVENUE_RANGE_OPTIONS} value={profile.revenueRange} />
              <TextAreaField
                help="쉼표 또는 줄바꿈으로 여러 개를 입력합니다."
                label="기술"
                onChange={(value) => updateField("technologies", parseCompanyListInput(value))}
                placeholder={"AI 상담\n데이터 수집\n웹 서비스 개발"}
                value={companyListToInput(profile.technologies)}
              />
              <TextAreaField
                help="예: 벤처기업확인, 기업부설연구소, ISO 등"
                label="보유 인증"
                onChange={(value) => updateField("certifications", parseCompanyListInput(value))}
                placeholder={"벤처기업확인\n기업부설연구소"}
                value={companyListToInput(profile.certifications)}
              />
              <TextAreaField
                help="입찰 참가에 필요한 면허나 등록을 적습니다."
                label="보유 면허"
                onChange={(value) => updateField("licenses", parseCompanyListInput(value))}
                placeholder={"소프트웨어사업자\n정보통신공사업"}
                value={companyListToInput(profile.licenses)}
              />
              <TextAreaField
                help="직접생산확인증명 등 보유 여부를 적습니다."
                label="직접생산"
                onChange={(value) => updateField("directProduction", value)}
                placeholder="예: 정보시스템개발서비스 직접생산 확인"
                value={profile.directProduction}
              />
              <div className="md:col-span-2">
                <TextAreaField
                  help="주요 납품, 구축, 운영 실적을 줄 단위로 입력합니다."
                  label="주요 실적"
                  onChange={(value) => updateField("majorPerformances", parseCompanyListInput(value))}
                  placeholder={"공공기관 상담 시스템 구축\n지역 복지 데이터 통합 조회 화면 개발"}
                  value={companyListToInput(profile.majorPerformances)}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button className="h-11 rounded-[10px] bg-[#2446c8] px-5 text-sm font-black text-white transition hover:bg-[#1c369c]" onClick={saveProfile} type="button">
                회사 프로필 저장
              </button>
              <button className="h-11 rounded-[10px] border border-[#c9d3e6] bg-white px-5 text-sm font-black text-[#36445f] transition hover:bg-[#f7f9ff]" onClick={clearProfile} type="button">
                저장 내용 삭제
              </button>
            </div>
            <p className="mt-4 rounded-[10px] bg-[#f2f5fb] p-3 text-xs font-bold leading-5 text-[#66728a]">{status}</p>
          </form>

          <aside className="rounded-[18px] border border-[#d8e0f0] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">프로필 미리보기</h2>
            <div className="mt-4 grid gap-4">
              <PreviewRow label="회사명" value={profile.companyName} />
              <PreviewRow label="사업자번호" value={profile.businessRegistrationNumber || "선택 입력"} />
              <PreviewRow label="업종" value={profile.industry} />
              <PreviewRow label="지역" value={profile.region} />
              <PreviewRow label="직원수" value={profile.employeeCount} />
              <PreviewRow label="매출구간" value={profile.revenueRange} />
              <PreviewTags label="기술" values={profile.technologies} />
              <PreviewTags label="보유 인증" values={profile.certifications} />
              <PreviewTags label="보유 면허" values={profile.licenses} />
              <PreviewRow label="직접생산" value={profile.directProduction} />
              <PreviewTags label="주요 실적" values={profile.majorPerformances} />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
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

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-black">
      {label}
      <input
        className="h-11 rounded-[10px] border border-[#c9d3e6] bg-white px-3 text-sm font-bold outline-none focus:border-[#4169e1] focus:bg-[#f7f9ff]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-black">
      {label}
      <select
        className="h-11 rounded-[10px] border border-[#c9d3e6] bg-white px-3 text-sm font-bold outline-none focus:border-[#4169e1] focus:bg-[#f7f9ff]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">선택</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder, help }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; help?: string }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-black">
      {label}
      <textarea
        className="min-h-28 rounded-[10px] border border-[#c9d3e6] bg-white px-3 py-3 text-sm font-bold leading-6 outline-none focus:border-[#4169e1] focus:bg-[#f7f9ff]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
      {help ? <span className="text-xs font-bold text-[#7a8499]">{help}</span> : null}
    </label>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-[#e1e7f2] bg-[#fbfcff] p-3">
      <p className="text-xs font-black text-[#8a96ad]">{label}</p>
      <p className="mt-1 text-sm font-black text-[#26334d]">{value || "미입력"}</p>
    </div>
  );
}

function PreviewTags({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="rounded-[12px] border border-[#e1e7f2] bg-[#fbfcff] p-3">
      <p className="text-xs font-black text-[#8a96ad]">{label}</p>
      {values.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <span className="rounded-full border border-[#c8d3ea] bg-white px-3 py-1 text-xs font-black text-[#36445f]" key={value}>{value}</span>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-sm font-black text-[#26334d]">미입력</p>
      )}
    </div>
  );
}
