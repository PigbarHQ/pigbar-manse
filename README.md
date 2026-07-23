# Pigbar Manse

Next.js / TypeScript 기반 한국 만세력 계산 실험 프로젝트입니다.

## 개발 환경

새 PC / 새 Mac에서 실행할 때:

```bash
cp .env.example .env.local
```

그다음 `.env.local`에 실제 `OPENAI_API_KEY`를 입력합니다.

```bash
OPENAI_API_KEY=
OPENAI_BLUEPRINT_MODEL=gpt-5.5
```

주의:

- `.env.local`은 절대 Git에 커밋하지 않습니다.
- `.env.example`만 Git에 커밋합니다.

개발 서버를 실행합니다.

```bash
npm run dev
```

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

## BizRadar

BizRadar는 조달청 나라장터 입찰공고정보서비스를 이용해 공공입찰 기회를 조회하는 별도 모듈입니다.

화면:

- `/bizradar`
- `/bizradar/tenders`
- `/bizradar/company`
- `/bizradar/company/import`

서버 Route:

- `GET /api/bizradar/tenders/list`
- `GET /api/bizradar/tenders/detail`
- `GET /api/bizradar/tenders/licenses`
- `GET /api/bizradar/tenders/regions`
- `GET /api/bizradar/tenders/base-price`
- `GET /api/bizradar/tenders/history`
- `GET /api/bizradar/tenders/attachments`

연결된 조달청 Endpoint:

- `getBidPblancListInfoCnstwkPPSSrch`: 공사 입찰공고 목록
- `getBidPblancListInfoServcPPSSrch`: 용역 입찰공고 목록
- `getBidPblancListInfoFrgcptPPSSrch`: 외자 입찰공고 목록
- `getBidPblancListInfoThngPPSSrch`: 물품 입찰공고 목록
- `getBidPblancListInfoLicenseLimit`: 면허제한
- `getBidPblancListInfoPrtcptPsblRgn`: 참가가능지역
- `getBidPblancListInfoThngBsisAmount`: 물품 기초금액
- `getBidPblancListInfoCnstwkBsisAmount`: 공사 기초금액
- `getBidPblancListInfoServcBsisAmount`: 용역 기초금액
- `getBidPblancListInfoChgHstryThng`: 물품 변경이력
- `getBidPblancListInfoChgHstryCnstwk`: 공사 변경이력
- `getBidPblancListInfoChgHstryServc`: 용역 변경이력
- `getBidPblancListInfoEorderAtchFileInfo`: e발주 첨부파일

입찰 상세 화면은 원본 필드를 그대로 나열하기 전에 Tender Summary Card를 먼저 표시합니다.

- 업무구분: 용역 / 물품 / 공사 / 외자
- 계약방법: 일반경쟁 / 제한경쟁 / 수의계약 / 지명경쟁 / 협상계약 등으로 정규화
- 면허제한: Tag 형태로 표시
- 참가가능지역: Tag 형태로 표시
- 기초금액/추정가격: 원 단위 원문을 만원/억원 단위로 요약 표시
- 첨부파일 개수 표시
- 변경이력 개수 표시
- Raw JSON은 상세 하단에 유지

회사 프로필:

- 저장 위치: 브라우저 LocalStorage
- 저장 키: `pigbar.bizradar.companyProfile.v1`
- DB 저장 없음
- 입력 항목: 회사명, 사업자번호, 업종, 지역, 직원수, 매출구간, 기술, 보유 인증, 보유 면허, 직접생산, 주요 실적
- Tender Detail 상단의 Company Match Card에서 입찰공고와 비교

Company Knowledge:

- 화면: `/bizradar/company/import`
- 목적: 회사소개서, 제안서, 실적, 인증서 파일에서 회사 프로필 초안 생성
- 지원 파일: PDF, DOCX, PPTX
- 처리 흐름: 파일 업로드 → 서버 텍스트 추출 → OpenAI 초안 생성 → 사용자 검토 → LocalStorage 저장
- API Route: `POST /api/bizradar/company/import`
- PDF: 텍스트 레이어가 있는 문서에서 텍스트 추출
- DOCX/PPTX: 문서 내부 XML 텍스트 추출
- OpenAI 키가 없거나 AI 호출이 실패하면 추출 텍스트 기반 규칙 초안을 생성
- DB 저장 없음
- 원본 파일 영구 저장 없음

Company Match:

- 비교 대상: 업종, 면허, 직접생산, 지역, 기술, 인증, 실적
- 출력 상태: `Match`, `Mismatch`, `Unknown`
- `Unknown`은 사용자 화면에서 `추가 확인`으로 표시
- 비교 방식: 규칙 기반
- AI 분석/DB 저장 없음
- 회사 프로필은 LocalStorage에서 읽고, 입찰공고 상세 데이터와 즉시 비교

공공데이터포털 인증키는 서버에서만 사용합니다.

```bash
DATA_GO_KR_SERVICE_KEY=
```

## Scripts

```bash
npm run dev
npm run lint
npm run test
npm run build -- --webpack
```
