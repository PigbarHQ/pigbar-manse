import type { ManseResult } from "@/src/lib/manse";
import type { BlueprintAxis } from "./axis";

export type ConfidenceLabel = "High" | "Stable" | "Conditional" | "Low";
export type BlueprintWarningSeverity = "fatal" | "warning";

export type BlueprintRuntimeWarning = {
  code: string;
  message: string;
  path: string;
  severity: BlueprintWarningSeverity;
};

export type CanonicalPillar = {
  gan: string;
  ji: string;
  ganKo: string;
  jiKo: string;
  label: string;
  confidence: number;
};

export type CanonicalOptionalPillar = CanonicalPillar | null;

export type CanonicalManseInput = {
  pillars: {
    year: CanonicalPillar;
    month: CanonicalPillar;
    day: CanonicalPillar;
    hour: CanonicalOptionalPillar;
  };
  dayMaster: {
    gan: string;
    ganKo: string;
    element: string;
    yinYang: string;
  };
  elements: Record<string, number>;
  tenGods: Record<string, string | null>;
  hiddenStems: Record<string, unknown[]>;
  twelveStages: Record<string, string | null>;
  relations: {
    stems: Record<string, unknown>;
    branches: Record<string, unknown>;
  };
  luck: {
    daeun: unknown;
    currentDaeun: {
      ganji: string;
      startDateTime: string;
      endDateTime: string;
      index: number;
    } | null;
    currentYear: CanonicalPillar;
    currentMonth: CanonicalPillar;
    currentDay: CanonicalPillar;
    currentHour: CanonicalOptionalPillar;
  };
  provenance: {
    inputName: string | null;
    unknownTime: boolean;
    timeCorrection: unknown;
    solarTermEngine: unknown;
    calendarConversionVerified: boolean;
    providerReliability: number;
    timeReliability: number;
    warnings: BlueprintRuntimeWarning[];
    rawWarningCount: number;
  };
};

export type SourceReference = {
  id: string;
  label: string;
  path: string;
  role: "primary" | "supporting" | "timing" | "conflict";
  value?: string | number | boolean | null;
};

export type FeatureEvidence = {
  sourceType: "manse";
  path: string;
  signal: string;
  strength: number;
  value?: string | number | boolean | null;
};

export type FeatureConflict = {
  path: string;
  message: string;
  penalty: number;
};

export type ConfidenceBreakdown = {
  base: number;
  sourceCount: number;
  sourceStrength: number;
  sourceAgreement: number;
  sourceConflict: number;
  timeReliability: number;
  providerReliability: number;
  missingDataPenalty: number;
  final: number;
};

export type HumanVocabulary = {
  id: string;
  name: string;
  description: string;
  opposite: string;
  oppositeVocabularyId?: string;
  category: string;
  relatedAxes: BlueprintAxis[];
  featureSource: BlueprintFeatureId[];
  confidenceRule: string;
  writerHints: string[];
  readerHints: string[];
};

