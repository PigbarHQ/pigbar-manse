import { calculateManse, CITY_OPTIONS, type ManseInput, type ManseResult } from "@/src/lib/manse";
import type { BlueprintBook, BlueprintCore, BlueprintFeature } from "./types";

const blueprintId = "bp-000001";
const featureEvidence = [
  "1974-07-30 03:50 서울 출생 입력",
  "지역시 보정 적용",
  "년주 갑인, 월주 신미, 일주 임신, 시주 임인",
  "현재 기준 시각 2026-07-02T12:30:00+09:00",
];

export const blueprintNo000001Input: ManseInput = {
  name: "주영지",
  birthDate: "1974-07-30",
  calendarType: "solar",
  isLeapMonth: false,
  birthTime: "03:50",
  unknownTime: false,
  gender: "male",
  birthPlace: {
    name: CITY_OPTIONS[0].name,
    label: CITY_OPTIONS[0].name,
    latitude: CITY_OPTIONS[0].latitude,
    longitude: CITY_OPTIONS[0].longitude,
    timezone: "Asia/Seoul",
  },
  useLocalMeanTime: true,
  currentDateTime: "2026-07-02T12:30:00+09:00",
  ziHourRule: "midnight",
  daewoonDirectionRule: "standard",
};

function makeFeature(
  id: string,
  axis: BlueprintFeature["axis"],
  title: string,
  summary: string,
  score: number,
  writerHint: string,
): BlueprintFeature {
  return {
    id,
    axis,
    title,
    summary,
    score,
    confidence: 0.86,
    evidence: featureEvidence,
    writerHint,
  };
}

