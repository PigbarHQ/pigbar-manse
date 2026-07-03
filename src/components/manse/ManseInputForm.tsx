"use client";

import { FormEvent, useState } from "react";
import { CITY_OPTIONS, DEFAULT_CURRENT_DATE_TIME } from "@/src/lib/manse/constants";
import type { BirthPlace, CalendarType, Gender, ManseInput, ManseResult } from "@/src/lib/manse";
import { LuckTimeline } from "./LuckTimeline";
import { NatalChartTable } from "./NatalChartTable";
import { TimeCorrectionPanel } from "./TimeCorrectionPanel";
import { WarningPanel } from "./WarningPanel";

const fieldClassName =
  "h-11 w-full rounded-lg border border-stone-300 bg-white px-4 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-stone-700 focus:ring-4 focus:ring-stone-900/10";

function getBirthPlace(name: string): BirthPlace {
  const city = CITY_OPTIONS.find((option) => option.name === name) ?? CITY_OPTIONS[0];
  return {
    name: city.name,
    label: city.name,
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: "Asia/Seoul",
  };
}

export function ManseInputForm() {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("1974-07-30");
  const [calendarType, setCalendarType] = useState<CalendarType>("solar");
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [birthTime, setBirthTime] = useState("03:50");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [gender, setGender] = useState<Gender>("male");
  const [cityName, setCityName] = useState<string>(CITY_OPTIONS[0].name);
  const [currentDateTime, setCurrentDateTime] = useState(DEFAULT_CURRENT_DATE_TIME);
  const [result, setResult] = useState<ManseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const payload: ManseInput = {
      name,
      birthDate,
      calendarType,
      isLeapMonth,
      birthTime: timeUnknown ? null : birthTime,
      unknownTime: timeUnknown,
      gender,
      birthPlace: getBirthPlace(cityName),
      useLocalMeanTime: true,
      currentDateTime,
      ziHourRule: "midnight",
      daewoonDirectionRule: "standard",
    };
    const response = await fetch("/api/manse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    setIsLoading(false);
    if (!response.ok) {
      setError(data.error ?? "계산 중 오류가 발생했습니다.");
      setResult(null);
      return;
    }

    setResult(data as ManseResult);
    setShowDebug(false);
  }

  return (
    <main className="min-h-screen bg-[#fbfaf8] px-5 py-8 text-stone-700">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[420px_1fr]">
        <form className="space-y-5 rounded-xl border border-stone-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
          <div>
            <h1 className="text-2xl font-black text-stone-800">Pigbar Manse</h1>
            <p className="mt-2 text-sm text-stone-500">
              계산 엔진과 해석 입력 JSON을 분리해 생성합니다.
            </p>
          </div>

          <label className="block text-sm font-bold">
            이름
            <input className={fieldClassName} onChange={(event) => setName(event.target.value)} value={name} />
          </label>

          <label className="block text-sm font-bold">
            생년월일
            <input className={fieldClassName} onChange={(event) => setBirthDate(event.target.value)} type="date" value={birthDate} />
          </label>

          <div className="grid grid-cols-2 items-end gap-3">
            <label className="block text-sm font-bold">
              양력/음력
              <select className={fieldClassName} onChange={(event) => setCalendarType(event.target.value as CalendarType)} value={calendarType}>
                <option value="solar">양력</option>
                <option value="lunar">음력</option>
              </select>
            </label>
            <label className="flex h-11 items-center gap-2 rounded-lg border border-stone-300 px-3 text-sm font-bold">
              <input checked={isLeapMonth} onChange={(event) => setIsLeapMonth(event.target.checked)} type="checkbox" />
              윤달
            </label>
          </div>

          <div className="grid grid-cols-2 items-end gap-3">
            <label className="block text-sm font-bold">
              태어난 시간
              <input
                className={fieldClassName}
                disabled={timeUnknown}
                onChange={(event) => setBirthTime(event.target.value)}
                value={birthTime}
              />
            </label>
            <label className="flex h-11 items-center gap-2 rounded-lg border border-stone-300 px-3 text-sm font-bold">
              <input checked={timeUnknown} onChange={(event) => setTimeUnknown(event.target.checked)} type="checkbox" />
              시간 모름
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              className={`h-11 rounded-lg border text-sm font-black ${gender === "female" ? "border-rose-400 bg-rose-50 text-rose-700" : "border-stone-300"}`}
              onClick={() => setGender("female")}
              type="button"
            >
              여자
            </button>
            <button
              className={`h-11 rounded-lg border text-sm font-black ${gender === "male" ? "border-sky-500 bg-sky-50 text-sky-800" : "border-stone-300"}`}
              onClick={() => setGender("male")}
              type="button"
            >
              남자
            </button>
          </div>

          <label className="block text-sm font-bold">
            출생지
            <select className={fieldClassName} onChange={(event) => setCityName(event.target.value)} value={cityName}>
              {CITY_OPTIONS.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-xs font-semibold leading-relaxed text-stone-600">
            지역시 보정은 출생지 경도 기준으로 자동 적용됩니다.
          </div>

          <label className="block text-sm font-bold">
            현재 기준 시각
            <input className={fieldClassName} onChange={(event) => setCurrentDateTime(event.target.value)} value={currentDateTime} />
          </label>

          <button className="h-12 w-full rounded-full bg-[#ffd36a] font-black text-stone-800" disabled={isLoading} type="submit">
            {isLoading ? "계산 중..." : "만세력 계산"}
          </button>
          {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
        </form>

        <section className="space-y-4">
          {result ? (
            <>
              <TimeCorrectionPanel result={result} />
              <NatalChartTable result={result} />
              <LuckTimeline result={result} />
              <WarningPanel warnings={result.warnings} />
              <section className="rounded-lg border border-stone-200 bg-white p-4">
                <button
                  className="h-10 rounded-lg border border-stone-300 px-4 text-sm font-black text-stone-700"
                  onClick={() => setShowDebug((value) => !value)}
                  type="button"
                >
                  {showDebug ? "Debug JSON 닫기" : "Debug JSON 보기"}
                </button>
                {showDebug ? (
                  <pre className="mt-3 max-h-[420px] overflow-auto rounded-lg bg-stone-950 p-4 text-xs text-stone-100">
                    {JSON.stringify(
                      {
                        input: result.input,
                        timeCorrection: result.timeCorrection,
                        saju: result.saju,
                        tenGods: result.tenGods,
                        twelveStages: result.twelveStages,
                        daeun: result.daeun,
                        currentLuck: result.currentLuck,
                        blueprintInput: result.blueprintInput,
                        debug: result.debug,
                      },
                      null,
                      2,
                    )}
                  </pre>
                ) : null}
              </section>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
              입력값을 계산하면 지역시 보정, 사주팔자, 현재 운 흐름이 표시됩니다.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
