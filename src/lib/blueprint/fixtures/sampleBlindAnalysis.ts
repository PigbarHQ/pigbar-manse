const sampleSectionTitles = [
  "명조 확정",
  "명조 핵심 구조",
  "적천수",
  "궁통보감",
  "육친론",
  "용신·상신",
  "병약론",
  "체용론",
  "희기신론",
  "리더십 구조",
  "재물 생성 구조",
  "후반 인생 구조",
  "종합 검증",
  "최종 압축",
  "기능적 역할 구조",
  "반복 충돌 구조",
  "기능이 살아나는 환경",
  "구조적 한계",
  "최종 한 문장",
];

const sampleInterpretations = [
  ["갑인, 신미, 임신, 임인의 배열이 하나의 흐름을 만든다."],
  ["금은 물을 낳고, 물은 나무를 키운다."],
  ["근원은 존재한다.", "출력은 강하다.", "정체보다 유통이 자연스럽다."],
  ["계절의 조건은 속도를 늦추지만 방향을 지우지 않는다."],
  ["관계는 독립된 완성이 아니라 이어지는 기능 속에서 드러난다."],
  ["막힌 것을 뚫는 힘보다 이어지게 하는 힘이 중요하다."],
  ["강한 부분과 약한 부분은 분리되지 않고 한 구조 안에서 함께 읽힌다."],
  ["몸과 쓰임은 같은 방향을 바라본다."],
  ["살아나는 힘과 무거운 힘을 함께 본다."],
  ["방향은 소리보다 먼저 놓인다."],
  ["가치는 흐름이 전달되고, 전달된 것이 구조로 남을 때 만들어진다."],
  ["후반에는 흐름의 양보다 유통과 수렴의 순서가 중요해진다."],
  ["각 항목은 같은 방향을 반복해서 가리킨다."],
  ["흐름은 이어질 때 자기 역할을 드러낸다."],
  ["방향을 만드는 기능이 핵심이다."],
  ["반복 충돌은 멈춤보다 우회와 재연결에서 완화된다."],
  ["기능은 막히지 않는 환경에서 살아난다."],
  ["속도가 지나치면 구조가 흩어질 수 있다."],
  ["사람은 반복하는 방식으로 설명된다."],
];

export const sampleBlindAnalysis = {
  coreAxis: {
    verbForm: "길을 만든다",
    explanation: "받아들인 것을 자기 방식으로 이어 내는 구조가 중심이다.",
  },
  narrativeLensCandidates: ["River", "Road", "Bridge"],
  doRules: ["이어지는 순서를 본다", "막힌 곳에서 다시 흐르는 방식을 본다"],
  dontRules: ["직업을 추정하지 않는다", "가족 관계를 단정하지 않는다", "길흉을 판단하지 않는다"],
  notThisPerson: ["한 번의 결론으로 설명되는 사람", "멈춘 상태에서 완성되는 사람"],
  finalCounselDirection: "끊어진 것을 다시 이어 줄 때 가장 자기답다는 방향으로 마무리한다.",
  sections: sampleSectionTitles.map((title, index) => ({
    id: `sample-section-${index + 1}`,
    index: index + 1,
    order: index + 1,
    title,
    layers: [
      {
        sajuOriginal:
          index === 0
            ? ["갑인", "신미", "임신", "임인"]
            : [`${title} sample evidence`, "갑인 · 신미 · 임신 · 임인"],
        classical:
          index === 2
            ? ["근원은 존재한다.", "출력은 강하다.", "정체보다 유통이 자연스럽다."]
            : [`${title} sample structure`],
        blueprint: sampleInterpretations[index],
      },
    ],
    body: sampleInterpretations[index],
    evidence: [`${title} sample evidence`],
    structure: sampleInterpretations[index].join(" "),
    interpretation: sampleInterpretations[index].join(" "),
  })),
};
