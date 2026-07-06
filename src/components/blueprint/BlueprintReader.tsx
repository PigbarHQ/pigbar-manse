"use client";

import { useState, type ReactNode } from "react";
import type { BlueprintBook } from "@/src/lib/blueprint/types";
import type { BlueprintAppendix } from "@/src/lib/blueprint/types/runtime";
import type { ManuscriptSource } from "@/src/lib/blueprint/emptyPublication";
import { DEFAULT_BLUEPRINT_EXPERIENCE, type BlueprintExperience } from "@/src/lib/blueprint/experiences";

type BlueprintDebugData = {
  canonicalManseInput: unknown;
  blindCompiler?: unknown;
  futureCompiler?: unknown;
  decisionCompiler?: unknown;
  readerReport?: unknown;
  classicalAnalysis?: unknown;
  features: unknown;
  reasons: unknown;
  writerInput: unknown;
  writerRuntime?: unknown;
  appendix?: unknown;
};

type BlueprintReaderMode = "empty" | "publishing" | "published" | "reading";

type BlueprintReaderProps = {
  appendix?: BlueprintAppendix;
  book: BlueprintBook;
  debugData?: BlueprintDebugData;
  experience?: BlueprintExperience;
  isPublishing?: boolean;
  manuscriptSource?: ManuscriptSource;
  onCreateBook?: () => void;
  onCloseBook?: () => void;
  onEditInput?: () => void;
  onReadBook?: () => void;
  republishPanel?: ReactNode;
  mode?: BlueprintReaderMode;
};

function hasPortraitPages(book: BlueprintBook) {
  return Boolean(book.portrait?.pages?.some((page) => page.content.trim().length > 0));
}

export function BlueprintReader({
  appendix,
  book,
  debugData,
  experience = DEFAULT_BLUEPRINT_EXPERIENCE,
  isPublishing = false,
  mode,
  onCloseBook,
  onCreateBook,
  onEditInput,
  onReadBook,
}: BlueprintReaderProps) {
  const portrait = book.portrait;
  const readerMode: BlueprintReaderMode = mode ?? (isPublishing ? "publishing" : portrait ? "reading" : "empty");
  const readerShellClassName =
    readerMode === "publishing"
      ? "flex min-h-screen w-full items-center justify-center px-4 py-10 sm:px-6 lg:px-8"
      : "mx-auto w-full max-w-[920px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12";

  return (
    <section className={readerShellClassName}>
      {readerMode === "publishing" ? <WritingProgressView experience={experience} /> : null}
      {readerMode === "empty" ? <EmptyPortraitState onCreateBook={onCreateBook} /> : null}
      {portrait && readerMode === "published" ? (
        <CompletedBookView book={book} experience={experience} onEditInput={onEditInput ?? onCreateBook} onReadBook={onReadBook} />
      ) : null}
      {portrait && readerMode === "reading" ? (
        <PagedPortraitReader
          appendix={appendix}
          blindCompiler={debugData?.blindCompiler}
          book={book}
          classicalAnalysis={debugData?.classicalAnalysis}
          decisionCompiler={debugData?.decisionCompiler}
          experience={experience}
          futureCompiler={debugData?.futureCompiler}
          readerReport={debugData?.readerReport}
          onCloseBook={onCloseBook}
        />
      ) : null}
    </section>
  );
}

type BlindAnalysisSection = {
  order?: number;
  title?: string;
  layers?: Array<{
    sajuOriginal?: string[];
    classical?: string[];
    blueprint?: string[];
  }>;
  body?: string[];
};

