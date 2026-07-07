"use client";

import { FormEvent, type ReactNode, type RefObject, useRef, useState } from "react";
import Link from "next/link";
import { CITY_OPTIONS, DEFAULT_CURRENT_DATE_TIME } from "@/src/lib/manse/constants";
import type { BirthPlace, CalendarType, Gender, ManseInput } from "@/src/lib/manse";
import type { BlueprintBook } from "@/src/lib/blueprint/types";
import type { BlueprintAppendix } from "@/src/lib/blueprint/types/runtime";
import type { ManuscriptSource } from "@/src/lib/blueprint/emptyPublication";
import { BLUEPRINT_EXPERIENCES, DEFAULT_BLUEPRINT_EXPERIENCE, type BlueprintExperience } from "@/src/lib/blueprint/experiences";
import { sampleBlindAnalysis } from "@/src/lib/blueprint/fixtures/sampleBlindAnalysis";
import { samplePortraitBook } from "@/src/lib/blueprint/fixtures/samplePortraitBook";
import { BlueprintReader } from "./BlueprintReader";

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

type BlueprintPublicationState = {
  manseInput: ManseInput;
  book: BlueprintBook;
  appendix: BlueprintAppendix;
  debugData: BlueprintDebugData;
  manuscriptSource: ManuscriptSource;
};

type BlueprintUiState = "EXPERIENCE" | "WELCOME" | "ANALYZING" | "RESULT" | "PUBLISHING" | "PUBLISHED" | "READING" | "EDIT";
type GenerationMode = "sample" | "gpt";
type WorkspaceMode = "analysis" | "legacy";
type WorkspaceKind = "developer" | "service";
type ResultTab = "summary" | "blind" | "future" | "decision" | "evidence" | "json" | "rawData" | "prompt";

const defaultGenerationMode: GenerationMode = process.env.NODE_ENV === "production" ? "gpt" : "sample";

function getBirthPlace(name: string): BirthPlace {
  const city = CITY_OPTIONS.find((option) => option.name === name) ?? CITY_OPTIONS[0];

  return {
    name: city.name,
    label: city.name,
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: "Asia/Seoul",
  };
}

function cityNameFromInput(input: ManseInput) {
  return CITY_OPTIONS.some((city) => city.name === input.birthPlace.name)
    ? input.birthPlace.name
    : CITY_OPTIONS[0].name;
}

