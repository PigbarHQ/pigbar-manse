import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildBlueprintNo000001Runtime } from "../src/lib/blueprint";

function visibleBookText(book: { chapters: Array<{ title: string; opening: string; paragraphs: Array<{ text: string }>; closing: string }> }) {
  return book.chapters
    .flatMap((chapter) => [
      chapter.title,
      chapter.opening,
      ...chapter.paragraphs.map((paragraph) => paragraph.text),
      chapter.closing,
    ])
    .join("\n");
}

function repeatedSentences(text: string) {
  const sentences = text
    .split(/\n+|(?<=[.?!])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 16);
  const counts = new Map<string, number>();

  sentences.forEach((sentence) => counts.set(sentence, (counts.get(sentence) ?? 0) + 1));

  return Array.from(counts.entries()).filter(([, count]) => count > 1);
}

const forbiddenWriterPhrases = [
  "고전은 이 대목에서",
  "이 문장들은",
  "이 말은",
  "를 설명하기 위해",
  "를 먼저 놓는다",
  "를 확인한다",
  "를 벗어나지 않는다",
  "원고는",
  "근거는",
  "분석은",
  "해석은",
];

test("Blueprint No.000001 runtime builds features, reasons, and writer input", () => {
  const runtime = buildBlueprintNo000001Runtime();

  assert.equal(runtime.blueprintNo, "No.000001");
  assert.equal(runtime.authorName, "주영지");
  assert.ok(runtime.features.length >= 50);
  assert.ok(runtime.vocabulary.length >= 50);
  assert.ok(runtime.vocabulary.length > 0);
  assert.ok(runtime.reasons.length > 0);
  assert.equal(runtime.canonicalManseInput.pillars.year.label, "갑인");
  assert.equal(runtime.canonicalManseInput.pillars.hour?.label, "임인");
  assert.equal(runtime.writerInput.blueprintNo, "No.000001");
  assert.equal(runtime.writerInput.source, "pigbar-manse");
  assert.ok(runtime.writerInput.sourceSummary.pillars.includes("갑인"));
  assert.ok(runtime.writerInput.reasons.some((reason) => reason.id === "REASON_STANDARD_BEFORE_DECISION"));
});

test("Writer input keeps explainability source references without making sentences", () => {
  const runtime = buildBlueprintNo000001Runtime();
  const reason = runtime.writerInput.reasons.find((item) => item.id === "REASON_STANDARD_BEFORE_DECISION");

  assert.ok(reason);
  assert.ok(reason.relatedFeatures.includes("FEATURE_DECISION_CRITERIA"));
  assert.ok(reason.relatedFeatureIds.includes("FEATURE_DECISION_CRITERIA"));
  assert.ok(reason.relatedVocabulary.includes("ID001"));
  assert.ok(reason.sourceRefs.length > 0);
  assert.ok(reason.sourceRefs.every((source) => source.path.length > 0));
  assert.ok(reason.evidence.length > 0);
  assert.match(reason.evidenceSummary, /features/);
  assert.equal("sentences" in runtime.writerInput, false);
});

test("Features use canonical evidence and deterministic confidence breakdown", () => {
  const runtime = buildBlueprintNo000001Runtime();
  const feature = runtime.features.find((item) => item.id === "FEATURE_DECISION_CRITERIA");

  assert.ok(feature);
  assert.equal(feature.label, "결정 기준");
  assert.ok(feature.score >= 0);
  assert.ok(feature.evidence.length > 0);
  assert.ok(feature.evidence.every((item) => item.path.startsWith("pillars.") || item.path.startsWith("luck.")));
  assert.ok(feature.confidenceBreakdown.sourceCount > 0);
  assert.ok(feature.confidenceBreakdown.providerReliability > 0);
});

test("Writer input contains chapter inputs and trace seeds for future sentence tracing", () => {
  const runtime = buildBlueprintNo000001Runtime();

  assert.equal(runtime.writerInput.bookId, "no-000001");
  assert.equal(runtime.writerInput.subject.name, "주영지");
  assert.ok(runtime.writerInput.coreSummary.length > 0);
  assert.ok(runtime.writerInput.topFeatures.length > 0);
  assert.ok(runtime.writerInput.topReasons.length > 0);
  assert.ok(runtime.writerInput.chapterInputs.length >= 12);
  assert.ok(runtime.writerInput.chapterInputs.every((chapter) => chapter.annotationSeeds));
  assert.ok(runtime.writerInput.traceSeed.length > 0);
  assert.ok(runtime.writerInput.traceSeed.every((seed) => seed.sajuSourcePaths.length > 0));
});

