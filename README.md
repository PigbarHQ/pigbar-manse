# Pigbar Manse

Next.js / TypeScript 기반 한국 만세력 계산 실험 프로젝트입니다.

## 계산 원칙

- 명조 계산 1차 엔진: `@fullstackfamily/manseryeok`
- 음력 변환 검증 보조 계층: `korean-lunar-calendar`
- 날짜/시간 처리: `luxon`
- `lunar-javascript`는 핵심 의존성으로 사용하지 않습니다.
- 계산 결과와 해석 입력값은 분리합니다.

## 지역시 보정

한국 표준시는 동경 135도를 기준으로 합니다.

```text
localMeanTimeOffsetMinutes = (longitude - 135) * 4
```

예:

- 서울 126.978도: 약 -32.088분
- 대구 128.601도: 약 -25.596분

화면과 JSON에는 원 입력 시간, 지역시 보정값, 보정 시간을 함께 표시합니다.

## 대운수 환산 기준

대운 시작 나이는 출생 시각에서 다음 절기 또는 이전 절기까지의 시간 차이를 기준으로 계산합니다.

```text
3일 = 1년
1일 = 4개월
1시간 = 5일
```

정밀 절기 시각 데이터가 없는 연도는 근사 절입값을 사용하고 warning에 남깁니다.

## API

`POST /api/manse`

입력:

```json
{
  "birthDate": "1974-07-30",
  "calendarType": "solar",
  "isLeapMonth": false,
  "birthTime": "03:50",
  "gender": "male",
  "birthPlace": {
    "name": "서울특별시, 대한민국",
    "latitude": 37.5665,
    "longitude": 126.978,
    "timezone": "Asia/Seoul"
  },
  "useLocalMeanTime": true,
  "currentDateTime": "2026-07-02T12:30:00+09:00"
}
```

출력은 `input`, `timeCorrection`, `calendarConversion`, `natalChart`, `luck`, `warnings`, `analysisInput`으로 분리됩니다.

## Scripts

```bash
npm run dev
npm run lint
npm run test
npm run build -- --webpack
```
