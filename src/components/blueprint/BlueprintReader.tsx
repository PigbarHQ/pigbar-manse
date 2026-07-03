"use client";

import { useEffect, useMemo, useState } from "react";
import type { BlueprintBook, BlueprintChapter, BlueprintParagraph } from "@/src/lib/blueprint/types";
import type { BlueprintAppendix, CanonicalOptionalPillar } from "@/src/lib/blueprint/types/runtime";

type BlueprintDebugData = {
  canonicalManseInput: unknown;
  classicalAnalysis?: unknown;
  features: unknown;
  reasons: unknown;
  writerInput: unknown;
  writerRuntime?: unknown;
  appendix?: unknown;
};

type ReaderSection =
  | "cover"
  | "dedication"
  | "author"
  | "prologue"
  | "toc"
  | `chapter-${number}`
  | "notes"
  | "appendix";

type SavedReaderState = {
  published: boolean;
  currentSection: ReaderSection;
  bookmarks: ReaderSection[];
  highlights: string[];
  notes: Record<string, string>;
};

const storageKey = "pigbar-blueprint-no-000001";

const sectionLabels: Record<string, string> = {
  cover: "표지",
  dedication: "헌사",
  author: "저자",
  prologue: "프롤로그",
  toc: "목차",
  notes: "My Notes",
  appendix: "이 책의 근거",
};

function isClassicalBook(book: BlueprintBook) {
  return book.metadata.sourceName === "Pigbar Manse Classical Mode";
}

const defaultState: SavedReaderState = {
  published: false,
  currentSection: "cover",
  bookmarks: [],
  highlights: [],
  notes: {},
};

const emptyAppendix: BlueprintAppendix = {
  pillars: {
    year: { gan: "-", ji: "-", ganKo: "-", jiKo: "-", label: "-", confidence: 0 },
    month: { gan: "-", ji: "-", ganKo: "-", jiKo: "-", label: "-", confidence: 0 },
    day: { gan: "-", ji: "-", ganKo: "-", jiKo: "-", label: "-", confidence: 0 },
    hour: null,
  },
  tenGods: {},
  elements: {},
  twelveStages: {},
  hiddenStems: {},
  relations: {
    stems: {},
    branches: {},
  },
  luck: {
    daeun: {},
    currentDaeun: null,
    currentYear: { gan: "-", ji: "-", ganKo: "-", jiKo: "-", label: "-", confidence: 0 },
    currentMonth: { gan: "-", ji: "-", ganKo: "-", jiKo: "-", label: "-", confidence: 0 },
    currentDay: { gan: "-", ji: "-", ganKo: "-", jiKo: "-", label: "-", confidence: 0 },
    currentHour: null,
  },
  reasonTrace: [],
};

function getChapterSection(chapter: BlueprintChapter): ReaderSection {
  return `chapter-${chapter.chapterNo}` as ReaderSection;
}

function getSectionTitle(book: BlueprintBook, section: ReaderSection) {
  if (section.startsWith("chapter-")) {
    const chapterNo = Number(section.replace("chapter-", ""));
    return book.chapters.find((chapter) => chapter.chapterNo === chapterNo)?.title ?? "Chapter";
  }

  return sectionLabels[section] ?? "책";
}

function getParagraphsForSection(book: BlueprintBook, section: ReaderSection): BlueprintParagraph[] {
  if (section === "prologue") {
    return book.prologue.paragraphs;
  }

  if (section.startsWith("chapter-")) {
    const chapterNo = Number(section.replace("chapter-", ""));
    return book.chapters.find((chapter) => chapter.chapterNo === chapterNo)?.paragraphs ?? [];
  }

  return [];
}

function readSavedState(): SavedReaderState {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState;
  } catch {
    return defaultState;
  }
}

