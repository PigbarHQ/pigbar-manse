# Blueprint Ecosystem Vision

작성일: 2026-07-03

## 1. 문서 목적

이 문서는 Blueprint가 단일 앱에서 Human Protocol 플랫폼으로 확장되는 장기 비전을 정의한다.

현재 구현 대상이 아니다. 이 문서는 Future Vision이다.

Blueprint의 첫 목표는 한 사람을 한 권의 책으로 출판하는 것이다. Ecosystem은 그 다음 단계다. 책이 충분히 쌓이고, 품질 기준이 안정되고, 독자와 저자가 Blueprint의 언어를 이해한 뒤에야 도서관은 플랫폼으로 확장될 수 있다.

핵심 원칙:

- 지금은 제품의 뼈대를 먼저 만든다.
- 플랫폼은 책의 품질이 증명된 뒤에 만든다.
- 마켓플레이스보다 출판 기준이 먼저다.
- Creator Economy보다 Reader Trust가 먼저다.
- API보다 Human Protocol의 정의가 먼저다.

## 2. Ecosystem 비전

Blueprint Ecosystem은 사람의 구조를 책, 도서관, 출판, 대화, 추천, 개정판, 외부 서비스로 확장하는 Human Protocol 생태계다.

Blueprint는 단일 앱으로 시작한다.

장기적으로는 다음과 같이 확장될 수 있다.

```text
Pigbar Manse
↓
Blueprint Core
↓
Blueprint Book
↓
Blueprint Library
↓
Blueprint Protocol
↓
Publisher Network
↓
Marketplace
↓
SDK/API
↓
Human Protocol Platform
```

Ecosystem의 최종 형태:

- 누구나 자기 Blueprint Book을 소장한다.
- 여러 Publisher가 Blueprint 기준으로 책을 출판한다.
- Creator는 Cover, Theme, Style, Chapter Pack을 만든다.
- Curator는 좋은 책과 서가를 추천한다.
- 외부 서비스는 SDK/API로 사람의 구조를 존중하는 경험을 만든다.
- Blueprint Protocol은 사람을 평가하지 않는 Human Data 규칙으로 작동한다.

Blueprint Ecosystem은 사람을 점수화하는 플랫폼이 아니다. 사람의 구조를 더 품위 있게 읽고, 보관하고, 추천하고, 확장하는 플랫폼이다.

## 3. Blueprint Protocol 개념

Blueprint Protocol은 한 사람의 구조를 안전하고 일관되게 표현하기 위한 표준이다.

Protocol은 특정 앱의 UI가 아니라 데이터, 권한, 문체, 출판, 대화, 추천의 공통 규칙이다.

### 3.1 Protocol이 정의할 것

- Blueprint ID
- Book Metadata
- Edition Metadata
- Core Axis Schema
- Feature Schema
- Evidence Schema
- Quality Score Schema
- Memory Layer Schema
- Permission Scope
- Reader Access Policy
- Publisher Certification
- Style/Theme Compatibility

### 3.2 Protocol 원칙

- 사람을 평가하지 않는다.
- 미래를 단정하지 않는다.
- 허구를 만들지 않는다.
- 출처와 근거를 추적 가능하게 한다.
- 사용자가 자기 책의 권한을 가진다.
- 외부 서비스는 필요한 범위만 요청한다.
- 책, 판본, 메모, 대화를 구분한다.

### 3.3 지금 하면 안 되는 이유

- 아직 Core Schema가 충분히 검증되지 않았다.
- Manse 계산 엔진과 대운 기산법 검증이 완전히 끝나야 한다.
- Blueprint Book의 문체와 품질 기준이 실제 사용자에게 검증되어야 한다.
- 너무 이른 Protocol 공개는 잘못된 구조를 고착시킬 수 있다.

### 3.4 언제 시작해야 하는가

다음 조건이 갖춰진 뒤 시작한다.

- Blueprint Book v1이 실제 사용자에게 안정적으로 출판된다.
- 최소 1,000권 이상의 책에서 Core/Feature 구조가 검증된다.
- Quality Score와 Humanity Score가 운영 지표로 작동한다.
- 판본 관리와 Memory Layer의 기본 정책이 확정된다.

## 4. Publisher 구조

Publisher는 Blueprint Protocol을 기반으로 책을 출판하는 외부 또는 내부 출판 주체다.

초기에는 Pigbar Blueprint만 Publisher다. 장기적으로는 인증된 Publisher가 각자의 전문 영역에서 Blueprint Book을 출판할 수 있다.

### 4.1 Publisher 종류

