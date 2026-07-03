# Pigbar Manse 대운 시작 기산법 검증

작성일: 2026-07-03

## 1. 목적

이 문서는 코드를 변경하지 않고 Pigbar Manse 내부에 공존하는 대운 시작 나이 환산 방식을 분리해 검토한다.

확정 입력:

```text
출생 보정시각: 1974-07-30T03:17:54.720+09:00
순행 다음 절기: 입추, 1974-08-08T06:57:01.896+09:00
절기 차이: 9.152166일, 약 9일 3시간 39분
```

현재 두 결과가 공존한다.

| 구분 | 결과 | 첫 대운 시작 |
|---|---:|---:|
| 검증 문서 traditionalConversion | 3년 0개월 18일 | 1977-08-17 |
| production 기존 산식 | 3년 1개월 9일 | 1977-09-08 |

## 2. 현재 코드 산식 조사

| 파일 | 함수/위치 | 계산식 | 반올림 위치 | 9.152166일 결과 |
|---|---|---|---|---|
| `src/lib/manse/daewoon.ts` | `getNearestTermDiffDays` | `diffDays = abs(target.dateTime.diff(birth, "days").days)` | 없음 | `9.152166` |
| `src/lib/manse/daewoon.ts` | `calculateDaewoonStart` | `totalMonths = Math.round(diffDays * 4)` | 월수 총량에서 반올림 | `Math.round(36.608664) = 37개월` |
| `src/lib/manse/daewoon.ts` | `calculateDaewoonStart` | `years = floor(totalMonths / 12)` | 정수 나눗셈 | `3년` |
| `src/lib/manse/daewoon.ts` | `calculateDaewoonStart` | `months = totalMonths % 12` | 정수 나머지 | `1개월` |
| `src/lib/manse/daewoon.ts` | `calculateDaewoonStart` | `age = years + (months > 0 ? 1 : 0)` | 월이 있으면 올림 표시 | `4` |
| `src/lib/manse/daewoon.ts` | `calculateDaewoonStart` | `days = Math.round(diffDays)` | 원 절기 차이 일수 반올림 | `9일` |
| `src/lib/manse/daewoon.ts` | `buildCanonicalDaewoonResult` | `birth.plus({ years, months, days })` | 위 산식 결과를 그대로 더함 | `1977-09-08T03:17:54.720+09:00` |
| `src/lib/solarTerms/validation.ts` | `convertTermDifference` | `convertedTotalDays = totalDays * 120` | 최종 잔여 일수에서 반올림 | `1098.26 환산일` |
| `src/lib/solarTerms/validation.ts` | `convertTermDifference` | `years = floor(convertedTotalDays / 360)` | 360일=1년 | `3년` |
| `src/lib/solarTerms/validation.ts` | `convertTermDifference` | `months = floor(remaining / 30)` | 30일=1개월 | `0개월` |
| `src/lib/solarTerms/validation.ts` | `convertTermDifference` | `days = round(remaining)` | 잔여 환산일 반올림 | `18일` |
| `src/lib/solarTerms/validation.ts` | `convertTermDifference` | `birth.plus({ years, months, days })` | 위 산식 결과를 그대로 더함 | `1977-08-17T03:17:54.720+09:00` |
| `docs/manse-solar-term-engine.md` | 문서 산출값 | `traditionalConversion` 구조 | validation 산식 결과 기록 | `3년 0개월 18일` |

## 3. 두 결과가 갈라지는 정확한 원인

두 산식 모두 `3일 = 1년`, 즉 `1일 = 4개월`이라는 큰 규칙에서 출발한다. 차이는 시간 이하를 어디서 반올림하느냐에 있다.

### production 산식

production은 전체 절기 차이를 먼저 월수로 만든다.

```ts
totalMonths = Math.round(diffDays * 4);
years = Math.floor(totalMonths / 12);
months = totalMonths % 12;
days = Math.round(diffDays);
firstStart = birth.plus({ years, months, days });
```

9.152166일이면:

```text
9.152166 * 4 = 36.608664개월
round = 37개월
37개월 = 3년 1개월
days = round(9.152166) = 9일
결과 = 3년 1개월 9일
```

여기서 `days`는 3년 1개월 뒤에 남은 잔여 일이 아니다. 원래 절기 차이 일수를 반올림한 별도 정보다. 따라서 production의 `3년 1개월 9일`은 수학적으로 완전히 분해된 기간이 아니라, `3년 1개월`과 `절기 차이 약 9일`이 섞인 구조다.

