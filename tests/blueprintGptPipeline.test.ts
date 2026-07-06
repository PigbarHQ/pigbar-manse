import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import {
  buildGptBlueprintPublication,
  createOpenAIBlueprintGptClient,
  type BlueprintGptClient,
  type PromptClassicalAnalysisResult,
  type PromptPortraitBookResult,
} from "../src/lib/blueprint/gptPipeline";
import { logOpenAiApiKeyStatus, maskOpenAiApiKey } from "../src/lib/blueprint/openaiEnv";
import { buildEmptyBlueprintPublication } from "../src/lib/blueprint/emptyPublication";
import { hasMyeongliCoreAxisTerms } from "../src/lib/blueprint/architect";
import { loadBlueprintPrompt } from "../src/lib/blueprint/prompts/promptLoader";
import { blueprintNo000001Input } from "../src/lib/blueprint/no000001";
import { CITY_OPTIONS, type ManseInput } from "../src/lib/manse";

const sectionTitles = [
  "명조 확정",
  "명조 핵심 구조",
  "적천수",
  "궁통보감",
  "육친론",
  "용신·상신",
  "병약론",
  "체용론",
  "희기신론",
  "리더십 구조",
  "재물 생성 구조",
  "후반 인생 구조",
  "종합 검증",
  "최종 압축",
  "기능적 역할 구조",
  "반복 충돌 구조",
  "기능이 살아나는 환경",
  "구조적 한계",
  "최종 한 문장",
];

const forbiddenBookPhrases = [
  "고전은 이 대목에서",
  "이 문장들은",
  "이 말은",
  "원고는 위 해석을 벗어나",
  "근거는",
  "분석은",
  "먼저 놓는다",
  "고전의 언어",
  "네 개의 기둥",
  "원국",
  "오행",
  "십성",
  "천간",
  "지장간",
  "용신",
  "기신",
  "명리학적으로",
  "구조의 중심",
  "작동한다",
  "분석 결과",
  "결론적으로",
];

function manseForLee(): ManseInput {
  const seoul = CITY_OPTIONS[0];

  return {
    name: "이진희",
    birthDate: "1975-11-12",
    calendarType: "solar",
    isLeapMonth: false,
    birthTime: "22:00",
    unknownTime: false,
    gender: "male",
    birthPlace: {
      name: seoul.name,
      label: seoul.name,
      latitude: seoul.latitude,
      longitude: seoul.longitude,
      timezone: "Asia/Seoul",
    },
    useLocalMeanTime: true,
    currentDateTime: "2026-07-02T12:30:00+09:00",
    ziHourRule: "midnight",
    daewoonDirectionRule: "standard",
  };
}

