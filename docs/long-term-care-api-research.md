# Long-Term Care API Facts

작성일: 2026-07-09

목표: 장기요양기관 조회에 사용할 수 있는 공개 데이터/API 후보를 **Fact 기준**으로 정리한다.

판정값은 `YES`, `NO`, `UNKNOWN`만 사용한다.

범위:

- 공개 장기요양기관 정보
- 기관명, 주소, 전화번호, 급여종류, 평가등급, 지역 검색 가능성

제외:

- 개인 장기요양등급 조회
- 개인 급여내역 조회
- 개인 인정신청 진행상태
- 인증 기반 민원 조회

## Fact Matrix

| 항목 | 노인장기요양보험 기관찾기 | 장기요양기관 평가정보 | data.go.kr 장기요양기관 후보 | 사회복지/노인복지시설 현황 | HIRA 병원/약국 API |
|---|---:|---:|---:|---:|---:|
| 공식 기관 사이트 존재 | YES | YES | YES | YES | YES |
| 공개 기관 정보 | YES | YES | UNKNOWN | YES | YES |
| 개인 등급 조회 제외 가능 | YES | YES | YES | YES | YES |
| REST API 확인 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | YES |
| 공식 Endpoint 확인 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| data.go.kr 상세 URL 확인 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| Base URL 확인 | NO | NO | NO | NO | NO |
| Service Key 인증 확인 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| XML 응답 확인 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| JSON 응답 확인 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| CSV/XLSX 파일 가능성 | UNKNOWN | UNKNOWN | UNKNOWN | YES | UNKNOWN |
| 기관명 제공 | YES | YES | UNKNOWN | YES | YES |
| 주소 제공 | YES | UNKNOWN | UNKNOWN | YES | YES |
| 전화번호 제공 | YES | UNKNOWN | UNKNOWN | YES | YES |
| 지역 검색 가능 | YES | UNKNOWN | UNKNOWN | UNKNOWN | YES |
| 급여종류 필터 가능 | YES | UNKNOWN | UNKNOWN | NO | NO |
| 평가등급 제공 | UNKNOWN | YES | UNKNOWN | NO | NO |
| 좌표 제공 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | YES |
| 호출 제한 확인 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| 갱신주기 확인 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| 상업적 사용 확인 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| 웹 스크래핑 권장 | NO | NO | NO | NO | NO |
| MVP 직접 연동 추천 | UNKNOWN | UNKNOWN | UNKNOWN | NO | NO |
| 후보 유지 | YES | YES | YES | YES | YES |

## 1. 노인장기요양보험 기관찾기

| 조사 항목 | 값 |
|---|---|
| 데이터명/API명 | 노인장기요양보험 장기요양기관 찾기 |
| 제공기관 | 국민건강보험공단 / 노인장기요양보험 |
| URL | `https://www.longtermcare.or.kr/` |
| REST API | UNKNOWN |
| 공식 Endpoint | UNKNOWN |
| Base URL | UNKNOWN |
| 인증 방식 | UNKNOWN |
| 응답 형식 | UNKNOWN |
| 기관명 | YES |
| 주소 | YES |
| 전화번호 | YES |
| 지역 검색 | YES |
| 급여종류 필터 | YES |
| 평가등급 | UNKNOWN |
| 좌표 | UNKNOWN |
| 호출 제한 | UNKNOWN |
| 갱신주기 | UNKNOWN |
| 상업적 사용 | UNKNOWN |
| 개인정보 포함 | NO |
| 신청 기능 | NO |
| 웹 스크래핑 권장 | NO |
| 연동 난이도 확정 | NO |
| 추천 | UNKNOWN |

Fact:

- 노인장기요양보험 공식 사이트는 존재한다: YES
- 사이트에서 장기요양기관을 찾는 공개 검색 기능은 존재한다: YES
- 외부 개발자용 공식 REST API는 이 조사 환경에서 확인되지 않았다: UNKNOWN
- 개인 장기요양등급/급여내역 조회와는 분리할 수 있다: YES

## 2. 장기요양기관 평가정보 / 평가결과