export function BlueprintReader({
  appendix,
  book,
  debugData,
  republishPanel,
}: {
  appendix?: BlueprintAppendix;
  book: BlueprintBook;
  debugData?: BlueprintDebugData;
  republishPanel?: React.ReactNode;
}) {
  const [readerState, setReaderState] = useState<SavedReaderState>(defaultState);
  const [hasLoadedSavedState, setHasLoadedSavedState] = useState(false);
  const [visibleSection, setVisibleSection] = useState<ReaderSection>("cover");
  const [isPublishing, setIsPublishing] = useState(false);
  const [showShelfNotice, setShowShelfNotice] = useState(false);
  const [activeNoteParagraphId, setActiveNoteParagraphId] = useState<string | null>(null);
  const classicalBook = isClassicalBook(book);

  const readingOrder = useMemo<ReaderSection[]>(
    () => {
      const baseOrder: ReaderSection[] = [
        "cover",
        "dedication",
        "author",
        "prologue",
        "toc",
        ...book.chapters.map(getChapterSection),
      ];

      return classicalBook ? [...baseOrder, "appendix"] : [...baseOrder, "notes", "appendix"];
    },
    [book.chapters, classicalBook],
  );

  const currentIndex = readingOrder.indexOf(visibleSection);
  const previousSection = currentIndex > 0 ? readingOrder[currentIndex - 1] : null;
  const nextSection = currentIndex >= 0 && currentIndex < readingOrder.length - 1 ? readingOrder[currentIndex + 1] : null;
  const currentParagraphs = getParagraphsForSection(book, visibleSection);
  const currentTitle = getSectionTitle(book, visibleSection);

  useEffect(() => {
    const restoreSavedState = window.setTimeout(() => {
      setReaderState(readSavedState());
      setHasLoadedSavedState(true);
    }, 0);

    return () => window.clearTimeout(restoreSavedState);
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedState) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(readerState));
  }, [hasLoadedSavedState, readerState]);

  function updateReaderState(updater: (state: SavedReaderState) => SavedReaderState) {
    setReaderState((state) => updater(state));
  }

  function goTo(section: ReaderSection) {
    setVisibleSection(section);
    if (section !== "cover") {
      updateReaderState((state) => ({ ...state, currentSection: section }));
    }
    setActiveNoteParagraphId(null);
  }

  function publishBook() {
    setIsPublishing(true);
    window.setTimeout(() => {
      updateReaderState((state) => ({
        ...state,
        published: true,
        currentSection: "cover",
      }));
      setShowShelfNotice(true);
    }, 1200);
    window.setTimeout(() => {
      setIsPublishing(false);
    }, 1700);
  }

  function toggleBookmark(section: ReaderSection) {
    updateReaderState((state) => {
      const exists = state.bookmarks.includes(section);
      return {
        ...state,
        bookmarks: exists
          ? state.bookmarks.filter((bookmark) => bookmark !== section)
          : [...state.bookmarks, section],
      };
    });
  }

  function toggleHighlight(paragraphId: string) {
    updateReaderState((state) => {
      const exists = state.highlights.includes(paragraphId);
      return {
        ...state,
        highlights: exists
          ? state.highlights.filter((highlight) => highlight !== paragraphId)
          : [...state.highlights, paragraphId],
      };
    });
  }

  function updateNote(paragraphId: string, value: string) {
    updateReaderState((state) => ({
      ...state,
      notes: {
        ...state.notes,
        [paragraphId]: value,
      },
    }));
  }

  const resumeSection =
    readerState.currentSection === "cover" || (classicalBook && readerState.currentSection === "notes")
      ? "dedication"
      : readerState.currentSection;
  const isBookmarked = readerState.bookmarks.includes(visibleSection);
  const appendixData = appendix ?? emptyAppendix;

  return (
    <main className="min-h-screen overflow-hidden bg-[#f3efe7] text-[#2f2922]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        {visibleSection === "cover" ? (
          <CoverView
            book={book}
            isPublished={readerState.published}
            isPublishing={isPublishing}
            onContinue={() => goTo("dedication")}
            onPublish={publishBook}
            onResume={() => goTo(resumeSection)}
            showShelfNotice={showShelfNotice}
          />
        ) : (
          <div className="grid flex-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)_260px]">
            <ReaderSidebar
              book={book}
              bookmarks={readerState.bookmarks}
              classicalBook={classicalBook}
              currentSection={visibleSection}
              goTo={goTo}
              republishPanel={republishPanel}
            />

            <article className="book-page mx-auto min-h-[calc(100vh-40px)] w-full max-w-3xl rounded-[2px] border border-[#d8cdbb] bg-[#fffdf8] px-6 py-8 shadow-[0_24px_80px_rgba(55,45,31,0.18)] sm:px-12 sm:py-12">
              <ReaderTopBar
                isBookmarked={isBookmarked}
                onBackToCover={() => goTo("cover")}
                onBookmark={() => toggleBookmark(visibleSection)}
                sectionTitle={currentTitle}
              />

              {visibleSection === "dedication" ? (
                <DedicationView book={book} />
              ) : null}
              {visibleSection === "author" ? <AuthorView book={book} /> : null}
              {visibleSection === "prologue" ? (
                <PrologueView
                  activeNoteParagraphId={activeNoteParagraphId}
                  book={book}
                  highlights={readerState.highlights}
                  notes={readerState.notes}
                  onNoteChange={updateNote}
                  onOpenNote={setActiveNoteParagraphId}
                  onToggleHighlight={toggleHighlight}
                />
              ) : null}
              {visibleSection === "toc" ? <TableOfContents book={book} goTo={goTo} /> : null}
              {visibleSection.startsWith("chapter-") ? (
                <ChapterView
                  activeNoteParagraphId={activeNoteParagraphId}
                  chapter={book.chapters.find((chapter) => getChapterSection(chapter) === visibleSection)}
                  highlights={readerState.highlights}
                  notes={readerState.notes}
                  onNoteChange={updateNote}
                  onOpenNote={setActiveNoteParagraphId}
                  onToggleHighlight={toggleHighlight}
                />
              ) : null}
              {visibleSection === "notes" ? (
                <NotesView book={book} highlights={readerState.highlights} notes={readerState.notes} />
              ) : null}
              {visibleSection === "appendix" ? <AppendixView appendix={appendixData} /> : null}

              <nav className="mt-12 flex items-center justify-between border-t border-[#e7dece] pt-6 text-sm font-semibold text-[#6f6253]">
                <button
                  className="rounded-full border border-[#d8cdbb] px-4 py-2 transition hover:bg-[#f6f0e6] disabled:opacity-30"
                  disabled={!previousSection}
                  onClick={() => previousSection && goTo(previousSection)}
                  type="button"
                >
                  이전 장
                </button>
                <span>{currentIndex + 1} / {readingOrder.length}</span>
                <button
                  className="rounded-full border border-[#d8cdbb] px-4 py-2 transition hover:bg-[#f6f0e6] disabled:opacity-30"
                  disabled={!nextSection}
                  onClick={() => nextSection && goTo(nextSection)}
                  type="button"
                >
                  다음 장
                </button>
              </nav>
            </article>

            <ReaderPanel
              book={book}
              currentParagraphs={currentParagraphs}
              debugData={debugData}
              highlights={readerState.highlights}
              notes={readerState.notes}
              onGoToNotes={() => goTo("notes")}
              showNotes={!classicalBook}
            />
          </div>
        )}
      </div>
    </main>
  );
}

