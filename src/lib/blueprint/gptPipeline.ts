import type { ManseInput, ManseResult } from "@/src/lib/manse";
import { calculateManse } from "@/src/lib/manse";
import {
  assertWriterCoreAxis,
  buildEditorialBrief,
  type BlueprintArchitectPlan,
  runPortraitBookQa,
} from "./architect";
import type { BlueprintBook } from "./types";
import type { BlueprintAppendix } from "./types/runtime";
import { buildBlueprintClassicalPublication, type BlueprintClassicalPublication } from "./no000001";
import { logOpenAiApiKeyStatus, readOpenAiBlueprintModel } from "./openaiEnv";
import { BLUEPRINT_PHILOSOPHY_PROMPT, BLUEPRINT_PHILOSOPHY_PROMPT_VERSION } from "./prompts/blueprintPhilosophyPrompt";
import { BLIND_CLASSICAL_PROMPT, BLIND_CLASSICAL_PROMPT_VERSION } from "./prompts/blindClassicalPrompt";
import { EDITORIAL_STYLE_PROMPT, EDITORIAL_STYLE_PROMPT_VERSION } from "./prompts/editorialStylePrompt";

export type PromptClassicalAnalysisSection = {
  index: number;
  title: string;
  sourceText: string;
  evidence: string[];
  structure: string;
  interpretation: string;
};

export type PromptClassicalAnalysisResult = {
  mode: "classical-myeongli";
  suggestedTitle: string;
  coreIdentity: string[];
  thinkingPattern: string[];
  relationshipPattern: string[];
  workPattern: string[];
  lifePattern: string[];
  shadowPattern: string[];
  strengthPattern: string[];
  weaknessPattern: string[];
  coreAxis: {
    verbForm: string;
    explanation: string;
  };
  coreQuestion: string;
  narrativeLensCandidates: string[];
  doRules: string[];
  dontRules: string[];
  notThisPerson: string[];
  finalCounselDirection: string;
  sections: PromptClassicalAnalysisSection[];
};

export type PromptPortraitBookResult = {
  title: string;
  coreAxis: string;
  narrativeLens: string;
  pages: Array<{
    pageNo: number;
    title: string;
    content: string;
  }>;
  finalCounsel: string;
};

type BlueprintGptResponseFormat = {
  type: "json_schema";
  name: string;
  strict: boolean;
  schema: Record<string, unknown>;
};

export type BlueprintGptRequest = {
  stage: "classical-analysis" | "editorial-book";
  systemPrompt: string;
  userPrompt: string;
  metadata: Record<string, string>;
  responseFormat?: BlueprintGptResponseFormat;
};

export type BlueprintGptClient = {
  generateText(request: BlueprintGptRequest): Promise<string>;
};

type OpenAiResponsesUsage = {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
};

type OpenAiResponsesPayload = {
  model?: string;
  output_text?: string;
  output?: Array<{ content?: Array<{ text?: string }> }>;
  usage?: OpenAiResponsesUsage;
};

const forbiddenBookModePhrases = [
  "고전은 이 대목에서",
  "고전의 언어",
  "이 문장들은",
  "이 말은",
  "원고는 위 해석을 벗어나",
  "근거는",
  "분석은",
  "해석은",
  "먼저 놓는다",
  "네 개의 기둥",
  "기둥",
  "구조",
  "원국",
  "오행",
  "십성",
  "천간",
  "지장간",
  "용신",
  "기신",
  "사주",
  "명리",
  "명조",
  "명리학적으로",
  "구조의 중심",
  "작동한다",
  "분석 결과",
  "결론적으로",
];

const forbiddenFinalCounselPhrases = [
  "이 구조",
  "중심",
  "작동",
  "기능",
  "흐름은 분명해진다",
  "흐름이",
  "분석",
  "해석",
  "원국",
  "오행",
  "십성",
  "천간",
  "지지",
];