| 조사 항목 | 값 |
|---|---|
| 데이터명/API명 | 장기요양기관 평가정보 / 평가결과 |
| 제공기관 | 국민건강보험공단 / 노인장기요양보험 |
| URL | `https://www.longtermcare.or.kr/` |
| REST API | UNKNOWN |
| 공식 Endpoint | UNKNOWN |
| Base URL | UNKNOWN |
| 인증 방식 | UNKNOWN |
| 응답 형식 | UNKNOWN |
| 기관명 | YES |
| 주소 | UNKNOWN |
| 전화번호 | UNKNOWN |
| 지역 검색 | UNKNOWN |
| 급여종류 필터 | UNKNOWN |
| 평가등급 | YES |
| 좌표 | UNKNOWN |
| 호출 제한 | UNKNOWN |
| 갱신주기 | UNKNOWN |
| 상업적 사용 | UNKNOWN |
| 개인정보 포함 | NO |
| 신청 기능 | NO |
| 웹 스크래핑 권장 | NO |
| 연동 난이도 확정 | NO |
| 추천 | UNKNOWN |

Fact:

- 평가정보는 공개 기관 정보 범주에 들어갈 수 있다: YES
- 평가등급/평가결과는 개인 급여내역이 아니다: YES
- 공식 API Endpoint는 확인되지 않았다: UNKNOWN
- 평가정보만으로 기관 추천을 단정하면 안 된다: YES

## 3. data.go.kr 장기요양기관 후보

| 조사 항목 | 값 |
|---|---|
| 데이터명/API명 | 장기요양기관 / 노인장기요양기관 / 장기요양기관 현황 후보 |
| 제공기관 | 국민건강보험공단 또는 보건복지부 후보 |
| URL | `https://www.data.go.kr/` |
| REST API | UNKNOWN |
| 공식 Endpoint | UNKNOWN |
| Base URL | UNKNOWN |
| 인증 방식 | UNKNOWN |
| 응답 형식 | UNKNOWN |
| 기관명 | UNKNOWN |
| 주소 | UNKNOWN |
| 전화번호 | UNKNOWN |
| 지역 검색 | UNKNOWN |
| 급여종류 필터 | UNKNOWN |
| 평가등급 | UNKNOWN |
| 좌표 | UNKNOWN |
| 호출 제한 | UNKNOWN |
| 갱신주기 | UNKNOWN |
| 상업적 사용 | UNKNOWN |
| 개인정보 포함 | UNKNOWN |
| 신청 기능 | UNKNOWN |
| 웹 스크래핑 권장 | NO |
| 연동 난이도 확정 | NO |
| 추천 | UNKNOWN |

Fact:

- 공공데이터포털은 REST/SOAP/다운로드 데이터 유형을 제공한다: YES
- 장기요양기관 관련 정확한 publicDataPk는 이 조사 환경에서 확인되지 않았다: UNKNOWN
- 실제 REST API인지 파일 데이터인지는 확인되지 않았다: UNKNOWN
- 활용신청, 호출 제한, 갱신주기는 확인되지 않았다: UNKNOWN

## 4. 사회복지시설 / 노인복지시설 현황

| 조사 항목 | 값 |
|---|---|
| 데이터명/API명 | 사회복지시설 현황 / 노인복지시설 현황 |
| 제공기관 | 보건복지부 / 지자체 후보 |
| URL | `https://www.data.go.kr/`, `https://www.mohw.go.kr/` |
| REST API | UNKNOWN |
| 공식 Endpoint | UNKNOWN |
| Base URL | UNKNOWN |
| 인증 방식 | UNKNOWN |
| 응답 형식 | UNKNOWN |
| CSV/XLSX | YES |
| 기관명 | YES |
| 주소 | YES |
| 전화번호 | YES |
| 지역 검색 | UNKNOWN |
| 급여종류 필터 | NO |
| 평가등급 | NO |
| 좌표 | UNKNOWN |
| 호출 제한 | UNKNOWN |
| 갱신주기 | UNKNOWN |
| 상업적 사용 | UNKNOWN |
| 개인정보 포함 | NO |
| 신청 기능 | NO |
| 웹 스크래핑 권장 | NO |
| 연동 난이도 확정 | NO |
| 추천 | NO |

