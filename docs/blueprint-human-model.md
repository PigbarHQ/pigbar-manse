# Blueprint Human Model v1

작성일: 2026-07-04

## 1. 목적

Blueprint Human Model은 Blueprint Core가 사람을 설명할 때 사용할 최소 언어 단위다.

Blueprint는 성격을 설명하지 않는다. Blueprint는 한 사람이 반복해서 보이는 판단, 행동, 관계, 회복, 성장의 구조를 설명한다.

이 문서의 Vocabulary는 사용자에게 그대로 노출될 수 있는 사람의 언어를 기준으로 만든다. 내부 계산 근거는 `명리 Source`에 남기되, 사용자용 문장에는 전문 용어를 드러내지 않는다.

핵심 문장:

```text
사람은 단어 하나로 닫히지 않는다.
Blueprint는 여러 Vocabulary를 조합해 한 사람의 구조를 읽는다.
```

## 2. 언어 원칙

1. 평가하지 않는다.

좋다, 나쁘다, 우월하다, 부족하다로 쓰지 않는다. 반복되는 구조와 작동 조건을 쓴다.

2. 성격 이름을 붙이지 않는다.

방향성만 붙이는 분류어, 사람을 좋고 나쁨으로 평가하는 말, 능력을 한 단어로 닫는 표현을 쓰지 않는다.

3. 행동으로 쓴다.

사람이 무엇을 먼저 보고, 무엇을 확인하고, 어떤 조건에서 움직이며, 어떤 방식으로 멈추는지 쓴다.

4. 단정하지 않는다.

Vocabulary는 한 사람 전체가 아니라 한 조각이다. Core는 여러 조각을 함께 읽어야 한다.

5. 전문 용어를 노출하지 않는다.

사용자는 사람의 언어만 읽는다. 내부 참고용 Source도 사용자 문장으로 직접 전달하지 않는다.

## 3. 필드 정의

| 필드 | 의미 |
|---|---|
| ID | Vocabulary 고유 번호 |
| 이름 | 사용자에게 보일 수 있는 짧은 구조명 |
| 설명 | 이 구조가 실제로 어떻게 나타나는지 설명 |
| 반대 개념 | 같은 축에서 반대 방향으로 나타날 수 있는 구조 |
| 관련 축 | Blueprint Core의 12개 축 |
| 관련 Feature | Core가 계산하거나 조합할 세부 feature |
| 관련 Chapter | Blueprint Book에서 주로 쓰일 챕터 |
| 명리 Source | 내부 계산 근거 후보. 사용자에게 직접 노출하지 않음 |
| Confidence 후보 | 신뢰도 계산에 사용할 후보 신호 |

## 4. 카테고리

Vocabulary는 10개 카테고리로 분류한다.

| 카테고리 | 주로 연결되는 축 |
|---|---|
| A. 자기 기준과 정체 구조 | Identity, Decision, Growth |
| B. 사고와 정보 처리 | Thinking, Decision, Communication |
| C. 결정과 선택 방식 | Decision, Action, Life Flow |
| D. 실행과 반복 구조 | Action, Growth, Health |
| E. 관계와 거리 조절 | Relationship, Communication, Conflict |
| F. 표현과 전달 방식 | Communication, Relationship, Leadership |
| G. 영향력과 책임 구조 | Leadership, Decision, Conflict |
| H. 갈등과 경계 구조 | Conflict, Relationship, Health |
| I. 자원과 일의 구조 | Wealth, Action, Leadership |
| J. 회복과 흐름 구조 | Health, Growth, Life Flow |

## 5. Human Structure Vocabulary

### A. 자기 기준과 정체 구조

| ID | 이름 | 설명 | 반대 개념 | 관련 축 | 관련 Feature | 관련 Chapter | 명리 Source | Confidence 후보 |
|---|---|---|---|---|---|---|---|---|
| ID001 | 기준을 먼저 만든다 | 빠른 결정보다 판단 기준을 먼저 세운 뒤 움직인다. | 상황에 맞춰 즉시 움직인다 | Identity, Decision, Thinking | 기준 형성 방식, 자기 기준의 강도 | Chapter 1, Chapter 3 | 중심축 강도, 계절성, 반복 위치 신호 | 기준 feature 강도, 상충 신호 수, 반복 출현 |
| ID002 | 자기 언어로 설명한다 | 남의 표현을 빌리기보다 자신의 말로 납득될 때 받아들인다. | 주어진 설명을 그대로 따른다 | Identity, Communication | 자기 설명 능력, 말의 밀도 | Chapter 1, Chapter 6 | 중심축 노출, 표현 통로 신호 | 자기 설명 feature, 표현 feature, 문장 일관성 |
| ID003 | 중심을 오래 붙든다 | 주변 상황이 바뀌어도 쉽게 방향을 바꾸지 않는다. | 상황 변화에 맞춰 중심을 자주 바꾼다 | Identity, Decision | 일관성, 선택 후 지속력 | Chapter 1, Chapter 3 | 중심축 안정도, 장기 흐름 신호 | 지속 feature, 변동 신호 대비, 흐름 일치도 |
| ID004 | 외부 기준을 늦게 받아들인다 | 권위나 유행보다 자신이 확인한 기준을 우선한다. | 외부 기준을 빠르게 수용한다 | Identity, Leadership | 외부 기준 반응, 권위와의 관계 | Chapter 1, Chapter 7 | 사회축 압력, 중심축 반응 | 외부 압력 대비 중심 feature, 권위 반응 feature |
| ID005 | 역할보다 본질을 본다 | 자신에게 붙은 자리나 호칭보다 실제 의미를 먼저 확인한다. | 역할과 호칭을 먼저 따른다 | Identity, Leadership | 자기 인식, 조직 적응력 | Chapter 1, Chapter 7 | 역할 위치 신호, 중심축 독립성 | 역할 feature, 독립 feature, 사회 위치 반복 |
| ID006 | 스스로 납득해야 움직인다 | 부탁이나 분위기만으로는 부족하고 안에서 이유가 서야 한다. | 주변 흐름에 맞춰 움직인다 | Identity, Action | 독립성, 시작 에너지 | Chapter 1, Chapter 4 | 중심축 강도, 실행 통로 신호 | 자기 납득 feature, 시작 feature, 외부 압력 차이 |
| ID007 | 자기 경계를 먼저 확인한다 | 가까워지기 전 자신이 지킬 선을 먼저 살핀다. | 경계보다 연결을 먼저 만든다 | Identity, Relationship | 경계 설정, 의존/독립 균형 | Chapter 1, Chapter 5 | 관계 위치 신호, 중심축 방어성 | 경계 feature, 관계 feature, 반복 충돌 후보 |
| ID008 | 이름보다 기능을 본다 | 대상의 명칭보다 실제로 무엇을 하는지 확인한다. | 명칭과 소속을 먼저 본다 | Identity, Thinking | 관찰력, 추상화 능력 | Chapter 1, Chapter 2 | 구조 인식 신호, 숨은 자원 신호 | 관찰 feature, 구조 feature, 디테일 일치도 |
| ID009 | 자신을 쉽게 단정하지 않는다 | 스스로를 한 문장으로 닫지 않고 조건과 맥락을 함께 본다. | 자신을 빠르게 규정한다 | Identity, Growth | 정체성의 유연성, 자기 수정 능력 | Chapter 1, Chapter 9 | 중심축 유연성, 변화 흐름 신호 | 유연성 feature, 수정 feature, 흐름 변화 |
| ID010 | 오래 남는 방향을 고른다 | 당장의 편함보다 시간이 지나도 유지될 선택을 선호한다. | 즉시 편한 방향을 고른다 | Identity, Decision, Life Flow | 장기 방향성, 후회 민감도 | Chapter 1, Chapter 12 | 장기 흐름 신호, 축적 위치 신호 | 장기 feature, 후회 feature, 선택 지속도 |
| ID011 | 자기 역할을 다시 정의한다 | 맡은 일을 그대로 수행하기보다 역할의 의미를 재정리한다. | 주어진 역할을 그대로 따른다 | Identity, Leadership | 자기 설명 능력, 기준 제시 능력 | Chapter 1, Chapter 7 | 역할 위치, 중심축 재구성 신호 | 재정의 feature, 역할 feature, 표현 강도 |
| ID012 | 남의 평가를 천천히 통과시킨다 | 칭찬이나 비판을 바로 삼키지 않고 자기 기준으로 다시 거른다. | 평가에 즉시 흔들린다 | Identity, Conflict | 외부 기준 반응, 방어 방식 | Chapter 1, Chapter 8 | 외부 압력 신호, 중심축 안정도 | 평가 반응 feature, 방어 feature, 중심 안정도 |
| ID013 | 자기만의 순서를 가진다 | 같은 일을 해도 자신에게 맞는 순서가 있어야 효율이 난다. | 남이 정한 순서에 바로 맞춘다 | Identity, Action | 루틴 적응력, 실행 속도 | Chapter 1, Chapter 4 | 리듬 신호, 실행 통로 배열 | 루틴 feature, 실행 feature, 반복 성공률 |
| ID014 | 의미 없는 소속을 피한다 | 관계나 조직에 들어가기 전 그 소속이 왜 필요한지 확인한다. | 소속 자체에서 안정감을 얻는다 | Identity, Relationship | 독립성, 거리 조절 능력 | Chapter 1, Chapter 5 | 사회 위치, 관계 결합 신호 | 독립 feature, 소속 반응, 관계 거리 |
| ID015 | 중심이 흔들리면 멈춘다 | 바쁘게 밀고 가기보다 자신이 왜 하는지 흐려질 때 멈춘다. | 흔들려도 속도를 유지한다 | Identity, Health | 중심을 잃을 때의 반응, 쉬는 방식 | Chapter 1, Chapter 11 | 중심축 약화 구간, 회복 신호 | 멈춤 feature, 회복 feature, 흐름 압력 |
| ID016 | 자기 결론을 늦게 공개한다 | 생각이 덜 익었을 때는 결론을 밖으로 빨리 내놓지 않는다. | 미완성 결론도 바로 공개한다 | Identity, Communication | 자기 설명 능력, 침묵의 의미 | Chapter 1, Chapter 6 | 표현 통로 보류 신호, 중심축 응축 | 표현 지연 feature, 침묵 feature, 결론 안정도 |
| ID017 | 자기 기준을 갱신한다 | 한 번 세운 기준도 경험이 쌓이면 다시 다듬는다. | 한 번 정한 기준을 고정한다 | Identity, Growth | 정체성의 유연성, 자기 수정 능력 | Chapter 1, Chapter 9 | 변화 흐름, 학습 자원 신호 | 갱신 feature, 학습 feature, 이전 기준 대비 |
| ID018 | 스스로 책임질 범위를 정한다 | 책임을 무작정 떠안기보다 자신이 감당할 범위를 먼저 정한다. | 들어온 책임을 먼저 받는다 | Identity, Leadership | 책임 수용도, 경계 설정 | Chapter 1, Chapter 7 | 책임 압력, 중심축 용량 신호 | 책임 feature, 경계 feature, 과부하 신호 |
| ID019 | 비교보다 자기 위치를 본다 | 남과의 우열보다 지금 자신이 어디에 있는지 확인한다. | 비교를 통해 위치를 정한다 | Identity, Life Flow | 자기 인식, 현재 흐름 인식 | Chapter 1, Chapter 12 | 현재 흐름, 중심 위치 신호 | 자기 위치 feature, 비교 반응, 흐름 일치도 |
| ID020 | 바깥 변화보다 내부 균형을 먼저 본다 | 환경을 바꾸기 전 자신의 균형이 무너졌는지 확인한다. | 환경을 먼저 바꾸려 한다 | Identity, Health | 자존감 회복 방식, 몸과 마음의 연결감 | Chapter 1, Chapter 11 | 균형 신호, 회복 리듬 | 균형 feature, 회복 feature, 환경 반응 |

