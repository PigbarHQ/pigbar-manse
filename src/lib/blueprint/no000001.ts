import { calculateManse, type ManseInput, type ManseResult } from "@/src/lib/manse";
import type { BlueprintBook, BlueprintCore } from "./types";
import { buildClassicalBlueprintBook, type ClassicalAnalysis } from "./classical";
import { buildBlueprintCore } from "./core";
import { buildReferenceBlueprintNo000001 } from "./referenceNo000001";
import { blueprintNo000001RuntimeInput } from "./runtime";
import { BLUEPRINT_AXIS_QUESTIONS, toReaderAxis } from "./types/axis";
import type { BlueprintAppendix, BlueprintCoreRuntime } from "./types/runtime";

export const blueprintNo000001Input = blueprintNo000001RuntimeInput;

function runtimeToReaderCore(runtime: BlueprintCoreRuntime): BlueprintCore {
  return {
    blueprintId: runtime.blueprintId,
    source: "pigbar-manse",
    axes: runtime.writerInput.axes.map((axisInput) => {
      const axisFeatures = runtime.features.filter((feature) => feature.axis === axisInput.axis);
      const confidence =
        axisFeatures.length === 0
          ? 0
          : Number(
              (
                axisFeatures.reduce((sum, feature) => sum + feature.confidence, 0) / axisFeatures.length
              ).toFixed(2),
            );

      return {
        axis: toReaderAxis(axisInput.axis),
        question: BLUEPRINT_AXIS_QUESTIONS[axisInput.axis],
        summary:
          runtime.reasons.find((reason) => reason.relatedAxes.includes(axisInput.axis))?.description ??
          "이 축은 Blueprint Runtime에서 계산된 구조를 바탕으로 정리됩니다.",
        confidence,
        evidence: axisFeatures.flatMap((feature) => feature.sourceRefs.map((source) => source.path)),
      };
    }),
    features: runtime.features.map((feature) => ({
      id: feature.id,
      axis: toReaderAxis(feature.axis),
      title: feature.title,
      summary: feature.description,
      score: feature.confidence,
      confidence: feature.confidence,
      evidence: feature.sourceRefs.map((source) => `${source.path}: ${source.value ?? "n/a"}`),
      writerHint: feature.writerHints[0] ?? "",
    })),
  };
}

export type BlueprintClassicalPublication = {
  manse: ManseResult;
  runtime: BlueprintCoreRuntime;
  book: BlueprintBook;
  classicalAnalysis: ClassicalAnalysis;
  classicalBook: BlueprintBook;
  referenceBook: BlueprintBook;
};

function buildBaseBook(runtime: BlueprintCoreRuntime, core: BlueprintCore): BlueprintBook {
  const authorName = runtime.authorName || runtime.manse.input.name || "이름 없음";

  return {
    metadata: {
      blueprintId: runtime.blueprintId,
      blueprintNo: runtime.blueprintNo,
      title: runtime.writerInput.suggestedTitle,
      subtitle: "명조 구조 분석",
      author: authorName,
      publisher: "Pigbar Publishing",
      edition: "초판",
      publicationDate: "2026-07-03",
      sourceName: "Pigbar Manse",
    },
    familyCollection: {
      id: "family-ju-collection",
      name: "The Ju Family Collection",
      label: "주 가족 컬렉션",
      description: "가족의 책들이 비교 없이 한 책장에 나란히 놓입니다.",
      volumes: [
        {
          volumeNo: 1,
          blueprintNo: runtime.blueprintNo,
          title: runtime.writerInput.suggestedTitle,
          author: authorName,
          status: "published",
        },
        {
          volumeNo: 2,
          blueprintNo: "No.000002",
          title: "출판 준비 중",
          author: "이진희",
          status: "planned",
        },
        {
          volumeNo: 3,
          blueprintNo: "No.000003",
          title: "출판 준비 중",
          author: "희준",
          status: "planned",
        },
        {
          volumeNo: 4,
          blueprintNo: "No.000004",
          title: "출판 준비 중",
          author: "현준",
          status: "planned",
        },
      ],
    },
    dedication: "Pigbar Manse가 계산한 명조를 기준으로 정리한다.",
    authorNote:
      "Classical Mode는 새로운 성격 라벨이나 Human Vocabulary를 만들지 않고, 계산된 명조 구조를 기존 명리학 분석 순서로 정리한다.",
    prologue: {
      title: "명조 확정",
      paragraphs: [],
    },
    core,
    chapters: [],
    myNotesPrompt: "Classical Mode와 기존 Blueprint 문장 사이에서 달라진 지점을 적어두세요.",
  };
}

