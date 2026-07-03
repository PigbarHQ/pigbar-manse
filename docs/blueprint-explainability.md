# Blueprint Explainability

작성일: 2026-07-04

## 1. 목적

Blueprint Explainability는 Blueprint Book의 모든 문장이 어디에서 왔는지 추적할 수 있게 만드는 설계다.

Blueprint Book은 감성적인 책이어야 한다. 그러나 감성적인 문장이라고 해서 근거가 흐려져서는 안 된다. Reader에서 보이는 한 문장은 반드시 Reason, Blueprint Structure, Saju Source, Calculation까지 거슬러 올라갈 수 있어야 한다.

핵심 문장:

```text
기본 경험은 책이다.
근거는 독서를 방해하지 않는다.
하지만 모든 문장은 끝까지 추적 가능해야 한다.
```

이 문서는 구현 문서가 아니다. React, DB, API, Reader 구현은 다루지 않는다. Blueprint Reader와 Explainability가 어떤 구조로 연결되어야 하는지 정의한다.

## 2. 원칙

1. 책이 먼저다.

사용자가 처음 만나는 경험은 리포트, 분석 화면, 점수판, 차트가 아니라 책이어야 한다.

2. 근거는 숨기지 않는다.

근거는 기본 본문 위로 튀어나오지 않지만, 독자가 원하면 문장 단위로 따라갈 수 있어야 한다.

3. 설명은 계단처럼 깊어진다.

Story Mode에서는 아무 설명도 보이지 않는다. Annotated Mode에서는 작은 각주처럼 구조만 보인다. Technical Appendix에서는 전체 provenance가 열린다.

4. Confidence는 정답 확률이 아니다.

Confidence는 이 문장을 지지하는 구조 신호의 신뢰도다. 사람의 삶이 맞을 확률이나 미래 예측 확률로 쓰지 않는다.

5. 전문 용어는 Appendix로 내려간다.

Reader 본문과 Annotation은 사람의 언어를 우선한다. 십성, 오행, 지장간, 합충형파해, 대운, 세운 같은 source는 Technical Appendix에서만 전문가용 근거로 다룬다.

## 3. Explainability 5 Layers

Blueprint는 문장 하나를 5개의 Layer로 추적한다.

```text
Layer 1. Book
↓
Layer 2. Reason
↓
Layer 3. Blueprint Structure
↓
Layer 4. Saju Source
↓
Layer 5. Calculation
```

| Layer | 이름 | 역할 | 사용자 노출 |
|---|---|---|---|
| Layer 1 | Book | 사용자가 읽는 문장과 챕터 | Story Mode, Annotated Mode |
| Layer 2 | Reason | 왜 이 문장이 나왔는지 설명 | Annotated Mode 일부, Appendix |
| Layer 3 | Blueprint Structure | Human Vocabulary와 Core Feature 연결 | Annotated Mode 핵심, Appendix |
| Layer 4 | Saju Source | 십성, 오행, 지장간, 합충형파해, 대운, 세운 등 내부 source | Technical Appendix |
| Layer 5 | Calculation | Pigbar Manse JSON 경로와 계산 provenance | Technical Appendix |

### 3.1 Layer 1. Book

Book은 독자가 실제로 읽는 문장이다.

Book Layer의 문장은 사람의 언어로만 작성한다. 문장은 구조를 담되, 계산 흔적을 노출하지 않는다.

예:

```text
이 사람은 빠른 결정보다 기준이 충분히 세워졌는지를 먼저 확인한다.
```

Book Layer가 가져야 하는 것:

- sentenceId
- chapter
- paragraphId
- sentenceText
- edition
- source links

### 3.2 Layer 2. Reason

Reason은 문장이 생성된 이유다.

Reason은 독자에게 직접 길게 보여주기 위한 해설이 아니라, Writer와 Editor가 문장 품질을 검증하기 위한 중간 근거다. Annotated Mode에서는 아주 짧게 요약될 수 있다.

예:

```text
결정 속도보다 기준 형성 feature가 강하고, 실행 feature는 조건 충족 후 활성화되는 방향으로 연결되어 있다.
```

Reason Layer가 가져야 하는 것:

- reasonId
- sentenceId
- reasoningSummary
- supportedBy
- contradictedBy
- editorNote