### B. 사고와 정보 처리

| ID | 이름 | 설명 | 반대 개념 | 관련 축 | 관련 Feature | 관련 Chapter | 명리 Source | Confidence 후보 |
|---|---|---|---|---|---|---|---|---|
| ID021 | 큰 그림을 먼저 본다 | 세부를 보기 전 전체 구조와 방향을 먼저 잡는다. | 세부에서 전체로 올라간다 | Thinking, Decision | 추상화 능력, 패턴 인식 | Chapter 2, Chapter 3 | 구조 인식 신호, 상위 흐름 신호 | 추상 feature, 패턴 feature, 디테일 균형 |
| ID022 | 디테일을 놓치지 않는다 | 작은 차이와 예외를 빠르게 감지하고 판단에 반영한다. | 큰 방향만 보고 넘어간다 | Thinking, Action | 디테일 민감도, 관찰력 | Chapter 2, Chapter 4 | 세부 감지 신호, 반복 위치 | 디테일 feature, 오류 감지, 반복 출현 |
| ID023 | 감정보다 원리를 찾는다 | 감정 반응 뒤에 어떤 원리와 구조가 있는지 보려 한다. | 감정 반응을 우선 따른다 | Thinking, Conflict | 추상화 능력, 방어 방식 | Chapter 2, Chapter 8 | 원리화 신호, 반응 조절 신호 | 원리 feature, 감정 피로 feature, 갈등 반응 |
| ID024 | 질문으로 생각한다 | 답을 바로 내기보다 질문을 바꾸며 생각을 전개한다. | 답을 먼저 확정한다 | Thinking, Communication | 학습 방식, 말의 밀도 | Chapter 2, Chapter 6 | 탐색 신호, 표현 통로 신호 | 질문 feature, 학습 feature, 결론 지연 |
| ID025 | 정보를 층으로 쌓는다 | 단편 정보를 모아두었다가 시간이 지나 연결한다. | 필요한 정보만 즉시 사용한다 | Thinking, Growth | 학습 방식, 경험 축적 | Chapter 2, Chapter 9 | 축적 신호, 숨은 자원 신호 | 축적 feature, 연결 feature, 시간 경과 일치 |
| ID026 | 먼저 의심하고 확인한다 | 낯선 정보는 바로 믿기보다 출처와 조건을 확인한다. | 먼저 믿고 나중에 조정한다 | Thinking, Decision | 의심과 검증 성향, 위험 감수 성향 | Chapter 2, Chapter 3 | 검증 신호, 위험 감지 신호 | 검증 feature, 위험 feature, 상충 신호 |
| ID027 | 직관을 자료와 맞춘다 | 느낌이 와도 실제 근거와 맞을 때 확신한다. | 느낌만으로 확신한다 | Thinking, Decision | 직관 의존도, 확신 형성 속도 | Chapter 2, Chapter 3 | 직관 통로, 근거 신호 | 직관 feature, 검증 feature, 확신 속도 |
| ID028 | 패턴을 빠르게 찾는다 | 반복되는 흐름과 구조를 빠르게 감지한다. | 매번 새 사건으로 본다 | Thinking, Life Flow | 패턴 인식, 반복되는 과제 | Chapter 2, Chapter 12 | 반복 흐름, 구조 결합 신호 | 패턴 feature, 반복 feature, 흐름 일치도 |
| ID029 | 문제를 다시 정의한다 | 주어진 문제를 그대로 풀기보다 질문 자체를 바꾼다. | 주어진 문제 안에서 답을 찾는다 | Thinking, Growth | 추상화 능력, 자기 수정 능력 | Chapter 2, Chapter 9 | 재구성 신호, 사고 전환 신호 | 재정의 feature, 수정 feature, 결과 개선도 |
| ID030 | 말보다 맥락을 읽는다 | 표현된 문장보다 그 말이 나온 배경과 조건을 살핀다. | 말 그대로 받아들인다 | Thinking, Relationship | 관찰력, 오해 발생 패턴 | Chapter 2, Chapter 5 | 관계 맥락 신호, 숨은 자원 | 맥락 feature, 관찰 feature, 관계 일치 |
| ID031 | 복잡한 것을 분해한다 | 한 덩어리로 보이는 문제를 작은 단위로 나눠 본다. | 전체 감으로 한 번에 처리한다 | Thinking, Action | 추상화 능력, 실행 속도 | Chapter 2, Chapter 4 | 분해 신호, 실행 연결 신호 | 분해 feature, 실행 feature, 오류 감소 |
| ID032 | 익숙한 답을 의심한다 | 모두가 당연하게 여기는 답도 조건을 다시 확인한다. | 익숙한 답을 안정적으로 따른다 | Thinking, Identity | 의심과 검증 성향, 자기 기준 | Chapter 2, Chapter 1 | 검증 신호, 중심축 독립성 | 의심 feature, 독립 feature, 기준 일치 |
| ID033 | 오래 관찰한 뒤 말한다 | 사람이나 상황을 충분히 본 뒤 판단을 꺼낸다. | 첫인상으로 빠르게 말한다 | Thinking, Communication | 관찰력, 침묵의 의미 | Chapter 2, Chapter 6 | 관찰 신호, 표현 보류 신호 | 관찰 feature, 표현 지연, 판단 정확도 |
| ID034 | 경험을 개념으로 바꾼다 | 겪은 일을 그냥 넘기지 않고 설명 가능한 구조로 정리한다. | 경험을 경험으로만 둔다 | Thinking, Growth | 학습 방식, 자기 수정 능력 | Chapter 2, Chapter 9 | 학습 자원, 구조화 신호 | 개념화 feature, 학습 feature, 반복 적용 |
| ID035 | 정보가 많으면 정리 시간을 둔다 | 많은 입력이 들어오면 즉시 반응하지 않고 정리 시간을 필요로 한다. | 입력이 많을수록 바로 반응한다 | Thinking, Health | 정보 과부하 반응, 쉬는 방식 | Chapter 2, Chapter 11 | 과부하 신호, 회복 리듬 | 과부하 feature, 정리 시간, 피로 신호 |
| ID036 | 원인보다 조건을 본다 | 한 가지 원인보다 일이 가능해진 조건들을 함께 본다. | 단일 원인을 찾는다 | Thinking, Life Flow | 패턴 인식, 장기 방향성 | Chapter 2, Chapter 12 | 조건 결합 신호, 흐름 구조 | 조건 feature, 패턴 feature, 흐름 일치 |
| ID037 | 배운 것을 자기 방식으로 재배열한다 | 지식을 그대로 외우기보다 자신에게 맞는 구조로 다시 놓는다. | 배운 순서를 그대로 보존한다 | Thinking, Growth | 학습 방식, 자기 수정 능력 | Chapter 2, Chapter 9 | 학습 자원, 재배열 신호 | 재배열 feature, 학습 feature, 활용도 |
| ID038 | 가능성과 한계를 함께 본다 | 좋은 점만 보거나 문제만 보지 않고 둘을 같이 놓는다. | 한쪽 가능성에 크게 기운다 | Thinking, Decision | 위험 감수 성향, 후회 민감도 | Chapter 2, Chapter 3 | 균형 신호, 판단 압력 | 균형 feature, 위험 feature, 선택 후 안정 |
| ID039 | 보이지 않는 전제를 찾는다 | 말이나 선택 뒤에 숨어 있는 기준을 찾아낸다. | 드러난 내용만 다룬다 | Thinking, Conflict | 관찰력, 갈등 민감도 | Chapter 2, Chapter 8 | 숨은 자원, 충돌 후보 신호 | 전제 감지, 갈등 feature, 맥락 일치 |
| ID040 | 느리게 이해해도 오래 기억한다 | 처음에는 시간이 걸리지만 한 번 이해하면 오래 가져간다. | 빠르게 이해하고 빠르게 잊는다 | Thinking, Growth | 학습 지속력, 경험 축적 | Chapter 2, Chapter 9 | 축적 신호, 학습 리듬 | 지속 feature, 기억 feature, 반복 활용 |

### C. 결정과 선택 방식

