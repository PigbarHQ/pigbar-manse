import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { calculateManse, type BirthPlace, type ManseInput } from "../src/lib/manse";
import { compileBlindInput } from "../src/lib/blind";
import { compileFutureInput } from "../src/lib/future";
import { compileDecisionInput } from "../src/lib/decision";
import { buildTemplateReaderReport } from "../src/lib/reader";
import { serviceLabelForDecision } from "../src/lib/reader/serviceLabels";

const place = (
  name: string,
  latitude: number,
  longitude: number,
): BirthPlace => ({
  name,
  latitude,
  longitude,
  timezone: "Asia/Seoul",
});

const baseInput = (overrides: Partial<ManseInput>): ManseInput => ({
  birthDate: "1974-07-30",
  calendarType: "solar",
  isLeapMonth: false,
  birthTime: "03:50",
  gender: "male",
  birthPlace: place("서울특별시, 대한민국", 37.5665, 126.978),
  useLocalMeanTime: true,
  currentDateTime: "2026-07-02T12:30:00+09:00",
  ...overrides,
});

function oneSecondBefore(iso: string) {
  return new Date(Date.parse(iso) - 1000).toISOString();
}

test("서울 1974-07-30 03:50 남성 양력은 약 -32분 보정된다", () => {
  const result = calculateManse(baseInput({}));

  assert.deepEqual(result.saju, {
    year: { gan: "甲", ji: "寅", ganKo: "갑", jiKo: "인" },
    month: { gan: "辛", ji: "未", ganKo: "신", jiKo: "미" },
    day: { gan: "壬", ji: "申", ganKo: "임", jiKo: "신" },
    hour: { gan: "壬", ji: "寅", ganKo: "임", jiKo: "인" },
  });
  assert.equal(result.debug.engine, "@fullstackfamily/manseryeok");
  assert.deepEqual(result.debug.solarTermEngine, {
    provider: "astronomy-engine",
    version: "2.1.19",
    precision: "astronomical",
    source: "astronomy-engine",
    fallbackUsed: false,
  });
  assert.equal(result.timeCorrection.enabled, true);
  assert.equal(result.timeCorrection.standardMeridian, 135);
  assert.equal(Math.round(result.timeCorrection.offsetMinutes), -32);
  assert.match(result.timeCorrection.correctedDateTime ?? "", /03:17:54/);
  assert.ok(result.natalChart.hourPillar);
});