export type BlueprintFeatureId =
  | "FEATURE_IDENTITY_SELF_STANDARD"
  | "FEATURE_IDENTITY_INNER_ALIGNMENT"
  | "FEATURE_IDENTITY_ROLE_REDEFINITION"
  | "FEATURE_IDENTITY_BOUNDARY_FIRST"
  | "FEATURE_IDENTITY_LONG_TERM_SELF"
  | "FEATURE_THINKING_BIG_PICTURE"
  | "FEATURE_THINKING_DETAIL_SENSITIVE"
  | "FEATURE_THINKING_PATTERN_SEEKING"
  | "FEATURE_THINKING_CONTEXT_READING"
  | "FEATURE_THINKING_QUESTION_DRIVEN"
  | "FEATURE_THINKING_LAYERED_MEMORY"
  | "FEATURE_THINKING_STRUCTURE_FIRST"
  | "FEATURE_THINKING_EVIDENCE_CHECK"
  | "FEATURE_DECISION_CRITERIA"
  | "FEATURE_DECISION_VERIFICATION"
  | "FEATURE_DECISION_RESPONSIBILITY_RANGE"
  | "FEATURE_DECISION_LONG_TERM_VIEW"
  | "FEATURE_DECISION_REVERSIBLE_PATH"
  | "FEATURE_DECISION_RESOURCE_CHECK"
  | "FEATURE_DECISION_CONDITION_TRIGGERED_SPEED"
  | "FEATURE_ACTION_EXECUTION_DRIVEN"
  | "FEATURE_ACTION_SLOW_IGNITION"
  | "FEATURE_ACTION_SUSTAINED_RHYTHM"
  | "FEATURE_ACTION_ROUTINE_POWER"
  | "FEATURE_ACTION_DEADLINE_ACTIVATION"
  | "FEATURE_ACTION_ADAPTIVE_EXECUTION"
  | "FEATURE_ACTION_COMPLETION_STACKING"
  | "FEATURE_RELATIONSHIP_TRUST_BEFORE_SPEED"
  | "FEATURE_RELATIONSHIP_DISTANCE_CONTROL"
  | "FEATURE_RELATIONSHIP_OBSERVATION"
  | "FEATURE_RELATIONSHIP_RESPONSIBILITY"
  | "FEATURE_RELATIONSHIP_CONNECTION_BUILDING"
  | "FEATURE_RELATIONSHIP_LONG_TERM_MAINTENANCE"
  | "FEATURE_COMMUNICATION_WRITTEN_CLARITY"
  | "FEATURE_COMMUNICATION_LATE_CLEAR_VOICE"
  | "FEATURE_COMMUNICATION_CONTEXT_EXPLANATION"
  | "FEATURE_COMMUNICATION_ACTION_CHANNEL"
  | "FEATURE_COMMUNICATION_QUESTION_PERSUASION"
  | "FEATURE_COMMUNICATION_WORD_RESPONSIBILITY"
  | "FEATURE_LEADERSHIP_STANDARD_BASED"
  | "FEATURE_LEADERSHIP_SYSTEM_THINKING"
  | "FEATURE_LEADERSHIP_QUIET_INFLUENCE"
  | "FEATURE_LEADERSHIP_CRISIS_ROLE"
  | "FEATURE_LEADERSHIP_DELEGATION_STRUCTURE"
  | "FEATURE_CONFLICT_BOUNDARY_AFTER_PATIENCE"
  | "FEATURE_CONFLICT_STRUCTURE_DIAGNOSIS"
  | "FEATURE_CONFLICT_PREVENTIVE_RULES"
  | "FEATURE_CONFLICT_DIRECT_CHECK"
  | "FEATURE_CONFLICT_REPAIR_CONDITIONS"
  | "FEATURE_GROWTH_ACCUMULATION"
  | "FEATURE_GROWTH_SELF_REVISION"
  | "FEATURE_GROWTH_FAILURE_TO_RULE"
  | "FEATURE_GROWTH_CHANGE_TRIGGER"
  | "FEATURE_WEALTH_RESOURCE_ORDER"
  | "FEATURE_WEALTH_VALUE_CONVERSION"
  | "FEATURE_WEALTH_STABILITY_BEFORE_EXPANSION"
  | "FEATURE_WEALTH_TIME_COST_AWARENESS"
  | "FEATURE_WEALTH_SYSTEM_ASSET"
  | "FEATURE_HEALTH_RHYTHM_RECOVERY"
  | "FEATURE_HEALTH_QUIET_RECOVERY"
  | "FEATURE_HEALTH_OVERLOAD_DELAY"
  | "FEATURE_HEALTH_SLEEP_DECISION_LINK"
  | "FEATURE_HEALTH_STOP_AS_RECOVERY"
  | "FEATURE_LIFEFLOW_REALIGNMENT"
  | "FEATURE_LIFEFLOW_TRANSITION_ADAPTATION"
  | "FEATURE_LIFEFLOW_PREPARATION_FOR_NEXT"
  | "FEATURE_LIFEFLOW_REPEATING_TASK"
  | "FEATURE_LIFEFLOW_TIMING_MODIFIER";

export type BlueprintFeatureDefinition = {
  id: BlueprintFeatureId;
  axis: BlueprintAxis;
  title: string;
  description: string;
  sourcePaths: string[];
  writerHints: string[];
  readerHints: string[];
  baseConfidence: number;
};

export type BlueprintFeature = BlueprintFeatureDefinition & {
  label: string;
  score: number;
  confidence: number;
  confidenceLabel: ConfidenceLabel;
  evidence: FeatureEvidence[];
  conflicts: FeatureConflict[];
  warnings: BlueprintRuntimeWarning[];
  confidenceBreakdown: ConfidenceBreakdown;
  sourceRefs: SourceReference[];
};

export type BlueprintReason = {
  id: string;
  title: string;
  description: string;
  relatedAxes: BlueprintAxis[];
  relatedFeatures: BlueprintFeatureId[];
  relatedFeatureIds: BlueprintFeatureId[];
  relatedVocabulary: string[];
  confidence: number;
  confidenceLabel: ConfidenceLabel;
  evidenceSummary: string;
  evidence: FeatureEvidence[];
  conflicts: FeatureConflict[];
  sourceRefs: SourceReference[];
  writerHints: string[];
};

