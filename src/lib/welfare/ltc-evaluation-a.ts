import evaluationAIndex from "@/src/lib/welfare/data/long-term-care-evaluation-a-index.json";
import type { FacilityCandidate } from "@/src/lib/welfare/facilities";

export type LongTermCareEvaluationARecord = {
  sheet: string;
  benefitType: string;
  facilitySymbol: string;
  facilityName: string;
  sido: string;
  sigungu: string;
  designatedDate: string;
  closedDate: string;
  aGradeCount: number;
  cycle: string;
  yearGrades: Record<string, string>;
};

type EvaluationAIndex = {
  sourceFile: string;
  recordCount: number;
  facilityKeyCount: number;
  index: Record<string, LongTermCareEvaluationARecord[]>;
};

const evaluationData = evaluationAIndex as unknown as EvaluationAIndex;

export function normalizeLongTermCareFacilityKey(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

export function evaluationAForLongTermAdminSym(longTermAdminSym: unknown) {
  const key = normalizeLongTermCareFacilityKey(longTermAdminSym);
  return key ? evaluationData.index[key] ?? [] : [];
}

export function evaluationASourceSummary() {
  return {
    sourceFile: evaluationData.sourceFile,
    recordCount: evaluationData.recordCount,
    facilityKeyCount: evaluationData.facilityKeyCount,
  };
}

export function enrichFacilityCandidatesWithEvaluationA<T extends { items: FacilityCandidate[] }>(result: T): T {
  return {
    ...result,
    items: result.items.map((item) => {
      const evaluationA = evaluationAForLongTermAdminSym(item.id);
      if (evaluationA.length === 0 || !item.raw || typeof item.raw !== "object" || Array.isArray(item.raw)) {
        return evaluationA.length === 0 ? item : { ...item, raw: { evaluationA } };
      }

      return {
        ...item,
        raw: {
          ...item.raw,
          evaluationA,
        },
      };
    }),
  };
}