### 3.3 Layer 3. Blueprint Structure

Blueprint Structure는 Human Vocabulary와 Feature의 연결이다.

이 Layer는 Blueprint Human Model의 Vocabulary와 1:1 또는 1:N으로 연결된다. 한 문장은 하나 이상의 Vocabulary를 가질 수 있지만, 중심 Vocabulary는 반드시 하나 있어야 한다.

예:

```text
Primary Vocabulary:
ID001 기준을 먼저 만든다

Supporting Vocabulary:
ID041 검증 후 움직인다
ID060 기회보다 준비 상태를 본다
```

Structure Layer가 가져야 하는 것:

- structureIds
- vocabularyIds
- primaryVocabularyId
- relatedAxes
- relatedFeatures
- tensionVocabularyIds
- riskVocabularyIds

### 3.4 Layer 4. Saju Source

Saju Source는 Blueprint Core가 사용한 내부 명리 source다.

이 Layer는 사용자-facing 문장으로 직접 올라오지 않는다. 사용자는 Annotated Mode에서 Human Vocabulary만 본다. 전문가나 내부 검수자는 Technical Appendix에서 source를 확인할 수 있다.

Source 후보:

- 십성
- 오행
- 음양
- 천간
- 지지
- 지장간
- 합
- 충
- 형
- 파
- 해
- 월령
- 일간 강약
- 대운
- 세운
- 월운
- 절기 기반 교운 시점

Saju Source Layer가 가져야 하는 것:

- sajuSourceIds
- sourceType
- sourceLabel
- sourceRole
- sourceStrength
- sourceDirection
- sourceConflict

### 3.5 Layer 5. Calculation

Calculation은 Pigbar Manse JSON의 실제 경로와 계산 provenance다.

이 Layer는 문장의 마지막 근거다. Writer가 만든 문장이 계산 결과에서 벗어나지 않았는지 확인하는 기준이 된다.

Calculation Layer가 가져야 하는 것:

- calculationPath
- rawValue
- normalizedValue
- calculationVersion
- engineVersion
- debugReference
- generatedAt

예:

```text
manse.pillars.day.stem
manse.tenGods.dayStemToMonthBranch
manse.elements.distribution.wood
manse.daewoon.current.phase
```

## 4. Sentence Trace Contract

Blueprint Book의 각 문장은 반드시 다음 필드를 가진다.

| 필드 | 설명 |
|---|---|
| sentenceId | 책 안에서 문장을 식별하는 고유 ID |
| chapter | 문장이 속한 Chapter |
| structureIds | Core Structure ID 목록 |
| reason | 문장이 나온 이유 |
| confidence | 구조 신뢰도 |
| featureSource | Core Feature 근거 |
| sajuSource | 내부 명리 source |
| calculationPath | Pigbar Manse JSON 경로 |
| debugReference | 검수와 재현을 위한 debug 참조 |

권장 sentenceId 형식:

```text
bp_{blueprintId}_ed{edition}_ch{chapterNumber}_p{paragraphNumber}_s{sentenceNumber}
```

예:

```text
bp_7X2Q_ed1_ch03_p04_s02
```

## 5. Reader UX

Blueprint Reader는 3가지 Reading Mode를 가진다.

```text
Story Mode
Annotated Mode
Technical Appendix
```

세 모드는 서로 다른 화면이 아니라 같은 책을 읽는 세 가지 깊이다.

### 5.1 Story Mode

Story Mode는 기본 모드다.

사용자는 책만 읽는다. Annotation, confidence, source, 계산 근거는 보이지 않는다. 가장 몰입감 있는 독서 경험이며, Blueprint의 기본값이어야 한다.

Story Mode 원칙:

- 본문만 보인다.
- 문장 옆에 아이콘을 붙이지 않는다.
- 점수, 차트, source 표시를 하지 않는다.
- 설명을 보려는 행동을 요구하지 않는다.
- 책의 리듬과 여백을 우선한다.

예:

```text
이 사람은 빠른 결정보다 기준이 충분히 세워졌는지를 먼저 확인한다.
기준이 흐린 상태에서는 움직임보다 정리를 선택한다.
```

### 5.2 Annotated Mode

Annotated Mode는 추천 모드다.

