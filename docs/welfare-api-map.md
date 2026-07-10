# Welfare API Map

Sprint 2 scope: API Discovery only.

This document maps public and semi-public data sources that may be useful for an elderly welfare and care consultation product. It does not add integrations, store data, or decide eligibility.

## Classification Rules

- **조회 가능 여부** means whether a service can be queried through an API or open dataset.
- **신청 가능 여부** means whether the API itself supports application submission. Most public open APIs only provide information and do not submit applications.
- **개인정보 필요 여부** distinguishes public service information from personal eligibility or application status. Pigbar MVP should avoid personal eligibility lookup until legal, consent, and authentication requirements are clear.
- **MVP 활용 가능성** focuses on 상담 후보 제시, 제도 설명, 기관 안내, and checklist generation. It does not mean 수급 가능성 판정.

## Summary

| Priority | API / Dataset | Layer | MVP Use | Status |
|---|---|---|---|---|
| P0 | 한국사회보장정보원_중앙부처복지서비스 | 중앙정부 | Central welfare service search and detail | Integrated / verified in project |
| P0 | 한국사회보장정보원_지자체복지서비스 | 지자체 | Local welfare service search and detail | Integrated / verified in project |
| P1 | 보조금24 / 정부혜택 관련 공개 데이터 | 중앙정부 / 기타 | Benefit discovery expansion | Candidate, needs endpoint verification |
| P1 | 사회복지시설 관련 API | 시설 | Nearby facility and service-provider lookup | Candidate |
| P1 | 장기요양기관 관련 API | 장기요양 / 시설 | Care facility lookup and 상담 referral | Candidate |
| P2 | 치매안심센터 / 보건소 관련 API | 공공기관 / 시설 | Health and dementia care navigation | Candidate |
| P2 | 노인일자리 관련 API | 공공기관 | Senior job program discovery | Candidate |
| P3 | 국민연금 관련 공개 API | 공공기관 | 노후준비 information layer | Candidate, mostly informational |
| P3 | 건강보험 / 장기요양보험 관련 공개 API | 공공기관 / 장기요양 | Insurance and LTC information layer | Candidate |
| P3 | 에너지 / 통신 요금 감면 관련 API | 기타 | Fee-reduction checklist | Candidate, likely fragmented |

## API Candidates

### 1. 한국사회보장정보원_중앙부처복지서비스

| Field | Value |
|---|---|
| API명 | 한국사회보장정보원_중앙부처복지서비스 |
| 제공기관 | 한국사회보장정보원 / 복지로 계열 |
| data.go.kr URL | `https://www.data.go.kr/`에서 데이터명 검색 필요. Current project endpoint: `https://apis.data.go.kr/B554287/NationalWelfareInformationsV001` |
| 레이어 | 중앙정부 |
| 제공 데이터 요약 | 중앙부처 복지서비스 목록 및 상세 정보. 서비스명, 소관부처, 대상, 선정기준, 지원내용, 신청방법, 문의처, 근거법령 등. |
| 주요 필드 | `servId`, `servNm`, `jurMnofNm`, `wlfareInfoOutlCn`, `tgtrDtlCn`, `slctCritCn`, `alwServCn`, `applmetList`, `inqplCtadrList`, `baslawList` |
| 조회 가능 여부 | 가능. 목록 `/NationalWelfarelistV001`, 상세 `/NationalWelfaredetailedV001` |
| 신청 가능 여부 | API 신청 기능 없음. 정보 조회용. |
| 개인정보 필요 여부 | 없음. 제도/서비스 정보 API. 개인 수급 자격 직접 조회 아님. |
| 인증 방식 | data.go.kr service key |
| 응답 형식 | XML, project parser normalizes to JSON |
| 트래픽 제한 | data.go.kr 활용신청 조건 확인 필요 |
| 갱신주기 | data.go.kr 상세 페이지 확인 필요 |
| 상업적 이용 가능성 | 공공데이터 이용 조건 및 라이선스 확인 필요 |
| MVP 활용 가능성 | 매우 높음. 중앙정부 복지 후보 검색의 기본 소스 |
| 우선순위 | P0 |
| 비고 | 현재 `/api/welfare/national/list`, `/api/welfare/national/detail`로 연동됨. 개인 eligibility가 아니라 service catalog임. |

### 2. 한국사회보장정보원_지자체복지서비스