function CoverView({
  book,
  isPublished,
  isPublishing,
  onContinue,
  onPublish,
  onResume,
  showShelfNotice,
}: {
  book: BlueprintBook;
  isPublished: boolean;
  isPublishing: boolean;
  onContinue: () => void;
  onPublish: () => void;
  onResume: () => void;
  showShelfNotice: boolean;
}) {
  return (
    <section className="flex flex-1 items-center justify-center py-8">
      <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[minmax(320px,460px)_1fr]">
        <div className={`book-cover relative mx-auto aspect-[0.72] w-full max-w-[420px] overflow-hidden rounded-[10px] border border-[#2f2922]/20 bg-[#2d382f] p-8 text-[#f8efe1] shadow-[0_36px_90px_rgba(45,38,30,0.35)] ${isPublishing ? "book-publishing" : ""}`}>
          <div className="absolute inset-y-0 left-0 w-8 bg-black/20" />
          <div className="absolute inset-5 rounded-[6px] border border-[#d9b45f]/60" />
          <div className="relative z-10 flex h-full flex-col">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#d9b45f]">{book.metadata.subtitle}</p>
            <h1 className="mt-16 text-balance text-4xl font-black leading-tight sm:text-5xl">
              {book.metadata.title}
            </h1>
            <div className="mt-auto space-y-4">
              <p className="font-serif text-2xl text-[#d9b45f]">{book.metadata.blueprintNo}</p>
              <div className="h-px w-24 bg-[#d9b45f]/70" />
              <p className="text-lg font-semibold">by {book.metadata.author}</p>
              <p className="text-sm text-[#e9dcc7]">{book.metadata.publisher}</p>
            </div>
            {isPublished ? (
              <div className="published-stamp absolute right-7 top-7 rotate-[-8deg] rounded-full border-2 border-[#d9b45f] px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#d9b45f]">
                Published.
              </div>
            ) : null}
          </div>
        </div>

        <div className="mx-auto max-w-md text-center lg:text-left">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#8a6b2e]">Blueprint No.000001</p>
          <h2 className="mt-5 text-3xl font-black leading-tight text-[#2f2922] sm:text-4xl">
            한 사람을 한 권의 책으로 출판합니다.
          </h2>
          <p className="mt-5 text-base leading-8 text-[#6a5d4e]">
            첫 화면은 표지입니다. 이 책은 주영지의 구조를 빠르게 소비하지 않고, 처음부터 끝까지 읽을 수 있도록 출판됩니다.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:justify-start">
            {!isPublished ? (
              <button
                className="h-13 rounded-full bg-[#2f2922] px-8 text-base font-black text-[#fff8ec] shadow-lg shadow-[#2f2922]/20 transition hover:-translate-y-0.5 hover:bg-[#1f1a15]"
                disabled={isPublishing}
                onClick={onPublish}
                type="button"
              >
                {isPublishing ? "출판 중" : "출판하기"}
              </button>
            ) : (
              <>
                <button
                  className="h-13 rounded-full bg-[#2f2922] px-8 text-base font-black text-[#fff8ec] shadow-lg shadow-[#2f2922]/20 transition hover:-translate-y-0.5 hover:bg-[#1f1a15]"
                  onClick={onContinue}
                  type="button"
                >
                  읽기 시작
                </button>
                <button
                  className="h-13 rounded-full border border-[#c9b99f] px-8 text-base font-black text-[#3b332a] transition hover:bg-[#fff8ec]"
                  onClick={onResume}
                  type="button"
                >
                  이어읽기
                </button>
              </>
            )}
          </div>

          {isPublishing ? (
            <div className="mt-6 rounded-full bg-[#fff8ec] px-5 py-3 text-sm font-bold text-[#6f5630] shadow-sm">
              책이 천천히 닫히고 있습니다.
            </div>
          ) : null}
          {showShelfNotice || isPublished ? (
            <div className="mt-6 rounded-full bg-[#f7df9c] px-5 py-3 text-sm font-black text-[#4b3b21] shadow-sm">
              Published. 내 서재에 꽂혔습니다.
            </div>
          ) : null}

          <FamilyCollectionShelf book={book} compact={false} />
        </div>
      </div>
    </section>
  );
}

