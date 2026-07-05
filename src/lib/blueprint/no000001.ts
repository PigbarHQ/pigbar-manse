import { calculateManse, type ManseInput, type ManseResult } from "@/src/lib/manse";
import type { BlueprintBook, BlueprintChapter, BlueprintCore } from "./types";
import { buildClassicalBlueprintBook, type ClassicalAnalysis } from "./classical";
import { buildBlueprintCore } from "./core";
import { buildReferenceBlueprintNo000001 } from "./referenceNo000001";
import { blueprintNo000001RuntimeInput } from "./runtime";
import { BLUEPRINT_AXIS_QUESTIONS, toReaderAxis } from "./types/axis";
import type { BlueprintAppendix, BlueprintCoreRuntime, ChapterManuscript, ClassicalWriterInputItem } from "./types/runtime";
import { buildWriterRuntime } from "./writer";

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

type CoreThemeId = "flow" | "center" | "search" | "balance";
type ComposerPattern = "A" | "B" | "C" | "D" | "E";
type SceneThemeId = "water" | "fire" | "path" | "forest";

type BookCoreTheme = {
  id: CoreThemeId;
  label: string;
  openingTitle: string;
  titleSeed: string;
};

type BookStructureChapter = {
  id: string;
  writerItem: ClassicalWriterInputItem;
  sourceSection: ClassicalAnalysis["sections"][number] | null;
  sourceTitle: string;
  role: string;
  sceneSymbol: string;
  title: string;
  question: string;
  scene: string;
  pattern: ComposerPattern;
  structuralLines: string[];
  translationLines: string[];
};

type BookStructure = {
  coreTheme: BookCoreTheme;
  sceneTheme: SceneTheme;
  secondaryThemes: string[];
  chapters: BookStructureChapter[];
};

const elementKoLabels: Record<string, string> = {
  wood: "목",
  fire: "화",
  earth: "토",
  metal: "금",
  water: "수",
};

const sectionRoles: Record<string, string> = {
  "명조 확정": "origin",
  "명조 핵심 구조": "structure",
  "적천수 관점": "source",
  "궁통보감 관점": "season",
  "육친론": "relation",
  "용신·상신": "activation",
  "병약론": "empty-place",
  "체용론": "body-use",
  "희기신론": "living-force",
  "리더십 구조": "direction",
  "재물 생성 구조": "value",
  "후반 인생 구조": "later-time",
  "최종 종합 검증": "verification",
  "최종 압축": "compression",
  "기능적 역할 구조": "role",
  "반복 충돌 구조": "friction",
  "기능이 살아나는 환경": "environment",
  "구조적 한계": "limit",
  "최종 한 문장": "final-line",
};

const roleObjects: Record<string, string> = {
  origin: "처음의 방향",
  structure: "놓인 순서",
  source: "깊은 물길",
  season: "계절의 속도",
  relation: "서로 닿는 자리",
  activation: "살아나는 순서",
  "empty-place": "비어 있는 자리",
  "body-use": "중심과 쓰임",
  "living-force": "살아나는 힘",
  direction: "방향의 기준",
  value: "남는 가치",
  "later-time": "늦은 계절",
  verification: "다시 확인한 문장",
  compression: "짧아진 말",
  role: "작동하는 역할",
  friction: "반복의 경계",
  environment: "살아나는 자리",
  limit: "좁아지는 위치",
  "final-line": "마지막 방향",
  "theme-gate": "책의 입구",
  "theme-shadow": "보조 주제",
};