test("Blind compiler creates structured pre-GPT JSON from existing manse result", () => {
  const result = calculateManse(baseInput({ name: "주영지" }));
  const blindCompiler = compileBlindInput(result);

  assert.equal(blindCompiler.version, "1.0.0");
  assert.equal(blindCompiler.inputMeta.name, "주영지");
  assert.equal(blindCompiler.pillars.year.ganKo, "갑");
  assert.equal(blindCompiler.pillars.month.jiKo, "미");
  assert.equal(blindCompiler.pillars.day.ganKo, "임");
  assert.equal(blindCompiler.pillars.hour?.jiKo, "인");
  assert.equal(blindCompiler.dayMaster.stemKo, "임");
  assert.equal(blindCompiler.dayMaster.element, "water");
  assert.deepEqual(blindCompiler.fiveElements.counts, result.natalChart.fiveElementsDistribution);
  assert.ok(blindCompiler.fiveElements.balance.total > 0);
  assert.ok(blindCompiler.fiveElements.strongest.length > 0);
  assert.ok(blindCompiler.fiveElements.weakest.length > 0);
  assert.ok(Object.values(blindCompiler.tenGods.counts).reduce((sum, count) => sum + count, 0) > 0);
  assert.ok(blindCompiler.tenGods.byBranchHidden.month.length > 0);
  assert.ok(Array.isArray(blindCompiler.relations.heavenlyStemCombinations));
  assert.ok(Array.isArray(blindCompiler.relations.earthlyBranchCombinations));
  assert.ok(Array.isArray(blindCompiler.relations.clashes));
  assert.ok(Array.isArray(blindCompiler.relations.punishments));
  assert.ok(Array.isArray(blindCompiler.relations.harms));
  assert.ok(Array.isArray(blindCompiler.relations.destructions));
  assert.ok(blindCompiler.roots.dayMasterRoots.length > 0);
  assert.ok(Object.keys(blindCompiler.roots.tenGodRoots).length > 0);
  assert.equal(blindCompiler.seasonalContext.monthBranchKo, "미");
  assert.ok(blindCompiler.candidates.strengthCandidates.length > 0);
  assert.ok(blindCompiler.candidates.structureCandidates.length > 0);
  assert.ok(blindCompiler.candidates.usefulGodCandidates.length > 0);
  assert.ok(blindCompiler.candidates.unfavorableGodCandidates.length > 0);
  assert.ok(blindCompiler.signals.wealthSignals.every((signal) => signal.sourcePaths.length > 0));
  assert.ok(blindCompiler.signals.careerSignals.every((signal) => signal.sourcePaths.length > 0));
  assert.ok(blindCompiler.signals.businessSignals.every((signal) => signal.sourcePaths.length > 0));
  assert.ok(blindCompiler.signals.relationshipSignals.every((signal) => signal.sourcePaths.length > 0));
  assert.ok(blindCompiler.signals.healthSignals.every((signal) => signal.sourcePaths.length > 0));
  [
    "leadershipSignals",
    "organizationSignals",
    "authoritySignals",
    "managementSignals",
    "entrepreneurSignals",
    "salesSignals",
    "creativitySignals",
    "studySignals",
    "reputationSignals",
    "partnershipSignals",
    "mobilitySignals",
    "contractSignals",
    "legalRiskSignals",
    "familySignals",
    "spouseSignals",
    "childrenSignals",
    "parentSignals",
    "accidentSignals",
    "travelSignals",
    "overseasSignals",
    "propertySignals",
    "investmentSignals",
    "cashflowSignals",
    "stressSignals",
    "communicationSignals",
  ].forEach((groupName) => {
    const group = blindCompiler.signals[groupName as keyof typeof blindCompiler.signals];
    assert.ok(Array.isArray(group), `${groupName} should be an array`);
    group.forEach((signal) => {
      assert.equal(signal.kind, "fact");
      assert.match(signal.code, /^[A-Z0-9_]+$/);
      assert.match(signal.label, /^[a-z0-9-]+$/);
      assert.doesNotMatch(signal.code, /RISK|PRESSURE|COMPETITION|TENSION|IMBALANCE|ACTIVE|ORIENTED/);
      assert.doesNotMatch(signal.label, /risk|pressure|competition|tension|imbalance|active|oriented/);
      assert.ok(signal.weight >= 1 && signal.weight <= 5);
      assert.ok(signal.confidence >= 0 && signal.confidence <= 1);
      assert.ok(signal.sourcePaths.length > 0);
      assert.ok(signal.sourceRules.length > 0);
    });
  });
  assert.ok(blindCompiler.evidenceSummary.wealth.sourceSignalGroups.length > 0);
  assert.ok(Array.isArray(blindCompiler.evidenceSummary.business.factCodes));
  assert.ok(Array.isArray(blindCompiler.evidenceSummary.mobility.candidateCodes));
  assert.equal("positiveCodes" in blindCompiler.evidenceSummary.business, false);
  assert.equal("riskCodes" in blindCompiler.evidenceSummary.health, false);
});

test("Manse route and UI expose blindCompiler without GPT or OpenAI coupling", () => {
  const routeSource = readFileSync(new URL("../app/api/manse/route.ts", import.meta.url), "utf8");
  const formSource = readFileSync(new URL("../src/components/manse/ManseInputForm.tsx", import.meta.url), "utf8");

  assert.match(routeSource, /compileBlindInput/);
  assert.match(routeSource, /blindCompiler/);
  assert.doesNotMatch(routeSource, /openai|gpt|buildGptBlueprintPublication|OPENAI_API_KEY/i);
  assert.match(formSource, /blindCompiler: result\.blindCompiler/);
});

