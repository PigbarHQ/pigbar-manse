import type { BlueprintAppendix } from "@/src/lib/blueprint/types/runtime";
import type { BlueprintBook } from "@/src/lib/blueprint/types";
import type { ManseInput } from "@/src/lib/manse";

export type ManuscriptSource = "GPT" | "Legacy" | "Empty";

export const emptyBlueprintAppendix: BlueprintAppendix = {
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
  classicalTrace: [],
  reasonTrace: [],
};

export function buildEmptyBlueprintBook(input: ManseInput): BlueprintBook {
  return {
    metadata: {
      blueprintId: "bp-empty",
      blueprintNo: "No.000001",
      title: "GPT Blueprint 생성 필요",
      subtitle: "Blueprint Writer",
      author: input.name ?? "주영지",
      publisher: "Pigbar Blueprint",
      edition: "초판",
      publicationDate: "2026-07-05",
      sourceName: "Empty",
    },
    familyCollection: {
      id: "pigbar-empty-shelf",
      name: "Blueprint Shelf",
      label: "Blueprint Shelf",
      description: "GPT Writer 결과가 생성되면 이 자리에 책이 놓입니다.",
      volumes: [
        {
          volumeNo: 1,
          blueprintNo: "No.000001",
          title: "GPT Blueprint 생성 필요",
          author: input.name ?? "주영지",
          status: "planned",
        },
      ],
    },
    dedication: "GPT Blueprint 생성 필요",
    authorNote: "Book Mode는 GPT Writer 결과가 생성된 뒤에만 원고를 표시합니다.",
    prologue: {
      title: "GPT Blueprint 생성 필요",
      paragraphs: [],
    },
    core: {
      blueprintId: "bp-empty",
      source: "pigbar-manse",
      axes: [],
      features: [],
    },
    chapters: [],
    myNotesPrompt: "",
  };
}

export function buildEmptyBlueprintPublication(manseInput: ManseInput) {
  const book = buildEmptyBlueprintBook(manseInput);

  return {
    appendix: emptyBlueprintAppendix,
    book,
    debugData: {
      appendix: emptyBlueprintAppendix,
      canonicalManseInput: null,
      classicalAnalysis: null,
      features: [],
      reasons: [],
      writerInput: null,
      writerRuntime: null,
    },
    manseInput,
    manuscriptSource: "Empty" as const,
  };
}
