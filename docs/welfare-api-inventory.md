# Welfare API Inventory

작성일: 2026-07-09

Sprint 2 scope: API Discovery only.  
This document is an integration inventory for public APIs and public datasets that may support an elderly welfare and care consultation system.

No code changes are included in this sprint.

## Inventory Rules

- **Confirmed REST API**: base URL and endpoint are known and have either been integrated in Pigbar or are explicit enough to plan implementation.
- **REST API Candidate**: likely useful, but base URL, endpoint, request parameters, or license still need data.go.kr detail-page verification.
- **File / Excel / PDF Data**: useful public data, but not a direct service API. These should be handled by import jobs, not live user search.
- **개인정보 포함 여부** refers to the public API payload. It does not mean the originating institution has no personal systems.
- **신청 기능 제공 여부** is intentionally strict. If the API only exposes information and does not submit an application, it is `No`.
- **수급 자격 판정** is out of scope. Public APIs can support 상담 후보 정리, not final eligibility decisions.

## Status Summary

| Priority | API / Dataset | Status | Next Action |
|---|---|---|---|
| P0 | 한국사회보장정보원_중앙부처복지서비스 | Confirmed REST API, integrated | Keep as primary benefit catalog |
| P0 | 한국사회보장정보원_지자체복지서비스 | Confirmed REST API, integrated | Keep as local benefit catalog |
| P1 | 사회복지시설 관련 API | REST API candidate / file candidate | Verify exact data.go.kr item |
| P1 | 장기요양기관 관련 API | REST API candidate | Verify NHIS / data.go.kr endpoints |
| P1 | 치매안심센터 / 보건소 기관 API | REST API candidate / file candidate | Verify 기관 목록 API and geodata |
| P2 | 노인일자리 관련 API | REST API candidate / file candidate | Verify current recruiting data availability |
| P2 | 보조금24 / 정부혜택 API | Candidate, likely constrained | Verify public catalog vs personal 맞춤 조회 |
| P3 | 국민연금 공개 API | Candidate | Use only public guidance or branch data |
| P3 | 건강보험 / 장기요양보험 공개 API | Candidate | Separate public facility data from personal insurance data |
| P3 | 에너지 / 통신 요금 감면 data | Fragmented candidate | Use as checklist supplement |

## Confirmed REST APIs

### 1. 한국사회보장정보원_중앙부처복지서비스

| 항목 | 내용 |
|---|---|
| API명 | 한국사회보장정보원_중앙부처복지서비스 |
| 제공기관 | 한국사회보장정보원 / 복지로 계열 |
| data.go.kr URL | data.go.kr 상세 페이지 재확인 필요. Current verified project endpoint uses data.go.kr gateway. |
| Base URL | `https://apis.data.go.kr/B554287/NationalWelfareInformationsV001` |
| 주요 Endpoint | `GET /NationalWelfarelistV001`, `GET /NationalWelfaredetailedV001` |
| 인증 방식 | `serviceKey` query parameter, `DATA_GO_KR_SERVICE_KEY` |
| 응답 형식 | XML |
| 호출 제한 | data.go.kr 활용신청/운영정책 확인 필요 |
| 갱신주기 | data.go.kr 상세 페이지 확인 필요 |
| 제공 데이터 요약 | 중앙부처 복지서비스 목록 및 상세. 서비스명, 소관부처, 대상, 선정기준, 지원내용, 신청방법, 문의처, 근거법령 제공. |
| 주요 필드 | `servId`, `servNm`, `jurMnofNm`, `servDgst`, `wlfareInfoOutlCn`, `tgtrDtlCn`, `slctCritCn`, `alwServCn`, `applmetList`, `inqplCtadrList`, `baslawList`, `lifeArray`, `intrsThemaArray`, `trgterIndvdlArray`, `onapPsbltYn` |
| 개인정보 포함 여부 | No. 제도/서비스 공개 정보. 개인별 수급 자격 조회 아님. |
| 신청 기능 제공 여부 | No. 정보 조회 전용. |
| 현재 연동 상태 | Integrated. `/api/welfare/national/list`, `/api/welfare/national/detail` |
| 연동 난이도 | Low. XML parsing and normalization already implemented. |
| MVP 활용도 | Very High. 상담용 후보 리스트의 기본 축. |
| 우선순위 | P0 |
| 비고 | `lifeArray=006` 노년 필터를 옵션으로 전달 중. 개인별 가능/불가능 판정 금지. |