const forbiddenBookModeMyeongliPatterns = [
  {
    label: "heavenly stem / earthly branch hanja",
    pattern: /[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]/,
  },
  {
    label: "myeongli technical term",
    pattern: /천간|지장간|오행|십성|원국|용신|상신|대운|월지|일간|일주|월주|시주|년주|연주|(?<![가-힣])지지(?![가-힣])/,
  },
];

const portraitBookResponseFormat: BlueprintGptResponseFormat = {
  type: "json_schema",
  name: "blueprint_portrait_book",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["title", "coreAxis", "narrativeLens", "pages", "finalCounsel"],
    properties: {
      title: { type: "string" },
      coreAxis: { type: "string" },
      narrativeLens: { type: "string" },
      pages: {
        type: "array",
        minItems: 4,
        maxItems: 6,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["pageNo", "title", "content"],
          properties: {
            pageNo: { type: "number" },
            title: { type: "string" },
            content: { type: "string" },
          },
        },
      },
      finalCounsel: { type: "string" },
    },
  },
};

function parseJsonObject<T>(value: string): T {
  const trimmed = value.trim();
  const jsonText = trimmed.startsWith("{") ? trimmed : trimmed.slice(trimmed.indexOf("{"), trimmed.lastIndexOf("}") + 1);

  return JSON.parse(jsonText) as T;
}

function formatOpenAiDuration(elapsedMs: number) {
  return `${(elapsedMs / 1000).toFixed(1)} sec (${elapsedMs} ms)`;
}

function usageValue(usage: OpenAiResponsesUsage | undefined, primary: keyof OpenAiResponsesUsage, fallback: keyof OpenAiResponsesUsage) {
  return usage?.[primary] ?? usage?.[fallback] ?? "n/a";
}

function requiredFieldPresent(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return typeof value === "number" || (typeof value === "string" && value.trim().length > 0);
}

function mansePromptPayload(manse: ManseResult) {
  return {
    subject: {
      name: manse.input.name,
      birthDate: manse.input.birthDate,
      birthTime: manse.input.birthTime,
      unknownTime: manse.input.unknownTime,
      gender: manse.input.gender,
      birthPlace: manse.input.birthPlace,
    },
    saju: manse.saju,
    tenGods: manse.tenGods,
    fiveElementsDistribution: manse.natalChart.fiveElementsDistribution,
    hiddenStems: manse.natalChart.hiddenStems,
    twelveStages: manse.twelveStages,
    daeun: manse.daeun,
    currentLuck: manse.currentLuck,
    warnings: manse.warnings,
  };
}

function requiredStringArray(value: unknown) {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string" && item.trim().length > 0);
}

function blueprintSystemPrompt(stagePrompt: string) {
  return [
    "System Prompt",
    BLUEPRINT_PHILOSOPHY_PROMPT,
    stagePrompt,
  ].join("\n\n");
}

function assertClassicalAnalysis(value: PromptClassicalAnalysisResult) {
  if (value.mode !== "classical-myeongli") throw new Error("GPT classical analysis mode is invalid.");
  if (value.sections.length !== 19) throw new Error("GPT classical analysis must contain exactly 19 sections.");
  if (!value.coreAxis?.verbForm || !value.coreAxis.explanation) throw new Error("GPT classical analysis coreAxis is incomplete.");
  assertWriterCoreAxis(value.coreAxis.verbForm);
  if (!value.coreQuestion) throw new Error("GPT classical analysis coreQuestion is incomplete.");
  if (!value.finalCounselDirection) throw new Error("GPT classical analysis finalCounselDirection is incomplete.");
  if (!requiredStringArray(value.coreIdentity)) throw new Error("GPT classical analysis coreIdentity is incomplete.");
  if (!requiredStringArray(value.thinkingPattern)) throw new Error("GPT classical analysis thinkingPattern is incomplete.");
  if (!requiredStringArray(value.relationshipPattern)) throw new Error("GPT classical analysis relationshipPattern is incomplete.");
  if (!requiredStringArray(value.workPattern)) throw new Error("GPT classical analysis workPattern is incomplete.");
  if (!requiredStringArray(value.lifePattern)) throw new Error("GPT classical analysis lifePattern is incomplete.");
  if (!requiredStringArray(value.shadowPattern)) throw new Error("GPT classical analysis shadowPattern is incomplete.");
  if (!requiredStringArray(value.strengthPattern)) throw new Error("GPT classical analysis strengthPattern is incomplete.");
  if (!requiredStringArray(value.weaknessPattern)) throw new Error("GPT classical analysis weaknessPattern is incomplete.");
  if (!requiredStringArray(value.doRules)) throw new Error("GPT classical analysis doRules is incomplete.");
  if (!requiredStringArray(value.dontRules)) throw new Error("GPT classical analysis dontRules is incomplete.");
  if (!requiredStringArray(value.notThisPerson)) throw new Error("GPT classical analysis notThisPerson is incomplete.");
  if (!requiredStringArray(value.narrativeLensCandidates)) throw new Error("GPT classical analysis narrativeLensCandidates is incomplete.");

  value.sections.forEach((section, index) => {
    if (section.index !== index + 1) throw new Error(`GPT classical section ${index + 1} has an invalid index.`);
    if (!section.title || !section.sourceText || !section.structure || !section.interpretation) {
      throw new Error(`GPT classical section ${section.index} is incomplete.`);
    }
  });
}

