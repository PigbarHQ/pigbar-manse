export type BlueprintArchitectPlan = {
  bookTitle: string;
  coreQuestion: string;
  rawCoreAxis: string;
  writerCoreAxis: string;
  finalCounselDirection: string;
  lensCandidates: string[];
  selectedLens: string;
  lensCode: string;
  lensLabelKo: string;
  allowedVocabulary: string[];
  forbiddenVocabulary: string[];
  lensRules: {
    lensCode: string;
    labelKo: string;
    openingMode: string;
    wordField: string[];
    imageField: string[];
    allowedVocabulary: string[];
    forbiddenVocabulary: string[];
    paragraphRhythm: string;
    structureMode: string;
    endingMode: string;
  };
  doRules: string[];
  dontRules: string[];
  notThisPerson: string[];
};

export type PortraitBookQaResult = {
  blindFidelityScore: number;
  identityScore: number;
  lensConsistencyScore: number;
  duplicatePatternScore: number;
  finalCounselScore: number;
  warnings: string[];
};

export type BlindEditorialSource = {
  suggestedTitle?: string;
  coreQuestion?: string;
  coreAxis?: {
    verbForm?: string;
  };
  narrativeLensCandidates?: string[];
  doRules?: string[];
  dontRules?: string[];
  notThisPerson?: string[];
  finalCounselDirection?: string;
};

const myeongliCoreAxisPattern =
  /[甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]|금수|수목|목화|화토|토금|금목|목토|토수|수화|식상|식신|상관|관인|관성|인성|재성|비겁|비견|겁재|용신|기신|희신|상신|원국|천간|지지|지장간|오행|십성|명리|명조|(?<![가-힣])[금목수화토](?![가-힣])/;

const lensOveruseVocabulary: Record<string, string[]> = {
  Road: ["길", "여정", "발걸음", "갈림길", "지도", "목적지"],
  Season: ["계절", "때", "기다림", "순환", "봄", "여름", "가을", "겨울"],
  Pillar: ["기둥", "집", "자리", "버팀", "마루", "문턱"],
  Spring: ["봄", "깨어남", "생기", "새순", "다시 흐름"],
  Mountain: ["산", "발밑", "능선", "오름", "정상", "비탈"],
  River: ["강", "물길", "흐름", "둑", "바다", "물살"],
  Bridge: ["다리", "난간", "건너편", "발판", "강둑", "통로"],
  Hospital: ["병원", "진단", "회복", "처방", "상처", "치료"],
  Workshop: ["작업대", "공구", "도면", "재료", "치수", "나사", "작업장", "제작", "조립", "완성품"],
  Forest: ["숲", "나무", "뿌리", "잎", "바람", "그늘"],
  Ocean: ["바다", "파도", "해안", "밀물", "썰물", "수평선"],
  Courtroom: ["법정", "증언", "판단", "논거", "기록", "심리"],
  Lighthouse: ["등대", "불빛", "해안", "방향", "밤", "항로"],
};

export function hasMyeongliCoreAxisTerms(value: string) {
  return myeongliCoreAxisPattern.test(value);
}

