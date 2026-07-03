import assert from "node:assert/strict";
import test from "node:test";
import { DateTime } from "luxon";
import { astronomicalSolarTermProvider } from "../src/lib/solarTerms/astronomical";
import { astronomyEngineSolarTermProvider } from "../src/lib/solarTerms/astronomyEngine";
import { getCanonicalSolarTerms } from "../src/lib/solarTerms/canonical";
import {
  EXTERNAL_SOLAR_TERM_FIXTURES,
  KASI_SOLAR_TERM_FIXTURES,
} from "../src/lib/solarTerms/fixtures";
import {
  compareKasiFixtures,
  compareAstronomicalWithManseryeok,
  compare2020Ipchun,
  compareThreeSolarTermProviders,
  get1974DaewoonSolarTermSample,
} from "../src/lib/solarTerms/validation";

test("Astronomy Engine provider returns exact installed package backed solar terms", () => {
  const result = astronomyEngineSolarTermProvider.getTermsByYear(2020, "Asia/Seoul");
  const ipchun = result.terms.find((term) => term.name === "입춘");

  assert.equal(result.precision, "astronomy-engine");
  assert.equal(result.source, "astronomy-engine@2.1.19 SearchSunLongitude");
  assert.equal(result.terms.length, 24);
  assert.equal(ipchun?.utcDateTime, "2020-02-04T09:03:38.336Z");
  assert.equal(ipchun?.localDateTime, "2020-02-04T18:03:38.336+09:00");
});

test("astronomical provider returns 24 solar terms for the 1900-2100 range", () => {
  [1900, 1950, 1974, 2000, 2026, 2050, 2100].forEach((year) => {
    const result = astronomicalSolarTermProvider.getTermsByYear(year, "Asia/Seoul");

    assert.equal(result.year, year);
    assert.equal(result.precision, "astronomical");
    assert.equal(result.terms.length, 24);
    assert.equal(result.terms[0].name, "소한");
    assert.equal(result.terms[23].name, "동지");
  });
});

test("2020-2030 manseryeok cross-validation report detects precision mismatch", () => {
  const report = compareAstronomicalWithManseryeok();

  assert.equal(report.count, 264);
  assert.ok(report.averageDifferenceMinutes > 5);
  assert.ok(report.maxDifferenceMinutes > 15);
  assert.ok(report.overTenMinuteItems.length > 0);
  assert.ok(report.maxDifferenceItem);
});

test("2020 ipchun three-way comparison shows Meeus close and manseryeok far from Astronomy Engine", () => {
  const report = compare2020Ipchun();

  assert.ok(report.pairwise.astronomyEngineVsMeeusMinutes < 5);
  assert.ok(report.pairwise.astronomyEngineVsManseryeokMinutes > 60);
  assert.ok(report.pairwise.meeusVsManseryeokMinutes > 60);
});

test("2020-2030 three-way report uses Astronomy Engine as reference", () => {
  const report = compareThreeSolarTermProviders();

  assert.equal(report.countPerPair, 264);
  assert.ok(report.astronomyEngineVsMeeus.averageDifferenceMinutes < 5);
  assert.ok(report.astronomyEngineVsManseryeok.averageDifferenceMinutes > 60);
  assert.ok(report.meeusVsManseryeok.averageDifferenceMinutes > 60);
});

test("KASI verified fixtures validate Astronomy Engine within two minutes", () => {
  const report = compareKasiFixtures();

  assert.equal(report.fixtureCount, 42);
  assert.ok(report.astronomyEngine.averageDifferenceMinutes <= 1);
  assert.ok(report.astronomyEngine.maxDifferenceMinutes <= 2);
  assert.equal(report.astronomyEngine.overTwoMinuteItems.length, 0);
  assert.ok(report.meeus.averageDifferenceMinutes <= 5);
  assert.ok(report.meeus.maxDifferenceMinutes <= 15);
});

test("canonical solar term provider uses Astronomy Engine without fallback", () => {
  const result = getCanonicalSolarTerms(1974, "Asia/Seoul");
  const liqiu = result.terms.find((term) => term.name === "입추");

  assert.equal(result.provider, "astronomy-engine");
  assert.equal(result.providerVersion, "2.1.19");
  assert.equal(result.precision, "astronomical");
  assert.equal(result.fallbackUsed, false);
  assert.deepEqual(result.warnings, []);
  assert.equal(liqiu?.dateTime, "1974-08-08T06:57:01.896+09:00");
});