test("Future compiler creates future facts from Blind compiler without decisions", () => {
  const result = calculateManse(baseInput({ name: "주영지" }));
  const blindCompiler = compileBlindInput(result);
  const futureCompiler = compileFutureInput(blindCompiler, {
    currentDate: result.input.currentDateTime,
    targetYear: 2026,
    daeun: result.daeun,
  });

  assert.equal(futureCompiler.version, "1.0.0");
  assert.equal(futureCompiler.targetYear, 2026);
  assert.ok(futureCompiler.currentDaeun);
  assert.equal(futureCompiler.currentYearGanji.ganji, "병오");
  assert.equal(futureCompiler.nextYearGanji.ganji, "정미");
  assert.equal(futureCompiler.monthlyGanji.length, 12);
  assert.equal(futureCompiler.monthlyRelations.length, 12);
  assert.equal(futureCompiler.monthlyTimingIndex.length, 12);
  assert.equal(futureCompiler.relationIntensity.length, 12);
  assert.ok(Array.isArray(futureCompiler.daeunRelations.clashes));
  assert.ok(Array.isArray(futureCompiler.saeunRelations.heavenlyStemCombinations));
  assert.equal(futureCompiler.source.futureCompilerVersion, "1.0.0");
  assert.equal(futureCompiler.source.normalizationVersion, "1.0.0");
  assert.equal(futureCompiler.source.usesGpt, false);
  assert.equal(futureCompiler.source.targetYear, 2026);

  Object.values(futureCompiler.futureSignals).forEach((group) => {
    group.forEach((signal) => {
      assert.equal(signal.kind, "fact");
      assert.match(signal.code, /^[A-Z0-9_]+$/);
      assert.match(signal.label, /^[a-z0-9-]+$/);
      assert.ok(signal.weight >= 1 && signal.weight <= 5);
      assert.ok(signal.confidence >= 0 && signal.confidence <= 1);
      assert.ok(signal.sourcePaths.length > 0);
      assert.ok(signal.sourceRules.length > 0);
    });
  });
  assert.ok(Array.isArray(futureCompiler.futureEvidence.wealthTiming.factCodes));
  assert.equal(
    futureCompiler.futureEvidence.wealthTiming.factCodes.length,
    new Set(futureCompiler.futureEvidence.wealthTiming.factCodes).size,
  );
  assert.ok(futureCompiler.futureEvidence.wealthTiming.occurrences.some((item) => item.code === "MONTH_SUPPORTS_WEALTH"));
  assert.ok(Array.isArray(futureCompiler.futureEvidence.mobilityTiming.candidateCodes));
  assert.ok(Array.isArray(futureCompiler.futureSignals.sharedMovementSignals));
  assert.ok(futureCompiler.monthlyTimingIndex.every((item) => Array.isArray(item.activeTimingCodes)));
  assert.ok(futureCompiler.relationIntensity.every((item) => ["LOW", "MEDIUM", "HIGH"].includes(item.intensity)));

  const payload = JSON.stringify(futureCompiler);
  assert.doesNotMatch(payload, /사업운이 좋다|이직하라|돈 번다|추천/);
});

test("Manse route and UI expose futureCompiler without GPT or OpenAI coupling", () => {
  const routeSource = readFileSync(new URL("../app/api/manse/route.ts", import.meta.url), "utf8");
  const formSource = readFileSync(new URL("../src/components/manse/ManseInputForm.tsx", import.meta.url), "utf8");

  assert.match(routeSource, /compileFutureInput/);
  assert.match(routeSource, /futureCompiler/);
  assert.doesNotMatch(routeSource, /openai|gpt|buildGptBlueprintPublication|OPENAI_API_KEY/i);
  assert.match(formSource, /futureCompiler: result\.futureCompiler/);
});