const themeLanguage: Record<CoreThemeId, {
  label: string;
  openingTitle: string;
  titleSeed: string;
  actions: string[];
  questions: string[];
  closings: string[];
}> = {
  flow: {
    label: "흐름",
    openingTitle: "강은 자신이 바다를 향하고 있다는 사실을 모른다",
    titleSeed: "흐르는 것은 방향을 먼저 말하지 않는다",
    actions: ["흘러", "이어져", "낮아져", "돌아", "번져"],
    questions: ["사람은 무엇으로 자신의 방향을 알게 될까", "반복되는 움직임은 언제 하나의 길이 될까", "흐름은 어디에서 막히고 어디에서 살아날까"],
    closings: ["방향", "흐름", "물길", "유통"],
  },
  center: {
    label: "중심",
    openingTitle: "오래 지켜낸 것은 쉽게 흔들리지 않는다",
    titleSeed: "오래 지켜낸 것은 쉽게 흔들리지 않는다",
    actions: ["버텨", "지켜", "붙들어", "가라앉아", "모여"],
    questions: ["사람은 무엇을 붙들고 흔들림을 견딜까", "중심은 언제 드러날까", "오래 남는 것은 어떤 순서로 만들어질까"],
    closings: ["중심", "자리", "기준", "무게"],
  },
  search: {
    label: "탐색",
    openingTitle: "처음 걷는 길은 목적지를 알지 못한다",
    titleSeed: "처음 걷는 길은 목적지를 알지 못한다",
    actions: ["찾아", "건너", "살펴", "열어", "돌아보며"],
    questions: ["사람은 언제 낯선 길을 자기 길로 받아들일까", "탐색은 어디에서 방향이 될까", "처음 보는 길은 무엇을 먼저 가르칠까"],
    closings: ["탐색", "길", "질문", "다음 자리"],
  },
  balance: {
    label: "균형",
    openingTitle: "저울은 한쪽 접시만으로 움직이지 않는다",
    titleSeed: "저울은 한쪽 접시만으로 움직이지 않는다",
    actions: ["맞춰", "나눠", "견줘", "기울어", "돌려"],
    questions: ["사람은 무엇을 함께 놓아야 균형을 잃지 않을까", "한쪽의 힘은 언제 다른 쪽을 부를까", "균형은 어디에서 다시 조정될까"],
    closings: ["균형", "조정", "분별", "자리"],
  },
};

type SceneTheme = {
  id: SceneThemeId;
  label: string;
  symbols: string[];
};

const sceneThemes: Record<SceneThemeId, SceneTheme> = {
  water: {
    id: "water",
    label: "물",
    symbols: [
      "강",
      "시내",
      "호수",
      "비",
      "안개",
      "바다",
      "밀물",
      "썰물",
      "여울",
      "물결",
      "수면",
      "물안개",
      "포말",
      "물살",
      "조류",
      "파문",
      "샘",
      "개울",
      "물가",
      "소금기",
      "깊은 물",
    ],
  },
  fire: {
    id: "fire",
    label: "불",
    symbols: [
      "등불",
      "촛불",
      "난로",
      "재",
      "새벽",
      "온기",
      "불씨",
      "화로",
      "연기",
      "심지",
      "불빛",
      "잔열",
      "노을",
      "햇살",
      "모닥불",
      "숯",
      "열기",
      "아침빛",
      "등잔",
      "불꽃",
      "온돌",
    ],
  },
  path: {
    id: "path",
    label: "길",
    symbols: [
      "골목",
      "길",
      "다리",
      "갈림길",
      "언덕",
      "지도",
      "표지판",
      "모퉁이",
      "계단",
      "문턱",
      "발자국",
      "이정표",
      "능선",
      "오솔길",
      "건널목",
      "길목",
      "터널",
      "나침반",
      "광장",
      "경계석",
      "먼 길",
    ],
  },
  forest: {
    id: "forest",
    label: "숲",
    symbols: [
      "씨앗",
      "나무",
      "뿌리",
      "숲",
      "잎",
      "바람",
      "가지",
      "그늘",
      "이끼",
      "흙",
      "새순",
      "나이테",
      "수풀",
      "풀잎",
      "나무껍질",
      "숲길",
      "열매",
      "낙엽",
      "가지끝",
      "초록",
      "묘목",
    ],
  },
};

function compact(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value));
}

function hasBatchim(value: string) {
  const last = value[value.length - 1];
  const code = last.charCodeAt(0);

  return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
}

function subjectParticle(value: string) {
  return hasBatchim(value) ? "은" : "는";
}

function objectParticle(value: string) {
  return hasBatchim(value) ? "을" : "를";
}

function elementFlow(runtime: BlueprintCoreRuntime) {
  return runtime.writerInput.sourceSummary.elementFlow;
}