| ID | 이름 | 설명 | 반대 개념 | 관련 축 | 관련 Feature | 관련 Chapter | 명리 Source | Confidence 후보 |
|---|---|---|---|---|---|---|---|---|
| ID041 | 검증 후 움직인다 | 가능성이 보여도 검증이 끝나야 실제 행동으로 옮긴다. | 가능성이 보이면 바로 움직인다 | Decision, Action | 의심과 검증 성향, 실행 속도 | Chapter 3, Chapter 4 | 검증 신호, 실행 통로 | 검증 feature, 실행 feature, 지연 사유 |
| ID042 | 선택지를 좁힌 뒤 결정한다 | 넓게 펼친 뒤 기준에 맞지 않는 선택지를 제거한다. | 처음 보이는 선택지로 결정한다 | Decision, Thinking | 기준 형성 방식, 추상화 능력 | Chapter 3, Chapter 2 | 선택 압력, 구조화 신호 | 선택지 수, 기준 feature, 결정 안정도 |
| ID043 | 후회 가능성을 먼저 계산한다 | 선택 후 생길 후회를 미리 살피며 결정을 늦춘다. | 후회보다 기회를 먼저 본다 | Decision, Health | 후회 민감도, 스트레스 축적 | Chapter 3, Chapter 11 | 위험 감지, 피로 신호 | 후회 feature, 스트레스 feature, 선택 후 반응 |
| ID044 | 조건이 맞으면 빠르게 결정한다 | 평소에는 신중하지만 필요한 조건이 모이면 속도가 빨라진다. | 조건과 무관하게 느리게 결정한다 | Decision, Action | 확신 형성 속도, 실행 속도 | Chapter 3, Chapter 4 | 조건 결합, 실행 활성 신호 | 조건 충족도, 확신 feature, 실행 전환 |
| ID045 | 혼자 결정하지 않는다 | 중요한 선택일수록 다른 관점과 검토를 거친다. | 혼자 판단하고 혼자 책임진다 | Decision, Relationship | 외부 조언 수용도, 관계 책임감 | Chapter 3, Chapter 5 | 관계 자문 신호, 판단 압력 | 조언 feature, 관계 feature, 최종 기준 위치 |
| ID046 | 마지막 결정은 스스로 한다 | 조언을 듣더라도 최종 선택의 책임은 자신에게 둔다. | 최종 결정을 타인에게 맡긴다 | Decision, Identity | 자기 기준, 책임 수용도 | Chapter 3, Chapter 1 | 중심축 책임 신호, 외부 압력 | 자기 결정 feature, 책임 feature, 조언 반영도 |
| ID047 | 위험을 나눠서 감수한다 | 큰 위험을 한 번에 지기보다 작은 단위로 나눠 시험한다. | 한 번에 크게 건다 | Decision, Wealth | 위험 감수 성향, 리스크 관리 | Chapter 3, Chapter 10 | 위험 분산 신호, 자원 흐름 | 위험 feature, 자원 feature, 실험 횟수 |
| ID048 | 익숙한 실패를 피한다 | 새 실패보다 이전에 반복된 실패를 더 경계한다. | 같은 실패를 다시 감수한다 | Decision, Growth | 실패 회복 방식, 반복 과제 | Chapter 3, Chapter 9 | 반복 과제 신호, 회복 기록 | 반복 feature, 실패 feature, 수정 여부 |
| ID049 | 결정을 미루며 정보를 모은다 | 미룸이 회피가 아니라 판단 재료를 채우는 과정일 때가 많다. | 정보가 부족해도 결정한다 | Decision, Thinking | 결정을 미루는 이유, 학습 방식 | Chapter 3, Chapter 2 | 정보 축적 신호, 판단 보류 | 정보량, 보류 feature, 결정 품질 |
| ID050 | 선택 후 오래 버틴다 | 한 번 선택하면 쉽게 갈아타지 않고 충분히 밀어본다. | 선택 후 자주 바꾼다 | Decision, Action | 선택 후 지속력, 지속력 | Chapter 3, Chapter 4 | 지속 신호, 실행 리듬 | 지속 feature, 변경 빈도, 결과 누적 |
| ID051 | 결정 전에 사람 영향을 본다 | 선택이 관계에 미칠 영향을 먼저 확인한다. | 관계 영향보다 목표를 먼저 본다 | Decision, Relationship | 외부 조언 수용도, 배려 방식 | Chapter 3, Chapter 5 | 관계 영향 신호, 선택 압력 | 관계 feature, 선택 feature, 영향 예측 |
| ID052 | 결정 전에 자원 영향을 본다 | 시간, 돈, 체력, 기회비용을 함께 계산한다. | 끌리는 방향을 먼저 택한다 | Decision, Wealth | 자원 감각, 리스크 관리 | Chapter 3, Chapter 10 | 자원 흐름, 축적 신호 | 자원 feature, 위험 feature, 비용 감지 |
| ID053 | 선택의 명분을 만든다 | 움직이기 전에 왜 이 선택을 해야 하는지 설명 가능한 이유를 만든다. | 이유보다 추진을 먼저 한다 | Decision, Communication | 기준 형성, 설득 방식 | Chapter 3, Chapter 6 | 명분 신호, 표현 통로 | 명분 feature, 표현 feature, 설득 일치 |
| ID054 | 압박이 오면 결정이 선명해진다 | 평소에는 망설여도 압박 상황에서는 우선순위를 빠르게 정한다. | 압박이 오면 판단이 흐려진다 | Decision, Conflict | 압박 상황 반응, 확신 형성 속도 | Chapter 3, Chapter 8 | 압박 신호, 우선순위 신호 | 압박 feature, 결정 속도, 갈등 반응 |
| ID055 | 선택을 되돌릴 여지를 남긴다 | 완전히 닫힌 결정보다 수정 가능한 선택을 선호한다. | 되돌릴 수 없어도 밀고 간다 | Decision, Growth | 정체성 유연성, 자기 수정 | Chapter 3, Chapter 9 | 수정 가능성 신호, 변화 흐름 | 수정 feature, 선택 구조, 전환 비용 |
| ID056 | 결정 기준을 문서화한다 | 중요한 선택일수록 기준을 말이나 글로 남긴다. | 기준을 머릿속에만 둔다 | Decision, Communication | 기준 형성, 글/말 채널 | Chapter 3, Chapter 6 | 기록 신호, 표현 통로 | 기록 feature, 기준 feature, 재사용도 |
| ID057 | 남의 속도에 끌려가지 않는다 | 주변이 서둘러도 자신의 판단 속도를 지킨다. | 주변 속도에 맞춰 결정한다 | Decision, Identity | 확신 형성 속도, 독립성 | Chapter 3, Chapter 1 | 중심축 안정, 외부 압력 | 독립 feature, 속도 차이, 압력 반응 |
| ID058 | 작은 결정을 빠르게 처리한다 | 큰 결정은 신중하지만 작은 선택은 오래 붙잡지 않는다. | 작은 결정도 오래 붙잡는다 | Decision, Action | 결정 크기 구분, 실행 속도 | Chapter 3, Chapter 4 | 선택 규모 신호, 실행 리듬 | 규모 구분, 실행 feature, 지연 빈도 |
| ID059 | 감정이 가라앉은 뒤 선택한다 | 감정이 높을 때 결정을 닫지 않고 시간을 둔다. | 감정이 올라온 순간 선택한다 | Decision, Health | 후회 민감도, 감정 피로 | Chapter 3, Chapter 11 | 감정 압력, 회복 리듬 | 감정 feature, 회복 feature, 선택 후 후회 |
| ID060 | 기회보다 준비 상태를 본다 | 좋은 기회라도 자신이 감당할 준비가 되었는지 먼저 확인한다. | 기회가 오면 먼저 잡는다 | Decision, Life Flow | 준비 자원, 현재 흐름 인식 | Chapter 3, Chapter 12 | 흐름 전환, 자원 준비 신호 | 준비 feature, 흐름 feature, 기회 반응 |

### D. 실행과 반복 구조

| ID | 이름 | 설명 | 반대 개념 | 관련 축 | 관련 Feature | 관련 Chapter | 명리 Source | Confidence 후보 |
|---|---|---|---|---|---|---|---|---|
| ID061 | 실행으로 증명한다 | 말이나 계획보다 실제 결과로 자신의 생각을 확인한다. | 설명으로 먼저 증명한다 | Action, Communication | 실행 속도, 글/말/행동 채널 | Chapter 4, Chapter 6 | 실행 통로, 표현 신호 | 실행 feature, 표현 대비, 결과 출현 |
| ID062 | 시작보다 지속이 강하다 | 처음 속도는 빠르지 않아도 시작한 일을 오래 끌고 간다. | 시작은 빠르지만 쉽게 식는다 | Action, Growth | 지속력, 학습 지속력 | Chapter 4, Chapter 9 | 지속 리듬, 축적 신호 | 지속 feature, 시작 feature, 누적 결과 |
| ID063 | 시작 에너지가 강하다 | 조건이 맞으면 오래 준비하지 않고 먼저 시동을 건다. | 시동 전에 오래 준비한다 | Action, Decision | 시작 에너지, 확신 형성 속도 | Chapter 4, Chapter 3 | 활성 신호, 실행 통로 | 시작 feature, 결정 feature, 지속 보정 |
| ID064 | 반복을 싫어한다 | 같은 방식의 반복이 길어지면 에너지가 떨어진다. | 반복에서 안정감을 얻는다 | Action, Growth | 루틴 적응력, 성장 트리거 | Chapter 4, Chapter 9 | 변화 욕구 신호, 반복 피로 | 반복 피로, 변화 feature, 성과 변동 |
| ID065 | 반복으로 숙련된다 | 같은 과정을 여러 번 거치며 정확도와 속도가 올라간다. | 새 자극이 있어야 숙련된다 | Action, Growth | 반복 훈련 적합도, 몸으로 익히는 능력 | Chapter 4, Chapter 9 | 반복 축적, 실행 리듬 | 반복 feature, 숙련 속도, 누적 일치 |
| ID066 | 마감이 오면 살아난다 | 제한 시간이 분명해지면 집중력과 실행 속도가 올라간다. | 마감이 오면 무너진다 | Action, Conflict | 마감 반응, 압박 상황 반응 | Chapter 4, Chapter 8 | 압박 활성, 시간 제한 신호 | 마감 feature, 압박 feature, 결과 안정 |
| ID067 | 몸으로 익힌다 | 머리로 이해한 뒤에도 직접 해봐야 자기 것이 된다. | 설명만으로 충분히 익힌다 | Action, Thinking | 몸으로 익히는 능력, 학습 방식 | Chapter 4, Chapter 2 | 체득 신호, 실행 통로 | 체득 feature, 학습 feature, 반복 필요도 |
| ID068 | 정해진 루틴에서 힘이 난다 | 반복 가능한 순서와 리듬이 있을 때 실행력이 안정된다. | 변수가 있어야 힘이 난다 | Action, Health | 루틴 적응력, 수면/리듬 민감도 | Chapter 4, Chapter 11 | 리듬 안정, 회복 신호 | 루틴 feature, 회복 feature, 변동 반응 |
| ID069 | 변수가 있어야 깨어난다 | 예측 가능한 반복보다 새 문제와 변수가 있을 때 집중한다. | 안정된 반복에서 집중한다 | Action, Thinking | 시작 에너지, 패턴 인식 | Chapter 4, Chapter 2 | 변화 활성, 문제 감지 신호 | 변수 feature, 집중 feature, 피로 보정 |
| ID070 | 혼자서 속도를 낸다 | 협업보다 혼자 몰입할 때 실행 속도가 빨라진다. | 함께할 때 속도가 난다 | Action, Relationship | 실행 속도, 의존/독립 균형 | Chapter 4, Chapter 5 | 독립 실행 신호, 관계 영향 | 독립 feature, 실행 feature, 협업 대비 |
| ID071 | 함께할 때 지속된다 | 사람과 약속이나 공동 리듬이 있을 때 오래 간다. | 혼자일 때 더 오래 간다 | Action, Relationship | 지속력, 관계 책임감 | Chapter 4, Chapter 5 | 공동 리듬 신호, 관계 결합 | 공동 feature, 지속 feature, 약속 반응 |
| ID072 | 작은 완료를 쌓는다 | 큰 목표보다 작은 완료 단위를 쌓아 추진력을 만든다. | 큰 목표 하나로 밀어붙인다 | Action, Wealth | 실행 속도, 축적 방식 | Chapter 4, Chapter 10 | 축적 신호, 단계 실행 | 완료 단위, 축적 feature, 진행률 |
| ID073 | 한 번에 깊게 몰입한다 | 짧게 여러 일을 나누기보다 한 가지에 깊게 들어간다. | 여러 일을 동시에 굴린다 | Action, Thinking | 실행 속도, 정보 과부하 반응 | Chapter 4, Chapter 2 | 몰입 신호, 분산 압력 | 몰입 feature, 과부하 feature, 전환 비용 |
| ID074 | 여러 일을 병렬로 굴린다 | 하나가 막히면 다른 일을 움직이며 전체 흐름을 유지한다. | 한 일을 끝내고 다음으로 간다 | Action, Life Flow | 실행 속도, 현재 흐름 인식 | Chapter 4, Chapter 12 | 병렬 흐름, 실행 분산 | 병렬 feature, 완료율, 피로 보정 |
| ID075 | 준비가 길수록 실행이 강해진다 | 충분히 준비한 뒤에는 흔들림 없이 밀고 간다. | 준비가 길어질수록 힘이 빠진다 | Action, Decision | 시작 에너지, 확신 형성 속도 | Chapter 4, Chapter 3 | 준비 축적, 실행 활성 | 준비 feature, 실행 전환, 지속 강도 |
| ID076 | 현장에서 조정한다 | 계획대로만 가기보다 실행 중 생긴 정보를 반영한다. | 계획을 끝까지 고수한다 | Action, Growth | 자기 수정 능력, 실행 속도 | Chapter 4, Chapter 9 | 현장 반응, 수정 신호 | 수정 feature, 실행 feature, 변경 성과 |
| ID077 | 결과가 보여야 힘이 난다 | 과정만으로는 부족하고 눈에 보이는 변화가 있어야 지속된다. | 과정 자체에서 힘을 얻는다 | Action, Wealth | 가치 교환 능력, 지속력 | Chapter 4, Chapter 10 | 결과화 신호, 자원 전환 | 결과 feature, 지속 feature, 보상 반응 |
| ID078 | 과정이 맞아야 버틴다 | 결과가 좋아도 과정이 맞지 않으면 오래 지속하기 어렵다. | 결과가 좋으면 과정을 견딘다 | Action, Health | 지속력, 실행 후 피로도 | Chapter 4, Chapter 11 | 과정 리듬, 피로 신호 | 과정 feature, 피로 feature, 지속 여부 |
| ID079 | 멈춤을 실행의 일부로 둔다 | 쉬는 시간을 낭비가 아니라 다음 실행을 위한 조정으로 본다. | 멈춤을 실패로 본다 | Action, Health | 실행 후 피로도, 쉬는 방식 | Chapter 4, Chapter 11 | 회복 리듬, 실행 소모 | 회복 feature, 소모 feature, 재시작 속도 |
| ID080 | 막히면 방식부터 바꾼다 | 의지만 더 쓰기보다 방법과 순서를 바꾸며 돌파한다. | 같은 방식으로 더 버틴다 | Action, Growth | 자기 수정 능력, 압박 반응 | Chapter 4, Chapter 9 | 전환 신호, 압박 신호 | 전환 feature, 수정 feature, 결과 개선 |

