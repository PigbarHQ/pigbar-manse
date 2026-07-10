import { fetchLocalWelfareList, welfareErrorPayload, welfareErrorStatus } from "@/src/lib/welfare/national";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchWrd = url.searchParams.get("searchWrd")?.trim() || "노인";
    const ctpvNm = url.searchParams.get("ctpvNm")?.trim() || "인천광역시";
    const sggNm = url.searchParams.get("sggNm")?.trim() || "미추홀구";
    const lifeArray = url.searchParams.get("lifeArray")?.trim();

    return Response.json(await fetchLocalWelfareList(searchWrd, { ctpvNm, sggNm }, { lifeArray }));
  } catch (error) {
    return Response.json(
      welfareErrorPayload(error),
      { status: welfareErrorStatus(error) },
    );
  }
}