function fakeClassical(name: string): PromptClassicalAnalysisResult {
  const isLee = name.includes("이진희");
  const marker = isLee ? "壬水 / 戌 / 亥 / 목 2 / 화 1 / 토 1 / 금 1 / 수 3" : "壬水 / 申 / 未 / 목 3 / 화 0 / 토 1 / 금 2 / 수 2";

  return {
    mode: "classical-myeongli",
    suggestedTitle: isLee ? "해월 중심 구조" : "미월 유통 구조",
    coreIdentity: [isLee ? "중심을 지켜 구조를 세운다" : "흐름을 이어 구조를 살린다"],
    thinkingPattern: [isLee ? "기준을 오래 붙잡고 판단한다" : "흐름의 순서를 따라 판단한다"],
    relationshipPattern: [isLee ? "거리를 두고 신뢰를 쌓는다" : "이어지는 방식으로 관계를 만든다"],
    workPattern: [isLee ? "중심이 잡힌 뒤 움직인다" : "만들고 전달하며 기능을 살린다"],
    lifePattern: [isLee ? "흔들림 속에서 중심을 보존한다" : "정체보다 유통 속에서 살아난다"],
    shadowPattern: [isLee ? "중심이 강해 움직임이 늦어질 수 있다" : "흐름이 막히면 기능이 둔해질 수 있다"],
    strengthPattern: [isLee ? "오래 버티는 힘이 있다" : "이어지게 하는 힘이 있다"],
    weaknessPattern: [isLee ? "새 흐름을 늦게 받아들일 수 있다" : "멈춘 자리에서 힘이 줄 수 있다"],
    coreAxis: {
      verbForm: isLee ? "중심을 지켜 준다" : "흐름을 이어지게 한다",
      explanation: isLee ? "구조는 흔들림보다 중심을 먼저 세운다." : "구조는 멈춤보다 이어지는 작동에서 살아난다.",
    },
    coreQuestion: isLee ? "사람은 무엇을 오래 지켜 낼 때 자기 자신에 가까워지는가." : "사람은 무엇을 통과하며 자기 방식이 되는가.",
    narrativeLensCandidates: [isLee ? "Pillar" : "Bridge", "Road"],
    doRules: [isLee ? "중심이 설 시간을 준다" : "흐름이 끊기지 않게 한다"],
    dontRules: [isLee ? "성급히 방향을 바꾸지 않는다" : "정체를 본래 성향으로 단정하지 않는다"],
    notThisPerson: [isLee ? "서두르는 사람으로 쓰지 않는다" : "멈춘 사람으로 단정하지 않는다"],
    finalCounselDirection: isLee ? "서두르기보다 오래 지켜 주는 쪽으로 당부한다." : "멈춤보다 다시 이어 주는 쪽으로 당부한다.",
    sections: sectionTitles.map((title, index) => ({
      index: index + 1,
      title,
      sourceText: index === 2 ? marker : `${title} source ${isLee ? "lee" : "ju"}`,
      evidence: index === 2 ? marker.split(" / ") : [`${title} evidence ${isLee ? "lee" : "ju"}`],
      structure:
        index === 2
          ? isLee
            ? "중심은 강하다.\n밖으로 이어지는 길은 조건을 기다린다."
            : "근원은 존재한다.\n출력은 강하다.\n정체보다 유통이 자연스럽다."
          : `${title} structure ${isLee ? "lee" : "ju"}`,
      interpretation:
        index === 2
          ? isLee
            ? "흔들리지 않는 중심에서 작동이 시작된다."
            : "멈춰 있는 상태보다 흐르는 상태에서 본래 구조가 살아난다."
          : `${title} interpretation ${isLee ? "lee" : "ju"}`,
    })),
  };
}

function fakeBook(classical: PromptClassicalAnalysisResult): PromptPortraitBookResult {
  const isLee = classical.suggestedTitle.includes("해월");

  return {
    title: isLee ? "오래 지켜낸 중심" : "강이 모르는 바다",
    coreAxis: classical.coreAxis.verbForm,
    narrativeLens: classical.narrativeLensCandidates[0],
    pages: [
      {
        pageNo: 1,
        title: "도입",
        content: isLee ? "우물은 깊이를 소리로 증명하지 않는다." : "강은 바다를 향해 흐르지만 바다를 본 적이 없다.",
      },
      { pageNo: 2, title: "첫 발견", content: `첫 번째 문단 ${isLee ? "lee" : "ju"} ${classical.coreAxis.verbForm}` },
      { pageNo: 3, title: "본질", content: `두 번째 문단 ${isLee ? "lee" : "ju"}` },
      { pageNo: 4, title: "확장", content: `세 번째 문단 ${isLee ? "lee" : "ju"}` },
      { pageNo: 5, title: "정리", content: `네 번째 문단 ${isLee ? "lee" : "ju"}` },
    ],
    finalCounsel: isLee
      ? "당신은 서둘러 흔들릴 때보다, 오래 지켜 줄 때 가장 당신답다."
      : "당신은 혼자 멈춰 설 때보다, 끊어진 것을 다시 이어 줄 때 가장 당신답다.",
  };
}

function fakeClient(): BlueprintGptClient {
  let lastClassical: PromptClassicalAnalysisResult | null = null;

  return {
    async generateText(request) {
      if (request.stage === "classical-analysis") {
        const result = fakeClassical(request.userPrompt.includes("이진희") ? "이진희" : "주영지");
        lastClassical = result;

        return JSON.stringify(result);
      }
      return JSON.stringify(fakeBook(lastClassical ?? fakeClassical("주영지")));
    },
  };
}

function bookText(publication: Awaited<ReturnType<typeof buildGptBlueprintPublication>>) {
  return publication.book.portrait
    ? [
        publication.book.portrait.title,
        publication.book.portrait.coreAxis,
        publication.book.portrait.narrativeLens,
        ...publication.book.portrait.pages.map((page) => `${page.title}\n${page.content}`),
        publication.book.portrait.finalCounsel,
      ].join("\n")
    : "";
}