function forbiddenBookModeMyeongliHit(text: string) {
  for (const item of forbiddenBookModeMyeongliPatterns) {
    const match = text.match(item.pattern);

    if (match) {
      return {
        label: item.label,
        value: match[0],
      };
    }
  }

  return null;
}

function portraitText(value: PromptPortraitBookResult) {
  return [value.title, value.coreAxis, value.narrativeLens, ...value.pages.map((page) => `${page.title}\n${page.content}`), value.finalCounsel].join("\n");
}

function assertPortraitBook(value: PromptPortraitBookResult, architectPlan: BlueprintArchitectPlan) {
  const missingFields = ["title", "coreAxis", "narrativeLens", "pages", "finalCounsel"].filter((field) => {
    const record = value as unknown as Record<string, unknown>;

    return !requiredFieldPresent(record[field]);
  });

  if (missingFields.length > 0) {
    throw new Error(`GPT portrait book schema validation failed: missing ${missingFields.join(", ")}`);
  }

  if (!Array.isArray(value.pages) || value.pages.length < 4 || value.pages.length > 6) {
    throw new Error("GPT portrait book pages must contain 4 to 6 pages.");
  }

  value.pages.forEach((page, index) => {
    if (page.pageNo !== index + 1) {
      throw new Error(`GPT portrait book page ${index + 1} has an invalid pageNo.`);
    }
    if (!page.title?.trim() || !page.content?.trim()) {
      throw new Error(`GPT portrait book page ${index + 1} is incomplete.`);
    }
  });

  const text = portraitText(value);
  const blocked = forbiddenBookModePhrases.find((phrase) => text.includes(phrase));
  const finalCounselBlocked = forbiddenFinalCounselPhrases.find((phrase) => value.finalCounsel.includes(phrase));
  const myeongliBlocked = forbiddenBookModeMyeongliHit(text);

  if (blocked) throw new Error(`GPT portrait book contains forbidden report phrase: ${blocked}`);
  if (finalCounselBlocked) throw new Error(`GPT portrait book finalCounsel contains forbidden analysis phrase: ${finalCounselBlocked}`);
  if (myeongliBlocked) {
    throw new Error(`GPT portrait book contains forbidden Book Mode myeongli marker: ${myeongliBlocked.label} (${myeongliBlocked.value})`);
  }
  assertWriterCoreAxis(architectPlan.writerCoreAxis);
  assertWriterCoreAxis(value.coreAxis);

  if (value.coreAxis !== architectPlan.writerCoreAxis) {
    throw new Error(`GPT portrait book coreAxis mismatch: expected ${architectPlan.writerCoreAxis}`);
  }
  if (
    !value.finalCounsel.includes("당신은") ||
    !/(가장 당신답다|하세요|하십시오|해야 한다|해야 합니다|필요하다|필요합니다)/.test(value.finalCounsel)
  ) {
    throw new Error("GPT portrait book finalCounsel must be second-person counsel.");
  }

}