| Publisher | 역할 |
|---|---|
| Pigbar Blueprint | 기본 Blueprint Book 출판 |
| Certified Publisher | 인증된 외부 출판자 |
| Domain Publisher | 커리어, 관계, 가족, 팀 등 특정 영역 책 출판 |
| Institutional Publisher | 기업, 학교, 조직용 Blueprint 출판 |
| Personal Publisher | 개인의 기록과 메모를 중심으로 개정판 출판 |

### 4.2 Publisher가 지켜야 할 것

- Blueprint Constitution 준수
- Language Guide 준수
- Style Guide 준수
- Fact Checker 통과
- Quality Score 기준 통과
- Humanity Score 기준 통과
- 판본 기록 보존
- 사용자의 권한과 익명성 존중

### 4.3 지금 하면 안 되는 이유

- 외부 Publisher가 들어오면 품질 편차가 커진다.
- 아직 Style Guide와 Factory 기준이 운영으로 검증되지 않았다.
- 검수 시스템이 약하면 Blueprint가 일반 운세 콘텐츠로 훼손될 수 있다.
- Publisher 인증 기준이 없으면 브랜드 신뢰가 무너질 수 있다.

### 4.4 언제 시작해야 하는가

- 내부 Publisher로 10,000권 이상 안정 출판
- Fact/Quality/Humanity 자동 검수 시스템 안정화
- Publisher Certification 문서 완성
- 외부 Publisher 샌드박스 운영 가능
- 문제 있는 책을 회수하거나 개정 요청하는 정책 마련

## 5. Marketplace 구조

Blueprint Marketplace는 책 자체보다 책의 표현, 독서 경험, 출판 형식, 큐레이션을 확장하는 공간이다.

Marketplace는 사람을 사고파는 곳이 아니다. 사람의 책을 더 잘 읽기 위한 도구와 형식을 거래하는 공간이다.

### 5.1 Marketplace 항목

- Cover
- Theme
- Style Pack
- Chapter Template
- Reading Experience
- Library Exhibition
- Curator Shelf
- Physical Book Design
- Gift Edition
- Team Edition Template

### 5.2 Marketplace 원칙

- 사람의 개인정보를 상품화하지 않는다.
- 책의 내용보다 포장만 과장하지 않는다.
- 공포, 예언, 운세 마케팅을 금지한다.
- 품질 기준을 통과한 항목만 입점한다.
- 사용자가 자신의 책에 적용할 권한을 명확히 가진다.

### 5.3 지금 하면 안 되는 이유

- 아직 기본 책의 가치가 증명되지 않았다.
- Marketplace는 핵심 경험을 흐릴 수 있다.
- Cover/Theme 판매가 본문 품질보다 앞서면 제품이 가벼워진다.
- Creator 유입이 빠르면 검수와 저작권 이슈가 먼저 터질 수 있다.

### 5.4 언제 시작해야 하는가

- 사용자가 기본 Blueprint Book을 반복적으로 소장한다.
- Reader UX와 Library UX가 안정된다.
- Cover/Theme 적용 구조가 명확하다.
- Creator 심사 기준과 정산 구조가 준비된다.
- 저작권, 환불, 신고, 절판 정책이 마련된다.

## 6. SDK/API 전략

Blueprint SDK/API는 외부 서비스가 Blueprint Protocol을 기반으로 사람의 구조를 존중하는 경험을 만들 수 있게 하는 도구다.

SDK/API는 가장 늦게 열어야 한다.

### 6.1 가능한 API

- Blueprint Book 조회 API
- Edition Metadata API
- Core Axis Summary API
- Feature Summary API
- Reader Permission API
- Library Shelf API
- Theme Apply API
- Conversation Scope API
- Publisher Submission API

### 6.2 API Scope 원칙

외부 서비스는 전체 책을 기본으로 가져갈 수 없다. 필요한 범위만 요청해야 한다.

예:

```json
{
  "scope": [
    "book.metadata.read",
    "edition.summary.read",
    "core.axis.relationship.read"
  ],
  "denied": [
    "memory.private.read",
    "author.note.read"
  ]
}
```

### 6.3 SDK 방향

- TypeScript SDK
- Publisher SDK
- Theme SDK
- Reader Embed SDK
- Library Curation SDK
- Webhook for Edition Published
- Webhook for Book Revised

### 6.4 지금 하면 안 되는 이유

- API는 한 번 공개하면 되돌리기 어렵다.
- Core Schema가 변하면 외부 개발자가 깨진다.
- 개인정보와 해석 데이터의 권한 모델이 충분히 성숙해야 한다.
- 외부 서비스가 Blueprint를 평가/매칭/점수화 도구로 오용할 수 있다.

