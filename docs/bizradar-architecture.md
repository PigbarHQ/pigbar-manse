# Pigbar BizRadar Architecture

## 목적

Pigbar BizRadar는 Pigbar Manse 안에서 기업이 확인할 수 있는 공공입찰, 지원사업, 파트너 기회를 탐색하기 위한 별도 모듈이다.

현재 단계는 나라장터 입찰공고정보서비스 문서를 기준으로 검색 화면과 서버 API Route 뼈대를 만드는 것이다. DB 저장, 로그인, AI 분석, 참가 가능성 판정은 포함하지 않는다.

## 현재 구현 범위

- `/bizradar`: BizRadar 메인 화면
- `/bizradar/tenders`: 나라장터 입찰공고 검색 화면
- `/api/bizradar/tenders/list`: 업무구분별 입찰공고 목록 조회
- `/api/bizradar/tenders/detail`: 공고번호 기반 상세 조회용 Route
- `TenderOpportunity` 정규화 타입

## 조달청 API 구조

제공 문서: `조달청_OpenAPI참고자료_나라장터_입찰공고정보서비스_1.2.docx`

- 서비스명: 나라장터 입찰공고정보서비스
- 서비스 ID: `BidPublicInfoService`
- Base URL: `http://apis.data.go.kr/1230000/ad/BidPublicInfoService`
- 인증 방식: 공공데이터포털 Service Key
- 응답 형식: XML, JSON
- JSON 요청 파라미터: `type=json`

## 업무구분별 목록 Endpoint

문서에서 확인된 나라장터 검색조건 기반 목록 조회 Endpoint를 사용한다.

| 업무구분 | Endpoint |
| --- | --- |
| 공사 | `getBidPblancListInfoCnstwkPPSSrch` |
| 용역 | `getBidPblancListInfoServcPPSSrch` |
| 외자 | `getBidPblancListInfoFrgcptPPSSrch` |
| 물품 | `getBidPblancListInfoThngPPSSrch` |

## 요청 파라미터

현재 MVP에서 사용하는 파라미터:

- `ServiceKey`
- `type=json`
- `numOfRows`
- `pageNo`
- `inqryDiv=1`
- `inqryBgnDt`
- `inqryEndDt`
- `bidNtceNm`

공고번호 기반 상세 조회 Route에서는 다음 파라미터를 사용한다.

- `inqryDiv=2`
- `bidNtceNo`

## 응답 필드 정규화

`TenderOpportunity`는 공공데이터 원본 필드를 사용자 화면에 맞게 정규화한다.

```ts
type TenderOpportunity = {
  id: string;
  bidNoticeNo: string;
  bidNoticeOrd?: string;
  title: string;
  businessType: "service" | "goods" | "construction" | "foreign" | "unknown";
  orderingAgency?: string;
  demandAgency?: string;
  noticeDate?: string;
  bidStartDate?: string;
  bidCloseDate?: string;
  openingDate?: string;
  estimatedPrice?: number;
  basePrice?: number;
  contractMethod?: string;
  bidMethod?: string;
  allowedRegions?: string[];
  licenseRestrictions?: string[];
  detailUrl?: string;
  attachments?: {
    name: string;
    url: string;
  }[];
  raw: unknown;
};
```

## 부가 Endpoint

문서에서 확인된 향후 확장 Endpoint:

| 기능 | Endpoint |
| --- | --- |
| 면허제한 | `getBidPblancListInfoLicenseLimit` |
| 참가가능지역 | `getBidPblancListInfoPrtcptPsblRgn` |
| e발주 첨부파일 | `getBidPblancListInfoEorderAtchFileInfo` |
| 물품 기초금액 | `getBidPblancListInfoThngBsisAmount` |
| 공사 기초금액 | `getBidPblancListInfoCnstwkBsisAmount` |
| 용역 기초금액 | `getBidPblancListInfoServcBsisAmount` |
| 물품 변경이력 | `getBidPblancListInfoChgHstryThng` |
| 공사 변경이력 | `getBidPblancListInfoChgHstryCnstwk` |
| 용역 변경이력 | `getBidPblancListInfoChgHstryServc` |

## 페이지 구조

- `/bizradar`: 모듈 선택 화면
- `/bizradar/tenders`: 나라장터 입찰공고 검색

향후 확장 예정 화면:

- 사전규격
- 발주계획
- 낙찰정보
- 계약정보
- 정부지원사업

## API Route 구조

현재 구현:

- `/api/bizradar/tenders/list`
- `/api/bizradar/tenders/detail`

향후 확장 Route:

- `/api/bizradar/tenders/licenses`
- `/api/bizradar/tenders/regions`
- `/api/bizradar/tenders/attachments`
- `/api/bizradar/tenders/history`
- `/api/bizradar/tenders/base-price`

## 미구현 항목

- 참가 가능성 판정
- 면허 제한 상세 패널
- 참가가능지역 상세 패널
- 첨부파일 분석
- 공고 변경이력 통합 표시
- 기초금액 별도 조회
- 사전규격, 발주계획, 낙찰정보, 계약정보, 정부지원사업

## 다음 우선순위

1. 실제 나라장터 목록 API 응답 필드 검증
2. 면허제한, 참가가능지역 Route 연결
3. 첨부파일 목록 Route 연결
4. 원문 링크와 공고 상세 패널 정교화
5. 기업 조건 입력 기반 참가조건 확인 기능 설계