export type WriterInput = {
  bookId: string;
  blueprintId: string;
  blueprintNo: string;
  subject: {
    name: string;
    blueprintNo: string;
  };
  familyCollection: {
    id: string;
    name: string;
    label: string;
  };
  authorName: string;
  edition: string;
  source: "pigbar-manse";
  coreSummary: string;
  sourceSummary: {
    pillars: string[];
    currentDaewoon: string | null;
    currentSewoon: string;
    calculationEngine: string;
  };
  topFeatures: BlueprintFeature[];
  topReasons: BlueprintReason[];
  weakSignals: BlueprintFeature[];
  conflicts: FeatureConflict[];
  provenance: {
    canonicalWarnings: BlueprintRuntimeWarning[];
    providerReliability: number;
    timeReliability: number;
    sourcePaths: string[];
  };
  suggestedTitle: string;
  chapterInputs: Array<{
    chapterId: string;
    chapterNo: number;
    title: string;
    targetQuestion: string;
    relatedReasons: string[];
    requiredTone: string[];
    avoidPhrases: string[];
    annotationSeeds: Array<{
      reasonId: string;
      featureIds: BlueprintFeatureId[];
      vocabularyIds: string[];
      confidence: number;
    }>;
  }>;
  traceSeed: Array<{
    reasonId: string;
    featureIds: BlueprintFeatureId[];
    vocabularyIds: string[];
    sajuSourcePaths: string[];
    confidence: number;
  }>;
  axes: Array<{
    axis: BlueprintAxis;
    question: string;
    primaryFeatureIds: BlueprintFeatureId[];
    primaryVocabularyIds: string[];
  }>;
  features: BlueprintFeature[];
  vocabulary: HumanVocabulary[];
  reasons: BlueprintReason[];
  writerRules: string[];
};

export type ChapterReasonTrace = {
  reasonId: string;
  reasonTitle: string;
  featureIds: BlueprintFeatureId[];
  vocabularyIds: string[];
  sajuSourcePaths: string[];
  confidence: number;
};

export type ChapterOutline = {
  chapterId: string;
  chapterNo: number;
  title: string;
  targetQuestion: string;
  thesis: string;
  reasonIds: string[];
  keyPoints: string[];
  requiredTone: string[];
  avoidPhrases: string[];
  reasonTrace: ChapterReasonTrace[];
};

export type ChapterDraft = {
  chapterId: string;
  paragraphs: Array<{
    paragraphId: string;
    text: string;
    reasonIds: string[];
    featureIds: BlueprintFeatureId[];
    vocabularyIds: string[];
  }>;
};

export type ChapterEditHistoryEntry = {
  stage: "outline" | "draft" | "rewrite" | "edit" | "final";
  changes: string[];
};

export type ChapterQuality = {
  score: number;
  confidence: number;
  checks: Array<{
    id: string;
    label: string;
    passed: boolean;
  }>;
};

export type ChapterRuntime = {
  chapterId: string;
  chapterNo: number;
  title: string;
  outline: ChapterOutline;
  draft: ChapterDraft;
  editHistory: ChapterEditHistoryEntry[];
  finalText: string;
  quality: ChapterQuality;
  reasonTrace: ChapterReasonTrace[];
};

export type BlueprintWriterRuntime = {
  bookId: string;
  blueprintNo: string;
  chapters: ChapterRuntime[];
  quality: ChapterQuality;
};

export type BlueprintAppendix = {
  pillars: {
    year: CanonicalPillar;
    month: CanonicalPillar;
    day: CanonicalPillar;
    hour: CanonicalOptionalPillar;
  };
  tenGods: Record<string, string | null>;
  elements: Record<string, number>;
  twelveStages: Record<string, string | null>;
  hiddenStems: Record<string, unknown[]>;
  relations: CanonicalManseInput["relations"];
  luck: CanonicalManseInput["luck"];
  classicalTrace?: Array<{
    chapterId: string;
    chapterNo: number;
    chapterTitle: string;
    sajuOriginal: string[];
    classical: string[];
    blueprint: string[];
    sources: string[];
    confidence: number;
  }>;
  reasonTrace: Array<{
    chapterId: string;
    chapterNo: number;
    chapterTitle: string;
    targetQuestion: string;
    reasonId: string;
    reasonTitle: string;
    featureIds: BlueprintFeatureId[];
    features: Array<{
      id: BlueprintFeatureId;
      label: string;
      confidence: number;
      evidence: FeatureEvidence[];
    }>;
    vocabularyIds: string[];
    vocabulary: Array<{
      id: string;
      name: string;
      category: string;
    }>;
    sajuSourcePaths: string[];
    calculationPaths: string[];
    confidence: number;
  }>;
};

export type BlueprintCoreRuntime = {
  blueprintId: string;
  blueprintNo: string;
  authorName: string;
  manse: ManseResult;
  canonicalManseInput: CanonicalManseInput;
  features: BlueprintFeature[];
  vocabulary: HumanVocabulary[];
  reasons: BlueprintReason[];
  writerInput: WriterInput;
  writerRuntime: BlueprintWriterRuntime;
  appendix: BlueprintAppendix;
};
