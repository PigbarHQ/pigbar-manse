import type { ManseResult, PillarInfo } from "@/src/lib/manse";

function PillarCell({ label, pillar }: { label: string; pillar: PillarInfo | null }) {
  return (
    <div className="border-r border-stone-300 text-center last:border-r-0">
      <div className="border-b border-stone-300 py-2 text-xs text-stone-500">{label}</div>
      <div className="py-5 text-3xl font-black text-stone-800">
        {pillar ? `${pillar.stem.hangul}${pillar.stem.hanja}` : "-"}
      </div>
      <div className="border-y border-stone-300 py-2 text-xs text-stone-600">
        {pillar?.tenGod ?? "-"}
      </div>
      <div className="py-5 text-3xl font-black text-stone-800">
        {pillar ? `${pillar.branch.hangul}${pillar.branch.hanja}` : "-"}
      </div>
      <div className="border-t border-stone-300 py-2 text-xs text-stone-600">
        {pillar?.twelveStage ?? "-"}
      </div>
    </div>
  );
}

export function NatalChartTable({ result }: { result: ManseResult }) {
  const pillars: Array<[string, PillarInfo | null]> = [
    ["생시", result.natalChart.pillars.hour],
    ["생일", result.natalChart.pillars.day],
    ["생월", result.natalChart.pillars.month],
    ["생년", result.natalChart.pillars.year],
  ];

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4">
      <h2 className="text-lg font-black text-stone-800">사주 팔자</h2>
      <div className="mt-4 overflow-hidden rounded-lg border border-stone-300">
        <div className="grid grid-cols-4">
          {pillars.map(([label, pillar]) => (
            <PillarCell key={label} label={label} pillar={pillar} />
          ))}
        </div>
      </div>
    </section>
  );
}
