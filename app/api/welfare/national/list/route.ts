import { fetchNationalWelfareList, welfareErrorPayload, welfareErrorStatus } from "@/src/lib/welfare/national";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchWrd = url.searchParams.get("searchWrd")?.trim() || "노인";
    const lifeArray = url.searchParams.get("lifeArray")?.trim();

    return Response.json(await fetchNationalWelfareList(searchWrd, { lifeArray }));
  } catch (error) {
    return Response.json(
      welfareErrorPayload(error),
      { status: welfareErrorStatus(error) },
    );
  }
}