### 검증 산식

검증 산식은 절기 차이를 환산일 전체로 바꾼 뒤 년/월/일로 분해한다.

```ts
convertedTotalDays = totalDays * 120;
years = floor(convertedTotalDays / 360);
months = floor((convertedTotalDays - years * 360) / 30);
days = round(remainder);
firstStart = birth.plus({ years, months, days });
```

9.152166일이면:

```text
9.152166 * 120 = 1098.25992 환산일
1098.25992일 = 3년 0개월 18일
결과 = 3년 0개월 18일
```

이 방식에서는 `days`가 잔여 환산일이다.

## 4. 9.152166일 방식별 직접 계산

| 방식 | 계산 기준 | 년 | 월 | 일 | 표시 대운수 | 첫 대운 시작 |
|---|---|---:|---:|---:|---:|---:|
| A. production `diffDays × 4개월` | 총 월수 반올림 + 원 diffDays 반올림 | 3 | 1 | 9 | 4 | 1977-09-08T03:17:54.720+09:00 |
| B. 전통 단계 환산 | 9일=3년, 3시간39분 x 5일=18일 | 3 | 0 | 18 | 4 | 1977-08-17T03:17:54.720+09:00 |
| C. 총시간 비례 환산 | totalDays x 120 환산일 | 3 | 0 | 18 | 4 | 1977-08-17T03:17:54.720+09:00 |

세 방식 모두 표시 대운수는 `4`로 볼 수 있다. 그러나 실제 교운일은 A와 B/C가 약 22일 차이난다.

## 5. 전통 환산 규칙 조사

현재 코드 주석과 기존 문서가 사용하는 기준:

```text
3일 = 1년
1일 = 4개월
1시간 = 5일
2시간 = 10일
```

이 규칙은 `3일 = 1년`을 360일 기준으로 쪼개면 자연스럽게 도출된다.

```text
3일 = 360 환산일
1일 = 120 환산일 = 4개월
1시간 = 120 / 24 = 5 환산일
2시간 = 10 환산일
```

다만 웹 검색 기준으로는 `1시간 = 5일`, `2시간 = 10일`을 신뢰 가능한 공식 원문으로 확인하지 못했다. 따라서 현재 단계에서는 이것을 “검증 완료된 외부 원전”이 아니라 “한국/동아시아 만세력 구현에서 흔히 쓰는 환산 후보”로 취급한다.

확인해야 할 변형:

| 후보 | 설명 | 9일 3시간39분 결과 |
|---|---|---:|
| 연속 시간 환산 | 분까지 비례 계산 | 3년 0개월 18일 |
| 시간 절사 | 3시간만 사용 | 3년 0개월 15일 |
| 시진 절사 | 2시간 단위 1시진만 사용 | 3년 0개월 10일 |
| 시진 반올림 | 3시간39분을 2시진으로 반올림 | 3년 0개월 20일 |
| 일수만 사용 | 시간 버림 | 3년 0개월 0일 |
| 총 월수 반올림 | production 현재 방식 | 3년 1개월 9일 |

결론: “3일=1년”은 공통 규칙으로 볼 수 있지만, 시간/분을 잔여 일로 환산할지, 시진 단위로 처리할지, 총 월수에서 반올림할지는 구현별 차이가 생길 수 있다.

## 6. 대운수와 교운일 분리

다음 세 개념은 분리해야 한다.

### A. 표시 대운수

UI나 외부 만세력에서 보이는 `대운수 3`, `대운수 4` 같은 숫자다. 보통 사용자가 빠르게 이해하도록 반올림/올림/한국식 나이 표현이 섞일 수 있다.

### B. 환산된 시작 나이

예:

```text
3년 0개월 18일
3년 1개월 9일
```

절기 차이를 대운 시작 나이로 환산한 결과다. 이 값은 산식 정의에 민감하다.

### C. 실제 첫 대운 시작 datetime

환산된 시작 나이를 출생 datetime에 더한 실제 시각이다.

예:

```text
1977-08-17T03:17:54.720+09:00
1977-09-08T03:17:54.720+09:00
```

실제 현재 대운 판정은 이 datetime을 기준으로 해야 한다.

## 7. 외부 만세력 비교 fixture 구조

아직 추정값은 넣지 않는다. 외부 서비스 화면을 직접 확인한 뒤 수동으로 기록한다.

