import type { ManseResult } from "@/src/lib/manse";
import type { BlueprintBook, BlueprintCore, BlueprintParagraph } from "../types";
import type { ClassicalAnalysis, ClassicalAnalysisInput, ClassicalAnalysisSection } from "./types";

const elementLabels: Record<string, string> = {
  wood: "목",
  fire: "화",
  earth: "토",
  metal: "금",
  water: "수",
};

const elementHanja: Record<string, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水",
};

const pillarLabels = ["년주", "월주", "일주", "시주"] as const;

function compact(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value));
}

function pillarLabel(pillar: { ganKo: string; jiKo: string } | null) {
  return pillar ? `${pillar.ganKo}${pillar.jiKo}` : null;
}

function pillarHanja(pillar: { gan: string; ji: string } | null) {
  return pillar ? `${pillar.gan}${pillar.ji}` : null;
}

function elementSummary(elements: Record<string, number>) {
  return Object.entries(elementLabels).map(([key, label]) => `${label} ${elements[key] ?? 0}`);
}

function pillarSourceLine(
  label: string,
  pillar: { gan: string; ji: string; ganKo: string; jiKo: string } | null,
  manse: ManseResult,
) {
  const ganji = pillarLabel(pillar);
  const hanja = pillarHanja(pillar);

  if (!ganji || !hanja) return `${label} 시간 미상`;

  return `${label} ${ganji} ${hanja} ${manse.tenGods[ganji] ?? "-"}`;
}

function pillarSequence(manse: ManseResult) {
  return [
    pillarSourceLine("년주", manse.saju.year, manse),
    pillarSourceLine("월주", manse.saju.month, manse),
    pillarSourceLine("일주", manse.saju.day, manse),
    pillarSourceLine("시주", manse.saju.hour, manse),
  ];
}

function dayMasterLabel(manse: ManseResult) {
  const day = manse.natalChart.pillars.day.stem;

  return `${day.hangul}${elementLabels[day.element] ?? ""}`;
}

function dayStemSource(manse: ManseResult) {
  const day = manse.natalChart.pillars.day.stem;

  return `${day.hanja}${elementHanja[day.element] ?? ""}`;
}

function branchWithElementKo(branch: { hangul: string; element: string }) {
  return `${branch.hangul}${elementLabels[branch.element] ?? ""}`;
}

function classicalGanjiSequence(manse: ManseResult) {
  return compact([
    pillarLabel(manse.saju.year) ? `${pillarLabel(manse.saju.year)}년` : null,
    pillarLabel(manse.saju.month) ? `${pillarLabel(manse.saju.month)}월` : null,
    pillarLabel(manse.saju.day) ? `${pillarLabel(manse.saju.day)}일` : null,
    pillarLabel(manse.saju.hour) ? `${pillarLabel(manse.saju.hour)}시` : null,
  ]);
}

function strongestElements(manse: ManseResult) {
  const entries = Object.entries(manse.natalChart.fiveElementsDistribution)
    .map(([key, value]) => ({ key, label: elementLabels[key] ?? key, value }))
    .sort((a, b) => b.value - a.value);
  const max = entries[0]?.value ?? 0;

  return entries.filter((entry) => entry.value === max && max > 0).map((entry) => `${entry.label} ${entry.value}`);
}

function strongestElementLabels(manse: ManseResult) {
  return strongestElements(manse).map((item) => item.split(" ")[0]).join("·");
}

function emptyElements(manse: ManseResult) {
  const distribution = manse.natalChart.fiveElementsDistribution as Record<string, number>;

  return Object.entries(elementLabels)
    .filter(([key]) => (distribution[key] ?? 0) === 0)
    .map(([, label]) => label);
}