function elementFlowText(runtime: BlueprintCoreRuntime) {
  return elementFlow(runtime).join(" -> ") || "오행의 작동 순서";
}

function strongestElement(runtime: BlueprintCoreRuntime) {
  const strongest = Object.entries(runtime.writerInput.sourceSummary.elements).sort((a, b) => b[1] - a[1])[0];

  return strongest ? (elementKoLabels[strongest[0]] ?? strongest[0]) : "오행";
}

function missingElements(runtime: BlueprintCoreRuntime) {
  return Object.entries(runtime.writerInput.sourceSummary.elements)
    .filter(([, value]) => value === 0)
    .map(([key]) => elementKoLabels[key] ?? key);
}

function selectCoreTheme(runtime: BlueprintCoreRuntime): BookCoreTheme {
  const flow = elementFlow(runtime);
  const flowKey = flow.join("-");
  const missing = missingElements(runtime);
  const strongest = strongestElement(runtime);
  let id: CoreThemeId = "balance";

  if (flowKey === "금-수-목") {
    id = "flow";
  } else if (flow.length >= 4 && strongest === "수") {
    id = "center";
  } else if (missing.length > 0 || flow[0] === "수") {
    id = "search";
  }

  const language = themeLanguage[id];

  return {
    id,
    label: language.label,
    openingTitle: language.openingTitle,
    titleSeed: language.titleSeed,
  };
}

function selectSceneTheme(theme: BookCoreTheme): SceneTheme {
  const sceneByCoreTheme: Record<CoreThemeId, SceneThemeId> = {
    flow: "water",
    center: "fire",
    search: "path",
    balance: "forest",
  };

  return sceneThemes[sceneByCoreTheme[theme.id]];
}

function secondaryThemes(runtime: BlueprintCoreRuntime, analysis: ClassicalAnalysis) {
  return compact([
    `${strongestElement(runtime)} 분포`,
    elementFlowText(runtime),
    missingElements(runtime).length ? `${missingElements(runtime).join("·")} 공백` : null,
    analysis.sections.some((section) => section.title.includes("후반")) ? "현재 운" : null,
  ]).slice(0, 3);
}

function sectionRole(section: ClassicalAnalysis["sections"][number]) {
  return sectionRoles[section.title] ?? "structure";
}

function cleanUserLine(value: string) {
  return value
    .replaceAll("이 명조는", "원국에서는")
    .replaceAll("이 명조의", "원국의")
    .replaceAll("사주 근거는 각 문장 아래에 붙인다.", "")
    .trim();
}

function sectionClassicalLines(section: ClassicalAnalysis["sections"][number]) {
  return section.layers.flatMap((layer) => layer.classical).map(cleanUserLine).filter(Boolean).slice(0, 3);
}

function sectionBlueprintLines(section: ClassicalAnalysis["sections"][number]) {
  return section.layers.flatMap((layer) => layer.blueprint).map(cleanUserLine).filter(Boolean).slice(0, 2);
}

function classicalAnalysisToWriterInput(analysis: ClassicalAnalysis): ClassicalWriterInputItem[] {
  return analysis.sections.map((section) => {
    const evidence = section.layers.flatMap((layerItem) => layerItem.sajuOriginal).map(cleanUserLine).filter(Boolean);
    const structure = section.layers.flatMap((layerItem) => layerItem.classical).map(cleanUserLine).filter(Boolean).join("\n");
    const interpretation = section.layers.flatMap((layerItem) => layerItem.blueprint).map(cleanUserLine).filter(Boolean).join("\n");

    return {
      index: section.order,
      title: section.title,
      sourceText: evidence.join(" / "),
      evidence,
      structure,
      interpretation,
    };
  });
}

function sceneSymbolForChapter(index: number, sceneTheme: SceneTheme) {
  return sceneTheme.symbols[index % sceneTheme.symbols.length];
}

function firstSentence(value: string) {
  return value
    .split(/(?<=다\.)\s+|(?<=다\.)\n+/)
    .map((item) => item.trim())
    .find(Boolean) ?? value.trim();
}