```ts
type ExternalDaewoonComparisonFixture = {
  service: string;
  displayedDaewoonAge: number | null;
  firstDaewoonGanji: string | null;
  firstDaewoonStartYear: number | null;
  firstDaewoonStartDate: string | null;
  calculationNote: string;
  screenshotReference: string | null;
};

const fixtures: ExternalDaewoonComparisonFixture[] = [
  {
    service: "",
    displayedDaewoonAge: null,
    firstDaewoonGanji: null,
    firstDaewoonStartYear: null,
    firstDaewoonStartDate: null,
    calculationNote: "",
    screenshotReference: null,
  },
];
```

## 8. 채택 후보안

### 후보 A: production 산식 유지

```text
totalMonths = round(diffDays * 4)
days = round(diffDays)
```

장점:

- 현재 production과 호환된다.
- 표시 대운수 계산이 단순하다.

단점:

- `days`가 잔여 일이 아니라 원 절기 차이 일수다.
- `3년 1개월 9일`처럼 기간 표현이 수학적으로 어색하다.
- 실제 교운일이 전통 잔여일 환산보다 뒤로 밀릴 수 있다.

### 후보 B: 전통 단계 환산

```text
3일 = 1년
1일 = 4개월
1시간 = 5일
분은 비례 환산 또는 절사/반올림 정책 결정
```

장점:

- 전통 설명과 직관적으로 맞다.
- `년/월/일`이 잔여값으로 분해된다.

단점:

- 시간/분 처리에서 학파별 차이가 생길 수 있다.
- 외부 만세력과 비교해 반올림 정책을 정해야 한다.

### 후보 C: 총시간 연속 비례 환산

```text
convertedTotalDays = totalDays * 120
360일 = 1년
30일 = 1개월
잔여 = 일
```

장점:

- 수학적으로 가장 일관적이다.
- 분 단위 절기 시각을 자연스럽게 반영한다.
- 코드 구현과 테스트가 명확하다.

단점:

- 전통 시진 단위 반올림을 쓰는 만세력과 날짜가 달라질 수 있다.
- 외부 서비스 표기와 다를 때 설명이 필요하다.

## 9. 추천안

현재 추천은 후보 C를 canonical 내부 계산 방식으로 검토하는 것이다.

이유:

- KASI/Astronomy Engine으로 분 단위 절기 시각을 확보했으므로, 시간 정보를 버리거나 월수에서 먼저 반올림하는 것은 정밀도 취지와 맞지 않는다.
- `년/월/일`이 실제 잔여 기간으로 분해되어 JSON 의미가 명확하다.
- 후보 B의 연속 환산형과 결과가 일치한다.

다만 production 변경 전에는 외부 만세력 비교 fixture가 필요하다.

채택 전 확인할 것:

1. 한국 주요 만세력 3개 이상에서 1974-07-30 03:50 서울 남성의 대운수와 첫 교운일 수동 비교
2. 시간/시진 반올림 기준 확인
3. 표시 대운수 `3` 또는 `4`의 UI 정책 결정
4. 실제 현재 대운 판정이 어떤 교운일 기준이어야 하는지 확정

## 10. 아직 확정되지 않은 항목

- `1시간 = 5일`을 분 단위까지 연속 적용할지 여부
- `2시간 = 10일`을 시진 단위로 절사/반올림할지 여부
- 표시 대운수를 만 나이형, 한국식 세수형, 단순 올림형 중 무엇으로 할지
- 외부 만세력의 `대운수 3(신미)` 같은 표기가 정확히 교운일을 의미하는지, 또는 기준 월주와 표시 나이를 묶은 것인지
- production의 `ageDays` 필드를 폐기/분리/deprecated 처리할지 여부

## 11. 결론

두 결과가 발생한 원인은 절기 시각 문제가 아니라 대운 시작 나이 환산식의 차이다.

```text
production: diffDays를 총 월수로 먼저 반올림하고, days에는 원 diffDays 반올림값을 넣는다.
validation: diffDays를 환산일 전체로 바꾼 뒤 년/월/잔여일로 분해한다.
```

현재 production 산식은 호환성 때문에 유지되어 있지만, 의미론적으로는 `ageDays`가 잔여 일이 아니라는 문제가 있다. 정밀 절기 provider를 채택한 이후에는 후보 C, 즉 총시간 연속 비례 환산을 canonical 후보로 두고 외부 만세력 fixture로 검증하는 것이 가장 안전하다.
