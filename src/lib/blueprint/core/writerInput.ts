import { BLUEPRINT_AXES, BLUEPRINT_AXIS_QUESTIONS, type BlueprintAxis } from "../types/axis";
import type {
  BlueprintFeature,
  BlueprintFeatureId,
  BlueprintReason,
  CanonicalManseInput,
  FeatureConflict,
  HumanVocabulary,
  WriterInput,
} from "../types/runtime";

function pillarLabels(canonical: CanonicalManseInput) {
  const labels = [
    canonical.pillars.year.label,
    canonical.pillars.month.label,
    canonical.pillars.day.label,
    canonical.pillars.hour ? canonical.pillars.hour.label : null,
  ];

  return labels.filter((label): label is string => Boolean(label));
}

const ganElementLabels: Record<string, string> = {
  갑: "목",
  을: "목",
  병: "화",
  정: "화",
  무: "토",
  기: "토",
  경: "금",
  신: "금",
  임: "수",
  계: "수",
};

const generatingCycle = ["목", "화", "토", "금", "수"] as const;

function ganElementFlow(canonical: CanonicalManseInput) {
  const stemElements = [
    canonical.pillars.year.ganKo,
    canonical.pillars.month.ganKo,
    canonical.pillars.day.ganKo,
    canonical.pillars.hour?.ganKo,
  ]
    .map((gan) => (gan ? ganElementLabels[gan] : null))
    .filter((element): element is string => Boolean(element));
  const present = new Set(stemElements);
  const chains = generatingCycle.map((_, startIndex) => {
    const chain: string[] = [];

    for (let offset = 0; offset < generatingCycle.length; offset += 1) {
      const element = generatingCycle[(startIndex + offset) % generatingCycle.length];

      if (!present.has(element)) break;
      chain.push(element);
    }

    return chain;
  });

  return chains.sort((a, b) => b.length - a.length)[0] ?? [];
}

function sourceSummary(canonical: CanonicalManseInput): WriterInput["sourceSummary"] {
  return {
    pillars: pillarLabels(canonical),
    elementFlow: ganElementFlow(canonical),
    elements: canonical.elements,
    currentDaewoon: canonical.luck.currentDaeun ? canonical.luck.currentDaeun.ganji : null,
    currentSewoon: canonical.luck.currentYear.label,
    calculationEngine: "pigbar-manse",
  };
}

function fallbackSuggestedTitle(canonical: CanonicalManseInput) {
  return `${canonical.dayMaster.ganKo}${canonical.pillars.month.jiKo} 명조 구조 분석`;
}

function sortByConfidence<T extends { confidence: number }>(items: T[]) {
  return [...items].sort((a, b) => b.confidence - a.confidence);
}

function uniqueConflicts(features: BlueprintFeature[], reasons: BlueprintReason[]) {
  const conflictMap = new Map<string, FeatureConflict>();

  features.flatMap((feature) => feature.conflicts).forEach((conflict) => {
    conflictMap.set(`${conflict.path}:${conflict.message}`, conflict);
  });
  reasons.flatMap((reason) => reason.conflicts).forEach((conflict) => {
    conflictMap.set(`${conflict.path}:${conflict.message}`, conflict);
  });

  return Array.from(conflictMap.values());
}

function vocabularyForFeatures(vocabulary: HumanVocabulary[], featureIds: BlueprintFeatureId[]) {
  const ids = new Set(featureIds);

  return vocabulary.filter((item) => item.featureSource.some((featureId) => ids.has(featureId)));
}

function axisReasons(reasons: BlueprintReason[], axis: BlueprintAxis) {
  return sortByConfidence(reasons.filter((reason) => reason.relatedAxes.includes(axis))).slice(0, 3);
}

function annotationSeedsForReasons(reasons: BlueprintReason[], vocabulary: HumanVocabulary[]) {
  return reasons.map((reason) => {
    const relatedVocabulary = vocabularyForFeatures(vocabulary, reason.relatedFeatureIds);

    return {
      reasonId: reason.id,
      featureIds: reason.relatedFeatureIds,
      vocabularyIds: relatedVocabulary.map((item) => item.id),
      confidence: reason.confidence,
    };
  });
}

function chapterTitle(axis: BlueprintAxis, index: number) {
  if (index === 0) {
    return "강은 자신이 바다를 향하고 있다는 사실을 모른다";
  }

  if (index === 1) {
    return "흐름은 우연이 아니라 구조다";
  }

  if (axis === "LifeFlow") {
    return "계절은 사람의 속도를 바꾼다";
  }

  return BLUEPRINT_AXIS_QUESTIONS[axis] || `Chapter ${index + 1}`;
}

