export type ExternalSolarTermFixture = {
  year: number;
  timezone: string;
  notes: string;
  terms: Array<{
    name: string;
    longitude: number;
    expectedLocalDateTime: string | null;
    source: string;
    sourceUrl?: string;
    retrievedAt?: string;
    status: "verified" | "pending";
  }>;
};

export type KasiSolarTermFixture = {
  year: number;
  termName: string;
  longitude: number;
  expectedKst: string;
  source: "KASI 월력요항";
  sourceUrl: string;
  retrievedAt: string;
  status: "verified";
};

const KASI_MONTHLY_CALENDAR_URL = "https://astro.kasi.re.kr/life/pageView/5";
const KASI_MONTHLY_EVENTS_URL = "https://astro.kasi.re.kr/life/pageView/7";
const KASI_ALMANAC_PAGE_VIEW_URL = "https://astro.kasi.re.kr/life/pageView/4";

function kasiFixture(
  year: number,
  termName: string,
  longitude: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): KasiSolarTermFixture {
  return {
    year,
    termName,
    longitude,
    expectedKst: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+09:00`,
    source: "KASI 월력요항",
    sourceUrl: KASI_ALMANAC_PAGE_VIEW_URL,
    retrievedAt: "2026-07-03",
    status: "verified",
  };
}

export const KASI_SOLAR_TERM_FIXTURES: KasiSolarTermFixture[] = [
  kasiFixture(2004, "입춘", 315, 2, 4, 20, 56),
  kasiFixture(2004, "춘분", 0, 3, 20, 15, 49),
  kasiFixture(2004, "하지", 90, 6, 21, 9, 57),
  kasiFixture(2004, "입추", 135, 8, 7, 13, 20),
  kasiFixture(2004, "추분", 180, 9, 23, 1, 30),
  kasiFixture(2004, "동지", 270, 12, 21, 21, 42),
  kasiFixture(2012, "입춘", 315, 2, 4, 19, 22),
  kasiFixture(2012, "춘분", 0, 3, 20, 14, 14),
  kasiFixture(2012, "하지", 90, 6, 21, 8, 9),
  kasiFixture(2012, "입추", 135, 8, 7, 11, 30),
  kasiFixture(2012, "추분", 180, 9, 22, 23, 49),
  kasiFixture(2012, "동지", 270, 12, 21, 20, 11),
  kasiFixture(2013, "입춘", 315, 2, 4, 1, 13),
  kasiFixture(2013, "춘분", 0, 3, 20, 20, 2),
  kasiFixture(2013, "하지", 90, 6, 21, 14, 4),
  kasiFixture(2013, "입추", 135, 8, 7, 17, 20),
  kasiFixture(2013, "추분", 180, 9, 23, 5, 44),
  kasiFixture(2013, "동지", 270, 12, 22, 2, 11),
  kasiFixture(2014, "입춘", 315, 2, 4, 7, 3),
  kasiFixture(2014, "춘분", 0, 3, 21, 1, 57),
  kasiFixture(2014, "하지", 90, 6, 21, 19, 51),
  kasiFixture(2014, "입추", 135, 8, 7, 23, 2),
  kasiFixture(2014, "추분", 180, 9, 23, 11, 29),
  kasiFixture(2014, "동지", 270, 12, 22, 8, 3),
  kasiFixture(2015, "입춘", 315, 2, 4, 12, 58),
  kasiFixture(2015, "춘분", 0, 3, 21, 7, 45),
  kasiFixture(2015, "하지", 90, 6, 22, 1, 38),
  kasiFixture(2015, "입추", 135, 8, 8, 5, 1),
  kasiFixture(2015, "추분", 180, 9, 23, 17, 20),
  kasiFixture(2015, "동지", 270, 12, 22, 13, 48),
  kasiFixture(2016, "입춘", 315, 2, 4, 18, 46),
  kasiFixture(2016, "춘분", 0, 3, 20, 13, 30),
  kasiFixture(2016, "하지", 90, 6, 21, 7, 34),
  kasiFixture(2016, "입추", 135, 8, 7, 10, 53),
  kasiFixture(2016, "추분", 180, 9, 22, 23, 21),
  kasiFixture(2016, "동지", 270, 12, 21, 19, 44),
  kasiFixture(2017, "입춘", 315, 2, 4, 0, 34),
  kasiFixture(2017, "춘분", 0, 3, 20, 19, 28),
  kasiFixture(2017, "하지", 90, 6, 21, 13, 24),
  kasiFixture(2017, "입추", 135, 8, 7, 16, 40),
  kasiFixture(2017, "추분", 180, 9, 23, 5, 2),
  kasiFixture(2017, "동지", 270, 12, 22, 1, 28),
];

export const EXTERNAL_SOLAR_TERM_FIXTURES: ExternalSolarTermFixture[] = [
  {
    year: 1900,
    timezone: "Asia/Seoul",
    notes: "Fixture slot for an independently verified historical source.",
    terms: [],
  },
  {
    year: 1950,
    timezone: "Asia/Seoul",
    notes: "Fixture slot for an independently verified historical source.",
    terms: [],
  },
  {
    year: 1974,
    timezone: "Asia/Seoul",
    notes: "Primary Pigbar Manse regression year. Fill with verified KASI/astronomical reference before production activation.",
    terms: [
      {
        name: "입추",
        longitude: 135,
        expectedLocalDateTime: null,
        source: "KASI monthly calendar/almanac fixture pending",
        sourceUrl: KASI_MONTHLY_CALENDAR_URL,
        retrievedAt: "2026-07-03",
        status: "pending",
      },
    ],
  },
  {
    year: 2000,
    timezone: "Asia/Seoul",
    notes: "Fixture slot for an independently verified source.",
    terms: [],
  },
  {
    year: 2020,
    timezone: "Asia/Seoul",
    notes: "Required KASI comparison fixtures for the four-way solar-term validation.",
    terms: [
      {
        name: "입춘",
        longitude: 315,
        expectedLocalDateTime: null,
        source: "KASI monthly calendar/almanac fixture pending",
        sourceUrl: KASI_MONTHLY_CALENDAR_URL,
        retrievedAt: "2026-07-03",
        status: "pending",
      },
      {
        name: "입추",
        longitude: 135,
        expectedLocalDateTime: null,
        source: "KASI monthly calendar/almanac fixture pending",
        sourceUrl: KASI_MONTHLY_EVENTS_URL,
        retrievedAt: "2026-07-03",
        status: "pending",
      },
    ],
  },
  {
    year: 2026,
    timezone: "Asia/Seoul",
    notes: "Fixture slot overlapping @fullstackfamily/manseryeok precision range.",
    terms: [
      {
        name: "입춘",
        longitude: 315,
        expectedLocalDateTime: null,
        source: "KASI monthly calendar/almanac fixture pending",
        sourceUrl: KASI_MONTHLY_CALENDAR_URL,
        retrievedAt: "2026-07-03",
        status: "pending",
      },
      {
        name: "입추",
        longitude: 135,
        expectedLocalDateTime: null,
        source: "KASI monthly calendar/almanac fixture pending",
        sourceUrl: KASI_MONTHLY_EVENTS_URL,
        retrievedAt: "2026-07-03",
        status: "pending",
      },
    ],
  },
  {
    year: 2050,
    timezone: "Asia/Seoul",
    notes: "Fixture slot for upper bound validation.",
    terms: [],
  },
  {
    year: 2100,
    timezone: "Asia/Seoul",
    notes: "Fixture slot for extended upper bound validation.",
    terms: [],
  },
];
