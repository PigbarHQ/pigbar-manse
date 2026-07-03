import type {
  BlueprintAppendix,
  BlueprintFeature,
  BlueprintReason,
  CanonicalManseInput,
  HumanVocabulary,
  WriterInput,
} from "../types/runtime";

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export function buildAppendix(input: {
  canonicalManseInput: CanonicalManseInput;
  features: BlueprintFeature[];
  reasons: BlueprintReason[];
  vocabulary: HumanVocabulary[];
  writerInput: WriterInput;
}): BlueprintAppendix {
  const featureMap = new Map(input.features.map((feature) => [feature.id, feature]));
  const reasonMap = new Map(input.reasons.map((reason) => [reason.id, reason]));
  const vocabularyMap = new Map(input.vocabulary.map((item) => [item.id, item]));

  return {
    pillars: input.canonicalManseInput.pillars,
    tenGods: input.canonicalManseInput.tenGods,
    elements: input.canonicalManseInput.elements,
    twelveStages: input.canonicalManseInput.twelveStages,
    hiddenStems: input.canonicalManseInput.hiddenStems,
    relations: input.canonicalManseInput.relations,
    luck: input.canonicalManseInput.luck,
    reasonTrace: input.writerInput.chapterInputs.flatMap((chapter) =>
      chapter.annotationSeeds.map((seed) => {
        const reason = reasonMap.get(seed.reasonId);
        const features = seed.featureIds
          .map((featureId) => featureMap.get(featureId))
          .filter((feature): feature is BlueprintFeature => Boolean(feature));
        const vocabulary = seed.vocabularyIds
          .map((vocabularyId) => vocabularyMap.get(vocabularyId))
          .filter((item): item is HumanVocabulary => Boolean(item));
        const evidencePaths = features.flatMap((feature) => feature.evidence.map((item) => item.path));

        return {
          chapterId: chapter.chapterId,
          chapterNo: chapter.chapterNo,
          chapterTitle: chapter.title,
          targetQuestion: chapter.targetQuestion,
          reasonId: seed.reasonId,
          reasonTitle: reason?.title ?? seed.reasonId,
          featureIds: seed.featureIds,
          features: features.map((feature) => ({
            id: feature.id,
            label: feature.label,
            confidence: feature.confidence,
            evidence: feature.evidence,
          })),
          vocabularyIds: seed.vocabularyIds,
          vocabulary: vocabulary.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
          })),
          sajuSourcePaths: unique(evidencePaths),
          calculationPaths: unique(features.flatMap((feature) => feature.sourceRefs.map((source) => source.path))),
          confidence: seed.confidence,
        };
      }),
    ),
  };
}