### 2. 한국사회보장정보원_지자체복지서비스

| 항목 | 내용 |
|---|---|
| API명 | 한국사회보장정보원_지자체복지서비스 |
| 제공기관 | 한국사회보장정보원 / 복지로 계열 |
| data.go.kr URL | data.go.kr 상세 페이지 재확인 필요. Current verified project endpoint uses data.go.kr gateway. |
| Base URL | `https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations` |
| 주요 Endpoint | `GET /LcgvWelfarelist`, `GET /LcgvWelfaredetailed` |
| 인증 방식 | `serviceKey` query parameter, `DATA_GO_KR_SERVICE_KEY` |
| 응답 형식 | XML |
| 호출 제한 | data.go.kr 활용신청/운영정책 확인 필요 |
| 갱신주기 | data.go.kr 상세 페이지 확인 필요 |
| 제공 데이터 요약 | 지자체 복지서비스 목록 및 상세. 지역, 서비스명, 대상, 선정기준, 지원내용, 신청방법, 문의처 등 제공. |
| 주요 필드 | `servId`, `servNm`, `jurOrgNm`, `ctpvNm`, `sggNm`, `wlfareInfoOutlCn`, `tgtrDtlCn`, `slctCritCn`, `alwServCn`, `lifeArray`, `intrsThemaArray`, `trgterIndvdlArray`, `onapPsbltYn` |
| 개인정보 포함 여부 | No. 지역 제도/서비스 공개 정보. 개인별 수급 자격 조회 아님. |
| 신청 기능 제공 여부 | No. 정보 조회 전용. |
| 현재 연동 상태 | Integrated. `/api/welfare/local/list`, `/api/welfare/local/detail` |
| 연동 난이도 | Low. National normalizer reused with local fields. |
| MVP 활용도 | Very High. 중앙정부 결과와 병합해 지역 상담 후보를 만들 수 있음. |
| 우선순위 | P0 |
| 비고 | 현재 기본 지역은 인천광역시 / 미추홀구. `lifeArray=006` 노년 필터를 옵션으로 전달 중. |

## REST API Candidates

### 3. 사회복지시설 관련 API

| 항목 | 내용 |
|---|---|
| API명 | 사회복지시설 / 노인복지시설 관련 API |
| 제공기관 | 보건복지부, 한국사회보장정보원, 지자체 중 하나일 가능성 |
| data.go.kr URL | data.go.kr에서 `사회복지시설`, `노인복지시설`, `복지시설` 키워드 상세 확인 필요 |
| Base URL | 확인 필요 |
| 주요 Endpoint | 확인 필요 |
| 인증 방식 | data.go.kr service key 예상 |
| 응답 형식 | REST API면 XML/JSON 가능. 파일 데이터일 가능성도 있음 |
| 호출 제한 | 확인 필요 |
| 갱신주기 | 확인 필요. 시설 정보는 월/분기/수시 가능성 |
| 제공 데이터 요약 | 시설명, 시설유형, 주소, 전화번호, 운영기관, 정원/현원, 위도/경도 등 기관 안내 데이터 가능성 |
| 주요 필드 | 시설명, 시설종류, 주소, 전화번호, 운영주체, 정원, 현원, 위도, 경도 |
| 개인정보 포함 여부 | No. 시설 공개 정보 중심 예상 |
| 신청 기능 제공 여부 | No |
| 현재 연동 상태 | Not integrated |
| 연동 난이도 | Medium. API면 쉬우나 파일형이면 import/정규화 필요 |
| MVP 활용도 | High. 복지서비스 후보 다음 단계로 실제 문의처/시설 referral에 필요 |
| 우선순위 | P1 |
| 비고 | BenefitCandidate와 별도 `FacilityCandidate` 스키마 권장. |