| Field | Value |
|---|---|
| API명 | 한국사회보장정보원_지자체복지서비스 |
| 제공기관 | 한국사회보장정보원 / 복지로 계열 |
| data.go.kr URL | `https://www.data.go.kr/`에서 데이터명 검색 필요. Current project endpoint: `https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations` |
| 레이어 | 지자체 |
| 제공 데이터 요약 | 지방자치단체 복지서비스 목록 및 상세 정보. 지역 조건, 서비스명, 대상, 내용, 문의처 등. |
| 주요 필드 | `servId`, `servNm`, `jurOrgNm`, `ctpvNm`, `sggNm`, `wlfareInfoOutlCn`, `tgtrDtlCn`, `slctCritCn`, `alwServCn` |
| 조회 가능 여부 | 가능. 목록 `/LcgvWelfarelist`, 상세 `/LcgvWelfaredetailed` |
| 신청 가능 여부 | API 신청 기능 없음. 정보 조회용. |
| 개인정보 필요 여부 | 없음. 지역 서비스 정보 API. 개인 수급 자격 직접 조회 아님. |
| 인증 방식 | data.go.kr service key |
| 응답 형식 | XML, project parser normalizes to JSON |
| 트래픽 제한 | data.go.kr 활용신청 조건 확인 필요 |
| 갱신주기 | data.go.kr 상세 페이지 확인 필요 |
| 상업적 이용 가능성 | 공공데이터 이용 조건 및 라이선스 확인 필요 |
| MVP 활용 가능성 | 매우 높음. 중앙정부 결과와 merge해서 상담 후보 리스트 구성 가능 |
| 우선순위 | P0 |
| 비고 | 현재 `/api/welfare/local/list`, `/api/welfare/local/detail`로 연동됨. 지역 기본값은 인천광역시/미추홀구. |

### 3. 보조금24 또는 정부혜택 관련 API

| Field | Value |
|---|---|
| API명 | 보조금24 / 정부혜택 관련 공개 API 또는 데이터 |
| 제공기관 | 행정안전부 / 정부24 계열 가능성 |
| data.go.kr URL | data.go.kr에서 `보조금24`, `정부혜택`, `정부서비스` 키워드 재검색 필요 |
| 레이어 | 중앙정부 / 기타 |
| 제공 데이터 요약 | 정부 혜택, 보조금, 신청 가능한 정책 서비스 카탈로그 가능성 |
| 주요 필드 | 서비스명, 지원대상, 지원내용, 신청방법, 소관기관, 온라인신청 URL 예상 |
| 조회 가능 여부 | 추가 확인 필요. API가 아닌 웹/파일/링크 데이터일 수 있음 |
| 신청 가능 여부 | 공개 API로 신청 제출 가능성 낮음. 정부24 로그인/본인인증 영역일 가능성 높음 |
| 개인정보 필요 여부 | 개인 맞춤 보조금 조회는 개인정보와 인증 필요 가능성이 큼 |
| 인증 방식 | 공개 데이터면 service key, 개인 맞춤이면 정부24 인증 가능성 |
| 응답 형식 | 추가 확인 필요 |
| 트래픽 제한 | 추가 확인 필요 |
| 갱신주기 | 추가 확인 필요 |
| 상업적 이용 가능성 | 정부24/공공데이터 이용조건 확인 필요 |
| MVP 활용 가능성 | 중간. 개인 맞춤 조회가 아니라 공개 카탈로그만 활용 가능 |
| 우선순위 | P1 |
| 비고 | 개인별 “받을 수 있음” 판정 API로 간주하면 안 됨. MVP에서는 공개 제도 정보 확장 후보로만 취급. |

### 4. 사회복지시설 관련 API

| Field | Value |
|---|---|
| API명 | 사회복지시설 관련 API / 파일 데이터 |
| 제공기관 | 보건복지부, 한국사회보장정보원, 지방자치단체 가능성 |
| data.go.kr URL | data.go.kr에서 `사회복지시설`, `노인복지시설`, `복지시설` 키워드 검색 필요 |
| 레이어 | 시설 |
| 제공 데이터 요약 | 시설명, 시설종류, 주소, 연락처, 운영주체, 정원/현원 등 시설 안내 데이터 가능성 |
| 주요 필드 | 시설명, 시설유형, 주소, 전화번호, 위도/경도, 운영기관, 정원, 현원 |
| 조회 가능 여부 | 후보. API 또는 파일 데이터로 존재 가능 |
| 신청 가능 여부 | 없음. 시설 안내/검색용 |
| 개인정보 필요 여부 | 없음. 시설 공개 정보 |
| 인증 방식 | data.go.kr service key 또는 파일 다운로드 |
| 응답 형식 | XML/JSON/CSV/XLSX 가능 |
| 트래픽 제한 | API일 경우 data.go.kr 조건 확인 필요 |
| 갱신주기 | 시설 데이터는 월/분기/수시 갱신 가능성. 개별 데이터 상세 확인 필요 |
| 상업적 이용 가능성 | 공공데이터 라이선스 확인 필요 |
| MVP 활용 가능성 | 높음. 서비스 후보에서 실제 방문/상담 기관으로 연결 가능 |
| 우선순위 | P1 |
| 비고 | 제도 정보와 시설 위치 정보를 분리해서 모델링해야 함. |