export async function generateClassicalAnalysis(
  manse: ManseResult,
  client: BlueprintGptClient,
): Promise<PromptClassicalAnalysisResult> {
  console.info("[Blueprint]\nGenerating Classical Analysis...");

  const userPrompt = [
    "Analyze this manse result using the fixed Blind Classical Prompt.",
    "Return strict JSON only.",
    JSON.stringify(mansePromptPayload(manse), null, 2),
  ].join("\n\n");
  const text = await client.generateText({
    stage: "classical-analysis",
    systemPrompt: blueprintSystemPrompt(BLIND_CLASSICAL_PROMPT),
    userPrompt,
    metadata: {
      promptVersion: `${BLUEPRINT_PHILOSOPHY_PROMPT_VERSION}+${BLIND_CLASSICAL_PROMPT_VERSION}`,
      subject: manse.input.name,
    },
  });
  const result = parseJsonObject<PromptClassicalAnalysisResult>(text);

  assertClassicalAnalysis(result);

  return result;
}

export async function generatePortraitBook(
  classicalAnalysis: PromptClassicalAnalysisResult,
  baseBook: BlueprintBook,
  client: BlueprintGptClient,
): Promise<BlueprintBook> {
  console.info("[Blueprint]\nGenerating Portrait Book...");
  const editorialBrief = buildEditorialBrief(classicalAnalysis);

  const userPrompt = [
    "Blind 결과 JSON과 selected Narrative Lens만 보고 Portrait Book 전체를 한 번에 쓴다.",
    "TypeScript가 coreAxis, lens, finalCounselDirection을 해석하지 않는다.",
    "coreAxis는 Blind 결과 JSON의 coreAxis.verbForm을 그대로 반환한다.",
    "selected Narrative Lens는 아래 값을 그대로 사용한다.",
    editorialBrief.selectedLens,
    "출력은 title, coreAxis, narrativeLens, pages, finalCounsel만 가진 JSON이다.",
    "pages는 4~6개의 Portrait Book 페이지 배열이다.",
    "긴 글 하나를 단순히 잘라 붙이지 말고 각 page를 독립된 카드처럼 쓴다.",
    "Book Mode에 사주/명리/원국/천간/지지/오행/십성/한자/분석 보고서 흔적을 절대 쓰지 않는다.",
    "Final Counsel은 반드시 2인칭 당부형으로 쓴다.",
    "Blind GPT Result JSON:",
    JSON.stringify({
      suggestedTitle: classicalAnalysis.suggestedTitle,
      coreAxis: classicalAnalysis.coreAxis,
      coreQuestion: classicalAnalysis.coreQuestion,
      narrativeLensCandidates: classicalAnalysis.narrativeLensCandidates,
      selectedLens: editorialBrief.selectedLens,
      doRules: classicalAnalysis.doRules,
      dontRules: classicalAnalysis.dontRules,
      notThisPerson: classicalAnalysis.notThisPerson,
      finalCounselDirection: classicalAnalysis.finalCounselDirection,
      humanPatterns: {
        coreIdentity: classicalAnalysis.coreIdentity,
        thinkingPattern: classicalAnalysis.thinkingPattern,
        relationshipPattern: classicalAnalysis.relationshipPattern,
        workPattern: classicalAnalysis.workPattern,
        lifePattern: classicalAnalysis.lifePattern,
        shadowPattern: classicalAnalysis.shadowPattern,
        strengthPattern: classicalAnalysis.strengthPattern,
        weaknessPattern: classicalAnalysis.weaknessPattern,
      },
      classicalSections: classicalAnalysis.sections,
    }, null, 2),
  ].join("\n\n");
  const text = await client.generateText({
    stage: "editorial-book",
    systemPrompt: blueprintSystemPrompt(EDITORIAL_STYLE_PROMPT),
    userPrompt,
    metadata: {
      promptVersion: `${BLUEPRINT_PHILOSOPHY_PROMPT_VERSION}+${EDITORIAL_STYLE_PROMPT_VERSION}`,
      sourceMode: "blind-classical-result",
      output: "portrait-book",
    },
    responseFormat: portraitBookResponseFormat,
  });

  console.info("[Blueprint]\nPortrait Book GPT raw response:");
  console.info(text);

  let result: PromptPortraitBookResult;

  try {
    result = parseJsonObject<PromptPortraitBookResult>(text);
    console.info("[Blueprint]\nPortrait Book JSON parse: success");
  } catch (error) {
    console.error("[Blueprint]\nPortrait Book JSON parse: failed");
    console.error(error);
    throw error;
  }

  assertPortraitBook(result, editorialBrief);
  const qa = runPortraitBookQa({
    bookText: portraitText(result),
    architectPlan: editorialBrief,
    forbiddenPhrases: forbiddenBookModePhrases,
  });

  if (qa.warnings.length > 0) {
    console.warn("[Blueprint QA]\n" + qa.warnings.join("\n"));
  }

  return {
    ...baseBook,
    metadata: {
      ...baseBook.metadata,
      title: result.title || classicalAnalysis.suggestedTitle,
      subtitle: "Portrait Book",
      sourceName: "Pigbar GPT Writer",
    },
    portrait: {
      title: result.title,
      coreAxis: result.coreAxis,
      narrativeLens: result.narrativeLens,
      pages: result.pages,
      finalCounsel: result.finalCounsel,
    },
    chapters: [],
  };
}