test("Appendix runtime exposes book evidence and chapter reason trace", () => {
  const runtime = buildBlueprintNo000001Runtime();
  const trace = runtime.appendix.reasonTrace.find((item) => item.chapterNo === 3);

  assert.equal(runtime.appendix.pillars.year.label, "갑인");
  assert.equal(runtime.appendix.pillars.month.gan, "辛");
  assert.equal(runtime.appendix.pillars.day.ganKo, "임");
  assert.equal(runtime.appendix.pillars.hour?.ji, "寅");
  assert.ok(Object.keys(runtime.appendix.tenGods).length > 0);
  assert.ok(Object.keys(runtime.appendix.elements).length > 0);
  assert.ok(Object.keys(runtime.appendix.twelveStages).length > 0);
  assert.ok(Object.keys(runtime.appendix.hiddenStems).length > 0);
  assert.equal(runtime.appendix.luck.currentDaeun?.ganji, "병자");
  assert.ok(runtime.appendix.reasonTrace.length > 0);
  assert.ok(trace);
  assert.ok(trace.reasonId.length > 0);
  assert.ok(trace.featureIds.length > 0);
  assert.ok(trace.vocabularyIds.length > 0);
  assert.ok(trace.calculationPaths.length > 0);
});

test("Writer runtime builds chapter outline, draft, edits, final text, quality, and reason trace", () => {
  const runtime = buildBlueprintNo000001Runtime();
  const chapter = runtime.writerRuntime.chapters.find((item) => item.chapterNo === 3);

  assert.equal(runtime.writerRuntime.bookId, "no-000001");
  assert.equal(runtime.writerRuntime.chapters.length, runtime.writerInput.chapterInputs.length);
  assert.ok(chapter);
  assert.equal(chapter.chapterId, "chapter_03");
  assert.ok(chapter.outline.reasonIds.length > 0);
  assert.ok(chapter.outline.keyPoints.length > 0);
  assert.ok(chapter.draft.paragraphs.length >= 3);
  assert.ok(chapter.editHistory.some((entry) => entry.stage === "outline"));
  assert.ok(chapter.editHistory.some((entry) => entry.stage === "draft"));
  assert.ok(chapter.editHistory.some((entry) => entry.stage === "rewrite"));
  assert.ok(chapter.editHistory.some((entry) => entry.stage === "edit"));
  assert.ok(chapter.editHistory.some((entry) => entry.stage === "final"));
  assert.ok(chapter.finalText.length > 0);
  assert.ok(chapter.quality.score > 0);
  assert.ok(chapter.quality.checks.every((check) => typeof check.passed === "boolean"));
  assert.ok(chapter.reasonTrace.length > 0);
  assert.ok(chapter.reasonTrace.every((trace) => trace.sajuSourcePaths.length > 0));
});

test("Writer runtime uses human-first chapter manuscript structure", () => {
  const runtime = buildBlueprintNo000001Runtime();
  const chapterOne = runtime.writerRuntime.chapters.find((item) => item.chapterNo === 1);
  const chapterTwo = runtime.writerRuntime.chapters.find((item) => item.chapterNo === 2);

  assert.ok(chapterOne);
  assert.ok(chapterTwo);
  assert.doesNotMatch(chapterOne.finalText.trim(), /^이 명조/);
  assert.match(chapterOne.finalText.trim(), /^사람은/);
  assert.ok(chapterOne.manuscript.humanQuestion.length > 0);
  assert.ok(chapterOne.manuscript.sceneSymbol.length > 0);
  assert.ok(chapterOne.manuscript.classicalEntry.length > 0);
  assert.ok(chapterOne.manuscript.closingSentence.length > 0);
  assert.notEqual(chapterOne.title, chapterTwo.title);
  assert.notEqual(chapterOne.manuscript.sceneSymbol, chapterTwo.manuscript.sceneSymbol);
  assert.match(chapterTwo.manuscript.structuralReading, /금 -> 수 -> 목/);
  assert.doesNotMatch(chapterOne.finalText, /FEATURE_|ID\d{3}|REASON_/);
  assert.doesNotMatch(chapterTwo.finalText, /FEATURE_|ID\d{3}|REASON_/);
});