const editorialTitleByRole: Record<string, string> = {
  origin: "처음은 네 기둥에서 시작된다",
  structure: "흐름은 반복에서 보인다",
  source: "흐르는 곳에서 살아난다",
  season: "계절은 속도를 바꾼다",
  relation: "자리는 서로를 비춘다",
  activation: "살아나는 순서가 있다",
  "empty-place": "빈 곳도 구조를 말한다",
  "body-use": "쓰임은 본체에서 나온다",
  "living-force": "살아나는 힘과 무게",
  direction: "방향은 배치에서 나온다",
  value: "가치는 지나간 뒤에 남는다",
  "later-time": "늦은 시간은 순서를 본다",
  verification: "다시 확인한 것만 남는다",
  compression: "짧아질수록 방향이 남는다",
  role: "기능은 배치에서 산다",
  friction: "반복은 경계를 만든다",
  environment: "살아나는 자리가 있다",
  limit: "막히는 곳에서 한계가 보인다",
  "final-line": "마지막에는 작동만 남는다",
};

function titleFromClassicalItem(item: ClassicalWriterInputItem, role: string) {
  if (role === "source") {
    const month = item.interpretation.match(/([가-힣])월/)?.[1];

    if (month) return `${month}월의 흐름`;
  }

  const fallback = firstSentence(item.interpretation || item.structure || item.sourceText)
    .replace(/^이 명조는\s*/, "")
    .replace(/^원국에서는\s*/, "")
    .replace("해야 한다.", "한다.")
    .replace(/보여준다\.$/, "보여 준다.")
    .replace(/\.$/, "")
    .slice(0, 25)
    .trim();

  return editorialTitleByRole[role] ?? (fallback || item.title);
}

function questionForChapter(input: { index: number; role: string; theme: BookCoreTheme; item: ClassicalWriterInputItem }) {
  const language = themeLanguage[input.theme.id];
  const starter = language.questions[input.index % language.questions.length];
  const object = roleObjects[input.role] ?? "구조";

  if (input.index === 0 && input.theme.id === "flow") {
    return `사람은 무엇으로 자신의 삶을 설명할 수 있을까.\n이름일까.\n직업일까.\n아니면 살아온 시간일까.`;
  }

  return `${starter}, ${object}${subjectParticle(object)} 어디에서 자기 모습을 드러낼까.\n한 사람을 빠르게 부르는 이름보다 오래 남는 것은, ${object}${objectParticle(object)} 향해 되돌아오는 움직임이다.`;
}

function sceneForChapter(input: { role: string; sceneSymbol: string }) {
  const subject = input.sceneSymbol;
  const object = roleObjects[input.role] ?? "자리";

  return `${subject}${subjectParticle(subject)} ${object}${objectParticle(object)} 한 번에 보여 주지 않는다.\n${subject}${subjectParticle(subject)} 오늘도 조금 같은 쪽으로 움직이고,\n그 움직임은 ${object}${objectParticle(object)} 천천히 드러낸다.`;
}

function classicalEntryForChapter(chapter: BookStructureChapter) {
  const source = chapter.writerItem.sourceText;

  return `${chapter.writerItem.title}에서 고전의 언어는 이름보다 배치를 본다.\n${chapter.sceneSymbol} 아래에는 ${source} 같은 표지가 조용히 깔린다.`;
}

function closingForChapter(input: { index: number; role: string; theme: BookCoreTheme }) {
  const language = themeLanguage[input.theme.id];
  const noun = language.closings[input.index % language.closings.length];
  const object = roleObjects[input.role] ?? "자리";

  return `${object}${subjectParticle(object)} 결론이 아니라, ${noun}${objectParticle(noun)} 다시 읽게 하는 조용한 표식으로 남는다.`;
}

function evidenceToken(item: ClassicalWriterInputItem, pattern: RegExp) {
  return item.sourceText.match(pattern)?.[0] ?? null;
}

function elementPhrase(item: ClassicalWriterInputItem) {
  const elements = item.evidence.filter((value) => /^[목화토금수] \d/.test(value));

  return elements.length ? elements.join(", ") : item.sourceText;
}

function monthPhrase(item: ClassicalWriterInputItem) {
  const month = item.interpretation.match(/([가-힣])월/)?.[1] ?? item.structure.match(/월지 ([가-힣])/)?.[1];

  return month ? `${month}월` : "놓인 계절";
}