### 4. 장기요양기관 관련 API

| 항목 | 내용 |
|---|---|
| API명 | 장기요양기관 / 노인장기요양기관 관련 API |
| 제공기관 | 국민건강보험공단 / 노인장기요양보험 계열 |
| data.go.kr URL | data.go.kr에서 `장기요양기관`, `노인장기요양`, `장기요양보험` 키워드 상세 확인 필요 |
| Base URL | 확인 필요 |
| 주요 Endpoint | 확인 필요 |
| 인증 방식 | data.go.kr service key 또는 공단 공개 API 인증 예상 |
| 응답 형식 | 확인 필요 |
| 호출 제한 | 확인 필요 |
| 갱신주기 | 확인 필요 |
| 제공 데이터 요약 | 장기요양기관명, 기관기호, 급여종류, 주소, 전화번호, 평가등급, 정원/현원 등 가능성 |
| 주요 필드 | 기관명, 기관기호, 급여종류, 주소, 연락처, 평가등급, 정원, 현원 |
| 개인정보 포함 여부 | 기관 검색은 No. 개인 장기요양등급/급여내역은 Yes이며 MVP 제외 |
| 신청 기능 제공 여부 | No. 장기요양 인정 신청은 별도 민원/인증 절차 |
| 현재 연동 상태 | Not integrated |
| 연동 난이도 | Medium |
| MVP 활용도 | High. 케어 상담에서 시설/재가 서비스 연결 가치가 큼 |
| 우선순위 | P1 |
| 비고 | 개인 등급 판정 API로 사용 금지. 공개 기관 안내만 사용. |

### 5. 치매안심센터 / 보건소 기관 API

| 항목 | 내용 |
|---|---|
| API명 | 치매안심센터 / 보건소 기관 목록 API |
| 제공기관 | 중앙치매센터, 보건복지부, 질병관리청, 지방자치단체 가능성 |
| data.go.kr URL | data.go.kr에서 `치매안심센터`, `보건소`, `치매센터` 키워드 상세 확인 필요 |
| Base URL | 확인 필요 |
| 주요 Endpoint | 확인 필요 |
| 인증 방식 | data.go.kr service key 예상 |
| 응답 형식 | API면 XML/JSON. 기관 목록 CSV 가능성도 있음 |
| 호출 제한 | 확인 필요 |
| 갱신주기 | 확인 필요 |
| 제공 데이터 요약 | 센터명, 주소, 전화번호, 관할지역, 운영시간, 홈페이지, 좌표 등 |
| 주요 필드 | 기관명, 주소, 전화번호, 시도, 시군구, 위도, 경도, 홈페이지 |
| 개인정보 포함 여부 | No. 기관 공개 정보. 상담예약/검진신청은 별도 개인정보 영역 |
| 신청 기능 제공 여부 | No |
| 현재 연동 상태 | Not integrated |
| 연동 난이도 | Medium |
| MVP 활용도 | High. 보호자 상담에서 가까운 첫 문의처로 유용 |
| 우선순위 | P1 |
| 비고 | 치매안심센터와 보건소는 같은 의료/돌봄 레이어지만 source 분리 권장. |

### 6. 노인일자리 관련 API