test("Fixed prompts load from Markdown with versions", () => {
  const blueprintPhilosophyPrompt = loadBlueprintPrompt("blueprint-philosophy");
  const blindClassicalPrompt = loadBlueprintPrompt("blind-classical");
  const editorialStylePrompt = loadBlueprintPrompt("editorial-style");

  assert.equal(blueprintPhilosophyPrompt.version, "1.0.0");
  assert.equal(blindClassicalPrompt.version, "3.0.0");
  assert.equal(editorialStylePrompt.version, "3.3.0");
  assert.ok(blueprintPhilosophyPrompt.content.length > 100);
  assert.ok(blindClassicalPrompt.content.length > 100);
  assert.ok(editorialStylePrompt.content.length > 100);
  assert.notEqual(blueprintPhilosophyPrompt.content, blindClassicalPrompt.content);
  assert.notEqual(blindClassicalPrompt.content, editorialStylePrompt.content);
});

test("GPT prompts are externalized to Markdown files", () => {
  const pipelineSource = readFileSync(new URL("../src/lib/blueprint/gptPipeline.ts", import.meta.url), "utf8");
  const promptLoaderSource = readFileSync(new URL("../src/lib/blueprint/prompts/promptLoader.ts", import.meta.url), "utf8");
  const promptDirectory = readdirSync(new URL("../src/lib/blueprint/prompts", import.meta.url));
  const promptNames = [
    "blueprint-system",
    "blueprint-philosophy",
    "blind-classical",
    "editorial-style",
    "classical-analysis-user",
    "portrait-book-user",
  ] as const;

  promptNames.forEach((name) => {
    const promptStart = loadBlueprintPrompt(name).content.slice(0, 24);

    assert.ok(promptDirectory.includes(`${name}.md`));
    assert.equal(pipelineSource.includes(promptStart), false);
    assert.equal(promptLoaderSource.includes(promptStart), false);
  });
  assert.equal(promptDirectory.some((fileName) => fileName.endsWith("Prompt.ts")), false);
});

test("GPT pipeline stores GPT classical analysis in Evidence and GPT manuscript in Book Mode", async () => {
  const prompts: string[] = [];
  const client: BlueprintGptClient = {
    async generateText(request) {
      if (request.stage === "classical-analysis") {
        prompts.push(request.userPrompt);
        return JSON.stringify(fakeClassical("주영지"));
      }

      return JSON.stringify(fakeBook(fakeClassical("주영지")));
    },
  };
  const publication = await buildGptBlueprintPublication({
    manseInput: blueprintNo000001Input,
    client,
  });
  const text = bookText(publication);
  const traceThree = publication.runtime.appendix.classicalTrace?.[2];

  assert.doesNotMatch(prompts[0], /compactSajuAnalysis|blindCompiler/);
  assert.equal(publication.runtime.writerInput.coreSummary, "흐름을 이어지게 한다 · Lens: Bridge");
  assert.equal(publication.runtime.writerInput.architectPlan?.rawCoreAxis, "흐름을 이어지게 한다");
  assert.equal(publication.runtime.writerInput.architectPlan?.writerCoreAxis, "흐름을 이어지게 한다");
  assert.equal(publication.runtime.writerInput.architectPlan?.lensCode, "Bridge");
  assert.equal(publication.runtime.writerInput.architectPlan?.lensLabelKo, "Bridge");
  assert.ok(publication.runtime.writerInput.architectPlan?.allowedVocabulary.includes("Bridge"));
  assert.ok(publication.runtime.writerInput.architectPlan?.forbiddenVocabulary.includes("원국"));
  assert.equal(publication.book.chapters.length, 0);
  assert.equal(publication.book.portrait?.title, "강이 모르는 바다");
  assert.equal(publication.book.portrait?.coreAxis, "흐름을 이어지게 한다");
  assert.equal(publication.book.portrait?.narrativeLens, "Bridge");
  assert.match(publication.book.portrait?.pages[0]?.content ?? "", /강은 바다를 향해 흐르지만/);
  assert.ok(Array.isArray(publication.book.portrait?.pages));
  assert.equal(publication.book.portrait?.pages.length, 5);
  assert.ok(traceThree);
  assert.equal(traceThree.chapterTitle, "적천수");
  assert.match(traceThree.classical.join("\n"), /근원은 존재한다/);
  assert.doesNotMatch(text, /근원은 존재한다/);
  forbiddenBookPhrases.forEach((phrase) => assert.doesNotMatch(text, new RegExp(phrase)));
});

