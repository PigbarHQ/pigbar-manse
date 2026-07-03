import type { ManseResult } from "@/src/lib/manse";
import { adaptManseToCanonical } from "../adapter";
import { buildAppendix } from "../appendix";
import { buildFeatures } from "../features";
import { buildReasons } from "../reason";
import { selectVocabulary } from "../vocabulary";
import { buildWriterRuntime } from "../writer";
import { createWriterInput } from "./writerInput";
import type { BlueprintCoreRuntime } from "../types/runtime";

export type BuildBlueprintCoreOptions = {
  blueprintId: string;
  blueprintNo: string;
  authorName: string;
  edition?: string;
};

export function buildBlueprintCore(manse: ManseResult, options: BuildBlueprintCoreOptions): BlueprintCoreRuntime {
  const canonicalManseInput = adaptManseToCanonical(manse);
  const features = buildFeatures(canonicalManseInput);
  const vocabulary = selectVocabulary(features);
  const reasons = buildReasons(features, vocabulary);
  const writerInput = createWriterInput({
    blueprintId: options.blueprintId,
    blueprintNo: options.blueprintNo,
    authorName: options.authorName,
    edition: options.edition ?? "초판",
    canonicalManseInput,
    features,
    vocabulary,
    reasons,
  });
  const writerRuntime = buildWriterRuntime(writerInput);
  const appendix = buildAppendix({
    canonicalManseInput,
    features,
    vocabulary,
    reasons,
    writerInput,
  });

  return {
    blueprintId: options.blueprintId,
    blueprintNo: options.blueprintNo,
    authorName: options.authorName,
    manse,
    canonicalManseInput,
    features,
    vocabulary,
    reasons,
    writerInput,
    writerRuntime,
    appendix,
  };
}
