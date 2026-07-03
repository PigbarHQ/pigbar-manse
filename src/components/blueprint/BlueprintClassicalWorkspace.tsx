"use client";

import { FormEvent, useState } from "react";
import { CITY_OPTIONS, DEFAULT_CURRENT_DATE_TIME } from "@/src/lib/manse/constants";
import type { BirthPlace, CalendarType, Gender, ManseInput } from "@/src/lib/manse";
import type { BlueprintBook } from "@/src/lib/blueprint/types";
import type { BlueprintAppendix } from "@/src/lib/blueprint/types/runtime";
import { BlueprintReader } from "./BlueprintReader";

type BlueprintDebugData = {
  canonicalManseInput: unknown;
  classicalAnalysis?: unknown;
  features: unknown;
  reasons: unknown;
  writerInput: unknown;
  writerRuntime?: unknown;
  appendix?: unknown;
};

type BlueprintPublicationState = {
  manseInput: ManseInput;
  book: BlueprintBook;
  appendix: BlueprintAppendix;
  debugData: BlueprintDebugData;
};

const fieldClassName =
  "mt-1 h-10 w-full rounded-[2px] border border-[#d8cdbb] bg-[#fffdf8] px-3 text-sm text-[#2f2922] outline-none transition placeholder:text-[#b5a996] focus:border-[#8a6b2e] focus:ring-2 focus:ring-[#f7df9c]/50";

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

function cityNameFromInput(input: ManseInput) {
  return CITY_OPTIONS.some((city) => city.name === input.birthPlace.name)
    ? input.birthPlace.name
    : CITY_OPTIONS[0].name;
}

export function BlueprintClassicalWorkspace({ initial }: { initial: BlueprintPublicationState }) {
  const [publication, setPublication] = useState(initial);
  const [name, setName] = useState(initial.manseInput.name ?? "주영지");
  const [gender, setGender] = useState<Gender>(initial.manseInput.gender);
  const [birthDate, setBirthDate] = useState(initial.manseInput.birthDate);
  const [calendarType, setCalendarType] = useState<CalendarType>(initial.manseInput.calendarType);
  const [isLeapMonth, setIsLeapMonth] = useState(initial.manseInput.isLeapMonth);
  const [birthTime, setBirthTime] = useState(initial.manseInput.birthTime ?? "03:50");
  const [timeUnknown, setTimeUnknown] = useState(Boolean(initial.manseInput.unknownTime));
  const [cityName, setCityName] = useState(cityNameFromInput(initial.manseInput));
  const [useLocalMeanTime, setUseLocalMeanTime] = useState(Boolean(initial.manseInput.useLocalMeanTime));
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPublishing(true);
    setError(null);

    const payload: ManseInput = {
      name,
      gender,
      birthDate,
      calendarType,
      isLeapMonth,
      birthTime: timeUnknown ? null : birthTime,
      unknownTime: timeUnknown,
      birthPlace: getBirthPlace(cityName),
      useLocalMeanTime,
      currentDateTime: DEFAULT_CURRENT_DATE_TIME,
      ziHourRule: "midnight",
      daewoonDirectionRule: "standard",
    };

    try {
      const response = await fetch("/api/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "책을 다시 출판하지 못했습니다.");
        return;
      }

      setPublication(data as BlueprintPublicationState);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "책을 다시 출판하지 못했습니다.");
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <BlueprintReader
      appendix={publication.appendix}
      book={publication.book}
      debugData={publication.debugData}
      republishPanel={
        <RepublishForm
          birthDate={birthDate}
          birthTime={birthTime}
          calendarType={calendarType}
          cityName={cityName}
          error={error}
          gender={gender}
          isLeapMonth={isLeapMonth}
          isPublishing={isPublishing}
          name={name}
          onBirthDateChange={setBirthDate}
          onBirthTimeChange={setBirthTime}
          onCalendarTypeChange={setCalendarType}
          onCityNameChange={setCityName}
          onGenderChange={setGender}
          onIsLeapMonthChange={setIsLeapMonth}
          onNameChange={setName}
          onSubmit={handleSubmit}
          onTimeUnknownChange={setTimeUnknown}
          onUseLocalMeanTimeChange={setUseLocalMeanTime}
          timeUnknown={timeUnknown}
          useLocalMeanTime={useLocalMeanTime}
        />
      }
    />
  );
}