test("Rendered user chapters expose writer manuscript, not classical layers", async () => {
  const { buildBlueprintNo000001 } = await import("../src/lib/blueprint/no000001");
  const { book, classicalAnalysis } = buildBlueprintNo000001();
  const chapterOne = book.chapters.find((item) => item.chapterNo === 1);
  const chapterTwo = book.chapters.find((item) => item.chapterNo === 2);
  const classicalTitles = new Set(classicalAnalysis.sections.map((section) => section.title));
  const renderedText = book.chapters
    .flatMap((chapter) => [
      `Chapter ${chapter.chapterNo}`,
      chapter.title,
      chapter.opening,
      ...chapter.paragraphs.map((paragraph) => paragraph.text),
      chapter.closing,
    ])
    .join("\n");

  assert.ok(chapterOne);
  assert.ok(chapterTwo);
  assert.equal(book.chapters.length, 19);
  assert.notEqual(chapterOne.title, "명조 확정");
  assert.notEqual(chapterTwo.title, "명조 핵심 구조");
  assert.doesNotMatch(renderedText, /Layer 1/);
  assert.doesNotMatch(renderedText, /사주 원문/);
  assert.doesNotMatch(renderedText, /고전 명리학 해석/);
  assert.doesNotMatch(renderedText, /Blueprint Interpretation/);
  assert.doesNotMatch(renderedText, /사주 근거는 각 문장 아래에 붙인다/);
  assert.match(renderedText, /사람은 무엇으로 자신의 삶을 설명할 수 있을까/);
  assert.match(renderedText, /년주 갑인.*월주 신미.*일주 임신.*시주 임인/);
  assert.ok(book.chapters.every((chapter) => chapter.paragraphs.every((paragraph) => !paragraph.tripleLayer)));
  assert.ok(book.chapters.every((chapter) => !chapter.opening.trim().startsWith("이 명조")));
  assert.ok(book.chapters.every((chapter) => chapter.opening.length > 0));
  assert.ok(book.chapters.every((chapter) => chapter.paragraphs.length >= 5));
  assert.ok(book.chapters.every((chapter) => chapter.title.length <= 25));
  assert.ok(
    book.chapters.every((chapter, index) => {
      const interpretation = classicalAnalysis.sections[index]?.layers.flatMap((layer) => layer.blueprint).join("\n") ?? "";

      return chapter.title !== interpretation;
    }),
  );
  assert.ok(book.chapters.slice(2).every((chapter) => !classicalTitles.has(chapter.title)));
  assert.equal(new Set(book.chapters.map((chapter) => chapter.paragraphs[0]?.text)).size, book.chapters.length);
  assert.doesNotMatch(renderedText, /고전은 이 장면을 감정의 이름으로 바꾸지 않는다/);
  assert.doesNotMatch(renderedText, /원국의 기능은|확인될 때만 말할 수 있다/);
  forbiddenWriterPhrases.forEach((phrase) => assert.doesNotMatch(renderedText, new RegExp(phrase)));
  assert.ok((renderedText.match(/핵심은/g) ?? []).length <= 1);
  assert.deepEqual(repeatedSentences(renderedText), []);
});