### 5. 장기요양기관 관련 API

| Field | Value |
|---|---|
| API명 | 장기요양기관 관련 API / 기관 검색 데이터 |
| 제공기관 | 국민건강보험공단 장기요양보험 계열 |
| data.go.kr URL | data.go.kr에서 `장기요양기관`, `노인장기요양`, `장기요양보험` 키워드 검색 필요 |
| 레이어 | 장기요양 / 시설 |
| 제공 데이터 요약 | 장기요양기관, 재가/시설급여 기관, 주소, 평가, 급여종류, 연락처 등 가능성 |
| 주요 필드 | 기관명, 기관기호, 급여종류, 주소, 전화번호, 평가등급, 정원, 현원 |
| 조회 가능 여부 | 후보. 공단 사이트와 공공데이터포털 모두 확인 필요 |
| 신청 가능 여부 | 없음. 장기요양 인정 신청/등급 관련 개인 절차는 별도 인증 영역 |
| 개인정보 필요 여부 | 기관 검색은 없음. 개인 등급/급여 이용내역 조회는 개인정보 필요 |
| 인증 방식 | 공개 API면 service key, 개인 민원은 공단 인증 |
| 응답 형식 | 추가 확인 필요 |
| 트래픽 제한 | 추가 확인 필요 |
| 갱신주기 | 추가 확인 필요 |
| 상업적 이용 가능성 | 공단/공공데이터 이용조건 확인 필요 |
| MVP 활용 가능성 | 높음. 케어 상담에서 기관 referral 후보로 중요 |
| 우선순위 | P1 |
| 비고 | “장기요양등급 판정”은 API로 하지 않음. 공개 기관 안내만 MVP 범위. |

### 6. 노인일자리 관련 API

| Field | Value |
|---|---|
| API명 | 노인일자리 관련 API / 사업 정보 데이터 |
| 제공기관 | 한국노인인력개발원, 보건복지부, 지자체 가능성 |
| data.go.kr URL | data.go.kr에서 `노인일자리`, `시니어 일자리`, `노인인력` 키워드 검색 필요 |
| 레이어 | 공공기관 |
| 제공 데이터 요약 | 노인일자리 사업, 수행기관, 모집정보, 사업유형, 지역 정보 가능성 |
| 주요 필드 | 사업명, 수행기관, 지역, 모집기간, 사업유형, 문의처, 참여조건 |
| 조회 가능 여부 | 후보. API보다 파일/기관 사이트 정보일 가능성도 있음 |
| 신청 가능 여부 | 공개 API 신청 기능 가능성 낮음. 별도 사이트/기관 접수 가능성 |
| 개인정보 필요 여부 | 사업 정보 조회는 없음. 신청/참여 자격 확인은 개인정보 가능성 |
| 인증 방식 | 추가 확인 필요 |
| 응답 형식 | 추가 확인 필요 |
| 트래픽 제한 | 추가 확인 필요 |
| 갱신주기 | 모집공고 기반이면 수시 |
| 상업적 이용 가능성 | 이용조건 확인 필요 |
| MVP 활용 가능성 | 중간~높음. 상담 태그 `일자리`와 연결 가능 |
| 우선순위 | P2 |
| 비고 | 모집정보는 시점성이 강하므로 캐시/갱신 설계 필요. |

### 7. 치매안심센터 또는 보건소 관련 API