### 6.5 언제 시작해야 하는가

- Protocol v1이 안정화된다.
- 권한 Scope 모델이 확정된다.
- 외부 오용 방지 정책이 준비된다.
- 최소 3개의 내부 파트너 앱으로 API를 검증한다.
- 감사 로그와 취소 가능한 권한 모델이 구현된다.

## 7. Creator Economy

Creator Economy는 Blueprint Book의 표현과 독서 경험을 만드는 창작자 생태계다.

Creator는 사람을 해석하는 권한을 파는 사람이 아니다. 책의 표지, 테마, 문체, 전시, 독서 경험을 만드는 사람이다.

### 7.1 Creator가 만들 수 있는 것

- Cover Pack
- Theme Pack
- Typography Pack
- Chapter Layout
- Reading Mode
- Gift Book Design
- Physical Book Template
- Personal Archive Design
- Family Edition Design

### 7.2 Creator가 만들면 안 되는 것

- 공포형 운세 패키지
- 성공 보장형 테마
- 연애/재물 자극형 문구
- 사람 등급화 템플릿
- 특정 사주를 우월하게 보이게 하는 디자인
- 개인정보 노출을 유도하는 양식

### 7.3 수익 모델

- Theme 판매
- Cover 판매
- Physical Book 디자인 수수료
- Gift Edition 수수료
- Creator 구독
- Enterprise Template 라이선스

### 7.4 지금 하면 안 되는 이유

- Creator Economy는 빠르게 외형 경쟁으로 흐를 수 있다.
- 책의 본질보다 꾸미기가 앞설 수 있다.
- 창작물 검수, 저작권, 정산 체계가 필요하다.
- 아직 Blueprint다운 디자인 언어가 충분히 확정되지 않았다.

### 7.5 언제 시작해야 하는가

- Style Guide와 Design System이 안정된다.
- 기본 Cover/Theme 시스템이 내부에서 검증된다.
- 100개 이상의 내부 테마 샘플이 만들어진다.
- Creator 심사, 정산, 신고 정책이 준비된다.
- 사용자들이 자신의 책을 꾸미고 소장하려는 행동을 보인다.

## 8. Curator Economy

Curator Economy는 좋은 책, 좋은 서가, 좋은 전시를 발견하고 추천하는 사서형 경제다.

Curator는 인플루언서가 아니다. 사람을 팔로우하게 만드는 사람이 아니라 책을 읽게 만드는 사람이다.

### 8.1 Curator 역할

- 오늘의 한 권 선정
- 이번 달 전시 기획
- 주제별 서가 구성
- 익명 책 추천
- Founding Collection 구성
- 개정판 추천
- 지역 도서관 큐레이션
- 가족/팀 독서 가이드 구성

### 8.2 Curator 원칙

- 사람을 평가하지 않는다.
- 책을 랭킹화하지 않는다.
- 조회수보다 독서 맥락을 우선한다.
- 익명성과 사생활을 존중한다.
- 추천 이유를 투명하게 쓴다.

### 8.3 보상 구조

- Curated Shelf 이용 수익 배분
- Exhibition Ticket 또는 Access 수익 배분
- Curator Membership
- Enterprise Library Curation 수수료
- Physical Exhibition 연계 수익

### 8.4 지금 하면 안 되는 이유

- 도서관에 충분한 책이 없다.
- 추천이 곧 랭킹으로 오해될 수 있다.
- Curator가 사람을 평가하는 방향으로 흐를 위험이 있다.
- 사서 추천 기준이 아직 검증되지 않았다.

### 8.5 언제 시작해야 하는가

- 최소 10,000권 이상의 공개 또는 익명 입고 책이 있다.
- Library의 탐색 UX가 안정된다.
- 추천 기준과 금지 기준이 명확하다.
- Curator Code of Conduct가 준비된다.
- 사서 추천이 사용자에게 실제 독서 가치를 만든다는 증거가 있다.

## 9. Cover/Theme/Style Marketplace

Cover/Theme/Style Marketplace는 사용자가 자기 책을 더 오래 소장하고 싶게 만드는 표현 계층이다.

### 9.1 Cover Marketplace

Cover는 책의 얼굴이다. 그러나 사람의 얼굴이나 사회적 지위보다 앞서면 안 된다.

가능한 Cover:

- Minimal Cover
- Archive Cover
- Seasonal Cover
- Family Edition Cover
- Gift Cover
- Anniversary Edition Cover
- Physical Hardcover Cover

지금 하면 안 되는 이유:

- Cover가 본문보다 먼저 팔릴 수 있다.
- 사주/운세적 상징이 과도하게 들어갈 수 있다.
- 디자인 품질 기준이 아직 없다.

시작 조건:

- 기본 Book Reader가 안정된다.
- 사용자들이 책을 장기 보관한다.
- Cover Design Rule이 정의된다.

### 9.2 Theme Marketplace

Theme은 독서 경험의 분위기다.

가능한 Theme:

- 조용한 독서 테마
- 야간 독서 테마
- 종이책 테마
- 가족 서재 테마
- 개정판 비교 테마
- 긴 글 집중 테마

지금 하면 안 되는 이유:

- 과도한 시각 효과가 Reader UX를 해칠 수 있다.
- 테마 호환성과 접근성 검증이 필요하다.

시작 조건:

- Reader Design System 완성
- 접근성 기준 마련
- 테마 적용 API 안정화

### 9.3 Style Marketplace

Style은 문체의 변형이다. 가장 조심해야 한다.

가능한 Style:

- 더 짧은 문장판
- 더 문학적인 판
- 가족에게 선물하는 판
- 팀에서 읽는 판
- 청소년 독자판

금지 Style:

- 공포 운세판
- 재물 대박판
- 연애 적중판
- 성공 보장판
- 특정 사람을 조종하는 판

지금 하면 안 되는 이유:

- 문체 변형은 사실 왜곡으로 이어질 수 있다.
- Style이 Constitution과 충돌할 수 있다.
- Humanity Score 검수가 필요하다.

시작 조건:

- Style Guide가 운영으로 검증된다.
- Literary Quality Score와 Humanity Score가 안정된다.
- Style별 Fact Checker 기준이 준비된다.

## 10. 장기 BM

Blueprint Ecosystem의 BM은 사람을 불안하게 만들어 결제시키는 방식이 아니어야 한다.

### 10.1 기본 BM

- 내 책 출판 비용
- 도서관 이용권
- 개정판 발행
- 실물 양장본
- 선물하기
- 가족판
- 커플판
- 팀 Blueprint

### 10.2 Ecosystem BM

- Publisher 인증 수수료
- Publisher 매출 수수료
- Creator Marketplace 수수료
- Curator Exhibition 수익 배분
- Theme/Cover 판매 수수료
- SDK/API 사용료
- Enterprise Human Protocol 라이선스
- Organization Library 구축 비용
- Physical Archive 제작 비용

### 10.3 하지 않을 BM

- 공포 기반 추가 결제
- 운세 재조회 과금
- 불안 알림 유료화
- 사람 랭킹 노출 과금
- 타인 정보 몰래 보기
- 좋아요/노출 부스팅
- 광고로 독서 경험 방해

### 10.4 지금 하면 안 되는 이유

- BM이 너무 빨리 복잡해지면 제품 철학이 흐려진다.
- 사용자는 아직 "책을 출판한다"는 경험을 이해해야 한다.
- Marketplace와 API BM은 신뢰가 쌓인 뒤에야 가능하다.

### 10.5 언제 시작해야 하는가

- 첫 책 출판 BM이 작동한다.
- 사용자가 내 책을 평생 소장할 가치로 인식한다.
- Library 멤버십의 독서 가치가 검증된다.
- 유료 개정판에 대한 자연스러운 수요가 생긴다.

## 11. 10년 로드맵

이 로드맵은 방향을 잡기 위한 비전이다. 실제 시점은 제품 품질과 사용자 신뢰에 따라 조정한다.

### Year 1: Book Foundation

목표:

- Pigbar Manse 계산 안정화
- Blueprint Core v1
- Blueprint Book v1
- Reader v1
- 내 서재
- 문체/언어/헌법 기준 확정

하지 않을 것:

- Marketplace
- 외부 Publisher
- 공개 API
- Creator Economy

시작 조건:

- 한 권의 책이 충분히 좋다는 확신
- 반복 출판 가능한 Factory 구조
- 최소 품질 점수 운영

### Year 2: Living Book

목표:

- Book Chat
- Chapter Chat
- Memory Layer
- Edition 관리
- 개정판 발행

하지 않을 것:

- 외부 SDK
- 공개 Marketplace
- 대규모 도서관 공개

시작 조건:

- Reader UX 안정
- Memory 권한 정책 확정
- 대화 Safety Boundary 검증

### Year 3: Private Library

목표:

- 내 서재 고도화
- 가족/커플/팀 책
- 익명 추천 링크
- 소규모 도서관 실험

하지 않을 것:

- 랭킹
- 팔로우
- 공개 피드

시작 조건:

- 사용자가 책을 다시 읽는 행동 확인
- 추천 링크가 평가가 아니라 독서로 작동