Fact:

- 사회복지시설/노인복지시설 정보는 공개 시설 정보로 볼 수 있다: YES
- 장기요양기관 급여종류 필터를 대체하지 못한다: YES
- 장기요양기관 API의 대체재가 아니다: YES
- 보조 시설 데이터로는 유지할 수 있다: YES

## 5. HIRA 병원/약국 API

| 조사 항목 | 값 |
|---|---|
| 데이터명/API명 | 병원정보서비스 / 약국정보서비스 계열 |
| 제공기관 | 건강보험심사평가원 |
| URL | `https://www.hira.or.kr/`, `https://www.data.go.kr/` |
| REST API | YES |
| 공식 Endpoint | UNKNOWN |
| Base URL | UNKNOWN |
| 인증 방식 | UNKNOWN |
| 응답 형식 | UNKNOWN |
| 기관명 | YES |
| 주소 | YES |
| 전화번호 | YES |
| 지역 검색 | YES |
| 급여종류 필터 | NO |
| 평가등급 | NO |
| 좌표 | YES |
| 호출 제한 | UNKNOWN |
| 갱신주기 | UNKNOWN |
| 상업적 사용 | UNKNOWN |
| 개인정보 포함 | NO |
| 신청 기능 | NO |
| 웹 스크래핑 권장 | NO |
| 연동 난이도 확정 | NO |
| 추천 | NO |

Fact:

- HIRA 병원/약국 API 계열은 장기요양기관 전용 데이터가 아니다: YES
- 병원/약국 위치 안내에는 사용할 수 있다: YES
- 장기요양기관 조회 목적의 1순위 데이터는 아니다: YES
- 장기요양 급여종류 필터는 제공하지 않는다: YES

## Final Fact Decision

| 결정 항목 | 값 |
|---|---|
| 지금 바로 연동 가능한 공식 장기요양기관 REST API 확인 | NO |
| 노인장기요양보험 공식 기관검색 존재 | YES |
| 기관명/주소/전화번호 공개 가능성 | YES |
| 급여종류 필터 필요 | YES |
| 평가등급 데이터 필요 | YES |
| 개인 장기요양등급 조회 포함 | NO |
| 개인 급여내역 조회 포함 | NO |
| 웹 스크래핑으로 진행 | NO |
| data.go.kr 상세 재확인 필요 | YES |
| 다음 단계는 코드 연동 | NO |
| 다음 단계는 공식 API/파일 Fact 확인 | YES |

## Next Fact Checks

다음 확인은 브라우저 또는 data.go.kr 로그인/검색 환경에서 수행한다.

| 확인할 것 | 기대 결과 |
|---|---|
| data.go.kr에서 `장기요양기관` 검색 | YES / NO |
| 서비스유형 `REST` 데이터 존재 | YES / NO |
| 제공기관이 국민건강보험공단인 데이터 존재 | YES / NO |
| 기관명/주소/전화번호 필드 존재 | YES / NO |
| 급여종류 필드 존재 | YES / NO |
| 평가등급 필드 존재 | YES / NO |
| 좌표 필드 존재 | YES / NO |
| 상업적 이용 가능 | YES / NO |
| 호출 제한 확인 | YES / NO |
| 갱신주기 확인 | YES / NO |

## Sources Checked

| Source | 확인 결과 |
|---|---|
| 공공데이터포털 `https://www.data.go.kr/` | REST/SOAP/다운로드 서비스 유형 존재: YES |
| 국민건강보험공단 노인장기요양보험 `https://www.longtermcare.or.kr/` | 공식 장기요양보험 사이트 존재: YES |
| 보건복지부 `https://www.mohw.go.kr/` | 공공데이터 개방 경로 존재: YES |
| 건강보험심사평가원 `https://www.hira.or.kr/` | 의료기관 데이터 기관 존재: YES |
