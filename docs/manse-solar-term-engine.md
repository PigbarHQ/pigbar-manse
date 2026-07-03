# Pigbar Manse 정밀 24절기 엔진 조사 및 검증

작성일: 2026-07-03

## 1. 목적

Pigbar Manse의 대운 시작 계산은 다음/이전 절기 시각에 의존한다. 현재 `@fullstackfamily/manseryeok`의 정밀 절기 시각 지원 범위는 2020-2030이고, 과거 연도는 Pigbar Manse 내부의 월별 근사 절입일 `00:00` fallback을 사용한다.

이번 작업의 목적은 1900-2100 범위에서 24절기 시각을 계산할 수 있는 천문 기반 provider를 만들고, 기존 `@fullstackfamily/manseryeok` 절기 데이터와 교차검증하는 것이다. 검증 전에는 production 대운 계산에 연결하지 않는다.

2026-07-03 추가 검증 방향: 현재 자체 Meeus provider와 `@fullstackfamily/manseryeok` 사이에 6-13시간 차이가 있으므로, 이 결과를 자체 provider 실패로 단정하지 않는다. canonical 기준 확정 전에는 KASI fixture, Astronomy Engine, 자체 Meeus provider, `@fullstackfamily/manseryeok`를 4자 교차검증한다.

## 2. 현재 절기 관련 코드 조사

### 2.1 `@fullstackfamily/manseryeok getSolarTermsByYear` 사용 위치

현재 직접 사용 위치는 한 곳이다.

- `src/lib/manse/daewoon.ts`
  - `getTermDateTimes(year, warnings)`에서 `getSolarTermsByYear(year)` 호출
  - `term.type === "jeolgi"`만 필터링해 대운 시작 계산용 절입으로 사용

### 2.2 근사 절입일 fallback 위치

- `src/lib/manse/daewoon.ts`
  - `getApproximateSolarTerms(year)`
  - 고정 월일: `1/6, 2/4, 3/6, 4/5, 5/6, 6/6, 7/7, 8/8, 9/8, 10/8, 11/7, 12/7`
  - 시간: `00:00 Asia/Seoul`

`getSolarTermsByYear(year)`가 실패하거나 빈 배열이면 fallback으로 전환하고 `APPROXIMATE_SOLAR_TERMS_USED` warning을 추가한다.

### 2.3 월주 계산의 절기 기준

월주 계산은 Pigbar Manse 내부에서 직접 절기 provider를 쓰지 않는다. 원국 계산은 `src/lib/manse/pillarCalculator.ts`에서 `@fullstackfamily/manseryeok`의 `calculateSaju` 또는 `calculateSajuSimple`에 위임한다.

`@fullstackfamily/manseryeok` README는 월주를 절기 기준으로 계산한다고 설명한다. 따라서 현재 월주 기준은 `manseryeok` 내부 구현에 의존한다.

### 2.4 대운 시작 계산의 절기 기준

대운 시작은 `src/lib/manse/daewoon.ts`에서 직접 계산한다.

- 순행: 출생 이후의 다음 절기
- 역행: 출생 이전의 이전 절기
- 절기 차이 일수 `diffDays`
- 환산: `totalMonths = Math.round(diffDays * 4)`

현재 정밀 절기 데이터가 없는 연도는 fallback이므로 `source: "approximate-solar-term"`이다.

### 2.5 currentLuck 월운 계산의 절기 기준

`src/lib/manse/currentLuck.ts`의 현재 세운/월운/일진/시주는 `calculateSaju(current.year, current.month, current.day, current.hour, current.minute)` 결과에서 가져온다. 따라서 currentLuck 월운의 절기 기준 역시 `@fullstackfamily/manseryeok` 내부 월주 계산 기준에 의존한다.

## 3. 천문 계산 후보 비교

### 후보 A: Astronomy Engine

- 패키지/프로젝트: `astronomy-engine`, Cosine Kitty Astronomy
- 참고: https://github.com/cosinekitty/astronomy
- 특징: JavaScript/TypeScript 환경에서 태양, 달, 행성 위치 계산을 제공한다.
- 장점:
  - MIT License
  - Node.js에서 사용 가능
  - 태양 위치 계산과 시간 탐색 기능이 풍부하다.
  - 외부 API 의존이 없다.
  - 프로젝트 README 기준 VSOP87/NOVAS 검증과 1 arcminute 수준 정확도를 목표로 한다.
