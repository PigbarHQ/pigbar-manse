"use client";

import type { ReactNode } from "react";
import type { BlueprintBook } from "@/src/lib/blueprint/types";
import type { BlueprintAppendix } from "@/src/lib/blueprint/types/runtime";
import type { ManuscriptSource } from "@/src/lib/blueprint/emptyPublication";

type BlueprintDebugData = {
  canonicalManseInput: unknown;
  classicalAnalysis?: unknown;
  features: unknown;
  reasons: unknown;
  writerInput: unknown;
  writerRuntime?: unknown;
  appendix?: unknown;
};

type BlueprintReaderProps = {
  appendix?: BlueprintAppendix;
  book: BlueprintBook;
  debugData?: BlueprintDebugData;
  isPublishing?: boolean;
  manuscriptSource?: ManuscriptSource;
  onCreateBook?: () => void;
  republishPanel?: ReactNode;
};

function hasPortraitPages(book: BlueprintBook) {
  return Boolean(book.portrait?.pages?.some((page) => page.content.trim().length > 0));
}

export function BlueprintReader({ book, isPublishing = false, onCreateBook }: BlueprintReaderProps) {
  const portrait = book.portrait;

  return (
    <section className="mx-auto w-full max-w-[920px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {isPublishing ? <WritingProgressView /> : null}
      {!portrait && !isPublishing ? <EmptyPortraitState onCreateBook={onCreateBook} /> : null}
      {portrait && !isPublishing ? (
        <div className="space-y-12">
          <CompletedBookView book={book} onCreateBook={onCreateBook} />
          <div className="space-y-10 scroll-mt-8" id="portrait-reader-pages">
            <PortraitCover
              coreAxis={portrait.coreAxis}
              lens={portrait.narrativeLens}
              title={portrait.title || book.metadata.title}
            />
            <PortraitPages book={book} />
            <FinalCounsel counsel={portrait.finalCounsel} />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function WritingProgressView() {
  const steps = [
    { label: "명조 해석 중", active: true, mark: "✦" },
    { label: "이야기 구성 중", active: false, mark: "□" },
    { label: "글을 다듬는 중", active: false, mark: "◇" },
    { label: "책을 완성하는 중", active: false, mark: "✧" },
  ];

  return (
    <section className="relative overflow-hidden rounded-[8px] border border-[#e2d4c0] bg-[#fffaf2] px-6 py-10 text-center shadow-[0_24px_70px_rgba(82,62,35,0.13)] sm:px-10 lg:px-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_42%,rgba(198,151,72,0.18),transparent_28%),radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.88),transparent_32%)]" />
      <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <p className="text-3xl text-[#b88a3d]">⌁</p>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.32em] text-[#b18440]">Portrait Book</p>
          <h1 className="mt-5 text-balance text-3xl font-black leading-tight text-[#2f2922] sm:text-4xl">
            이 사람의 책을 만들고 있습니다
          </h1>
          <p className="mt-6 text-base leading-8 text-[#6f6253]">
            삶의 흐름을 읽고,<br />
            당신만의 언어로 정리하고 있습니다.
          </p>
          <p className="mt-3 text-sm font-semibold text-[#8a7b69]">잠시만 기다려주세요.</p>

          <div className="mx-auto mt-9 grid max-w-2xl grid-cols-4 items-start gap-2">
            {steps.map((step, index) => (
              <div className="relative" key={step.label}>
                {index > 0 ? <div className="absolute right-1/2 top-5 h-px w-full bg-[#d8cdbb]" /> : null}
                <div className={`relative mx-auto flex h-10 w-10 items-center justify-center rounded-full border text-lg font-black ${
                  step.active
                    ? "border-[#b18440] bg-[#b18440] text-white shadow-[0_8px_20px_rgba(177,132,64,0.28)]"
                    : "border-[#d8cdbb] bg-[#ddd5ca] text-white"
                }`}>
                  {step.mark}
                </div>
                <p className={`mt-3 text-[11px] font-black ${step.active ? "text-[#2f2922]" : "text-[#9a9083]"}`}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-7 inline-flex rounded-full bg-[#f4eadc] px-7 py-3 text-xs font-black text-[#a47733]">
            약 1~2분 정도 소요됩니다.
          </p>
        </div>
        <BookGlowIllustration />
      </div>
    </section>
  );
}

function BookGlowIllustration() {
  return (
    <div className="relative mx-auto hidden h-[250px] w-[300px] lg:block">
      <div className="absolute inset-x-8 bottom-8 h-[210px] rounded-t-full border border-white/70 bg-gradient-to-b from-white/60 to-[#f3dec1]/20 shadow-inner" />
      <div className="absolute inset-x-10 bottom-9 h-28 rounded-full bg-[#f3cb78]/25 blur-2xl" />
      <div className="absolute bottom-14 left-12 h-10 w-40 -skew-y-6 rounded-[8px] border border-[#b99252] bg-[#efe1c4] shadow-lg" />
      <div className="absolute bottom-14 right-12 h-10 w-40 skew-y-6 rounded-[8px] border border-[#b99252] bg-[#fff5dc] shadow-lg" />
      <div className="absolute bottom-[5.7rem] left-[8.8rem] h-28 w-3 rotate-[34deg] rounded-full bg-[#b98635]" />
      <div className="absolute bottom-40 left-[9.2rem] h-20 w-9 rotate-[34deg] rounded-full bg-gradient-to-br from-[#d2a153] to-[#8a5c21]" />
      <div className="absolute bottom-52 left-[9.6rem] text-[#f6d98f]">✦</div>
      <div className="absolute bottom-36 right-20 text-white">✦</div>
      <div className="absolute bottom-24 left-16 text-white">✧</div>
    </div>
  );
}

function CompletedBookView({ book, onCreateBook }: { book: BlueprintBook; onCreateBook?: () => void }) {
  const portrait = book.portrait;

  if (!portrait) {
    return null;
  }

  const visiblePages = portrait.pages.slice(0, 3);

  function scrollToReader() {
    document.getElementById("portrait-reader-pages")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="rounded-[8px] border border-[#e2d4c0] bg-[#fffaf2] px-6 py-9 shadow-[0_24px_70px_rgba(82,62,35,0.13)] sm:px-8 lg:px-12">
      <div className="grid items-center gap-9 lg:grid-cols-[260px_minmax(0,1fr)]">
        <BookCoverCard coreAxis={portrait.coreAxis} lens={portrait.narrativeLens} title={portrait.title || book.metadata.title} />
        <div>
          <p className="text-sm font-black text-[#b18440]">완성되었습니다</p>
          <h1 className="mt-2 text-balance text-3xl font-black leading-tight text-[#2f2922] sm:text-4xl">
            당신의 Portrait Book이 완성되었습니다.
          </h1>
          <div className="mt-6 overflow-hidden rounded-[8px] border border-[#dfd2bd] bg-[#fffdf8]/80">
            {visiblePages.map((page) => (
              <button
                className="flex w-full items-center gap-4 border-b border-[#e8dece] px-4 py-4 text-left last:border-b-0 transition hover:bg-[#fff7ea]"
                key={page.pageNo}
                onClick={scrollToReader}
                type="button"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f2e7d6] text-xl text-[#b18440]">▭</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-black uppercase tracking-[0.18em] text-[#b18440]">Page {page.pageNo}</span>
                  <span className="mt-1 block truncate text-base font-black text-[#2f2922]">{page.title}</span>
                </span>
                <span className="text-2xl text-[#b18440]">›</span>
              </button>
            ))}
            <button
              className="flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-[#fff7ea]"
              onClick={scrollToReader}
              type="button"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f2e7d6] text-xl text-[#b18440]">✧</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-black uppercase tracking-[0.18em] text-[#b18440]">Final Counsel</span>
                <span className="mt-1 block truncate text-base font-black text-[#2f2922]">마지막 당부</span>
              </span>
              <span className="text-2xl text-[#b18440]">›</span>
            </button>
          </div>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              className="h-12 w-full max-w-xs rounded-full bg-[#2f2118] px-8 text-sm font-black text-[#fff8ec] shadow-[0_12px_26px_rgba(47,33,24,0.18)] transition hover:bg-[#1d140f]"
              onClick={scrollToReader}
              type="button"
            >
              책 읽기 시작하기
            </button>
            {onCreateBook ? (
              <button
                className="h-11 rounded-full px-5 text-sm font-bold text-[#8a6b2e] transition hover:bg-[#f4eadc]"
                onClick={onCreateBook}
                type="button"
              >
                다시 만들기
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function BookCoverCard({ coreAxis, lens, title }: { coreAxis: string; lens: string; title: string }) {
  return (
    <div className="mx-auto flex aspect-[0.72] w-full max-w-[250px] flex-col rounded-[8px] border border-[#253b2d] bg-[#173527] p-6 text-center text-[#fff8ec] shadow-[0_24px_50px_rgba(23,53,39,0.24)]">
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

function PortraitCover({ coreAxis, lens, title }: { coreAxis: string; lens: string; title: string }) {
  return (
    <header className="rounded-[8px] border border-[#d8cdbb] bg-[#fff8ec] px-8 py-12 shadow-[0_24px_70px_rgba(67,52,32,0.12)] sm:px-12 sm:py-16">
      <p className="text-xs font-black uppercase tracking-[0.32em] text-[#9a7a3a]">Portrait Book</p>
      <h1 className="mt-8 max-w-2xl text-balance text-4xl font-black leading-tight text-[#2f2922] sm:text-5xl">
        {title}
      </h1>
      <div className="mt-10 grid gap-3 border-t border-[#e4d8c5] pt-6 text-sm font-bold text-[#6f6253] sm:grid-cols-2">
        <p>Lens: <span className="text-[#2f2922]">{lens}</span></p>
        <p>Core Axis: <span className="text-[#2f2922]">{coreAxis}</span></p>
      </div>
      <p className="mt-10 text-xs font-black uppercase tracking-[0.24em] text-[#a68b58]">by Pigbar Blueprint</p>
    </header>
  );
}

function PortraitPages({ book }: { book: BlueprintBook }) {
  const portrait = book.portrait;

  if (!portrait) {
    return null;
  }

  if (hasPortraitPages(book)) {
    return (
      <div className="space-y-9">
        {portrait.pages.map((page) => (
          <article
            className="rounded-[8px] border border-[#ded1bd] bg-[#fffaf0] px-7 py-8 shadow-[0_16px_44px_rgba(67,52,32,0.08)] sm:px-10 sm:py-10"
            key={page.pageNo}
          >
            <p className="text-xs font-black uppercase tracking-[0.26em] text-[#9a7a3a]">Page {page.pageNo}</p>
            <h2 className="mt-4 text-2xl font-black leading-snug text-[#2f2922]">{page.title}</h2>
            <div className="mt-6 space-y-5 text-[17px] leading-[1.95] text-[#4d4439]">
              {page.content.split("\n").map((line, index) => {
                const trimmed = line.trim();

                return trimmed ? <p key={`${page.pageNo}-${index}`}>{trimmed}</p> : null;
              })}
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="hidden">
      {book.chapters.flatMap((chapter) => chapter.paragraphs).map((paragraph) => (
        <p key={paragraph.id}>{paragraph.text}</p>
      ))}
    </div>
  );
}

function FinalCounsel({ counsel }: { counsel: string }) {
  return (
    <section className="rounded-[8px] border border-[#d8cdbb] bg-[#fff8ec] px-8 py-12 shadow-[0_18px_54px_rgba(67,52,32,0.1)] sm:px-12 sm:py-14">
      <p className="text-sm font-black text-[#9a7a3a]">마지막 당부</p>
      <blockquote className="mt-6 border-l-4 border-[#9a7a3a] pl-6 text-2xl font-black leading-[1.75] text-[#2f2922] sm:text-3xl">
        {counsel}
      </blockquote>
    </section>
  );
}
