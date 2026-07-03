# Blueprint Factory Architecture

작성일: 2026-07-03

## 1. 목적

Blueprint Factory는 Blueprint Book이 100만 권 이상 출판되어도 동일한 기준의 품질을 유지하기 위한 AI 출판 공장이다.

Blueprint는 단순히 원고를 생성하는 시스템이 아니다. 한 사람의 만세력 구조를 바탕으로, 사실에 근거한 책을 쓰고, 편집하고, 검수하고, 출판하고, 도서관에 입고하는 전체 공정이다.

핵심 목표:

- 계산된 사실과 쓰인 문장을 분리한다.
- 각 Agent의 책임을 좁게 유지한다.
- 모든 Agent 입출력을 JSON으로 기록한다.
- 품질 점수를 통해 출판 가능 여부를 판단한다.
- 책마다 판본 기록과 수정 이력을 남긴다.
- 100만 권 규모에서도 같은 기준으로 검수한다.

## 2. 전체 Pipeline

```text
Manse
↓
Blueprint Core
↓
Feature Engine
↓
Story Engine
↓
Emotion Engine
↓
Writer
↓
Editor
↓
Fact Checker
↓
Quality Checker
↓
Publisher
↓
Library
```

### 2.1 Manse

역할:

- 생년월일, 시간, 지역 정보를 정밀 계산한다.
- 양력/음력/윤달 변환을 처리한다.
- 지역시 보정을 적용한다.
- 24절기, 사주 원국, 대운, 세운 등 구조 데이터를 만든다.
- 계산 provenance와 warning을 남긴다.

Manse는 문장을 쓰지 않는다. Manse의 책임은 해석이 아니라 계산이다.

출력:

- `manseResult`
- `saju`
- `timeCorrection`
- `daeun`
- `currentLuck`
- `debug`
- `warnings`

### 2.2 Blueprint Core

역할:

- 만세력 데이터를 사람의 구조 축으로 변환한다.
- 명리학 용어를 사용자용 언어로 직접 노출하지 않는다.
- 12개 Core 축에 대한 기본 구조를 만든다.
- 각 축의 confidence와 evidence를 기록한다.

Core는 Manse와 Writer 사이의 의미 계층이다. 계산 원자료를 문장으로 바로 넘기지 않고, 사람이 이해할 수 있는 구조 단위로 정리한다.

출력:

- `coreAxes`
- `featureCandidates`
- `evidenceMap`
- `confidenceMap`
- `contradictions`

### 2.3 Feature Engine

역할:

- Core 결과를 세부 Feature로 분해한다.
- 각 Feature의 강도, 방향, 근거, 신뢰도를 계산한다.
- 서로 충돌하는 Feature를 표시한다.
- Writer가 사용할 수 있는 문장 재료를 만든다.

Feature Engine은 "이 사람은 신중하다"처럼 결론을 쓰지 않는다. 대신 "결정 전 기준 수립 경향이 강함", "관계 진입 속도가 느림"처럼 문장 전 단계의 구조 재료를 만든다.

출력:

- `features`
- `featureScores`
- `featureEvidence`
- `featureConflicts`
- `writerHints`

### 2.4 Story Engine

역할:

- Feature를 책의 흐름으로 배열한다.
- 챕터별 핵심 질문을 정한다.
- 강점, 위험, 전환점, 성장 방향을 구조화한다.
- Prologue와 Ending의 논리적 방향을 잡는다.

Story Engine은 허구적 사건을 만들지 않는다. 실제 경험담처럼 꾸미는 것이 아니라, 구조적 사실을 읽기 좋은 순서로 배열한다.

출력:

- `bookOutline`
- `chapterPlans`
- `narrativeArc`
- `chapterPurpose`
- `keyTensions`

### 2.5 Emotion Engine

역할:

- 원고의 감정 온도를 설계한다.
- 위로, 단정, 공포, 예언으로 흐르지 않게 조절한다.
- 챕터별 정서 리듬을 만든다.
- 독자가 자신을 공격받는다고 느끼지 않도록 문장 방향을 제안한다.

Emotion Engine은 감정을 조작하지 않는다. 독자가 오래 읽을 수 있도록 문장의 압력과 온도를 조절한다.

출력:

- `emotionProfile`
- `chapterTone`
- `sensitivityWarnings`
- `avoidPhrases`
- `reframeSuggestions`

### 2.6 Writer

역할:

- Story Engine과 Emotion Engine의 결과를 실제 책 문장으로 쓴다.
- Hook, Story, Mirror, Twist, Expansion, Ending 구조를 따른다.
- 계산 결과에 없는 내용을 만들지 않는다.
- 명리학 용어를 사용자에게 직접 설명하지 않는다.

Writer는 저자가 아니라 원고 작성자다. 사람을 단정하지 않고, 구조를 읽을 수 있는 문장으로 옮긴다.

출력:

- `draftBook`
- `chapters`
- `paragraphs`
- `writerNotes`
- `sourceReferences`

### 2.7 Editor

역할:

- 원고의 문장 품질을 다듬는다.
- 반복 표현을 줄인다.
- 상투적 문장을 제거한다.
- 제목, 첫 문장, 마지막 문장을 강화한다.
- Blueprint 언어 가이드를 적용한다.

Editor는 새로운 사실을 추가하지 않는다. 이미 작성된 원고를 더 정확하고 오래 읽히는 문장으로 다듬는다.

출력:

- `editedBook`
- `editLog`
- `removedPhrases`
- `languageGuideViolations`
- `editorNotes`

### 2.8 Fact Checker

역할:

- 원고의 모든 주장과 Manse/Core/Feature 근거를 대조한다.
- 계산 결과에 없는 주장, 과장, 예언, 허구를 제거 대상으로 표시한다.
- 근거가 약한 문장에 confidence를 부여한다.
- Fact violation을 출판 차단 조건으로 전달한다.

Fact Checker는 문장을 예쁘게 만들지 않는다. 문장이 사실에 묶여 있는지 확인한다.

출력:

- `factCheckResult`
- `claimMap`
- `unsupportedClaims`
- `overstatedClaims`
- `evidenceCoverage`
- `factWarnings`

### 2.9 Quality Checker

역할:

- 책 전체의 품질 점수를 계산한다.
- 출판 승인 기준을 통과했는지 판단한다.
- 재작성이 필요한 챕터와 이유를 지정한다.
- 100만 권 규모에서도 동일한 품질 기준을 적용한다.

Quality Checker는 최종 심사관이다. 점수가 낮은 원고는 Publisher로 넘어가지 않는다.

출력:

- `qualityScore`
- `qualityBreakdown`
- `approvalStatus`
- `revisionRequests`
- `blockingIssues`

### 2.10 Publisher

역할:

- 승인된 원고를 책으로 확정한다.
- Blueprint ID와 ISBN 스타일 번호를 부여한다.
- 초판 또는 개정판 정보를 기록한다.
- Publication Date와 Revision History를 저장한다.
- Library 입고 가능한 형태로 패키징한다.

Publisher는 원고를 더 이상 수정하지 않는다. 승인된 원고를 판본으로 고정하는 역할을 한다.

출력:

- `publishedBook`
- `bookMetadata`
- `editionRecord`
- `libraryPackage`

### 2.11 Library

역할:

- 출판된 책을 도서관에 입고한다.
- 내 서재, 공개 서가, 전시, 사서 추천에 연결한다.
- 절판, 개정판, 소장 권한을 관리한다.
- 책의 읽기 경험을 유지한다.

Library는 SNS가 아니다. 책을 보관하고 추천하고 읽게 하는 공간이다.

출력:

- `libraryRecord`
- `shelfPlacement`
- `readerAccess`
- `recommendationEligibility`

## 3. AI Agent 책임

| Agent | 핵심 책임 | 하지 않는 것 |
|---|---|---|
| Core Agent | 만세력 데이터를 구조 축으로 변환 | 문장 작성, 예언 |
| Feature Agent | 구조를 Feature와 점수로 분해 | 책의 문체 결정 |
| Story Agent | 챕터 흐름과 서사 구조 설계 | 허구적 사건 생성 |
| Emotion Agent | 감정 온도와 민감 표현 제어 | 불안을 이용한 설득 |
| Writer Agent | 초안 작성 | 계산 근거 없는 주장 |
| Editor Agent | 문장 품질과 언어 가이드 적용 | 새로운 정보 추가 |
| Fact Checker Agent | 주장과 근거 대조 | 문체 미화 |
| Quality Checker Agent | 출판 가능 품질 판정 | 임의 승인 |
| Publisher Agent | 판본 고정과 메타데이터 발행 | 원고 수정 |
| Librarian Agent | 도서관 입고와 추천 가능성 관리 | 사람 평가, 랭킹화 |