- 단점:
  - 새 의존성 도입 필요

설치 확인:

```text
package.json: astronomy-engine 2.1.19
package-lock.json: node_modules/astronomy-engine 2.1.19
node_modules/astronomy-engine/package.json: version 2.1.19, license MIT
```

사용 API:

```text
SearchSunLongitude(targetLon, dateStart, limitDays)
```

공식 문서 기준 이 함수는 지구 중심에서 본 태양 중심이 지정한 apparent ecliptic longitude에 도달하는 시각을 탐색한다. 24절기 정의와 직접 대응하므로 이번 검증의 reference provider로 사용한다.

라이선스 확인: 패키지와 공식 GitHub 저장소는 MIT license로 표시된다. README는 JavaScript 지원, VSOP87/NOVAS 기반 검증, 약 1 arcminute 수준 정확도 목표를 설명한다.

### 후보 B: astronomia

- 패키지: `astronomia`
- 특징: Meeus의 천문 알고리즘을 JS 모듈로 제공하는 계열의 라이브러리
- 장점:
  - 태양 황경 계산을 직접 구성하기 좋다.
  - 외부 API 의존이 없다.
- 단점:
  - API 조합과 보정항 선택을 서비스 쪽에서 책임져야 한다.
  - 라이선스/유지보수 상태를 도입 시점에 재확인해야 한다.

### 후보 C: 직접 구현, Meeus 저차 태양 겉보기 황경 수식

- 이번 작업에서 선택한 방식
- 구현 파일: `src/lib/solarTerms/astronomical.ts`
- 기준:
  - UTC 시각을 Julian Day로 변환
  - 태양 평균 황경, 평균 근점 이각, 중심차, nutation 보정항 일부를 사용
  - apparent solar longitude가 목표 황경에 도달하는 순간을 bisection으로 탐색
- 장점:
  - 새 의존성 없음
  - 외부 API 없음
  - 1900-2100 범위 계산 가능
  - provider 검증 구조를 빠르게 만들 수 있음
- 단점:
  - 저차 수식이라 고정밀 천문력과 분 단위로 일치한다는 보장이 없다.
  - delta T, 고차 섭동항, time scale 보정이 제한적이다.

### 선택 이유

이번 단계는 production 연결이 아니라 검증 기반 구축이다. 따라서 새 의존성 없이 독립 provider와 검증 harness를 먼저 만들기 위해 후보 C를 선택했다. 다만 검증 결과가 기준을 초과했으므로 이 provider를 production에 연결하지 않는다.

## 4. 24절기 계산 기준

각 절기는 태양의 겉보기 황경이 15도 단위 경계를 통과하는 순간으로 정의한다.

| 절기 | 황경 |
|---|---:|
| 춘분 | 0 |
| 청명 | 15 |
| 곡우 | 30 |
| 입하 | 45 |
| 소만 | 60 |
| 망종 | 75 |
| 하지 | 90 |
| 소서 | 105 |
| 대서 | 120 |
| 입추 | 135 |
| 처서 | 150 |
| 백로 | 165 |
| 추분 | 180 |
| 한로 | 195 |
| 상강 | 210 |
| 입동 | 225 |
| 소설 | 240 |
| 대설 | 255 |
| 동지 | 270 |
| 소한 | 285 |
| 대한 | 300 |
| 입춘 | 315 |
| 우수 | 330 |
| 경칩 | 345 |

내부 계산은 UTC 기준으로 수행하고, 결과는 요청 timezone으로 변환한다.

## 5. Provider 설계

구현 파일:

- `src/lib/solarTerms/types.ts`
- `src/lib/solarTerms/definitions.ts`
- `src/lib/solarTerms/astronomyEngine.ts`
- `src/lib/solarTerms/astronomical.ts`
- `src/lib/solarTerms/manseryeok.ts`
- `src/lib/solarTerms/approximate.ts`
- `src/lib/solarTerms/validation.ts`
- `src/lib/solarTerms/fixtures.ts`

인터페이스:

```ts
export type SolarTermProvider = {
  getTermsByYear(year: number, timezone: string): SolarTermResult;
};
```

결과 구조:

```ts
export type SolarTermResult = {
  year: number;
  timezone: string;
  precision: "astronomy-engine" | "astronomical" | "manseryeok" | "approximate";
  source: string;
  terms: Array<{
    name: string;
    nameHanja: string;
    longitude: number;
    utcDateTime: string;
    localDateTime: string;
  }>;
};
```

