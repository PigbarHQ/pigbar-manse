# Facility Data Sources

Pigbar Welfare Engine의 지역 기관/시설 찾기 기능을 위한 데이터 소스 조사표이다.

현재 `/welfare-facilities` 화면은 실제 기관 데이터를 임의로 만들지 않는다. 공식 API 또는 공개 데이터가 확인되지 않은 기관 종류는 화면에서 “해당 기관 데이터 소스 확인 필요”로 표시한다.

국민건강보험공단 장기요양기관 검색 서비스는 2026-07-09 기준 공공데이터포털 활용 신청 화면과 활용가이드 문서에서 확인했다.

| 기관 종류 | 후보 데이터/API명 | 제공기관 | data.go.kr URL | REST API 여부 | 파일 데이터 여부 | 주요 필드 | 지역 검색 가능 여부 | 좌표 제공 여부 | 연락처 제공 여부 | 연동 우선순위 | 비고 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 장기요양기관 | 국민건강보험공단 장기요양기관 검색 서비스 | 국민건강보험공단 | https://www.data.go.kr / B550928 | YES | UNKNOWN | longTermAdminSym, serviceKind, adminNm, siDoCd, siGunGuCd, locTelNo_1~3 | YES | UNKNOWN | YES | 높음 | 목록 endpoint: `https://apis.data.go.kr/B550928/searchLtcInsttService02/getLtcInsttSeachList02` |
| 주야간보호 | 국민건강보험공단 장기요양기관 검색 서비스 | 국민건강보험공단 | https://www.data.go.kr / B550928 | YES | UNKNOWN | longTermAdminSym, serviceKind, adminNm, siDoCd, siGunGuCd, locTelNo_1~3 | YES | UNKNOWN | YES | 높음 | 기관유형 코드 `B03`, `C03` 기준 조회 |
| 방문요양 | 국민건강보험공단 장기요양기관 검색 서비스 | 국민건강보험공단 | https://www.data.go.kr / B550928 | YES | UNKNOWN | longTermAdminSym, serviceKind, adminNm, siDoCd, siGunGuCd, locTelNo_1~3 | YES | UNKNOWN | YES | 높음 | 기관유형 코드 `B01`, `C01` 기준 조회 |
| 방문간호 | 국민건강보험공단 장기요양기관 검색 서비스 | 국민건강보험공단 | https://www.data.go.kr / B550928 | YES | UNKNOWN | longTermAdminSym, serviceKind, adminNm, siDoCd, siGunGuCd, locTelNo_1~3 | YES | UNKNOWN | YES | 중간 | 기관유형 코드 `B05`, `C05` 기준 조회 |
| 요양원 | 국민건강보험공단 장기요양기관 검색 서비스 | 국민건강보험공단 | https://www.data.go.kr / B550928 | YES | UNKNOWN | longTermAdminSym, serviceKind, adminNm, siDoCd, siGunGuCd, locTelNo_1~3 | YES | UNKNOWN | YES | 높음 | 기관유형 코드 `A01`, `A02`, `A03`, `A04`, `A05`, `AAA`, `S41` 기준 조회 |
| 치매안심센터 | 치매안심센터 기관 정보 데이터 후보 | 중앙치매센터 / 보건복지부 | 확인 필요 | 확인 필요 | 확인 필요 | 센터명, 주소, 전화번호, 관할지역, 홈페이지 후보 | 확인 필요 | 확인 필요 | 확인 필요 | 높음 | 치매 의심/인지 상담에서 주요 연결처다. |
| 보건소 | 보건기관 또는 공공보건의료기관 데이터 후보 | 보건복지부 / 지방자치단체 | 확인 필요 | 확인 필요 | 확인 필요 | 기관명, 주소, 전화번호, 진료/사업 정보 후보 | 확인 필요 | 확인 필요 | 확인 필요 | 중간 | 보건소, 보건지소, 보건진료소가 구분되는지 확인 필요. |
| 사회복지시설 | 사회복지시설 정보 데이터 후보 | 보건복지부 / 한국사회보장정보원 | 확인 필요 | 확인 필요 | 확인 필요 | 시설명, 시설종류, 주소, 전화번호, 운영주체 후보 | 확인 필요 | 확인 필요 | 확인 필요 | 중간 | 시설 유형이 넓어 고령자 관련 시설 필터가 필요하다. |
| 노인복지시설 | 노인복지시설 정보 데이터 후보 | 보건복지부 / 지방자치단체 | 확인 필요 | 확인 필요 | 확인 필요 | 시설명, 시설종류, 주소, 전화번호, 정원 후보 | 확인 필요 | 확인 필요 | 확인 필요 | 높음 | 노인복지관, 경로당, 양로시설 등 세부 유형 확인 필요. |

## 연동 원칙

- 공식 API 또는 공개 파일 데이터가 확인되기 전까지 mock/placeholder 기관 결과를 만들지 않는다.
- 개인 장기요양등급, 급여내역, 수급자격 등 개인 정보 조회 API는 조사 대상에서 제외한다.
- MVP에서는 지도 연동, 기관 순위 추천, AI 추천을 하지 않는다.
- 공통 스키마는 `/src/lib/welfare/facilities.ts`의 `FacilityCandidate`를 기준으로 한다.
- 장기요양기관 목록 조회는 서버 route `/api/welfare/facilities/long-term-care/list`에서만 호출하며, `DATA_GO_KR_SERVICE_KEY`를 프론트에 노출하지 않는다.

```ts
{
  id,
  source,
  name,
  facilityType,
  region,
  address,
  phone,
  homepage,
  latitude,
  longitude,
  raw
}
```
