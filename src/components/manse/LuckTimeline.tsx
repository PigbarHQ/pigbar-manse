import type { LuckPillar, ManseResult } from "@/src/lib/manse";

function LuckLine({ label, pillar }: { label: string; pillar: LuckPillar | null }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm">
      <span className="font-bold text-stone-600">{label}</span>
      <span className="font-black text-stone-900">
        {pillar ? `${pillar.ganji} (${pillar.ganjiHanja}) / ${pillar.tenGod}` : "-"}
      </span>
    </div>
  );
}

function formatDaewoonStart(result: ManseResult) {
  const { start } = result.daeun;
  const pieces = [`${start.ageYears}년`];

  if (start.ageMonths > 0) {
    pieces.push(`${start.ageMonths}개월`);
  }
  if (start.precision === "exact" && start.ageDays > 0) {
    pieces.push(`${start.ageDays}일`);
  }

  return `${pieces.join(" ")}${start.precision === "estimated" ? "경 (추정)" : ""}`;
}

export function LuckTimeline({ result }: { result: ManseResult }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4">
      <h2 className="text-lg font-black text-stone-800">현재 운 흐름</h2>
      <p className="mt-1 text-xs text-stone-500">
        대운 방향: {result.daeun.direction === "forward" ? "순행" : "역행"} / 대운 시작:
        {" "}
        {formatDaewoonStart(result)}
      </p>
      <div className="mt-4 grid gap-2">
        <LuckLine label="현재 대운" pillar={result.luck.currentDaewoon} />
        <LuckLine label="현재 세운" pillar={result.luck.currentSewoon} />
        <LuckLine label="현재 월운" pillar={result.luck.currentWolwoon} />
        <LuckLine label="현재 일진" pillar={result.luck.currentIljin} />
        <LuckLine label="현재 시주" pillar={result.luck.currentTimePillar} />
      </div>
    </section>
  );
}
