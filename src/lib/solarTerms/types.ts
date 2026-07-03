export type SolarTermPrecision =
  | "astronomy-engine"
  | "astronomical"
  | "manseryeok"
  | "approximate";

export type SolarTermName =
  | "춘분"
  | "청명"
  | "곡우"
  | "입하"
  | "소만"
  | "망종"
  | "하지"
  | "소서"
  | "대서"
  | "입추"
  | "처서"
  | "백로"
  | "추분"
  | "한로"
  | "상강"
  | "입동"
  | "소설"
  | "대설"
  | "동지"
  | "소한"
  | "대한"
  | "입춘"
  | "우수"
  | "경칩";

export type SolarTerm = {
  name: SolarTermName;
  nameHanja: string;
  longitude: number;
  utcDateTime: string;
  localDateTime: string;
};

export type SolarTermResult = {
  year: number;
  timezone: string;
  precision: SolarTermPrecision;
  source: string;
  terms: SolarTerm[];
};

export type SolarTermProvider = {
  getTermsByYear(year: number, timezone: string): SolarTermResult;
};

export type SolarTermDefinition = {
  name: SolarTermName;
  nameHanja: string;
  longitude: number;
  approximateMonth: number;
  approximateDay: number;
};