test("canonical jeolgi boundaries are consistent at one-second precision", () => {
  const terms2020 = getCanonicalSolarTerms(2020, "Asia/Seoul").terms;
  const terms1974 = getCanonicalSolarTerms(1974, "Asia/Seoul").terms;

  function selectedNextTerm(terms: typeof terms2020, iso: string) {
    const birth = DateTime.fromISO(iso, { setZone: true });
    return terms
      .map((term) => ({ ...term, dt: DateTime.fromISO(term.dateTime, { setZone: true }) }))
      .find((term) => term.dt > birth)?.name;
  }

  const ipchun = "2020-02-04T18:03:38.336+09:00";
  const liqiu = "1974-08-08T06:57:01.896+09:00";

  assert.equal(selectedNextTerm(terms2020, DateTime.fromISO(ipchun).minus({ seconds: 1 }).toISO() ?? ""), "입춘");
  assert.notEqual(selectedNextTerm(terms2020, ipchun), "입춘");
  assert.notEqual(selectedNextTerm(terms2020, DateTime.fromISO(ipchun).plus({ seconds: 1 }).toISO() ?? ""), "입춘");

  assert.equal(selectedNextTerm(terms1974, DateTime.fromISO(liqiu).minus({ seconds: 1 }).toISO() ?? ""), "입추");
  assert.notEqual(selectedNextTerm(terms1974, liqiu), "입추");
  assert.notEqual(selectedNextTerm(terms1974, DateTime.fromISO(liqiu).plus({ seconds: 1 }).toISO() ?? ""), "입추");
});

test("1974 sample exposes astronomical next term and converted daeun start age", () => {
  const sample = get1974DaewoonSolarTermSample();

  assert.equal(sample.nextAstronomicalTerm.name, "입추");
  assert.equal(sample.nextAstronomyEngineTerm.name, "입추");
  assert.equal(sample.nextAstronomicalTerm.longitude, 135);
  assert.equal(sample.precision, "astronomy-engine");
  assert.ok(sample.astronomyEngineMinusAstronomicalMinutes < 5);
  assert.ok(sample.astronomicalMinusApproximateMinutes > 0);
  assert.ok(sample.rawTermDifference.days >= 8);
  assert.ok(sample.displayAge >= 3);
});

test("external fixture structure exists for required years", () => {
  assert.deepEqual(
    EXTERNAL_SOLAR_TERM_FIXTURES.map((fixture) => fixture.year),
    [1900, 1950, 1974, 2000, 2020, 2026, 2050, 2100],
  );

  const twentyTwenty = EXTERNAL_SOLAR_TERM_FIXTURES.find((fixture) => fixture.year === 2020);
  const twentyTwentySix = EXTERNAL_SOLAR_TERM_FIXTURES.find((fixture) => fixture.year === 2026);

  assert.ok(twentyTwenty?.terms.some((term) => term.name === "입춘" && term.status === "pending"));
  assert.ok(twentyTwenty?.terms.some((term) => term.name === "입추" && term.status === "pending"));
  assert.ok(twentyTwentySix?.terms.some((term) => term.name === "입춘" && term.status === "pending"));
  assert.ok(twentyTwentySix?.terms.some((term) => term.name === "입추" && term.status === "pending"));
});

test("KASI verified fixture set has at least twenty official solar-term rows", () => {
  assert.ok(KASI_SOLAR_TERM_FIXTURES.length >= 20);
  assert.ok(
    KASI_SOLAR_TERM_FIXTURES.every(
      (fixture) =>
        fixture.source === "KASI 월력요항" &&
        fixture.sourceUrl === "https://astro.kasi.re.kr/life/pageView/4" &&
        fixture.status === "verified",
    ),
  );
});

test("fixed +09:00 rendering is separate from elapsed time calculations", () => {
  const dstLocal = DateTime.fromISO("1987-07-09T03:17:54.720", {
    zone: "Asia/Seoul",
  });
  const fixedKst = dstLocal.toUTC().plus({ hours: 9 }).toFormat("yyyy-MM-dd'T'HH:mm:ss");

  assert.equal(dstLocal.offset, 600);
  assert.equal(`${fixedKst}+09:00`, "1987-07-09T02:17:54+09:00");
});