test("Blind GPT result keeps explicit lens code and human-language coreAxis", () => {
  const classical = fakeClassical("주영지");

  assert.equal(classical.coreAxis.verbForm, "흐름을 이어지게 한다");
  assert.equal(hasMyeongliCoreAxisTerms(classical.coreAxis.verbForm), false);
  assert.deepEqual(classical.narrativeLensCandidates, ["Bridge", "Road"]);
});

test("Portrait writer prompt receives Blind GPT Result JSON directly", async () => {
  const prompts: string[] = [];
  const systemPrompts: string[] = [];
  const classical = fakeClassical("주영지");
  const client: BlueprintGptClient = {
    async generateText(request) {
      systemPrompts.push(request.systemPrompt);

      if (request.stage === "classical-analysis") {
        return JSON.stringify(classical);
      }
      prompts.push(request.userPrompt);

      return JSON.stringify(fakeBook(classical));
    },
  };

  await buildGptBlueprintPublication({
    manseInput: blueprintNo000001Input,
    client,
  });

  assert.ok(prompts.length > 0);
  assert.equal(systemPrompts.length, 2);
  assert.ok(systemPrompts[0].includes(loadBlueprintPrompt("blueprint-philosophy").content));
  assert.ok(systemPrompts[0].includes(loadBlueprintPrompt("blind-classical").content));
  assert.ok(systemPrompts[1].includes(loadBlueprintPrompt("blueprint-philosophy").content));
  assert.ok(systemPrompts[1].includes(loadBlueprintPrompt("editorial-style").content));
  assert.ok(prompts[0].includes(loadBlueprintPrompt("portrait-book-user").content.split("{{SELECTED_LENS}}")[0].trim()));
  assert.match(prompts[0], /흐름을 이어지게 한다/);
  assert.match(prompts[0], /"coreAxis"\s*:/);
  assert.match(prompts[0], /notThisPerson/);
});

test("GPT classical trace handles non-string section fields without blocking Portrait Book", async () => {
  const classical = fakeClassical("주영지");

  classical.sections[0].structure = ["첫 줄", { marker: "object-structure" }];
  classical.sections[0].interpretation = { summary: "객체 해석" };

  const client: BlueprintGptClient = {
    async generateText(request) {
      return request.stage === "classical-analysis"
        ? JSON.stringify(classical)
        : JSON.stringify(fakeBook(classical));
    },
  };

  const publication = await buildGptBlueprintPublication({
    manseInput: blueprintNo000001Input,
    client,
  });

  assert.equal(publication.book.portrait?.pages.length, 5);
  assert.deepEqual(publication.runtime.appendix.classicalTrace?.[0]?.classical, ["첫 줄", "{\"marker\":\"object-structure\"}"]);
  assert.deepEqual(publication.runtime.appendix.classicalTrace?.[0]?.blueprint, ["{\"summary\":\"객체 해석\"}"]);
});

test("Blind GPT result fails validation when coreAxis contains myeongli terms", async () => {
  const rawClassical = fakeClassical("주영지");

  rawClassical.coreAxis.verbForm = "금수로 받치고 목으로 드러내게 한다";

  const client: BlueprintGptClient = {
    async generateText(request) {
      if (request.stage === "classical-analysis") {
        return JSON.stringify(rawClassical);
      }
      return JSON.stringify({
        title: "받아들인 뒤 드러나는 사람",
        coreAxis: "받아들인 것을 자기 방식으로 드러낸다",
        narrativeLens: "Mountain",
        pages: [
          { pageNo: 1, title: "첫 장", content: "산길은 처음부터 자신의 높이를 설명하지 않는다." },
          { pageNo: 2, title: "둘째 장", content: "받아들인 것을 자기 방식으로 드러낸다는 방향은 이 사람의 문장을 천천히 세운다." },
          { pageNo: 3, title: "셋째 장", content: "두 번째 문단입니다." },
          { pageNo: 4, title: "넷째 장", content: "세 번째 문단입니다." },
        ],
        finalCounsel: "당신은 서둘러 보여 줄 때보다, 받아들인 것을 자기 방식으로 드러낸다 믿을 때 가장 당신답다.",
      });
    },
  };

  await assert.rejects(
    () => buildGptBlueprintPublication({
      manseInput: blueprintNo000001Input,
      client,
    }),
    /writerCoreAxis contains forbidden myeongli term/,
  );
});