export function BlueprintClassicalWorkspace({ initial, workspace = "developer" }: { initial: BlueprintPublicationState; workspace?: WorkspaceKind }) {
  const [publication, setPublication] = useState(initial);
  const [uiState, setUiState] = useState<BlueprintUiState>("WELCOME");
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>(workspace === "developer" ? "analysis" : "analysis");
  const [resultTab, setResultTab] = useState<ResultTab>("summary");
  const [experienceId, setExperienceId] = useState(DEFAULT_BLUEPRINT_EXPERIENCE.id);
  const [generationMode, setGenerationMode] = useState<GenerationMode>(defaultGenerationMode);
  const [name, setName] = useState(initial.manseInput.name ?? "주영지");
  const [gender, setGender] = useState<Gender>(initial.manseInput.gender);
  const [birthDate, setBirthDate] = useState(initial.manseInput.birthDate);
  const [calendarType, setCalendarType] = useState<CalendarType>(initial.manseInput.calendarType);
  const [isLeapMonth, setIsLeapMonth] = useState(initial.manseInput.isLeapMonth);
  const [birthTime, setBirthTime] = useState(initial.manseInput.birthTime ?? "03:50");
  const [timeUnknown, setTimeUnknown] = useState(Boolean(initial.manseInput.unknownTime));
  const [cityName, setCityName] = useState(cityNameFromInput(initial.manseInput));
  const [useLocalMeanTime, setUseLocalMeanTime] = useState(Boolean(initial.manseInput.useLocalMeanTime));
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const isPublishing = uiState === "PUBLISHING" || uiState === "ANALYZING";
  const selectedExperience = BLUEPRINT_EXPERIENCES.find((experience) => experience.id === experienceId) ?? DEFAULT_BLUEPRINT_EXPERIENCE;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUiState(workspaceMode === "analysis" ? "ANALYZING" : "PUBLISHING");
    setError(null);

    const payload: ManseInput = {
      name,
      gender,
      birthDate,
      calendarType,
      isLeapMonth,
      birthTime: timeUnknown ? null : birthTime,
      unknownTime: timeUnknown,
      birthPlace: getBirthPlace(cityName),
      useLocalMeanTime,
      currentDateTime: DEFAULT_CURRENT_DATE_TIME,
      ziHourRule: "midnight",
      daewoonDirectionRule: "standard",
    };

    try {
      if (workspaceMode === "analysis") {
        const manseResponse = await fetch("/api/manse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const manseData = await manseResponse.json();

        if (!manseResponse.ok) {
          setError(manseData.error ?? "분석 결과를 만들지 못했습니다.");
          setUiState("WELCOME");
          return;
        }

        setPublication((current) => ({
          ...current,
          manseInput: payload,
          debugData: {
            ...current.debugData,
            canonicalManseInput: payload,
            blindCompiler: manseData.blindCompiler,
            futureCompiler: manseData.futureCompiler,
            decisionCompiler: manseData.decisionCompiler,
            readerReport: manseData.readerReport,
          },
          manuscriptSource: "Empty",
        }));
        setResultTab("summary");
        setUiState("RESULT");
        return;
      }

      if (generationMode === "sample") {
        const manseResponse = await fetch("/api/manse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const manseData = await manseResponse.json();

        if (!manseResponse.ok) {
          setError(manseData.error ?? "만세력 결과를 만들지 못했습니다.");
          setUiState(publication.book.portrait ? "EDIT" : "WELCOME");
          return;
        }

        await new Promise((resolve) => {
          window.setTimeout(resolve, 700);
        });

        setPublication((current) => ({
          ...current,
          manseInput: payload,
          book: {
            ...current.book,
            metadata: {
              ...current.book.metadata,
              title: samplePortraitBook.title,
              sourceName: "Sample Portrait Fixture",
              author: payload.name ?? current.book.metadata.author,
            },
            portrait: samplePortraitBook,
          },
          debugData: {
            ...current.debugData,
            canonicalManseInput: payload,
            blindCompiler: manseData.blindCompiler,
            futureCompiler: manseData.futureCompiler,
            decisionCompiler: manseData.decisionCompiler,
            readerReport: manseData.readerReport,
            classicalAnalysis: sampleBlindAnalysis,
            writerRuntime: {
              mode: "sample",
              source: "src/lib/blueprint/fixtures/samplePortraitBook.ts",
            },
          },
          manuscriptSource: "Sample",
        }));
        setUiState("PUBLISHED");
        return;
      }

      console.info("[Blueprint]\nCalling /api/blueprint...");

      const response = await fetch("/api/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "책을 만들지 못했습니다.");
        setUiState(publication.book.portrait ? "EDIT" : "WELCOME");
        return;
      }

      setPublication(data as BlueprintPublicationState);
      setUiState("PUBLISHED");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : workspaceMode === "analysis" ? "분석 결과를 만들지 못했습니다." : "책을 만들지 못했습니다.");
      setUiState(workspaceMode === "analysis" ? "WELCOME" : publication.book.portrait ? "EDIT" : "WELCOME");
    }
  }

  const inputForm = (
    <RepublishForm
      birthDate={birthDate}
      birthTime={birthTime}
      calendarType={calendarType}
      cityName={cityName}
      error={error}
      experience={selectedExperience}
      formRef={formRef}
      generationMode={generationMode}
      gender={gender}
      isLeapMonth={isLeapMonth}
      isPublishing={isPublishing}
      name={name}
      onBirthDateChange={setBirthDate}
      onBirthTimeChange={setBirthTime}
      onCalendarTypeChange={setCalendarType}
      onCityNameChange={setCityName}
      onGenderChange={setGender}
      onGenerationModeChange={setGenerationMode}
      onIsLeapMonthChange={setIsLeapMonth}
      onNameChange={setName}
      onSubmit={handleSubmit}
      onTimeUnknownChange={setTimeUnknown}
      onUseLocalMeanTimeChange={setUseLocalMeanTime}
      timeUnknown={timeUnknown}
      useLocalMeanTime={useLocalMeanTime}
      workspaceMode={workspaceMode}
    />
  );

  if (uiState === "EXPERIENCE") {
    return (
      <ExperienceSelectionView
        experiences={BLUEPRINT_EXPERIENCES}
        onContinue={() => {
          setWorkspaceMode("legacy");
          setUiState("WELCOME");
        }}
        onSelect={(experience) => setExperienceId(experience.id)}
        selectedExperienceId={experienceId}
      />
    );
  }

  if (uiState === "WELCOME" || uiState === "EDIT") {
    return (
      <main className={`min-h-screen px-4 py-8 sm:px-6 lg:px-8 ${selectedExperience.theme.appBg} ${selectedExperience.theme.stageBg}`}>
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[520px] items-center justify-center">
          <div className="w-full">
            <WorkspaceToggle experience={selectedExperience} workspace={workspace} />
            {workspace === "developer" && workspaceMode === "analysis" ? (
              <button
                className={`mb-4 rounded-full px-4 py-2 text-sm font-black transition ${selectedExperience.theme.secondaryButton}`}
                onClick={() => {
                  setWorkspaceMode("legacy");
                  setUiState("EXPERIENCE");
                }}
                type="button"
              >
                Legacy Book Mode
              </button>
            ) : null}
            {workspaceMode === "legacy" && uiState === "WELCOME" ? (
              <button
                className={`mb-4 rounded-full px-4 py-2 text-sm font-black transition ${selectedExperience.theme.secondaryButton}`}
                onClick={() => setUiState("EXPERIENCE")}
                type="button"
              >
                Experience 다시 선택
              </button>
            ) : null}
            {uiState === "EDIT" ? (
              <button
                className={`mb-4 rounded-full px-4 py-2 text-sm font-black transition ${selectedExperience.theme.secondaryButton}`}
                onClick={() => setUiState(workspaceMode === "analysis" ? "RESULT" : publication.book.portrait ? "PUBLISHED" : "WELCOME")}
                type="button"
              >
                {workspaceMode === "analysis" ? "결과로 돌아가기" : "표지로 돌아가기"}
              </button>
            ) : null}
            {inputForm}
          </div>
        </div>
      </main>
    );
  }

  if (uiState === "ANALYZING" || uiState === "RESULT") {
    return (
      <main className={`min-h-screen px-4 py-8 sm:px-6 lg:px-8 ${selectedExperience.theme.appBg} ${selectedExperience.theme.stageBg}`}>
        {uiState === "ANALYZING" ? (
          <AnalysisLoadingView experience={selectedExperience} />
        ) : workspace === "service" ? (
          <ServiceResultPage
            debugData={publication.debugData}
            experience={selectedExperience}
            onEditInput={() => setUiState("EDIT")}
            workspace={workspace}
          />
        ) : (
          <AnalysisResultPage
            debugData={publication.debugData}
            experience={selectedExperience}
            onEditInput={() => setUiState("EDIT")}
            onSelectTab={setResultTab}
            selectedTab={resultTab}
            workspace={workspace}
          />
        )}
      </main>
    );
  }

  return (
    <main className={`min-h-screen ${selectedExperience.theme.appBg} ${selectedExperience.theme.stageBg}`}>
      <BlueprintReader
        appendix={publication.appendix}
        book={publication.book}
        debugData={publication.debugData}
        experience={selectedExperience}
        manuscriptSource={publication.manuscriptSource}
        mode={uiState === "PUBLISHING" ? "publishing" : uiState === "PUBLISHED" ? "published" : "reading"}
        onCloseBook={() => setUiState("PUBLISHED")}
        onCreateBook={() => setUiState("EDIT")}
        onEditInput={() => setUiState("EDIT")}
        onReadBook={() => setUiState("READING")}
      />
    </main>
  );
}

