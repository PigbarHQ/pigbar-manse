import type { BlueprintFeature, HumanVocabulary } from "../types/runtime";
import { HUMAN_VOCABULARY } from "./registry";

export function selectVocabulary(features: BlueprintFeature[]): HumanVocabulary[] {
  const featureMap = new Map(features.map((feature) => [feature.id, feature]));

  return HUMAN_VOCABULARY.filter((vocabulary) =>
    vocabulary.featureSource.some((featureId) => {
      const feature = featureMap.get(featureId);
      return feature ? feature.confidence >= 0.68 : false;
    }),
  );
}

export function getVocabularyById(id: string) {
  return HUMAN_VOCABULARY.find((vocabulary) => vocabulary.id === id) ?? null;
}