본문은 Story Mode와 완전히 동일하게 유지한다. 차이는 본문 아래에 작은 Blueprint Annotation이 붙는다는 점뿐이다.

Annotation은 각주처럼 보여야 한다. 본문보다 훨씬 작고, 회색 계열이며, 독서 리듬을 끊지 않아야 한다.

Annotated Mode 원칙:

- 본문을 바꾸지 않는다.
- 문장 아래에 작은 근거만 둔다.
- 설명은 2줄에서 5줄을 넘지 않는다.
- source 전문 용어를 노출하지 않는다.
- Confidence는 보조 정보로만 둔다.
- 카드, 리포트 블록, 대시보드처럼 보이지 않는다.

Annotation 기본 형식:

```text
────────────────
Blueprint Structure
Decision
기준을 먼저 만든다

Confidence
94%
────────────────
```

Annotation 확장 형식:

```text
────────────────
Blueprint Structure
Decision · Thinking
ID001 기준을 먼저 만든다
ID041 검증 후 움직인다

Reason
결정 속도보다 기준 형성 feature가 강하게 잡힌 문장입니다.

Confidence
94%
────────────────
```

Annotated Mode에서 보이면 안 되는 것:

- Pigbar Manse JSON
- 십성, 오행, 지장간, 합충형파해 같은 source label
- 계산 path
- debug reference
- 차트
- score dashboard

### 5.3 Technical Appendix

Technical Appendix는 책 맨 뒤에 위치한다.

Technical Appendix는 독서 중간에 튀어나오는 화면이 아니다. 독자가 책을 다 읽은 뒤 더 깊이 확인하고 싶을 때 들어가는 전문가용 부록이다.

Technical Appendix 원칙:

- 책 마지막에 둔다.
- 모든 문장의 provenance를 모은다.
- 전문가용 언어를 허용한다.
- Calculation JSON 경로를 포함한다.
- 본문 독서 경험을 침범하지 않는다.

Technical Appendix 기본 흐름:

```text
Sentence
↓
Reason
↓
Structure
↓
Vocabulary
↓
Feature
↓
Saju Source
↓
Calculation JSON
```

## 6. Annotation 예시

### 6.1 Story Mode 예시

```text
이 사람은 빠른 결정보다 기준이 충분히 세워졌는지를 먼저 확인한다.
기준이 흐린 상태에서는 움직임보다 정리를 선택한다.
```

### 6.2 Annotated Mode 예시

```text
이 사람은 빠른 결정보다 기준이 충분히 세워졌는지를 먼저 확인한다.

────────────────
Blueprint Structure
Decision · Thinking
ID001 기준을 먼저 만든다

Confidence
94%
────────────────

기준이 흐린 상태에서는 움직임보다 정리를 선택한다.

────────────────
Blueprint Structure
Decision · Action
ID049 결정을 미루며 정보를 모은다
ID015 중심이 흔들리면 멈춘다

Confidence
88%
────────────────
```

### 6.3 Annotation 문장 원칙

좋은 Annotation:

```text
결정 방식과 기준 형성 feature가 함께 지지하는 문장입니다.
```

나쁜 Annotation:

```text
이 사람은 사주상 특정 source가 강하므로 이런 성격입니다.
```

Annotation은 독자가 문장을 더 믿게 만들기 위한 장치가 아니다. 문장의 출처를 조용히 보여주는 장치다.

## 7. Technical Appendix 설계

Technical Appendix는 다섯 개 부록으로 나눈다.

```text
Appendix A. Blueprint Structures
Appendix B. Human Vocabulary
Appendix C. Saju Sources
Appendix D. Confidence
Appendix E. Calculation Provenance
```

### 7.1 Appendix A. Blueprint Structures

Blueprint Structures는 책 전체에서 사용된 구조 축과 structureId를 모은다.

예:

| structureId | Axis | Chapter | Role |
|---|---|---|---|
| STR-DEC-001 | Decision | Chapter 3 | Primary |
| STR-THK-004 | Thinking | Chapter 2 | Supporting |
| STR-ACT-002 | Action | Chapter 4 | Tension |

### 7.2 Appendix B. Human Vocabulary

Human Vocabulary는 `docs/blueprint-human-model.md`의 Vocabulary와 연결된다.