function appendPromptClassicalTrace(
  appendix: BlueprintAppendix,
  classicalAnalysis: PromptClassicalAnalysisResult,
): BlueprintAppendix {
  return {
    ...appendix,
    reasonTrace: [],
    classicalTrace: classicalAnalysis.sections.map((section) => ({
      chapterId: `GPT_CLASSICAL_${String(section.index).padStart(2, "0")}`,
      chapterNo: section.index,
      chapterTitle: section.title,
      sajuOriginal: section.evidence.length ? section.evidence : [section.sourceText],
      classical: section.structure.split("\n").filter(Boolean),
      blueprint: section.interpretation.split("\n").filter(Boolean),
      sources: ["GPT Blind Classical Prompt"],
      confidence: 1,
    })),
  };
}

export async function buildGptBlueprintPublication(input: {
  manseInput: ManseInput;
  client: BlueprintGptClient;
  blueprintId?: string;
  blueprintNo?: string;
  edition?: string;
}): Promise<BlueprintClassicalPublication> {
  const manse = calculateManse(input.manseInput);
  const seedPublication = buildBlueprintClassicalPublication({
    manseInput: input.manseInput,
    blueprintId: input.blueprintId,
    blueprintNo: input.blueprintNo,
    edition: input.edition,
  });
  const classicalAnalysis = await generateClassicalAnalysis(manse, input.client);
  const editorialBrief = buildEditorialBrief(classicalAnalysis);
  const book = await generatePortraitBook(classicalAnalysis, seedPublication.book, input.client);
  const appendix = appendPromptClassicalTrace(seedPublication.runtime.appendix, classicalAnalysis);
  const qa = runPortraitBookQa({
    bookText: book.portrait
      ? [
          book.portrait.title,
          book.portrait.coreAxis,
          book.portrait.narrativeLens,
          ...book.portrait.pages.map((page) => `${page.title}\n${page.content}`),
          book.portrait.finalCounsel,
        ].join("\n")
      : "",
    architectPlan: editorialBrief,
    forbiddenPhrases: forbiddenBookModePhrases,
  });

  return {
    ...seedPublication,
    manse,
    book,
    classicalAnalysis: {
      mode: "classical-myeongli",
      input: seedPublication.classicalAnalysis.input,
      suggestedTitle: classicalAnalysis.suggestedTitle,
      sections: classicalAnalysis.sections.map((section) => ({
        id: `GPT_CLASSICAL_${String(section.index).padStart(2, "0")}`,
        order: section.index,
        title: section.title,
        layers: [
          {
            sajuOriginal: section.evidence.length ? section.evidence : [section.sourceText],
            classical: section.structure.split("\n").filter(Boolean),
            blueprint: section.interpretation.split("\n").filter(Boolean),
          },
        ],
        body: section.interpretation.split("\n").filter(Boolean),
        evidence: seedPublication.classicalAnalysis.sections[section.index - 1]?.evidence ?? seedPublication.classicalAnalysis.sections[0].evidence,
      })),
    },
    runtime: {
      ...seedPublication.runtime,
      appendix,
      writerInput: {
        ...seedPublication.runtime.writerInput,
        coreSummary: `${editorialBrief.writerCoreAxis} · Lens: ${editorialBrief.lensCode}`,
        suggestedTitle: classicalAnalysis.suggestedTitle,
        classicalAnalysis: classicalAnalysis.sections,
        architectPlan: editorialBrief,
      },
      writerRuntime: {
        bookId: seedPublication.runtime.writerRuntime.bookId,
        blueprintNo: seedPublication.runtime.writerRuntime.blueprintNo,
        chapters: [],
        quality: {
          score: 100,
          confidence: 1,
          checks: [
            { id: "GPT_CLASSICAL_PROMPT", label: "Blind Classical Prompt 실행", passed: true },
            { id: "BLIND_EDITORIAL_FIELDS", label: "Blind Editorial Fields 검증", passed: true },
            { id: "GPT_EDITORIAL_PROMPT", label: "Editorial Style Prompt 실행", passed: true },
            { id: "PORTRAIT_QA_BLIND_FIDELITY", label: `Blind Fidelity ${qa.blindFidelityScore}`, passed: qa.blindFidelityScore >= 80 },
            { id: "PORTRAIT_QA_LENS", label: `Lens Consistency ${qa.lensConsistencyScore}`, passed: qa.lensConsistencyScore >= 70 },
            { id: "PORTRAIT_QA_DUPLICATE", label: `Duplicate Pattern ${qa.duplicatePatternScore}`, passed: qa.duplicatePatternScore >= 80 },
          ],
        },
      },
    },
  };
}