### E. 관계와 거리 조절

| ID | 이름 | 설명 | 반대 개념 | 관련 축 | 관련 Feature | 관련 Chapter | 명리 Source | Confidence 후보 |
|---|---|---|---|---|---|---|---|---|
| ID081 | 사람을 오래 관찰한다 | 가까워지기 전에 말, 행동, 반복을 충분히 본다. | 첫 느낌으로 가까워진다 | Relationship, Thinking | 친밀감 형성 속도, 관찰력 | Chapter 5, Chapter 2 | 관계 관찰 신호, 거리 조절 | 관찰 feature, 친밀 속도, 반복 일치 |
| ID082 | 신뢰를 천천히 연다 | 처음부터 전부 보여주지 않고 시간을 거쳐 신뢰를 만든다. | 신뢰를 빠르게 연다 | Relationship, Identity | 친밀감 형성 속도, 경계 설정 | Chapter 5, Chapter 1 | 관계 거리, 중심축 방어 | 신뢰 속도, 경계 feature, 관계 지속 |
| ID083 | 가까운 사람에게 책임을 진다 | 친밀한 관계일수록 자신의 몫을 분명히 가져간다. | 가까울수록 책임을 흐린다 | Relationship, Leadership | 관계 책임감, 책임 수용도 | Chapter 5, Chapter 7 | 관계 책임 신호, 역할 위치 | 책임 feature, 관계 feature, 지속성 |
| ID084 | 필요한 거리를 둔다 | 좋아하는 사람과도 자신이 유지될 거리를 확보한다. | 가까우면 거리를 줄인다 | Relationship, Health | 거리 조절, 감정 피로 | Chapter 5, Chapter 11 | 거리 조절 신호, 회복 리듬 | 거리 feature, 피로 feature, 관계 안정 |
| ID085 | 연결을 만든다 | 사람과 사람, 정보와 사람 사이의 연결점을 잘 만든다. | 각자를 따로 둔다 | Relationship, Communication | 배려 방식, 설득 방식 | Chapter 5, Chapter 6 | 연결 신호, 표현 통로 | 연결 feature, 표현 feature, 관계 확장 |
| ID086 | 관계 안의 역할을 읽는다 | 누가 어떤 부담과 권한을 갖는지 빠르게 파악한다. | 관계를 감정 중심으로 본다 | Relationship, Leadership | 관계 책임감, 조직 적응력 | Chapter 5, Chapter 7 | 역할 배열, 사회 위치 | 역할 feature, 관계 feature, 상황 정확도 |
| ID087 | 실망 후 거리를 조정한다 | 실망이 생기면 바로 끊기보다 거리를 다시 조절한다. | 실망하면 관계를 끝낸다 | Relationship, Conflict | 실망 후 반응, 화해 가능성 | Chapter 5, Chapter 8 | 관계 충돌, 거리 전환 | 실망 feature, 거리 feature, 재접속 가능성 |
| ID088 | 말보다 행동으로 믿는다 | 약속이나 설명보다 반복된 행동을 신뢰 근거로 삼는다. | 말의 진심을 먼저 믿는다 | Relationship, Action | 신뢰 형성, 행동 채널 | Chapter 5, Chapter 4 | 행동 반복, 관계 신뢰 | 행동 feature, 신뢰 feature, 말-행동 차이 |
| ID089 | 관계의 균형을 본다 | 한쪽만 주거나 받는 관계가 오래가긴 어렵다고 본다. | 마음이 있으면 불균형을 견딘다 | Relationship, Wealth | 의존/독립 균형, 가치 교환 | Chapter 5, Chapter 10 | 교환 신호, 관계 균형 | 균형 feature, 교환 feature, 피로 신호 |
| ID090 | 쉽게 부탁하지 않는다 | 도움을 필요로 해도 먼저 스스로 해결해보려 한다. | 필요하면 바로 부탁한다 | Relationship, Identity | 의존/독립 균형, 독립성 | Chapter 5, Chapter 1 | 독립 신호, 관계 요청 | 독립 feature, 요청 빈도, 과부하 보정 |
| ID091 | 부탁받으면 무게를 느낀다 | 작은 부탁도 관계의 책임으로 받아들이기 쉽다. | 부탁을 가볍게 처리한다 | Relationship, Health | 관계 책임감, 감정 피로 | Chapter 5, Chapter 11 | 책임 압력, 관계 피로 | 부탁 반응, 피로 feature, 책임 feature |
| ID092 | 친밀할수록 솔직해진다 | 거리가 가까워질수록 숨기던 생각과 기준을 더 분명히 말한다. | 가까울수록 말을 아낀다 | Relationship, Communication | 친밀감, 직설/완곡 | Chapter 5, Chapter 6 | 친밀 표현, 중심축 노출 | 친밀 feature, 표현 feature, 오해 반응 |
| ID093 | 관계의 시작보다 유지에 강하다 | 처음 다가가는 것보다 오래 유지하고 챙기는 데 강점이 있다. | 시작은 쉽지만 유지가 어렵다 | Relationship, Growth | 장기 관계 유지력, 지속력 | Chapter 5, Chapter 9 | 지속 관계, 축적 신호 | 유지 feature, 지속 feature, 이탈 빈도 |
| ID094 | 관계에서 관찰자가 된다 | 상황이 과열되면 한 걸음 물러나 관계 구조를 본다. | 관계 안으로 바로 뛰어든다 | Relationship, Conflict | 거리 조절, 갈등 민감도 | Chapter 5, Chapter 8 | 거리 신호, 충돌 관찰 | 관찰 feature, 거리 feature, 갈등 완화 |
| ID095 | 공동의 기준을 찾는다 | 관계를 감정만으로 유지하기보다 함께 지킬 기준을 만든다. | 서로의 마음에 맡긴다 | Relationship, Decision | 경계 설정, 기준 형성 | Chapter 5, Chapter 3 | 관계 기준, 선택 압력 | 기준 feature, 관계 feature, 합의 안정 |
| ID096 | 사람을 기능으로만 보지 않는다 | 일의 효율보다 상대가 어떤 상태인지 함께 본다. | 역할과 성과를 먼저 본다 | Relationship, Leadership | 배려 방식, 사람을 움직이는 방식 | Chapter 5, Chapter 7 | 관계 배려, 역할 압력 | 배려 feature, 역할 feature, 관계 반응 |
| ID097 | 오래된 관계를 쉽게 버리지 않는다 | 시간이 쌓인 관계에는 단기 실망보다 긴 맥락을 더 둔다. | 현재 감정으로 관계를 정리한다 | Relationship, Life Flow | 장기 관계 유지력, 반복 흐름 | Chapter 5, Chapter 12 | 장기 관계, 시간 축적 | 장기 feature, 실망 feature, 회복 가능성 |
| ID098 | 낯선 사람에게는 역할로 접근한다 | 처음에는 감정보다 자리, 일, 상황을 통해 관계를 시작한다. | 처음부터 개인적으로 접근한다 | Relationship, Leadership | 친밀감 속도, 조직 적응력 | Chapter 5, Chapter 7 | 사회 역할, 거리 조절 | 역할 feature, 친밀 속도, 상황 적응 |
| ID099 | 가까운 관계에서 기준이 높아진다 | 가까운 사람일수록 더 정확한 책임과 태도를 기대한다. | 가까울수록 기준이 낮아진다 | Relationship, Conflict | 실망 후 반응, 손절 기준 | Chapter 5, Chapter 8 | 친밀 압력, 기준 신호 | 기대 feature, 실망 feature, 갈등 빈도 |
| ID100 | 혼자 있는 시간이 관계를 지킨다 | 혼자 정리하는 시간이 있어야 관계에서도 안정적으로 머문다. | 함께 있는 시간이 관계를 지킨다 | Relationship, Health | 거리 조절, 쉬는 방식 | Chapter 5, Chapter 11 | 회복 거리, 관계 피로 | 회복 feature, 거리 feature, 관계 안정 |

### F. 표현과 전달 방식