function buildCore(manse: ManseResult): BlueprintCore {
  const sajuLine = `사주 네 기둥은 ${manse.saju.year.ganKo}${manse.saju.year.jiKo}, ${manse.saju.month.ganKo}${manse.saju.month.jiKo}, ${manse.saju.day.ganKo}${manse.saju.day.jiKo}, ${manse.saju.hour?.ganKo}${manse.saju.hour?.jiKo}로 정리된다.`;

  const features = [
    makeFeature(
      "ft-identity-standard-before-conclusion",
      "Identity",
      "결론보다 기준",
      "빠른 결론보다 기준이 충분히 섰는지를 먼저 확인하는 구조",
      0.91,
      "판단이 늦은 사람이 아니라 기준을 먼저 세우는 사람으로 쓴다.",
    ),
    makeFeature(
      "ft-thinking-layered-review",
      "Thinking",
      "층으로 쌓이는 사고",
      "한 번에 답을 내기보다 여러 층의 근거를 대조하는 사고 방식",
      0.84,
      "생각이 많다는 말 대신 검토의 층이 깊다고 쓴다.",
    ),
    makeFeature(
      "ft-decision-responsible-delay",
      "Decision",
      "책임 있는 지연",
      "결정 이후 감당해야 할 것을 먼저 보는 선택 방식",
      0.88,
      "망설임이 아니라 책임의 범위를 계산하는 태도로 쓴다.",
    ),
    makeFeature(
      "ft-action-slow-ignition",
      "Action",
      "늦게 붙는 지속력",
      "시작은 조심스럽지만 리듬이 잡히면 오래 밀고 가는 힘",
      0.81,
      "불꽃보다 불씨에 가까운 행동 리듬으로 쓴다.",
    ),
    makeFeature(
      "ft-relationship-trust-before-speed",
      "Relationship",
      "속도보다 신뢰",
      "관계가 빨리 넓어지는 것보다 오래 유지될 기준을 중요하게 보는 구조",
      0.86,
      "마음을 주지 않는 사람이 아니라 마음을 둘 자리를 확인하는 사람으로 쓴다.",
    ),
    makeFeature(
      "ft-communication-late-clear-voice",
      "Communication",
      "늦지만 책임 있는 말",
      "즉각적인 표현보다 정리된 뒤의 표현에 힘이 생기는 방식",
      0.8,
      "침묵을 결핍이 아니라 말의 책임으로 해석한다.",
    ),
    makeFeature(
      "ft-leadership-quiet-standard",
      "Leadership",
      "조용한 기준점",
      "앞에서 끌기보다 기준을 세워 주변을 정렬시키는 힘",
      0.78,
      "화려한 리더십이 아니라 믿을 수 있는 반복으로 쓴다.",
    ),
    makeFeature(
      "ft-conflict-boundary-after-patience",
      "Conflict",
      "오래 참은 뒤의 선",
      "갈등을 바로 터뜨리기보다 기준이 무너졌을 때 선을 긋는 방식",
      0.83,
      "분노가 아니라 오래 참은 기준의 회복으로 쓴다.",
    ),
    makeFeature(
      "ft-growth-accumulated-change",
      "Growth",
      "누적되는 성장",
      "한 번에 바뀌기보다 오래 쌓이며 달라지는 성장 방식",
      0.87,
      "폭발적 변화보다 축적의 변화를 중심으로 쓴다.",
    ),
    makeFeature(
      "ft-wealth-resource-order",
      "Wealth",
      "자원의 질서",
      "돈보다 자원을 다루는 기준과 지속 가능성을 중요하게 보는 구조",
      0.76,
      "돈복이라는 말 대신 자원을 대하는 질서로 쓴다.",
    ),
    makeFeature(
      "ft-health-rhythm-before-pressure",
      "Health",
      "압력보다 리듬",
      "무리한 버팀보다 자기 리듬 회복이 중요한 구조",
      0.74,
      "진단하지 않고 회복 리듬의 중요성으로 쓴다.",
    ),
    makeFeature(
      "ft-life-flow-realignment",
      "Life Flow",
      "다음 장을 위한 재정렬",
      "새 결론보다 방향과 기준을 다시 세우는 흐름",
      0.82,
      "미래 예언이 아니라 다음 장으로 넘어가기 전의 정리로 쓴다.",
    ),
  ];

  return {
    blueprintId,
    source: "pigbar-manse",
    axes: [
      {
        axis: "Identity",
        question: "나는 누구인가",
        summary: `결론보다 기준을 먼저 세우는 사람. ${sajuLine}`,
        confidence: 0.88,
        evidence: featureEvidence,
      },
      {
        axis: "Decision",
        question: "나는 어떻게 결정하는가",
        summary: "선택보다 선택 이후의 감당을 먼저 확인하는 구조",
        confidence: 0.86,
        evidence: featureEvidence,
      },
      {
        axis: "Relationship",
        question: "나는 사람을 어떻게 대하는가",
        summary: "빠른 친밀감보다 오래 남을 신뢰를 먼저 보는 구조",
        confidence: 0.84,
        evidence: featureEvidence,
      },
    ],
    features,
  };
}

const p = (id: string, text: string, featureIds: string[]) => ({ id, text, featureIds });