function RepublishForm({
  birthDate,
  birthTime,
  calendarType,
  cityName,
  error,
  gender,
  isLeapMonth,
  isPublishing,
  name,
  onBirthDateChange,
  onBirthTimeChange,
  onCalendarTypeChange,
  onCityNameChange,
  onGenderChange,
  onIsLeapMonthChange,
  onNameChange,
  onSubmit,
  onTimeUnknownChange,
  onUseLocalMeanTimeChange,
  timeUnknown,
  useLocalMeanTime,
}: {
  birthDate: string;
  birthTime: string;
  calendarType: CalendarType;
  cityName: string;
  error: string | null;
  gender: Gender;
  isLeapMonth: boolean;
  isPublishing: boolean;
  name: string;
  onBirthDateChange: (value: string) => void;
  onBirthTimeChange: (value: string) => void;
  onCalendarTypeChange: (value: CalendarType) => void;
  onCityNameChange: (value: string) => void;
  onGenderChange: (value: Gender) => void;
  onIsLeapMonthChange: (value: boolean) => void;
  onNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTimeUnknownChange: (value: boolean) => void;
  onUseLocalMeanTimeChange: (value: boolean) => void;
  timeUnknown: boolean;
  useLocalMeanTime: boolean;
}) {
  return (
    <details className="rounded-[2px] border border-[#d8cdbb] bg-[#fffdf8] p-3">
      <summary className="cursor-pointer text-sm font-black text-[#2f2922]">책 다시 출판하기</summary>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <label className="block text-xs font-black text-[#6f6253]">
          이름
          <input className={fieldClassName} onChange={(event) => onNameChange(event.target.value)} value={name} />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <button
            className={`h-10 rounded-[2px] border text-xs font-black ${
              gender === "male" ? "border-[#8a6b2e] bg-[#f7df9c]/70 text-[#2f2922]" : "border-[#d8cdbb] text-[#6f6253]"
            }`}
            onClick={() => onGenderChange("male")}
            type="button"
          >
            남성
          </button>
          <button
            className={`h-10 rounded-[2px] border text-xs font-black ${
              gender === "female" ? "border-[#8a6b2e] bg-[#f7df9c]/70 text-[#2f2922]" : "border-[#d8cdbb] text-[#6f6253]"
            }`}
            onClick={() => onGenderChange("female")}
            type="button"
          >
            여성
          </button>
        </div>

        <label className="block text-xs font-black text-[#6f6253]">
          생년월일
          <input
            className={fieldClassName}
            onChange={(event) => onBirthDateChange(event.target.value)}
            type="date"
            value={birthDate}
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-black text-[#6f6253]">
            양력/음력
            <select
              className={fieldClassName}
              onChange={(event) => onCalendarTypeChange(event.target.value as CalendarType)}
              value={calendarType}
            >
              <option value="solar">양력</option>
              <option value="lunar">음력</option>
            </select>
          </label>
          <label className="mt-5 flex h-10 items-center gap-2 rounded-[2px] border border-[#d8cdbb] bg-[#fffdf8] px-3 text-xs font-black text-[#6f6253]">
            <input checked={isLeapMonth} onChange={(event) => onIsLeapMonthChange(event.target.checked)} type="checkbox" />
            윤달
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-black text-[#6f6253]">
            출생시간
            <input
              className={fieldClassName}
              disabled={timeUnknown}
              onChange={(event) => onBirthTimeChange(event.target.value)}
              type="time"
              value={birthTime}
            />
          </label>
          <label className="mt-5 flex h-10 items-center gap-2 rounded-[2px] border border-[#d8cdbb] bg-[#fffdf8] px-3 text-xs font-black text-[#6f6253]">
            <input checked={timeUnknown} onChange={(event) => onTimeUnknownChange(event.target.checked)} type="checkbox" />
            시간 모름
          </label>
        </div>

        <label className="block text-xs font-black text-[#6f6253]">
          출생지
          <select className={fieldClassName} onChange={(event) => onCityNameChange(event.target.value)} value={cityName}>
            {CITY_OPTIONS.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 rounded-[2px] border border-[#d8cdbb] bg-[#fffdf8] px-3 py-2 text-xs font-black text-[#6f6253]">
          <input checked={useLocalMeanTime} onChange={(event) => onUseLocalMeanTimeChange(event.target.checked)} type="checkbox" />
          지역시 보정 사용
        </label>

        <button
          className="h-11 w-full rounded-[2px] bg-[#2f2922] text-sm font-black text-[#fff8ec] disabled:opacity-50"
          disabled={isPublishing}
          type="submit"
        >
          {isPublishing ? "다시 출판 중" : "이 명조로 책 다시 출판하기"}
        </button>
        {error ? <p className="text-xs font-bold leading-5 text-red-700">{error}</p> : null}
      </form>
    </details>
  );
}