| ID | 이름 | 설명 | 반대 개념 | 관련 축 | 관련 Feature | 관련 Chapter | 명리 Source | Confidence 후보 |
|---|---|---|---|---|---|---|---|---|
| ID101 | 짧게 핵심을 말한다 | 긴 설명보다 핵심 문장으로 방향을 잡아준다. | 충분히 길게 풀어 설명한다 | Communication, Leadership | 말의 밀도, 기준 제시 | Chapter 6, Chapter 7 | 표현 압축, 역할 신호 | 밀도 feature, 영향 feature, 오해 보정 |
| ID102 | 맥락을 길게 설명한다 | 결론만 말하면 오해가 생긴다고 보고 배경을 함께 전한다. | 결론만 먼저 말한다 | Communication, Thinking | 말의 밀도, 맥락 인식 | Chapter 6, Chapter 2 | 표현 확장, 구조 인식 | 맥락 feature, 표현량, 이해 반응 |
| ID103 | 직접 말한다 | 우회보다 분명한 표현이 더 정확하다고 본다. | 완곡하게 돌려 말한다 | Communication, Conflict | 직설/완곡, 압박 언어 | Chapter 6, Chapter 8 | 표현 직진성, 충돌 압력 | 직설 feature, 갈등 반응, 관계 보정 |
| ID104 | 완곡하게 조율한다 | 상대가 받아들일 수 있는 순서와 온도를 고려해 말한다. | 필요한 말을 바로 꺼낸다 | Communication, Relationship | 완곡 성향, 배려 방식 | Chapter 6, Chapter 5 | 표현 조율, 관계 배려 | 완곡 feature, 배려 feature, 전달 성공 |
| ID105 | 글로 정리할 때 선명해진다 | 말보다 글에서 기준과 구조가 더 정확하게 나온다. | 말로 할 때 선명해진다 | Communication, Thinking | 글/말 채널, 자기 설명 | Chapter 6, Chapter 2 | 기록 통로, 사고 정리 | 글 채널 feature, 설명 feature, 수정량 |
| ID106 | 말하면서 생각이 정리된다 | 대화 중에 생각의 구조가 잡히고 결론이 만들어진다. | 혼자 정리한 뒤 말한다 | Communication, Thinking | 말 채널, 사고 속도 | Chapter 6, Chapter 2 | 대화 정리, 표현 활성 | 말 채널 feature, 결론 생성, 대화 반응 |
| ID107 | 행동으로 마음을 전한다 | 감정을 길게 말하기보다 챙김과 행동으로 전달한다. | 감정을 말로 직접 전한다 | Communication, Relationship | 행동 채널, 감정 언어화 | Chapter 6, Chapter 5 | 행동 표현, 관계 신뢰 | 행동 feature, 감정 표현, 상대 이해 |
| ID108 | 침묵으로 정리한다 | 말이 없을 때도 관계를 끊은 것이 아니라 내부 정리 중일 수 있다. | 말로 바로 푼다 | Communication, Health | 침묵의 의미, 감정 피로 | Chapter 6, Chapter 11 | 표현 보류, 회복 리듬 | 침묵 feature, 회복 feature, 오해 빈도 |
| ID109 | 질문으로 설득한다 | 주장보다 질문을 통해 상대가 스스로 보게 한다. | 주장으로 설득한다 | Communication, Leadership | 설득 방식, 사람을 움직이는 방식 | Chapter 6, Chapter 7 | 질문 표현, 영향 신호 | 질문 feature, 설득 feature, 수용 반응 |
| ID110 | 사례로 설명한다 | 원리보다 실제 예시를 통해 이해시키려 한다. | 원리로 설명한다 | Communication, Thinking | 설득 방식, 학습 방식 | Chapter 6, Chapter 2 | 사례화 신호, 표현 통로 | 사례 feature, 이해 반응, 원리 보정 |
| ID111 | 구조로 설명한다 | 개별 사건보다 구조와 관계를 통해 전달한다. | 상황별 이야기로 전달한다 | Communication, Thinking | 추상화, 말의 밀도 | Chapter 6, Chapter 2 | 구조 표현, 사고 신호 | 구조 feature, 전달 이해, 추상도 |
| ID112 | 말하기 전에 수위를 조절한다 | 같은 내용도 어디까지 말할지 먼저 정한다. | 떠오른 내용을 그대로 말한다 | Communication, Relationship | 감정 언어화, 경계 설정 | Chapter 6, Chapter 5 | 표현 수위, 관계 거리 | 수위 feature, 경계 feature, 오해 감소 |
| ID113 | 불편한 말을 늦게 꺼낸다 | 관계를 흔들 수 있는 말은 충분히 확인한 뒤 꺼낸다. | 불편해도 바로 말한다 | Communication, Conflict | 침묵의 의미, 갈등 민감도 | Chapter 6, Chapter 8 | 갈등 보류, 표현 압력 | 보류 feature, 갈등 feature, 폭발 위험 |
| ID114 | 필요한 말은 끝까지 한다 | 불편해도 중요하다고 판단한 말은 끝까지 전달한다. | 분위기가 나빠지면 멈춘다 | Communication, Conflict | 직설 성향, 정면 대응 | Chapter 6, Chapter 8 | 표현 지속, 충돌 압력 | 지속 표현, 갈등 반응, 전달 완료 |
| ID115 | 말과 행동의 차이에 민감하다 | 누군가의 말보다 실제 행동이 어긋나는지를 예민하게 본다. | 말의 의도를 더 본다 | Communication, Relationship | 오해 패턴, 신뢰 형성 | Chapter 6, Chapter 5 | 말-행동 차이, 관계 신뢰 | 차이 감지, 신뢰 feature, 반복 일치 |
| ID116 | 감정을 번역하는 시간이 필요하다 | 느낀 것을 바로 말하기보다 어떤 감정인지 파악하는 시간이 필요하다. | 감정을 바로 말한다 | Communication, Health | 감정 언어화, 감정 피로 | Chapter 6, Chapter 11 | 감정 정리, 회복 리듬 | 감정 feature, 정리 시간, 피로 신호 |
| ID117 | 분위기를 읽고 말문을 연다 | 말할 내용만큼 말할 타이밍과 자리도 중요하게 본다. | 내용이 중요하면 바로 말한다 | Communication, Relationship | 표현 타이밍, 배려 방식 | Chapter 6, Chapter 5 | 타이밍 신호, 관계 분위기 | 타이밍 feature, 배려 feature, 수용 반응 |
| ID118 | 말보다 자료를 남긴다 | 중요한 내용은 말로 끝내지 않고 확인 가능한 자료로 남긴다. | 구두 합의를 신뢰한다 | Communication, Decision | 문서화, 후회 민감도 | Chapter 6, Chapter 3 | 기록 신호, 선택 안정 | 기록 feature, 결정 feature, 분쟁 감소 |
| ID119 | 상대 언어에 맞춰 바꾼다 | 같은 내용도 듣는 사람의 이해 방식에 맞춰 전달한다. | 자기 방식으로 일관되게 말한다 | Communication, Leadership | 설득 방식, 사람을 움직이는 방식 | Chapter 6, Chapter 7 | 표현 조정, 영향 신호 | 조정 feature, 설득 feature, 이해도 |
| ID120 | 말의 책임을 무겁게 본다 | 한 번 말한 것이 관계와 선택에 영향을 준다고 느낀다. | 말은 상황에 따라 가볍게 바뀐다 | Communication, Identity | 말의 밀도, 책임 수용도 | Chapter 6, Chapter 1 | 표현 책임, 중심축 신호 | 책임 feature, 표현 feature, 수정 빈도 |

### G. 영향력과 책임 구조

| ID | 이름 | 설명 | 반대 개념 | 관련 축 | 관련 Feature | 관련 Chapter | 명리 Source | Confidence 후보 |
|---|---|---|---|---|---|---|---|---|
| ID121 | 기준으로 사람을 움직인다 | 감정 호소보다 지켜야 할 기준을 제시해 방향을 만든다. | 분위기로 사람을 움직인다 | Leadership, Decision | 기준 제시, 사람을 움직이는 방식 | Chapter 7, Chapter 3 | 기준 신호, 사회 역할 | 기준 feature, 영향 feature, 수용도 |
| ID122 | 실무로 신뢰를 얻는다 | 말보다 실제 처리 능력과 결과로 영향력을 만든다. | 말과 상징으로 신뢰를 얻는다 | Leadership, Action | 영향력 지속성, 실행 속도 | Chapter 7, Chapter 4 | 실행 신뢰, 역할 신호 | 실행 feature, 신뢰 feature, 결과 반복 |
| ID123 | 뒤에서 판을 정리한다 | 앞에 서기보다 구조와 흐름을 정리해 일이 굴러가게 한다. | 앞에서 방향을 외친다 | Leadership, Thinking | 조직 적응, 패턴 인식 | Chapter 7, Chapter 2 | 배후 정리, 구조 신호 | 정리 feature, 영향 feature, 노출도 |
| ID124 | 책임을 먼저 가져온다 | 애매한 상황에서 누가 할지 기다리기보다 자신의 몫을 잡는다. | 책임이 정해질 때까지 기다린다 | Leadership, Action | 책임 수용도, 주도성 | Chapter 7, Chapter 4 | 책임 압력, 실행 활성 | 책임 feature, 시작 feature, 과부하 보정 |
| ID125 | 권한보다 책임을 먼저 본다 | 자리를 얻는 것보다 그 자리에서 감당할 부담을 먼저 계산한다. | 권한과 기회를 먼저 본다 | Leadership, Decision | 책임 수용, 위험 감수 | Chapter 7, Chapter 3 | 역할 무게, 위험 신호 | 책임 feature, 위험 feature, 역할 지속 |
| ID126 | 위기에서 역할이 선명해진다 | 평소보다 문제가 생겼을 때 자신이 해야 할 일이 분명해진다. | 위기에서 역할이 흐려진다 | Leadership, Conflict | 위기 시 역할, 압박 반응 | Chapter 7, Chapter 8 | 위기 활성, 역할 위치 | 위기 feature, 역할 feature, 결과 안정 |
| ID127 | 사람보다 시스템을 본다 | 특정 개인보다 일이 반복 가능하게 돌아가는 구조를 만든다. | 시스템보다 사람의 의지를 본다 | Leadership, Thinking | 기준 제시, 구조화 | Chapter 7, Chapter 2 | 시스템화 신호, 구조 배열 | 시스템 feature, 반복 성공, 사람 반응 |
| ID128 | 사람을 먼저 안정시킨다 | 일을 밀기 전에 사람들이 흔들리지 않도록 상태를 정리한다. | 일을 먼저 밀어붙인다 | Leadership, Relationship | 사람을 움직이는 방식, 배려 | Chapter 7, Chapter 5 | 관계 안정, 역할 신호 | 안정 feature, 관계 feature, 실행 결과 |
| ID129 | 권위에 질문을 던진다 | 위에서 내려온 기준도 이유와 조건을 확인한다. | 권위를 먼저 따른다 | Leadership, Identity | 권위와의 관계, 자기 기준 | Chapter 7, Chapter 1 | 권위 압력, 중심축 독립 | 권위 반응, 독립 feature, 충돌 보정 |
| ID130 | 권위를 책임으로 사용한다 | 권한을 과시하기보다 결정과 보호의 책임으로 쓴다. | 권위를 지위로 사용한다 | Leadership, Relationship | 책임 수용, 관계 책임 | Chapter 7, Chapter 5 | 권한 역할, 책임 신호 | 책임 feature, 권한 feature, 관계 안정 |
| ID131 | 분위기를 만든다 | 직접 지시하지 않아도 자리의 온도와 흐름을 바꾼다. | 명확한 지시로 움직인다 | Leadership, Communication | 사람을 움직이는 방식, 표현 타이밍 | Chapter 7, Chapter 6 | 분위기 영향, 표현 신호 | 분위기 feature, 표현 feature, 참여 반응 |
| ID132 | 역할을 나눠 맡긴다 | 혼자 해결하기보다 각자가 잘할 수 있는 몫을 배치한다. | 중요한 일은 직접 처리한다 | Leadership, Wealth | 조직 적응, 자원 배분 | Chapter 7, Chapter 10 | 배치 신호, 자원 흐름 | 배치 feature, 자원 feature, 완료율 |
| ID133 | 기준이 무너지면 개입한다 | 평소에는 맡기더라도 핵심 기준이 흔들리면 직접 들어간다. | 기준이 흔들려도 맡겨둔다 | Leadership, Conflict | 기준 제시, 정면 대응 | Chapter 7, Chapter 8 | 기준 압력, 충돌 신호 | 기준 feature, 개입 빈도, 갈등 결과 |
| ID134 | 사람을 성장시켜 맡긴다 | 당장 잘하는 사람보다 자랄 수 있는 사람에게 기회를 준다. | 이미 증명된 사람에게 맡긴다 | Leadership, Growth | 성장 트리거, 사람을 움직이는 방식 | Chapter 7, Chapter 9 | 성장 배치, 역할 흐름 | 성장 feature, 배치 feature, 결과 추적 |
| ID135 | 혼란 속에서 우선순위를 정한다 | 정보가 엉킬 때 무엇부터 해야 하는지 순서를 잡는다. | 혼란 속에서 함께 흔들린다 | Leadership, Decision | 위기 시 역할, 기준 형성 | Chapter 7, Chapter 3 | 우선순위 신호, 압박 흐름 | 우선순위 feature, 압박 feature, 실행 안정 |
| ID136 | 영향력을 오래 쌓는다 | 한 번에 강하게 장악하기보다 신뢰를 축적해 영향력을 만든다. | 순간 장악력으로 움직인다 | Leadership, Relationship | 영향력 지속성, 장기 관계 | Chapter 7, Chapter 5 | 장기 신뢰, 관계 축적 | 지속 feature, 신뢰 feature, 시간 일치 |
| ID137 | 불필요한 통제를 줄인다 | 모두를 관리하기보다 필요한 지점만 잡고 나머지는 맡긴다. | 세부까지 통제한다 | Leadership, Action | 조직 적응, 실행 후 피로 | Chapter 7, Chapter 4 | 통제 범위, 실행 분산 | 통제 feature, 피로 feature, 결과 안정 |
| ID138 | 책임이 없으면 영향도 줄인다 | 감당할 책임이 없는 자리에서는 함부로 영향력을 쓰지 않는다. | 책임 없이도 개입한다 | Leadership, Identity | 책임 수용, 경계 설정 | Chapter 7, Chapter 1 | 책임 경계, 중심축 신호 | 책임 feature, 경계 feature, 개입 빈도 |
| ID139 | 앞에 설 때 이유가 필요하다 | 주목 자체보다 앞에 서야 할 명분이 있을 때 나선다. | 주목이 있으면 앞에 선다 | Leadership, Communication | 주도성, 명분 형성 | Chapter 7, Chapter 6 | 노출 신호, 명분 신호 | 노출 feature, 명분 feature, 역할 적합 |
| ID140 | 실패 후 구조를 고친다 | 사람을 탓하기보다 실패가 반복된 구조를 먼저 고친다. | 실패한 사람을 먼저 바꾼다 | Leadership, Growth | 자기 수정, 조직 적응 | Chapter 7, Chapter 9 | 실패 반복, 구조 수정 | 수정 feature, 반복 feature, 개선 결과 |