## 4. Agent Input/Output JSON Schema

이 문서의 Schema는 제품 설계를 위한 논리 스키마다. 실제 구현에서는 Zod 또는 JSON Schema로 구체화한다.

### 4.1 Manse Output

```json
{
  "manseResult": {
    "blueprintId": "bp_...",
    "input": {},
    "saju": {},
    "timeCorrection": {},
    "daeun": {},
    "currentLuck": {},
    "debug": {
      "solarTermEngine": {},
      "warnings": []
    }
  }
}
```

### 4.2 Blueprint Core

Input:

```json
{
  "blueprintId": "bp_...",
  "manseResult": {},
  "languagePolicy": "blueprint-v1",
  "coreVersion": "core-v1"
}
```

Output:

```json
{
  "blueprintId": "bp_...",
  "coreAxes": [
    {
      "axis": "Decision",
      "summary": "기준이 충분히 설 때 움직이는 구조",
      "confidence": 0.82,
      "evidenceIds": ["ev_001", "ev_002"],
      "risk": "기준 수립이 길어질 때 실행이 늦어질 수 있음"
    }
  ],
  "evidenceMap": {
    "ev_001": {
      "source": "manse.saju.day",
      "type": "calculated",
      "confidence": 0.95
    }
  },
  "contradictions": []
}
```

### 4.3 Feature Engine

Input:

```json
{
  "blueprintId": "bp_...",
  "coreAxes": [],
  "evidenceMap": {}
}
```

Output:

```json
{
  "blueprintId": "bp_...",
  "features": [
    {
      "featureId": "ft_decision_001",
      "axis": "Decision",
      "name": "decision_threshold",
      "score": 0.78,
      "direction": "high",
      "confidence": 0.82,
      "evidenceIds": ["ev_001"],
      "writerHint": "결정을 미루는 사람이 아니라 기준이 충분히 설 때 움직이는 사람으로 표현"
    }
  ],
  "featureConflicts": []
}
```

### 4.4 Story Engine

Input:

```json
{
  "blueprintId": "bp_...",
  "features": [],
  "bookTemplate": "blueprint-book-v1"
}
```

Output:

```json
{
  "blueprintId": "bp_...",
  "bookOutline": {
    "titleCandidate": "기준이 선 뒤에 움직이는 사람",
    "prologueThesis": "이 사람의 힘은 빠른 반응보다 정확한 기준에서 나온다.",
    "chapters": [
      {
        "chapterNo": 1,
        "question": "나는 누구인가",
        "purpose": "핵심 구조 정의",
        "requiredFeatures": ["ft_decision_001"],
        "keyTension": "느림과 정확함의 긴장"
      }
    ]
  }
}
```

### 4.5 Emotion Engine

Input:

```json
{
  "blueprintId": "bp_...",
  "bookOutline": {},
  "features": []
}
```

Output:

```json
{
  "blueprintId": "bp_...",
  "emotionProfile": {
    "overallTone": "calm-documentary",
    "avoid": ["judgmental", "fortune-telling", "fear-based"],
    "sensitivityLevel": "medium"
  },
  "chapterTone": [
    {
      "chapterNo": 1,
      "tone": "clear and reflective",
      "avoidPhrases": ["당신은 원래", "반드시", "운명적으로"]
    }
  ]
}
```

### 4.6 Writer

Input:

```json
{
  "blueprintId": "bp_...",
  "bookOutline": {},
  "features": [],
  "emotionProfile": {},
  "languageGuide": "blueprint-language-guide-v1"
}
```

Output:

```json
{
  "blueprintId": "bp_...",
  "draftBook": {
    "title": "기준이 선 뒤에 움직이는 사람",
    "chapters": [
      {
        "chapterNo": 0,
        "title": "Prologue",
        "paragraphs": [
          {
            "paragraphId": "p_0001",
            "text": "이 사람은 빠른 결정보다 기준의 완성을 먼저 요구하는 사람입니다.",
            "sourceFeatureIds": ["ft_decision_001"],
            "claimIds": ["cl_0001"]
          }
        ]
      }
    ]
  }
}
```

### 4.7 Editor

Input:

```json
{
  "blueprintId": "bp_...",
  "draftBook": {},
  "languageGuide": "blueprint-language-guide-v1"
}
```

Output:

```json
{
  "blueprintId": "bp_...",
  "editedBook": {},
  "editLog": [
    {
      "paragraphId": "p_0001",
      "action": "tone_refinement",
      "before": "당신은 신중한 사람입니다.",
      "after": "기준이 충분히 설 때까지 움직임을 아끼는 사람입니다.",
      "reason": "상투적 표현 제거"
    }
  ],
  "languageGuideViolations": []
}
```

### 4.8 Fact Checker

Input:

```json
{
  "blueprintId": "bp_...",
  "editedBook": {},
  "features": [],
  "evidenceMap": {}
}
```

Output:

```json
{
  "blueprintId": "bp_...",
  "factCheckResult": {
    "status": "pass",
    "truthfulnessScore": 0.94,
    "unsupportedClaims": [],
    "overstatedClaims": []
  },
  "claimMap": [
    {
      "claimId": "cl_0001",
      "paragraphId": "p_0001",
      "text": "기준이 충분히 설 때까지 움직임을 아낀다.",
      "evidenceIds": ["ev_001"],
      "confidence": 0.82
    }
  ]
}
```

### 4.9 Quality Checker

Input:

```json
{
  "blueprintId": "bp_...",
  "editedBook": {},
  "factCheckResult": {},
  "editLog": [],
  "languageGuideViolations": []
}
```

Output:

```json
{
  "blueprintId": "bp_...",
  "qualityScore": {
    "total": 0.89,
    "truthfulness": 0.94,
    "repetition": 0.91,
    "readability": 0.87,
    "emotion": 0.86,
    "consistency": 0.9,
    "originality": 0.82,
    "structure": 0.92
  },
  "approvalStatus": "approve",
  "blockingIssues": [],
  "revisionRequests": []
}
```

### 4.10 Publisher

Input:

```json
{
  "blueprintId": "bp_...",
  "editedBook": {},
  "qualityScore": {},
  "approvalStatus": "approve",
  "previousEdition": null
}
```

Output:

```json
{
  "publishedBook": {},
  "bookMetadata": {
    "blueprintId": "bp_...",
    "blueprintIsbn": "BP-2026-000001-001",
    "edition": "초판",
    "editionNumber": 1,
    "publicationDate": "2026-07-03T00:00:00+09:00",
    "author": {
      "type": "user",
      "displayName": "저자"
    },
    "publisher": "Pigbar Blueprint",
    "revisionHistory": []
  }
}
```

### 4.11 Library

Input:

```json
{
  "publishedBook": {},
  "bookMetadata": {},
  "visibility": "private",
  "shelfPolicy": {}
}
```

Output:

```json
{
  "libraryRecord": {
    "blueprintId": "bp_...",
    "libraryId": "lib_...",
    "shelf": "내 서재",
    "visibility": "private",
    "access": {
      "ownerCanRead": true,
      "recommendable": false
    },
    "status": "shelved"
  }
}
```

## 5. Quality Score 정의

Quality Score는 출판 승인 여부를 판단하는 정량 기준이다. 점수는 0에서 1 사이로 기록하며, `total`은 가중 평균으로 계산한다.

| 항목 | 의미 | 주요 검사 |
|---|---|---|
| Truthfulness | 원고가 계산 결과와 Feature 근거에 묶여 있는가 | unsupported claim, overstatement, invented fact |
| Repetition | 같은 표현과 같은 구조가 반복되지 않는가 | n-gram repetition, sentence pattern repetition |
| Readability | 책처럼 자연스럽게 읽히는가 | 문장 길이, 단락 흐름, 난해도 |
| Emotion | 감정 온도가 적절한가 | 공포 유도, 과도한 위로, 단정적 표현 |
| Consistency | 챕터 간 논리와 표현이 일관되는가 | thesis drift, contradiction |
| Originality | 다른 책과 지나치게 비슷하지 않은가 | template overuse, phrase similarity |
| Structure | 책의 구조가 완성되어 있는가 | chapter completeness, hook/ending quality |

### 5.1 권장 가중치

| 항목 | 가중치 |
|---|---:|
| Truthfulness | 25% |
| Repetition | 10% |
| Readability | 15% |
| Emotion | 15% |
| Consistency | 15% |
| Originality | 10% |
| Structure | 10% |

### 5.2 출판 기준