function ReaderSidebar({
  book,
  bookmarks,
  classicalBook,
  currentSection,
  goTo,
  republishPanel,
}: {
  book: BlueprintBook;
  bookmarks: ReaderSection[];
  classicalBook: boolean;
  currentSection: ReaderSection;
  goTo: (section: ReaderSection) => void;
  republishPanel?: React.ReactNode;
}) {
  const items: Array<{ section: ReaderSection; label: string }> = [
    { section: "cover", label: "표지" },
    { section: "dedication", label: "헌사" },
    { section: "author", label: "저자" },
    { section: "prologue", label: "프롤로그" },
    { section: "toc", label: "목차" },
    ...book.chapters.map((chapter) => ({
      section: getChapterSection(chapter),
      label: `${chapter.chapterNo}. ${chapter.title}`,
    })),
    ...(classicalBook ? [] : [{ section: "notes" as ReaderSection, label: "My Notes" }]),
    { section: "appendix", label: classicalBook ? "20. Appendix" : "이 책의 근거" },
  ];

  return (
    <aside className="hidden rounded-[2px] border border-[#d8cdbb] bg-[#fffaf0]/80 p-4 shadow-sm lg:block">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8a6b2e]">내 서재</p>
      <h2 className="mt-3 text-lg font-black text-[#2f2922]">{book.metadata.title}</h2>
      {republishPanel ? <div className="mt-4">{republishPanel}</div> : null}
      <FamilyCollectionShelf book={book} compact />
      <div className="mt-5 space-y-1">
        {items.map((item) => (
          <button
            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
              currentSection === item.section
                ? "bg-[#2f2922] font-black text-[#fff8ec]"
                : "text-[#6f6253] hover:bg-[#f1e7d7]"
            }`}
            key={item.section}
            onClick={() => goTo(item.section)}
            type="button"
          >
            <span>{item.label}</span>
            {bookmarks.includes(item.section) ? <span className="text-[#d9b45f]">책갈피</span> : null}
          </button>
        ))}
      </div>
    </aside>
  );
}

function FamilyCollectionShelf({ book, compact }: { book: BlueprintBook; compact: boolean }) {
  return (
    <section className={`${compact ? "mt-5" : "mt-8"} rounded-[2px] border border-[#d8cdbb] bg-[#fffaf0] p-4 text-left`}>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8a6b2e]">Family Collection</p>
      <h3 className={`${compact ? "mt-2 text-sm" : "mt-3 text-lg"} font-black text-[#2f2922]`}>
        {book.familyCollection.name}
      </h3>
      {!compact ? (
        <p className="mt-2 text-sm leading-6 text-[#6f6253]">{book.familyCollection.description}</p>
      ) : null}
      <div className={`${compact ? "mt-3 space-y-2" : "mt-4 grid gap-2 sm:grid-cols-2"}`}>
        {book.familyCollection.volumes.map((volume) => {
          const isCurrent = volume.blueprintNo === book.metadata.blueprintNo;
          return (
            <div
              className={`rounded-[2px] border px-3 py-3 ${
                isCurrent
                  ? "border-[#8a6b2e] bg-[#f7df9c]/55"
                  : "border-[#e7dece] bg-[#fffdf8]"
              }`}
              key={volume.blueprintNo}
            >
              <p className="text-xs font-black text-[#8a6b2e]">Vol.{volume.volumeNo} {volume.author}</p>
              <p className="mt-1 text-sm font-black leading-5 text-[#2f2922]">{volume.title}</p>
              <p className="mt-1 text-xs font-semibold text-[#8a7b69]">
                {isCurrent ? "현재 책" : volume.status === "published" ? "가족의 다른 책 보기" : "출판 준비 중"}
              </p>
            </div>
          );
        })}
      </div>
      {!compact ? (
        <p className="mt-3 text-xs leading-5 text-[#8a7b69]">
          비교 없이 한 책장에 놓입니다. 각 책은 독립적인 책입니다.
        </p>
      ) : null}
    </section>
  );
}

function ReaderTopBar({
  isBookmarked,
  onBackToCover,
  onBookmark,
  sectionTitle,
}: {
  isBookmarked: boolean;
  onBackToCover: () => void;
  onBookmark: () => void;
  sectionTitle: string;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#e7dece] pb-5">
      <button className="text-sm font-black text-[#6f6253] hover:text-[#2f2922]" onClick={onBackToCover} type="button">
        표지로
      </button>
      <p className="text-sm font-bold text-[#8a7b69]">{sectionTitle}</p>
      <button
        className={`rounded-full border px-4 py-2 text-sm font-black transition ${
          isBookmarked
            ? "border-[#8a6b2e] bg-[#f7df9c] text-[#4b3b21]"
            : "border-[#d8cdbb] text-[#6f6253] hover:bg-[#f6f0e6]"
        }`}
        onClick={onBookmark}
        type="button"
      >
        책갈피
      </button>
    </div>
  );
}

function DedicationView({ book }: { book: BlueprintBook }) {
  return (
    <section className="flex min-h-[55vh] items-center justify-center">
      <p className="max-w-xl text-center font-serif text-2xl leading-[1.8] text-[#4f4539]">{book.dedication}</p>
    </section>
  );
}

function AuthorView({ book }: { book: BlueprintBook }) {
  return (
    <section className="mx-auto max-w-2xl">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-[#8a6b2e]">저자</p>
      <h1 className="mt-4 text-4xl font-black">{book.metadata.author}</h1>
      <p className="mt-8 text-xl leading-10 text-[#51463a]">{book.authorNote}</p>
      <dl className="mt-10 grid gap-3 rounded-[2px] border border-[#e7dece] bg-[#fffaf0] p-5 text-sm text-[#6f6253] sm:grid-cols-2">
        <div>
          <dt className="font-black text-[#2f2922]">책 번호</dt>
          <dd className="mt-1">{book.metadata.blueprintNo}</dd>
        </div>
        <div>
          <dt className="font-black text-[#2f2922]">판본</dt>
          <dd className="mt-1">{book.metadata.edition}</dd>
        </div>
        <div>
          <dt className="font-black text-[#2f2922]">출판일</dt>
          <dd className="mt-1">{book.metadata.publicationDate}</dd>
        </div>
        <div>
          <dt className="font-black text-[#2f2922]">출판</dt>
          <dd className="mt-1">{book.metadata.publisher}</dd>
        </div>
      </dl>
    </section>
  );
}

function PrologueView(props: ParagraphInteractionProps & { book: BlueprintBook }) {
  return (
    <section>
      <p className="text-sm font-black uppercase tracking-[0.22em] text-[#8a6b2e]">{props.book.prologue.title}</p>
      <h1 className="mt-4 text-4xl font-black leading-tight text-[#2f2922]">{props.book.prologue.title}</h1>
      <ParagraphList paragraphs={props.book.prologue.paragraphs} {...props} />
    </section>
  );
}

function TableOfContents({ book, goTo }: { book: BlueprintBook; goTo: (section: ReaderSection) => void }) {
  return (
    <section>
      <p className="text-sm font-black uppercase tracking-[0.22em] text-[#8a6b2e]">Table of Contents</p>
      <h1 className="mt-4 text-4xl font-black">목차</h1>
      <div className="mt-10 space-y-3">
        {book.chapters.map((chapter) => (
          <button
            className="group flex w-full items-center justify-between border-b border-[#e7dece] py-4 text-left transition hover:border-[#8a6b2e]"
            key={chapter.id}
            onClick={() => goTo(getChapterSection(chapter))}
            type="button"
          >
            <span>
              <span className="block text-sm font-bold text-[#8a6b2e]">Chapter {chapter.chapterNo}</span>
              <span className="mt-1 block text-2xl font-black text-[#2f2922]">{chapter.title}</span>
            </span>
            <span className="max-w-[220px] text-right text-sm leading-6 text-[#8a7b69]">{chapter.question}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

type ParagraphInteractionProps = {
  activeNoteParagraphId: string | null;
  highlights: string[];
  notes: Record<string, string>;
  onNoteChange: (paragraphId: string, value: string) => void;
  onOpenNote: (paragraphId: string | null) => void;
  onToggleHighlight: (paragraphId: string) => void;
};

function ChapterView({
  activeNoteParagraphId,
  chapter,
  highlights,
  notes,
  onNoteChange,
  onOpenNote,
  onToggleHighlight,
}: ParagraphInteractionProps & { chapter?: BlueprintChapter }) {
  if (!chapter) {
    return null;
  }

  return (
    <section>
      <p className="text-sm font-black uppercase tracking-[0.22em] text-[#8a6b2e]">Chapter {chapter.chapterNo}</p>
      <h1 className="mt-4 text-4xl font-black leading-tight text-[#2f2922]">{chapter.title}</h1>
      <p className="mt-4 text-lg font-semibold leading-8 text-[#8a7b69]">{chapter.question}</p>
      <p className="mt-10 border-l-4 border-[#d9b45f] pl-5 font-serif text-2xl leading-[1.7] text-[#4f4539]">
        {chapter.opening}
      </p>
      <ParagraphList
        activeNoteParagraphId={activeNoteParagraphId}
        highlights={highlights}
        notes={notes}
        onNoteChange={onNoteChange}
        onOpenNote={onOpenNote}
        onToggleHighlight={onToggleHighlight}
        paragraphs={chapter.paragraphs}
      />
      <p className="mt-12 font-serif text-2xl leading-[1.7] text-[#4f4539]">{chapter.closing}</p>
    </section>
  );
}

function ParagraphList({
  activeNoteParagraphId,
  highlights,
  notes,
  onNoteChange,
  onOpenNote,
  onToggleHighlight,
  paragraphs,
}: ParagraphInteractionProps & { paragraphs: BlueprintParagraph[] }) {
  return (
    <div className="mt-10 space-y-8">
      {paragraphs.map((paragraph) => {
        const highlighted = highlights.includes(paragraph.id);
        const noteOpen = activeNoteParagraphId === paragraph.id;
        return (
          <div className="group" key={paragraph.id}>
            {paragraph.tripleLayer ? (
              <TripleLayerBlock highlighted={highlighted} paragraph={paragraph} />
            ) : (
              <p
                className={`rounded-[2px] px-1 py-1 text-xl leading-[2.05] tracking-[-0.01em] transition ${
                  highlighted ? "bg-[#f7df9c]/60" : "bg-transparent"
                }`}
              >
                {paragraph.text}
              </p>
            )}
            {paragraph.referenceEvidence && !paragraph.tripleLayer ? (
              <div className="mt-3 rounded-[2px] border border-[#d6d9de] bg-[#eef1f4] p-4 text-sm leading-6 text-[#344054]">
                <p className="text-xs font-black tracking-[0.16em] text-[#667085]">사주 근거</p>
                <div className="mt-3 grid gap-3">
                  <ReferenceEvidenceRow label="사주" values={paragraph.referenceEvidence.saju} />
                  <ReferenceEvidenceRow label="십성" values={paragraph.referenceEvidence.tenGods} />
                  <ReferenceEvidenceRow label="오행" values={paragraph.referenceEvidence.elements} />
                  <ReferenceEvidenceRow label="합충" values={paragraph.referenceEvidence.relations} />
                  <ReferenceEvidenceRow label="대운" values={paragraph.referenceEvidence.luck} />
                </div>
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              <button
                className="rounded-full border border-[#d8cdbb] px-3 py-1.5 text-xs font-black text-[#6f6253] hover:bg-[#f6f0e6]"
                onClick={() => onToggleHighlight(paragraph.id)}
                type="button"
              >
                밑줄
              </button>
              <button
                className="rounded-full border border-[#d8cdbb] px-3 py-1.5 text-xs font-black text-[#6f6253] hover:bg-[#f6f0e6]"
                onClick={() => onOpenNote(noteOpen ? null : paragraph.id)}
                type="button"
              >
                메모
              </button>
            </div>
            {noteOpen ? (
              <textarea
                className="mt-3 min-h-24 w-full rounded-[2px] border border-[#d8cdbb] bg-[#fffaf0] p-3 text-sm leading-6 text-[#3b332a] outline-none focus:border-[#8a6b2e]"
                onChange={(event) => onNoteChange(paragraph.id, event.target.value)}
                placeholder="이 문장 옆에 남길 생각을 적어두세요."
                value={notes[paragraph.id] ?? ""}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function TripleLayerBlock({
  highlighted,
  paragraph,
}: {
  highlighted: boolean;
  paragraph: BlueprintParagraph;
}) {
  if (!paragraph.tripleLayer) {
    return null;
  }

  return (
    <div className={`rounded-[2px] border border-[#d6d9de] bg-[#f8fafc] p-5 ${highlighted ? "ring-2 ring-[#d9b45f]" : ""}`}>
      <LayerPanel
        label="Layer 1"
        title="사주 원문"
        tone="source"
        values={paragraph.tripleLayer.sajuOriginal}
      />
      <LayerDivider />
      <LayerPanel
        label="Layer 2"
        title="고전 명리학 해석"
        tone="classical"
        values={paragraph.tripleLayer.classical}
      />
      <LayerDivider />
      <LayerPanel
        label="Layer 3"
        title="Blueprint Interpretation"
        tone="blueprint"
        values={paragraph.tripleLayer.blueprint}
      />
    </div>
  );
}

function LayerDivider() {
  return <div className="my-5 border-t border-[#cfd3d8]" />;
}

function LayerPanel({
  label,
  title,
  tone,
  values,
}: {
  label: string;
  title: string;
  tone: "source" | "classical" | "blueprint";
  values: string[];
}) {
  const toneClass = {
    source: "bg-[#eef1f4] text-[#344054]",
    classical: "bg-[#fffdf8] text-[#3b332a]",
    blueprint: "bg-[#f7df9c]/35 text-[#2f2922]",
  }[tone];

  return (
    <section className={`rounded-[2px] p-4 ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#667085]">{label}</p>
      <h3 className="mt-1 text-base font-black">{title}</h3>
      <div className="mt-3 space-y-2">
        {values.map((value) => (
          <p className="text-lg leading-8" key={value}>{value}</p>
        ))}
      </div>
    </section>
  );
}

function ReferenceEvidenceRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <span className="font-black text-[#344054]">{label}</span>
      <span className="ml-2 text-[#667085]">{values.length ? values.join(" · ") : "아직 연결되지 않았습니다."}</span>
    </div>
  );
}

function NotesView({
  book,
  highlights,
  notes,
}: {
  book: BlueprintBook;
  highlights: string[];
  notes: Record<string, string>;
}) {
  const allParagraphs = [
    ...book.prologue.paragraphs,
    ...book.chapters.flatMap((chapter) => chapter.paragraphs),
  ];
  const savedNotes = Object.entries(notes).filter(([, value]) => value.trim().length > 0);
  const highlightedParagraphs = allParagraphs.filter((paragraph) => highlights.includes(paragraph.id));

  return (
    <section>
      <p className="text-sm font-black uppercase tracking-[0.22em] text-[#8a6b2e]">My Notes</p>
      <h1 className="mt-4 text-4xl font-black">내가 남긴 문장</h1>
      <p className="mt-5 text-lg leading-8 text-[#6f6253]">{book.myNotesPrompt}</p>

      <div className="mt-10 grid gap-8">
        <div>
          <h2 className="text-xl font-black">밑줄 친 문장</h2>
          <div className="mt-4 space-y-3">
            {highlightedParagraphs.length ? (
              highlightedParagraphs.map((paragraph) => (
                <p className="rounded-[2px] bg-[#f7df9c]/50 p-4 leading-7" key={paragraph.id}>
                  {paragraph.text}
                </p>
              ))
            ) : (
              <p className="rounded-[2px] border border-dashed border-[#d8cdbb] p-4 text-[#8a7b69]">아직 밑줄 친 문장이 없습니다.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-black">메모</h2>
          <div className="mt-4 space-y-3">
            {savedNotes.length ? (
              savedNotes.map(([paragraphId, note]) => (
                <div className="rounded-[2px] border border-[#e7dece] bg-[#fffaf0] p-4" key={paragraphId}>
                  <p className="text-sm font-bold text-[#8a6b2e]">{paragraphId}</p>
                  <p className="mt-2 leading-7">{note}</p>
                </div>
              ))
            ) : (
              <p className="rounded-[2px] border border-dashed border-[#d8cdbb] p-4 text-[#8a7b69]">아직 남긴 메모가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatUnknown(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(formatUnknown).join(", ");

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.hangul === "string" && typeof record.hanja === "string") {
      return `${record.hangul}(${record.hanja})`;
    }
    if (typeof record.ganKo === "string" && typeof record.jiKo === "string") {
      return `${record.ganKo}${record.jiKo}`;
    }
    return JSON.stringify(value);
  }

  return String(value);
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

const elementLabels: Record<string, string> = {
  wood: "목",
  fire: "화",
  earth: "토",
  metal: "금",
  water: "수",
};

const pillarLabels: Record<string, string> = {
  year: "년주",
  month: "월주",
  day: "일주",
  hour: "시주",
};

function formatAppendixKey(key: string) {
  return pillarLabels[key] ?? elementLabels[key] ?? key;
}

function AppendixSection({
  children,
  label,
  title,
}: {
  children: React.ReactNode;
  label: string;
  title: string;
}) {
  return (
    <section className="border-t border-[#cfd3d8] pt-8">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6b7280]">{label}</p>
      <h2 className="mt-2 text-2xl font-black text-[#1f2933]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function AppendixRows({
  rows,
}: {
  rows: Array<{ label: string; value: React.ReactNode }>;
}) {
  if (rows.length === 0) {
    return <p className="rounded-[2px] border border-dashed border-[#d6d9de] p-4 text-sm text-[#667085]">아직 연결되지 않았습니다.</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rows.map((row) => (
        <div className="rounded-[2px] border border-[#d6d9de] bg-[#f8fafc] px-3 py-2 text-sm" key={row.label}>
          <span className="font-black text-[#344054]">{row.label} </span>
          <span className="text-[#667085]">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function PillarCell({ label, pillar }: { label: string; pillar: CanonicalOptionalPillar }) {
  return (
    <div className="rounded-[2px] border border-[#d6d9de] bg-[#f8fafc] p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6b7280]">{label}</p>
      {pillar ? (
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <dt className="text-[#667085]">간지</dt>
          <dd className="font-black text-[#1f2933]">{pillar.label}</dd>
          <dt className="text-[#667085]">천간</dt>
          <dd>{pillar.ganKo} / {pillar.gan}</dd>
          <dt className="text-[#667085]">지지</dt>
          <dd>{pillar.jiKo} / {pillar.ji}</dd>
          <dt className="text-[#667085]">Confidence</dt>
          <dd>{formatPercent(pillar.confidence)}</dd>
        </dl>
      ) : (
        <p className="mt-3 text-sm text-[#667085]">시주 정보가 없습니다.</p>
      )}
    </div>
  );
}

function TenGodRows({ appendix }: { appendix: BlueprintAppendix }) {
  const rows = [
    { label: "년주", pillar: appendix.pillars.year },
    { label: "월주", pillar: appendix.pillars.month },
    { label: "일주", pillar: appendix.pillars.day },
    { label: "시주", pillar: appendix.pillars.hour },
  ]
    .filter(({ pillar }) => Boolean(pillar))
    .map(({ label, pillar }) => {
      const pillarLabel = pillar?.label ?? "-";
      return {
        label,
        value: `${pillarLabel} — ${appendix.tenGods[pillarLabel] ?? "아직 연결되지 않았습니다"}`,
      };
    });

  return <AppendixRows rows={rows} />;
}

function ElementRows({ appendix }: { appendix: BlueprintAppendix }) {
  const rows = Object.entries(elementLabels).map(([key, label]) => ({
    label,
    value: appendix.elements[key] ?? 0,
  }));

  return <AppendixRows rows={rows} />;
}

function TwelveStageRows({ appendix }: { appendix: BlueprintAppendix }) {
  const rows = Object.entries(pillarLabels).map(([key, label]) => ({
    label,
    value: appendix.twelveStages[key] ?? "아직 연결되지 않았습니다",
  }));

  return <AppendixRows rows={rows} />;
}

function PillarTable({ appendix }: { appendix: BlueprintAppendix }) {
  const rows = [
    { label: "년주", pillar: appendix.pillars.year },
    { label: "월주", pillar: appendix.pillars.month },
    { label: "일주", pillar: appendix.pillars.day },
    { label: "시주", pillar: appendix.pillars.hour },
  ];

  return (
    <div className="overflow-hidden rounded-[2px] border border-[#d6d9de] bg-[#f8fafc]">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-[#e4e7ec] text-xs font-black uppercase tracking-[0.16em] text-[#667085]">
          <tr>
            <th className="px-4 py-3">구분</th>
            <th className="px-4 py-3">간지</th>
            <th className="px-4 py-3">한자</th>
            <th className="px-4 py-3">Confidence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#d6d9de]">
          {rows.map(({ label, pillar }) => (
            <tr key={label}>
              <th className="px-4 py-3 font-black text-[#344054]">{label}</th>
              <td className="px-4 py-3 font-black text-[#1f2933]">
                {pillar ? pillar.label : "아직 연결되지 않았습니다"}
              </td>
              <td className="px-4 py-3 text-[#667085]">
                {pillar ? `${pillar.gan}${pillar.ji}` : "-"}
              </td>
              <td className="px-4 py-3 text-[#667085]">
                {pillar ? formatPercent(pillar.confidence) : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KeyValueGrid({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return <p className="rounded-[2px] border border-dashed border-[#d6d9de] p-4 text-sm text-[#667085]">아직 연결되지 않았습니다.</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div className="rounded-[2px] border border-[#d6d9de] bg-[#f8fafc] px-3 py-2 text-sm" key={key}>
          <span className="font-black text-[#344054]">{formatAppendixKey(key)} </span>
          <span className="text-[#667085]">{formatUnknown(value)}</span>
        </div>
      ))}
    </div>
  );
}

function AppendixView({ appendix }: { appendix: BlueprintAppendix }) {
  const relationData = {
    ...appendix.relations.stems,
    ...appendix.relations.branches,
  };
  const classicalTrace = appendix.classicalTrace ?? [];

  return (
    <section className="-mx-2 rounded-[2px] bg-[#eef1f4] px-4 py-8 text-[#344054] sm:-mx-4 sm:px-8">
      <p className="text-xs font-black tracking-[0.22em] text-[#6b7280]">기술 부록</p>
      <h1 className="mt-3 text-4xl font-black text-[#1f2933]">이 책의 근거</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#667085]">
        이 책은 다음 구조를 바탕으로 작성되었습니다.
      </p>

      <div className="mt-10 space-y-10 text-sm leading-6">
        <AppendixSection label="Appendix A" title="사주 원국">
          <PillarTable appendix={appendix} />
        </AppendixSection>

        <AppendixSection label="Appendix B" title="십성">
          <TenGodRows appendix={appendix} />
        </AppendixSection>

        <AppendixSection label="Appendix C" title="오행 분포">
          <ElementRows appendix={appendix} />
        </AppendixSection>

        <AppendixSection label="Appendix D" title="12운성">
          <TwelveStageRows appendix={appendix} />
        </AppendixSection>

        <AppendixSection label="Appendix E" title="지장간">
          <KeyValueGrid data={appendix.hiddenStems} />
        </AppendixSection>

        <AppendixSection label="Appendix F" title="합 · 충 · 형 · 파 · 해">
          <KeyValueGrid data={relationData} />
        </AppendixSection>

        <AppendixSection label="Appendix G" title="현재 운">
          <div className="grid gap-3">
            <div className="rounded-[2px] border border-[#d6d9de] bg-[#f8fafc] p-4">
              <p className="font-black text-[#1f2933]">대운</p>
              <p className="mt-2 text-[#667085]">{appendix.luck.currentDaeun?.ganji ?? "-"}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <PillarCell label="세운" pillar={appendix.luck.currentYear} />
              <PillarCell label="월운" pillar={appendix.luck.currentMonth} />
            </div>
          </div>
        </AppendixSection>

        <AppendixSection label="Appendix H" title="해석 근거">
          <div className="space-y-5">
            {classicalTrace.length === 0 ? (
              <p className="rounded-[2px] border border-dashed border-[#d6d9de] p-4 text-sm text-[#667085]">아직 연결되지 않았습니다.</p>
            ) : null}
            {classicalTrace.map((trace) => (
              <article className="rounded-[2px] border border-[#cfd3d8] bg-[#f8fafc] p-5" key={trace.chapterId}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6b7280]">Chapter {trace.chapterNo}</p>
                    <h3 className="mt-1 text-lg font-black text-[#1f2933]">{trace.chapterTitle}</h3>
                  </div>
                  <p className="rounded-full bg-[#e4e7ec] px-3 py-1 text-xs font-black text-[#344054]">
                    {formatPercent(trace.confidence)}
                  </p>
                </div>

                <div className="mt-5 grid gap-4">
                  <div>
                    <p className="font-black text-[#344054]">사주 원문</p>
                    <ul className="mt-2 space-y-1 text-[#667085]">
                      {trace.sajuOriginal.length ? trace.sajuOriginal.map((item) => (
                        <li key={item}>{item}</li>
                      )) : <li>아직 연결되지 않았습니다.</li>}
                    </ul>
                  </div>
                  <div>
                    <p className="font-black text-[#344054]">고전 해석</p>
                    <ul className="mt-2 space-y-1 text-[#667085]">
                      {trace.classical.length ? trace.classical.map((item) => (
                        <li key={item}>{item}</li>
                      )) : <li>아직 연결되지 않았습니다.</li>}
                    </ul>
                  </div>
                  <div>
                    <p className="font-black text-[#344054]">Blueprint 해석</p>
                    <ul className="mt-2 space-y-1 text-[#667085]">
                      {trace.blueprint.length ? trace.blueprint.map((item) => (
                        <li key={item}>{item}</li>
                      )) : <li>아직 연결되지 않았습니다.</li>}
                    </ul>
                  </div>
                  <div>
                    <p className="font-black text-[#344054]">근거 Source</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {trace.sources.length ? trace.sources.map((label) => (
                        <span className="rounded-full bg-[#e4e7ec] px-3 py-1 text-xs font-bold" key={label}>
                          {label}
                        </span>
                      )) : <span className="text-xs text-[#667085]">아직 연결되지 않았습니다.</span>}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </AppendixSection>
      </div>
    </section>
  );
}

function ReaderPanel({
  book,
  currentParagraphs,
  debugData,
  highlights,
  notes,
  onGoToNotes,
  showNotes,
}: {
  book: BlueprintBook;
  currentParagraphs: BlueprintParagraph[];
  debugData?: BlueprintDebugData;
  highlights: string[];
  notes: Record<string, string>;
  onGoToNotes: () => void;
  showNotes: boolean;
}) {
  const chapterHighlightCount = currentParagraphs.filter((paragraph) => highlights.includes(paragraph.id)).length;
  const noteCount = Object.values(notes).filter((note) => note.trim().length > 0).length;

  return (
    <aside className="hidden rounded-[2px] border border-[#d8cdbb] bg-[#fffaf0]/80 p-4 shadow-sm lg:block">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8a6b2e]">Reader</p>
      <div className="mt-5 space-y-4 text-sm leading-6 text-[#6f6253]">
        <div className="rounded-[2px] bg-[#fffdf8] p-4">
          <p className="font-black text-[#2f2922]">이어읽기</p>
          <p className="mt-2">읽던 장은 자동으로 내 서재에 보관됩니다.</p>
        </div>
        <div className="rounded-[2px] bg-[#fffdf8] p-4">
          <p className="font-black text-[#2f2922]">이 장의 밑줄</p>
          <p className="mt-2">{chapterHighlightCount}개</p>
        </div>
        {showNotes ? (
          <div className="rounded-[2px] bg-[#fffdf8] p-4">
            <p className="font-black text-[#2f2922]">My Notes</p>
            <p className="mt-2">{noteCount}개의 메모가 있습니다.</p>
            <button className="mt-3 rounded-full bg-[#2f2922] px-4 py-2 text-xs font-black text-[#fff8ec]" onClick={onGoToNotes} type="button">
              My Notes 열기
            </button>
          </div>
        ) : null}
        <div className="rounded-[2px] bg-[#fffdf8] p-4">
          <p className="font-black text-[#2f2922]">{book.metadata.publisher}</p>
          <p className="mt-2">{book.metadata.edition} · {book.metadata.publicationDate}</p>
        </div>
        {debugData ? (
          <details className="rounded-[2px] bg-[#1f1a15] p-4 text-[#fff8ec]">
            <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.18em] text-[#f7df9c]">
              Runtime Debug JSON
            </summary>
            <pre className="mt-4 max-h-[520px] overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-[#f8efe1]">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </details>
        ) : null}
      </div>
    </aside>
  );
}