### Year 4: Curated Library

목표:

- 사서 추천
- 이번 달 전시
- 주제별 서가
- Founding Collection

하지 않을 것:

- 완전 개방형 도서관
- 누구나 큐레이션

시작 조건:

- 충분한 책의 수
- Curator 기준 문서
- 익명성 정책

### Year 5: Protocol Draft

목표:

- Blueprint Protocol v0
- 내부 API
- Partner Sandbox
- Publisher Certification Draft

하지 않을 것:

- 공개 SDK
- 외부 대규모 연결

시작 조건:

- Core Schema 안정
- 권한 Scope 모델 완성
- 감사 로그와 취소 권한 구현

### Year 6: Publisher Network

목표:

- Certified Publisher 파일럿
- Domain Publisher 실험
- Enterprise Publisher 실험
- Publisher Review Board

하지 않을 것:

- 무심사 Publisher 등록
- 자동 출판 권한 개방

시작 조건:

- 내부 출판 10,000권 이상 안정
- 품질 차단 시스템 검증
- 회수/개정 정책 마련

### Year 7: Creator Marketplace

목표:

- Cover Marketplace
- Theme Marketplace
- Physical Book Template
- Creator 심사와 정산

하지 않을 것:

- Style Marketplace 전면 개방
- 자극형 운세 디자인 허용

시작 조건:

- 디자인 시스템 안정
- 저작권/정산/신고 정책
- Creator Quality Review

### Year 8: SDK/API

목표:

- TypeScript SDK
- Publisher API
- Reader Embed API
- Theme SDK
- Webhook

하지 않을 것:

- 무제한 데이터 접근
- 사람 평가용 API
- 매칭/랭킹 API

시작 조건:

- Protocol v1
- 권한 Scope 안정
- 외부 오용 방지 정책

### Year 9: Human Protocol Platform

목표:

- Blueprint를 외부 서비스의 Human Context Layer로 확장
- 조직/팀/교육/관계 서비스 연동
- Institution Library

하지 않을 것:

- 채용 평가 점수화
- 보험/대출/차별적 의사결정 활용
- 감시형 조직 분석

시작 조건:

- Human Data Ethics 기준
- 엄격한 사용 금지 분야
- 외부 감사 가능성

### Year 10: World Blueprint Library

목표:

- 100,000권 이상 도서관
- 지역 도서관
- 다국어 Blueprint Book
- 글로벌 Publisher Network
- World Blueprint Library

하지 않을 것:

- 글로벌 피드화
- 영향력 랭킹
- 사람의 책을 광고 상품으로 판매

시작 조건:

- 다국어 문체 품질 기준
- 지역별 문화/윤리 검수
- 장기 보존 인프라

## 12. 기능별 시작 조건 요약

| 기능 | 지금 하면 안 되는 이유 | 시작 조건 |
|---|---|---|
| Protocol | Schema 미검증, 구조 고착 위험 | 1,000권 이상 Core 검증 |
| Publisher | 품질 편차와 브랜드 훼손 위험 | 10,000권 내부 안정 출판 |
| Marketplace | 본문보다 포장이 앞설 위험 | Reader/Library 가치 검증 |
| SDK/API | 권한 모델 미성숙, 오용 위험 | Protocol v1, Scope 모델 확정 |
| Creator Economy | 외형 경쟁과 저작권 이슈 | Design System, 심사/정산 정책 |
| Curator Economy | 추천이 랭킹으로 오해될 위험 | 충분한 책 수, Curator 기준 |
| Cover Marketplace | 표지가 본질을 가릴 위험 | Cover Rule, 소장 행동 검증 |
| Theme Marketplace | 독서 경험 훼손 가능성 | 접근성/호환성 검증 |
| Style Marketplace | 문체 변형이 사실 왜곡 가능 | Style Score와 Fact Check 안정 |
| Enterprise API | 평가/감시 오용 위험 | Human Data Ethics와 감사 체계 |

## 13. 최종 원칙

Blueprint Ecosystem은 빠르게 확장하기 위해 존재하지 않는다.

Blueprint Ecosystem은 한 사람을 한 권의 책으로 존중하는 방식을 더 많은 곳에 심기 위해 존재한다.

플랫폼이 되기 전에 책이 좋아야 한다.

마켓이 되기 전에 도서관이 믿을 만해야 한다.

Protocol이 되기 전에 한 사람의 문장이 품위 있어야 한다.

```text
Blueprint의 미래는 더 많은 기능이 아니라,
사람을 더 오래, 더 정확히, 더 조용히 읽는 방식의 확장이다.
```