test("Editorial writer translates Classical Analysis chapter 3 without Feature Reason Vocabulary prose", async () => {
  const { buildBlueprintNo000001 } = await import("../src/lib/blueprint/no000001");
  const { book, runtime } = buildBlueprintNo000001();
  const chapterThree = book.chapters[2];
  const writerChapterThree = runtime.writerRuntime.chapters[2];
  const analysisThree = runtime.writerInput.classicalAnalysis?.[2];
  const chapterText = [
    chapterThree.opening,
    ...chapterThree.paragraphs.map((paragraph) => paragraph.text),
    chapterThree.closing,
  ].join("\n");
  const writerText = writerChapterThree.finalText;

  assert.ok(analysisThree);
  assert.equal(analysisThree.index, 3);
  assert.equal(analysisThree.title, "적천수 관점");
  assert.match(chapterText, /壬水/);
  assert.match(chapterText, /뿌리|통로|흐름|멈춤/);
  assert.match(chapterText, /미월의 흐름/);
  analysisThree.structure.split("\n").filter(Boolean).forEach((line) => assert.doesNotMatch(chapterText, new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))));
  analysisThree.interpretation.split("\n").filter(Boolean).forEach((line) => assert.doesNotMatch(chapterText, new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))));
  forbiddenWriterPhrases.forEach((phrase) => assert.doesNotMatch(`${chapterText}\n${writerText}`, new RegExp(phrase)));
  assert.equal(writerChapterThree.reasonTrace.length, 0);
  assert.ok(writerChapterThree.draft.paragraphs.every((paragraph) => paragraph.featureIds.length === 0));
  assert.ok(writerChapterThree.draft.paragraphs.every((paragraph) => paragraph.reasonIds.length === 0));
  assert.ok(writerChapterThree.draft.paragraphs.every((paragraph) => paragraph.vocabularyIds.length === 0));
  assert.doesNotMatch(`${chapterText}\n${writerText}`, /FEATURE_|REASON_|ID\d{3}/);
});

test("Dynamic manse input changes pillars, chapters, core theme, and appendix", async () => {
  const { CITY_OPTIONS } = await import("../src/lib/manse");
  const { buildBlueprintNo000001, buildBlueprintClassicalPublication } = await import("../src/lib/blueprint/no000001");
  const base = buildBlueprintNo000001();
  const changed = buildBlueprintClassicalPublication({
    manseInput: {
      name: "테스트",
      birthDate: "1975-11-12",
      calendarType: "solar",
      isLeapMonth: false,
      birthTime: "22:00",
      unknownTime: false,
      gender: "male",
      birthPlace: {
        name: CITY_OPTIONS[1].name,
        label: CITY_OPTIONS[1].name,
        latitude: CITY_OPTIONS[1].latitude,
        longitude: CITY_OPTIONS[1].longitude,
        timezone: "Asia/Seoul",
      },
      useLocalMeanTime: true,
      currentDateTime: "2026-07-02T12:30:00+09:00",
      ziHourRule: "midnight",
      daewoonDirectionRule: "standard",
    },
  });

  assert.notDeepEqual(base.runtime.writerInput.sourceSummary.pillars, changed.runtime.writerInput.sourceSummary.pillars);
  assert.notEqual(base.book.metadata.title, changed.book.metadata.title);
  assert.notEqual(base.book.chapters[2]?.title, changed.book.chapters[2]?.title);
  assert.notEqual(visibleBookText(base.book), visibleBookText(changed.book));
  assert.notEqual(base.runtime.writerInput.coreSummary, changed.runtime.writerInput.coreSummary);
  assert.notEqual(base.runtime.appendix.pillars.year.label, changed.runtime.appendix.pillars.year.label);
  assert.match(visibleBookText(changed.book), new RegExp(changed.runtime.writerInput.sourceSummary.pillars[0]));
});

