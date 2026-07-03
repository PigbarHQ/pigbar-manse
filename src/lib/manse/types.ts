export type CalendarType = "solar" | "lunar";
export type DaewoonDirection = "forward" | "backward";
export type DaewoonDirectionRule = "standard";
export type ElementName = "wood" | "fire" | "earth" | "metal" | "water";
export type Gender = "male" | "female";
export type YinYang = "yang" | "yin";
export type ZiHourRule = "midnight" | "lateZi";

export type BirthPlace = {
  name: string;
  label?: string;
  latitude: number;
  longitude: number;
  timezone: "Asia/Seoul";
};

export type ManseInput = {
  name?: string;
  birthDate: string;
  calendarType: CalendarType;
  isLeapMonth: boolean;
  birthTime: string | null;
  unknownTime?: boolean;
  gender: Gender;
  birthPlace: BirthPlace;
  useLocalMeanTime?: boolean;
  currentDateTime: string;
  ziHourRule?: ZiHourRule;
  daewoonDirectionRule?: DaewoonDirectionRule;
};

export type Warning = {
  type: string;
  message: string;
  affectedFields: string[];
};

export type DateParts = {
  year: number;
  month: number;
  day: number;
};

export type DateTimeParts = DateParts & {
  hour: number;
  minute: number;
};

export type CalendarConversion = {
  solarDate: string;
  lunarDate: string;
  isLeapMonth: boolean;
  verifiedByKoreanLunarCalendar: boolean;
  verificationDiff: string | null;
  source: "solar-input" | "korean-lunar-calendar";
  manseryeok: unknown;
  koreanLunarCalendar: unknown;
};

export type TimeCorrection = {
  enabled: boolean;
  standardMeridian: number;
  localLongitude: number;
  offsetMinutes: number;
  standardDateTime: string | null;
  correctedDateTime: string | null;
  standardTime: string | null;
  localMeanTime: string | null;
  applied: boolean;
};

export type StemInfo = {
  key: string;
  hangul: string;
  hanja: string;
  element: ElementName;
  yinYang: YinYang;
};

export type BranchInfo = {
  key: string;
  hangul: string;
  hanja: string;
  element: ElementName;
  yinYang: YinYang;
  hiddenStems: StemInfo[];
};

export type PillarInfo = {
  ganji: string;
  ganjiHanja: string;
  stem: StemInfo;
  branch: BranchInfo;
  tenGod: string;
  element: ElementName;
  yinYang: YinYang;
  hiddenStems: StemInfo[];
  twelveStage: string;
};

export type SajuPillar = {
  gan: string;
  ji: string;
  ganKo: string;
  jiKo: string;
};

export type SajuOutput = {
  year: SajuPillar;
  month: SajuPillar;
  day: SajuPillar;
  hour: SajuPillar | null;
};

export type NatalChart = {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string | null;
  pillars: {
    year: PillarInfo;
    month: PillarInfo;
    day: PillarInfo;
    hour: PillarInfo | null;
  };
  fiveElementsDistribution: Record<ElementName, number>;
  tenGods: Record<string, string | null>;
  hiddenStems: Record<"year" | "month" | "day" | "hour", StemInfo[]>;
  twelveStages: Record<"year" | "month" | "day" | "hour", string | null>;
};

export type DaewoonStart = {
  age: number;
  years: number;
  months: number;
  days: number;
  ageYears: number;
  ageMonths: number;
  ageDays: number;
  precision: "exact" | "estimated";
  source: "solar-term" | "approximate-solar-term";
  termUsed: {
    name: string;
    dateTime: string;
    utcDateTime: string;
    provider: "astronomy-engine" | "meeus" | "approximate";
    precision: "astronomical" | "astronomical-fallback" | "estimated";
    source: "astronomy-engine" | "meeus" | "approximate";
    fallbackUsed: boolean;
  } | null;
  solarTermEngine: {
    provider: "astronomy-engine" | "meeus" | "approximate";
    version: string | null;
    precision: "astronomical" | "astronomical-fallback" | "estimated";
    source: "astronomy-engine" | "meeus" | "approximate";
    fallbackUsed: boolean;
  } | null;
};

export type LuckPillar = PillarInfo & {
  index?: number;
  age?: number;
  startYear?: number;
  endYear?: number;
  startDateTime?: string;
  endDateTime?: string;
};

export type DaewoonCycle = LuckPillar & {
  index: number;
  age: number;
  startYear: number;
  endYear: number;
  startDateTime: string;
  endDateTime: string;
};

export type CanonicalDaewoonResult = {
  direction: DaewoonDirection;
  start: DaewoonStart;
  cycles: DaewoonCycle[];
  current: DaewoonCycle | null;
  solarTermEngine: NonNullable<DaewoonStart["solarTermEngine"]> | null;
};

export type Luck = {
  daewoonStart: DaewoonStart;
  direction: DaewoonDirection;
  daewoonList: DaewoonCycle[];
  currentDaewoon: DaewoonCycle | null;
  canonicalDaewoon: CanonicalDaewoonResult;
  currentSewoon: LuckPillar;
  currentWolwoon: LuckPillar;
  currentIljin: LuckPillar;
  currentTimePillar: LuckPillar | null;
};

export type DaeunSummary = CanonicalDaewoonResult;

export type CurrentLuckSummary = {
  daeun: SajuPillar | null;
  year: SajuPillar;
  month: SajuPillar;
  day: SajuPillar;
  hour: SajuPillar | null;
};

export type AnalysisInput = {
  confirmedPillars: NatalChart["pillars"];
  confidence: {
    overall: "high" | "medium" | "low";
    hourPillar: "high" | "low";
    reason: string | null;
  };
  structureOnlyData: {
    fiveElementsDistribution: Record<ElementName, number>;
    tenGods: Record<string, string | null>;
    hiddenStems: NatalChart["hiddenStems"];
    twelveStages: NatalChart["twelveStages"];
    luck: Pick<
      Luck,
      | "direction"
      | "currentSewoon"
      | "currentWolwoon"
      | "currentIljin"
      | "currentTimePillar"
    > & {
      daeun: CanonicalDaewoonResult;
    };
  };
};

export type DisplayResult = {
  saju: SajuOutput;
  daeun: DaeunSummary;
  currentLuck: CurrentLuckSummary;
  warnings: Warning[];
};

export type ManseResult = {
  input: Required<ManseInput>;
  timeCorrection: TimeCorrection;
  calendarConversion: CalendarConversion;
  saju: SajuOutput;
  natalChart: NatalChart;
  tenGods: NatalChart["tenGods"];
  twelveStages: NatalChart["twelveStages"];
  daeun: DaeunSummary;
  currentLuck: CurrentLuckSummary;
  luck: Luck;
  warnings: Warning[];
  display: DisplayResult;
  blueprintInput: AnalysisInput;
  analysisInput: AnalysisInput;
  debug: {
    engine: "@fullstackfamily/manseryeok";
    solarTermEngine: NonNullable<DaewoonStart["solarTermEngine"]> | null;
    lunarConversion: CalendarConversion;
    timeCorrection: TimeCorrection;
    warnings: Warning[];
  };
};