예:

| vocabularyId | 이름 | 관련 축 | 문장 수 | 대표 sentenceId |
|---|---|---|---|---|
| ID001 | 기준을 먼저 만든다 | Identity, Decision, Thinking | 6 | bp_7X2Q_ed1_ch03_p04_s02 |
| ID041 | 검증 후 움직인다 | Decision, Action | 4 | bp_7X2Q_ed1_ch03_p05_s01 |
| ID060 | 기회보다 준비 상태를 본다 | Decision, Life Flow | 3 | bp_7X2Q_ed1_ch12_p02_s03 |

### 7.3 Appendix C. Saju Sources

Saju Sources는 내부 source를 전문가용으로 정리한다.

예:

| sourceId | sourceType | sourceLabel | 연결 Feature | 연결 Vocabulary |
|---|---|---|---|---|
| SRC-TG-014 | 십성 | 내부 십성 신호 | 기준 형성 방식 | ID001 |
| SRC-EL-003 | 오행 | 내부 오행 분포 | 사고 방향, 균형 | ID021 |
| SRC-DW-002 | 대운 | 현재 대운 국면 | 현재 흐름 인식 | ID189 |

주의:

Appendix C는 사용자 전체에게 강제로 읽히는 영역이 아니다. 전문 근거가 필요한 독자, 내부 검수자, 고급 독자를 위한 뒤쪽 부록이다.

### 7.4 Appendix D. Confidence

Confidence는 구조 신뢰도다.

Confidence는 다음 요소를 합성한다.

| 요소 | 설명 |
|---|---|
| Source Strength | 내부 source가 해당 feature를 얼마나 강하게 지지하는지 |
| Cross-Axis Support | 다른 축에서도 같은 구조가 반복되는지 |
| Vocabulary Fit | Human Vocabulary와 문장이 얼마나 정확히 연결되는지 |
| Conflict Penalty | 반대 구조 신호가 얼마나 강한지 |
| Timing Modifier | 대운, 세운 등 현재 흐름에서 구조가 강화되는지 |
| Editor Certainty | Editor가 문장을 과장 없이 승인했는지 |

권장 Confidence 구간:

| 구간 | 의미 | Reader 표현 |
|---|---|---|
| 90-100% | 여러 Layer가 강하게 같은 방향을 가리킨다 | High Confidence |
| 75-89% | 중심 source는 분명하고 보조 신호가 있다 | Stable Confidence |
| 60-74% | 근거는 있으나 반대 신호나 조건이 함께 있다 | Conditional Confidence |
| 40-59% | 일시적 흐름 또는 단일 source에 가깝다 | Low Confidence |
| 0-39% | 책 본문 문장으로 쓰지 않는 것이 원칙 | Not Recommended |

Reader에서는 숫자만 크게 보이지 않아야 한다. Confidence는 독서의 주인공이 아니다.

### 7.5 Appendix E. Calculation Provenance

Calculation Provenance는 Pigbar Manse JSON과 문장 사이의 마지막 연결이다.

예:

| sentenceId | calculationPath | debugReference | engineVersion |
|---|---|---|---|
| bp_7X2Q_ed1_ch03_p04_s02 | manse.tenGods.dayStemToMonthBranch | dbg_20260704_001 | pigbar-manse@v1 |
| bp_7X2Q_ed1_ch12_p02_s03 | manse.daewoon.current.phase | dbg_20260704_014 | pigbar-manse@v1 |

Calculation Provenance는 다음을 가능하게 한다.

- 문장 재현
- 계산 엔진 변경 시 영향 문장 추적
- 개정판에서 바뀐 문장 비교
- Editor 검수
- 내부 품질 감사

## 8. Blueprint Human Model 연결 방식

Blueprint Human Model은 Explainability의 Layer 3에 해당한다.

연결 흐름:

```text
Human Vocabulary
↓
Core Feature
↓
Reason
↓
Book Sentence
↓
Reader Annotation
↓
Technical Appendix
```

예:

```text
Vocabulary:
ID001 기준을 먼저 만든다

Related Feature:
기준 형성 방식
자기 기준의 강도

Reason:
결정 속도보다 기준 형성 feature가 더 강하고, 선택 전 검증 feature가 보조한다.

Book Sentence:
이 사람은 빠른 결정보다 기준이 충분히 세워졌는지를 먼저 확인한다.

Reader Annotation:
Blueprint Structure
Decision · Thinking
ID001 기준을 먼저 만든다
Confidence 94%
```

### 8.1 1:1 연결

한 문장이 하나의 중심 Vocabulary를 설명할 때 사용한다.

예:

| sentenceId | primaryVocabularyId | sentence |
|---|---|---|
| bp_7X2Q_ed1_ch03_p04_s02 | ID001 | 이 사람은 빠른 결정보다 기준이 충분히 세워졌는지를 먼저 확인한다. |

### 8.2 1:N 연결

한 문장이 중심 Vocabulary와 보조 Vocabulary를 함께 가질 때 사용한다.

예:

| sentenceId | primaryVocabularyId | supportingVocabularyIds |
|---|---|---|
| bp_7X2Q_ed1_ch03_p04_s03 | ID001 | ID041, ID060 |

### 8.3 Tension 연결

서로 반대 방향의 Vocabulary가 조건에 따라 함께 나타날 때 사용한다.

예:

```text
기본적으로는 ID001 기준을 먼저 만든다.
하지만 조건이 충분히 모이면 ID044 조건이 맞으면 빠르게 결정한다가 함께 나타난다.
```

Tension은 모순이 아니라 조건 차이다.

## 9. 금지 UX

Explainability에서 절대 하지 않는다.

- 팝업
- Modal
- 복잡한 Explain 화면
- 리포트 화면
- Chart
- Score Dashboard
- AI 분석 화면
- 문장 옆 과도한 아이콘
- hover해야만 근거를 볼 수 있는 구조
- 본문 중간을 끊는 큰 박스
- 독자를 기술 화면으로 밀어내는 전환

Blueprint Reader 안에서 Explainability는 소리 내지 않는다. 필요할 때만 조용히 깊어진다.

## 10. 추천 Reading Mode

기본값은 Story Mode다.

추천 모드는 Annotated Mode다.

이유:

Story Mode는 Blueprint의 정체성을 지킨다. 사용자는 먼저 책을 읽어야 한다. Annotated Mode는 책의 감성을 유지하면서도 문장마다 구조를 확인할 수 있다. Technical Appendix는 전문가용이며, 기본 독서 흐름의 일부가 되어서는 안 된다.

권장 흐름:

```text
첫 독서:
Story Mode

두 번째 독서:
Annotated Mode

검수 또는 깊은 확인:
Technical Appendix
```

Reader의 모드 이름은 사용자가 이해할 수 있는 책의 언어로 바꿀 수 있다.

예:

| 내부 이름 | 사용자-facing 후보 |
|---|---|
| Story Mode | 책만 읽기 |
| Annotated Mode | 각주와 함께 읽기 |
| Technical Appendix | 근거 부록 |

## 11. Sentence JSON 예시

이 JSON은 구현 확정안이 아니라 설계 제안이다. 목적은 Sentence에서 Calculation까지 끊기지 않는 연결을 보여주는 것이다.

