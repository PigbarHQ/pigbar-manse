import Link from "next/link";

const futureModules = ["사전규격", "발주계획", "낙찰정보", "계약정보", "정부지원사업"];

export default function BizRadarPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-8 text-[#172033]">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[22px] border border-[#d8e0f0] bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#4169e1]">Pigbar BizRadar</p>
          <h1 className="mt-3 text-4xl font-black">Pigbar BizRadar</h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-[#65708a]">
            기업에 맞는 입찰·지원사업·파트너 기회를 탐색합니다.
          </p>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <Link className="rounded-[18px] border border-[#2446c8] bg-white p-6 shadow-sm transition hover:bg-[#f7f9ff]" href="/bizradar/tenders">
            <span className="rounded-full bg-[#2446c8] px-3 py-1 text-xs font-black text-white">현재 활성 모듈</span>
            <h2 className="mt-5 text-2xl font-black">나라장터 입찰공고</h2>
            <p className="mt-3 text-sm font-bold leading-6 text-[#65708a]">
              업무구분, 검색어, 공고일 기간을 기준으로 조달청 입찰공고를 조회합니다.
            </p>
            <span className="mt-6 inline-flex h-10 items-center rounded-[10px] bg-[#172033] px-4 text-sm font-black text-white">검색 시작</span>
          </Link>

          <Link className="rounded-[18px] border border-[#d8e0f0] bg-white p-6 shadow-sm transition hover:bg-[#f7f9ff]" href="/bizradar/company">
            <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-black text-[#2446c8]">Company Profile</span>
            <h2 className="mt-5 text-2xl font-black">우리 회사 등록</h2>
            <p className="mt-3 text-sm font-bold leading-6 text-[#65708a]">
              업종, 지역, 기술, 인증, 면허, 직접생산, 주요 실적을 저장해 다음 Sprint에서 입찰공고와 비교합니다.
            </p>
            <span className="mt-6 inline-flex h-10 items-center rounded-[10px] border border-[#c9d3e6] bg-white px-4 text-sm font-black text-[#172033]">프로필 작성</span>
          </Link>

          <Link className="rounded-[18px] border border-[#d8e0f0] bg-white p-6 shadow-sm transition hover:bg-[#f7f9ff]" href="/bizradar/company/import">
            <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-black text-[#2446c8]">Company Knowledge</span>
            <h2 className="mt-5 text-2xl font-black">회사 자료 가져오기</h2>
            <p className="mt-3 text-sm font-bold leading-6 text-[#65708a]">
              회사소개서, 제안서, 실적, 인증서 파일에서 텍스트를 추출해 회사 프로필 초안을 만듭니다.
            </p>
            <span className="mt-6 inline-flex h-10 items-center rounded-[10px] border border-[#c9d3e6] bg-white px-4 text-sm font-black text-[#172033]">자료 업로드</span>
          </Link>

          {futureModules.map((module) => (
            <article className="rounded-[18px] border border-[#d8e0f0] bg-white p-6 opacity-80 shadow-sm" key={module}>
              <span className="rounded-full bg-[#eef2f8] px-3 py-1 text-xs font-black text-[#7a8499]">준비 중</span>
              <h2 className="mt-5 text-xl font-black">{module}</h2>
              <p className="mt-3 text-sm font-bold leading-6 text-[#7a8499]">향후 BizRadar 확장 모듈로 연결할 예정입니다.</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
