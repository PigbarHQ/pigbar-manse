import { fetchLocalWelfareDetail } from "@/src/lib/welfare/national";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const servId = url.searchParams.get("servId")?.trim();

    if (!servId) {
      return Response.json({ error: "servId is required" }, { status: 400 });
    }

    return Response.json(await fetchLocalWelfareDetail(servId));
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown local welfare detail error",
      },
      { status: 500 },
    );
  }
}