| 항목 | 내용 |
|---|---|
| API명 | 노인일자리 사업 / 수행기관 / 모집정보 API |
| 제공기관 | 한국노인인력개발원, 보건복지부, 지자체 가능성 |
| data.go.kr URL | data.go.kr에서 `노인일자리`, `시니어 일자리`, `노인인력` 키워드 상세 확인 필요 |
| Base URL | 확인 필요 |
| 주요 Endpoint | 확인 필요 |
| 인증 방식 | 확인 필요 |
| 응답 형식 | 확인 필요. API 또는 파일/게시판성 데이터 가능성 |
| 호출 제한 | 확인 필요 |
| 갱신주기 | 모집/사업 정보는 수시 가능성 |
| 제공 데이터 요약 | 사업명, 수행기관, 지역, 모집기간, 사업유형, 참여조건, 문의처 |
| 주요 필드 | 사업명, 기관명, 지역, 모집기간, 사업유형, 대상, 문의처 |
| 개인정보 포함 여부 | 공개 사업 정보는 No. 개인 신청/참여 여부는 Yes이며 MVP 제외 |
| 신청 기능 제공 여부 | No 예상 |
| 현재 연동 상태 | Not integrated |
| 연동 난이도 | Medium~High. 모집정보 시점성과 데이터 형태 확인 필요 |
| MVP 활용도 | Medium~High. 상담 태그 `일자리`와 연결 가능 |
| 우선순위 | P2 |
| 비고 | 실시간 모집 여부를 다루려면 갱신 정책이 중요. |

### 7. 보조금24 / 정부혜택 관련 API

| 항목 | 내용 |
|---|---|
| API명 | 보조금24 / 정부혜택 / 정부서비스 관련 공개 API |
| 제공기관 | 행정안전부 / 정부24 계열 가능성 |
| data.go.kr URL | data.go.kr에서 `보조금24`, `정부혜택`, `정부서비스`, `수혜서비스` 키워드 상세 확인 필요 |
| Base URL | 확인 필요 |
| 주요 Endpoint | 확인 필요 |
| 인증 방식 | 공개 카탈로그 API면 service key. 개인 맞춤 조회면 정부24 로그인/본인인증 가능성 |
| 응답 형식 | 확인 필요 |
| 호출 제한 | 확인 필요 |
| 갱신주기 | 확인 필요 |
| 제공 데이터 요약 | 정부 혜택/보조금/서비스 카탈로그 가능성. 개인 맞춤 혜택은 인증 필요 가능성 큼 |
| 주요 필드 | 서비스명, 소관기관, 지원대상, 지원내용, 신청방법, 온라인신청 URL |
| 개인정보 포함 여부 | 공개 카탈로그는 No. 개인 맞춤 보조금 조회는 Yes 가능성 |
| 신청 기능 제공 여부 | 공개 API에서는 No 예상 |
| 현재 연동 상태 | Not integrated |
| 연동 난이도 | High. 공개 카탈로그와 개인 맞춤 조회 경계 확인 필요 |
| MVP 활용도 | Medium. 중앙/지자체 복지서비스 중복 여부도 확인 필요 |
| 우선순위 | P2 |
| 비고 | 개인별 “받을 수 있음” 판정 API로 오해하지 말 것. |

### 8. 국민연금 공개 API

| 항목 | 내용 |
|---|---|
| API명 | 국민연금 지사/노후준비/제도 공개 API |
| 제공기관 | 국민연금공단 |
| data.go.kr URL | data.go.kr에서 `국민연금`, `노후준비`, `연금 지사` 키워드 상세 확인 필요 |
| Base URL | 확인 필요 |
| 주요 Endpoint | 확인 필요 |
| 인증 방식 | 공개 API면 service key. 개인 연금 정보는 공단 인증 필요 |
| 응답 형식 | 확인 필요 |
| 호출 제한 | 확인 필요 |
| 갱신주기 | 확인 필요 |
| 제공 데이터 요약 | 지사 정보, 노후준비 정보, 통계/제도 안내 가능성 |
| 주요 필드 | 지사명, 주소, 전화번호, 제도명, 안내 URL, 통계 항목 |
| 개인정보 포함 여부 | 공개 정보는 No. 개인 예상연금/가입이력은 Yes이며 MVP 제외 |
| 신청 기능 제공 여부 | No |
| 현재 연동 상태 | Not integrated |
| 연동 난이도 | Medium |
| MVP 활용도 | Low~Medium. 복지 후보보다는 상담 부가 정보 |
| 우선순위 | P3 |
| 비고 | 개인 연금액 조회, 가입내역 조회는 연동 대상 아님. |

