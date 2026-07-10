import { fetchNationalWelfareDetail, welfareErrorPayload, welfareErrorStatus } from "@/src/lib/welfare/national";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const servId = url.searchParams.get("servId")?.trim();

    if (!servId) {
      return Response.json({ error: "servId is required" }, { status: 400 });
    }

    return Response.json(await fetchNationalWelfareDetail(servId));
  } catch (error) {
    return Response.json(
      welfareErrorPayload(error),
      { status: welfareErrorStatus(error) },
    );
  }
}