Provider:

- `AstronomyEngineSolarTermProvider`
  - `astronomy-engine@2.1.19`의 `SearchSunLongitude` 기반
  - 태양 apparent ecliptic longitude가 목표 황경에 도달하는 UTC 시각을 탐색
- `ManseryeokSolarTermProvider`
  - 기존 `@fullstackfamily/manseryeok getSolarTermsByYear` adapter
- `AstronomicalSolarTermProvider`
  - Meeus 저차 태양 겉보기 황경 수식 기반
- `ApproximateSolarTermProvider`
  - 기존 월일 fallback과 동일한 fixed month/day provider

중요: 이번 작업에서는 `AstronomyEngineSolarTermProvider` 또는 `AstronomicalSolarTermProvider`를 production 대운 계산에 연결하지 않았다.

## 6. 2020 입춘 4자 집중 검증

요구된 첫 판정 대상:

```text
2020년 입춘, 황경 315도, timezone Asia/Seoul
```

검증 결과:

| Provider | UTC | KST |
|---|---:|---:|
| Astronomy Engine | 2020-02-04T09:03:38.336Z | 2020-02-04T18:03:38.336+09:00 |
| 자체 Meeus | 2020-02-04T09:07:58.300Z | 2020-02-04T18:07:58.300+09:00 |
| `@fullstackfamily/manseryeok` | 2020-02-03T20:02:00Z | 2020-02-04T05:02:00+09:00 |

Pairwise 차이:

| Pair | 차이 |
|---|---:|
| Astronomy Engine vs 자체 Meeus | 4.333분 |
| Astronomy Engine vs manseryeok | 781.639분 |
| 자체 Meeus vs manseryeok | 785.972분 |

판정:

```text
Astronomy Engine과 자체 Meeus는 5분 이내라 자체 Meeus 방향은 유효하다.
manseryeok만 수시간 차이가 나므로 절기 시각 provider로 부적합하다.
```

중요: 이 판정은 2020 입춘 단일 케이스의 결론이며, 이어서 2020-2030 전체 264건 비교로 확장한다.

## 7. `@fullstackfamily/manseryeok` 절기 데이터 조사

조사 파일:

- `node_modules/@fullstackfamily/manseryeok/dist/index.mjs`
- `node_modules/@fullstackfamily/manseryeok/dist/index.mjs.map`

확인 결과:

- `SOLAR_TERMS_DATA`는 2020-2030 범위를 포함한다.
- 파일 주석은 "한국천문연구원(KASI) 데이터 기반"이라고 되어 있다.
- 그러나 2020년부터 2030년까지 24절기 월/일/시/분 배열이 동일하게 반복된다.
- 예: 2020, 2021, 2022, ..., 2030의 입춘이 모두 `2월 4일 05:02`로 기록되어 있다.
- 따라서 현재 패키지 내장 절기 데이터는 실제 연도별 정밀 절기 시각이라기보다 정적 샘플/대표값일 가능성이 높다.

2020 입춘 차이의 가장 유력한 원인:

```text
timezone 이중 적용보다는 manseryeok 내장 절기 데이터가 연도별 정밀 데이터가 아닌 정적 반복 데이터인 점이 핵심 원인이다.
```

이 판단은 KASI 공식 fixture로 최종 확인해야 한다.

## 8. 2020-2030 3자 교차검증 결과

검증 범위:

- 2020-2030
- 11년 x 24절기 = 264개
- 비교 대상:
  - Astronomy Engine vs 자체 Meeus
  - Astronomy Engine vs `@fullstackfamily/manseryeok`
  - 자체 Meeus vs `@fullstackfamily/manseryeok`
- timezone: `Asia/Seoul`

결과:

| Pair | 평균 | 중앙값 | 최대 | 1분 이내 | 5분 이내 | 10분 초과 |
|---|---:|---:|---:|---:|---:|---:|
| Astronomy Engine vs 자체 Meeus | 3.870분 | 3.299분 | 12.794분 | 18.561% | 68.561% | 10건 |
| Astronomy Engine vs manseryeok | 362.755분 | 350.534분 | 790.909분 | 7.197% | 9.091% | 240건 |
| 자체 Meeus vs manseryeok | 364.223분 | 351.079분 | 788.996분 | 1.894% | 5.682% | 243건 |

최대 오차 케이스:

| Pair | 연도 | 절기 | Astronomy/Meeus 시각 | 비교 시각 | 차이 |
|---|---:|---|---:|---:|---:|
| Astronomy Engine vs 자체 Meeus | 2026 | 입하 | 2026-05-05T20:49:09.475+09:00 | 2026-05-05T20:36:21.826+09:00 | 12.794분 |
| Astronomy Engine vs manseryeok | 2020 | 대한 | 2020-01-20T23:54:54.521+09:00 | 2020-01-20T10:44:00+09:00 | 790.909분 |
| 자체 Meeus vs manseryeok | 2020 | 대한 | 2020-01-20T23:52:59.765+09:00 | 2020-01-20T10:44:00+09:00 | 788.996분 |

검증 기준:

- 평균 오차 5분 이내 목표
- 최대 오차 15분 이내 목표

판정:

```text
Astronomy Engine vs 자체 Meeus는 평균 5분 이내라 acceptable.
최대 오차도 15분 이내라 현재 기준을 통과한다.
manseryeok 절기 시각은 Astronomy Engine 대비 평균 약 6시간, 최대 약 13시간 차이로 canonical provider에서 제외한다.
production 연결은 아직 하지 않는다.
```

### 원인 분석

현재 결과만 보면 `@fullstackfamily/manseryeok`의 2020-2030 절기 시각 데이터와 천문 계산 결과가 시간 단위로 크게 어긋난다. 예를 들어 2020년 입춘은 Astronomy Engine에서 `2020-02-04 18:03 KST`, 자체 Meeus provider에서 `2020-02-04 18:07 KST`로 계산되지만, `manseryeok` adapter는 `2020-02-04 05:02 KST`를 반환한다.

이 차이는 저차 수식의 일반적인 오차 수준을 훨씬 넘는다. 가능한 원인은 다음과 같다.

1. `manseryeok`의 내장 절기 시각 데이터가 실제 2020-2030 연도별 값이 아닐 가능성
2. `manseryeok` 데이터의 timezone 또는 연도 매핑 문제
3. 자체 Meeus provider의 time scale, delta T, apparent longitude 보정 누락
4. 양쪽 중 하나의 절기 황경 기준 또는 시간 기준 정의 불일치

Astronomy Engine 검증 후에는 1번이 핵심 원인으로 보인다. timezone 이중 적용이면 연도별 값 자체는 달라져야 하지만, `manseryeok` 내장 데이터는 2020-2030에 동일 절기 시각이 반복된다.

## 9. KASI 공식 fixture 검증

구현 파일:

- `src/lib/solarTerms/fixtures.ts`
- `src/lib/solarTerms/validation.ts`

KASI 공식 출처:

- KASI 월력요항: https://astro.kasi.re.kr/life/pageView/4
- KASI 월력요항 안내/관보 링크: https://astro.kasi.re.kr/life/post/almanac

KASI 페이지는 월력요항이 달력 제작 기준 정보임을 설명하고, 2004년 이후 발표된 월력요항을 제공한다고 안내한다. `pageView/4` 본문에서 확인 가능한 2004, 2012, 2013, 2014, 2015, 2016, 2017년 값을 정적 fixture로 저장했다.

fixture 범위:

```text
7개 연도 x 6개 절기 = 42건
연도: 2004, 2012, 2013, 2014, 2015, 2016, 2017
절기: 입춘, 춘분, 하지, 입추, 추분, 동지
```

fixture 정책:

- production runtime에서 scraping하지 않는다.
- 검증 fixture에는 출처 URL, 조회일, 연도, 절기명, KST 시각, 검증 상태를 기록한다.
- 실제 KASI 본문에서 확인 가능한 값만 `status: "verified"`로 둔다.
- 검색 snippet이나 추정값은 사용하지 않는다.

KASI vs provider 통계:

| Provider | fixture | 평균 | 중앙값 | 최대 | 1분 이내 | 2분 이내 | 2분 초과 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Astronomy Engine | 42 | 17.072초 / 0.285분 | 14.350초 / 0.239분 | 48.482초 / 0.808분 | 100% | 100% | 0건 |
| 자체 Meeus | 42 | 249.751초 / 4.163분 | 242.889초 / 4.048분 | 620.161초 / 10.336분 | 14.286% | 21.429% | 33건 |

Astronomy Engine 최대 오차:

```json
{
  "year": 2012,
  "termName": "하지",
  "expectedKst": "2012-06-21T08:09:00+09:00",
  "providerKstDateTime": "2012-06-21T08:08:11.518+09:00",
  "differenceSeconds": 48.482,
  "differenceMinutes": 0.808
}
```

자체 Meeus 최대 오차:

```json
{
  "year": 2016,
  "termName": "추분",
  "expectedKst": "2016-09-22T23:21:00+09:00",
  "providerKstDateTime": "2016-09-22T23:10:39.839+09:00",
  "differenceSeconds": 620.161,
  "differenceMinutes": 10.336
}
```

판정:

```text
Astronomy Engine은 KASI 42건 기준 평균 1분 이내, 최대 2분 이내 기준을 통과한다.
canonical solar-term provider = AstronomyEngineSolarTermProvider

자체 Meeus provider는 평균 5분 이내, 최대 15분 이내 기준을 통과한다.
emergency fallback으로만 유지한다.

@fullstackfamily/manseryeok 절기 시각 provider는 canonical 및 fallback에서 제외한다.
```

## 10. 1974년 샘플 결과

입력 기준:

```text
출생 입력: 1974-07-30 03:50 Asia/Seoul
지역시 보정 후: 1974-07-30T03:17:54.720+09:00
순행 기준 다음 절기: 입추, 황경 135도
```

Astronomy Engine:

```json
{
  "name": "입추",
  "longitude": 135,
  "utcDateTime": "1974-08-07T21:57:01.896Z",
  "localDateTime": "1974-08-08T06:57:01.896+09:00"
}
```

자체 Meeus provider:

```json
{
  "name": "입추",
  "longitude": 135,
  "utcDateTime": "1974-08-07T22:00:42.579Z",
  "localDateTime": "1974-08-08T07:00:42.579+09:00"
}
```

기존 approximate fallback:

```json
{
  "name": "입추",
  "longitude": 135,
  "utcDateTime": "1974-08-07T15:00:00Z",
  "localDateTime": "1974-08-08T00:00:00+09:00"
}
```

차이:

| Pair | 차이 |
|---|---:|
| Astronomy Engine vs 자체 Meeus | 3.678분 |
| Astronomy Engine vs approximate fallback | 417.032분, 약 6시간 57분 |

출생 시각부터 Astronomy Engine 입추까지:

```json
{
  "rawTermDifference": {
    "days": 9,
    "hours": 3,
    "minutes": 39,
    "totalHours": 219.652,
    "totalDays": 9.152
  },
  "traditionalConversion": {
    "rule": "3 days = 1 year",
    "years": 3,
    "months": 0,
    "days": 18
  },
  "displayDaewoonAge": 4,
  "firstDaewoonStartDateTime": "1977-08-17T03:17:54.720+09:00"
}
```

provider별 대운 환산 비교:

| Provider | 절기 차이 | 환산 대운 시작 | 표시 대운수 | 첫 대운 시작 datetime |
|---|---:|---:|---:|---:|
| Astronomy Engine | 9일 3시간 39분 | 3년 0개월 18일 | 4 | 1977-08-17T03:17:54.720+09:00 |
| 자체 Meeus | 9일 3시간 43분 | 3년 0개월 19일 | 4 | 1977-08-18T03:17:54.720+09:00 |
| approximate fallback | 8일 20시간 42분 | 2년 11개월 14일 | 3 | 1977-07-14T03:17:54.720+09:00 |

주의: 이 결과는 production 연결 전 검증 산출값이다. 이번 작업에서는 production 대운 시작값으로 연결하지 않는다.

## 11. DST 처리 정책

현재 Luxon에서 `Asia/Seoul`을 사용하면 1987년 한국 역사적 DST 때문에 `+10:00` offset이 출력될 수 있다.

정책:

1. 천문 절기 시각 자체는 해당 시점의 실제 timezone offset을 보존할 수 있다.
2. 대운 시작 나이 계산은 timezone 표시가 아니라 elapsed duration 기준으로 계산한다.
3. 10년 주기 생성은 달력상 연도 증가와 표시 offset 문제를 분리한다.
4. 한국 서비스 UI용 canonical 표시는 필요하면 `+09:00` 고정 렌더링 옵션을 제공한다.

테스트:

- `tests/solarTerms.test.ts`
- `fixed +09:00 rendering is separate from elapsed time calculations`

결과:

```text
1987-07-09 Asia/Seoul offset은 +10:00으로 확인된다.
동일 순간을 서비스 표시용 +09:00 문자열로 바꾸면 1시간 차이가 난다.
따라서 계산 기준과 UI 표시 기준을 분리해야 한다.
```

## 12. 대운 시작 나이 필드 재설계 제안

현재 문제:

```text
ageDays가 잔여 일이 아니라 원래 절기 차이 일수다.
```

새 구조 제안:

```ts
{
  rawTermDifference: {
    days: number;
    hours: number;
    minutes: number;
  },
  convertedStartAge: {
    years: number;
    months: number;
    days: number;
  },
  displayAge: number;
  precision: "astronomical" | "estimated";
  source: "astronomical-solar-term" | "approximate-solar-term";
}
```

기존 `age`, `years`, `months`, `days`, `ageYears`, `ageMonths`, `ageDays`는 production 호환을 위해 바로 제거하지 말고 deprecated 처리하는 것이 안전하다.

## 13. 테스트

추가 파일:

- `tests/solarTerms.test.ts`

검증 항목:

- astronomical provider가 1900, 1950, 1974, 2000, 2026, 2050, 2100에서 24개 절기를 반환하는지
- 2020-2030 교차검증 report가 264개 절기를 비교하는지
- 현재 교차검증이 기준 미달임을 감지하는지
- KASI verified fixture 42건 기준 Astronomy Engine이 2분 이내인지
- 1974년 다음 절기 샘플을 출력할 수 있는지
- external fixture 구조와 KASI verified fixture 구조를 검증하는지
- DST 고정 표시 정책을 테스트로 드러내는지

## 14. Production 적용 가능 여부

현재 판단:

```text
production 연결 가능. 2026-07-03 후속 작업에서 대운 시작 계산 경로에 연결함.
```

이유:

- Astronomy Engine은 공식 API 기반이고 2020-2030 전체 검증에서 자체 Meeus와 평균 3.870분 차이다.
- 자체 Meeus provider는 평균 5분 이내, 최대 15분 이내 기준을 통과했으므로 fallback 후보로 acceptable이다.
- `manseryeok` 절기 시각은 2020-2030 동일 데이터 반복과 Astronomy Engine 대비 큰 오차 때문에 canonical provider에서 제외한다.
- KASI 공식 월력요항 42건 기준 Astronomy Engine은 평균 0.285분, 최대 0.808분 차이로 최종 기준을 통과했다.
- 후속 요청 승인에 따라 production 대운 계산 provider를 canonical chain으로 교체했다.

다음 단계:

1. 자체 Meeus provider는 package 장애 시 emergency fallback으로만 둔다.
2. `@fullstackfamily/manseryeok`는 사주 원국 계산에는 계속 사용할 수 있지만, 절기 시각 provider로는 사용하지 않는다.
3. 대운 기산법 자체는 별도 작업에서 계속 검증한다.

## 15. Production 연결 결과

2026-07-03 후속 작업에서 production 대운 시작 계산의 절기 provider를 canonical chain으로 교체했다.

Provider chain:

```text
1. AstronomyEngineSolarTermProvider
2. AstronomicalSolarTermProvider, 자체 Meeus emergency fallback
3. ApproximateSolarTermProvider, degraded fallback
```

`src/lib/manse/daewoon.ts`는 더 이상 `@fullstackfamily/manseryeok getSolarTermsByYear`를 직접 호출하지 않는다. 원국 계산은 기존처럼 `@fullstackfamily/manseryeok`를 사용한다.

1974-07-30 03:50 서울 남성 회귀 케이스:

| 항목 | 이전 approximate | 현재 Astronomy Engine |
|---|---:|---:|
| 사용 provider | approximate | astronomy-engine |
| 다음 절기 | 입추 1974-08-08T00:00:00+09:00 | 입추 1974-08-08T06:57:01.896+09:00 |
| 절기까지 기간 | 8.862561일 | 9.152166일 |
| production 환산값 | 2년 11개월 9일 | 3년 1개월 9일 |
| 표시 대운수 | 3 | 4 |
| 첫 대운 시작 | 1977-07-09T03:17:54.720+09:00 | 1977-09-08T03:17:54.720+09:00 |
| 현재 대운 | 병자 | 병자 |

주의: 이 production 환산값은 기존 대운 기산법을 그대로 유지한 결과다. `displayDaewoonAge` 및 `firstDaewoonStartDateTime` 산식 자체는 이번 작업에서 변경하지 않았다.