### 9. 건강보험 / 장기요양보험 공개 API

| 항목 | 내용 |
|---|---|
| API명 | 건강보험 / 장기요양보험 공개 API |
| 제공기관 | 국민건강보험공단 |
| data.go.kr URL | data.go.kr에서 `건강보험`, `장기요양보험`, `요양기관`, `장기요양기관` 키워드 상세 확인 필요 |
| Base URL | 확인 필요 |
| 주요 Endpoint | 확인 필요 |
| 인증 방식 | 공개 API면 service key. 개인 보험 자격/급여/납부 정보는 공단 인증 필요 |
| 응답 형식 | 확인 필요 |
| 호출 제한 | 확인 필요 |
| 갱신주기 | 확인 필요 |
| 제공 데이터 요약 | 제도 안내, 기관 정보, 통계, 일부 요양기관/장기요양기관 정보 가능성 |
| 주요 필드 | 기관명, 주소, 전화번호, 보험/급여 구분, 통계 항목, 평가 정보 |
| 개인정보 포함 여부 | 공개 정보는 No. 개인 자격/급여/납부 내역은 Yes이며 MVP 제외 |
| 신청 기능 제공 여부 | No |
| 현재 연동 상태 | Not integrated |
| 연동 난이도 | Medium~High |
| MVP 활용도 | Medium. 장기요양기관 데이터와 겹칠 가능성 |
| 우선순위 | P3 |
| 비고 | 개인 건강보험료/감면 여부 판정 금지. |

### 10. 에너지 / 통신 요금 감면 관련 API

| 항목 | 내용 |
|---|---|
| API명 | 에너지바우처, 전기/가스/통신 요금 감면 관련 API |
| 제공기관 | 산업통상자원부, 한국에너지공단, 한국전력, 도시가스사, 과기정통부/통신사 등 가능성 |
| data.go.kr URL | data.go.kr에서 `에너지바우처`, `요금감면`, `전기요금 복지할인`, `통신요금 감면` 키워드 상세 확인 필요 |
| Base URL | 확인 필요 |
| 주요 Endpoint | 확인 필요 |
| 인증 방식 | 확인 필요 |
| 응답 형식 | 확인 필요. 제도별로 파일/웹 안내일 가능성 높음 |
| 호출 제한 | 확인 필요 |
| 갱신주기 | 연간/수시 가능성 |
| 제공 데이터 요약 | 감면 제도명, 대상, 지원내용, 신청방법, 문의처, 시행기관 |
| 주요 필드 | 제도명, 대상, 지원내용, 신청방법, 문의처, 링크 |
| 개인정보 포함 여부 | 제도 정보는 No. 대상 확인/신청은 Yes 가능성 |
| 신청 기능 제공 여부 | No 예상 |
| 현재 연동 상태 | Not integrated |
| 연동 난이도 | High. 기관별로 파편화 가능성 |
| MVP 활용도 | Medium. 상담 체크리스트 보조용 |
| 우선순위 | P3 |
| 비고 | 현재 중앙/지자체 복지서비스 검색의 `에너지` 상담 태그와 먼저 연결 가능. |

## File / Excel / PDF Data Candidates

These sources are useful, but they should not be treated as live APIs until a REST endpoint is confirmed.