test("Book composer preserves Classical Analysis order while titles and bodies follow each manse", async () => {
  const { CITY_OPTIONS } = await import("../src/lib/manse");
  const { buildBlueprintNo000001, buildBlueprintClassicalPublication } = await import("../src/lib/blueprint/no000001");
  const seoul = CITY_OPTIONS[0];
  const manseDefaults = {
    calendarType: "solar" as const,
    isLeapMonth: false,
    unknownTime: false,
    birthPlace: {
      name: seoul.name,
      label: seoul.name,
      latitude: seoul.latitude,
      longitude: seoul.longitude,
      timezone: "Asia/Seoul" as const,
    },
    useLocalMeanTime: true,
    currentDateTime: "2026-07-02T12:30:00+09:00",
    ziHourRule: "midnight" as const,
    daewoonDirectionRule: "standard" as const,
  };
  const ju = buildBlueprintNo000001();
  const lee = buildBlueprintClassicalPublication({
    manseInput: {
      ...manseDefaults,
      name: "이진희",
      birthDate: "1975-11-12",
      birthTime: "22:00",
      gender: "male",
    },
  });
  const hee = buildBlueprintClassicalPublication({
    manseInput: {
      ...manseDefaults,
      name: "희준",
      birthDate: "1995-03-12",
      birthTime: "12:00",
      gender: "male",
    },
  });
  const publications = [ju, lee, hee];
  const coreThemes = publications.map((publication) => publication.runtime.writerInput.coreSummary.split(" · ")[0]);
  const sceneThemes = publications.map((publication) => publication.runtime.writerInput.coreSummary.split(" · ")[1]);
  const chapterCounts = publications.map((publication) => publication.book.chapters.length);
  const chapterThreeTitles = publications.map((publication) => publication.book.chapters[2]?.title);
  const chapterThreeBodies = publications.map((publication) =>
    [
      publication.book.chapters[2]?.opening,
      ...(publication.book.chapters[2]?.paragraphs.map((paragraph) => paragraph.text) ?? []),
      publication.book.chapters[2]?.closing,
    ].join("\n"),
  );

  assert.deepEqual(coreThemes, ["흐름", "중심", "탐색"]);
  assert.deepEqual(sceneThemes, ["장면: 물", "장면: 불", "장면: 길"]);
  assert.deepEqual(chapterCounts, [19, 19, 19]);
  assert.ok(publications.every((publication) => publication.runtime.writerInput.classicalAnalysis?.length === 19));
  assert.ok(
    publications.every((publication) =>
      publication.runtime.writerInput.classicalAnalysis?.every(
        (item, index) => item.index === publication.classicalAnalysis.sections[index]?.order && item.title === publication.classicalAnalysis.sections[index]?.title,
      ),
    ),
  );
  assert.equal(new Set(chapterThreeTitles).size, 3);
  assert.equal(new Set(chapterThreeBodies).size, 3);
  assert.notEqual(visibleBookText(ju.book), visibleBookText(lee.book));
  assert.notEqual(visibleBookText(ju.book), visibleBookText(hee.book));
});

test("Scene composer keeps one scene theme per book while changing chapter scenes", async () => {
  const { buildBlueprintNo000001 } = await import("../src/lib/blueprint/no000001");
  const { book, runtime } = buildBlueprintNo000001();
  const waterSymbols = [
    "강",
    "시내",
    "호수",
    "비",
    "안개",
    "바다",
    "밀물",
    "썰물",
    "여울",
    "물결",
    "수면",
    "물안개",
    "포말",
    "물살",
    "조류",
    "파문",
    "샘",
    "개울",
    "물가",
  ];
  const sceneLines = book.chapters.map(
    (chapter) =>
      [chapter.opening, ...chapter.paragraphs.map((paragraph) => paragraph.text)].find((text) =>
        text.includes("한 번에 보여 주지 않는다."),
      ) ?? "",
  );

  assert.match(runtime.writerInput.coreSummary, /장면: 물/);
  assert.equal(sceneLines.length, 19);
  assert.equal(new Set(sceneLines).size, 19);
  waterSymbols.forEach((symbol) => {
    assert.ok(
      sceneLines.some((line) => line.startsWith(`${symbol}은`) || line.startsWith(`${symbol}는`)),
      `${symbol} scene should appear in the water scene theme`,
    );
  });
  assert.doesNotMatch(sceneLines.join("\n"), /비탈|다리|항구|저울|책상|계단|등불|마루|기둥|모퉁이/);
});

