import { readCanonicalPath } from "../adapter";
import { BLUEPRINT_FEATURES } from "./registry";
import type {
  BlueprintFeature,
  BlueprintRuntimeWarning,
  CanonicalManseInput,
  ConfidenceBreakdown,
  ConfidenceLabel,
  FeatureConflict,
  FeatureEvidence,
  SourceReference,
} from "../types/runtime";

function compactValue(value: unknown): string | number | boolean | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.length;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.label === "string") return record.label;
    if (typeof record.ganji === "string") return record.ganji;
    if (typeof record.provider === "string") return record.provider;
    return Object.keys(record).length;
  }

  return String(value);
}

function getConfidenceLabel(confidence: number): ConfidenceLabel {
  if (confidence >= 0.9) return "High";
  if (confidence >= 0.75) return "Stable";
  if (confidence >= 0.6) return "Conditional";
  return "Low";
}

function roleForIndex(index: number, count: number): SourceReference["role"] {
  if (index === 0) return "primary";
  if (index === count - 1) return "timing";
  return "supporting";
}

function strengthForSource(path: string, role: SourceReference["role"], value: unknown): number {
  if (value === undefined || value === null) {
    return 0;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.confidence === "number") {
      return Math.max(0.4, Math.min(0.98, record.confidence));
    }
  }

  if (path.startsWith("provenance.")) {
    return 0.62;
  }

  if (role === "primary") {
    return 0.82;
  }

  if (role === "timing") {
    return 0.68;
  }

  return 0.74;
}

function signalForPath(path: string) {
  if (path.startsWith("pillars.")) return "pillar structure";
  if (path.startsWith("elements")) return "element distribution";
  if (path.startsWith("tenGods")) return "ten-gods structure";
  if (path.startsWith("hiddenStems")) return "hidden-stem support";
  if (path.startsWith("twelveStages")) return "stage rhythm";
  if (path.startsWith("luck.")) return "timing flow";
  if (path.startsWith("provenance.")) return "calculation provenance";
  return "canonical manse field";
}

function average(values: number[]) {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number) {
  return Number(value.toFixed(2));
}

function buildSourceRefs(
  canonical: CanonicalManseInput,
  sourcePaths: string[],
  featureId: string,
): {
  evidence: FeatureEvidence[];
  sourceRefs: SourceReference[];
  warnings: BlueprintRuntimeWarning[];
} {
  const evidence: FeatureEvidence[] = [];
  const sourceRefs: SourceReference[] = [];
  const warnings: BlueprintRuntimeWarning[] = [];

  sourcePaths.forEach((path, index) => {
    const result = readCanonicalPath(canonical, path);
    const role = roleForIndex(index, sourcePaths.length);
    const value = result.missing ? undefined : result.value;
    const compactedValue = compactValue(value);
    const strength = strengthForSource(path, role, value);

    if (result.warning) {
      warnings.push(result.warning);
    }

    sourceRefs.push({
      id: `${featureId}-source-${index + 1}`,
      label: path,
      path,
      role,
      value: compactedValue,
    });

    evidence.push({
      sourceType: "manse",
      path,
      signal: signalForPath(path),
      strength,
      value: compactedValue,
    });
  });

  return { evidence, sourceRefs, warnings };
}

function conflictsForFeature(canonical: CanonicalManseInput, warnings: BlueprintRuntimeWarning[]): FeatureConflict[] {
  const conflicts: FeatureConflict[] = [];
  const warningCount = canonical.provenance.rawWarningCount + warnings.length;

  if (warningCount > 0) {
    conflicts.push({
      path: "provenance.warnings",
      message: "Calculation warnings reduce feature confidence.",
      penalty: Math.min(0.08, warningCount * 0.015),
    });
  }

  if (canonical.provenance.providerReliability < 0.9) {
    conflicts.push({
      path: "provenance.solarTermEngine",
      message: "Solar term provider reliability is below the preferred threshold.",
      penalty: 0.05,
    });
  }

  return conflicts;
}

function confidenceBreakdown(input: {
  base: number;
  evidence: FeatureEvidence[];
  conflicts: FeatureConflict[];
  warnings: BlueprintRuntimeWarning[];
  canonical: CanonicalManseInput;
}): ConfidenceBreakdown {
  const sourceCount = input.evidence.filter((item) => item.strength > 0).length;
  const sourceStrength = average(input.evidence.map((item) => item.strength));
  const sourceAgreement = sourceCount / input.evidence.length;
  const sourceConflict = input.conflicts.reduce((sum, conflict) => sum + conflict.penalty, 0);
  const missingDataPenalty = Math.min(0.18, input.warnings.length * 0.04);
  const timeReliability = input.canonical.provenance.timeReliability;
  const providerReliability = input.canonical.provenance.providerReliability;
  const agreementBonus = sourceAgreement >= 1 ? 0.04 : sourceAgreement >= 0.75 ? 0.02 : 0;
  const strengthBonus = sourceStrength >= 0.8 ? 0.03 : sourceStrength >= 0.7 ? 0.01 : -0.02;
  const timePenalty = (1 - timeReliability) * 0.12;
  const providerPenalty = (1 - providerReliability) * 0.1;
  const final = Math.max(
    0.35,
    Math.min(
      0.98,
      input.base + agreementBonus + strengthBonus - sourceConflict - missingDataPenalty - timePenalty - providerPenalty,
    ),
  );

  return {
    base: input.base,
    sourceCount,
    sourceStrength: round(sourceStrength),
    sourceAgreement: round(sourceAgreement),
    sourceConflict: round(sourceConflict),
    timeReliability: round(timeReliability),
    providerReliability: round(providerReliability),
    missingDataPenalty: round(missingDataPenalty),
    final: round(final),
  };
}

export function buildFeatures(canonical: CanonicalManseInput): BlueprintFeature[] {
  return BLUEPRINT_FEATURES.map((definition) => {
    const sourceResult = buildSourceRefs(canonical, definition.sourcePaths, definition.id);
    const conflicts = conflictsForFeature(canonical, sourceResult.warnings);
    const breakdown = confidenceBreakdown({
      base: definition.baseConfidence,
      evidence: sourceResult.evidence,
      conflicts,
      warnings: sourceResult.warnings,
      canonical,
    });
    const confidence = breakdown.final;

    return {
      ...definition,
      label: definition.title,
      score: Math.round(confidence * 100),
      confidence,
      confidenceLabel: getConfidenceLabel(confidence),
      evidence: sourceResult.evidence,
      conflicts,
      warnings: sourceResult.warnings,
      confidenceBreakdown: breakdown,
      sourceRefs: sourceResult.sourceRefs,
    };
  });
}
