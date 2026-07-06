import Link from "next/link";
import { sampleBlindAnalysis } from "@/src/lib/blueprint/fixtures/sampleBlindAnalysis";
import { samplePortraitBook } from "@/src/lib/blueprint/fixtures/samplePortraitBook";

export default function SampleBookPage() {
  return (
    <main className="min-h-screen bg-[#f3efe7] px-4 py-8 text-[#2f2922] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <div className="rounded-[10px] border border-[#d8cdbb] bg-[#fffaf0] px-8 py-12 text-center shadow-[0_24px_70px_rgba(82,62,35,0.13)] sm:px-12">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b18440]">Sample Portrait Book</p>
          <h1 className="mt-8 text-4xl font-black leading-tight sm:text-5xl">{samplePortraitBook.title}</h1>
          <p className="mt-6 text-sm font-bold text-[#6f6253]">Lens: {samplePortraitBook.narrativeLens}</p>
          <p className="mt-2 text-sm font-bold text-[#6f6253]">Core Axis: {samplePortraitBook.coreAxis}</p>
          <p className="mt-8 text-xs font-black uppercase tracking-[0.24em] text-[#b18440]">by Blueprint</p>
        </div>

        <div className="mt-12 space-y-12">
          {samplePortraitBook.pages.map((page) => (
            <article
              className="relative min-h-[520px] overflow-hidden rounded-[4px] border border-[#d8cdbb] bg-[linear-gradient(135deg,#fffaf0,#f5ead8_60%,#eadac0)] px-8 py-10 shadow-[0_22px_64px_rgba(82,62,35,0.14)] sm:px-14 sm:py-16"
              key={page.pageNo}
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(90,68,40,0.035)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.26),rgba(122,89,45,0.04))] bg-[length:26px_26px,100%_100%]" />
              <div className="relative">
                <div className="flex items-center justify-between gap-4 border-b border-[#8a6b2e]/18 pb-5">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-[#8a6b2e]">Page {page.pageNo}</p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a6b2e]/70">Portrait Book</p>
                </div>
                <h2 className="mt-10 text-3xl font-black leading-snug">{page.title}</h2>
                <div className="mt-8 space-y-6 text-[18px] leading-[2.05] text-[#5f5141]">
                  {page.content.split("\n").map((line, index) => {
                    const trimmed = line.trim();

                    return trimmed ? <p key={`${page.pageNo}-${index}`}>{trimmed}</p> : null;
                  })}
                </div>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-12 rounded-[10px] border border-[#d8cdbb] bg-[#fff8ec] px-8 py-14 shadow-[0_18px_54px_rgba(67,52,32,0.1)] sm:px-12">
          <p className="text-sm font-black text-[#b18440]">마지막 당부</p>
          <blockquote className="mt-8 border-l-4 border-[#d8cdbb] pl-6 text-3xl font-black leading-[1.75]">
            {samplePortraitBook.finalCounsel}
          </blockquote>
        </section>

        <details className="mt-12 rounded-[8px] border border-[#d8cdbb] bg-[#fffaf0] px-6 py-6">
          <summary className="cursor-pointer text-xl font-black">전문 분석 보기</summary>
          <div className="mt-6 space-y-4">
            {sampleBlindAnalysis.sections.slice(0, 5).map((section) => {
              const layer = section.layers[0];

              return (
                <article className="rounded-[6px] border border-[#e2d4c0] bg-[#fffdf8] p-4" key={section.id}>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b18440]">
                    {String(section.order).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 text-lg font-black">{section.title}</h3>
                  <p className="mt-3 text-xs font-black text-[#b18440]">근거</p>
                  <p className="mt-1 text-sm leading-6 text-[#6f6253]">{layer.sajuOriginal.join(" / ")}</p>
                  <p className="mt-3 text-xs font-black text-[#b18440]">구조</p>
                  <p className="mt-1 text-sm leading-6 text-[#6f6253]">{layer.classical.join(" ")}</p>
                  <p className="mt-3 text-xs font-black text-[#b18440]">해석</p>
                  <p className="mt-1 text-sm leading-6 text-[#6f6253]">{layer.blueprint.join(" ")}</p>
                </article>
              );
            })}
          </div>
        </details>

        <div className="mt-10 flex justify-center">
          <Link className="rounded-full bg-[#2f2118] px-8 py-4 text-sm font-black text-[#fff8ec]" href="/">
            처음으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