function buildChapterInputs(reasons: BlueprintReason[], vocabulary: HumanVocabulary[]): WriterInput["chapterInputs"] {
  return BLUEPRINT_AXES.map((axis, index) => {
    const relatedReasons = axisReasons(reasons, axis);

    return {
      chapterId: `chapter_${String(index + 1).padStart(2, "0")}`,
      chapterNo: index + 1,
      title: chapterTitle(axis, index),
      targetQuestion: BLUEPRINT_AXIS_QUESTIONS[axis],
      relatedReasons: relatedReasons.map((reason) => reason.id),
      requiredTone: ["조용한", "단정하지 않는", "구조를 설명하는"],
      avoidPhrases: ["타고난", "운이 좋다", "성격상", "반드시", "무조건"],
      annotationSeeds: annotationSeedsForReasons(relatedReasons, vocabulary),
    };
  });
}

function traceSeed(reasons: BlueprintReason[], vocabulary: HumanVocabulary[]): WriterInput["traceSeed"] {
  return reasons.map((reason) => {
    const relatedVocabulary = vocabularyForFeatures(vocabulary, reason.relatedFeatureIds);

    return {
      reasonId: reason.id,
      featureIds: reason.relatedFeatureIds,
      vocabularyIds: relatedVocabulary.map((item) => item.id),
      sajuSourcePaths: reason.evidence.map((item) => item.path),
      confidence: reason.confidence,
    };
  });
}

function axisInputs(features: BlueprintFeature[], vocabulary: HumanVocabulary[]): WriterInput["axes"] {
  return BLUEPRINT_AXES.map((axis) => {
    const axisFeatures = sortByConfidence(features.filter((feature) => feature.axis === axis)).slice(0, 5);
    const axisFeatureIds = new Set(axisFeatures.map((feature) => feature.id));
    const axisVocabulary = vocabulary
      .filter((item) => item.relatedAxes.includes(axis) || item.featureSource.some((id) => axisFeatureIds.has(id)))
      .slice(0, 5);

    return {
      axis,
      question: BLUEPRINT_AXIS_QUESTIONS[axis],
      primaryFeatureIds: axisFeatures.map((feature) => feature.id),
      primaryVocabularyIds: axisVocabulary.map((item) => item.id),
    };
  });
}

export function createWriterInput(input: {
  blueprintId: string;
  blueprintNo: string;
  authorName: string;
  edition: string;
  canonicalManseInput: CanonicalManseInput;
  features: BlueprintFeature[];
  vocabulary: HumanVocabulary[];
  reasons: BlueprintReason[];
}): WriterInput {
  const topFeatures = sortByConfidence(input.features).slice(0, 12);
  const topReasons = sortByConfidence(input.reasons).slice(0, 6);
  const weakSignals = input.features.filter((feature) => feature.confidence < 0.7);
  const conflicts = uniqueConflicts(input.features, input.reasons);
  const allSourcePaths = Array.from(new Set(input.features.flatMap((feature) => feature.evidence.map((item) => item.path))));

  return {
    bookId: input.blueprintNo.replace(".", "-").toLowerCase(),
    blueprintId: input.blueprintId,
    blueprintNo: input.blueprintNo,
    subject: {
      name: input.authorName,
      blueprintNo: input.blueprintNo,
    },
    familyCollection: {
      id: "family-ju-collection",
      name: "The Ju Family Collection",
      label: "주 가족 컬렉션",
    },
    authorName: input.authorName,
    edition: input.edition,
    source: "pigbar-manse",
    coreSummary: topReasons.map((reason) => reason.title).join(" · "),
    sourceSummary: sourceSummary(input.canonicalManseInput),
    topFeatures,
    topReasons,
    weakSignals,
    conflicts,
    provenance: {
      canonicalWarnings: input.canonicalManseInput.provenance.warnings,
      providerReliability: input.canonicalManseInput.provenance.providerReliability,
      timeReliability: input.canonicalManseInput.provenance.timeReliability,
      sourcePaths: allSourcePaths,
    },
    suggestedTitle: fallbackSuggestedTitle(input.canonicalManseInput),
    chapterInputs: buildChapterInputs(input.reasons, input.vocabulary),
    traceSeed: traceSeed(input.reasons, input.vocabulary),
    axes: axisInputs(input.features, input.vocabulary),
    features: input.features,
    vocabulary: input.vocabulary,
    reasons: input.reasons,
    writerRules: [
      "Rule 0: 새로운 핵심 개념을 만들지 않는다.",
      "고전 명리학 분석에서 반복적으로 도출된 핵심 구조만 사용한다.",
      "핵심 의미를 추가하지 않는다.",
      "핵심 의미를 제거하지 않는다.",
      "문장은 현대 한국어로 다듬을 수 있으나 의미는 바꾸지 않는다.",
      "기존 분석에 없는 키워드는 챕터 제목, 핵심 문장, 압축 문장에 쓰지 않는다.",
      "Confidence는 정답 확률이 아니라 구조 신뢰도로 다룬다.",
      "미래 사건을 단정하지 않는다.",
      "Reason과 Source가 없는 문장은 만들지 않는다.",
      "traceSeed 없이 문장을 생성하지 않는다.",
    ],
  };
}