| Field | Value |
|---|---|
| API명 | 치매안심센터 / 보건소 기관 정보 API 또는 데이터 |
| 제공기관 | 중앙치매센터, 보건복지부, 질병관리청, 지방자치단체 가능성 |
| data.go.kr URL | data.go.kr에서 `치매안심센터`, `보건소`, `치매센터` 키워드 검색 필요 |
| 레이어 | 공공기관 / 시설 |
| 제공 데이터 요약 | 센터명, 주소, 전화번호, 관할지역, 운영시간, 서비스 안내 가능성 |
| 주요 필드 | 기관명, 주소, 전화번호, 시도/시군구, 위도/경도, 홈페이지 |
| 조회 가능 여부 | 후보. 기관 목록은 가능성이 높으나 API/파일 구분 필요 |
| 신청 가능 여부 | 없음. 상담/검진 예약은 별도 기관 절차 |
| 개인정보 필요 여부 | 기관 검색은 없음. 검진/상담 신청은 개인정보 필요 |
| 인증 방식 | 추가 확인 필요 |
| 응답 형식 | 추가 확인 필요 |
| 트래픽 제한 | 추가 확인 필요 |
| 갱신주기 | 추가 확인 필요 |
| 상업적 이용 가능성 | 이용조건 확인 필요 |
| MVP 활용 가능성 | 중간~높음. 보호자 상담에서 “가까운 첫 상담처”로 유용 |
| 우선순위 | P2 |
| 비고 | 보건소와 치매안심센터는 목적이 다르므로 별도 source로 분리 권장. |

### 8. 국민연금 관련 공개 API

| Field | Value |
|---|---|
| API명 | 국민연금 관련 공개 API / 노후준비 정보 |
| 제공기관 | 국민연금공단 |
| data.go.kr URL | data.go.kr에서 `국민연금`, `노후준비`, `연금` 키워드 검색 필요 |
| 레이어 | 공공기관 |
| 제공 데이터 요약 | 연금 제도, 지사, 노후준비 정보, 통계성 데이터 가능성 |
| 주요 필드 | 지사명, 주소, 연락처, 제도명, 안내 URL, 통계 항목 |
| 조회 가능 여부 | 후보. 공개 API와 민원/개인 조회를 분리해야 함 |
| 신청 가능 여부 | 공개 API 신청 기능 없음. 연금 청구/가입증명 등은 민원 인증 영역 |
| 개인정보 필요 여부 | 공개 정보는 없음. 개인 연금액/가입 이력은 개인정보 및 인증 필요 |
| 인증 방식 | 공개 API면 service key, 개인 민원은 국민연금 인증 |
| 응답 형식 | 추가 확인 필요 |
| 트래픽 제한 | 추가 확인 필요 |
| 갱신주기 | 추가 확인 필요 |
| 상업적 이용 가능성 | 이용조건 확인 필요 |
| MVP 활용 가능성 | 낮음~중간. 복지 후보보다는 노후준비 안내/기관 연결 |
| 우선순위 | P3 |
| 비고 | 개인 연금 예상액 조회는 MVP에서 제외. |

### 9. 건강보험 또는 장기요양보험 관련 공개 API

| Field | Value |
|---|---|
| API명 | 건강보험 / 장기요양보험 관련 공개 API |
| 제공기관 | 국민건강보험공단 |
| data.go.kr URL | data.go.kr에서 `건강보험`, `장기요양보험`, `요양기관`, `장기요양기관` 키워드 검색 필요 |
| 레이어 | 공공기관 / 장기요양 |
| 제공 데이터 요약 | 보험 제도 안내, 기관 정보, 통계, 일부 요양기관 정보 가능성 |
| 주요 필드 | 기관명, 주소, 전화번호, 보험/급여 구분, 통계 항목, 평가 정보 |
| 조회 가능 여부 | 후보. 개인 보험 자격/납부/급여 내역은 공개 API 범위 밖일 가능성 큼 |
| 신청 가능 여부 | 없음. 개인 민원은 공단 인증 영역 |
| 개인정보 필요 여부 | 공개 정보는 없음. 개인 자격/급여/납부 내역은 개인정보 필요 |
| 인증 방식 | 공개 API면 service key, 개인 민원은 공단 인증 |
| 응답 형식 | 추가 확인 필요 |
| 트래픽 제한 | 추가 확인 필요 |
| 갱신주기 | 추가 확인 필요 |
| 상업적 이용 가능성 | 이용조건 확인 필요 |
| MVP 활용 가능성 | 중간. 장기요양기관과 케어 연결에 집중하면 유용 |
| 우선순위 | P3 |
| 비고 | 건강보험료 감면/자격 판정은 API로 단정하면 안 됨. |

### 10. 에너지 / 통신 요금 감면 관련 API