test("Reader exposes simplified Portrait Book MVP UI", () => {
  const readerSource = readFileSync(new URL("../src/components/blueprint/BlueprintReader.tsx", import.meta.url), "utf8");
  const workspaceSource = readFileSync(new URL("../src/components/blueprint/BlueprintClassicalWorkspace.tsx", import.meta.url), "utf8");

  assert.match(workspaceSource, /Blueprint Input/);
  assert.match(workspaceSource, /생년월일과 출생시간을 기준으로 Portrait Book을 생성합니다/);
  assert.match(workspaceSource, /이 명조로 책 만들기/);
  assert.match(readerSource, /아직 출판된 책이 없습니다/);
  assert.match(readerSource, /이 사람의 책을 만들고 있습니다/);
  assert.match(readerSource, /약 1~2분 정도 소요됩니다/);
  assert.match(readerSource, /당신의 Portrait Book이 완성되었습니다/);
  assert.match(readerSource, /책 읽기 시작하기/);
  assert.match(readerSource, /Cover|PortraitCover/);
  assert.match(readerSource, /BookCoverCard/);
  assert.match(readerSource, /Page \{page\.pageNo\}/);
  assert.match(readerSource, /마지막 당부/);
  assert.doesNotMatch(readerSource, /Evidence Mode/);
  assert.doesNotMatch(readerSource, /Runtime Debug JSON/);
  assert.doesNotMatch(readerSource, /Family Collection/);
  assert.doesNotMatch(readerSource, /Source:/);
});

test("Reference Blueprint book keeps chapter structure and sentence-level saju evidence", async () => {
  const { buildBlueprintNo000001 } = await import("../src/lib/blueprint/no000001");
  const { classicalBook, referenceBook } = buildBlueprintNo000001();
  const chapter = referenceBook.chapters.find((item) => item.chapterNo === 1);
  const paragraph = chapter?.paragraphs[0];

  assert.equal(referenceBook.metadata.title, "Reference Blueprint");
  assert.equal(referenceBook.chapters.length, classicalBook.chapters.length);
  assert.deepEqual(referenceBook.chapters.map((item) => item.title), classicalBook.chapters.map((item) => item.title));
  assert.ok(chapter);
  assert.ok(paragraph);
  assert.equal(paragraph.text, "움직이는 사람");
  assert.ok(paragraph.referenceEvidence);
  assert.ok(paragraph.referenceEvidence.saju.some((item) => item.includes("갑인")));
  assert.ok(paragraph.referenceEvidence.tenGods.some((item) => item.includes("식신")));
  assert.ok(paragraph.referenceEvidence.elements.includes("목 3"));
  assert.ok(paragraph.referenceEvidence.luck.some((item) => item.includes("병자")));
});

test("Classical mode replaces Blueprint prose with myeongli structure analysis", async () => {
  const { buildBlueprintNo000001 } = await import("../src/lib/blueprint/no000001");
  const { classicalAnalysis, classicalBook } = buildBlueprintNo000001();
  const allText = [
    classicalBook.prologue.paragraphs.map((paragraph) => paragraph.text).join(" "),
    classicalBook.chapters.flatMap((chapter) => chapter.paragraphs.map((paragraph) => paragraph.text)).join(" "),
  ].join(" ");

  assert.equal(classicalAnalysis.mode, "classical-myeongli");
  assert.equal(classicalAnalysis.sections.length, 19);
  assert.notEqual(classicalBook.metadata.title, "Classical Blueprint");
  assert.notEqual(classicalBook.metadata.title, "흐름과 유통을 읽는 명조");
  assert.match(classicalBook.metadata.title, /유통 구조/);
  assert.equal(classicalBook.chapters.length, 19);
  assert.deepEqual(classicalBook.chapters.map((chapter) => chapter.title), classicalAnalysis.sections.map((section) => section.title));
  assert.equal(classicalBook.chapters[0]?.title, "명조 확정");
  assert.equal(classicalBook.chapters[18]?.title, "최종 한 문장");
  assert.match(allText, /갑인년 신미월 임신일 임인시/);
  assert.match(allText, /흐름.*유통.*수렴/);
  assert.match(classicalBook.chapters[14]?.paragraphs[0]?.tripleLayer?.classical.join(" ") ?? "", /방향을 만드는 기능/);
  assert.match(allText, /후반에는 흐름의 양보다/);
  assert.doesNotMatch(allText, /결론보다 기준을 먼저/);
  assert.doesNotMatch(allText, /기준이 서기 전에는 결론도 서지 않습니다/);
  assert.doesNotMatch(allText, /더 정확히 자기 자신/);
  assert.ok(classicalBook.chapters.every((chapter) => chapter.paragraphs.every((paragraph) => paragraph.referenceEvidence)));
  assert.ok(classicalBook.chapters.every((chapter) => chapter.paragraphs.every((paragraph) => paragraph.tripleLayer)));
  assert.match(classicalBook.chapters[0]?.paragraphs[0]?.tripleLayer?.sajuOriginal.join(" ") ?? "", /년주 갑인 甲寅 식신/);
  assert.match(classicalBook.chapters[0]?.paragraphs[0]?.tripleLayer?.classical.join(" ") ?? "", /갑인년 신미월 임신일 임인시/);
  assert.match(classicalBook.chapters[0]?.paragraphs[0]?.tripleLayer?.blueprint.join(" ") ?? "", /임수 일간/);
  assert.match(classicalBook.chapters[2]?.paragraphs[0]?.tripleLayer?.sajuOriginal.join(" ") ?? "", /壬水/);
  assert.match(classicalBook.chapters[2]?.paragraphs[0]?.tripleLayer?.blueprint.join(" ") ?? "", /임수 일간.*미월.*신일지.*흐름/);
});