test("Book Mode QA blocks myeongli hanja and technical markers while allowing natural 확인한다 phrasing", async () => {
  const invalidClient: BlueprintGptClient = {
    async generateText(request) {
      if (request.stage === "classical-analysis") {
        return JSON.stringify(fakeClassical("주영지"));
      }

      return JSON.stringify({
        title: "흐름을 확인한다",
        coreAxis: "흐름을 이어지게 한다",
        narrativeLens: "Bridge",
        pages: [
          { pageNo: 1, title: "첫 장", content: "사람은 자기 안의 방향을 조용히 확인한다." },
          { pageNo: 2, title: "둘째 장", content: "흐름을 이어지게 한다는 문장은 몸의 속도보다 오래 남는다." },
          { pageNo: 3, title: "셋째 장", content: "壬水가 드러난다는 문장은 Book Mode에 나오면 안 된다." },
          { pageNo: 4, title: "넷째 장", content: "네 번째 문단입니다." },
        ],
        finalCounsel: "당신은 혼자 멈춰 설 때보다, 끊어진 것을 다시 이어 줄 때 가장 당신답다.",
      });
    },
  };

  await assert.rejects(
    () => buildGptBlueprintPublication({
      manseInput: blueprintNo000001Input,
      client: invalidClient,
    }),
    /forbidden Book Mode myeongli marker/,
  );
});

test("Book Mode QA rejects GPT portrait coreAxis when it still contains myeongli terms", async () => {
  const invalidClient: BlueprintGptClient = {
    async generateText(request) {
      if (request.stage === "classical-analysis") {
        return JSON.stringify(fakeClassical("주영지"));
      }

      return JSON.stringify({
        title: "첫 원고",
        coreAxis: "금수로 받치고 목으로 드러내게 한다",
        narrativeLens: "Mountain",
        pages: [
          { pageNo: 1, title: "첫 장", content: "산길은 조용히 이어진다." },
          { pageNo: 2, title: "둘째 장", content: "받아들인 것을 자기 방식으로 드러낸다는 방향은 오래 남는다." },
          { pageNo: 3, title: "셋째 장", content: "두 번째 문단입니다." },
          { pageNo: 4, title: "넷째 장", content: "세 번째 문단입니다." },
        ],
        finalCounsel: "당신은 서둘러 보여 줄 때보다, 받아들인 것을 자기 방식으로 드러낸다 믿을 때 가장 당신답다.",
      });
    },
  };

  await assert.rejects(
    () => buildGptBlueprintPublication({
      manseInput: blueprintNo000001Input,
      client: invalidClient,
    }),
    /writerCoreAxis contains forbidden myeongli term/,
  );
});

test("Book Mode QA blocks report traces and analytical finalCounsel", async () => {
  const invalidClient: BlueprintGptClient = {
    async generateText(request) {
      if (request.stage === "classical-analysis") {
        return JSON.stringify(fakeClassical("주영지"));
      }

      return JSON.stringify({
        title: "첫 원고",
        coreAxis: "흐름을 이어지게 한다",
        narrativeLens: "Bridge",
        pages: [
          { pageNo: 1, title: "첫 장", content: "사람은 자기 안의 방향을 조용히 살핀다." },
          { pageNo: 2, title: "둘째 장", content: "흐름을 이어지게 한다는 방향은 쉽게 사라지지 않는다." },
          { pageNo: 3, title: "셋째 장", content: "네 개의 기둥이라는 표현이 들어가면 안 된다." },
          { pageNo: 4, title: "넷째 장", content: "네 번째 문단입니다." },
        ],
        finalCounsel: "이 구조의 중심과 기능은 흐름은 분명해진다.",
      });
    },
  };

  await assert.rejects(
    () => buildGptBlueprintPublication({
      manseInput: blueprintNo000001Input,
      client: invalidClient,
    }),
    /forbidden report phrase|forbidden analysis phrase/,
  );
});