| Field | Value |
|---|---|
| API명 | 에너지바우처, 전기/가스/통신 요금 감면 관련 API 또는 데이터 |
| 제공기관 | 산업통상자원부, 한국에너지공단, 한국전력, 도시가스사, 과기정통부/통신사 등 가능성 |
| data.go.kr URL | data.go.kr에서 `에너지바우처`, `요금감면`, `전기요금 복지할인`, `통신요금 감면` 키워드 검색 필요 |
| 레이어 | 기타 |
| 제공 데이터 요약 | 제도 안내, 신청 방법, 대상, 담당기관, 지역/공급사 정보 가능성 |
| 주요 필드 | 제도명, 대상, 지원내용, 신청방법, 문의처, 시행기관, 링크 |
| 조회 가능 여부 | 후보. 통합 API보다 기관별 파일/웹 안내가 흩어져 있을 가능성 |
| 신청 가능 여부 | 공개 API 신청 기능 가능성 낮음. 개인정보/자격확인 필요 |
| 개인정보 필요 여부 | 제도 정보는 없음. 감면 대상 확인/신청은 개인정보 필요 |
| 인증 방식 | 추가 확인 필요 |
| 응답 형식 | 추가 확인 필요 |
| 트래픽 제한 | 추가 확인 필요 |
| 갱신주기 | 제도별 수시/연간 가능성 |
| 상업적 이용 가능성 | 이용조건 확인 필요 |
| MVP 활용 가능성 | 중간. 상담 체크리스트와 누락 방지에 유용 |
| 우선순위 | P3 |
| 비고 | 복지서비스 API 검색 결과의 `에너지` 태그와 연결해 시작 가능. |

## MVP Integration Strategy

1. **P0: Keep current welfare service APIs as the main candidate engine.**
   - Central and local welfare APIs already provide enough fields for 상담 후보 리스트.
   - Continue treating results as service candidates, not eligibility decisions.

2. **P1: Add facility and care institution lookup next.**
   - 상담자가 “무슨 제도가 있는지” 다음으로 필요로 하는 것은 “어디에 문의하거나 방문할지”이다.
   - 사회복지시설 and 장기요양기관 data should be modeled as `FacilityCandidate`, separate from `BenefitCandidate`.

3. **P2: Add health/dementia and senior job sources only after schema separation.**
   - These are domain-specific channels, not general benefit catalogs.

4. **P3: Keep pension, insurance, utility discount APIs as checklist supplements.**
   - They are useful, but many personal checks require authentication and consent.

## Proposed Normalized Schemas

### BenefitCandidate

```ts
type BenefitCandidate = {
  id: string;
  source: "national" | "local" | "subsidy24" | "other";
  name: string;
  provider: string;
  region?: string;
  summary: string;
  targetSummary?: string;
  selectionCriteria?: string;
  benefitContent?: string;
  applicationMethods?: string;
  contacts?: string[];
  links?: string[];
  tags: string[];
  raw: unknown;
};
```

### FacilityCandidate

```ts
type FacilityCandidate = {
  id: string;
  source: "social-welfare-facility" | "long-term-care" | "health-center" | "dementia-center";
  name: string;
  facilityType: string;
  provider?: string;
  region: string;
  address: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  tags: string[];
  raw: unknown;
};
```

## Open Questions

- Which data.go.kr datasets provide true REST APIs versus file downloads only?
- Are traffic limits sufficient for 상담 화면 autocomplete/search?
- Which datasets allow commercial use without separate approval?
- Which facility datasets include coordinates and which only include addresses?
- Do local welfare APIs accept region names consistently across all 시도/시군구?
- Does `lifeArray=006` behave consistently in central and local welfare endpoints?

## Sources Checked

- 공공데이터포털 main page confirms API/data discovery categories, social welfare category, service types including REST/SOAP/download, and public data request route: <https://www.data.go.kr/>
- Current project-verified endpoints:
  - `https://apis.data.go.kr/B554287/NationalWelfareInformationsV001`
  - `https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations`
- 보건복지부 site exposes public data/open data navigation under 정보공개 > 공공데이터개방: <https://www.mohw.go.kr/>
- 국민건강보험공단 장기요양보험 public site checked as an institution source: <https://www.longtermcare.or.kr/>
- 국민연금공단 public site checked as an institution source and separates public information from personal civil services: <https://www.nps.or.kr/>
- 한국노인인력개발원 public site checked as an institution source for senior jobs: <https://www.kordi.or.kr/>