export function assertWriterCoreAxis(value: string) {
  if (!value.trim()) throw new Error("writerCoreAxis is empty.");
  if (hasMyeongliCoreAxisTerms(value)) {
    throw new Error(`writerCoreAxis contains forbidden myeongli term: ${value}`);
  }
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function seedIndex(seed: string, length: number) {
  if (length <= 0) return 0;

  const hash = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return hash % length;
}

function countOccurrences(text: string, word: string) {
  return text.split(word).length - 1;
}

function lensOveruseWarning(bookText: string, lens: string) {
  const vocabulary = lensOveruseVocabulary[lens] ?? [];
  if (vocabulary.length === 0) return null;

  const paragraphs = bookText.split(/\n{2,}/).filter((paragraph) => paragraph.trim().length > 0);
  const hitCount = vocabulary.reduce((sum, word) => sum + countOccurrences(bookText, word), 0);
  const paragraphHitCount = paragraphs.filter((paragraph) => vocabulary.some((word) => paragraph.includes(word))).length;
  const paragraphRatio = paragraphs.length > 0 ? paragraphHitCount / paragraphs.length : 0;

  if (hitCount >= 14 || (paragraphs.length >= 4 && paragraphRatio >= 0.75)) {
    return `lensOveruseWarning: ${lens} vocabulary appears ${hitCount} times across ${paragraphHitCount}/${paragraphs.length} paragraphs.`;
  }

  return null;
}

export function buildEditorialBrief(blindResult: BlindEditorialSource, seed = ""): BlueprintArchitectPlan {
  const coreAxis = blindResult.coreAxis?.verbForm?.trim() ?? "";
  const lensCandidates = stringArray(blindResult.narrativeLensCandidates);
  const selectedLens = lensCandidates[seedIndex(seed, lensCandidates.length)] ?? "Road";
  const forbiddenVocabulary = [
    "사주",
    "명리",
    "원국",
    "천간",
    "지지",
    "지장간",
    "오행",
    "십성",
    "용신",
    "기신",
    "대운",
    "세운",
    "고전의 언어",
    "네 개의 기둥",
    "분석 결과",
    "결론적으로",
    "작동한다",
    "구조의 중심",
    "기능",
  ];

  assertWriterCoreAxis(coreAxis);

  return {
    bookTitle: blindResult.suggestedTitle?.trim() ?? "",
    coreQuestion: blindResult.coreQuestion?.trim() ?? "",
    rawCoreAxis: coreAxis,
    writerCoreAxis: coreAxis,
    finalCounselDirection: blindResult.finalCounselDirection?.trim() ?? "",
    lensCandidates,
    selectedLens,
    lensCode: selectedLens,
    lensLabelKo: selectedLens,
    allowedVocabulary: [selectedLens],
    forbiddenVocabulary,
    lensRules: {
      lensCode: selectedLens,
      labelKo: selectedLens,
      openingMode: "",
      wordField: [selectedLens],
      imageField: [selectedLens],
      allowedVocabulary: [selectedLens],
      forbiddenVocabulary,
      paragraphRhythm: "",
      structureMode: "",
      endingMode: "",
    },
    doRules: stringArray(blindResult.doRules),
    dontRules: stringArray(blindResult.dontRules),
    notThisPerson: stringArray(blindResult.notThisPerson),
  };
}

export function assertArchitectPlan(value: BlueprintArchitectPlan) {
  if (!value.bookTitle.trim()) throw new Error("Editorial brief bookTitle is incomplete.");
  if (!value.coreQuestion.trim()) throw new Error("Editorial brief coreQuestion is incomplete.");
  assertWriterCoreAxis(value.writerCoreAxis);
  if (!value.finalCounselDirection.trim()) throw new Error("Editorial brief finalCounselDirection is incomplete.");
  if (value.lensCandidates.length === 0) throw new Error("Editorial brief lensCandidates is incomplete.");
  if (!value.selectedLens.trim()) throw new Error("Editorial brief selectedLens is incomplete.");
  if (!value.lensCandidates.includes(value.selectedLens)) {
    throw new Error("Editorial brief selectedLens must come from Blind narrativeLensCandidates.");
  }
}

export function runPortraitBookQa(input: {
  bookText: string;
  architectPlan: BlueprintArchitectPlan;
  forbiddenPhrases: string[];
}): PortraitBookQaResult {
  const warnings: string[] = [];
  const duplicateSentences = input.bookText
    .split(/[.!?\n。]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 14)
    .filter((sentence, index, sentences) => sentences.indexOf(sentence) !== index);
  const forbiddenHits = input.forbiddenPhrases.filter((phrase) => input.bookText.includes(phrase));
  const lensWarning = lensOveruseWarning(input.bookText, input.architectPlan.selectedLens);

  if (forbiddenHits.length > 0) warnings.push(`Book Mode report phrases: ${forbiddenHits.join(", ")}`);
  if (lensWarning) warnings.push(lensWarning);
  if (duplicateSentences.length > 0) warnings.push(`Repeated sentence candidates: ${Array.from(new Set(duplicateSentences)).join(" / ")}`);
  if (!input.bookText.includes(input.architectPlan.writerCoreAxis)) {
    warnings.push("coreAxisSemanticWarning: coreAxis exact wording is not present; review semantic alignment.");
  }

  return {
    blindFidelityScore: forbiddenHits.length ? 70 : 95,
    identityScore: input.bookText.includes(input.architectPlan.writerCoreAxis) ? 95 : 82,
    lensConsistencyScore: 90,
    duplicatePatternScore: duplicateSentences.length ? 72 : 98,
    finalCounselScore: input.architectPlan.finalCounselDirection.length > 0 ? 92 : 70,
    warnings,
  };
}
