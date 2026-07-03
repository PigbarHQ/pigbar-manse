import type { Warning } from "@/src/lib/manse";

const warningCopy: Record<string, { title: string; description: string; tone: "notice" | "caution" }> = {
  APPROXIMATE_SOLAR_TERMS_USED: {
    title: "대운 시작 시점은 참고값입니다",
    description:
      "해당 연도의 정밀 절기 시각 데이터가 없어 월별 절입 근사값으로 계산했습니다. 사주 팔자보다 대운 시작 나이와 개월 수를 확인할 때 참고하세요.",
    tone: "notice",
  },
  TIME_CORRECTION_CHANGED_PILLAR: {
    title: "지역시 보정으로 기둥이 달라졌습니다",
    description:
      "입력한 표준시와 출생지 경도 보정 시간이 경계에 가까워 시주, 월주 또는 년주가 달라질 수 있습니다. 화면의 결과는 보정 시간을 기준으로 표시됩니다.",
    tone: "caution",
  },
  ZI_HOUR_RULE_CHANGED_PILLAR: {
    title: "자시 기준에 따라 결과가 달라질 수 있습니다",
    description:
      "23시대 출생은 조자시/야자시 기준에 따라 일주 또는 시주가 달라질 수 있습니다. 현재는 0시 기준으로 계산했습니다.",
    tone: "caution",
  },
  LUNAR_INPUT_CONVERTED: {
    title: "음력 입력을 양력 기준으로 변환했습니다",
    description:
      "입력한 음력 날짜와 윤달 여부를 한국 음력 변환 기준으로 확인한 뒤 양력 날짜로 바꾸어 계산했습니다.",
    tone: "notice",
  },
  CALENDAR_CONVERSION_VERIFICATION_FAILED: {
    title: "음양력 변환 검증이 필요합니다",
    description:
      "보조 검증 라이브러리와 변환 결과가 일치하지 않았습니다. 날짜와 윤달 여부를 다시 확인하는 것이 좋습니다.",
    tone: "caution",
  },
  UNKNOWN_TIME_USED: {
    title: "태어난 시간을 모르는 입력입니다",
    description:
      "시주는 비워두고 계산했습니다. 시주가 필요한 해석 항목은 신뢰도를 낮춰 Blueprint 입력으로 전달됩니다.",
    tone: "notice",
  },
};

function getReadableWarning(warning: Warning) {
  return (
    warningCopy[warning.type] ?? {
      title: "계산 기준 확인이 필요합니다",
      description: warning.message,
      tone: "notice" as const,
    }
  );
}

function getWarningClassName(tone: "notice" | "caution") {
  return tone === "caution"
    ? "rounded-md border border-amber-200 bg-white/70 px-3 py-2"
    : "rounded-md border border-stone-200 bg-white/70 px-3 py-2";
}

export function WarningPanel({ warnings }: { warnings: Warning[] }) {
  const uniqueWarnings = Array.from(
    new Map(warnings.map((warning) => [warning.type, warning])).values(),
  );

  if (uniqueWarnings.length === 0) {
    return (
      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
        계산 기준상 추가로 확인할 항목이 없습니다.
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h2 className="text-base font-black text-amber-900">계산 기준 안내</h2>
      <ul className="mt-3 space-y-2 text-sm text-amber-900">
        {uniqueWarnings.map((warning) => {
          const readable = getReadableWarning(warning);

          return (
            <li className={getWarningClassName(readable.tone)} key={warning.type}>
              <span className="font-black">{readable.title}</span>
              <p className="mt-1 leading-relaxed">{readable.description}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
