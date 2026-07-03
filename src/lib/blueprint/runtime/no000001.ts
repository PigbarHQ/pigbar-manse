import { calculateManse, CITY_OPTIONS, type ManseInput } from "@/src/lib/manse";
import { buildBlueprintCore } from "../core";

export const blueprintNo000001RuntimeInput: ManseInput = {
  name: "주영지",
  birthDate: "1974-07-30",
  calendarType: "solar",
  isLeapMonth: false,
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
};

export function buildBlueprintNo000001Runtime() {
  const manse = calculateManse(blueprintNo000001RuntimeInput);

  return buildBlueprintCore(manse, {
    blueprintId: "bp-000001",
    blueprintNo: "No.000001",
    authorName: "주영지",
    edition: "초판",
  });
}
