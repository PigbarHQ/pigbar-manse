"use client";

import { FormEvent, type ReactNode, type RefObject, useRef, useState } from "react";
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
type ResultTab = "summary" | "blind" | "future" | "decision" | "developer";

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

export function BlueprintClassicalWorkspace({ initial }: { initial: BlueprintPublicationState }) {
  const [publication, setPublication] = useState(initial);
  const [uiState, setUiState] = useState<BlueprintUiState>("WELCOME");
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("analysis");
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
            {workspaceMode === "analysis" ? (
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
        ) : (
          <AnalysisResultPage
            debugData={publication.debugData}
            experience={selectedExperience}
            onEditInput={() => setUiState("EDIT")}
            onSelectTab={setResultTab}
            selectedTab={resultTab}
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
}: {
  debugData: BlueprintDebugData;
  experience: BlueprintExperience;
  onEditInput: () => void;
  onSelectTab: (tab: ResultTab) => void;
  selectedTab: ResultTab;
}) {
  const tabs: Array<{ id: ResultTab; label: string }> = [
    { id: "summary", label: "Summary" },
    { id: "blind", label: "Blind" },
    { id: "future", label: "Future" },
    { id: "decision", label: "Decision" },
    { id: "developer", label: "Developer" },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.26em] ${experience.theme.accentText}`}>Blueprint Result</p>
          <h1 className={`mt-3 text-3xl font-black sm:text-4xl ${experience.theme.text}`}>분석 결과</h1>
          <p className={`mt-2 text-sm font-bold ${experience.theme.mutedText}`}>Summary를 먼저 보고, 필요한 근거는 탭에서 확인합니다.</p>
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
        {selectedTab === "developer" ? <DeveloperTab debugData={debugData} experience={experience} /> : null}
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