```json
{
  "sentence": {
    "sentenceId": "bp_7X2Q_ed1_ch03_p04_s02",
    "blueprintId": "bp_7X2Q",
    "edition": 1,
    "chapter": {
      "chapterId": "chapter_03",
      "chapterTitle": "나는 어떻게 결정하는가",
      "axis": "Decision"
    },
    "paragraphId": "ch03_p04",
    "text": "이 사람은 빠른 결정보다 기준이 충분히 세워졌는지를 먼저 확인한다."
  },
  "reason": {
    "reasonId": "rsn_ch03_p04_s02",
    "summary": "결정 속도보다 기준 형성 feature가 강하고, 검증 후 실행하는 구조가 보조한다.",
    "supportedBy": [
      "feature_decision_criteria_strength",
      "feature_decision_verification_before_action"
    ],
    "contradictedBy": [
      "feature_action_fast_start"
    ],
    "editorNote": "문장은 결정 지연으로 단정하지 않고 기준 형성 구조로 표현한다."
  },
  "structure": {
    "structureIds": [
      "STR-DEC-001",
      "STR-THK-002"
    ],
    "axes": [
      "Decision",
      "Thinking"
    ],
    "primaryVocabularyId": "ID001",
    "vocabularyIds": [
      "ID001",
      "ID041"
    ],
    "humanVocabulary": [
      {
        "id": "ID001",
        "name": "기준을 먼저 만든다",
        "role": "primary"
      },
      {
        "id": "ID041",
        "name": "검증 후 움직인다",
        "role": "supporting"
      }
    ],
    "features": [
      {
        "featureId": "feature_decision_criteria_strength",
        "name": "기준 형성 방식",
        "value": 0.91,
        "role": "primary"
      },
      {
        "featureId": "feature_decision_verification_before_action",
        "name": "의심과 검증 성향",
        "value": 0.84,
        "role": "supporting"
      }
    ]
  },
  "confidence": {
    "score": 0.94,
    "display": "94%",
    "label": "High Confidence",
    "meaning": "정답 확률이 아니라 구조 신뢰도다.",
    "factors": {
      "sourceStrength": 0.92,
      "crossAxisSupport": 0.88,
      "vocabularyFit": 0.97,
      "conflictPenalty": -0.03,
      "timingModifier": 0.04,
      "editorCertainty": 0.96
    }
  },
  "source": {
    "featureSource": [
      {
        "featureId": "feature_decision_criteria_strength",
        "sourceRole": "primary"
      },
      {
        "featureId": "feature_decision_verification_before_action",
        "sourceRole": "supporting"
      }
    ],
    "sajuSource": [
      {
        "sourceId": "SRC-TG-014",
        "sourceType": "십성",
        "sourceLabel": "internal_ten_gods_signal_014",
        "sourceRole": "criteria_support",
        "sourceStrength": 0.89
      },
      {
        "sourceId": "SRC-EL-003",
        "sourceType": "오행",
        "sourceLabel": "internal_element_distribution_003",
        "sourceRole": "thinking_support",
        "sourceStrength": 0.81
      },
      {
        "sourceId": "SRC-DW-002",
        "sourceType": "대운",
        "sourceLabel": "current_daewoon_phase_002",
        "sourceRole": "timing_modifier",
        "sourceStrength": 0.72
      }
    ]
  },
  "calculation": {
    "calculationPath": [
      "manse.tenGods.dayStemToMonthBranch",
      "manse.elements.distribution",
      "manse.daewoon.current.phase"
    ],
    "calculationVersion": "manse_schema_v1",
    "engineVersion": "pigbar-manse@v1",
    "debugReference": "dbg_20260704_001",
    "generatedAt": "2026-07-04T00:00:00+09:00"
  },
  "readerAnnotation": {
    "storyModeVisible": false,
    "annotatedModeVisible": true,
    "technicalAppendixVisible": true,
    "annotationText": {
      "structure": "Decision · Thinking",
      "vocabulary": "ID001 기준을 먼저 만든다",
      "confidence": "94%"
    }
  }
}
```

## 12. 추가 구현이 필요한 항목

이 문서 이후 구현 단계에서 별도로 정해야 할 항목:

- sentenceId 생성 규칙 확정
- Blueprint Human Model Vocabulary ID 고정 정책
- Core Feature ID 네이밍 규칙
- Saju Source ID 네이밍 규칙
- Pigbar Manse JSON path 표준화
- Confidence 계산식
- Editor가 confidence를 낮추거나 문장을 reject하는 기준
- Story Mode, Annotated Mode, Technical Appendix 간 전환 UX
- Annotation typography 기준
- Appendix에 표시할 source 상세 수준
- 개정판에서 sentenceId와 provenance를 보존하는 방식
- 계산 엔진 버전 변경 시 영향 문장 재검수 방식

## 13. v1 범위

v1에서 하는 것:

- 5 Layer Explainability 구조 정의
- 문장 단위 trace contract 정의
- Reader의 3가지 Reading Mode 정의
- Annotation과 Technical Appendix의 역할 분리
- Blueprint Human Model과의 연결 방식 제안
- Sentence JSON 예시 제안

v1에서 하지 않는 것:

- React 구현
- DB 구현
- API 구현
- Reader 구현
- 차트 설계
- 분석 화면 설계
- 점수 대시보드 설계