export function createOpenAIBlueprintGptClient(input: {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}): BlueprintGptClient {
  return {
    async generateText(request) {
      const model = input.model ?? readOpenAiBlueprintModel();
      const startedAt = Date.now();

      console.info(`[OpenAI]\nStarting ${request.stage} request...`);
      console.info(`[OpenAI]\nModel: ${model}`);

      const response = await fetch(`${input.baseUrl ?? "https://api.openai.com/v1"}/responses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: [
            { role: "system", content: request.systemPrompt },
            { role: "user", content: request.userPrompt },
          ],
          ...(request.responseFormat
            ? {
                text: {
                  format: request.responseFormat,
                },
              }
            : {}),
        }),
      });

      if (!response.ok) {
        throw new Error(`GPT Writer request failed: ${response.status}`);
      }

      const data = await response.json() as OpenAiResponsesPayload;
      const elapsedMs = Date.now() - startedAt;
      const promptTokens = usageValue(data.usage, "input_tokens", "prompt_tokens");
      const completionTokens = usageValue(data.usage, "output_tokens", "completion_tokens");
      const totalTokens = data.usage?.total_tokens ?? "n/a";

      console.info(`[OpenAI]\nCompleted in ${formatOpenAiDuration(elapsedMs)}`);
      console.info(`Prompt Tokens: ${promptTokens}`);
      console.info(`Completion Tokens: ${completionTokens}`);
      console.info(`Total Tokens: ${totalTokens}`);
      console.info(`Model: ${data.model ?? model}`);

      return data.output_text ?? data.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").join("") ?? "";
    },
  };
}

export function createConfiguredBlueprintGptClient() {
  const apiKey = logOpenAiApiKeyStatus();

  return apiKey
    ? createOpenAIBlueprintGptClient({
        apiKey,
        model: readOpenAiBlueprintModel(),
      })
    : null;
}