export function buildBlueprintNo000001(): { manse: ManseResult; book: BlueprintBook } {
  const manse = calculateManse(blueprintNo000001Input);
  const core = buildCore(manse);

  return {
    manse,
    book: {
      metadata: {
        blueprintId,
        blueprintNo: "No.000001",
        title: "결론보다 기준을 먼저 세우는 사람",
        subtitle: "Blueprint",
        author: "주영지",
        publisher: "Pigbar Publishing",
        edition: "초판",
        publicationDate: "2026-07-03",
        sourceName: "Pigbar Manse",
      },
      familyCollection: {
        id: "family-ju-collection",
        name: "The Ju Family Collection",
        label: "주 가족 컬렉션",
        description: "가족의 책들이 비교 없이 한 책장에 나란히 놓입니다.",
        volumes: [
          {
            volumeNo: 1,
            blueprintNo: "No.000001",
            title: "결론보다 기준을 먼저 세우는 사람",
            author: "주영지",
            status: "published",
          },
          {
            volumeNo: 2,
            blueprintNo: "No.000002",
            title: "출판 준비 중",
            author: "이진희",
            status: "planned",
          },
          {
            volumeNo: 3,
            blueprintNo: "No.000003",
            title: "출판 준비 중",
            author: "희준",
            status: "planned",
          },
          {
            volumeNo: 4,
            blueprintNo: "No.000004",
            title: "출판 준비 중",
            author: "현준",
            status: "planned",
          },
        ],
      },
      dedication: "이 책은 빠른 답보다 자기 기준을 먼저 확인해온 한 사람에게 바칩니다.",
      authorNote:
        "저자는 이 책의 주인입니다. Pigbar Publishing은 계산된 구조를 책의 문장으로 정리했을 뿐, 삶의 결론을 대신 쓰지 않습니다.",
      prologue: {
        title: "Prologue",
        paragraphs: [
          p(
            "prologue-1",
            "이 사람은 결론이 늦은 사람이 아닙니다. 결론이 서기 전에 먼저 기준이 서야 하는 사람입니다.",
            ["ft-identity-standard-before-conclusion"],
          ),
          p(
            "prologue-2",
            "밖에서는 조심스러운 속도로 보일 수 있지만, 안쪽에서는 이미 여러 가능성과 책임의 범위가 오래 대조되고 있습니다.",
            ["ft-thinking-layered-review", "ft-decision-responsible-delay"],
          ),
          p(
            "prologue-3",
            "이 책은 운명을 말하지 않습니다. 반복해서 돌아오는 선택의 구조와, 그 구조를 더 정확히 쓰는 방법을 읽습니다.",
            ["ft-growth-accumulated-change"],
          ),
        ],
      },
      core,
      chapters: [
        {
          id: "chapter-1",
          chapterNo: 1,
          title: "나는 누구인가",
          question: "내가 반복해서 돌아오는 중심은 무엇인가",
          opening: "이 사람은 빠른 결론보다 결론이 설 수 있는 기준을 먼저 찾습니다.",
          paragraphs: [
            p("c1-p1", "주영지의 구조에서 가장 먼저 보이는 것은 속도가 아니라 기준입니다.", [
              "ft-identity-standard-before-conclusion",
            ]),
            p("c1-p2", "어떤 사람은 상황이 오면 곧바로 몸을 던집니다. 이 사람은 먼저 그 상황이 자기 안에서 어떤 이름을 갖는지 확인합니다.", [
              "ft-thinking-layered-review",
            ]),
            p("c1-p3", "그래서 늦어 보이는 장면 안에도 검토와 책임이 들어 있습니다. 움직이지 않는 것이 아니라, 움직임이 오래 갈 수 있는지 살피는 것입니다.", [
              "ft-decision-responsible-delay",
            ]),
          ],
          closing: "이 사람의 첫 문장은 결론이 아니라 기준에서 시작됩니다.",
        },
        {
          id: "chapter-2",
          chapterNo: 2,
          title: "나는 어떻게 생각하는가",
          question: "내 생각은 어떤 방식으로 깊어지는가",
          opening: "생각은 한 줄로 뻗기보다 여러 층으로 쌓입니다.",
          paragraphs: [
            p("c2-p1", "이 사람은 말의 표면보다 그 말이 놓인 자리를 오래 봅니다.", ["ft-thinking-layered-review"]),
            p("c2-p2", "하나의 답을 얻어도 곧장 끝내지 않고, 그 답이 다른 선택과 충돌하지 않는지 다시 확인합니다.", [
              "ft-thinking-layered-review",
            ]),
            p("c2-p3", "이런 사고는 가벼운 상황에서는 느림으로 보일 수 있지만, 중요한 국면에서는 실수를 줄이는 힘이 됩니다.", [
              "ft-decision-responsible-delay",
            ]),
          ],
          closing: "이 사람의 생각은 빠른 답보다 오래 무너지지 않는 답을 향합니다.",
        },
        {
          id: "chapter-3",
          chapterNo: 3,
          title: "나는 어떻게 결정하는가",
          question: "내 선택은 왜 늦어지고, 언제 단단해지는가",
          opening: "결정을 미루는 사람이 아니라, 결정 이후의 책임을 먼저 보는 사람입니다.",
          paragraphs: [
            p("c3-p1", "주영지는 선택의 순간보다 선택이 남길 시간을 먼저 계산하는 편입니다.", [
              "ft-decision-responsible-delay",
            ]),
            p("c3-p2", "기준이 흐리면 몸이 멈추고, 기준이 선명해지면 의외로 빠르게 움직입니다.", [
              "ft-identity-standard-before-conclusion",
              "ft-action-slow-ignition",
            ]),
            p("c3-p3", "결정의 핵심은 자신감이 아니라 납득입니다. 납득한 일에는 오래 버티는 힘이 붙습니다.", [
              "ft-action-slow-ignition",
            ]),
          ],
          closing: "이 사람에게 좋은 결정은 빠른 결정이 아니라, 끝까지 감당할 수 있는 결정입니다.",
        },
        {
          id: "chapter-4",
          chapterNo: 4,
          title: "나는 사람을 어떻게 대하는가",
          question: "내 관계는 어떤 속도로 깊어지는가",
          opening: "관계에서도 이 사람은 속도보다 신뢰가 놓일 자리를 먼저 봅니다.",
          paragraphs: [
            p("c4-p1", "마음을 주지 않는 것이 아닙니다. 마음을 둘 자리가 안전한지 오래 확인하는 쪽에 가깝습니다.", [
              "ft-relationship-trust-before-speed",
            ]),
            p("c4-p2", "가까운 사람에게는 큰 표현보다 반복되는 책임으로 마음을 보일 때가 많습니다.", [
              "ft-communication-late-clear-voice",
              "ft-relationship-trust-before-speed",
            ]),
            p("c4-p3", "관계가 흔들릴 때도 쉽게 끊기보다 의미를 먼저 확인합니다. 다만 기준이 무너졌다고 느끼면 선은 분명해질 수 있습니다.", [
              "ft-conflict-boundary-after-patience",
            ]),
          ],
          closing: "이 사람의 관계는 빠르게 열리는 문보다 오래 닫히지 않는 방에 가깝습니다.",
        },
        {
          id: "chapter-5",
          chapterNo: 5,
          title: "사람들은 나를 어떻게 보는가",
          question: "밖에서 보이는 나와 안쪽의 나는 어디서 달라지는가",
          opening: "밖에서는 조용해 보여도 안쪽에서는 이미 많은 판단이 움직이고 있습니다.",
          paragraphs: [
            p("c5-p1", "주변은 이 사람을 신중하고 조용한 사람으로 볼 수 있습니다. 하지만 그 조용함은 비어 있음이 아니라 정리의 방식입니다.", [
              "ft-communication-late-clear-voice",
            ]),
            p("c5-p2", "말이 적을수록 생각도 적다고 오해받을 수 있습니다. 실제로는 말이 나가기 전 책임의 무게를 먼저 가늠합니다.", [
              "ft-thinking-layered-review",
              "ft-communication-late-clear-voice",
            ]),
            p("c5-p3", "그래서 이 사람은 화려한 첫인상보다 시간이 지난 뒤의 신뢰로 더 잘 읽힙니다.", [
              "ft-leadership-quiet-standard",
            ]),
          ],
          closing: "이 사람은 빨리 보이는 사람보다 오래 확인되는 사람에 가깝습니다.",
        },
        {
          id: "chapter-6",
          chapterNo: 6,
          title: "나는 무엇에 강한가",
          question: "내 힘은 어디에서 가장 안정적으로 나오는가",
          opening: "이 사람의 힘은 한 번의 돌파보다 반복된 신뢰에서 나옵니다.",
          paragraphs: [
            p("c6-p1", "리듬이 잡힌 일에서는 쉽게 흩어지지 않습니다. 시작은 천천히 보이지만, 시작한 뒤의 지속력은 작지 않습니다.", [
              "ft-action-slow-ignition",
            ]),
            p("c6-p2", "주변이 흔들릴 때 기준을 다시 세우는 능력도 강점입니다. 크게 앞서가기보다 무너지지 않는 중심이 됩니다.", [
              "ft-leadership-quiet-standard",
            ]),
            p("c6-p3", "잘 맞는 환경에서는 오래 쌓아 신뢰를 만드는 방식으로 성취가 나타납니다.", [
              "ft-growth-accumulated-change",
            ]),
          ],
          closing: "이 사람의 강점은 빠르게 빛나는 것이 아니라 오래 꺼지지 않는 데 있습니다.",
        },
        {
          id: "chapter-7",
          chapterNo: 7,
          title: "나는 무엇에 약한가",
          question: "강점은 언제 부담으로 바뀌는가",
          opening: "기준이 강한 사람은 때때로 그 기준 안에 오래 갇힐 수 있습니다.",
          paragraphs: [
            p("c7-p1", "정확함을 기다리다 보면 기회가 지나간 뒤에야 움직일 때가 있습니다.", [
              "ft-decision-responsible-delay",
            ]),
            p("c7-p2", "혼자 견디는 능력은 분명한 힘이지만, 계속 혼자여야 한다는 뜻은 아닙니다.", [
              "ft-health-rhythm-before-pressure",
            ]),
            p("c7-p3", "참는 시간이 길어질수록 말해야 할 순간을 놓치지 않는 것이 중요합니다.", [
              "ft-conflict-boundary-after-patience",
              "ft-communication-late-clear-voice",
            ]),
          ],
          closing: "이 사람에게 필요한 것은 기준을 버리는 일이 아니라, 기준이 닫힘이 되기 전 알아차리는 일입니다.",
        },
        {
          id: "chapter-8",
          chapterNo: 8,
          title: "나는 무엇을 추구하는가",
          question: "내가 결국 지키고 싶은 것은 무엇인가",
          opening: "이 사람은 결국 오래 남는 것을 향합니다.",
          paragraphs: [
            p("c8-p1", "눈앞의 반응보다 시간이 지나도 무너지지 않는 선택을 더 신뢰합니다.", [
              "ft-identity-standard-before-conclusion",
            ]),
            p("c8-p2", "자원도 관계도 쉽게 흩어지는 것보다 질서 있게 남는 형태를 선호합니다.", [
              "ft-wealth-resource-order",
              "ft-relationship-trust-before-speed",
            ]),
            p("c8-p3", "그래서 이 사람의 추구는 더 많이 갖는 일이 아니라, 지켜낼 수 있는 것을 정확히 고르는 일에 가깝습니다.", [
              "ft-wealth-resource-order",
            ]),
          ],
          closing: "이 사람은 많은 것보다 오래 남을 것을 고를 때 자기답습니다.",
        },
        {
          id: "chapter-9",
          chapterNo: 9,
          title: "나는 어떻게 성장하는가",
          question: "나는 어떤 속도로 달라지는가",
          opening: "이 사람의 성장은 폭발보다 누적에 가깝습니다.",
          paragraphs: [
            p("c9-p1", "한 번에 다른 사람이 되는 방식보다, 같은 구조를 더 정확히 쓰는 방식으로 달라집니다.", [
              "ft-growth-accumulated-change",
            ]),
            p("c9-p2", "실패보다 실패의 이유를 모른 채 지나가는 것을 더 불편해할 수 있습니다.", [
              "ft-thinking-layered-review",
            ]),
            p("c9-p3", "시간이 지날수록 중요한 것은 더 강해지는 일이 아니라 자기 리듬을 잃지 않는 일입니다.", [
              "ft-health-rhythm-before-pressure",
            ]),
          ],
          closing: "성장은 이 사람에게 새로운 사람이 되는 일이 아니라, 자기 구조의 사용법을 배우는 일입니다.",
        },
        {
          id: "chapter-10",
          chapterNo: 10,
          title: "지금 나는 어디에 있는가",
          question: "현재의 흐름은 나에게 무엇을 요구하는가",
          opening: "지금은 결론을 더하는 시간보다 기준을 다시 정렬하는 시간에 가깝습니다.",
          paragraphs: [
            p("c10-p1", "현재의 흐름은 더 많은 일을 한꺼번에 벌이기보다, 남겨야 할 것과 내려놓을 것을 구분하게 합니다.", [
              "ft-life-flow-realignment",
            ]),
            p("c10-p2", "오래 준비해온 것이 밖으로 드러날 수 있지만, 그만큼 리듬을 무리하게 당기지 않는 것이 중요합니다.", [
              "ft-action-slow-ignition",
              "ft-health-rhythm-before-pressure",
            ]),
            p("c10-p3", "지금 필요한 것은 미래를 맞히는 일이 아니라, 다음 장으로 넘어가기 전 기준을 다시 세우는 일입니다.", [
              "ft-life-flow-realignment",
            ]),
          ],
          closing: "지금의 질문은 어디로 빨리 갈 것인가보다, 무엇을 지킨 채 갈 것인가에 가깝습니다.",
        },
        {
          id: "chapter-11",
          chapterNo: 11,
          title: "앞으로 무엇을 준비해야 하는가",
          question: "다음 장을 위해 지금 정리할 것은 무엇인가",
          opening: "다음 장은 더 큰 속도보다 더 선명한 기준에서 열립니다.",
          paragraphs: [
            p("c11-p1", "먼저 혼자 감당하는 습관을 살펴야 합니다. 오래 버티는 힘이 있다고 해서 모든 것을 혼자 들 필요는 없습니다.", [
              "ft-health-rhythm-before-pressure",
            ]),
            p("c11-p2", "관계에서는 마음을 닫기 전에 기준을 말하는 연습이 필요합니다.", [
              "ft-relationship-trust-before-speed",
              "ft-conflict-boundary-after-patience",
            ]),
            p("c11-p3", "일과 자원에서는 감당 가능한 범위를 지키는 것이 확장보다 먼저입니다.", [
              "ft-wealth-resource-order",
            ]),
          ],
          closing: "준비란 더 많이 쥐는 일이 아니라, 오래 들고 갈 수 있는 모양으로 다시 묶는 일입니다.",
        },
        {
          id: "chapter-12",
          chapterNo: 12,
          title: "결국 어떤 사람이 되는가",
          question: "내 책의 마지막 문장은 어디로 향하는가",
          opening: "이 사람은 결국 자기 기준을 잃지 않는 방식으로 살아야 편안해집니다.",
          paragraphs: [
            p("c12-p1", "완전히 다른 사람이 될 필요는 없습니다. 더 정확히 자기 자신이 되는 것만으로도 충분한 변화가 시작됩니다.", [
              "ft-growth-accumulated-change",
            ]),
            p("c12-p2", "주영지의 책은 빠른 성공의 문장이 아니라 오래 남는 기준의 문장에 가깝습니다.", [
              "ft-identity-standard-before-conclusion",
            ]),
            p("c12-p3", "앞으로의 일은 정해져 있지 않습니다. 다만 반복되는 구조는 읽을 수 있고, 읽을 수 있는 것은 조금 다르게 쓸 수 있습니다.", [
              "ft-life-flow-realignment",
            ]),
          ],
          closing: "이 책의 끝은 결론이 아니라 다시 읽을 수 있는 시작입니다.",
        },
      ],
      myNotesPrompt:
        "이 책을 읽으며 오래 남은 문장, 아직 불편한 문장, 다음 개정판에 남기고 싶은 생각을 적어두세요.",
    },
  };
}
