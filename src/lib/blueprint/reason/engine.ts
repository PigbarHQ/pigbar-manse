import type { BlueprintAxis } from "../types/axis";
import type {
  BlueprintFeature,
  BlueprintFeatureId,
  BlueprintReason,
  ConfidenceLabel,
  FeatureConflict,
  FeatureEvidence,
  HumanVocabulary,
  SourceReference,
} from "../types/runtime";

type ReasonTemplate = {
  id: string;
  title: string;
  description: string;
  featureIds: BlueprintFeatureId[];
  writerHints: string[];
};

const REASON_TEMPLATES: ReasonTemplate[] = [
  {
    id: "REASON_STANDARD_BEFORE_DECISION",
    title: "결정보다 기준이 먼저 선다",
    description: "선택의 속도보다 판단 기준과 검증 구조가 더 강하게 잡힌다.",
    featureIds: ["FEATURE_DECISION_CRITERIA", "FEATURE_IDENTITY_SELF_STANDARD", "FEATURE_DECISION_VERIFICATION"],
    writerHints: ["결정 지연이 아니라 기준 형성의 문장으로 쓴다."],
  },
  {
    id: "REASON_LAYERED_THINKING",
    title: "생각이 층으로 쌓인다",
    description: "한 번의 답보다 맥락, 패턴, 근거를 겹쳐 보며 판단한다.",
    featureIds: ["FEATURE_THINKING_LAYERED_MEMORY", "FEATURE_THINKING_PATTERN_SEEKING", "FEATURE_THINKING_CONTEXT_READING"],
    writerHints: ["생각이 많다는 표현 대신 검토의 층이 깊다고 쓴다."],
  },
  {
    id: "REASON_RESPONSIBLE_DELAY",
    title: "미룸 안에 책임 계산이 있다",
    description: "선택 이후 감당해야 할 범위와 자원 상태를 먼저 계산한다.",
    featureIds: ["FEATURE_DECISION_RESPONSIBILITY_RANGE", "FEATURE_DECISION_RESOURCE_CHECK", "FEATURE_DECISION_LONG_TERM_VIEW"],
    writerHints: ["망설임을 책임 범위 확인으로 번역한다."],
  },
  {
    id: "REASON_SLOW_IGNITION_ACTION",
    title: "시작보다 지속에 힘이 있다",
    description: "조건이 맞고 리듬이 잡힌 뒤 오래 밀고 가는 실행 구조가 나타난다.",
    featureIds: ["FEATURE_ACTION_SLOW_IGNITION", "FEATURE_ACTION_SUSTAINED_RHYTHM", "FEATURE_ACTION_ROUTINE_POWER"],
    writerHints: ["불꽃보다 불씨에 가까운 행동 리듬으로 쓴다."],
  },
  {
    id: "REASON_TRUST_BEFORE_SPEED",
    title: "관계는 속도보다 신뢰를 먼저 본다",
    description: "빠르게 가까워지는 것보다 오래 유지될 신뢰 조건을 확인한다.",
    featureIds: [
      "FEATURE_RELATIONSHIP_TRUST_BEFORE_SPEED",
      "FEATURE_RELATIONSHIP_OBSERVATION",
      "FEATURE_RELATIONSHIP_LONG_TERM_MAINTENANCE",
    ],
    writerHints: ["마음을 주지 않는 사람이 아니라 마음을 둘 자리를 확인한다고 쓴다."],
  },
  {
    id: "REASON_LATE_CLEAR_COMMUNICATION",
    title: "말은 늦지만 책임을 가진다",
    description: "즉각 표현보다 정리된 뒤의 말과 행동 채널에 힘이 생긴다.",
    featureIds: [
      "FEATURE_COMMUNICATION_LATE_CLEAR_VOICE",
      "FEATURE_COMMUNICATION_WORD_RESPONSIBILITY",
      "FEATURE_COMMUNICATION_ACTION_CHANNEL",
    ],
    writerHints: ["침묵을 결핍이 아니라 말의 책임으로 쓴다."],
  },
  {
    id: "REASON_QUIET_STANDARD_LEADERSHIP",
    title: "조용한 기준점이 된다",
    description: "앞에서 장악하기보다 기준, 시스템, 반복된 신뢰로 영향을 만든다.",
    featureIds: [
      "FEATURE_LEADERSHIP_STANDARD_BASED",
      "FEATURE_LEADERSHIP_SYSTEM_THINKING",
      "FEATURE_LEADERSHIP_QUIET_INFLUENCE",
    ],
    writerHints: ["화려한 리더십 대신 믿을 수 있는 반복으로 쓴다."],
  },
  {
    id: "REASON_BOUNDARY_AFTER_PATIENCE",
    title: "오래 참은 뒤 선이 분명해진다",
    description: "갈등을 바로 드러내기보다 반복 구조를 확인하고 기준이 무너질 때 경계를 세운다.",
    featureIds: [
      "FEATURE_CONFLICT_BOUNDARY_AFTER_PATIENCE",
      "FEATURE_CONFLICT_STRUCTURE_DIAGNOSIS",
      "FEATURE_CONFLICT_REPAIR_CONDITIONS",
    ],
    writerHints: ["분노가 아니라 기준의 회복으로 쓴다."],
  },
  {
    id: "REASON_ACCUMULATED_GROWTH",
    title: "성장은 누적된다",
    description: "한 번에 바뀌기보다 실패와 경험을 기준으로 바꾸며 성장한다.",
    featureIds: ["FEATURE_GROWTH_ACCUMULATION", "FEATURE_GROWTH_SELF_REVISION", "FEATURE_GROWTH_FAILURE_TO_RULE"],
    writerHints: ["새 사람이 되는 일이 아니라 자기 구조의 사용법을 배우는 일로 쓴다."],
  },
  {
    id: "REASON_RESOURCE_ORDER",
    title: "자원에는 질서가 필요하다",
    description: "돈보다 시간, 관계, 체력, 시스템을 함께 자원으로 보고 감당 가능한 확장을 찾는다.",
    featureIds: [
      "FEATURE_WEALTH_RESOURCE_ORDER",
      "FEATURE_WEALTH_STABILITY_BEFORE_EXPANSION",
      "FEATURE_WEALTH_TIME_COST_AWARENESS",
    ],
    writerHints: ["돈복이라는 말 없이 자원을 대하는 질서로 쓴다."],
  },
  {
    id: "REASON_RHYTHM_RECOVERY",
    title: "회복은 리듬을 되찾는 일이다",
    description: "무리한 버팀보다 외부 입력을 줄이고 멈춤을 조정으로 쓰는 회복 구조가 있다.",
    featureIds: ["FEATURE_HEALTH_RHYTHM_RECOVERY", "FEATURE_HEALTH_QUIET_RECOVERY", "FEATURE_HEALTH_STOP_AS_RECOVERY"],
    writerHints: ["진단하지 않고 회복 방식으로만 쓴다."],
  },
  {
    id: "REASON_NEXT_CHAPTER_REALIGNMENT",
    title: "다음 장을 위해 재정렬한다",
    description: "현재 흐름은 결론을 확정하기보다 기준과 자원을 다시 정렬하게 한다.",
    featureIds: [
      "FEATURE_LIFEFLOW_REALIGNMENT",
      "FEATURE_LIFEFLOW_PREPARATION_FOR_NEXT",
      "FEATURE_LIFEFLOW_TIMING_MODIFIER",
    ],
    writerHints: ["미래 예언이 아니라 현재 흐름의 요구로 쓴다."],
  },
];