function average(values: number[]) {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function classicalTraceSources(values: string[]) {
  const joined = values.join(" ");
  const sources = new Set<string>();

  if (joined.includes("년주") || joined.includes("년지")) sources.add("년주");
  if (joined.includes("월주") || joined.includes("월지") || joined.includes("月")) sources.add("월주");
  if (joined.includes("일주") || joined.includes("일간") || joined.includes("일지")) sources.add("일주");
  if (joined.includes("시주") || joined.includes("시지")) sources.add("시주");
  if (joined.includes("오행") || joined.includes("목 ") || joined.includes("화 ") || joined.includes("토 ") || joined.includes("금 ") || joined.includes("수 ")) sources.add("오행 분포");
  if (joined.includes("십성")) sources.add("십성");
  if (joined.includes("12운성")) sources.add("12운성");
  if (joined.includes("대운") || joined.includes("세운") || joined.includes("월운")) sources.add("현재 운");

  return Array.from(sources);
}

function buildClassicalTraceAppendix(
  appendix: BlueprintAppendix,
  analysis: ClassicalAnalysis,
): BlueprintAppendix {
  const pillarConfidence = average([
    appendix.pillars.year.confidence,
    appendix.pillars.month.confidence,
    appendix.pillars.day.confidence,
    appendix.pillars.hour?.confidence ?? 0,
  ].filter((value) => value > 0));

  return {
    ...appendix,
    reasonTrace: [],
    classicalTrace: analysis.sections.map((section) => {
      const sajuOriginal = section.layers.flatMap((layer) => layer.sajuOriginal);
      const classical = section.layers.flatMap((layer) => layer.classical);
      const blueprint = section.layers.flatMap((layer) => layer.blueprint);

      return {
        chapterId: section.id,
        chapterNo: section.order,
        chapterTitle: section.title,
        sajuOriginal,
        classical,
        blueprint,
        sources: classicalTraceSources([...sajuOriginal, ...classical]),
        confidence: Number(pillarConfidence.toFixed(2)),
      };
    }),
  };
}

export function buildBlueprintClassicalPublication(input: {
  manseInput: ManseInput;
  blueprintId?: string;
  blueprintNo?: string;
  edition?: string;
}): BlueprintClassicalPublication {
  const manse = calculateManse(input.manseInput);
  const authorName = manse.input.name || "이름 없음";
  const runtime = buildBlueprintCore(manse, {
    blueprintId: input.blueprintId ?? "bp-000001",
    blueprintNo: input.blueprintNo ?? "No.000001",
    authorName,
    edition: input.edition ?? "초판",
  });
  const core = runtimeToReaderCore(runtime);
  const baseBook = buildBaseBook(runtime, core);
  const classical = buildClassicalBlueprintBook({
    baseBook,
    manse,
  });
  runtime.writerInput.suggestedTitle = classical.analysis.suggestedTitle;
  const classicalAppendix = buildClassicalTraceAppendix(runtime.appendix, classical.analysis);
  const classicalRuntime = {
    ...runtime,
    appendix: classicalAppendix,
  };

  return {
    manse,
    runtime: classicalRuntime,
    book: baseBook,
    classicalAnalysis: classical.analysis,
    classicalBook: classical.book,
    referenceBook: buildReferenceBlueprintNo000001({
      blueprintBook: classical.book,
      runtime: classicalRuntime,
    }),
  };
}

export function buildBlueprintNo000001(): BlueprintClassicalPublication {
  return buildBlueprintClassicalPublication({
    manseInput: blueprintNo000001RuntimeInput,
    blueprintId: "bp-000001",
    blueprintNo: "No.000001",
    edition: "초판",
  });
}