function repeatedBranches(manse: ManseResult) {
  const branches = compact([
    manse.saju.year.jiKo,
    manse.saju.month.jiKo,
    manse.saju.day.jiKo,
    manse.saju.hour?.jiKo,
  ]);
  const counts = branches.reduce<Record<string, number>>((acc, branch) => {
    acc[branch] = (acc[branch] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .filter(([, count]) => count > 1)
    .map(([branch, count]) => `${branch} ${count}회`);
}

function currentLuckLines(manse: ManseResult) {
  return compact([
    manse.daeun.current ? `대운 ${manse.daeun.current.ganji}` : null,
    `세운 ${pillarLabel(manse.currentLuck.year) ?? "-"}`,
    `월운 ${pillarLabel(manse.currentLuck.month) ?? "-"}`,
  ]);
}

function withDirectionParticle(value: string | null) {
  if (!value) return "-";
  const last = value[value.length - 1];
  const code = last.charCodeAt(0);
  const hasBatchim = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;

  return `${value}${hasBatchim ? "으로" : "로"}`;
}

function buildEvidence(manse: ManseResult): NonNullable<BlueprintParagraph["referenceEvidence"]> {
  const pillars = [
    manse.saju.year,
    manse.saju.month,
    manse.saju.day,
    manse.saju.hour,
  ];

  return {
    saju: compact(
      pillars.map((pillar, index) => {
        const label = pillarLabel(pillar);
        const hanja = pillarHanja(pillar);

        return label && hanja ? `${pillarLabels[index]} ${label}(${hanja})` : null;
      }),
    ),
    tenGods: compact(
      pillars.map((pillar, index) => {
        const label = pillarLabel(pillar);

        return label ? `${pillarLabels[index]} ${label} — ${manse.tenGods[label] ?? "-"}` : null;
      }),
    ),
    elements: elementSummary(manse.natalChart.fiveElementsDistribution),
    relations: ["현재 구현된 합충형파해 데이터 없음"],
    luck: compact([
      manse.daeun.current ? `대운 ${manse.daeun.current.ganji}` : null,
      `세운 ${pillarLabel(manse.currentLuck.year)}`,
      `월운 ${pillarLabel(manse.currentLuck.month)}`,
    ]),
  };
}

function section(
  order: number,
  title: string,
  layers: ClassicalAnalysisSection["layers"],
  manse: ManseResult,
): ClassicalAnalysisSection {
  return {
    id: `CLASSICAL_${String(order).padStart(2, "0")}`,
    order,
    title,
    layers,
    body: layers.flatMap((layer) => layer.blueprint),
    evidence: buildEvidence(manse),
  };
}

function layer(
  sajuOriginal: string[],
  classical: string[],
  blueprint: string[],
): ClassicalAnalysisSection["layers"][number] {
  return {
    sajuOriginal,
    classical,
    blueprint,
  };
}

export function buildClassicalAnalysisInput(manse: ManseResult): ClassicalAnalysisInput {
  return {
    subject: {
      name: manse.input.name,
      birthDate: manse.input.birthDate,
      birthTime: manse.input.birthTime,
      birthPlace: manse.input.birthPlace.name,
    },
    pillars: {
      year: `${pillarLabel(manse.saju.year)}(${pillarHanja(manse.saju.year)})`,
      month: `${pillarLabel(manse.saju.month)}(${pillarHanja(manse.saju.month)})`,
      day: `${pillarLabel(manse.saju.day)}(${pillarHanja(manse.saju.day)})`,
      hour: manse.saju.hour ? `${pillarLabel(manse.saju.hour)}(${pillarHanja(manse.saju.hour)})` : null,
    },
    tenGods: manse.tenGods,
    elements: manse.natalChart.fiveElementsDistribution,
    hiddenStems: manse.natalChart.hiddenStems,
    twelveStages: manse.twelveStages,
    luck: {
      daeun: manse.daeun.current?.ganji ?? null,
      year: pillarLabel(manse.currentLuck.year) ?? "-",
      month: pillarLabel(manse.currentLuck.month) ?? "-",
      day: pillarLabel(manse.currentLuck.day) ?? "-",
    },
    warnings: manse.warnings.map((warning) => warning.message),
  };
}

export function buildClassicalAnalysis(manse: ManseResult): ClassicalAnalysis {
  const pillars = pillarSequence(manse);
  const classicalGanji = classicalGanjiSequence(manse);
  const dayMaster = dayMasterLabel(manse);
  const dayStem = dayStemSource(manse);
  const dayBranch = manse.saju.day.ji;
  const monthBranch = manse.saju.month.ji;
  const branchRepeat = repeatedBranches(manse);
  const strongElements = strongestElements(manse);
  const missingElements = emptyElements(manse);
  const elementLines = elementSummary(manse.natalChart.fiveElementsDistribution);
  const luckLines = currentLuckLines(manse);
  const strongestLabel = strongestElementLabels(manse) || "오행";
  const hourNote = manse.input.unknownTime
    ? "시주는 시간 미상으로 보류한다."
    : `시주는 ${withDirectionParticle(pillarLabel(manse.saju.hour))} 본다.`;

  return {
    mode: "classical-myeongli",
    input: buildClassicalAnalysisInput(manse),
    suggestedTitle: `${dayMaster} ${manse.saju.month.jiKo}월 ${strongestLabel} 유통 구조`,
    sections: [
      section(1, "명조 확정", [
        layer(pillars, [`${classicalGanji.join(" ")}로 명조를 확정한다.`, `일간은 ${dayMaster}이며 월지는 ${branchWithElementKo(manse.natalChart.pillars.month.branch)}이다.`, hourNote], [`이 명조는 ${dayMaster} 일간을 중심으로, 원국의 반복과 오행 분포를 함께 읽어야 한다.`]),
      ], manse),
      section(2, "명조 핵심 구조", [
        layer([branchRepeat.length ? `반복 지지 ${branchRepeat.join(", ")}` : "반복 지지 없음", ...strongElements.map((item) => `강한 오행 ${item}`), ...elementLines], ["반복되는 지지와 강한 오행을 먼저 확인한다.", "반복, 생조, 수렴의 배치가 명조의 핵심 구조를 이룬다."], ["이 명조는 원국 안의 반복과 오행 분포를 통해 흐름, 유통, 수렴의 방향을 읽는다."]),
      ], manse),
      section(3, "적천수 관점", [
        layer([dayStem, dayBranch, monthBranch], [`${dayMaster} 일간은 월지 ${manse.saju.month.jiKo}와 일지 ${manse.saju.day.jiKo}의 조건에서 본다.`, "근원, 출력, 유통 여부를 함께 확인한다."], [`${dayMaster} 일간은 ${manse.saju.month.jiKo}월과 ${manse.saju.day.jiKo}일지의 조건 속에서 흐름을 읽어야 한다.`]),
        layer(elementLines, ["오행 분포는 유통과 수렴의 정도를 확인하는 근거가 된다."], [`${strongestLabel}의 분포가 강하게 드러날수록 전달과 수렴의 균형을 함께 보아야 한다.`]),
      ], manse),
      section(4, "궁통보감 관점", [
        layer([`${manse.saju.month.ji}月 ${dayStem}`, ...elementLines], [`${manse.saju.month.jiKo}월 ${dayMaster}는 월령과 조후를 함께 본다.`, "월령의 조건 안에서 통관과 발현이 가능한지를 확인한다."], ["월령의 조건을 벗어나지 않고, 흐름이 어디서 막히고 어디서 전개되는지를 읽는다."]),
      ], manse),
      section(5, "육친론", [
        layer(pillars, ["각 주의 십성은 육친과 작용 방식을 읽는 근거가 된다.", "일간을 중심으로 드러나는 십성과 받치는 십성을 구분한다."], ["십성의 배치는 표현, 수용, 전달, 수렴이 어느 자리에서 작동하는지 보여준다."]),
      ], manse),
      section(6, "용신·상신", [
        layer([dayStem, ...elementLines], ["조후와 균형을 기준으로 원국 안의 작동 순서를 본다.", "단일 요소로 단정하지 않고 생조와 제어가 함께 작동하는지를 검토한다."], ["하나의 단어로 줄이기보다, 흐름이 살아나는 순서와 수렴되는 지점을 함께 읽는다."]),
      ], manse),
      section(7, "병약론", [
        layer([`오행 분포 ${elementLines.join(", ")}`, missingElements.length ? `비어 있는 오행 ${missingElements.join(", ")}` : "비어 있는 오행 없음"], ["많은 오행과 비어 있는 오행을 함께 보아 병약을 판단한다.", "한쪽으로 치우친 작용은 소모와 막힘의 근거가 된다."], ["살아 있는 흐름과 비어 있는 지점을 함께 읽어야 소모와 수렴의 위치가 보인다."]),
      ], manse),
      section(8, "체용론", [
        layer([`${dayStem} 일간`, `${monthBranch} 월지`, ...luckLines], [`체는 ${dayMaster} 일간과 월지 ${manse.saju.month.jiKo}의 조건에서 본다.`, "용은 원국의 발현과 현재 운의 작동에서 확인한다."], ["본체와 쓰임은 원국의 흐름이 현재 운에서 어떻게 전개되는지로 읽는다."]),
      ], manse),
      section(9, "희기신론", [
        layer(["오행 분포", `월령 ${manse.saju.month.jiKo}`, ...luckLines], ["희기신은 오행 분포와 월령, 대운의 작동을 함께 놓고 본다.", "살아나는 작용과 부담이 되는 작용을 동시에 검토한다."], ["살아나는 흐름과 소모되는 흐름을 구분해야 현재 작동이 선명해진다."]),
      ], manse),
      section(10, "리더십 구조", [
        layer(pillars, ["십성과 지지의 반복에서 방향 설정, 연결, 질서 유지 기능을 본다.", "이 기능은 원국의 생조와 충돌 안에서만 판단한다."], [`${dayMaster} 일간은 ${manse.saju.month.jiKo}월 ${strongestLabel} 배치 안에서 흐름을 전달하고 연결을 정리하는 방식으로 작동한다.`]),
      ], manse),
      section(11, "재물 생성 구조", [
        layer(elementLines, ["재물은 직업명으로 추정하지 않고 생성 구조만 본다.", "오행의 생조, 출력, 수렴이 이어질 때 재물 생성 조건이 생긴다."], ["가치는 흐름이 전달되고, 전달된 것이 구조로 남을 때 만들어진다."]),
      ], manse),
      section(12, "후반 인생 구조", [
        layer(luckLines, [`현재 대운은 ${manse.daeun.current?.ganji ?? "연결되지 않음"}이다.`, "후반 구조는 원국과 현재 운의 작동이 만나는 지점에서 본다."], ["후반에는 흐름의 양보다, 유통과 수렴이 어떤 순서로 전개되는지가 중요해진다."]),
      ], manse),
      section(13, "최종 종합 검증", [
        layer(["원국", "십성", "오행", "12운성", "대운"], ["원국, 십성, 오행, 12운성, 대운을 교차 확인한다.", "반복 확인되는 구조만 최종 판단에 남긴다."], ["핵심은 새로 붙인 이름이 아니라, 반복 확인되는 흐름과 전개 방식이다."]),
      ], manse),
      section(14, "최종 압축", [
        layer([dayStem, ...elementLines], [`100자: ${dayMaster} 일간에 ${elementLines.join(", ")}의 분포가 놓여 흐름, 유통, 수렴, 전개의 작동을 함께 본다.`, "50자: 원국의 반복과 오행 분포로 흐름과 수렴을 본다.", "25자: 흐름·유통·수렴을 본다.", "10자: 흐름과 수렴"], ["길게 보면 흐름과 수렴의 결합이고, 짧게 보면 유통과 전개다."]),
      ], manse),
      section(15, "기능적 역할 구조", [
        layer(pillars, ["방향을 만드는 기능, 사람을 연결하는 기능, 질서를 유지하는 기능, 깊이를 축적하는 기능을 원국 안에서만 확인한다."], ["이 명조의 기능은 방향, 연결, 질서, 축적이 실제 배치와 함께 확인될 때만 말할 수 있다."]),
      ], manse),
      section(16, "반복 충돌 구조", [
        layer([branchRepeat.length ? `반복 지지 ${branchRepeat.join(", ")}` : "반복 지지 없음", ...elementLines], ["반복되는 지지와 치우친 오행에서 충돌 구조를 확인한다.", "충돌은 예언이 아니라 반복되는 작동 방식의 검토 항목이다."], ["반복되는 흐름이 커질수록 전달, 수렴, 충돌의 위치를 함께 보아야 한다."]),
      ], manse),
      section(17, "기능이 살아나는 환경", [
        layer([dayStem, ...strongElements.map((item) => `강한 오행 ${item}`)], ["강하게 드러난 오행과 일간의 작동이 허용될 때 기능이 살아난다.", "동시에 비어 있거나 약한 지점이 보완되어야 한다."], ["흐름이 막히지 않고 전달과 수렴이 이어질 때 원국의 기능이 살아난다."]),
      ], manse),
      section(18, "구조적 한계", [
        layer([missingElements.length ? `비어 있는 오행 ${missingElements.join(", ")}` : "비어 있는 오행 없음", ...elementLines], ["비어 있는 오행과 강한 오행이 구조적 한계를 만든다.", "한계는 결핍 단정이 아니라 유통이 막히는 지점을 확인하는 방식으로 본다."], ["부족한 이름을 붙이기보다, 어디서 소모되고 어디서 막히는지를 읽어야 한다."]),
      ], manse),
      section(19, "최종 한 문장", [
        layer([dayStem, ...elementLines], [`원국에서 반복 확인되는 것은 ${dayMaster} 일간과 ${strongestLabel} 분포의 흐름, 유통, 수렴, 전개이다.`], [`${dayMaster} 일간은 ${strongestLabel}의 흐름이 유통되고 수렴될 때 원국의 작동이 가장 분명해진다.`]),
      ], manse),
    ],
  };
}

function classicalCore(manse: ManseResult): BlueprintCore {
  return {
    blueprintId: "bp-000001-classical",
    source: "pigbar-manse",
    axes: [],
    features: [
      {
        id: "CLASSICAL_MYEONGLI",
        axis: "Identity",
        title: "Classical Myeongli",
        summary: `원국 ${pillarLabel(manse.saju.year)} ${pillarLabel(manse.saju.month)} ${pillarLabel(manse.saju.day)} ${pillarLabel(manse.saju.hour)} 기준`,
        score: 1,
        confidence: 1,
        evidence: buildEvidence(manse).saju,
        writerHint: "Classical Mode",
      },
    ],
  };
}

function paragraphFromSection(sectionItem: ClassicalAnalysisSection): BlueprintParagraph[] {
  return sectionItem.layers.map((layerItem, index) => ({
    id: `${sectionItem.id}_P${index + 1}`,
    text: layerItem.blueprint.join(" "),
    featureIds: [],
    tripleLayer: layerItem,
    referenceEvidence: sectionItem.evidence,
  }));
}

function chapterFromSection(sectionItem: ClassicalAnalysisSection) {
  return {
    id: `classical-chapter-${sectionItem.order}`,
    chapterNo: sectionItem.order,
    title: sectionItem.title,
    question: sectionItem.title,
    opening: sectionItem.title,
    paragraphs: paragraphFromSection(sectionItem),
    closing: "사주 근거는 각 문장 아래에 붙인다.",
  };
}

export function buildClassicalBlueprintBook(input: {
  baseBook: BlueprintBook;
  manse: ManseResult;
}): {
  book: BlueprintBook;
  analysis: ClassicalAnalysis;
} {
  const analysis = buildClassicalAnalysis(input.manse);

  return {
    analysis,
    book: {
      ...input.baseBook,
      metadata: {
        ...input.baseBook.metadata,
        title: analysis.suggestedTitle,
        subtitle: "명조 구조 분석",
        sourceName: "Pigbar Manse Classical Mode",
      },
      dedication: "Pigbar Manse가 계산한 명조를 기준으로 정리한다.",
      authorNote: "Classical Mode는 새로운 성격 라벨이나 Human Vocabulary를 만들지 않고, 계산된 명조 구조를 기존 명리학 분석 순서로 정리한다.",
      prologue: {
        title: "명조 확정",
        paragraphs: [
          {
            id: "classical-prologue-1",
            text: `${input.manse.input.name || input.baseBook.metadata.author} 명조는 ${classicalGanjiSequence(input.manse).join(" ")}로 본다.`,
            featureIds: [],
            referenceEvidence: buildEvidence(input.manse),
          },
        ],
      },
      core: classicalCore(input.manse),
      chapters: analysis.sections.map(chapterFromSection),
      myNotesPrompt: "Classical Mode와 기존 Blueprint 문장 사이에서 달라진 지점을 적어두세요.",
    },
  };
}