test("Classical publication exposes Appendix H as classical trace without feature vocabulary IDs", async () => {
  const { buildBlueprintNo000001 } = await import("../src/lib/blueprint/no000001");
  const { runtime } = buildBlueprintNo000001();
  const traceText = JSON.stringify(runtime.appendix.classicalTrace);

  assert.equal(runtime.appendix.reasonTrace.length, 0);
  assert.equal(runtime.appendix.classicalTrace?.length, 19);
  assert.ok(runtime.appendix.classicalTrace?.every((trace) => trace.sajuOriginal.length > 0));
  assert.ok(runtime.appendix.classicalTrace?.every((trace) => trace.classical.length > 0));
  assert.ok(runtime.appendix.classicalTrace?.every((trace) => trace.blueprint.length > 0));
  assert.doesNotMatch(traceText, /FEATURE_/);
  assert.doesNotMatch(traceText, /ID\d{3}/);
  assert.doesNotMatch(traceText, /REASON_/);
});

test("Classical publication rebuilds book and appendix from dynamic manse input", async () => {
  const { CITY_OPTIONS } = await import("../src/lib/manse");
  const { buildBlueprintClassicalPublication } = await import("../src/lib/blueprint/no000001");
  const publication = buildBlueprintClassicalPublication({
    manseInput: {
      name: "테스트",
      birthDate: "1975-11-12",
      calendarType: "solar",
      isLeapMonth: false,
      birthTime: "22:00",
      unknownTime: false,
      gender: "male",
      birthPlace: {
        name: CITY_OPTIONS[1].name,
        label: CITY_OPTIONS[1].name,
        latitude: CITY_OPTIONS[1].latitude,
        longitude: CITY_OPTIONS[1].longitude,
        timezone: "Asia/Seoul",
      },
      useLocalMeanTime: true,
      currentDateTime: "2026-07-02T12:30:00+09:00",
      ziHourRule: "midnight",
      daewoonDirectionRule: "standard",
    },
  });

  const chapterOneSource = publication.classicalBook.chapters[0]?.paragraphs[0]?.tripleLayer?.sajuOriginal.join(" ") ?? "";
  const chapterOneText = publication.classicalBook.chapters[0]?.paragraphs[0]?.text ?? "";

  assert.notEqual(publication.runtime.appendix.pillars.year.label, "갑인");
  assert.doesNotMatch(chapterOneSource, /년주 갑인/);
  assert.match(chapterOneSource, new RegExp(`년주 ${publication.runtime.appendix.pillars.year.label}`));
  assert.match(chapterOneText, /일간을 중심으로/);
  assert.equal(publication.classicalBook.metadata.author, "테스트");
});