test("GPT pipeline regenerates different classical analysis and books for different manse inputs", async () => {
  const ju = await buildGptBlueprintPublication({
    manseInput: blueprintNo000001Input,
    client: fakeClient(),
  });
  const lee = await buildGptBlueprintPublication({
    manseInput: manseForLee(),
    client: fakeClient(),
  });

  assert.notEqual(ju.runtime.appendix.classicalTrace?.[2]?.sajuOriginal.join(" / "), lee.runtime.appendix.classicalTrace?.[2]?.sajuOriginal.join(" / "));
  assert.notEqual(ju.book.metadata.title, lee.book.metadata.title);
  assert.notEqual(ju.book.portrait?.title, lee.book.portrait?.title);
  assert.notEqual(bookText(ju), bookText(lee));
});

test("API route uses GPT publication pipeline instead of deterministic writer publication", () => {
  const routeSource = readFileSync(new URL("../app/api/blueprint/route.ts", import.meta.url), "utf8");

  assert.match(routeSource, /buildGptBlueprintPublication/);
  assert.match(routeSource, /manuscriptSource: "GPT"/);
  assert.doesNotMatch(routeSource, /buildBlueprintClassicalPublication/);
});

test("Home page starts empty and does not fall back to the legacy manuscript", () => {
  const pageSource = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(pageSource, /buildEmptyBlueprintPublication/);
  assert.doesNotMatch(pageSource, /buildBlueprintNo000001/);
  assert.doesNotMatch(pageSource, /buildGptBlueprintPublication/);
  assert.doesNotMatch(pageSource, /createConfiguredBlueprintGptClient/);
});

test("Empty Book Mode publication exposes no legacy manuscript when GPT output is missing", () => {
  const publication = buildEmptyBlueprintPublication(blueprintNo000001Input);
  const bookPayload = JSON.stringify(publication.book);
  const readerSource = readFileSync(new URL("../src/components/blueprint/BlueprintReader.tsx", import.meta.url), "utf8");

  assert.equal(publication.manuscriptSource, "Empty");
  assert.equal(publication.book.chapters.length, 0);
  assert.match(publication.book.metadata.title, /GPT Blueprint 생성 필요/);
  assert.match(readerSource, /아직 출판된 책이 없습니다/);
  assert.match(readerSource, /왼쪽 입력값을 확인한 뒤 Portrait Book을 생성하세요/);
  assert.doesNotMatch(bookPayload, /Layer 1/);
  assert.doesNotMatch(bookPayload, /사주 원문/);
  assert.doesNotMatch(bookPayload, /Blueprint Interpretation/);
  assert.doesNotMatch(bookPayload, /명조 확정/);
  assert.doesNotMatch(bookPayload, /강은 자신이 바다를 향하고 있다는 사실을 모른다/);
});

test("OpenAI API key logging masks the key and env example documents the variable", () => {
  const envExample = readFileSync(new URL("../.env.example", import.meta.url), "utf8");
  const originalApiKey = process.env.OPENAI_API_KEY;
  const infoMessages: string[] = [];
  const warnMessages: string[] = [];
  const originalInfo = console.info;
  const originalWarn = console.warn;

  try {
    console.info = (message?: unknown) => {
      infoMessages.push(String(message));
    };
    console.warn = (message?: unknown) => {
      warnMessages.push(String(message));
    };

    process.env.OPENAI_API_KEY = "sk-proj-2AAP1234567890-secret-tail";
    assert.equal(maskOpenAiApiKey(process.env.OPENAI_API_KEY), "sk-proj-2AAP...");
    assert.equal(logOpenAiApiKeyStatus({ force: true }), process.env.OPENAI_API_KEY);
    assert.deepEqual(infoMessages, ["OPENAI_API_KEY: sk-proj-2AAP...", "OPENAI_BLUEPRINT_MODEL: gpt-5.5"]);
    assert.doesNotMatch(infoMessages.join("\n"), /secret-tail/);

    delete process.env.OPENAI_API_KEY;
    assert.equal(logOpenAiApiKeyStatus({ force: true }), null);
    assert.match(warnMessages.join("\n"), /OPENAI_API_KEY not found/);
    assert.match(envExample, /^OPENAI_API_KEY=$/m);
    assert.match(envExample, /^OPENAI_BLUEPRINT_MODEL=gpt-5\.5$/m);
  } finally {
    console.info = originalInfo;
    console.warn = originalWarn;

    if (originalApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalApiKey;
    }
  }
});