type ClassicalTraceItem = {
  chapterNo: number;
  chapterTitle: string;
  sajuOriginal: string[];
  classical: string[];
  blueprint: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function blindAnalysisSections(classicalAnalysis: unknown): BlindAnalysisSection[] {
  if (!isRecord(classicalAnalysis) || !Array.isArray(classicalAnalysis.sections)) {
    return [];
  }

  return classicalAnalysis.sections
    .filter(isRecord)
    .map((section) => ({
      order: typeof section.order === "number" ? section.order : undefined,
      title: typeof section.title === "string" ? section.title : undefined,
      layers: Array.isArray(section.layers)
        ? section.layers.filter(isRecord).map((layer) => ({
            sajuOriginal: stringArray(layer.sajuOriginal),
            classical: stringArray(layer.classical),
            blueprint: stringArray(layer.blueprint),
          }))
        : [],
      body: stringArray(section.body),
    }));
}

function appendixTraceSections(appendix: BlueprintAppendix | undefined): ClassicalTraceItem[] {
  return (appendix?.classicalTrace ?? []).map((trace) => ({
    chapterNo: trace.chapterNo,
    chapterTitle: trace.chapterTitle,
    sajuOriginal: trace.sajuOriginal,
    classical: trace.classical,
    blueprint: trace.blueprint,
  }));
}

function BlindAnalysisAppendix({
  appendix,
  classicalAnalysis,
  experience,
}: {
  appendix?: BlueprintAppendix;
  classicalAnalysis?: unknown;
  experience: BlueprintExperience;
}) {
  const blindSections = blindAnalysisSections(classicalAnalysis);
  const traceSections = appendixTraceSections(appendix);

  if (blindSections.length === 0 && traceSections.length === 0) {
    return null;
  }

  return (
    <details className={`group rounded-[8px] border px-6 py-6 sm:px-8 ${experience.theme.surface}`}>
      <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 ${experience.theme.text}`}>
        <span>
          <span className={`block text-xs font-black uppercase tracking-[0.28em] ${experience.theme.accentText}`}>Appendix</span>
          <span className="mt-2 block text-2xl font-black">전문 분석 보기</span>
          <span className={`mt-2 block text-sm font-semibold leading-6 ${experience.theme.mutedText}`}>
            Portrait의 바탕이 된 Blind Classical Analysis를 구조화해 둔 부록입니다.
          </span>
        </span>
        <span className={`shrink-0 rounded-full border px-4 py-2 text-sm font-black transition group-open:rotate-45 ${experience.theme.border}`}>
          +
        </span>
      </summary>

      <div className={`mt-6 border-t pt-6 ${experience.theme.border}`}>
        {blindSections.length > 0 ? (
          <div className="space-y-4">
            {blindSections.map((section, index) => {
              const layer = section.layers?.[0];

              return (
                <article className={`rounded-[6px] border p-4 ${experience.theme.subtleSurface}`} key={`${section.order ?? index}-${section.title ?? "blind"}`}>
                  <p className={`text-xs font-black uppercase tracking-[0.2em] ${experience.theme.accentText}`}>
                    {String(section.order ?? index + 1).padStart(2, "0")}
                  </p>
                  <h3 className={`mt-2 text-lg font-black ${experience.theme.text}`}>{section.title ?? "Blind Analysis"}</h3>
                  <AppendixLineGroup label="근거" lines={layer?.sajuOriginal ?? []} experience={experience} />
                  <AppendixLineGroup label="구조" lines={layer?.classical ?? []} experience={experience} />
                  <AppendixLineGroup label="해석" lines={layer?.blueprint?.length ? layer.blueprint : section.body ?? []} experience={experience} />
                </article>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {traceSections.map((trace) => (
              <article className={`rounded-[6px] border p-4 ${experience.theme.subtleSurface}`} key={`${trace.chapterNo}-${trace.chapterTitle}`}>
                <p className={`text-xs font-black uppercase tracking-[0.2em] ${experience.theme.accentText}`}>
                  {String(trace.chapterNo).padStart(2, "0")}
                </p>
                <h3 className={`mt-2 text-lg font-black ${experience.theme.text}`}>{trace.chapterTitle}</h3>
                <AppendixLineGroup label="근거" lines={trace.sajuOriginal} experience={experience} />
                <AppendixLineGroup label="구조" lines={trace.classical} experience={experience} />
                <AppendixLineGroup label="해석" lines={trace.blueprint} experience={experience} />
              </article>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

function AppendixLineGroup({ experience, label, lines }: { experience: BlueprintExperience; label: string; lines: string[] }) {
  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <p className={`text-xs font-black ${experience.theme.accentText}`}>{label}</p>
      <div className={`mt-2 space-y-1 text-sm leading-6 ${experience.theme.mutedText}`}>
        {lines.map((line, index) => (
          <p key={`${label}-${index}`}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function WritingProgressView({ experience }: { experience: BlueprintExperience }) {
  const steps = [
    "명조를 읽고 있습니다.",
    "기준을 찾고 있습니다.",
    "문장을 다듬고 있습니다.",
    "출판을 준비하고 있습니다.",
  ];

  return (
    <section className={`relative w-full max-w-3xl overflow-hidden rounded-[12px] border px-7 py-12 text-center sm:px-12 sm:py-16 ${experience.theme.surface}`}>
      <div className="pointer-events-none absolute inset-0 opacity-80">
        {experience.id === "glass" ? <GoldenLayerAnimation /> : <PaperLayerAnimation />}
      </div>
      <div className="relative">
        <p className={`text-sm font-black uppercase tracking-[0.38em] ${experience.theme.accentText}`}>Blueprint</p>
        <div className={`mx-auto mt-5 h-px w-48 ${experience.id === "glass" || experience.id === "luxury" ? "bg-gradient-to-r from-transparent via-[#f6c46b] to-transparent" : "bg-[#b8a98f]"}`} />
        <h1 className={`mt-10 text-balance text-3xl font-black leading-tight sm:text-5xl ${experience.theme.text}`}>
          이 사람의 책을 쓰고 있습니다.
        </h1>
        <p className={`mx-auto mt-6 max-w-md text-base leading-8 ${experience.theme.mutedText}`}>
          입력값을 결과로 바꾸는 시간이 아니라,<br />
          한 사람을 한 권의 책으로 묶는 시간입니다.
        </p>

        <div className="mx-auto mt-10 max-w-sm space-y-4 text-left">
          {steps.map((step, index) => (
            <div className="flex items-center gap-4 opacity-80 animate-pulse" key={step} style={{ animationDelay: `${index * 180}ms` }}>
              <span className={`h-2 w-2 rounded-full ${experience.id === "classic" || experience.id === "warm-book" ? "bg-[#8a6b2e]" : "bg-[#f6c46b]"}`} />
              <span className={`text-sm font-bold ${experience.theme.mutedText}`}>{step}</span>
            </div>
          ))}
        </div>

        <div className={`mx-auto mt-10 h-1 max-w-sm overflow-hidden rounded-full ${experience.theme.subtleSurface}`}>
          <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-transparent via-[#f6c46b] to-transparent" />
        </div>
        <div className={`mx-auto mt-10 h-px w-48 ${experience.id === "glass" || experience.id === "luxury" ? "bg-gradient-to-r from-transparent via-[#f6c46b] to-transparent" : "bg-[#b8a98f]"}`} />
      </div>
    </section>
  );
}

function GoldenLayerAnimation() {
  return (
    <div className="absolute inset-0">
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f6c46b]/24 animate-pulse" />
      <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f6c46b]/18 animate-pulse" />
      <div className="absolute inset-x-16 top-1/2 h-px bg-gradient-to-r from-transparent via-[#f6c46b]/60 to-transparent" />
      <div className="absolute left-1/2 top-1/2 h-28 w-20 -translate-x-1/2 -translate-y-1/2 rounded-[10px] border border-[#f6c46b]/35 bg-[#f6c46b]/8 shadow-[0_0_42px_rgba(246,196,107,0.18)]" />
    </div>
  );
}

function PaperLayerAnimation() {
  return (
    <div className="absolute inset-0">
      <div className="absolute left-1/2 top-1/2 h-48 w-72 -translate-x-1/2 -translate-y-1/2 rotate-[-4deg] rounded-[8px] border border-[#b8a98f]/35 bg-white/10 animate-pulse" />
      <div className="absolute left-1/2 top-1/2 h-48 w-72 -translate-x-[48%] -translate-y-[48%] rotate-[3deg] rounded-[8px] border border-[#b8a98f]/28 bg-white/8" />
      <div className="absolute left-1/2 top-1/2 h-px w-60 -translate-x-1/2 bg-[#b8a98f]/35" />
    </div>
  );
}

function CompletedBookView({
  book,
  experience,
  onEditInput,
  onReadBook,
}: {
  book: BlueprintBook;
  experience: BlueprintExperience;
  onEditInput?: () => void;
  onReadBook?: () => void;
}) {
  const portrait = book.portrait;

  if (!portrait) {
    return null;
  }

  return (
    <section className={`relative overflow-hidden rounded-[12px] border px-6 py-10 text-center sm:px-10 lg:px-14 ${experience.theme.surface}`}>
      <div className="pointer-events-none absolute inset-x-16 top-10 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-25" />
      <div className="relative">
        <p className={`text-xs font-black uppercase tracking-[0.32em] ${experience.theme.accentText}`}>Published</p>
        <h1 className={`mx-auto mt-5 max-w-xl text-balance text-3xl font-black leading-tight sm:text-5xl ${experience.theme.text}`}>
          당신의 책이 완성되었습니다.
        </h1>
        <div className="mx-auto mt-10 max-w-[270px] animate-[pulse_5s_ease-in-out_infinite]">
          <BookCoverCard coreAxis={portrait.coreAxis} experience={experience} lens={portrait.narrativeLens} title={portrait.title || book.metadata.title} />
        </div>
        <div className="mx-auto mt-8 max-w-sm">
          <h2 className={`text-2xl font-black leading-snug ${experience.theme.text}`}>{portrait.title || book.metadata.title}</h2>
          <p className={`mt-3 text-sm font-bold ${experience.theme.mutedText}`}>Lens: {portrait.narrativeLens}</p>
          <p className={`mt-2 text-xs font-black uppercase tracking-[0.24em] ${experience.theme.accentText}`}>by Blueprint</p>
        </div>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            className={`h-12 w-full max-w-xs rounded-full px-8 text-sm font-black shadow-[0_12px_26px_rgba(47,33,24,0.18)] transition ${experience.theme.primaryButton}`}
            onClick={onReadBook}
            type="button"
          >
            책 읽기
          </button>
          {onEditInput ? (
            <button
              className={`h-12 w-full max-w-xs rounded-full px-8 text-sm font-black transition ${experience.theme.secondaryButton}`}
              onClick={onEditInput}
              type="button"
            >
              다시 만들기
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function BookCoverCard({ coreAxis, experience, lens, title }: { coreAxis: string; experience: BlueprintExperience; lens: string; title: string }) {
  return (
    <div className={`mx-auto flex aspect-[0.72] w-full max-w-[250px] flex-col rounded-[8px] border p-6 text-center ${experience.theme.cover}`}>
      <div className="flex flex-1 flex-col rounded-[4px] border border-[#b78a3d]/60 px-5 py-6">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d6a64f]">Portrait Book</p>
        <h2 className="mt-10 text-balance text-2xl font-black leading-relaxed">{title}</h2>
        <p className="mt-9 text-sm font-black uppercase tracking-[0.2em] text-[#d6a64f]">Lens: {lens}</p>
        <div className="mx-auto mt-5 h-px w-20 bg-[#d6a64f]/50" />
        <p className="mt-5 text-sm leading-6 text-[#f5ead7]">{coreAxis}</p>
        <p className="mt-auto text-xs font-semibold text-[#f5ead7]">by Pigbar Blueprint</p>
      </div>
    </div>
  );
}

function EmptyPortraitState({ onCreateBook }: { onCreateBook?: () => void }) {
  return (
    <div className="mx-auto mt-10 max-w-2xl rounded-[8px] border border-[#dfd3bf] bg-[#fffaf0] px-7 py-12 text-center shadow-[0_18px_60px_rgba(67,52,32,0.08)] sm:px-10">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9a7a3a]">Portrait Book</p>
      <h1 className="mt-5 text-3xl font-black leading-tight text-[#2f2922]">아직 출판된 책이 없습니다.</h1>
      <p className="mx-auto mt-4 max-w-md text-base leading-8 text-[#756a5c]">
        왼쪽 입력값을 확인한 뒤 Portrait Book을 생성하세요.
      </p>
      {onCreateBook ? (
        <button
          className="mt-8 h-11 rounded-[4px] bg-[#2f2922] px-7 text-sm font-black text-[#fff8ec] shadow-sm transition hover:bg-[#1f1a15]"
          onClick={onCreateBook}
          type="button"
        >
          책 만들기
        </button>
      ) : null}
    </div>
  );
}

function PagedPortraitReader({
  appendix,
  blindCompiler,
  book,
  classicalAnalysis,
  decisionCompiler,
  experience,
  futureCompiler,
  readerReport,
  onCloseBook,
}: {
  appendix?: BlueprintAppendix;
  blindCompiler?: unknown;
  book: BlueprintBook;
  classicalAnalysis?: unknown;
  decisionCompiler?: unknown;
  experience: BlueprintExperience;
  futureCompiler?: unknown;
  readerReport?: unknown;
  onCloseBook?: () => void;
}) {
  const portrait = book.portrait;
  const [currentPage, setCurrentPage] = useState(0);

  if (!portrait || !hasPortraitPages(book)) {
    return null;
  }

  const isFinalCounsel = currentPage === portrait.pages.length;
  const page = portrait.pages[currentPage];

  return (
    <div className="mx-auto w-full max-w-[760px] space-y-6">
      <div className="transition-all duration-150 ease-out animate-in fade-in slide-in-from-right-2">
        {isFinalCounsel ? (
          <FinalCounsel counsel={portrait.finalCounsel} experience={experience} />
        ) : page ? (
          <PortraitPaperPage experience={experience} page={page} />
        ) : null}
      </div>

      {isFinalCounsel ? (
        <div className={`rounded-[8px] border px-6 py-6 text-center ${experience.theme.surface}`}>
          <button
            className={`h-12 w-full max-w-xs rounded-full px-8 text-sm font-black transition ${experience.theme.primaryButton}`}
            onClick={onCloseBook}
            type="button"
          >
            책 닫기
          </button>
          <div className="mt-6">
            <BlindAnalysisAppendix appendix={appendix} classicalAnalysis={classicalAnalysis} experience={experience} />
          </div>
          <div className="mt-4">
            <BlindCompilerDebug blindCompiler={blindCompiler} experience={experience} />
          </div>
          <div className="mt-4">
            <FutureCompilerDebug experience={experience} futureCompiler={futureCompiler} />
          </div>
          <div className="mt-4">
            <DecisionCompilerDebug decisionCompiler={decisionCompiler} experience={experience} />
          </div>
          <div className="mt-4">
            <ReaderReportDebug experience={experience} readerReport={readerReport} />
          </div>
        </div>
      ) : (
        <PageNavigation
          currentPage={currentPage}
          experience={experience}
          onNext={() => setCurrentPage((pageIndex) => Math.min(pageIndex + 1, portrait.pages.length))}
          onPrevious={() => setCurrentPage((pageIndex) => Math.max(pageIndex - 1, 0))}
          totalPages={portrait.pages.length}
        />
      )}
    </div>
  );
}

function BlindCompilerDebug({ blindCompiler, experience }: { blindCompiler?: unknown; experience: BlueprintExperience }) {
  if (!blindCompiler) {
    return null;
  }

  const signals = isRecord(blindCompiler) && isRecord(blindCompiler.signals) ? blindCompiler.signals : {};
  const signalCounts = Object.entries(signals).flatMap(([key, value]) =>
    Array.isArray(value) ? [{ key, count: value.length }] : [],
  );

  return (
    <details className={`rounded-[8px] border px-5 py-5 text-left ${experience.theme.surface}`}>
      <summary className={`cursor-pointer text-sm font-black ${experience.theme.text}`}>Blind Compiler JSON</summary>
      {signalCounts.length > 0 ? (
        <div className={`mt-4 rounded-[6px] border p-4 ${experience.theme.subtleSurface}`}>
          <p className={`text-xs font-black uppercase tracking-[0.2em] ${experience.theme.accentText}`}>Signals Summary</p>
          <div className={`mt-3 grid gap-2 text-xs font-bold sm:grid-cols-2 ${experience.theme.mutedText}`}>
            {signalCounts.map((item) => (
              <p key={item.key}>
                {item.key.replace(/Signals$/, "")}: {item.count} signals
              </p>
            ))}
          </div>
        </div>
      ) : null}
      <pre className={`mt-4 max-h-[420px] overflow-auto rounded-[6px] border p-4 text-xs leading-5 ${experience.theme.subtleSurface} ${experience.theme.mutedText}`}>
        {JSON.stringify(blindCompiler, null, 2)}
      </pre>
    </details>
  );
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function ReaderReportDebug({ experience, readerReport }: { experience: BlueprintExperience; readerReport?: unknown }) {
  if (!readerReport || !isRecord(readerReport)) {
    return null;
  }

  const domainReports = Array.isArray(readerReport.domainReports) ? readerReport.domainReports.filter(isRecord) : [];
  const visibleDomainReports = Array.isArray(readerReport.visibleDomainReports) ? readerReport.visibleDomainReports.filter(isRecord) : [];
  const topOpportunities = Array.isArray(readerReport.topOpportunities) ? readerReport.topOpportunities.filter(isRecord) : [];
  const highRiskOpportunities = Array.isArray(readerReport.highRiskOpportunities) ? readerReport.highRiskOpportunities.filter(isRecord) : [];
  const topRisks = Array.isArray(readerReport.topRisks) ? readerReport.topRisks.filter(isRecord) : [];
  const monthHighlights = stringList(readerReport.monthHighlights);
  const condensedMonthHighlights = stringList(readerReport.condensedMonthHighlights);
  const cautionNotes = stringList(readerReport.cautionNotes);

  return (
    <details className={`rounded-[8px] border px-5 py-5 text-left ${experience.theme.surface}`}>
      <summary className={`cursor-pointer text-sm font-black ${experience.theme.text}`}>Template Reader Report</summary>
      <div className={`mt-4 rounded-[6px] border p-4 ${experience.theme.subtleSurface}`}>
        <p className={`text-xs font-black uppercase tracking-[0.2em] ${experience.theme.accentText}`}>Headline</p>
        <p className={`mt-2 text-sm font-bold ${experience.theme.text}`}>{String(readerReport.headline ?? "")}</p>
      </div>
      <div className={`mt-4 grid gap-3 rounded-[6px] border p-4 text-xs font-bold sm:grid-cols-3 ${experience.theme.subtleSurface} ${experience.theme.mutedText}`}>
        <div>
          <p className={`mb-2 text-xs font-black uppercase tracking-[0.2em] ${experience.theme.accentText}`}>Top Opportunities</p>
          {topOpportunities.slice(0, 5).map((item) => (
            <p key={String(item.domain)}>{String(item.title)}: {String(item.opportunityScore)} / {String(item.readerStatus)}</p>
          ))}
        </div>
        <div>
          <p className={`mb-2 text-xs font-black uppercase tracking-[0.2em] ${experience.theme.accentText}`}>Risk-Mixed Opportunities</p>
          {highRiskOpportunities.slice(0, 5).map((item) => (
            <p key={String(item.domain)}>{String(item.title)}: {String(item.opportunityScore)} / risk {String(item.riskScore)}</p>
          ))}
        </div>
        <div>
          <p className={`mb-2 text-xs font-black uppercase tracking-[0.2em] ${experience.theme.accentText}`}>Top Risks</p>
          {topRisks.slice(0, 5).map((item) => (
            <p key={String(item.domain)}>{String(item.title)}: {String(item.riskScore)} / {String(item.readerStatus)}</p>
          ))}
        </div>
      </div>
      <div className={`mt-4 rounded-[6px] border p-4 ${experience.theme.subtleSurface}`}>
        <p className={`text-xs font-black uppercase tracking-[0.2em] ${experience.theme.accentText}`}>Domain Reports</p>
        <div className={`mt-3 grid gap-2 text-xs font-bold sm:grid-cols-2 ${experience.theme.mutedText}`}>
          {(visibleDomainReports.length > 0 ? visibleDomainReports : domainReports).slice(0, 5).map((item) => (
            <p key={String(item.domain)}>{String(item.title)}: {String(item.summary)}</p>
          ))}
        </div>
      </div>
      <div className={`mt-4 rounded-[6px] border p-4 ${experience.theme.subtleSurface}`}>
        <p className={`text-xs font-black uppercase tracking-[0.2em] ${experience.theme.accentText}`}>Month Highlights</p>
        <div className={`mt-3 space-y-1 text-xs font-bold ${experience.theme.mutedText}`}>
          {(condensedMonthHighlights.length > 0 ? condensedMonthHighlights : monthHighlights).slice(0, 12).map((item) => <p key={item}>{item}</p>)}
        </div>
      </div>
      <div className={`mt-4 rounded-[6px] border p-4 ${experience.theme.subtleSurface}`}>
        <p className={`text-xs font-black uppercase tracking-[0.2em] ${experience.theme.accentText}`}>Caution Notes</p>
        <div className={`mt-3 space-y-1 text-xs font-bold ${experience.theme.mutedText}`}>
          {cautionNotes.map((item) => <p key={item}>{item}</p>)}
        </div>
      </div>
      <pre className={`mt-4 max-h-[420px] overflow-auto rounded-[6px] border p-4 text-xs leading-5 ${experience.theme.subtleSurface} ${experience.theme.mutedText}`}>
        {JSON.stringify(readerReport, null, 2)}
      </pre>
    </details>
  );
}

function DecisionCompilerDebug({ decisionCompiler, experience }: { decisionCompiler?: unknown; experience: BlueprintExperience }) {
  if (!decisionCompiler || !isRecord(decisionCompiler)) {
    return null;
  }

  const decisions = Array.isArray(decisionCompiler.domainDecisions)
    ? decisionCompiler.domainDecisions.filter(isRecord)
    : [];
  const evidence = isRecord(decisionCompiler.decisionEvidence) ? decisionCompiler.decisionEvidence : {};

  return (
    <details className={`rounded-[8px] border px-5 py-5 text-left ${experience.theme.surface}`}>
      <summary className={`cursor-pointer text-sm font-black ${experience.theme.text}`}>Decision Compiler JSON</summary>
      {decisions.length > 0 ? (
        <div className={`mt-4 rounded-[6px] border p-4 ${experience.theme.subtleSurface}`}>
          <p className={`text-xs font-black uppercase tracking-[0.2em] ${experience.theme.accentText}`}>Decision Summary</p>
          <div className={`mt-3 grid gap-2 text-xs font-bold sm:grid-cols-2 ${experience.theme.mutedText}`}>
            {decisions.slice(0, 12).map((item) => (
              <p key={String(item.domain)}>
                {String(item.domain)}: opportunity {String(item.opportunityScore)} {String(item.opportunityGrade)} / risk {String(item.riskScore)} {String(item.riskGrade)} / direct {String(item.directRiskScore)} / global {String(item.globalRiskScore)} / status {String(item.readerStatus)}
              </p>
            ))}
          </div>
        </div>
      ) : null}
      {Object.keys(evidence).length > 0 ? (
        <div className={`mt-4 rounded-[6px] border p-4 ${experience.theme.subtleSurface}`}>
          <p className={`text-xs font-black uppercase tracking-[0.2em] ${experience.theme.accentText}`}>Decision Evidence Sample</p>
          <pre className={`mt-3 max-h-[220px] overflow-auto text-xs leading-5 ${experience.theme.mutedText}`}>
            {JSON.stringify(Object.fromEntries(Object.entries(evidence).slice(0, 3)), null, 2)}
          </pre>
        </div>
      ) : null}
      {isRecord(decisionCompiler.decisionSummaryIndex) ? (
        <div className={`mt-4 rounded-[6px] border p-4 ${experience.theme.subtleSurface}`}>
          <p className={`text-xs font-black uppercase tracking-[0.2em] ${experience.theme.accentText}`}>decisionSummaryIndex</p>
          <pre className={`mt-3 max-h-[220px] overflow-auto text-xs leading-5 ${experience.theme.mutedText}`}>
            {JSON.stringify(decisionCompiler.decisionSummaryIndex, null, 2)}
          </pre>
        </div>
      ) : null}
      <pre className={`mt-4 max-h-[420px] overflow-auto rounded-[6px] border p-4 text-xs leading-5 ${experience.theme.subtleSurface} ${experience.theme.mutedText}`}>
        {JSON.stringify(decisionCompiler, null, 2)}
      </pre>
    </details>
  );
}

function FutureCompilerDebug({ experience, futureCompiler }: { experience: BlueprintExperience; futureCompiler?: unknown }) {
  if (!futureCompiler) {
    return null;
  }

  const signals = isRecord(futureCompiler) && isRecord(futureCompiler.futureSignals) ? futureCompiler.futureSignals : {};
  const signalCounts = Object.entries(signals).flatMap(([key, value]) =>
    Array.isArray(value) ? [{ key, count: value.length }] : [],
  );
  const monthlyTimingIndex = isRecord(futureCompiler) && Array.isArray(futureCompiler.monthlyTimingIndex)
    ? futureCompiler.monthlyTimingIndex.filter(isRecord)
    : [];
  const relationIntensity = isRecord(futureCompiler) && Array.isArray(futureCompiler.relationIntensity)
    ? futureCompiler.relationIntensity.filter(isRecord)
    : [];
  const highRelationMonths = relationIntensity.filter((item) => item.intensity === "HIGH");
  const monthsByCode = (pattern: RegExp) =>
    monthlyTimingIndex.filter((item) =>
      Array.isArray(item.activeTimingCodes) && item.activeTimingCodes.some((code) => typeof code === "string" && pattern.test(code)),
    );

  return (
    <details className={`rounded-[8px] border px-5 py-5 text-left ${experience.theme.surface}`}>
      <summary className={`cursor-pointer text-sm font-black ${experience.theme.text}`}>Future Compiler JSON</summary>
      {signalCounts.length > 0 ? (
        <div className={`mt-4 rounded-[6px] border p-4 ${experience.theme.subtleSurface}`}>
          <p className={`text-xs font-black uppercase tracking-[0.2em] ${experience.theme.accentText}`}>Future Signals Summary</p>
          <div className={`mt-3 grid gap-2 text-xs font-bold sm:grid-cols-2 ${experience.theme.mutedText}`}>
            {signalCounts.map((item) => (
              <p key={item.key}>
                {item.key.replace(/Signals$/, "")}: {item.count} signals
              </p>
            ))}
          </div>
        </div>
      ) : null}
      {monthlyTimingIndex.length > 0 ? (
        <div className={`mt-4 grid gap-3 rounded-[6px] border p-4 text-xs font-bold ${experience.theme.subtleSurface} ${experience.theme.mutedText}`}>
          <p className={`text-xs font-black uppercase tracking-[0.2em] ${experience.theme.accentText}`}>Monthly Timing Index</p>
          <p>High Relation Months: {highRelationMonths.map((item) => `${String(item.month)}월 ${String(item.ganji)}`).join(", ") || "none"}</p>
          <p>Wealth Timing Months: {monthsByCode(/WEALTH/).map((item) => `${String(item.month)}월 ${String(item.ganji)}`).join(", ") || "none"}</p>
          <p>Officer Timing Months: {monthsByCode(/OFFICER/).map((item) => `${String(item.month)}월 ${String(item.ganji)}`).join(", ") || "none"}</p>
          <p>Resource Timing Months: {monthsByCode(/RESOURCE/).map((item) => `${String(item.month)}월 ${String(item.ganji)}`).join(", ") || "none"}</p>
          <p>Movement Timing Months: {monthsByCode(/CLASH|MOVEMENT/).map((item) => `${String(item.month)}월 ${String(item.ganji)}`).join(", ") || "none"}</p>
        </div>
      ) : null}
      <pre className={`mt-4 max-h-[420px] overflow-auto rounded-[6px] border p-4 text-xs leading-5 ${experience.theme.subtleSurface} ${experience.theme.mutedText}`}>
        {JSON.stringify(futureCompiler, null, 2)}
      </pre>
    </details>
  );
}

function PageNavigation({
  currentPage,
  experience,
  onNext,
  onPrevious,
  totalPages,
}: {
  currentPage: number;
  experience: BlueprintExperience;
  onNext: () => void;
  onPrevious: () => void;
  totalPages: number;
}) {
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;

  return (
    <nav className={`grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-[8px] border px-4 py-4 ${experience.theme.surface}`}>
      <button
        className={`h-11 rounded-full px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-35 ${experience.theme.secondaryButton}`}
        disabled={isFirstPage}
        onClick={onPrevious}
        type="button"
      >
        ← 이전 장
      </button>
      <p className={`text-sm font-black tabular-nums ${experience.theme.mutedText}`}>
        Page {currentPage + 1} / {totalPages}
      </p>
      <button
        className={`h-11 rounded-full px-4 text-sm font-black transition ${experience.theme.primaryButton}`}
        onClick={onNext}
        type="button"
      >
        {isLastPage ? "마지막 당부 보기" : "다음 장 →"}
      </button>
    </nav>
  );
}

function paperSurfaceClassName(experience: BlueprintExperience) {
  if (experience.id === "glass") {
    return "border-[#b98534]/55 bg-[linear-gradient(135deg,rgba(255,249,232,0.96),rgba(226,207,166,0.88)),radial-gradient(circle_at_18%_12%,rgba(246,196,107,0.18),transparent_28%)] text-[#2f2922] shadow-[0_28px_90px_rgba(240,184,91,0.16)]";
  }

  if (experience.id === "luxury") {
    return "border-[#d9a850]/60 bg-[linear-gradient(135deg,#fff4d7,#e7cf9a_62%,#d2ad69)] text-[#25150e] shadow-[0_32px_96px_rgba(0,0,0,0.32)]";
  }

  if (experience.id === "classic") {
    return "border-[#b8a98f] bg-[linear-gradient(135deg,#fffaf0,#f3e8d4_62%,#eadcc3)] text-[#211d18] shadow-[0_22px_64px_rgba(45,37,27,0.16)]";
  }

  return "border-[#d8cdbb] bg-[linear-gradient(135deg,#fffaf0,#f5ead8_60%,#eadac0)] text-[#2f2922] shadow-[0_22px_64px_rgba(82,62,35,0.14)]";
}

function PortraitPaperPage({
  experience,
  page,
}: {
  experience: BlueprintExperience;
  page: {
    pageNo: number;
    title: string;
    content: string;
  };
}) {
  return (
    <article
      className={`relative mx-auto min-h-[520px] max-w-3xl overflow-hidden rounded-[4px] border px-8 py-10 sm:px-14 sm:py-16 ${paperSurfaceClassName(experience)}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(90,68,40,0.035)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.26),rgba(122,89,45,0.04))] bg-[length:26px_26px,100%_100%]" />
      <div className="pointer-events-none absolute inset-x-6 top-6 h-px bg-[#8a6b2e]/18" />
      <div className="pointer-events-none absolute inset-x-6 bottom-6 h-px bg-[#8a6b2e]/14" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-20 w-20 bg-[linear-gradient(135deg,transparent_50%,rgba(122,89,45,0.13)_51%,rgba(255,255,255,0.18))]" />
      <div className="relative flex min-h-[390px] flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-[#8a6b2e]/18 pb-5">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#8a6b2e]">Page {page.pageNo}</p>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a6b2e]/70">Portrait Book</p>
        </div>
        <h2 className="mt-10 max-w-2xl text-3xl font-black leading-snug text-[#2f2922]">{page.title}</h2>
        <div className="mt-8 space-y-6 text-[18px] leading-[2.05] text-[#5f5141]">
          {page.content.split("\n").map((line, index) => {
            const trimmed = line.trim();

            return trimmed ? <p key={`${page.pageNo}-${index}`}>{trimmed}</p> : null;
          })}
        </div>
        <p className="mt-auto pt-10 text-right text-xs font-black tabular-nums tracking-[0.2em] text-[#8a6b2e]/70">
          {String(page.pageNo).padStart(2, "0")}
        </p>
      </div>
    </article>
  );
}

function FinalCounsel({ counsel, experience }: { counsel: string; experience: BlueprintExperience }) {
  return (
    <section className={`mx-auto min-h-[460px] max-w-3xl rounded-[12px] border px-8 py-14 sm:px-14 sm:py-20 ${experience.theme.counsel}`}>
      <div className="flex min-h-[320px] flex-col justify-center">
        <p className={`text-sm font-black uppercase tracking-[0.28em] ${experience.theme.accentText}`}>마지막 당부</p>
        <blockquote className={`mt-10 border-l-4 pl-8 text-3xl font-black leading-[1.75] sm:text-4xl ${experience.theme.border} ${experience.theme.text}`}>
          {counsel}
        </blockquote>
      </div>
    </section>
  );
}
