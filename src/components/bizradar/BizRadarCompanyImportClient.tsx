"use client";

import { useState } from "react";
import {
  BIZRADAR_COMPANY_PROFILE_STORAGE_KEY,
  companyListToInput,
  EMPTY_COMPANY_PROFILE,
  parseCompanyListInput,
  type BizRadarCompanyProfile,
} from "@/src/lib/bizradar/company";
import type { CompanyKnowledgeImportResult } from "@/src/lib/bizradar/companyKnowledge";

const ACCEPTED_TYPES = ".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation";

export function BizRadarCompanyImportClient() {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<CompanyKnowledgeImportResult | null>(null);
  const [profile, setProfile] = useState<BizRadarCompanyProfile>(EMPTY_COMPANY_PROFILE);
  const [status, setStatus] = useState("회사소개서, 제안서, 실적, 인증서를 업로드하면 프로필 초안을 만듭니다.");
  const [saveStatus, setSaveStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function analyzeFiles() {
    if (!files.length) {
      setStatus("먼저 PDF, DOCX, PPTX 파일을 선택해 주세요.");
      return;
    }

    setIsLoading(true);
    setStatus("파일에서 텍스트를 추출하고 회사 프로필 초안을 만드는 중입니다.");
    setResult(null);
    console.info("[BizRadar Company Import] analyze button clicked", {
      fileCount: files.length,
      files: files.map((file) => ({ name: file.name, size: file.size, type: file.type })),
    });

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      console.info("[BizRadar Company Import] client request started");
      const response = await fetch("/api/bizradar/company/import", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      console.info("[BizRadar Company Import] client response received", {
        ok: response.ok,
        status: response.status,
        usesAi: payload?.usesAi,
        combinedTextLength: payload?.combinedTextLength,
      });
      if (!response.ok) throw new Error(payload?.message ?? payload?.error ?? "회사 자료 분석 실패");
      setResult(payload);
      setProfile({
        ...EMPTY_COMPANY_PROFILE,
        ...payload.draftProfile,
      });
      setSaveStatus("");
      setStatus(payload.usesAi ? "AI가 회사 프로필 초안을 생성했습니다. 저장 전 내용을 확인해 주세요." : "추출 텍스트 기반 초안을 생성했습니다. 저장 전 내용을 확인해 주세요.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }

  function updateField<K extends keyof BizRadarCompanyProfile>(key: K, value: BizRadarCompanyProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
    setSaveStatus("");
  }

  function saveProfile() {
    try {
      const nextProfile = {
        ...profile,
        updatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(BIZRADAR_COMPANY_PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
      setProfile(nextProfile);
      setStatus("검토한 회사 프로필을 이 브라우저에 저장했습니다.");
      setSaveStatus(`저장 완료: ${new Date(nextProfile.updatedAt).toLocaleString("ko-KR")}`);
      console.info("[BizRadar Company Import] company profile saved", {
        storageKey: BIZRADAR_COMPANY_PROFILE_STORAGE_KEY,
        companyName: nextProfile.companyName,
        updatedAt: nextProfile.updatedAt,
      });
    } catch (error) {
      setSaveStatus(`저장 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-8 text-[#172033]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-[18px] border border-[#d8e0f0] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#4169e1]">Pigbar BizRadar</p>
          <h1 className="mt-2 text-3xl font-black">회사 자료로 프로필 만들기</h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#65708a]">
            회사소개서, 제안서, 실적, 인증서 파일에서 텍스트를 추출해 회사 프로필 초안을 만듭니다. 저장은 LocalStorage만 사용하며 DB에는 저장하지 않습니다.
          </p>
        </header>

        <section className="grid gap-5 lg:grid-cols-[420px_1fr]">
          <aside className="rounded-[18px] border border-[#d8e0f0] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">파일 업로드</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-[#65708a]">지원 형식: PDF, DOCX, PPTX</p>
            <label className="mt-5 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-[16px] border-2 border-dashed border-[#b8c6de] bg-[#fbfcff] p-5 text-center transition hover:bg-[#f2f5ff]">
              <input
                accept={ACCEPTED_TYPES}
                className="sr-only"
                multiple
                onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
                type="file"
              />
              <span className="text-sm font-black text-[#2446c8]">파일 선택</span>
              <span className="mt-2 text-xs font-bold text-[#7a8499]">여러 개를 한 번에 올릴 수 있습니다.</span>
            </label>

            {files.length ? (
              <div className="mt-4 grid gap-2">
                {files.map((file) => (
                  <div className="rounded-[12px] border border-[#e1e7f2] bg-[#fbfcff] p-3" key={`${file.name}-${file.size}`}>
                    <p className="text-sm font-black text-[#26334d]">{file.name}</p>
                    <p className="mt-1 text-xs font-bold text-[#7a8499]">{formatBytes(file.size)}</p>
                  </div>
                ))}
              </div>
            ) : null}

            <button
              className="mt-5 h-11 w-full rounded-[10px] bg-[#2446c8] px-5 text-sm font-black text-white transition hover:bg-[#1c369c] disabled:cursor-not-allowed disabled:bg-[#aeb8cc]"
              disabled={isLoading}
              onClick={analyzeFiles}
              type="button"
            >
              {isLoading ? "분석 중..." : "자료 분석하기"}
            </button>
            <p className="mt-4 rounded-[10px] bg-[#f2f5fb] p-3 text-xs font-bold leading-5 text-[#66728a]">{status}</p>

            {result ? (
              <div className="mt-5 rounded-[14px] border border-[#e1e7f2] bg-white p-4">
                <h3 className="text-sm font-black">추출 결과</h3>
                <p className="mt-2 text-xs font-bold text-[#66728a]">AI 사용: {result.usesAi ? "YES" : "NO"}</p>
                <p className="mt-1 text-xs font-bold text-[#66728a]">모델: {result.model ?? "미사용"}</p>
                <p className="mt-1 text-xs font-bold text-[#66728a]">총 추출 글자수: {result.combinedTextLength.toLocaleString()}자</p>
                <div className="mt-3 grid gap-2">
                  {result.documents.map((document) => (
                    <div className="rounded-[10px] bg-[#f7f9ff] p-3" key={document.fileName}>
                      <p className="text-xs font-black text-[#26334d]">{document.fileName}</p>
                      <p className="mt-1 text-xs font-bold text-[#7a8499]">
                        {document.fileType.toUpperCase()} · {document.extractedTextLength.toLocaleString()}자
                      </p>
                    </div>
                  ))}
                </div>
                {result.warnings.length ? (
                  <div className="mt-3 rounded-[10px] bg-[#fff7ed] p-3 text-xs font-bold leading-5 text-[#9a4d00]">
                    {result.warnings.map((warning) => (
                      <p key={warning}>- {warning}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </aside>

          <section className="rounded-[18px] border border-[#d8e0f0] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">회사 프로필 검토</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-[#65708a]">자동 생성된 값은 저장 전에 수정할 수 있습니다.</p>
              </div>
              <a className="rounded-[10px] border border-[#c9d3e6] bg-white px-4 py-2 text-sm font-black text-[#172033] transition hover:bg-[#f7f9ff]" href="/bizradar/company">
                직접 입력 화면
              </a>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <TextField label="회사명" onChange={(value) => updateField("companyName", value)} value={profile.companyName} />
              <TextField label="사업자번호(선택)" onChange={(value) => updateField("businessRegistrationNumber", value)} value={profile.businessRegistrationNumber} />
              <TextField label="업종" onChange={(value) => updateField("industry", value)} value={profile.industry} />
              <TextField label="지역" onChange={(value) => updateField("region", value)} value={profile.region} />
              <TextField label="직원수" onChange={(value) => updateField("employeeCount", value)} value={profile.employeeCount} />
              <TextField label="매출구간" onChange={(value) => updateField("revenueRange", value)} value={profile.revenueRange} />
              <TextAreaField label="기술" onChange={(value) => updateField("technologies", parseCompanyListInput(value))} value={companyListToInput(profile.technologies)} />
              <TextAreaField label="보유 인증" onChange={(value) => updateField("certifications", parseCompanyListInput(value))} value={companyListToInput(profile.certifications)} />
              <TextAreaField label="보유 면허" onChange={(value) => updateField("licenses", parseCompanyListInput(value))} value={companyListToInput(profile.licenses)} />
              <TextAreaField label="직접생산" onChange={(value) => updateField("directProduction", value)} value={profile.directProduction} />
              <div className="md:col-span-2">
                <TextAreaField label="주요 실적" onChange={(value) => updateField("majorPerformances", parseCompanyListInput(value))} value={companyListToInput(profile.majorPerformances)} />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button className="h-11 rounded-[10px] bg-[#2446c8] px-5 text-sm font-black text-white transition hover:bg-[#1c369c]" onClick={saveProfile} type="button">
                검토 후 저장
              </button>
              <a className="inline-flex h-11 items-center rounded-[10px] border border-[#c9d3e6] bg-white px-5 text-sm font-black text-[#36445f] transition hover:bg-[#f7f9ff]" href="/bizradar/tenders">
                입찰공고와 비교하기
              </a>
            </div>
            {saveStatus ? (
              <div className="mt-4 rounded-[12px] border border-[#b8d9c3] bg-[#f0fbf4] p-4">
                <p className="text-sm font-black text-[#176534]">{saveStatus}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-[#3d7a52]">
                  저장된 프로필은 입찰공고 상세 화면의 Company Match Card에서 바로 사용됩니다.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a className="inline-flex h-10 items-center rounded-[10px] bg-[#176534] px-4 text-sm font-black text-white transition hover:bg-[#0f4c27]" href="/bizradar/tenders">
                    입찰공고와 비교하기
                  </a>
                  <a className="inline-flex h-10 items-center rounded-[10px] border border-[#b8d9c3] bg-white px-4 text-sm font-black text-[#176534] transition hover:bg-[#f6fff8]" href="/bizradar/company">
                    저장된 프로필 보기
                  </a>
                </div>
              </div>
            ) : null}
          </section>
        </section>
      </div>
    </main>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-black">
      {label}
      <input
        className="h-11 rounded-[10px] border border-[#c9d3e6] bg-white px-3 text-sm font-bold outline-none focus:border-[#4169e1] focus:bg-[#f7f9ff]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-black">
      {label}
      <textarea
        className="min-h-28 rounded-[10px] border border-[#c9d3e6] bg-white px-3 py-3 text-sm font-bold leading-6 outline-none focus:border-[#4169e1] focus:bg-[#f7f9ff]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function formatBytes(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}