test("OpenAI GPT client logs model, duration, and token usage", async () => {
  const originalFetch = globalThis.fetch;
  const originalInfo = console.info;
  const infoMessages: string[] = [];

  try {
    console.info = (message?: unknown) => {
      infoMessages.push(String(message));
    };

    globalThis.fetch = (async () => new Response(JSON.stringify({
        model: "gpt-5.5",
        output_text: "{\"ok\":true}",
        usage: {
          input_tokens: 1234,
          output_tokens: 567,
          total_tokens: 1801,
        },
      }))) as typeof fetch;

    const client = createOpenAIBlueprintGptClient({
      apiKey: "sk-test",
      model: "gpt-5.5",
      baseUrl: "https://openai.test",
    });

    const text = await client.generateText({
      stage: "editorial-book",
      systemPrompt: "system",
      userPrompt: "user",
      metadata: {},
    });
    const logs = infoMessages.join("\n");

    assert.equal(text, "{\"ok\":true}");
    assert.match(logs, /\[OpenAI\]\nStarting editorial-book request/);
    assert.match(logs, /\[OpenAI\]\nModel: gpt-5\.5/);
    assert.match(logs, /\[OpenAI\]\nCompleted in .*\([0-9]+ ms\)/);
    assert.match(logs, /Prompt Tokens: 1234/);
    assert.match(logs, /Completion Tokens: 567/);
    assert.match(logs, /Total Tokens: 1801/);
  } finally {
    console.info = originalInfo;
    globalThis.fetch = originalFetch;
  }
});

test("OpenAI GPT client defaults to GPT-5.5 when no model is configured", async () => {
  const originalFetch = globalThis.fetch;
  const originalInfo = console.info;
  const infoMessages: string[] = [];

  try {
    console.info = (message?: unknown) => {
      infoMessages.push(String(message));
    };

    globalThis.fetch = (async () => new Response(JSON.stringify({
      model: "gpt-5.5",
      output_text: "{\"ok\":true}",
      usage: {
        input_tokens: 1,
        output_tokens: 1,
        total_tokens: 2,
      },
    }))) as typeof fetch;

    const client = createOpenAIBlueprintGptClient({
      apiKey: "sk-test",
      baseUrl: "https://openai.test",
    });

    await client.generateText({
      stage: "editorial-book",
      systemPrompt: "system",
      userPrompt: "user",
      metadata: {},
    });

    assert.match(infoMessages.join("\n"), /\[OpenAI\]\nModel: gpt-5\.5/);
  } finally {
    console.info = originalInfo;
    globalThis.fetch = originalFetch;
  }
});

test("Portrait book validation failure logs raw response and parse status", async () => {
  const originalInfo = console.info;
  const originalError = console.error;
  const infoMessages: string[] = [];
  const invalidClient: BlueprintGptClient = {
    async generateText(request) {
      if (request.stage === "classical-analysis") {
        return JSON.stringify(fakeClassical("주영지"));
      }
      return JSON.stringify({
        title: "첫 원고",
        body: "one",
      });
    },
  };

  try {
    console.info = (message?: unknown) => {
      infoMessages.push(String(message));
    };
    console.error = (message?: unknown) => {
      String(message);
    };

    await assert.rejects(
      () => buildGptBlueprintPublication({
        manseInput: blueprintNo000001Input,
        client: invalidClient,
      }),
      /schema validation failed/,
    );

    const infoLogs = infoMessages.join("\n");

    assert.match(infoLogs, /\[Blueprint\]\nPortrait Book GPT raw response/);
    assert.match(infoLogs, /\[Blueprint\]\nPortrait Book JSON parse: success/);
  } finally {
    console.info = originalInfo;
    console.error = originalError;
  }
});

test("Book Generate logs immediately before calling /api/blueprint", () => {
  const workspaceSource = readFileSync(new URL("../src/components/blueprint/BlueprintClassicalWorkspace.tsx", import.meta.url), "utf8");

  assert.match(workspaceSource, /\[Blueprint\]\\nCalling \/api\/blueprint/);
});