test("Classical publication handles unknown time without hiding appendix", async () => {
  const { CITY_OPTIONS } = await import("../src/lib/manse");
  const { buildBlueprintClassicalPublication } = await import("../src/lib/blueprint/no000001");
  const publication = buildBlueprintClassicalPublication({
    manseInput: {
      name: "시간미상",
      birthDate: "1974-07-30",
      calendarType: "solar",
      isLeapMonth: false,
      birthTime: null,
      unknownTime: true,
      gender: "male",
      birthPlace: {
        name: CITY_OPTIONS[0].name,
        label: CITY_OPTIONS[0].name,
        latitude: CITY_OPTIONS[0].latitude,
        longitude: CITY_OPTIONS[0].longitude,
        timezone: "Asia/Seoul",
      },
      useLocalMeanTime: true,
      currentDateTime: "2026-07-02T12:30:00+09:00",
      ziHourRule: "midnight",
      daewoonDirectionRule: "standard",
    },
  });

  const chapterOneClassical = publication.classicalBook.chapters[0]?.paragraphs[0]?.tripleLayer?.classical.join(" ") ?? "";

  assert.equal(publication.runtime.appendix.pillars.hour, null);
  assert.match(chapterOneClassical, /시주는 시간 미상으로 보류한다/);
  assert.ok(publication.runtime.appendix.pillars.year.label);
});

test("Classical publication preserves lunar conversion provenance", async () => {
  const { CITY_OPTIONS } = await import("../src/lib/manse");
  const { buildBlueprintClassicalPublication } = await import("../src/lib/blueprint/no000001");
  const publication = buildBlueprintClassicalPublication({
    manseInput: {
      name: "음력입력",
      birthDate: "1974-04-01",
      calendarType: "lunar",
      isLeapMonth: true,
      birthTime: "03:50",
      unknownTime: false,
      gender: "male",
      birthPlace: {
        name: CITY_OPTIONS[0].name,
        label: CITY_OPTIONS[0].name,
        latitude: CITY_OPTIONS[0].latitude,
        longitude: CITY_OPTIONS[0].longitude,
        timezone: "Asia/Seoul",
      },
      useLocalMeanTime: true,
      currentDateTime: "2026-07-02T12:30:00+09:00",
      ziHourRule: "midnight",
      daewoonDirectionRule: "standard",
    },
  });

  assert.equal(publication.manse.calendarConversion.source, "korean-lunar-calendar");
  assert.equal(publication.manse.calendarConversion.solarDate, "1974-05-22");
  assert.ok(
    publication.runtime.canonicalManseInput.provenance.warnings.some((warning) =>
      warning.message.includes("음력 입력"),
    ),
  );
  assert.equal(publication.classicalBook.metadata.author, "음력입력");
});

test("Classical publication changes title, chapters, and appendix trace for three manse cases", async () => {
  const { CITY_OPTIONS } = await import("../src/lib/manse");
  const { buildBlueprintClassicalPublication } = await import("../src/lib/blueprint/no000001");
  const seoul = CITY_OPTIONS[0];
  const cases = [
    {
      name: "주영지",
      birthDate: "1974-07-30",
      birthTime: "03:50",
      gender: "male" as const,
    },
    {
      name: "1995년 여자",
      birthDate: "1995-03-12",
      birthTime: "12:00",
      gender: "female" as const,
    },
    {
      name: "1963년 남자",
      birthDate: "1963-09-02",
      birthTime: "23:00",
      gender: "male" as const,
    },
  ].map((manseInput) =>
    buildBlueprintClassicalPublication({
      manseInput: {
        ...manseInput,
        calendarType: "solar",
        isLeapMonth: false,
        unknownTime: false,
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
      },
    }),
  );

  const titles = cases.map((item) => item.classicalBook.metadata.title);
  const chapter1 = cases.map((item) => item.classicalBook.chapters[0]?.paragraphs[0]?.tripleLayer?.sajuOriginal.join(" "));
  const chapter3 = cases.map((item) => item.classicalBook.chapters[2]?.paragraphs[0]?.text);
  const chapter10 = cases.map((item) => item.classicalBook.chapters[9]?.paragraphs[0]?.text);
  const appendixH = cases.map((item) => item.runtime.appendix.classicalTrace?.[0]?.sajuOriginal.join(" "));

  assert.equal(new Set(titles).size, 3);
  assert.equal(new Set(chapter1).size, 3);
  assert.equal(new Set(chapter3).size, 3);
  assert.equal(new Set(chapter10).size, 3);
  assert.equal(new Set(appendixH).size, 3);
  assert.ok(titles.every((title) => title !== "Classical Blueprint"));
  assert.ok(titles.every((title) => title !== "흐름과 유통을 읽는 명조"));
  assert.ok(cases.every((item) => item.runtime.appendix.classicalTrace?.length === 19));
});