function sourceTokenLine(item: ClassicalWriterInputItem) {
  const stem = evidenceToken(item, /[甲乙丙丁戊己庚辛壬癸][木火土金水]?/) ?? item.evidence[0] ?? "원국";
  const branch = evidenceToken(item, /申|寅|未|戌|亥|午|子|卯|辰|巳|酉|丑/) ?? item.evidence[1] ?? "지지";

  return `${stem}와 ${branch}의 표지가 서로 떨어져 있지 않다.`;
}

function roleEditorialLines(chapter: BookStructureChapter) {
  const item = chapter.writerItem;
  const object = roleObjects[chapter.role] ?? item.title;
  const month = monthPhrase(item);
  const elements = elementPhrase(item);

  if (chapter.role === "source") {
    return [
      `${month}의 물은 한곳에 고여 자기 이름을 얻지 않는다.`,
      sourceTokenLine(item),
      "안쪽에 닿아 있는 뿌리가 있고, 바깥으로 이어지는 통로도 함께 열린다.",
      "그래서 멈춤보다 흐름 쪽에서 이 구조가 더 선명해진다.",
    ];
  }

  if (chapter.role === "value") {
    return [
      "가치는 손안에 오래 쥐고 있을 때 생기지 않는다.",
      `${elements}의 배열은 생겨난 것이 지나가고, 지나간 것이 다시 형태를 얻는 순서를 보여 준다.`,
      "직업의 이름은 여기서 필요하지 않다.",
      "남는 것은 소유가 아니라 흐름 뒤에 생긴 구조다.",
    ];
  }

  if (chapter.role === "later-time") {
    return [
      "늦은 시간은 양보다 순서를 더 또렷하게 만든다.",
      `${item.sourceText}의 표지는 원국과 운의 시간이 서로 만나는 자리를 가리킨다.`,
      "많아지는 힘보다 중요한 것은 무엇이 어떤 차례로 움직이는가이다.",
      "후반의 독법은 그래서 속도를 늦추고, 유통과 수렴의 차례를 다시 본다.",
    ];
  }

  if (chapter.role === "role") {
    return [
      "기능은 이름표에서 생기지 않는다.",
      `${item.sourceText}의 배치 안에서 방향, 연결, 질서, 축적이 서로 자리를 얻는다.`,
      "하나가 홀로 앞서기보다, 실제 놓인 자리와 함께 움직일 때 기능이 살아난다.",
      "그때 남는 것은 역할의 과장이 아니라 작동의 흔적이다.",
    ];
  }

  if (chapter.role === "verification") {
    return [
      "마지막에 남길 수 있는 것은 새 이름이 아니다.",
      `${item.sourceText}의 여러 표지가 같은 방향을 가리킬 때만 문장은 짧아진다.`,
      "한 번 보인 것은 지나가고, 반복해서 보인 것만 책 안에 남는다.",
      "그래서 이 장은 더하지 않고 되짚는다.",
    ];
  }

  return [
    `${object}${subjectParticle(object)} 혼자 서 있지 않다.`,
    `${item.title}의 ${item.sourceText} 표지는 서로 기대며 하나의 방향을 만든다.`,
    `${object}${objectParticle(object)} 빠르게 단정할수록 그 사이의 움직임을 놓친다.`,
    `${object}${subjectParticle(object)} 반복 속에서 천천히 자기 윤곽을 얻는다.`,
  ];
}

function patternForChapter(index: number, theme: BookCoreTheme): ComposerPattern {
  const sequenceByTheme: Record<CoreThemeId, ComposerPattern[]> = {
    flow: ["A", "B", "C", "D", "E"],
    center: ["D", "E", "B", "C", "A"],
    search: ["B", "A", "E", "C", "D"],
    balance: ["C", "A", "D", "B", "E"],
  };

  return sequenceByTheme[theme.id][index % 5];
}