function ExperienceSelectionView({
  experiences,
  onContinue,
  onSelect,
  selectedExperienceId,
}: {
  experiences: BlueprintExperience[];
  onContinue: () => void;
  onSelect: (experience: BlueprintExperience) => void;
  selectedExperienceId: string;
}) {
  return (
    <main className="min-h-screen bg-[#050402] px-4 py-8 text-[#f7d487] sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col justify-center">
        <div className="grid gap-8 lg:grid-cols-[minmax(280px,420px)_1fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-[#d8a64f]">Blueprint Publishing Experience</p>
            <h1 className="mt-5 text-balance text-5xl font-black leading-tight text-[#f6c46b] sm:text-6xl">
              출판식을 먼저 선택합니다.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-9 text-[#d8c4a0]">
              Blueprint는 입력 화면에서 시작하지 않습니다. 어떤 방식으로 한 사람의 책을 출판할지 먼저 고릅니다.
            </p>
            <div className="mt-10 rounded-[16px] border border-[#8c652c]/60 bg-[#0d0905]/80 p-5 shadow-[0_24px_90px_rgba(214,166,79,0.16)]">
              <div className="relative h-40 overflow-hidden rounded-[12px] border border-[#b98534]/50 bg-[radial-gradient(circle_at_50%_85%,rgba(246,196,107,0.42),transparent_30%),linear-gradient(180deg,#0b0804,#1a1008)]">
                <div className="absolute bottom-8 left-1/2 h-16 w-64 -translate-x-1/2 rounded-[18px] border border-[#f6c46b]/45 bg-[#f6c46b]/10 shadow-[0_0_42px_rgba(246,196,107,0.42)]" />
                <div className="absolute bottom-16 left-1/2 h-px w-72 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#f6c46b] to-transparent" />
                <div className="absolute left-1/2 top-12 -translate-x-1/2 text-3xl">✦</div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#b99b66]">
                Loading, Animation, Cover, Reader, Typography, Color, Illustration이 모두 Experience를 따라갑니다.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {experiences.map((experience) => {
              const selected = selectedExperienceId === experience.id;

              return (
                <button
                  className={`rounded-[14px] border p-5 text-left transition active:scale-[0.99] ${
                    selected ? "border-[#f6c46b] bg-[#f6c46b]/12" : "border-[#6f4d20]/70 bg-[#0b0805]/78 hover:border-[#f6c46b]/70"
                  }`}
                  key={experience.id}
                  onClick={() => {
                    onSelect(experience);
                    onContinue();
                  }}
                  type="button"
                >
                  <div className={`h-36 rounded-[10px] border ${experience.theme.cover} p-4`}>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-75">{experience.label}</p>
                    <h2 className="mt-5 text-2xl font-black leading-tight">{experience.name}</h2>
                    <p className="mt-3 text-xs leading-5 opacity-75">{experience.preview}</p>
                  </div>
                  <h3 className="mt-4 text-xl font-black text-[#f7d487]">{experience.name}</h3>
                  <p className="mt-2 text-sm font-bold text-[#f6c46b]">{experience.tagline}</p>
                  <p className="mt-3 text-sm leading-6 text-[#bba170]">{experience.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {experience.steps.map((step, index) => (
                      <span className="rounded-full border border-[#8c652c]/70 px-3 py-1 text-[11px] font-black text-[#d8a64f]" key={step}>
                        {String(index + 1).padStart(2, "0")} {step}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function WorkspaceToggle({ experience, workspace }: { experience: BlueprintExperience; workspace: WorkspaceKind }) {
  return (
    <nav className={`mb-4 flex gap-2 rounded-[8px] border p-1 ${experience.theme.subtleSurface}`}>
      {[
        { href: "/service", id: "service", label: "Service Workspace" },
        { href: "/developer", id: "developer", label: "Developer Workspace" },
      ].map((item) => (
        <Link
          className={`flex-1 rounded-[6px] px-3 py-2 text-center text-xs font-black transition ${
            workspace === item.id ? experience.theme.primaryButton : experience.theme.secondaryButton
          }`}
          href={item.href}
          key={item.id}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asRecord(value: unknown) {
  return isRecord(value) ? value : {};
}

function asRecordArray(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function displayValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `${value.length} items`;
  if (isRecord(value)) return `${Object.keys(value).length} fields`;
  return "-";
}

function AnalysisLoadingView({ experience }: { experience: BlueprintExperience }) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center justify-center">
      <div className={`w-full rounded-[14px] border p-8 text-center ${experience.theme.surface}`}>
        <p className={`text-xs font-black uppercase tracking-[0.26em] ${experience.theme.accentText}`}>Blueprint Analysis</p>
        <h1 className={`mt-4 text-3xl font-black ${experience.theme.text}`}>분석하고 있습니다.</h1>
        <div className="mx-auto mt-8 h-2 max-w-md overflow-hidden rounded-full border border-current/20">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-[#d6a64f]" />
        </div>
        <div className={`mt-8 grid gap-3 text-sm font-bold ${experience.theme.mutedText}`}>
          <p>만세력 결과를 정리하고 있습니다.</p>
          <p>Blind Compiler를 구성하고 있습니다.</p>
          <p>Future와 Decision 신호를 계산하고 있습니다.</p>
        </div>
      </div>
    </section>
  );
}

function AnalysisResultPage({
  debugData,
  experience,
  onEditInput,
  onSelectTab,
  selectedTab,
  workspace,
}: {
  debugData: BlueprintDebugData;
  experience: BlueprintExperience;
  onEditInput: () => void;
  onSelectTab: (tab: ResultTab) => void;
  selectedTab: ResultTab;
  workspace: WorkspaceKind;
}) {
  const tabs: Array<{ id: ResultTab; label: string }> = [
    { id: "summary", label: "Summary" },
    { id: "blind", label: "Blind" },
    { id: "future", label: "Future" },
    { id: "decision", label: "Decision" },
    { id: "evidence", label: "Evidence" },
    { id: "json", label: "JSON" },
    { id: "rawData", label: "Raw Data" },
    { id: "prompt", label: "Prompt" },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl">
      <WorkspaceToggle experience={experience} workspace={workspace} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.26em] ${experience.theme.accentText}`}>Developer Workspace</p>
          <h1 className={`mt-3 text-3xl font-black sm:text-4xl ${experience.theme.text}`}>분석 결과</h1>
          <p className={`mt-2 text-sm font-bold ${experience.theme.mutedText}`}>Summary, Blind, Future, Decision, Evidence, JSON, Prompt를 모두 유지합니다.</p>
        </div>
        <button className={`h-10 rounded-[4px] px-4 text-sm font-black ${experience.theme.secondaryButton}`} onClick={onEditInput} type="button">
          입력 수정
        </button>
      </div>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            className={`h-10 shrink-0 rounded-[4px] border px-4 text-sm font-black transition ${
              selectedTab === tab.id ? experience.theme.primaryButton : experience.theme.secondaryButton
            }`}
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {selectedTab === "summary" ? <SummaryTab experience={experience} readerReport={debugData.readerReport} /> : null}
        {selectedTab === "blind" ? <CompilerCards data={debugData.blindCompiler} experience={experience} title="Blind Compiler" /> : null}
        {selectedTab === "future" ? <CompilerCards data={debugData.futureCompiler} experience={experience} title="Future Compiler" /> : null}
        {selectedTab === "decision" ? <DecisionTab data={debugData.decisionCompiler} experience={experience} /> : null}
        {selectedTab === "evidence" ? <EvidenceTab debugData={debugData} experience={experience} /> : null}
        {selectedTab === "json" ? <DeveloperTab debugData={debugData} experience={experience} /> : null}
        {selectedTab === "rawData" ? <RawDataTab debugData={debugData} experience={experience} /> : null}
        {selectedTab === "prompt" ? <PromptTab experience={experience} /> : null}
      </div>
    </section>
  );
}

function ServiceResultPage({
  debugData,
  experience,
  onEditInput,
  workspace,
}: {
  debugData: BlueprintDebugData;
  experience: BlueprintExperience;
  onEditInput: () => void;
  workspace: WorkspaceKind;
}) {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <WorkspaceToggle experience={experience} workspace={workspace} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.26em] ${experience.theme.accentText}`}>Service Workspace</p>
          <h1 className={`mt-3 text-3xl font-black sm:text-4xl ${experience.theme.text}`}>Decision Report</h1>
          <p className={`mt-2 text-sm font-bold ${experience.theme.mutedText}`}>핵심 영역과 시기를 빠르게 읽는 상품 화면입니다.</p>
        </div>
        <button className={`h-10 rounded-[4px] px-4 text-sm font-black ${experience.theme.secondaryButton}`} onClick={onEditInput} type="button">
          다시 분석하기
        </button>
      </div>
      <div className="mt-6">
        <ServiceReport experience={experience} readerReport={debugData.readerReport} />
      </div>
    </section>
  );
}

function SummaryTab({ experience, readerReport }: { experience: BlueprintExperience; readerReport?: unknown }) {
  const report = asRecord(readerReport);
  const topOpportunities = asRecordArray(report.topOpportunities);
  const highRiskOpportunities = asRecordArray(report.highRiskOpportunities);
  const topRisks = asRecordArray(report.topRisks);
  const monthHighlights = asStringArray(report.condensedMonthHighlights).slice(0, 5);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <section className={`rounded-[12px] border p-6 ${experience.theme.surface}`}>
        <p className={`text-xs font-black uppercase tracking-[0.24em] ${experience.theme.accentText}`}>Headline</p>
        <h2 className={`mt-4 text-2xl font-black leading-snug ${experience.theme.text}`}>{String(report.headline ?? "분석 결과가 준비되었습니다.")}</h2>
      </section>

      <SummaryListCard experience={experience} items={topOpportunities} scoreKey="opportunityScore" title="Top Opportunities" />
      {highRiskOpportunities.length > 0 ? <SummaryListCard experience={experience} items={highRiskOpportunities} scoreKey="opportunityScore" title="High-Risk Opportunities" /> : null}
      <SummaryListCard experience={experience} items={topRisks} scoreKey="riskScore" title="Top Risks" />

      <section className={`rounded-[12px] border p-6 lg:col-span-2 ${experience.theme.surface}`}>
        <p className={`text-xs font-black uppercase tracking-[0.24em] ${experience.theme.accentText}`}>월별 요약</p>
        <div className={`mt-4 grid gap-2 text-sm font-bold ${experience.theme.mutedText}`}>
          {monthHighlights.map((line) => <p key={line}>{line}</p>)}
          {monthHighlights.length === 0 ? <p>표시할 월별 요약이 없습니다.</p> : null}
        </div>
      </section>
    </div>
  );
}

function ServiceReport({ experience, readerReport }: { experience: BlueprintExperience; readerReport?: unknown }) {
  const report = asRecord(readerReport);
  const topOpportunities = asRecordArray(report.topOpportunities);
  const topRisks = asRecordArray(report.topRisks);
  const domainReports = asRecordArray(report.domainReports);
  const serviceDomainReports = asRecordArray(report.serviceDomainReports);
  const timingSummary = asRecord(report.serviceTimingSummary);
  const visibleServiceReports = keyCardReports(topOpportunities, topRisks, serviceDomainReports);
  const hiddenServiceReports = serviceDomainReports.filter((item) => !visibleServiceReports.some((visible) => visible.domain === item.domain));
  const monthlyStrategy = asRecordArray(report.serviceMonthlyStrategy);
  const activeTiming = monthsFromSummary(timingSummary.primaryActiveMonths, monthlyStrategy);
  const mixedTiming = monthsFromSummary(timingSummary.primaryMixedMonths, monthlyStrategy);
  const cautionTiming = monthsFromSummary(timingSummary.primaryCautionMonths, monthlyStrategy);
  const whyReports = whyReportsFor(visibleServiceReports, serviceDomainReports);
  const finalSummary = asStringArray(report.overallSummary).slice(0, 3);
  const disclaimer = asStringArray(report.cautionNotes);

  return (
    <div className="space-y-5">
      <ServiceSection experience={experience} index="01" title="Executive Summary">
        <h2 className={`text-2xl font-black leading-snug ${experience.theme.text}`}>{String(report.headline ?? "분석 결과가 준비되었습니다.")}</h2>
        <div className={`mt-4 grid gap-2 text-sm font-bold ${experience.theme.mutedText}`}>
          {finalSummary.map((line) => <p key={line}>{line}</p>)}
        </div>
      </ServiceSection>

      <ServiceSection experience={experience} index="02" title="Key Cards">
        <div className="grid gap-3 md:grid-cols-2">
          {visibleServiceReports.map((item) => <ServiceDomainCard experience={experience} item={item} key={String(item.domain)} />)}
        </div>
      </ServiceSection>

      <ServiceSection experience={experience} index="03" title="Year Strategy">
        <p className={`text-lg font-black leading-8 ${experience.theme.text}`}>{yearStrategyLine(visibleServiceReports, timingSummary)}</p>
      </ServiceSection>

      <ServiceSection experience={experience} index="04" title="Core Timing">
        <div className="grid gap-4 md:grid-cols-3">
          <TimingStrategyList experience={experience} items={activeTiming} title="활용하기 좋은 달" />
          <TimingStrategyList experience={experience} items={mixedTiming} title="변화와 점검이 함께 있는 달" />
          <TimingStrategyList experience={experience} items={cautionTiming} title="점검이 필요한 달" />
        </div>
      </ServiceSection>

      <ServiceSection experience={experience} index="05" title="Why These Results">
        <div className="grid gap-3 md:grid-cols-2">
          {whyReports.map((item) => (
            <WhyCard
              domainReport={domainReports.find((domain) => domain.domain === item.domain)}
              experience={experience}
              item={item}
              key={String(item.domain)}
              timingSummary={timingSummary}
            />
          ))}
        </div>
      </ServiceSection>

      <ServiceSection experience={experience} index="06" title="More Details">
        <details className={`rounded-[8px] border p-4 ${experience.theme.subtleSurface}`}>
          <summary className={`cursor-pointer text-sm font-black ${experience.theme.text}`}>전체 영역과 12개월 자세히 보기</summary>
          <div className="mt-5">
            <p className={`text-sm font-black ${experience.theme.text}`}>전체 영역 카드</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {hiddenServiceReports.map((item) => <ServiceDomainCard experience={experience} item={item} key={String(item.domain)} />)}
            </div>
          </div>
          <div className="mt-6">
            <p className={`text-sm font-black ${experience.theme.text}`}>전체 12개월</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {monthlyStrategy.map((item) => <MonthlyStrategyCard experience={experience} item={item} key={String(item.month)} />)}
            </div>
          </div>
          <div className="mt-6">
            <p className={`text-sm font-black ${experience.theme.text}`}>상세 근거 문장</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {visibleServiceReports.map((item) => <WhyCard domainReport={domainReports.find((domain) => domain.domain === item.domain)} experience={experience} item={item} key={String(item.domain)} timingSummary={timingSummary} />)}
            </div>
          </div>
          <Link className={`mt-5 inline-flex h-10 items-center rounded-[4px] px-4 text-sm font-black ${experience.theme.secondaryButton}`} href="/developer">
            Developer Workspace로 이동
          </Link>
        </details>
      </ServiceSection>

      <ServiceSection experience={experience} index="07" title="Disclaimer">
        <div className={`grid gap-2 rounded-[8px] border p-4 text-xs font-bold leading-5 ${experience.theme.mutedText} ${experience.theme.subtleSurface}`}>
          {disclaimer.map((line) => <p key={line}>{line}</p>)}
        </div>
        <div className={`mt-5 text-sm font-black leading-6 ${experience.theme.text}`}>
          <p>{finalNoteLine(visibleServiceReports, timingSummary)}</p>
        </div>
      </ServiceSection>
    </div>
  );
}

function keyCardReports(topOpportunities: Record<string, unknown>[], topRisks: Record<string, unknown>[], serviceDomainReports: Record<string, unknown>[]) {
  const priorityReports = uniqueRecordsByDomain([
    ...domainReportsFor(topOpportunities, serviceDomainReports).slice(0, 3),
    ...domainReportsFor(topRisks, serviceDomainReports).slice(0, 2),
  ]);
  const hasWealthOrCareer = priorityReports.some((item) => item.domain === "wealth" || item.domain === "career");
  const wealthOrCareer = ["wealth", "career"]
    .map((domain) => serviceDomainReports.find((item) => item.domain === domain))
    .filter((item): item is Record<string, unknown> => Boolean(item));

  return uniqueRecordsByDomain([...priorityReports, ...(hasWealthOrCareer ? [] : wealthOrCareer)]).slice(0, 6);
}

function monthsFromSummary(months: unknown, monthlyStrategy: Record<string, unknown>[]) {
  const monthNumbers = Array.isArray(months) ? months.filter((month): month is number => typeof month === "number") : [];
  return monthNumbers
    .map((month) => monthlyStrategy.find((item) => item.month === month))
    .filter((item): item is Record<string, unknown> => Boolean(item));
}

function whyReportsFor(visibleReports: Record<string, unknown>[], serviceDomainReports: Record<string, unknown>[]) {
  const good = visibleReports.filter((item) => item.serviceLevel === "GOOD").slice(0, 2);
  const caution = visibleReports.find((item) => item.serviceLevel === "CAUTION") ?? serviceDomainReports.find((item) => item.serviceLevel === "CAUTION");
  return uniqueRecordsByDomain([...good, ...(caution ? [caution] : [])]).slice(0, 3);
}

function yearStrategyLine(visibleReports: Record<string, unknown>[], timingSummary: Record<string, unknown>) {
  const goodNames = visibleReports.filter((item) => item.serviceLevel === "GOOD").slice(0, 3).map((item) => String(item.title));
  const cautionNames = visibleReports.filter((item) => item.serviceLevel === "CAUTION").slice(0, 2).map((item) => String(item.title));
  const active = String(timingSummary.activeLabel ?? "");

  if (goodNames.length > 0 && cautionNames.length > 0 && active) {
    return `올해 전략은 ${goodNames.join("·")} 쪽의 활용 신호와 ${cautionNames.join("·")} 관리 신호를 분리해서 읽는 것입니다. ${active} 전후에는 강한 영역을 확인하고, 부담이 큰 달에는 속도보다 조건을 보는 흐름입니다.`;
  }
  if (goodNames.length > 0) return `올해 전략은 ${goodNames.join("·")} 쪽의 활용 신호를 중심에 두고, 월별 변동성을 함께 확인하는 것입니다.`;
  return "올해 전략은 한 영역으로 단정하기보다 핵심 월과 점검 월을 나누어 읽는 것입니다.";
}

function finalNoteLine(visibleReports: Record<string, unknown>[], timingSummary: Record<string, unknown>) {
  const goodNames = visibleReports.filter((item) => item.serviceLevel === "GOOD").slice(0, 3).map((item) => String(item.title));
  const cautionNames = visibleReports.filter((item) => item.serviceLevel === "CAUTION").slice(0, 2).map((item) => String(item.title));
  const active = String(timingSummary.activeLabel ?? "");
  const caution = String(timingSummary.cautionLabel ?? "");

  return `Final Note: 올해는 ${goodNames.join("·") || "강한 영역"}의 활용 신호와 ${cautionNames.join("·") || "점검 영역"}의 관리 신호를 함께 보는 해입니다. ${active || "좋은 시기"}와 ${caution || "점검 시기"}를 분리해서 읽는 것이 이 리포트의 핵심입니다.`;
}

function uniqueRecordsByDomain(items: Record<string, unknown>[]) {
  const seen = new Set<unknown>();
  return items.filter((item) => {
    if (seen.has(item.domain)) return false;
    seen.add(item.domain);
    return true;
  });
}

function domainReportsFor(summaries: Record<string, unknown>[], serviceDomainReports: Record<string, unknown>[]) {
  return summaries
    .map((summary) => serviceDomainReports.find((item) => item.domain === summary.domain))
    .filter((item): item is Record<string, unknown> => Boolean(item));
}

function ServiceSection({ children, experience, index, title }: { children: ReactNode; experience: BlueprintExperience; index: string; title: string }) {
  return (
    <section className={`rounded-[12px] border p-6 ${experience.theme.surface}`}>
      <div className="mb-5 flex items-center gap-3">
        <span className={`text-xs font-black uppercase tracking-[0.24em] ${experience.theme.accentText}`}>{index}</span>
        <h2 className={`text-xl font-black ${experience.theme.text}`}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ServiceDomainCard({ experience, item }: { experience: BlueprintExperience; item: Record<string, unknown> }) {
  return (
    <article className={`rounded-[8px] border p-4 ${experience.theme.subtleSurface}`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`font-black ${experience.theme.text}`}>{String(item.title ?? item.domain ?? "-")}</p>
        <p className={`text-xs font-black ${experience.theme.accentText}`}>{String(item.label ?? "보통")} {starsText(item.stars)}</p>
      </div>
      <p className={`mt-3 text-sm font-bold leading-6 ${experience.theme.mutedText}`}>{String(item.shortSummary ?? "")}</p>
    </article>
  );
}

function starsText(value: unknown) {
  const stars = typeof value === "number" ? Math.max(1, Math.min(5, value)) : 3;
  return `${"★".repeat(stars)}${"☆".repeat(5 - stars)}`;
}

function WhyCard({
  domainReport,
  experience,
  item,
  timingSummary,
}: {
  domainReport?: Record<string, unknown>;
  experience: BlueprintExperience;
  item: Record<string, unknown>;
  timingSummary: Record<string, unknown>;
}) {
  const bullets = uniqueStrings([...asStringArray(item.positiveMeanings), ...asStringArray(item.cautionMeanings)]).slice(0, 2);
  const timingLine = whyTimingLine(domainReport, timingSummary);

  return (
    <article className={`rounded-[8px] border p-4 ${experience.theme.subtleSurface}`}>
      <p className={`font-black ${experience.theme.text}`}>{String(item.title ?? item.domain ?? "-")}</p>
      <div className={`mt-3 grid gap-2 text-sm font-bold leading-6 ${experience.theme.mutedText}`}>
        {bullets.map((line) => <p key={line}>{line}</p>)}
        {timingLine ? <p>{timingLine}</p> : null}
      </div>
    </article>
  );
}

function whyTimingLine(domainReport: Record<string, unknown> | undefined, timingSummary: Record<string, unknown>) {
  if (!domainReport) return "";
  const activeMonths = asNumberArray(domainReport.bestMonths).filter((month) => asNumberArray(timingSummary.primaryActiveMonths).includes(month));
  const mixedMonths = asNumberArray(domainReport.bestMonths).filter((month) => asNumberArray(timingSummary.primaryMixedMonths).includes(month));
  const cautionMonths = asNumberArray(domainReport.cautionMonths).filter((month) => asNumberArray(timingSummary.primaryCautionMonths).includes(month));
  const parts: string[] = [];

  if (activeMonths.length > 0) parts.push(`${monthLabel(activeMonths)}에는 활용 신호가 있습니다`);
  if (mixedMonths.length > 0) parts.push(`${monthLabel(mixedMonths)}에는 변화 검토 신호가 있습니다`);
  if (cautionMonths.length > 0) parts.push(`${compactMonthLabel(cautionMonths)}에는 점검 신호가 함께 나타납니다`);

  return parts.length > 0 ? `${parts.join(", ")}.` : "";
}

function asNumberArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is number => typeof item === "number") : [];
}

function monthLabel(months: number[]) {
  return months.map((month) => `${month}월`).join(", ");
}

function compactMonthLabel(months: number[]) {
  return months.map((month) => `${month}월`).join("·");
}

function TimingStrategyList({ experience, items, title }: { experience: BlueprintExperience; items: Record<string, unknown>[]; title: string }) {
  return (
    <article className={`rounded-[8px] border p-4 ${experience.theme.subtleSurface}`}>
      <p className={`font-black ${experience.theme.text}`}>{title}</p>
      <div className={`mt-3 grid gap-2 text-sm font-bold ${experience.theme.mutedText}`}>
        {items.map((item) => <p key={String(item.month)}>{String(item.month)}월 · {String(item.title)} — {String(item.summary)}</p>)}
        {items.length === 0 ? <p>표시할 시기 신호가 없습니다.</p> : null}
      </div>
    </article>
  );
}

function MonthlyStrategyCard({ experience, item }: { experience: BlueprintExperience; item: Record<string, unknown> }) {
  const goodFor = asStringArray(item.goodFor);
  const watchFor = asStringArray(item.watchFor);

  return (
    <article className={`rounded-[8px] border p-4 ${experience.theme.subtleSurface}`}>
      <p className={`text-xs font-black uppercase tracking-[0.18em] ${experience.theme.accentText}`}>{String(item.month)}월</p>
      <h3 className={`mt-2 text-lg font-black ${experience.theme.text}`}>{String(item.title ?? "")}</h3>
      <p className={`mt-3 text-sm font-bold leading-6 ${experience.theme.mutedText}`}>{String(item.summary ?? "")}</p>
      <div className={`mt-3 grid gap-1 text-xs font-black ${experience.theme.mutedText}`}>
        {goodFor.length > 0 ? <p>활용: {compactServiceList(goodFor)}</p> : null}
        {watchFor.length > 0 ? <p>점검: {compactServiceList(watchFor)}</p> : null}
      </div>
    </article>
  );
}

function compactServiceList(values: string[]) {
  if (values.length >= 10) return "여러 영역";
  if (values.length > 5) return `${values.slice(0, 3).join(", ")} 등 여러 영역`;
  return values.join(", ");
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function SummaryListCard({
  experience,
  items,
  scoreKey,
  title,
}: {
  experience: BlueprintExperience;
  items: Record<string, unknown>[];
  scoreKey: "opportunityScore" | "riskScore";
  title: string;
}) {
  return (
    <section className={`rounded-[12px] border p-6 ${experience.theme.surface}`}>
      <p className={`text-xs font-black uppercase tracking-[0.24em] ${experience.theme.accentText}`}>{title}</p>
      <div className="mt-4 space-y-3">
        {items.slice(0, 5).map((item) => (
          <div className={`rounded-[8px] border px-4 py-3 ${experience.theme.subtleSurface}`} key={String(item.domain)}>
            <div className="flex items-center justify-between gap-3">
              <p className={`text-sm font-black ${experience.theme.text}`}>{String(item.title ?? item.domain ?? "-")}</p>
              <p className={`text-sm font-black ${experience.theme.accentText}`}>{String(item[scoreKey] ?? "-")}</p>
            </div>
            <p className={`mt-1 text-xs font-bold ${experience.theme.mutedText}`}>{String(item.readerStatus ?? "")}</p>
          </div>
        ))}
        {items.length === 0 ? <p className={`text-sm font-bold ${experience.theme.mutedText}`}>표시할 항목이 없습니다.</p> : null}
      </div>
    </section>
  );
}

function CompilerCards({ data, experience, title }: { data?: unknown; experience: BlueprintExperience; title: string }) {
  const record = asRecord(data);
  const entries = Object.entries(record).filter(([key]) => !["generatedAt", "version", "source"].includes(key));

  return (
    <section>
      <h2 className={`text-2xl font-black ${experience.theme.text}`}>{title}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {entries.map(([key, value]) => <DataCard experience={experience} key={key} title={key} value={value} />)}
        {entries.length === 0 ? <p className={`text-sm font-bold ${experience.theme.mutedText}`}>표시할 데이터가 없습니다.</p> : null}
      </div>
    </section>
  );
}

function DataCard({ experience, title, value }: { experience: BlueprintExperience; title: string; value: unknown }) {
  const rows = isRecord(value) ? Object.entries(value).slice(0, 8) : [];
  const list = Array.isArray(value) ? value.slice(0, 8) : [];

  return (
    <article className={`rounded-[12px] border p-5 ${experience.theme.surface}`}>
      <p className={`text-xs font-black uppercase tracking-[0.18em] ${experience.theme.accentText}`}>{title}</p>
      {rows.length > 0 ? (
        <div className={`mt-4 space-y-2 text-sm font-bold ${experience.theme.mutedText}`}>
          {rows.map(([key, item]) => (
            <div className="flex justify-between gap-4" key={key}>
              <span>{key}</span>
              <span className="text-right">{displayValue(item)}</span>
            </div>
          ))}
        </div>
      ) : null}
      {list.length > 0 ? (
        <div className={`mt-4 flex flex-wrap gap-2 text-xs font-black ${experience.theme.mutedText}`}>
          {list.map((item, index) => (
            <span className={`rounded-full border px-3 py-1 ${experience.theme.subtleSurface}`} key={`${title}-${index}`}>
              {displayValue(item)}
            </span>
          ))}
        </div>
      ) : null}
      {rows.length === 0 && list.length === 0 ? <p className={`mt-4 text-sm font-bold ${experience.theme.mutedText}`}>{displayValue(value)}</p> : null}
    </article>
  );
}

function DecisionTab({ data, experience }: { data?: unknown; experience: BlueprintExperience }) {
  const record = asRecord(data);
  const decisions = asRecordArray(record.domainDecisions);

  return (
    <section>
      <h2 className={`text-2xl font-black ${experience.theme.text}`}>Decision Compiler</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {decisions.map((item) => (
          <article className={`rounded-[12px] border p-5 ${experience.theme.surface}`} key={String(item.domain)}>
            <p className={`text-xs font-black uppercase tracking-[0.18em] ${experience.theme.accentText}`}>{String(item.domain)}</p>
            <h3 className={`mt-2 text-xl font-black ${experience.theme.text}`}>{String(item.readerStatus ?? "")}</h3>
            <div className={`mt-4 grid gap-2 text-sm font-bold ${experience.theme.mutedText}`}>
              <p>Opportunity: {String(item.opportunityScore ?? "-")} / {String(item.opportunityGrade ?? "-")}</p>
              <p>Risk: {String(item.riskScore ?? "-")} / {String(item.riskGrade ?? "-")}</p>
              <p>Direct Risk: {String(item.directRiskScore ?? "-")}</p>
              <p>Global Risk: {String(item.globalRiskScore ?? "-")}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function EvidenceTab({ debugData, experience }: { debugData: BlueprintDebugData; experience: BlueprintExperience }) {
  const decision = asRecord(debugData.decisionCompiler);
  const future = asRecord(debugData.futureCompiler);

  return (
    <section>
      <h2 className={`text-2xl font-black ${experience.theme.text}`}>Evidence</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <DataCard experience={experience} title="decisionEvidence" value={decision.decisionEvidence} />
        <DataCard experience={experience} title="decisionSummaryIndex" value={decision.decisionSummaryIndex} />
        <DataCard experience={experience} title="futureEvidence" value={future.futureEvidence} />
        <DataCard experience={experience} title="monthlyTimingIndex" value={future.monthlyTimingIndex} />
      </div>
    </section>
  );
}

function DeveloperTab({ debugData, experience }: { debugData: BlueprintDebugData; experience: BlueprintExperience }) {
  return (
    <section className={`rounded-[12px] border p-5 ${experience.theme.surface}`}>
      <p className={`text-xs font-black uppercase tracking-[0.24em] ${experience.theme.accentText}`}>Raw JSON</p>
      <pre className={`mt-4 max-h-[70vh] overflow-auto rounded-[8px] border p-4 text-xs leading-5 ${experience.theme.subtleSurface} ${experience.theme.mutedText}`}>
        {JSON.stringify({
          blindCompiler: debugData.blindCompiler,
          futureCompiler: debugData.futureCompiler,
          decisionCompiler: debugData.decisionCompiler,
          readerReport: debugData.readerReport,
        }, null, 2)}
      </pre>
    </section>
  );
}

function RawDataTab({ debugData, experience }: { debugData: BlueprintDebugData; experience: BlueprintExperience }) {
  return (
    <section className={`rounded-[12px] border p-5 ${experience.theme.surface}`}>
      <p className={`text-xs font-black uppercase tracking-[0.24em] ${experience.theme.accentText}`}>Raw Data</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <DataCard experience={experience} title="canonicalManseInput" value={debugData.canonicalManseInput} />
        <DataCard experience={experience} title="appendix" value={debugData.appendix} />
        <DataCard experience={experience} title="features" value={debugData.features} />
        <DataCard experience={experience} title="reasons" value={debugData.reasons} />
        <DataCard experience={experience} title="writerInput" value={debugData.writerInput} />
        <DataCard experience={experience} title="writerRuntime" value={debugData.writerRuntime} />
      </div>
    </section>
  );
}

function PromptTab({ experience }: { experience: BlueprintExperience }) {
  const promptItems = [
    "Engine1 Manse 계산",
    "Blind Compiler facts 생성",
    "Future Compiler facts 생성",
    "Decision Compiler scoring",
    "Template Reader report 생성",
    "Legacy Book Mode에서만 GPT Prompt 사용",
  ];

  return (
    <section className={`rounded-[12px] border p-6 ${experience.theme.surface}`}>
      <p className={`text-xs font-black uppercase tracking-[0.24em] ${experience.theme.accentText}`}>Prompt</p>
      <h2 className={`mt-3 text-2xl font-black ${experience.theme.text}`}>Runtime / Prompt Boundary</h2>
      <div className={`mt-5 grid gap-3 text-sm font-bold ${experience.theme.mutedText}`}>
        {promptItems.map((item) => (
          <p className={`rounded-[8px] border p-4 ${experience.theme.subtleSurface}`} key={item}>{item}</p>
        ))}
      </div>
    </section>
  );
}

function RepublishForm({
  birthDate,
  birthTime,
  calendarType,
  cityName,
  error,
  experience,
  formRef,
  generationMode,
  gender,
  isLeapMonth,
  isPublishing,
  name,
  onBirthDateChange,
  onBirthTimeChange,
  onCalendarTypeChange,
  onCityNameChange,
  onGenderChange,
  onGenerationModeChange,
  onIsLeapMonthChange,
  onNameChange,
  onSubmit,
  onTimeUnknownChange,
  onUseLocalMeanTimeChange,
  timeUnknown,
  useLocalMeanTime,
  workspaceMode,
}: {
  birthDate: string;
  birthTime: string;
  calendarType: CalendarType;
  cityName: string;
  error: string | null;
  experience: BlueprintExperience;
  formRef: RefObject<HTMLFormElement | null>;
  generationMode: GenerationMode;
  gender: Gender;
  isLeapMonth: boolean;
  isPublishing: boolean;
  name: string;
  onBirthDateChange: (value: string) => void;
  onBirthTimeChange: (value: string) => void;
  onCalendarTypeChange: (value: CalendarType) => void;
  onCityNameChange: (value: string) => void;
  onGenderChange: (value: Gender) => void;
  onGenerationModeChange: (value: GenerationMode) => void;
  onIsLeapMonthChange: (value: boolean) => void;
  onNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTimeUnknownChange: (value: boolean) => void;
  onUseLocalMeanTimeChange: (value: boolean) => void;
  timeUnknown: boolean;
  useLocalMeanTime: boolean;
  workspaceMode: WorkspaceMode;
}) {
  const inputTheme = experience.theme.input;

  return (
    <ExperienceInput experience={experience}>
      <div>
        <p className={`text-xs font-black uppercase tracking-[0.22em] ${experience.theme.accentText}`}>{experience.name}</p>
        <h2 className={`mt-2 text-lg font-black ${experience.theme.text}`}>
          {workspaceMode === "analysis" ? "Blueprint Analysis" : "Blueprint Input"}
        </h2>
        <p className={`mt-2 text-xs leading-5 ${experience.theme.mutedText}`}>
          {workspaceMode === "analysis"
            ? "생년월일과 출생시간을 기준으로 Summary, Blind, Future, Decision을 분석합니다."
            : "생년월일과 출생시간을 기준으로 Portrait Book을 생성합니다."}
        </p>
      </div>
      <form className="mt-5 space-y-3" onSubmit={onSubmit} ref={formRef}>
        <label className={`block text-xs font-black ${inputTheme.label}`}>
          이름
          <input className={inputTheme.field} onChange={(event) => onNameChange(event.target.value)} value={name} />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <button
            className={`h-10 rounded-[4px] border text-xs font-black ${
              gender === "male" ? inputTheme.toggleActive : inputTheme.toggleInactive
            }`}
            onClick={() => onGenderChange("male")}
            type="button"
          >
            남성
          </button>
          <button
            className={`h-10 rounded-[4px] border text-xs font-black ${
              gender === "female" ? inputTheme.toggleActive : inputTheme.toggleInactive
            }`}
            onClick={() => onGenderChange("female")}
            type="button"
          >
            여성
          </button>
        </div>

        <label className={`block text-xs font-black ${inputTheme.label}`}>
          생년월일
          <input
            className={inputTheme.field}
            onChange={(event) => onBirthDateChange(event.target.value)}
            type="date"
            value={birthDate}
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className={`block text-xs font-black ${inputTheme.label}`}>
            양력/음력
            <select
              className={inputTheme.field}
              onChange={(event) => onCalendarTypeChange(event.target.value as CalendarType)}
              value={calendarType}
            >
              <option value="solar">양력</option>
              <option value="lunar">음력</option>
            </select>
          </label>
          <label className={`mt-5 flex h-10 items-center gap-2 rounded-[4px] border px-3 text-xs font-black ${inputTheme.checkbox}`}>
            <input checked={isLeapMonth} onChange={(event) => onIsLeapMonthChange(event.target.checked)} type="checkbox" />
            윤달
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className={`block text-xs font-black ${inputTheme.label}`}>
            출생시간
            <input
              className={inputTheme.field}
              disabled={timeUnknown}
              onChange={(event) => onBirthTimeChange(event.target.value)}
              type="time"
              value={birthTime}
            />
          </label>
          <label className={`mt-5 flex h-10 items-center gap-2 rounded-[4px] border px-3 text-xs font-black ${inputTheme.checkbox}`}>
            <input checked={timeUnknown} onChange={(event) => onTimeUnknownChange(event.target.checked)} type="checkbox" />
            시간 모름
          </label>
        </div>

        <label className={`block text-xs font-black ${inputTheme.label}`}>
          출생지
          <select className={inputTheme.field} onChange={(event) => onCityNameChange(event.target.value)} value={cityName}>
            {CITY_OPTIONS.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </label>

        <label className={`flex items-center gap-2 rounded-[4px] border px-3 py-2 text-xs font-black ${inputTheme.checkbox}`}>
          <input checked={useLocalMeanTime} onChange={(event) => onUseLocalMeanTimeChange(event.target.checked)} type="checkbox" />
          지역시 보정 사용
        </label>

        {workspaceMode === "legacy" ? (
          <fieldset className={`rounded-[6px] border p-3 ${inputTheme.modePanel}`}>
            <legend className={`px-1 text-xs font-black ${inputTheme.label}`}>생성 방식</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                className={`h-10 rounded-[4px] border text-xs font-black ${
                  generationMode === "sample" ? inputTheme.toggleActive : inputTheme.toggleInactive
                }`}
                onClick={() => onGenerationModeChange("sample")}
                type="button"
              >
                샘플로 보기
              </button>
              <button
                className={`h-10 rounded-[4px] border text-xs font-black ${
                  generationMode === "gpt" ? inputTheme.toggleActive : inputTheme.toggleInactive
                }`}
                onClick={() => onGenerationModeChange("gpt")}
                type="button"
              >
                GPT로 생성
              </button>
            </div>
            {process.env.NODE_ENV === "development" ? (
              <p className={`mt-2 text-[11px] font-bold ${experience.theme.accentText}`}>Mode: {generationMode === "sample" ? "Sample" : "GPT"}</p>
            ) : null}
          </fieldset>
        ) : null}

        <button
          className={`h-11 w-full rounded-[4px] text-sm font-black disabled:opacity-50 ${experience.theme.primaryButton}`}
          disabled={isPublishing}
          type="submit"
        >
          {isPublishing ? (workspaceMode === "analysis" ? "분석 중..." : "책을 쓰는 중...") : workspaceMode === "analysis" ? "분석하기" : generationMode === "sample" ? "샘플 책 보기" : "이 명조로 책 만들기"}
        </button>
        <Link
          className={`flex h-11 w-full items-center justify-center rounded-[4px] text-sm font-black ${experience.theme.secondaryButton}`}
          href="/welfare-test"
        >
          복지혜택 테스트
        </Link>
        {error ? <p className={`text-xs font-bold leading-5 ${inputTheme.error}`}>{error}</p> : null}
      </form>
    </ExperienceInput>
  );
}

function ExperienceInput({ children, experience }: { children: ReactNode; experience: BlueprintExperience }) {
  if (experience.id === "glass") {
    return <GlassInput experience={experience}>{children}</GlassInput>;
  }

  if (experience.id === "luxury") {
    return <LuxuryInput experience={experience}>{children}</LuxuryInput>;
  }

  if (experience.id === "classic") {
    return <ClassicInput experience={experience}>{children}</ClassicInput>;
  }

  if (experience.id === "cinematic-illustration") {
    return <CinematicInput experience={experience}>{children}</CinematicInput>;
  }

  return <PaperInput experience={experience}>{children}</PaperInput>;
}

function GlassInput({ children, experience }: { children: ReactNode; experience: BlueprintExperience }) {
  return (
    <section className={`group relative overflow-hidden rounded-[14px] border p-5 transition hover:shadow-[0_0_86px_rgba(240,184,91,0.22)] ${experience.theme.input.panel}`}>
      <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-[#f6c46b]/16 blur-3xl transition group-hover:bg-[#f6c46b]/22" />
      <div className="pointer-events-none absolute -bottom-20 left-8 h-44 w-44 rounded-full bg-[#8a6429]/12 blur-3xl" />
      <div className="relative">{children}</div>
    </section>
  );
}

function PaperInput({ children, experience }: { children: ReactNode; experience: BlueprintExperience }) {
  return (
    <section className={`rounded-[8px] border p-4 shadow-sm ${experience.theme.input.panel}`}>
      {children}
    </section>
  );
}

function ClassicInput({ children, experience }: { children: ReactNode; experience: BlueprintExperience }) {
  return (
    <section className={`relative overflow-hidden rounded-[4px] border p-5 shadow-sm ${experience.theme.input.panel}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-2 border-r border-[#b8a98f]/70 bg-[#d7c5a7]/50" />
      <div className="pointer-events-none absolute right-5 top-5 h-10 w-10 border-r border-t border-[#b8a98f]/65" />
      <div className="pointer-events-none absolute bottom-5 left-8 h-px w-24 bg-[#b8a98f]/60" />
      <div className="relative pl-2">{children}</div>
    </section>
  );
}

function LuxuryInput({ children, experience }: { children: ReactNode; experience: BlueprintExperience }) {
  return (
    <section className={`relative overflow-hidden rounded-[16px] border p-5 ${experience.theme.input.panel}`}>
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#ffd77a] to-transparent" />
      <div className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-[#7d1f35] to-transparent" />
      <div className="pointer-events-none absolute -right-10 top-10 h-36 w-36 rounded-full bg-[#ffd77a]/12 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 bottom-8 h-40 w-40 rounded-full bg-[#7d1f35]/20 blur-3xl" />
      <div className="pointer-events-none absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-[#d9a850]/60 bg-[#ffd77a]/10 text-xs text-[#ffd77a]">
        BP
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}

function CinematicInput({ children, experience }: { children: ReactNode; experience: BlueprintExperience }) {
  return (
    <section className={`relative overflow-hidden rounded-[18px] border p-5 ${experience.theme.input.panel}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,199,102,0.18),transparent_62%)]" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(124,68,24,0.2))]" />
      <div className="pointer-events-none absolute bottom-10 left-8 h-px w-52 bg-gradient-to-r from-transparent via-[#ffc766]/70 to-transparent" />
      <div className="pointer-events-none absolute right-5 top-5 h-9 w-9 rotate-45 border border-[#ffc766]/45 bg-[#ffc766]/8 shadow-[0_0_24px_rgba(255,199,102,0.14)]" />
      <div className="relative">{children}</div>
    </section>
  );
}