test("Decision compiler creates scored domain candidates with evidence traceability", () => {
  const result = calculateManse(baseInput({ name: "주영지" }));
  const blindCompiler = compileBlindInput(result);
  const futureCompiler = compileFutureInput(blindCompiler, {
    currentDate: result.input.currentDateTime,
    targetYear: 2026,
    daeun: result.daeun,
  });
  const decisionCompiler = compileDecisionInput({
    blindCompiler,
    futureCompiler,
    targetYear: 2026,
  });
  const requiredDomains = ["wealth", "career", "business", "health", "mobility", "leadership"];

  assert.equal(decisionCompiler.version, "1.0.0");
  assert.equal(decisionCompiler.targetYear, 2026);
  assert.equal(decisionCompiler.source.usesGpt, false);
  assert.equal(decisionCompiler.domainDecisions.length, 25);
  requiredDomains.forEach((domain) => {
    assert.ok(decisionCompiler.domainDecisions.some((decision) => decision.domain === domain));
  });
  decisionCompiler.domainDecisions.forEach((decision) => {
    assert.ok(decision.score >= 0 && decision.score <= 100);
    assert.ok(["LOW", "MID", "HIGH", "VERY_HIGH"].includes(decision.grade));
    assert.ok(["FAVORABLE", "NEUTRAL", "CAUTION", "RISK"].includes(decision.direction));
    assert.ok(decision.opportunityScore >= 0 && decision.opportunityScore <= 100);
    assert.ok(decision.directRiskScore >= 0 && decision.directRiskScore <= 100);
    assert.ok(decision.globalRiskScore >= 0 && decision.globalRiskScore <= 100);
    assert.ok(decision.riskScore >= 0 && decision.riskScore <= 100);
    assert.ok(["LOW", "MID", "HIGH", "VERY_HIGH"].includes(decision.opportunityGrade));
    assert.ok(["LOW", "MID", "HIGH", "VERY_HIGH"].includes(decision.riskGrade));
    assert.ok(["FAVORABLE", "NEUTRAL", "WEAK"].includes(decision.opportunityDirection));
    assert.ok(["LOW", "CAUTION", "HIGH", "RISK"].includes(decision.riskDirection));
    assert.ok([
      "HIGH_OPPORTUNITY_LOW_RISK",
      "HIGH_OPPORTUNITY_HIGH_RISK",
      "MID_OPPORTUNITY_LOW_RISK",
      "MID_OPPORTUNITY_HIGH_RISK",
      "LOW_OPPORTUNITY_LOW_RISK",
      "LOW_OPPORTUNITY_HIGH_RISK",
      "NEUTRAL",
    ].includes(decision.readerStatus));
    assert.ok(decision.confidence >= 0 && decision.confidence <= 1);
    assert.ok(Array.isArray(decision.sourceSignalGroups));
    assert.ok(Array.isArray(decision.sourcePaths));
    assert.ok(Array.isArray(decision.sourceRules));
    decision.positiveEvidenceCodes.forEach((code) => {
      assert.ok(!decision.riskEvidenceCodes.includes(code));
    });
    decision.bestMonths.forEach((month) => {
      assert.ok(futureCompiler.monthlyTimingIndex.some((item) => item.month === month.month));
    });
    decision.cautionMonths.forEach((month) => {
      assert.ok(futureCompiler.monthlyTimingIndex.some((item) => item.month === month.month));
    });
  });
  assert.ok(decisionCompiler.decisionEvidence.business);
  assert.ok(Array.isArray(decisionCompiler.decisionEvidence.business.occurrences));
  assert.ok(decisionCompiler.domainDecisions.some((decision) => decision.riskScore < 100));
  const businessDecision = decisionCompiler.domainDecisions.find((decision) => decision.domain === "business");
  const healthDecision = decisionCompiler.domainDecisions.find((decision) => decision.domain === "health");
  const stressDecision = decisionCompiler.domainDecisions.find((decision) => decision.domain === "stress");
  assert.ok(businessDecision);
  assert.ok(healthDecision);
  assert.ok(stressDecision);
  assert.equal(businessDecision.score, businessDecision.opportunityScore);
  assert.ok(businessDecision.opportunityScore >= 70);
  assert.ok(businessDecision.directRiskScore >= 0);
  assert.ok(businessDecision.globalRiskScore > 0);
  assert.ok(businessDecision.riskScore < 100);
  assert.equal(businessDecision.opportunityDirection, "FAVORABLE");
  assert.ok(["LOW", "CAUTION", "HIGH", "RISK"].includes(businessDecision.riskDirection));
  const riskOnlyCodes = [
    "HEALTH_MISSING_ELEMENT",
    "HEALTH_ELEMENT_SPREAD",
    "STRESS_ELEMENT_SPREAD_GE_3_FACT",
    "STRESS_OFFICER_COUNT_GE_2_FACT",
    "STRESS_CLASH_CLUSTER_FACT",
    "ACCIDENT_RELATION_COUNT_GE_2_FACT",
    "LEGAL_RELATION_PRESENT_FACT",
    "SPOUSE_PALACE_RELATION_PRESENT_FACT",
    "CASHFLOW_PEER_WEALTH_CO_OCCURRENCE_FACT",
  ];
  [healthDecision, stressDecision].forEach((decision) => {
    riskOnlyCodes.forEach((code) => {
      assert.ok(!decision.positiveEvidenceCodes.includes(code));
    });
  });
  assert.ok(healthDecision.riskEvidenceCodes.includes("HEALTH_MISSING_ELEMENT"));
  assert.ok(stressDecision.riskEvidenceCodes.includes("STRESS_ELEMENT_SPREAD_GE_3_FACT"));
  assert.ok(Array.isArray(decisionCompiler.decisionSummaryIndex.veryHighDomains));
  assert.ok(Array.isArray(decisionCompiler.decisionSummaryIndex.highOpportunityDomains));
  assert.ok(Array.isArray(decisionCompiler.decisionSummaryIndex.highRiskDomains));
  assert.ok(decisionCompiler.decisionSummaryIndex.highOpportunityLowRiskDomains.includes("business"));
  assert.ok(Array.isArray(decisionCompiler.decisionSummaryIndex.bestMonthsByDomain.business));

  const payload = JSON.stringify(decisionCompiler);
  assert.doesNotMatch(payload, /사업해라|이직하지 마라|돈 번다|OpenAI|OPENAI_API_KEY/);
});

