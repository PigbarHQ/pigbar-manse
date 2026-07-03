import type { ManseResult } from "@/src/lib/manse";

function formatMinutes(value: number) {
  return `${value > 0 ? "+" : ""}${Math.round(value)}분`;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "시간 모름";
  }

  const date = new Date(value);
  date.setSeconds(date.getSeconds() + 30);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export function TimeCorrectionPanel({ result }: { result: ManseResult }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4">
      <h2 className="text-lg font-black text-stone-800">시간 보정</h2>
      <dl className="mt-3 grid gap-2 text-sm text-stone-600">
        <div className="flex justify-between gap-4">
          <dt>원 입력 시간</dt>
          <dd className="font-semibold text-stone-900">{result.input.birthTime ?? "시간 모름"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>지역시 보정값</dt>
          <dd className="font-semibold text-stone-900">
            {formatMinutes(result.timeCorrection.offsetMinutes)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
            <dt>지역시 보정 시간</dt>
          <dd className="text-right font-semibold text-stone-900">
            {formatDateTime(result.timeCorrection.correctedDateTime)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
