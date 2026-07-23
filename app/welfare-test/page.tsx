import { readFileSync } from "node:fs";
import { join } from "node:path";
import { WelfareTestClient } from "@/src/components/welfare/WelfareTestClient";
import type { DayCareEvaluationRow } from "@/src/components/welfare/WelfareTestClient";

export default function WelfareTestPage() {
  return <WelfareTestClient dayCareEvaluationRows={michuholDayCareEvaluationRows()} />;
}

type EvaluationGroup = {
  facilitySymbol: string;
  facilityName: string;
  sigungu: string;
  benefitType: string;
  evaluations: {
    year: string;
    date: string;
    grade: string;
    totalScore: string;
  }[];
};

type IncheonEvaluationFile = {
  groups: EvaluationGroup[];
};

function michuholDayCareEvaluationRows(): DayCareEvaluationRow[] {
  const filePath = join(process.cwd(), "src/lib/welfare/data/long-term-care-evaluation-results/by-region/incheon.json");
  const data = JSON.parse(readFileSync(filePath, "utf-8")) as IncheonEvaluationFile;

  return data.groups
    .filter((group) => group.sigungu === "미추홀구" && group.benefitType.includes("주야간보호"))
    .map((group) => ({
      facilityName: group.facilityName,
      facilityCode: group.facilitySymbol,
      evaluationGrade: evaluationTimeline(group),
    }))
    .sort((left, right) => left.facilityName.localeCompare(right.facilityName, "ko-KR"));
}

function evaluationTimeline(group: EvaluationGroup) {
  return group.evaluations
    .filter((evaluation) => evaluation.year || evaluation.date || evaluation.grade)
    .map((evaluation) => {
      const year = evaluation.year || evaluation.date;
      const grade = evaluation.totalScore ? `${evaluation.grade}(${evaluation.totalScore})` : evaluation.grade;
      return [year, grade].filter(Boolean).join(" ");
    })
    .join(" / ");
}
