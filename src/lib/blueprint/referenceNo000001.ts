import type { BlueprintBook, BlueprintChapter, BlueprintCore, BlueprintParagraph } from "./types";
import type { BlueprintCoreRuntime } from "./types/runtime";

const referenceStatements = [
  "움직이는 사람",
  "사람을 연결하는 사람",
  "구조를 만드는 사람",
  "큰 그림을 보는 사람",
  "사업가형",
  "실행가",
  "시스템을 만드는 사람",
  "한곳에 머무르지 않는 사람",
  "구설을 감수하는 사람",
  "책임을 피하지 않는 사람",
  "사람보다 구조를 보는 사람",
];

const chapterStatements: Record<number, string[]> = {
  1: ["움직이는 사람", "구조를 만드는 사람", "책임을 피하지 않는 사람"],
  2: ["큰 그림을 보는 사람", "사람보다 구조를 보는 사람", "시스템을 만드는 사람"],
  3: ["실행가", "책임을 피하지 않는 사람", "구조를 만드는 사람"],
  4: ["사람을 연결하는 사람", "구설을 감수하는 사람", "사람보다 구조를 보는 사람"],
  5: ["구설을 감수하는 사람", "사람을 연결하는 사람", "한곳에 머무르지 않는 사람"],
  6: ["사업가형", "실행가", "시스템을 만드는 사람"],
  7: ["구설을 감수하는 사람", "한곳에 머무르지 않는 사람", "사람보다 구조를 보는 사람"],
  8: ["사업가형", "구조를 만드는 사람", "큰 그림을 보는 사람"],
  9: ["시스템을 만드는 사람", "한곳에 머무르지 않는 사람", "실행가"],
  10: ["움직이는 사람", "한곳에 머무르지 않는 사람", "큰 그림을 보는 사람"],
  11: ["책임을 피하지 않는 사람", "시스템을 만드는 사람", "구조를 만드는 사람"],
  12: ["움직이는 사람", "사람을 연결하는 사람", "사업가형"],
};

function compact(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value));
}

function elementSummary(elements: Record<string, number>) {
  return [
    `목 ${elements.wood ?? 0}`,
    `화 ${elements.fire ?? 0}`,
    `토 ${elements.earth ?? 0}`,
    `금 ${elements.metal ?? 0}`,
    `수 ${elements.water ?? 0}`,
  ];
}

function pillarEvidence(runtime: BlueprintCoreRuntime) {
  const pillars = runtime.canonicalManseInput.pillars;

  return compact([
    `년주 ${pillars.year.label}(${pillars.year.gan}${pillars.year.ji})`,
    `월주 ${pillars.month.label}(${pillars.month.gan}${pillars.month.ji})`,
    `일주 ${pillars.day.label}(${pillars.day.gan}${pillars.day.ji})`,
    pillars.hour ? `시주 ${pillars.hour.label}(${pillars.hour.gan}${pillars.hour.ji})` : null,
  ]);
}

function tenGodEvidence(runtime: BlueprintCoreRuntime) {
  const pillars = runtime.canonicalManseInput.pillars;
  const tenGods = runtime.canonicalManseInput.tenGods;

  return compact([
    `년주 ${pillars.year.label} — ${tenGods[pillars.year.label] ?? "-"}`,
    `월주 ${pillars.month.label} — ${tenGods[pillars.month.label] ?? "-"}`,
    `일주 ${pillars.day.label} — ${tenGods[pillars.day.label] ?? "-"}`,
    pillars.hour ? `시주 ${pillars.hour.label} — ${tenGods[pillars.hour.label] ?? "-"}` : null,
  ]);
}

function twelveStageEvidence(runtime: BlueprintCoreRuntime) {
  const stages = runtime.canonicalManseInput.twelveStages;

  return compact([
    `년주 ${stages.year ?? "-"}`,
    `월주 ${stages.month ?? "-"}`,
    `일주 ${stages.day ?? "-"}`,
    `시주 ${stages.hour ?? "-"}`,
  ]);
}

function relationEvidence(runtime: BlueprintCoreRuntime) {
  const relations = runtime.canonicalManseInput.relations;
  const stems = Object.keys(relations.stems);
  const branches = Object.keys(relations.branches);

  if (stems.length === 0 && branches.length === 0) {
    return ["현재 구현된 합충형파해 데이터 없음"];
  }

  return [...stems.map((item) => `천간 ${item}`), ...branches.map((item) => `지지 ${item}`)];
}

function luckEvidence(runtime: BlueprintCoreRuntime) {
  const luck = runtime.canonicalManseInput.luck;

  return compact([
    luck.currentDaeun ? `대운 ${luck.currentDaeun.ganji}` : null,
    `세운 ${luck.currentYear.label}`,
    `월운 ${luck.currentMonth.label}`,
  ]);
}

function evidence(runtime: BlueprintCoreRuntime): BlueprintParagraph["referenceEvidence"] {
  return {
    saju: [...pillarEvidence(runtime), ...twelveStageEvidence(runtime)],
    tenGods: tenGodEvidence(runtime),
    elements: elementSummary(runtime.canonicalManseInput.elements),
    relations: relationEvidence(runtime),
    luck: luckEvidence(runtime),
  };
}

function p(id: string, text: string, runtime: BlueprintCoreRuntime): BlueprintParagraph {
  return {
    id,
    text,
    featureIds: [],
    referenceEvidence: evidence(runtime),
  };
}

function referenceCore(runtime: BlueprintCoreRuntime): BlueprintCore {
  return {
    blueprintId: `${runtime.blueprintId}-reference`,
    source: "pigbar-manse",
    axes: [],
    features: [],
  };
}

function referenceChapter(source: BlueprintChapter, runtime: BlueprintCoreRuntime): BlueprintChapter {
  const statements = chapterStatements[source.chapterNo] ?? referenceStatements.slice(0, 3);

  return {
    id: `reference-${source.id}`,
    chapterNo: source.chapterNo,
    title: source.title,
    question: source.question,
    opening: "기존 명리학 풀이 스타일 기준으로 정리한다.",
    paragraphs: statements.map((statement, index) =>
      p(`reference-c${source.chapterNo}-p${index + 1}`, statement, runtime),
    ),
    closing: "위 문장은 현재 Pigbar Manse 계산값을 기준으로 둔 Reference 문장이다.",
  };
}

export function buildReferenceBlueprintNo000001(input: {
  blueprintBook: BlueprintBook;
  runtime: BlueprintCoreRuntime;
}): BlueprintBook {
  return {
    ...input.blueprintBook,
    metadata: {
      ...input.blueprintBook.metadata,
      blueprintId: `${input.blueprintBook.metadata.blueprintId}-reference`,
      title: "Reference Blueprint",
      subtitle: "기존 명리학 풀이 기준서",
      sourceName: "Pigbar Manse Reference",
    },
    dedication: "비교를 위한 기준서입니다.",
    authorNote: "새 해석을 만들지 않고, 현재 계산된 사주와 기존 표현을 기준으로 정리합니다.",
    prologue: {
      title: "Reference",
      paragraphs: [
        p("reference-prologue-1", "주영지 사주는 갑인년 신미월 임신일 임인시를 기준으로 본다.", input.runtime),
        p("reference-prologue-2", "이 책은 Blueprint 문체를 적용하지 않은 비교 기준서이다.", input.runtime),
      ],
    },
    core: referenceCore(input.runtime),
    chapters: input.blueprintBook.chapters.map((chapter) => referenceChapter(chapter, input.runtime)),
    myNotesPrompt: "Reference Book을 보며 Blueprint Book과 달라진 지점을 적어두세요.",
  };
}
