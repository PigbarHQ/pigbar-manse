import type {
  BlueprintReason,
  BlueprintWriterRuntime,
  ChapterDraft,
  ChapterEditHistoryEntry,
  ChapterOutline,
  ChapterQuality,
  ChapterReasonTrace,
  ChapterRuntime,
  HumanVocabulary,
  WriterInput,
} from "../types/runtime";

type WriterChapterInput = WriterInput["chapterInputs"][number];

function reasonMap(writerInput: WriterInput) {
  return new Map(writerInput.reasons.map((reason) => [reason.id, reason]));
}

function vocabularyMap(writerInput: WriterInput) {
  return new Map(writerInput.vocabulary.map((item) => [item.id, item]));
}

function vocabularyForIds(vocabulary: Map<string, HumanVocabulary>, ids: string[]) {
  return ids.map((id) => vocabulary.get(id)).filter((item): item is HumanVocabulary => Boolean(item));
}

function traceForChapter(chapter: WriterChapterInput, writerInput: WriterInput): ChapterReasonTrace[] {
  const reasons = reasonMap(writerInput);

  return chapter.annotationSeeds.map((seed) => {
    const reason = reasons.get(seed.reasonId);
    const sourcePaths = reason?.evidence.map((item) => item.path) ?? [];

    return {
      reasonId: seed.reasonId,
      reasonTitle: reason?.title ?? seed.reasonId,
      featureIds: seed.featureIds,
      vocabularyIds: seed.vocabularyIds,
      sajuSourcePaths: Array.from(new Set(sourcePaths)),
      confidence: seed.confidence,
    };
  });
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function primaryReason(trace: ChapterReasonTrace[], reasons: Map<string, BlueprintReason>) {
  const firstTrace = trace[0];
  if (!firstTrace) return null;

  return reasons.get(firstTrace.reasonId) ?? null;
}

function primaryVocabulary(trace: ChapterReasonTrace[], vocabulary: Map<string, HumanVocabulary>) {
  const ids = Array.from(new Set(trace.flatMap((item) => item.vocabularyIds)));

  return vocabularyForIds(vocabulary, ids).slice(0, 4);
}

function draftParagraphText(input: {
  chapter: WriterChapterInput;
  outline: ChapterOutline;
  reason: BlueprintReason | null;
  vocabulary: HumanVocabulary[];
}) {
  const reasonTitle = input.reason?.title ?? input.outline.thesis;
  const reasonDescription = input.reason?.description ?? "이 장은 계산된 구조를 독자가 읽을 수 있는 문장으로 풀어낸다.";
  const sourcePaths = Array.from(new Set(input.outline.reasonTrace.flatMap((trace) => trace.sajuSourcePaths))).join(" · ");

  return [
    `${input.chapter.title}에서는 고전 분석에서 반복 확인된 구조만 본문에 남긴다.`,
    `${reasonTitle}는 이 장의 중심 근거입니다. ${reasonDescription}`,
    `근거 경로는 ${sourcePaths || "계산 원국"}이며, 문장은 의미를 더하지 않고 현대 한국어로만 다듬는다.`,
  ];
}

function qualityFor(input: {
  finalText: string;
  outline: ChapterOutline;
  trace: ChapterReasonTrace[];
}): ChapterQuality {
  const confidence = average(input.trace.map((trace) => trace.confidence));
  const hasReason = input.trace.length > 0;
  const avoidsBlockedPhrases = input.outline.avoidPhrases.every((phrase) => !input.finalText.includes(phrase));
  const hasEnoughText = input.finalText.length >= 80;

  return {
    score: clampPercent(confidence * 100 + (hasReason ? 4 : -12) + (avoidsBlockedPhrases ? 3 : -10) + (hasEnoughText ? 3 : -8)),
    confidence: Number(confidence.toFixed(2)),
    checks: [
      { id: "HAS_REASON_TRACE", label: "Reason trace 연결", passed: hasReason },
      { id: "AVOID_PHRASES", label: "금지 표현 회피", passed: avoidsBlockedPhrases },
      { id: "TEXT_READY", label: "본문 길이 확보", passed: hasEnoughText },
    ],
  };
}

export function buildOutline(chapter: WriterChapterInput, writerInput: WriterInput): ChapterOutline {
  const trace = traceForChapter(chapter, writerInput);
  const reasons = reasonMap(writerInput);
  const vocabulary = vocabularyMap(writerInput);
  const primary = primaryReason(trace, reasons);
  const vocabularyItems = primaryVocabulary(trace, vocabulary);

  return {
    chapterId: chapter.chapterId,
    chapterNo: chapter.chapterNo,
    title: chapter.title,
    targetQuestion: chapter.targetQuestion,
    thesis: primary?.title ?? `${chapter.title}의 구조를 정리한다`,
    reasonIds: chapter.relatedReasons,
    keyPoints: [
      primary?.description ?? chapter.targetQuestion,
      ...vocabularyItems.map((item) => item.name),
    ].slice(0, 5),
    requiredTone: chapter.requiredTone,
    avoidPhrases: chapter.avoidPhrases,
    reasonTrace: trace,
  };
}

export function buildDraft(outline: ChapterOutline, writerInput: WriterInput): ChapterDraft {
  const chapter = writerInput.chapterInputs.find((item) => item.chapterId === outline.chapterId);
  const reasons = reasonMap(writerInput);
  const vocabulary = vocabularyMap(writerInput);
  const reason = primaryReason(outline.reasonTrace, reasons);
  const vocabularyItems = primaryVocabulary(outline.reasonTrace, vocabulary);
  const paragraphTexts = draftParagraphText({
    chapter: chapter ?? {
      chapterId: outline.chapterId,
      chapterNo: outline.chapterNo,
      title: outline.title,
      targetQuestion: outline.targetQuestion,
      relatedReasons: outline.reasonIds,
      requiredTone: outline.requiredTone,
      avoidPhrases: outline.avoidPhrases,
      annotationSeeds: [],
    },
    outline,
    reason,
    vocabulary: vocabularyItems,
  });

  return {
    chapterId: outline.chapterId,
    paragraphs: paragraphTexts.map((text, index) => ({
      paragraphId: `${outline.chapterId}_draft_${index + 1}`,
      text,
      reasonIds: outline.reasonTrace.map((trace) => trace.reasonId),
      featureIds: Array.from(new Set(outline.reasonTrace.flatMap((trace) => trace.featureIds))),
      vocabularyIds: Array.from(new Set(outline.reasonTrace.flatMap((trace) => trace.vocabularyIds))),
    })),
  };
}

export function rewriteDraft(draft: ChapterDraft): ChapterDraft {
  return {
    ...draft,
    paragraphs: draft.paragraphs.map((paragraph, index) => ({
      ...paragraph,
      paragraphId: paragraph.paragraphId.replace("_draft_", "_rewrite_"),
      text:
        index === 0
          ? paragraph.text.replace("본문에 남긴다", "본문으로 옮긴다")
          : paragraph.text,
    })),
  };
}

export function editDraft(draft: ChapterDraft, outline: ChapterOutline): {
  draft: ChapterDraft;
  editHistory: ChapterEditHistoryEntry[];
} {
  const editedParagraphs = draft.paragraphs.map((paragraph) => {
    const text = outline.avoidPhrases.reduce(
      (nextText, phrase) => nextText.replaceAll(phrase, "단정할 수 없는"),
      paragraph.text,
    );

    return {
      ...paragraph,
      paragraphId: paragraph.paragraphId.replace("_rewrite_", "_edit_"),
      text,
    };
  });

  return {
    draft: {
      ...draft,
      paragraphs: editedParagraphs,
    },
    editHistory: [
      {
        stage: "outline",
        changes: ["Chapter input에서 중심 Reason과 핵심 Vocabulary를 골랐다."],
      },
      {
        stage: "draft",
        changes: ["Outline을 세 문단의 초안으로 펼쳤다."],
      },
      {
        stage: "rewrite",
        changes: ["설명 문장을 책 문장에 가까운 흐름으로 다듬었다."],
      },
      {
        stage: "edit",
        changes: ["금지 표현을 점검하고 근거 없는 단정을 제거했다."],
      },
    ],
  };
}

export function finalizeChapter(outline: ChapterOutline, draft: ChapterDraft): ChapterRuntime {
  const finalText = draft.paragraphs.map((paragraph) => paragraph.text).join("\n\n");
  const quality = qualityFor({
    finalText,
    outline,
    trace: outline.reasonTrace,
  });

  return {
    chapterId: outline.chapterId,
    chapterNo: outline.chapterNo,
    title: outline.title,
    outline,
    draft,
    editHistory: [
      {
        stage: "final",
        changes: ["편집된 Draft를 Chapter finalText로 확정했다."],
      },
    ],
    finalText,
    quality,
    reasonTrace: outline.reasonTrace,
  };
}

export function buildChapterRuntime(chapter: WriterChapterInput, writerInput: WriterInput): ChapterRuntime {
  const outline = buildOutline(chapter, writerInput);
  const draft = buildDraft(outline, writerInput);
  const rewrittenDraft = rewriteDraft(draft);
  const edited = editDraft(rewrittenDraft, outline);
  const finalized = finalizeChapter(outline, edited.draft);

  return {
    ...finalized,
    editHistory: [...edited.editHistory, ...finalized.editHistory],
  };
}

export function buildWriterRuntime(writerInput: WriterInput): BlueprintWriterRuntime {
  const chapters = writerInput.chapterInputs.map((chapter) => buildChapterRuntime(chapter, writerInput));
  const quality = qualityFor({
    finalText: chapters.map((chapter) => chapter.finalText).join("\n\n"),
    outline: chapters[0]?.outline ?? buildOutline(writerInput.chapterInputs[0], writerInput),
    trace: chapters.flatMap((chapter) => chapter.reasonTrace),
  });

  return {
    bookId: writerInput.bookId,
    blueprintNo: writerInput.blueprintNo,
    chapters,
    quality,
  };
}