function getConfidenceLabel(confidence: number): ConfidenceLabel {
  if (confidence >= 0.9) return "High";
  if (confidence >= 0.75) return "Stable";
  if (confidence >= 0.6) return "Conditional";
  return "Low";
}

function average(values: number[]) {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function uniqueSources(features: BlueprintFeature[]) {
  const sourceMap = new Map<string, SourceReference>();

  features.flatMap((feature) => feature.sourceRefs).forEach((source) => {
    sourceMap.set(source.path, source);
  });

  return Array.from(sourceMap.values());
}

function uniqueEvidence(features: BlueprintFeature[]) {
  const evidenceMap = new Map<string, FeatureEvidence>();

  features.flatMap((feature) => feature.evidence).forEach((evidence) => {
    evidenceMap.set(`${evidence.path}:${evidence.signal}`, evidence);
  });

  return Array.from(evidenceMap.values());
}

function uniqueConflicts(features: BlueprintFeature[]) {
  const conflictMap = new Map<string, FeatureConflict>();

  features.flatMap((feature) => feature.conflicts).forEach((conflict) => {
    conflictMap.set(`${conflict.path}:${conflict.message}`, conflict);
  });

  return Array.from(conflictMap.values());
}

function relatedVocabularyIds(features: BlueprintFeature[], vocabulary: HumanVocabulary[]) {
  const featureIds = new Set(features.map((feature) => feature.id));

  return vocabulary
    .filter((item) => item.featureSource.some((featureId) => featureIds.has(featureId)))
    .map((item) => item.id);
}

function relatedAxes(features: BlueprintFeature[]) {
  return Array.from(new Set(features.map((feature) => feature.axis))) as BlueprintAxis[];
}

export function buildReasons(features: BlueprintFeature[], vocabulary: HumanVocabulary[]): BlueprintReason[] {
  const featureMap = new Map(features.map((feature) => [feature.id, feature]));

  return REASON_TEMPLATES.map((template) => {
    const relatedFeatures = template.featureIds
      .map((featureId) => featureMap.get(featureId))
      .filter((feature): feature is BlueprintFeature => Boolean(feature));
    const conflicts = uniqueConflicts(relatedFeatures);
    const conflictPenalty = conflicts.reduce((sum, conflict) => sum + conflict.penalty, 0);
    const confidence = Math.max(
      0.35,
      Number((average(relatedFeatures.map((feature) => feature.confidence)) - conflictPenalty * 0.25).toFixed(2)),
    );
    const evidence = uniqueEvidence(relatedFeatures);

    return {
      id: template.id,
      title: template.title,
      description: template.description,
      relatedAxes: relatedAxes(relatedFeatures),
      relatedFeatures: relatedFeatures.map((feature) => feature.id),
      relatedFeatureIds: relatedFeatures.map((feature) => feature.id),
      relatedVocabulary: relatedVocabularyIds(relatedFeatures, vocabulary),
      confidence,
      confidenceLabel: getConfidenceLabel(confidence),
      evidenceSummary: `${relatedFeatures.length} features, ${evidence.length} canonical evidence paths`,
      evidence,
      conflicts,
      sourceRefs: uniqueSources(relatedFeatures),
      writerHints: template.writerHints,
    };
  });
}
