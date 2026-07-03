import assert from "node:assert/strict";
import test from "node:test";
import { calculateManse, type BirthPlace, type ManseInput } from "../src/lib/manse";

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
