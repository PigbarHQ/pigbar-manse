"use client";

import { useState } from "react";
import type { BlueprintBook, BlueprintChapter, BlueprintParagraph } from "@/src/lib/blueprint/types";
import type { BlueprintAppendix } from "@/src/lib/blueprint/types/runtime";
import { BlueprintReader } from "./BlueprintReader";

type WorkspaceMode = "blueprint" | "reference" | "compare";

type BlueprintDebugData = {
  canonicalManseInput: unknown;
  features: unknown;
  reasons: unknown;
  writerInput: unknown;
  writerRuntime?: unknown;
  appendix?: unknown;
};

export function BlueprintBookWorkspace({
  appendix,
  blueprintBook,
  debugData,
  referenceBook,
}: {
  appendix: BlueprintAppendix;
  blueprintBook: BlueprintBook;
  debugData?: BlueprintDebugData;
  referenceBook: BlueprintBook;
}) {
  const [mode, setMode] = useState<WorkspaceMode>("compare");
  const selectedBook = mode === "reference" ? referenceBook : blueprintBook;

  return (
    <main className="min-h-screen bg-[#f3efe7]">
      <div className="sticky top-0 z-40 border-b border-[#d8cdbb] bg-[#fffaf0]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black tracking-[0.18em] text-[#8a6b2e]">Blueprint Reference Book v1</p>
            <h1 className="mt-1 text-lg font-black text-[#2f2922]">Blueprint Book / Reference Book 비교</h1>
          </div>
          <div className="flex rounded-[2px] border border-[#d8cdbb] bg-[#fffdf8] p-1 text-sm font-black text-[#6f6253]">
            <ModeButton active={mode === "compare"} label="비교 보기" onClick={() => setMode("compare")} />
            <ModeButton active={mode === "blueprint"} label="Blueprint Book" onClick={() => setMode("blueprint")} />
            <ModeButton active={mode === "reference"} label="Reference Book" onClick={() => setMode("reference")} />
          </div>
        </div>
      </div>

      {mode === "compare" ? (
        <ReferenceComparison blueprintBook={blueprintBook} referenceBook={referenceBook} />
      ) : (
        <BlueprintReader
          appendix={appendix}
          book={selectedBook}
          debugData={mode === "blueprint" ? debugData : undefined}
        />
      )}
    </main>
  );
}

function ModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-[2px] px-4 py-2 transition ${
        active ? "bg-[#2f2922] text-[#fff8ec]" : "text-[#6f6253] hover:bg-[#f1e7d7]"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function ReferenceComparison({
  blueprintBook,
  referenceBook,
}: {
  blueprintBook: BlueprintBook;
  referenceBook: BlueprintBook;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-5 lg:grid-cols-2">
        <BookColumn book={blueprintBook} label="Blueprint Book" />
        <BookColumn book={referenceBook} label="Reference Book" reference />
      </div>
    </section>
  );
}

function BookColumn({
  book,
  label,
  reference = false,
}: {
  book: BlueprintBook;
  label: string;
  reference?: boolean;
}) {
  return (
    <article className="rounded-[2px] border border-[#d8cdbb] bg-[#fffdf8] p-5 shadow-sm">
      <p className="text-xs font-black tracking-[0.18em] text-[#8a6b2e]">{label}</p>
      <h2 className="mt-2 text-2xl font-black text-[#2f2922]">{book.metadata.title}</h2>
      <p className="mt-1 text-sm font-semibold text-[#8a7b69]">{book.metadata.subtitle}</p>
      <div className="mt-8 space-y-6">
        {book.chapters.map((chapter) => (
          <ChapterComparisonBlock chapter={chapter} key={chapter.id} reference={reference} />
        ))}
      </div>
    </article>
  );
}

function ChapterComparisonBlock({
  chapter,
  reference,
}: {
  chapter: BlueprintChapter;
  reference: boolean;
}) {
  return (
    <section className="border-t border-[#e7dece] pt-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a6b2e]">Chapter {chapter.chapterNo}</p>
      <h3 className="mt-1 text-xl font-black text-[#2f2922]">{chapter.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#8a7b69]">{chapter.opening}</p>
      <div className="mt-4 space-y-4">
        {chapter.paragraphs.map((paragraph) => (
          <ComparisonParagraph paragraph={paragraph} reference={reference} key={paragraph.id} />
        ))}
      </div>
    </section>
  );
}

function ComparisonParagraph({
  paragraph,
  reference,
}: {
  paragraph: BlueprintParagraph;
  reference: boolean;
}) {
  return (
    <div className={reference ? "rounded-[2px] bg-[#eef1f4] p-3" : ""}>
      <p className="text-base leading-7 text-[#3b332a]">{paragraph.text}</p>
      {paragraph.referenceEvidence ? (
        <div className="mt-3 space-y-1 text-xs leading-5 text-[#667085]">
          <p><span className="font-black text-[#344054]">사주 근거</span> {paragraph.referenceEvidence.saju.join(" · ")}</p>
          <p><span className="font-black text-[#344054]">십성</span> {paragraph.referenceEvidence.tenGods.join(" · ")}</p>
          <p><span className="font-black text-[#344054]">오행</span> {paragraph.referenceEvidence.elements.join(" · ")}</p>
          <p><span className="font-black text-[#344054]">합충</span> {paragraph.referenceEvidence.relations.join(" · ")}</p>
          <p><span className="font-black text-[#344054]">대운</span> {paragraph.referenceEvidence.luck.join(" · ")}</p>
        </div>
      ) : null}
    </div>
  );
}