test("Manse route and UI expose decisionCompiler without GPT or OpenAI coupling", () => {
  const routeSource = readFileSync(new URL("../app/api/manse/route.ts", import.meta.url), "utf8");
  const formSource = readFileSync(new URL("../src/components/manse/ManseInputForm.tsx", import.meta.url), "utf8");

  assert.match(routeSource, /compileDecisionInput/);
  assert.match(routeSource, /decisionCompiler/);
  assert.doesNotMatch(routeSource, /openai|gpt|buildGptBlueprintPublication|OPENAI_API_KEY/i);
  assert.match(formSource, /decisionCompiler: result\.decisionCompiler/);
});

test("Template Reader creates safe report JSON from Decision compiler without GPT", () => {
  const result = calculateManse(baseInput({ name: "주영지" }));
  const blindCompiler = compileBlindInput(result);
  const futureCompiler = compileFutureInput(blindCompiler, {
    currentDate: result.input.currentDateTime,
    targetYear: 2026,
    daeun: result.daeun,
  });
  const decisionCompiler = compileDecisionInput({
    blindCompiler,
    futureCompiler,
    targetYear: 2026,
  });
  const readerReport = buildTemplateReaderReport({
    decisionAnalysis: decisionCompiler,
    targetYear: 2026,
  });
  const businessReport = readerReport.domainReports.find((report) => report.domain === "business");

  assert.equal(readerReport.version, "1.0.0");
  assert.equal(readerReport.source.readerVersion, "0.1.0");
  assert.equal(readerReport.source.usesGpt, false);
  assert.equal(readerReport.targetYear, 2026);
  assert.ok(readerReport.headline.length > 0);
  assert.match(readerReport.headline, /동업|창업|확장|사업|리더십|기회|리스크|변동성/);
  assert.equal(readerReport.domainReports.length, decisionCompiler.domainDecisions.length);
  assert.ok(readerReport.visibleDomainReports.length > 0);
  assert.ok(readerReport.visibleDomainReports.length <= 5);
  assert.ok(readerReport.topOpportunities.length <= 5);
  assert.ok(readerReport.highRiskOpportunities.length <= 5);
  assert.ok(readerReport.topRisks.length <= 5);
  readerReport.topOpportunities.forEach((item) => {
    assert.ok(item.riskScore < 50);
  });
  readerReport.highRiskOpportunities.forEach((item) => {
    assert.ok(item.opportunityScore >= 70);
    assert.ok(item.riskScore >= 50);
  });
  readerReport.domainReports.forEach((report) => {
    report.displayBestMonths.forEach((month) => {
      assert.ok(!report.displayCautionMonths.includes(month));
    });
  });
  assert.ok(businessReport);
  assert.equal(businessReport.readerStatus, "HIGH_OPPORTUNITY_LOW_RISK");
  assert.match(businessReport.summary, /사업 영역은 기회 신호가 강하고 리스크 신호는 낮은 편입니다/);
  assert.ok(businessReport.evidenceBullets.every((line) => /^(긍정 신호|리스크 신호|시기 신호): /.test(line)));
  assert.ok(businessReport.evidenceBullets.some((line) => line.includes("생산/표현 신호가 확인됨")));
  assert.ok(businessReport.evidenceBullets.every((line) => !/[A-Z]{2,}_[A-Z0-9_]+/.test(line)));
  assert.ok(readerReport.monthHighlights.some((line) => /유리 신호 월|주의 신호 월/.test(line)));
  assert.ok(readerReport.condensedMonthHighlights.length > 0);
  assert.ok(readerReport.condensedMonthHighlights.length <= readerReport.monthHighlights.length);
  assert.ok(readerReport.cautionNotes.includes("Reader는 Decision Compiler에 존재하는 근거 코드만 사용하며, 새로운 판단을 생성하지 않습니다."));
  const serviceCareer = readerReport.serviceDomainReports.find((report) => report.domain === "career");
  const serviceHealth = readerReport.serviceDomainReports.find((report) => report.domain === "health");
  const servicePayload = JSON.stringify({
    serviceDomainReports: readerReport.serviceDomainReports,
    serviceMonthlyStrategy: readerReport.serviceMonthlyStrategy,
    serviceTimingSummary: readerReport.serviceTimingSummary,
  });
  const summaryText = readerReport.overallSummary.join("\n");

  assert.ok(serviceCareer);
  assert.ok(["좋음", "보통", "주의", "기회와 주의"].includes(serviceCareer.label));
  assert.ok(serviceCareer.stars >= 1 && serviceCareer.stars <= 5);
  assert.ok(serviceCareer.shortSummary.length > 0);
  assert.match(serviceCareer.summary, /직장 자체가 나쁘다는 의미는 아닙니다/);
  assert.ok(serviceCareer.positiveMeanings.some((line) => /직장|책임|역할|권한|평가/.test(line)));
  assert.equal(serviceCareer.positiveMeanings.length, new Set(serviceCareer.positiveMeanings).size);
  assert.ok(serviceCareer.cautionMeanings.some((line) => line.includes("계약·규정·문서")));
  assert.ok(serviceHealth);
  assert.match(serviceHealth.summary, /건강이 나쁘다는 뜻이 아닙니다/);
  assert.match(serviceHealth.summary, /의료 전문가의 영역입니다/);
  assert.equal(readerReport.serviceMonthlyStrategy.length, 12);
  assert.ok(readerReport.serviceTimingSummary.primaryActiveMonths.length > 0);
  assert.ok(readerReport.serviceTimingSummary.primaryCautionMonths.length > 0);
  assert.match(summaryText, new RegExp(readerReport.serviceTimingSummary.activeLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(summaryText, new RegExp(readerReport.serviceTimingSummary.cautionLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  readerReport.serviceTimingSummary.primaryActiveMonths.forEach((month) => {
    assert.ok(readerReport.serviceMonthlyStrategy.some((item) => item.month === month && (item.tone === "ACTIVE" || item.tone === "PREPARE")));
  });
  readerReport.serviceTimingSummary.primaryCautionMonths.forEach((month) => {
    assert.ok(readerReport.serviceMonthlyStrategy.some((item) => item.month === month && item.tone === "CAUTION"));
  });
  assert.ok(readerReport.serviceMonthlyStrategy.some((month) => month.tone === "MIXED" && month.goodFor.length > 0 && month.watchFor.length > 0));
  assert.ok(readerReport.serviceMonthlyStrategy.every((month) => typeof month.month === "number" && typeof month.summary === "string"));
  assert.doesNotMatch(servicePayload, /[A-Z]{2,}_[A-Z0-9_]+|HIGH_OPPORTUNITY_LOW_RISK|HIGH_OPPORTUNITY_HIGH_RISK|LOW_OPPORTUNITY_HIGH_RISK|opportunityScore|riskScore|readerStatus|evidenceCodes|sourceSignalGroups/);
  assert.doesNotMatch(servicePayload, /흐름을 세부 신호로 나누어 볼 필요가 있습니다|한쪽으로 단정하기보다|조건 확인과 조율의 관점이 필요합니다/);

  const payload = JSON.stringify(readerReport);
  const debugPayload = JSON.stringify(decisionCompiler);
  assert.match(debugPayload, /BUSINESS_OUTPUT_PRESENT/);
  assert.doesNotMatch(payload, /BUSINESS_OUTPUT_PRESENT|HIGH_RELATION_MONTH_7|HEALTH_MISSING_ELEMENT/);
  assert.doesNotMatch(payload, /무조건 해라|반드시 돈 번다|이혼한다|병 걸린다|OpenAI|OPENAI_API_KEY/);
});

test("Service labels map decision values to user-facing card labels", () => {
  assert.deepEqual(serviceLabelForDecision({
    domain: "health",
    opportunityScore: 40,
    riskScore: 80,
    readerStatus: "LOW_OPPORTUNITY_HIGH_RISK",
  }), {
    serviceLevel: "CAUTION",
    label: "주의",
    stars: 1,
    shortSummary: "주의 깊게 살펴볼 신호가 강합니다.",
  });

  const business = serviceLabelForDecision({
    domain: "business",
    opportunityScore: 84,
    riskScore: 35,
    readerStatus: "HIGH_OPPORTUNITY_LOW_RISK",
  });
  assert.equal(business.serviceLevel, "GOOD");
  assert.equal(business.label, "좋음");
  assert.ok(business.stars >= 4);

  assert.deepEqual(serviceLabelForDecision({
    domain: "businessExpansion",
    opportunityScore: 76,
    riskScore: 58,
    readerStatus: "HIGH_OPPORTUNITY_HIGH_RISK",
  }), {
    serviceLevel: "MIXED",
    label: "기회와 주의",
    stars: 3,
    shortSummary: "기회와 점검 신호가 함께 있습니다.",
  });
});

test("Manse route and UI expose readerReport without GPT or OpenAI coupling", () => {
  const routeSource = readFileSync(new URL("../app/api/manse/route.ts", import.meta.url), "utf8");
  const formSource = readFileSync(new URL("../src/components/manse/ManseInputForm.tsx", import.meta.url), "utf8");

  assert.match(routeSource, /buildTemplateReaderReport/);
  assert.match(routeSource, /readerReport/);
  assert.doesNotMatch(routeSource, /openai|gpt|buildGptBlueprintPublication|OPENAI_API_KEY/i);
  assert.match(formSource, /readerReport: result\.readerReport/);
});

test("1974 서울 회귀 케이스는 Astronomy Engine 입추로 대운 시작을 계산한다", () => {
  const result = calculateManse(baseInput({}));

  assert.equal(result.daeun.start.termUsed?.name, "입추");
  assert.equal(result.daeun.start.termUsed?.provider, "astronomy-engine");
  assert.equal(result.daeun.start.termUsed?.precision, "astronomical");
  assert.equal(result.daeun.start.termUsed?.dateTime, "1974-08-08T06:57:01.896+09:00");
  assert.equal(result.daeun.start.termUsed?.fallbackUsed, false);
  assert.equal(result.daeun.start.years, 3);
  assert.equal(result.daeun.start.months, 1);
  assert.equal(result.daeun.start.days, 9);
  assert.equal(result.daeun.start.age, 4);
  assert.equal(result.daeun.cycles[0].startDateTime, "1977-09-08T03:17:54.720+09:00");
  assert.equal(result.daeun.current?.ganji, "병자");
  assert.equal(
    result.warnings.some((warning) => warning.type === "APPROXIMATE_SOLAR_TERMS_USED"),
    false,
  );
});

test("2026-07-02 현재 대운은 실제 시작/종료 시각 범위로 판정한다", () => {
  const result = calculateManse(baseInput({}));
  const current = result.daeun.current;

  assert.ok(current);
  assert.equal(current.ganji, "병자");
  assert.notEqual(current.ganji, "정축");
  assert.notEqual(current.startYear, 2027);
  assert.ok(Date.parse(current.startDateTime) <= Date.parse(result.input.currentDateTime));
  assert.ok(Date.parse(result.input.currentDateTime) < Date.parse(current.endDateTime));
  assert.deepEqual(result.daeun.start, result.blueprintInput.structureOnlyData.luck.daeun.start);
  assert.deepEqual(result.daeun.current, result.blueprintInput.structureOnlyData.luck.daeun.current);
});

test("대운 경계 시각은 시작 포함, 종료 제외 규칙을 따른다", () => {
  const base = calculateManse(baseInput({}));
  const cycle5 = base.daeun.cycles.find((cycle) => cycle.index === 5);
  const cycle6 = base.daeun.cycles.find((cycle) => cycle.index === 6);

  assert.ok(cycle5);
  assert.ok(cycle6);

  const beforeCycle5 = calculateManse(
    baseInput({ currentDateTime: oneSecondBefore(cycle5.startDateTime) }),
  );
  const atCycle5 = calculateManse(
    baseInput({ currentDateTime: cycle5.startDateTime }),
  );
  const beforeCycle6 = calculateManse(
    baseInput({ currentDateTime: oneSecondBefore(cycle6.startDateTime) }),
  );
  const atCycle6 = calculateManse(
    baseInput({ currentDateTime: cycle6.startDateTime }),
  );

  assert.equal(beforeCycle5.daeun.current?.index, 4);
  assert.equal(atCycle5.daeun.current?.index, 5);
  assert.equal(beforeCycle6.daeun.current?.index, 5);
  assert.equal(atCycle6.daeun.current?.index, 6);
});

test("대구 1975-11-12 22:00 남성 양력은 약 -26분 보정된다", () => {
  const result = calculateManse(
    baseInput({
      birthDate: "1975-11-12",
      birthTime: "22:00",
      birthPlace: place("대구광역시, 대한민국", 35.8714, 128.6014),
    }),
  );

  assert.equal(Math.round(result.timeCorrection.offsetMinutes), -26);
  assert.match(result.timeCorrection.correctedDateTime ?? "", /21:34/);
});

test("시간 미상은 시주를 null 처리하고 Blueprint confidence를 낮춘다", () => {
  const result = calculateManse(
    baseInput({
      birthTime: null,
      unknownTime: true,
    }),
  );

  assert.equal(result.saju.hour, null);
  assert.equal(result.natalChart.pillars.hour, null);
  assert.equal(result.blueprintInput.confidence.hourPillar, "low");
  assert.equal(result.blueprintInput.structureOnlyData.luck.currentTimePillar, null);
  assert.ok(result.warnings.some((warning) => warning.type === "UNKNOWN_TIME_USED"));
});

test("음력 윤달 입력은 korean-lunar-calendar 기준으로 양력 변환하고 debug에 남긴다", () => {
  const result = calculateManse(
    baseInput({
      birthDate: "1974-04-01",
      calendarType: "lunar",
      isLeapMonth: true,
    }),
  );

  assert.equal(result.calendarConversion.source, "korean-lunar-calendar");
  assert.equal(result.calendarConversion.solarDate, "1974-05-22");
  assert.equal(result.calendarConversion.isLeapMonth, true);
  assert.equal(result.calendarConversion.verifiedByKoreanLunarCalendar, true);
  assert.deepEqual(result.saju.month, { gan: "己", ji: "巳", ganKo: "기", jiKo: "사" });
  assert.ok(result.debug.lunarConversion.koreanLunarCalendar);
});

test("인천 1973년 음력 10월 10일 여성은 음력 변환 검증과 시주 계산을 수행한다", () => {
  const result = calculateManse(
    baseInput({
      birthDate: "1973-10-10",
      calendarType: "lunar",
      birthTime: "04:00",
      gender: "female",
      birthPlace: place("인천광역시, 대한민국", 37.4563, 126.7052),
    }),
  );

  assert.equal(result.calendarConversion.verifiedByKoreanLunarCalendar, true);
  assert.ok(result.natalChart.hourPillar);
});

test("입춘 경계 샘플은 보정 전후 기둥 변경 가능성을 warning으로 드러낸다", () => {
  const result = calculateManse(
    baseInput({
      birthDate: "2026-02-04",
      birthTime: "05:10",
      birthPlace: place("서울특별시, 대한민국", 37.5665, 126.978),
    }),
  );

  assert.ok(result.warnings.some((warning) => warning.type === "TIME_CORRECTION_CHANGED_PILLAR"));
  assert.equal(
    result.warnings.some((warning) => warning.type === "APPROXIMATE_SOLAR_TERMS_USED"),
    false,
  );
});

test("절입일 전후 월주는 절기 기준으로 달라진다", () => {
  const before = calculateManse(
    baseInput({
      birthDate: "2026-02-03",
      birthTime: "23:50",
    }),
  );
  const after = calculateManse(
    baseInput({
      birthDate: "2026-02-04",
      birthTime: "05:40",
    }),
  );

  assert.notDeepEqual(before.saju.month, after.saju.month);
  assert.equal(after.saju.month.ganKo + after.saju.month.jiKo, "경인");
});

test("23:30 자시 경계 샘플은 ziHourRule warning을 노출한다", () => {
  const result = calculateManse(
    baseInput({
      birthDate: "1974-07-30",
      birthTime: "23:30",
      ziHourRule: "midnight",
    }),
  );

  assert.ok(
    result.warnings.some((warning) => warning.type === "ZI_HOUR_RULE_CHANGED_PILLAR"),
  );
});
