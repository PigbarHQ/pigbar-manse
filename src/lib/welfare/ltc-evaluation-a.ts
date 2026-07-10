import { readFileSync } from "node:fs";
import { join } from "node:path";
import evaluationAIndex from "@/src/lib/welfare/data/long-term-care-evaluation-a-index.json";
import evaluationResultsManifest from "@/src/lib/welfare/data/long-term-care-evaluation-results/manifest.json";
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

export type LongTermCareEvaluationResult = {
  year: string;
  date: string;
  evaluationType: string;
  grade: string;
  totalScore: string;
  operation: string;
  environmentSafety: string;
  rightsProtection: string;
  careProcess: string;
  careResult: string;
  operation2025: string;
  respect2025: string;
  service2025: string;
  serviceResult2025: string;
};

export type LongTermCareEvaluationResultGroup = {
  facilityKey: string;
  facilitySymbol: string;
  facilityName: string;
  region: string;
  sigungu: string;
  benefitType: string;
  evaluations: LongTermCareEvaluationResult[];
  gradeTimeline: string;
  latestEvaluation: LongTermCareEvaluationResult | null;
};

type EvaluationResultsManifest = {
  regions: {
    region: string;
    file: string;
  }[];
};

type EvaluationResultsRegionFile = {
  region: string;
  groups: LongTermCareEvaluationResultGroup[];
};

const evaluationData = evaluationAIndex as unknown as EvaluationAIndex;
const evaluationResultsData = evaluationResultsManifest as EvaluationResultsManifest;
const evaluationResultsCache = new Map<string, EvaluationResultsRegionFile | null>();

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

export function evaluationResultsForFacility(params: {
  longTermAdminSym: unknown;
  sourceCode?: unknown;
  regionName?: string;
}) {
  const key = normalizeLongTermCareFacilityKey(params.longTermAdminSym);
  if (!key || !params.regionName) return [];

  const regionFile = loadEvaluationResultsRegion(params.regionName);
  if (!regionFile) return [];

  const benefitNames = benefitNamesForLtcCode(params.sourceCode);
  return regionFile.groups.filter((group) => {
    if (group.facilityKey !== key) return false;
    if (benefitNames.length === 0) return true;
    return benefitNames.some((name) => group.benefitType.includes(name));
  });
}

export function enrichFacilityCandidatesWithEvaluationA<T extends { items: FacilityCandidate[] }>(result: T, options?: { regionName?: string }): T {
  return {
    ...result,
    items: result.items.map((item) => {
      const evaluationA = evaluationAForLongTermAdminSym(item.id);
      const raw = item.raw && typeof item.raw === "object" && !Array.isArray(item.raw) ? item.raw as Record<string, unknown> : {};
      const sourceCode = raw.sourceCode ?? raw.adminPttnCd ?? raw.serviceKind;
      const evaluationResults = evaluationResultsForFacility({
        longTermAdminSym: item.id,
        sourceCode,
        regionName: options?.regionName,
      });
      if (!item.raw || typeof item.raw !== "object" || Array.isArray(item.raw)) {
        if (evaluationA.length === 0 && evaluationResults.length === 0) return item;
        return { ...item, raw: { evaluationA, evaluationResults } };
      }

      return {
        ...item,
        raw: {
          ...item.raw,
          evaluationA,
          evaluationResults,
        },
      };
    }),
  };
}

function loadEvaluationResultsRegion(regionName: string) {
  if (evaluationResultsCache.has(regionName)) return evaluationResultsCache.get(regionName) ?? null;

  const region = evaluationResultsData.regions.find((item) => item.region === regionName);
  if (!region) {
    evaluationResultsCache.set(regionName, null);
    return null;
  }

  const filePath = join(process.cwd(), "src/lib/welfare/data/long-term-care-evaluation-results", region.file);
  const data = JSON.parse(readFileSync(filePath, "utf-8")) as EvaluationResultsRegionFile;
  evaluationResultsCache.set(regionName, data);
  return data;
}

function benefitNamesForLtcCode(sourceCode: unknown) {
  const code = String(sourceCode ?? "").trim();
  if (["B01", "C01"].includes(code)) return ["방문요양"];
  if (["B02", "C02"].includes(code)) return ["방문목욕"];
  if (["B03", "C03"].includes(code)) return ["주야간보호"];
  if (["B04", "C04"].includes(code)) return ["단기보호"];
  if (["B05", "C05"].includes(code)) return ["방문간호"];
  if (code === "C06") return ["복지용구"];
  if (["A01", "A02", "A03", "A04", "A05", "AAA", "S41"].includes(code)) return ["입소시설"];
  return [];
}