### H. 갈등과 경계 구조

| ID | 이름 | 설명 | 반대 개념 | 관련 축 | 관련 Feature | 관련 Chapter | 명리 Source | Confidence 후보 |
|---|---|---|---|---|---|---|---|---|
| ID141 | 갈등을 늦게 드러낸다 | 불편함을 바로 표현하지 않고 내부에서 오래 검토한다. | 불편함을 바로 드러낸다 | Conflict, Communication | 갈등 민감도, 침묵의 의미 | Chapter 8, Chapter 6 | 갈등 보류, 표현 압력 | 보류 feature, 표현 feature, 누적 피로 |
| ID142 | 선을 넘으면 단호해진다 | 평소에는 유연해도 핵심 경계가 침범되면 분명히 멈춘다. | 선을 넘어도 조정한다 | Conflict, Identity | 손절 기준, 경계 설정 | Chapter 8, Chapter 1 | 경계 신호, 충돌 압력 | 경계 feature, 단호 반응, 회복 가능성 |
| ID143 | 갈등을 구조 문제로 본다 | 개인 감정보다 반복되는 조건과 구조를 먼저 본다. | 개인 감정으로 갈등을 본다 | Conflict, Thinking | 반복 갈등 패턴, 원리화 | Chapter 8, Chapter 2 | 반복 충돌, 구조 인식 | 구조 feature, 갈등 반복, 감정 보정 |
| ID144 | 충돌 전에 예방한다 | 문제가 커지기 전 규칙과 기대를 맞춰 갈등을 줄인다. | 충돌 후에 해결한다 | Conflict, Decision | 갈등 민감도, 기준 형성 | Chapter 8, Chapter 3 | 예방 신호, 기준 압력 | 예방 feature, 기준 feature, 충돌 감소 |
| ID145 | 정면으로 확인한다 | 애매한 긴장보다 직접 확인하는 편을 택한다. | 시간이 지나길 기다린다 | Conflict, Communication | 정면 대응, 직설 성향 | Chapter 8, Chapter 6 | 정면 충돌, 표현 직진 | 정면 feature, 표현 feature, 관계 결과 |
| ID146 | 물러나서 식힌다 | 감정이 올라오면 즉시 맞서기보다 거리와 시간을 둔다. | 올라온 감정으로 맞선다 | Conflict, Health | 방어 방식, 쉬는 방식 | Chapter 8, Chapter 11 | 회복 거리, 감정 압력 | 거리 feature, 회복 feature, 재대화 가능성 |
| ID147 | 반복되는 무례를 기억한다 | 한 번의 실수보다 반복되는 태도를 기준으로 삼는다. | 그때마다 새로 판단한다 | Conflict, Relationship | 실망 후 반응, 손절 기준 | Chapter 8, Chapter 5 | 반복 관계, 경계 신호 | 반복 feature, 실망 feature, 관계 전환 |
| ID148 | 사과보다 변화 여부를 본다 | 말로 사과했는지보다 이후 행동이 바뀌는지를 확인한다. | 사과 표현을 먼저 본다 | Conflict, Relationship | 화해 가능성, 신뢰 형성 | Chapter 8, Chapter 5 | 행동 반복, 화해 신호 | 변화 feature, 신뢰 feature, 재발 여부 |
| ID149 | 갈등 후 기록을 남긴다 | 같은 문제가 반복되지 않도록 합의와 기준을 남긴다. | 갈등이 지나가면 덮는다 | Conflict, Communication | 반복 갈등 패턴, 문서화 | Chapter 8, Chapter 6 | 기록 신호, 충돌 반복 | 기록 feature, 반복 감소, 합의 안정 |
| ID150 | 압박을 받으면 말이 짧아진다 | 긴 설명보다 필요한 말만 남기며 반응한다. | 압박을 받으면 말이 길어진다 | Conflict, Communication | 압박 언어, 말의 밀도 | Chapter 8, Chapter 6 | 압박 표현, 언어 압축 | 압박 feature, 밀도 feature, 오해 보정 |
| ID151 | 경쟁 상황에서 기준을 세운다 | 경쟁 자체보다 공정한 기준과 규칙을 먼저 요구한다. | 경쟁 흐름에 바로 들어간다 | Conflict, Leadership | 방어 방식, 기준 제시 | Chapter 8, Chapter 7 | 경쟁 신호, 기준 압력 | 경쟁 feature, 기준 feature, 결과 안정 |
| ID152 | 불공정에 오래 반응한다 | 개인 손해보다 기준이 무너진 상황에 더 오래 반응한다. | 개인 손해에 더 민감하다 | Conflict, Leadership | 갈등 민감도, 권위와의 관계 | Chapter 8, Chapter 7 | 공정성 신호, 사회 압력 | 공정 feature, 갈등 feature, 지속 반응 |
| ID153 | 감정 폭발보다 차단을 선택한다 | 크게 싸우기보다 접촉과 정보 흐름을 줄인다. | 부딪혀서 풀려고 한다 | Conflict, Relationship | 방어 방식, 손절 기준 | Chapter 8, Chapter 5 | 차단 신호, 관계 거리 | 차단 feature, 거리 feature, 재접속 여부 |
| ID154 | 문제를 말하기 전 근거를 모은다 | 감정만으로 꺼내기보다 확인 가능한 근거를 준비한다. | 느낀 즉시 말한다 | Conflict, Thinking | 의심과 검증, 정면 대응 | Chapter 8, Chapter 2 | 근거 축적, 충돌 보류 | 근거 feature, 보류 feature, 전달 성공 |
| ID155 | 화해에도 조건이 필요하다 | 시간이 지났다고 풀리는 것이 아니라 바뀐 조건이 있어야 한다. | 시간이 지나면 자연히 풀린다 | Conflict, Relationship | 화해 가능성, 경계 설정 | Chapter 8, Chapter 5 | 화해 조건, 경계 신호 | 조건 feature, 화해 feature, 반복 여부 |
| ID156 | 갈등 중에도 일은 분리한다 | 사람과 부딪혀도 필요한 일은 따로 처리하려 한다. | 갈등이 일 전체를 멈춘다 | Conflict, Action | 압박 반응, 실행 지속 | Chapter 8, Chapter 4 | 실행 분리, 충돌 압력 | 분리 feature, 실행 feature, 피로 보정 |
| ID157 | 약한 신호를 빨리 감지한다 | 큰 문제가 되기 전 표정, 말투, 반복 변화에서 긴장을 읽는다. | 문제가 커져야 감지한다 | Conflict, Thinking | 갈등 민감도, 관찰력 | Chapter 8, Chapter 2 | 미세 신호, 관계 감지 | 감지 feature, 관찰 feature, 오탐 보정 |
| ID158 | 자기 방어가 늦다 | 불편해도 먼저 상황을 이해하려다 방어가 늦어질 수 있다. | 방어를 먼저 세운다 | Conflict, Relationship | 방어 방식, 배려 방식 | Chapter 8, Chapter 5 | 방어 지연, 관계 배려 | 방어 feature, 배려 feature, 손상 위험 |
| ID159 | 경계가 세워지면 회복된다 | 애매할 때보다 선이 정리되면 다시 안정된다. | 경계가 생기면 더 불편해진다 | Conflict, Health | 경계 설정, 회복 방식 | Chapter 8, Chapter 11 | 경계 안정, 회복 리듬 | 경계 feature, 회복 feature, 안정도 |
| ID160 | 갈등에서 배운 기준을 저장한다 | 한 번 겪은 충돌을 다음 관계와 선택의 기준으로 바꾼다. | 갈등을 지나간 사건으로 둔다 | Conflict, Growth | 실패 회복, 자기 수정 | Chapter 8, Chapter 9 | 갈등 학습, 기준 갱신 | 학습 feature, 기준 feature, 반복 감소 |

### I. 자원과 일의 구조