function composeBookStructure(analysis: ClassicalAnalysis, runtime: BlueprintCoreRuntime): BookStructure {
  const coreTheme = selectCoreTheme(runtime);
  const sceneTheme = selectSceneTheme(coreTheme);
  const writerItems = classicalAnalysisToWriterInput(analysis);
  const sectionChapters: BookStructureChapter[] = analysis.sections.map((section, index) => {
    const role = sectionRole(section);
    const sceneSymbol = sceneSymbolForChapter(index, sceneTheme);
    const writerItem = writerItems[index];

    return {
      id: `composer-${section.id.toLowerCase()}`,
      writerItem,
      sourceSection: section,
      sourceTitle: section.title,
      role,
      sceneSymbol,
      title: titleFromClassicalItem(writerItem, role),
      question: questionForChapter({ index, role, theme: coreTheme, item: writerItem }),
      scene: sceneForChapter({ role, sceneSymbol }),
      pattern: patternForChapter(index, coreTheme),
      structuralLines: sectionClassicalLines(section),
      translationLines: sectionBlueprintLines(section),
    };
  });

  return {
    coreTheme,
    sceneTheme,
    secondaryThemes: secondaryThemes(runtime, analysis),
    chapters: sectionChapters,
  };
}

function manuscriptForComposedChapter(chapter: BookStructureChapter, theme: BookCoreTheme): ChapterManuscript {
  const object = roleObjects[chapter.role] ?? chapter.writerItem.title;
  const editorialLines = roleEditorialLines(chapter);

  return {
    humanQuestion: chapter.question,
    sceneSymbol: chapter.scene,
    classicalEntry: classicalEntryForChapter(chapter),
    structuralReading: editorialLines.slice(0, 2).join("\n"),
    editorialTranslation:
      `${editorialLines.slice(2).join("\n")}\n` +
      `${object}${subjectParticle(object)} 사건을 새로 만들지 않고, 이미 놓인 배치 안에서만 읽힌다.`,
    closingSentence: closingForChapter({ index: Number(chapter.id.replace(/\D/g, "")) || 0, role: chapter.role, theme }),
  };
}

function composedChapterParts(chapter: BookStructureChapter, manuscript: ChapterManuscript) {
  return {
    opening: manuscript.sceneSymbol,
    paragraphs: [
      manuscript.humanQuestion,
      manuscript.classicalEntry,
      manuscript.structuralReading,
      manuscript.editorialTranslation,
      `${chapter.title}${subjectParticle(chapter.title)} ${chapter.sceneSymbol}${objectParticle(chapter.sceneSymbol)} 지나온 뒤에 붙은 장의 이름이다.`,
    ],
    closing: manuscript.closingSentence,
  };
}

function userChapterFromComposedChapter(chapter: BookStructureChapter, index: number, theme: BookCoreTheme): BlueprintChapter {
  const manuscript = manuscriptForComposedChapter(chapter, theme);
  const composed = composedChapterParts(chapter, manuscript);

  return {
    id: `writer-chapter-${String(index + 1).padStart(2, "0")}`,
    chapterNo: index + 1,
    title: chapter.title,
    question: "",
    opening: composed.opening,
    paragraphs: composed.paragraphs.map((text, paragraphIndex) => ({
      id: `writer-c${index + 1}-p${paragraphIndex + 1}`,
      text,
      featureIds: [],
    })),
    closing: composed.closing,
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
  const bookStructure = composeBookStructure(classical.analysis, runtime);
  runtime.writerInput.classicalAnalysis = classicalAnalysisToWriterInput(classical.analysis);
  runtime.writerRuntime = buildWriterRuntime(runtime.writerInput);
  runtime.writerInput.coreSummary = [
    bookStructure.coreTheme.label,
    `장면: ${bookStructure.sceneTheme.label}`,
    ...bookStructure.secondaryThemes,
    runtime.writerInput.sourceSummary.pillars.join(" "),
  ].filter(Boolean).join(" · ");
  baseBook.metadata.title = classical.analysis.suggestedTitle;
  baseBook.familyCollection.volumes = baseBook.familyCollection.volumes.map((volume) =>
    volume.blueprintNo === runtime.blueprintNo ? { ...volume, title: classical.analysis.suggestedTitle } : volume,
  );
  baseBook.chapters = bookStructure.chapters.map((chapter, index) =>
    userChapterFromComposedChapter(chapter, index, bookStructure.coreTheme),
  );
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