| 데이터명 | 제공기관 | 예상 형식 | 활용 가능성 | 주의사항 |
|---|---|---|---|---|
| 사회복지시설 현황 | 보건복지부 / 지자체 | CSV/XLSX/PDF 가능 | 시설 후보 DB 구축 | 주소 정제, 폐업/변경 갱신 필요 |
| 노인복지시설 현황 | 보건복지부 / 지자체 | CSV/XLSX/PDF 가능 | 노인 케어 시설 후보 | 시설 유형 표준화 필요 |
| 치매안심센터 현황 | 중앙치매센터 / 지자체 | CSV/XLSX/API 후보 | 보호자 상담처 안내 | 운영시간/전화번호 갱신 확인 필요 |
| 보건소 현황 | 보건복지부 / 질병관리청 / 지자체 | CSV/XLSX/API 후보 | 지역 건강 상담 연결 | 보건소/보건지소/보건진료소 구분 필요 |
| 노인일자리 수행기관/사업 현황 | 한국노인인력개발원 / 지자체 | CSV/XLSX/게시판 가능 | 일자리 상담 후보 | 모집기간이 지나면 가치 하락 |
| 에너지/통신 감면 제도 안내 | 기관별 웹/PDF 가능 | PDF/HTML 가능 | 체크리스트 보조 | 개인 자격 확인 불가 |

## Recommended Normalized Types

### BenefitCandidate

```ts
type BenefitCandidate = {
  id: string;
  source: "national" | "local" | "subsidy24" | "energy" | "telecom" | "other";
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

## Next Integration Candidate Top 5

1. **장기요양기관 관련 API**
   - Why: 고령자 케어 상담에서 제도 후보 다음으로 기관 연결이 중요하다.
   - Expected product value: 재가/시설급여 기관 후보, 보호자 문의처 안내.
   - Main risk: 정확한 API endpoint and data license verification.

2. **사회복지시설 / 노인복지시설 API or dataset**
   - Why: 복지서비스와 실제 시설 연결을 보완한다.
   - Expected product value: 상담자가 지역 기반 기관 후보를 빠르게 설명할 수 있음.
   - Main risk: 파일 데이터면 import pipeline 필요.

3. **치매안심센터 / 보건소 기관 API or dataset**
   - Why: 노인 상담에서 치매/건강/보호자 문의가 자주 발생할 가능성이 높다.
   - Expected product value: 가까운 첫 상담처 안내.
   - Main risk: 기관 데이터 freshness and location normalization.

4. **노인일자리 관련 API or dataset**
   - Why: 현재 상담 태그 `일자리`를 실제 사업/기관 정보와 연결할 수 있다.
   - Expected product value: 활동 가능 노인 대상 상담 후보 확장.
   - Main risk: 모집기간, 지역, 사업유형이 수시로 바뀜.

5. **보조금24 / 정부혜택 공개 카탈로그**
   - Why: 중앙/지자체 복지서비스에서 누락된 생활형 혜택을 보완할 수 있다.
   - Expected product value: 폭넓은 혜택 탐색.
   - Main risk: 개인 맞춤 조회는 개인정보/인증 영역이라 MVP 범위 밖.

## Implementation Notes for Later Sprints

- Keep `DATA_GO_KR_SERVICE_KEY` server-side only.
- Add each external API behind `/api/welfare/{source}/...`, never directly from client.
- Separate live API lookup from file import sources.
- Store raw payload for debugging, but normalize user-facing cards.
- Keep a strict boundary between:
  - service information,
  - facility information,
  - personal eligibility,
  - application submission.
- MVP should only do the first two unless consent/auth/legal review is complete.

## References To Verify During Integration

- 공공데이터포털: <https://www.data.go.kr/>
- Current project-verified gateway endpoints:
  - `https://apis.data.go.kr/B554287/NationalWelfareInformationsV001`
  - `https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations`
- 보건복지부 공공데이터 개방 navigation: <https://www.mohw.go.kr/>
- 국민건강보험공단 노인장기요양보험: <https://www.longtermcare.or.kr/>
- 국민연금공단: <https://www.nps.or.kr/>
- 한국노인인력개발원: <https://www.kordi.or.kr/>