| ID | 이름 | 설명 | 반대 개념 | 관련 축 | 관련 Feature | 관련 Chapter | 명리 Source | Confidence 후보 |
|---|---|---|---|---|---|---|---|---|
| ID161 | 가치를 자원으로 바꾼다 | 가진 능력이나 경험을 실제 쓸 수 있는 자원으로 전환한다. | 가치를 안에만 보관한다 | Wealth, Action | 가치 교환, 실행 속도 | Chapter 10, Chapter 4 | 자원 전환, 실행 통로 | 전환 feature, 실행 feature, 결과 반복 |
| ID162 | 자원을 천천히 축적한다 | 한 번에 크게 얻기보다 오래 쌓아 안정성을 만든다. | 한 번의 큰 기회를 노린다 | Wealth, Life Flow | 축적 방식, 장기 방향 | Chapter 10, Chapter 12 | 축적 흐름, 장기 신호 | 축적 feature, 흐름 feature, 변동 보정 |
| ID163 | 기회를 숫자보다 구조로 본다 | 단기 수익보다 일이 커질 구조인지 먼저 본다. | 당장 보이는 이익을 먼저 본다 | Wealth, Thinking | 기회 포착, 추상화 | Chapter 10, Chapter 2 | 기회 구조, 자원 흐름 | 구조 feature, 기회 feature, 후속 확장 |
| ID164 | 낭비를 늦게 알아차린다 | 몰입 중에는 쓰는 자원보다 목표를 먼저 보다가 뒤늦게 점검한다. | 쓰는 자원을 즉시 감지한다 | Wealth, Health | 소비 패턴, 과로 패턴 | Chapter 10, Chapter 11 | 소모 신호, 목표 압력 | 소모 feature, 목표 feature, 피로 누적 |
| ID165 | 작은 누수를 잘 막는다 | 큰 수익보다 반복되는 손실과 새는 자원을 먼저 관리한다. | 큰 흐름만 관리한다 | Wealth, Thinking | 자원 감각, 디테일 민감도 | Chapter 10, Chapter 2 | 누수 감지, 세부 신호 | 누수 feature, 디테일 feature, 절감 효과 |
| ID166 | 돈보다 시간을 먼저 계산한다 | 선택의 비용을 돈보다 시간과 집중력 손실로 계산한다. | 돈의 비용을 먼저 계산한다 | Wealth, Decision | 자원 감각, 후회 민감도 | Chapter 10, Chapter 3 | 시간 자원, 선택 압력 | 시간 feature, 선택 feature, 후회 반응 |
| ID167 | 안정성이 있어야 확장한다 | 기본 자원이 확보되어야 더 큰 시도를 시작한다. | 확장하면서 안정성을 만든다 | Wealth, Decision | 안정성 선호, 위험 관리 | Chapter 10, Chapter 3 | 안정 기반, 확장 흐름 | 안정 feature, 위험 feature, 확장 성공 |
| ID168 | 기회가 오면 자원을 모은다 | 가능성이 보이면 흩어진 사람, 시간, 돈을 한곳으로 모은다. | 자원이 준비된 뒤 기회를 찾는다 | Wealth, Leadership | 기회 포착, 자원 배분 | Chapter 10, Chapter 7 | 기회 활성, 배치 신호 | 기회 feature, 배치 feature, 결과화 |
| ID169 | 일의 의미와 보상을 함께 본다 | 의미만 있거나 보상만 있는 일보다 둘의 연결을 본다. | 의미와 보상을 분리한다 | Wealth, Identity | 일과 돈의 연결, 자기 기준 | Chapter 10, Chapter 1 | 가치 연결, 중심축 신호 | 의미 feature, 보상 feature, 지속 여부 |
| ID170 | 자원을 사람에게 투자한다 | 물건보다 관계, 교육, 경험에 자원을 쓰는 경향이 있다. | 자원을 소유물에 투자한다 | Wealth, Relationship | 소비 패턴, 관계 책임 | Chapter 10, Chapter 5 | 관계 투자, 자원 흐름 | 투자 feature, 관계 feature, 회수 보정 |
| ID171 | 보이지 않는 준비에 투자한다 | 당장 드러나지 않아도 기반, 공부, 시스템에 자원을 쓴다. | 바로 보이는 결과에 투자한다 | Wealth, Growth | 축적 방식, 배움 지속 | Chapter 10, Chapter 9 | 기반 축적, 학습 자원 | 기반 feature, 학습 feature, 시간 지연 |
| ID172 | 교환 조건을 분명히 한다 | 호의와 거래, 책임과 보상의 경계를 명확히 하려 한다. | 좋은 마음이면 조건을 흐린다 | Wealth, Relationship | 가치 교환, 경계 설정 | Chapter 10, Chapter 5 | 교환 경계, 관계 균형 | 교환 feature, 경계 feature, 갈등 감소 |
| ID173 | 자원이 부족하면 시야가 좁아진다 | 시간이나 돈이 부족할 때 장기 방향보다 당장 해결에 몰린다. | 부족할수록 큰 그림을 본다 | Wealth, Health | 자원 감각, 스트레스 축적 | Chapter 10, Chapter 11 | 부족 압력, 피로 신호 | 부족 feature, 피로 feature, 결정 변화 |
| ID174 | 남는 자원을 쌓아둔다 | 쓰고 남은 여유를 즉시 소비하지 않고 다음 선택을 위해 남긴다. | 남는 자원을 바로 쓴다 | Wealth, Decision | 축적 방식, 리스크 관리 | Chapter 10, Chapter 3 | 보존 신호, 위험 감지 | 보존 feature, 위험 feature, 긴급 대응 |
| ID175 | 자원보다 가능성을 먼저 본다 | 부족한 자원보다 만들 수 있는 가능성에 먼저 반응한다. | 현재 자원 안에서만 본다 | Wealth, Growth | 기회 포착, 성장 트리거 | Chapter 10, Chapter 9 | 가능성 신호, 확장 흐름 | 가능성 feature, 성장 feature, 손실 보정 |
| ID176 | 쓸 곳과 아낄 곳을 나눈다 | 모든 곳에 아끼거나 쓰지 않고 우선순위에 따라 배분한다. | 전반적으로 아끼거나 쓴다 | Wealth, Decision | 소비 패턴, 기준 형성 | Chapter 10, Chapter 3 | 배분 신호, 기준 압력 | 배분 feature, 기준 feature, 결과 만족 |
| ID177 | 일의 흐름을 자산으로 만든다 | 반복되는 업무를 기록과 시스템으로 바꿔 다음 자산으로 남긴다. | 일이 끝나면 흐름도 사라진다 | Wealth, Leadership | 축적 방식, 시스템화 | Chapter 10, Chapter 7 | 시스템 축적, 역할 신호 | 시스템 feature, 축적 feature, 재사용도 |
| ID178 | 값보다 쓰임을 본다 | 비싼지 싼지보다 실제로 얼마나 쓰이는지를 기준으로 판단한다. | 가격 자체를 먼저 본다 | Wealth, Thinking | 자원 감각, 기능 인식 | Chapter 10, Chapter 2 | 쓰임 감지, 가치 신호 | 쓰임 feature, 가치 feature, 만족도 |
| ID179 | 손실을 배움으로 바꾼다 | 잃은 자원을 그냥 후회하지 않고 다음 기준으로 전환한다. | 손실을 오래 붙든다 | Wealth, Growth | 실패 회복, 자기 수정 | Chapter 10, Chapter 9 | 손실 학습, 기준 갱신 | 손실 feature, 학습 feature, 재발 감소 |
| ID180 | 자원 흐름이 막히면 몸이 먼저 지친다 | 돈, 시간, 일의 흐름이 막히면 신체적 피로로 먼저 나타날 수 있다. | 자원 문제와 몸 상태를 분리한다 | Wealth, Health | 과로 패턴, 스트레스 축적 | Chapter 10, Chapter 11 | 자원 압박, 회복 리듬 | 자원 feature, 피로 feature, 흐름 회복 |

### J. 회복과 흐름 구조