| 상태 | 조건 | 처리 |
|---|---|---|
| Approve | total >= 0.85, Truthfulness >= 0.9, blocking issue 없음 | 출판 가능 |
| Edit Required | total 0.7 이상 또는 일부 항목 미달 | Editor/Writer 재작업 |
| Review Required | Fact warning 또는 감정 위험 존재 | 수동 검토 또는 강화 검수 |
| Reject | Truthfulness < 0.75 또는 허구/예언 발견 | 출판 차단 |

Truthfulness는 가장 강한 차단 조건이다. 문장이 아름답더라도 근거가 없으면 출판하지 않는다.

## 6. 출판 승인 프로세스

```text
Draft
↓
Review
↓
Edit
↓
Approve
↓
Publish
↓
Library
```

### 6.1 Draft

Writer가 초안을 작성한다.

조건:

- 모든 문단은 `sourceFeatureIds` 또는 `claimIds`를 가진다.
- 챕터 누락이 없어야 한다.
- 원고는 아직 책이 아니다.

### 6.2 Review

Fact Checker와 Quality Checker가 초안을 검토한다.

조건:

- Unsupported claim을 찾는다.
- 금지어를 찾는다.
- 반복과 구조 누락을 찾는다.

### 6.3 Edit

Editor가 Review 결과를 바탕으로 원고를 다듬는다.

조건:

- 새로운 사실을 추가하지 않는다.
- 원문 의미를 바꾸지 않는다.
- 변경 내용은 `editLog`에 남긴다.

### 6.4 Approve

Quality Checker가 최종 점수를 계산한다.

조건:

- 출판 기준을 통과해야 한다.
- blocking issue가 없어야 한다.
- Fact Checker 상태가 pass여야 한다.

### 6.5 Publish

Publisher가 책을 판본으로 고정한다.

조건:

- Blueprint ISBN 스타일 번호를 부여한다.
- 초판/개정판 정보를 기록한다.
- Publication Date를 확정한다.

### 6.6 Library

Library가 책을 내 서재 또는 도서관에 입고한다.

조건:

- 소장 권한을 기록한다.
- 공개 여부를 설정한다.
- 추천 가능 여부를 별도 판단한다.

## 7. Book Metadata

Book Metadata는 책의 신분증이다. 책이 출판된 이후에는 모든 판본과 도서관 기록이 이 Metadata를 기준으로 연결된다.

```json
{
  "blueprintId": "bp_20260703_000001",
  "blueprintIsbn": "BP-2026-000001-001",
  "edition": "초판",
  "editionNumber": 1,
  "publicationDate": "2026-07-03T00:00:00+09:00",
  "author": {
    "authorId": "author_...",
    "displayName": "저자",
    "intro": "저자 소개"
  },
  "publisher": {
    "name": "Pigbar Blueprint",
    "imprint": "Blueprint Factory"
  },
  "revisionHistory": [
    {
      "editionNumber": 1,
      "edition": "초판",
      "publicationDate": "2026-07-03T00:00:00+09:00",
      "changeSummary": "첫 출판",
      "qualityScore": 0.89
    }
  ],
  "status": "published"
}
```

### 7.1 Blueprint ISBN 스타일 번호

권장 형식:

```text
BP-{publicationYear}-{sequence}-{editionNumber}
```

예:

```text
BP-2026-000001-001
BP-2026-000001-002
```

이 번호는 실제 ISBN이 아니다. Blueprint 내부에서 책과 판본을 추적하기 위한 출판 번호다.

## 8. 판본 관리

Blueprint Book은 한 번 출판되고 끝나는 결과물이 아니다. 사람은 시간이 지나며 새롭게 자신을 읽고, 책도 개정될 수 있다.

### 8.1 판본 종류

| 판본 | 의미 | 생성 조건 |
|---|---|---|
| 초판 | 첫 번째 출판본 | 첫 책 출판 |
| 2판 | 첫 개정판 | 문장 개선, 계산 엔진 개선, 사용자 메모 반영 |
| 3판 이상 | 이후 개정판 | 구조 업데이트, Reader 피드백, 새 기준 적용 |

### 8.2 차이 비교

판본 비교는 단순 텍스트 diff가 아니라 책의 의미 변화를 보여야 한다.

비교 항목:

- 변경된 챕터
- 추가된 문단
- 삭제된 문단
- 표현이 바뀐 문장
- 바뀐 Core Feature
- 바뀐 Quality Score
- 바뀐 계산 provenance
- 변경 이유

판본 비교 예시:

```json
{
  "fromEdition": 1,
  "toEdition": 2,
  "changes": [
    {
      "type": "paragraph_rewrite",
      "chapterNo": 3,
      "before": "당신은 결정을 신중하게 내립니다.",
      "after": "이 사람은 기준이 충분히 선 뒤에야 결정을 밖으로 꺼냅니다.",
      "reason": "상투적 표현 제거"
    }
  ],
  "qualityScoreDelta": {
    "readability": 0.08,
    "originality": 0.06
  }
}
```

### 8.3 판본 원칙

- 초판은 지우지 않는다.
- 개정판은 새 판본으로 남긴다.
- 어떤 문장이 왜 바뀌었는지 기록한다.
- 계산 엔진 변경으로 인한 개정은 일반 문장 개정과 구분한다.
- 독자는 자신이 읽은 판본을 다시 열람할 수 있어야 한다.

## 9. Library 입고 프로세스

Library 입고는 출판 이후의 별도 공정이다. 모든 출판된 책이 자동으로 공개 도서관에 전시되는 것은 아니다.

```text
Published Book
↓
Ownership Check
↓
Visibility Decision
↓
Shelf Assignment
↓
Recommendation Eligibility
↓
Library Record
```

### 9.1 Ownership Check

- 책의 저자와 소장 권한을 확인한다.
- 결제 또는 이용권 상태를 확인한다.
- 절판 여부를 확인한다.

### 9.2 Visibility Decision

공개 범위:

- `private`: 내 서재에만 보관
- `recommended-link`: 추천 링크를 가진 사람만 읽기
- `anonymous-library`: 익명 도서관에 입고
- `curated-exhibition`: 사서 전시에 포함

### 9.3 Shelf Assignment

서가 배치 기준:

- Core 축
- 책의 중심 질문
- 독서 난이도
- 감정 온도
- 개정판 여부
- 사서 추천 여부

### 9.4 Recommendation Eligibility

추천 가능 조건:

- Quality Score 기준 통과
- 민감 정보 노출 없음
- 저자 공개 동의
- 금지 표현 없음
- 사람 평가처럼 읽히지 않음

Library는 사람을 노출하지 않는다. 책을 입고한다.

## 10. 100만 권 규모에서 품질 유지 전략

100만 권 규모에서 가장 큰 위험은 원고의 평균화, 반복, 근거 없는 문장, 검수 누락이다. Blueprint Factory는 이를 공정 분리와 점수화로 막는다.

### 10.1 Agent 책임 분리

- Writer가 Fact Checker 역할을 겸하지 않는다.
- Editor가 새로운 주장을 만들지 않는다.
- Publisher가 품질 점수를 무시하지 않는다.
- Library가 낮은 품질의 책을 전시하지 않는다.

### 10.2 모든 문장에 근거 연결

모든 핵심 문단은 다음 중 하나에 연결되어야 한다.

- Manse 계산 근거
- Core 축
- Feature ID
- Story plan
- Editor change log

근거 없는 문장은 자동으로 Review로 되돌린다.

### 10.3 템플릿 과사용 감지

감지 항목:

- 같은 첫 문장 반복
- 같은 챕터 제목 반복
- 같은 비유 반복
- 같은 결론 반복
- 사용자 이름만 바뀐 원고

Originality 점수가 낮으면 Writer가 다시 작성한다.

### 10.4 Gold Set 운영

품질 기준 책 묶음을 `Gold Set`으로 유지한다.

Gold Set 용도:

- 새 Writer 모델 검증
- Editor 회귀 테스트
- Quality Score 보정
- 문체 중복 감지 기준
- 출판 기준 샘플

### 10.5 Regression Test

모델, 프롬프트, Core 기준, 계산 엔진이 바뀌면 기존 샘플 책을 다시 출판해 비교한다.

검사:

- 책의 핵심 논지가 변했는가
- Truthfulness가 낮아졌는가
- 문체가 더 상투적으로 변했는가
- 금지어가 생겼는가
- 감정 온도가 과해졌는가

### 10.6 Human Review Queue

모든 책을 사람이 검수할 수는 없다. 대신 위험도가 높은 책만 Human Review Queue로 보낸다.

Human Review 조건:

- Truthfulness 경계값 근처
- 민감 표현 다수
- Fact warning 존재
- 금지어 반복
- 사용자 신고
- 새 모델 배포 직후 샘플링

### 10.7 Quality Dashboard

운영 내부에서는 품질 현황을 추적한다.

추적 지표:

- 일별 출판 권수
- 평균 Quality Score
- Truthfulness 미달률
- Repetition 미달률
- 재작성 횟수
- 출판 차단률
- 판본별 개선률
- Library 입고 승인률

사용자에게는 점수 경쟁으로 보이지 않게 한다.

## 11. 향후 Multi-Agent 구조 확장 전략

Blueprint Factory v1은 선형 Pipeline으로 시작한다. 이후 규모가 커질수록 Agent를 병렬화하고 전문화한다.

### 11.1 v1: Linear Factory

구조:

```text
Core → Feature → Story → Emotion → Writer → Editor → Fact Checker → Quality Checker
```

특징:

- 구현이 단순하다.
- 로그 추적이 쉽다.
- MVP에 적합하다.

### 11.2 v2: Parallel Specialist Agents

전문화 후보:

- Chapter Writer Agent
- Title Agent
- Opening Sentence Agent
- Ending Agent
- Sensitivity Agent
- Repetition Agent
- Language Guide Agent
- Evidence Mapping Agent

각 Agent는 같은 원고를 다른 관점에서 검토하고, Orchestrator가 결과를 통합한다.

### 11.3 v3: Editorial Board

여러 Editor가 서로 다른 기준으로 원고를 평가한다.

예:

- Fact Editor
- Literary Editor
- Reader Experience Editor
- Library Curator
- Safety Editor

Editorial Board는 단일 AI가 놓치는 오류를 줄이기 위한 구조다.

### 11.4 v4: Library-Scale Learning Loop

도서관에 입고된 책의 독서 데이터를 품질 개선에 사용한다.

사용 가능한 신호:

- 끝까지 읽은 비율
- 책갈피가 많은 문단
- 밑줄이 많은 문장
- 독자가 남긴 개인 메모 유형
- 개정판 요청 사유

금지:

- 좋아요 수 최적화
- 자극적 문장 최적화
- 불안 유도 결제 최적화
- 사람 평가 랭킹화

## 12. 구현하지 않을 것

이 문서는 설계 문서다. 다음은 이 작업 범위에 포함하지 않는다.

- React 컴포넌트 구현
- DB 설계 확정
- API 구현
- AI 프롬프트 구현
- 결제 구현
- 실제 Agent 실행기 구현
- 만세력 계산 수정
- 대운 기산법 수정
- Blueprint 해석 로직 구현

## 13. MVP 제안

Blueprint Factory MVP는 작게 시작한다.

MVP 범위:

1. Manse 결과 JSON 입력
2. Core 축 JSON 생성
3. Feature JSON 생성
4. Story outline 생성
5. Writer 초안 생성
6. Editor 언어 가이드 검사
7. Fact Checker의 unsupported claim 검사
8. Quality Score 계산
9. 승인된 책을 초판으로 저장

MVP에서 제외:

- 공개 도서관
- 사서 추천
- 다중 Editor Board
- 대규모 Gold Set
- 자동 개정판 비교 UI
- 결제와 멤버십
- 사용자 간 추천

## 14. 개발 전에 결정해야 할 질문

- Quality Score의 정확한 출판 기준은 몇 점으로 둘 것인가?
- Truthfulness 미달 문장은 자동 삭제할 것인가, Writer에게 재작성시킬 것인가?
- Core Feature의 최소 단위는 어디까지 쪼갤 것인가?
- 챕터별 Writer를 둘 것인가, 책 전체 Writer를 둘 것인가?
- 첫 출판 후 개정판은 사용자가 요청할 때만 만들 것인가?
- 계산 엔진이 개선되면 기존 책의 개정판을 자동 제안할 것인가?
- Library 입고를 기본 private로 둘 것인가?
- 사서 추천은 사람이 큐레이션할 것인가, Agent가 후보를 만들 것인가?
- Gold Set은 몇 권부터 운영할 것인가?
- 사용자 문장 피드백을 모델 개선에 사용할 때 동의 절차를 어떻게 둘 것인가?

## 15. 최종 원칙

Blueprint Factory는 많은 책을 빠르게 찍어내기 위한 기계가 아니다.

Blueprint Factory는 많은 사람을 같은 기준으로 정성스럽게 읽기 위한 출판 공장이다.

100만 권이 출판되어도 지켜야 할 기준은 하나다.

```text
근거 없는 문장은 출판하지 않는다.
사람을 평가하지 않는다.
책의 품질을 숫자보다 먼저 지킨다.
```