| ID | 이름 | 설명 | 반대 개념 | 관련 축 | 관련 Feature | 관련 Chapter | 명리 Source | Confidence 후보 |
|---|---|---|---|---|---|---|---|---|
| ID181 | 조용히 회복한다 | 자극을 늘리기보다 외부 입력을 줄일 때 회복된다. | 사람과 자극 속에서 회복한다 | Health, Relationship | 쉬는 방식, 거리 조절 | Chapter 11, Chapter 5 | 회복 거리, 관계 피로 | 회복 feature, 거리 feature, 재충전 속도 |
| ID182 | 움직이며 회복한다 | 가만히 쉬는 것보다 몸을 쓰거나 환경을 바꾸며 회복된다. | 멈춰야 회복된다 | Health, Action | 회복 속도, 몸으로 익힘 | Chapter 11, Chapter 4 | 활동 회복, 실행 리듬 | 활동 feature, 회복 feature, 피로 감소 |
| ID183 | 잠이 무너지면 판단도 흐려진다 | 수면과 리듬이 깨질 때 결정과 감정 조절이 같이 흔들린다. | 수면과 판단이 분리된다 | Health, Decision | 수면/리듬 민감도, 확신 속도 | Chapter 11, Chapter 3 | 리듬 신호, 판단 압력 | 수면 feature, 판단 feature, 오류 증가 |
| ID184 | 감정 피로가 늦게 온다 | 당장은 버티지만 시간이 지난 뒤 누적 피로가 올라온다. | 감정 피로가 바로 드러난다 | Health, Conflict | 감정 피로, 방어 방식 | Chapter 11, Chapter 8 | 감정 누적, 방어 지연 | 누적 feature, 피로 feature, 지연 반응 |
| ID185 | 과로를 성과로 착각한다 | 많이 해낸 상태를 좋은 상태로 오해해 쉬는 시점을 놓칠 수 있다. | 과로 신호를 빨리 알아차린다 | Health, Action | 과로 패턴, 실행 후 피로 | Chapter 11, Chapter 4 | 소모 신호, 성과 압력 | 과로 feature, 성과 feature, 회복 지연 |
| ID186 | 회복 전에 정리가 필요하다 | 쉬기 전에 해야 할 일과 생각을 정리해야 몸이 풀린다. | 바로 쉬어야 회복된다 | Health, Thinking | 쉬는 방식, 정보 과부하 | Chapter 11, Chapter 2 | 정리 신호, 회복 리듬 | 정리 feature, 회복 feature, 과부하 감소 |
| ID187 | 환경이 바뀌면 흐름도 바뀐다 | 장소, 사람, 일의 구조가 바뀔 때 생활 리듬이 크게 달라진다. | 환경이 바뀌어도 리듬이 유지된다 | Health, Life Flow | 리듬 민감도, 전환기 여부 | Chapter 11, Chapter 12 | 환경 전환, 흐름 변화 | 환경 feature, 흐름 feature, 적응 시간 |
| ID188 | 회복을 미루다 한 번에 멈춘다 | 조금씩 쉬기보다 버티다가 큰 멈춤이 필요해질 수 있다. | 자주 쉬며 조절한다 | Health, Action | 번아웃 위험, 실행 후 피로 | Chapter 11, Chapter 4 | 소모 누적, 멈춤 신호 | 소모 feature, 번아웃 feature, 회복 주기 |
| ID189 | 현재 흐름을 읽고 움직인다 | 지금이 확장할 때인지 정리할 때인지 확인하고 행동을 맞춘다. | 흐름과 무관하게 목표를 밀어붙인다 | Life Flow, Decision | 현재 흐름, 장기 방향 | Chapter 12, Chapter 3 | 현재 흐름, 전환 신호 | 흐름 feature, 선택 feature, 결과 안정 |
| ID190 | 전환기에 오래 적응한다 | 큰 변화가 오면 바로 새 리듬으로 들어가기보다 적응 시간이 필요하다. | 전환 직후 바로 적응한다 | Life Flow, Health | 전환기 여부, 회복 속도 | Chapter 12, Chapter 11 | 전환 흐름, 회복 리듬 | 전환 feature, 회복 feature, 안정 도달 |
| ID191 | 확장기에는 사람을 더 만난다 | 흐름이 열릴 때 관계와 기회 접점을 넓힌다. | 확장기에도 혼자 준비한다 | Life Flow, Relationship | 관계 흐름, 확장 국면 | Chapter 12, Chapter 5 | 확장 흐름, 관계 접점 | 확장 feature, 관계 feature, 기회 발생 |
| ID192 | 정리기에는 기준을 줄인다 | 많은 것을 벌이기보다 남길 것과 내려놓을 것을 구분한다. | 정리기에도 계속 늘린다 | Life Flow, Decision | 정리 국면, 기준 형성 | Chapter 12, Chapter 3 | 정리 흐름, 선택 압력 | 정리 feature, 기준 feature, 피로 감소 |
| ID193 | 변화보다 축적이 먼저다 | 새 방향보다 지금까지 쌓은 것을 단단히 만드는 흐름에 잘 맞는다. | 축적보다 변화를 먼저 택한다 | Life Flow, Growth | 축적 국면, 배움 지속 | Chapter 12, Chapter 9 | 축적 흐름, 학습 자원 | 축적 feature, 성장 feature, 안정도 |
| ID194 | 변화가 와야 성장한다 | 익숙한 구조가 흔들릴 때 새로운 능력이 열린다. | 안정이 있어야 성장한다 | Life Flow, Growth | 변화 국면, 성장 트리거 | Chapter 12, Chapter 9 | 변화 흐름, 성장 압력 | 변화 feature, 성장 feature, 적응 결과 |
| ID195 | 반복 과제가 다시 돌아온다 | 비슷한 선택과 관계 문제가 시간차를 두고 반복될 수 있다. | 매번 전혀 다른 과제를 만난다 | Life Flow, Conflict | 반복 과제, 반복 갈등 | Chapter 12, Chapter 8 | 반복 흐름, 충돌 후보 | 반복 feature, 갈등 feature, 주기 일치 |
| ID196 | 준비한 자원이 때를 만난다 | 오래 쌓아둔 능력이나 관계가 특정 흐름에서 쓰임을 얻는다. | 그때그때 필요한 자원을 만든다 | Life Flow, Wealth | 준비 자원, 기회 포착 | Chapter 12, Chapter 10 | 준비 흐름, 자원 활성 | 준비 feature, 기회 feature, 결과화 |
| ID197 | 흐름이 닫히면 내부를 다진다 | 바깥 확장이 어려울 때 자신과 시스템을 정비하는 쪽으로 전환한다. | 닫힌 흐름에서도 밖으로 밀어붙인다 | Life Flow, Identity | 수축 국면, 자기 기준 | Chapter 12, Chapter 1 | 수축 흐름, 중심축 정비 | 수축 feature, 정비 feature, 피로 감소 |
| ID198 | 큰 변화 전 작은 신호를 감지한다 | 전환이 오기 전 관계, 일, 몸의 작은 변화를 먼저 느낀다. | 변화가 커진 뒤 알아차린다 | Life Flow, Thinking | 전환기 여부, 관찰력 | Chapter 12, Chapter 2 | 전환 예비 신호, 관찰 신호 | 전환 feature, 관찰 feature, 오탐 보정 |
| ID199 | 지금 필요한 속도를 조절한다 | 무조건 빠르게 가기보다 현재 흐름에 맞는 속도를 찾는다. | 자신의 속도만 고정한다 | Life Flow, Action | 현재 흐름, 실행 속도 | Chapter 12, Chapter 4 | 속도 흐름, 실행 리듬 | 속도 feature, 실행 feature, 흐름 일치 |
| ID200 | 다음 장을 준비한다 | 현재 결론보다 다음 시기에 필요한 자원과 태도를 준비한다. | 지금의 결론에 머문다 | Life Flow, Growth | 장기 방향, 준비 자원 | Chapter 12, Chapter 9 | 다음 흐름, 준비 신호 | 준비 feature, 장기 feature, 전환 안정 |

## 6. Blueprint Core 조합 구조

Blueprint Core는 Vocabulary를 단독 결론으로 사용하지 않는다. 한 사람을 설명할 때는 여러 Vocabulary를 묶어 구조 문장을 만든다.

### 6.1 기본 조합 단위

Core는 다음 단위로 Vocabulary를 조합한다.

| 조합 단위 | 설명 |
|---|---|
| Primary Vocabulary | 해당 사람을 가장 강하게 설명하는 5개에서 9개의 구조 |
| Supporting Vocabulary | Primary를 보강하거나 조건을 설명하는 8개에서 16개의 구조 |
| Tension Vocabulary | 서로 다른 방향으로 동시에 나타나는 3개에서 7개의 구조 |
| Risk Vocabulary | 과부하, 관계 손상, 결정 지연처럼 주의가 필요한 구조 |
| Growth Vocabulary | 시간이 지나며 다듬어질 수 있는 구조 |

### 6.2 구조 문장 생성 방식

Vocabulary는 다음 순서로 문장화한다.

```text
1. 중심 구조를 고른다.
2. 판단 방식과 실행 방식을 연결한다.
3. 관계에서 나타나는 반복을 붙인다.
4. 갈등과 회복 조건을 덧붙인다.
5. 현재 흐름에서 어떤 구조가 커지는지 표시한다.
```

예시:

```text
이 사람은 빠른 결정보다 기준을 먼저 만든다.
기준이 서면 실행은 늦지 않지만, 기준이 흐리면 멈춰서 다시 정의한다.
관계에서도 가까워지는 속도보다 신뢰가 쌓이는 조건을 더 중요하게 본다.
갈등이 생기면 감정의 크기보다 반복되는 구조를 먼저 확인하려 한다.
지금의 흐름에서는 새 확장보다 다음 장을 준비하는 방식이 더 안정적이다.
```

### 6.3 Confidence 계산 제안

각 Vocabulary의 Confidence는 단일 source로 계산하지 않는다. 최소 세 종류의 신호를 함께 본다.

| 계산 요소 | 설명 |
|---|---|
| Source Strength | 내부 계산 source가 해당 Vocabulary와 얼마나 강하게 연결되는지 |
| Cross-Axis Support | 다른 축의 feature가 같은 방향으로 지지하는지 |
| Conflict Penalty | 반대 Vocabulary 신호가 얼마나 강한지 |
| Repetition Evidence | 같은 구조가 여러 위치와 흐름에서 반복되는지 |
| Timing Modifier | 현재 흐름에서 해당 구조가 커지는지 줄어드는지 |
| Chapter Fit | 실제 책의 어느 챕터에서 자연스럽게 쓰일 수 있는지 |

권장 표현:

```text
High Confidence:
여러 축에서 같은 구조가 반복된다.

Medium Confidence:
주요 source는 분명하지만 반대 방향 신호도 함께 있다.

Low Confidence:
단일 source에 가깝거나 현재 흐름에서만 일시적으로 나타난다.
```

### 6.4 반대 Vocabulary 사용 원칙

반대 개념은 사람을 둘 중 하나로 나누기 위한 값이 아니다.

Core는 다음처럼 읽어야 한다.

```text
이 사람은 기본적으로 기준을 먼저 만드는 쪽에 가깝다.
다만 압박이 강하거나 시간이 제한될 때는 조건이 맞으면 빠르게 결정하는 구조도 함께 나타난다.
```

반대 Vocabulary는 모순이 아니라 조건 차이를 설명하기 위한 장치다.

### 6.5 Chapter 연결 제안

| Chapter | 주로 사용할 Vocabulary |
|---|---|
| Chapter 1. 나는 누구인가 | ID001-ID020, ID169, ID197 |
| Chapter 2. 나는 어떻게 생각하는가 | ID021-ID040, ID111, ID154, ID198 |
| Chapter 3. 나는 어떻게 결정하는가 | ID041-ID060, ID118, ID166, ID199 |
| Chapter 4. 나는 어떻게 움직이는가 | ID061-ID080, ID122, ID156 |
| Chapter 5. 나는 사람을 어떻게 대하는가 | ID081-ID100, ID170, ID191 |
| Chapter 6. 나는 어떻게 말하고 전달하는가 | ID101-ID120, ID149 |
| Chapter 7. 나는 어떤 방식으로 영향력을 갖는가 | ID121-ID140, ID177 |
| Chapter 8. 나는 갈등을 어떻게 겪는가 | ID141-ID160, ID195 |
| Chapter 9. 나는 어떻게 성장하는가 | ID017, ID029, ID034, ID160, ID179, ID193, ID194, ID200 |
| Chapter 10. 나는 무엇을 자원으로 바꾸는가 | ID161-ID180, ID196 |
| Chapter 11. 나는 어떻게 소모되고 회복되는가 | ID181-ID188, ID059, ID100, ID180 |
| Chapter 12. 나는 어떤 흐름 위에 있는가 | ID189-ID200 |

## 7. 금지 문장 예시

다음 유형의 문장은 Vocabulary 문장으로 쓰지 않는다.

```text
이 사람은 사람을 한 단어로 분류할 수 있다.
이 사람은 좋은 사람이다.
이 사람은 능력이 있다.
이 사람은 타고난 장점이 있다.
이 사람은 특정 결과를 얻을 운이 있다.
```

대신 다음처럼 쓴다.

```text
이 사람은 낯선 자리에서도 연결점을 먼저 찾는다.
이 사람은 혼자 정리하는 시간이 있어야 관계에서도 안정적으로 머문다.
이 사람은 기준이 무너지는 순간 직접 개입한다.
이 사람은 가까운 관계일수록 자신의 몫을 분명히 가져간다.
이 사람은 반복 가능한 순서가 있을 때 실행력이 안정된다.
이 사람은 가진 능력이나 경험을 실제 쓸 수 있는 자원으로 전환한다.
이 사람은 현재 흐름에 맞춰 속도를 조절한다.
```

## 8. v1 사용 범위

Human Structure Vocabulary v1은 Blueprint Core의 언어 기반이다.

v1에서 하지 않는 것:

- 기능 구현
- JSON 스키마 정의
- 사용자 점수화 문구 작성
- 예언 문장 작성
- 전문 용어 해설 작성

v1에서 하는 것:

- 사람을 설명하는 최소 언어 단위 정의
- Core 축과 Chapter 연결
- 반대 개념과 tension 구조 준비
- Confidence 계산 후보 정리
- Writer가 사용할 문장 재료 제공
