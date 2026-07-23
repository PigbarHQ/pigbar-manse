import { bizRadarErrorPayload, bizRadarErrorStatus, fetchTenderSupplement, type TenderBusinessType } from "@/src/lib/bizradar";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const bidNoticeNo = url.searchParams.get("bidNoticeNo")?.trim();
    if (!bidNoticeNo) return Response.json({ error: "bidNoticeNo is required" }, { status: 400 });

    return Response.json(await fetchTenderSupplement({
      kind: "attachments",
      businessType: (url.searchParams.get("businessType") || "service") as TenderBusinessType,
      bidNoticeNo,
      bidNoticeOrd: url.searchParams.get("bidNoticeOrd") || undefined,
    }));
  } catch (error) {
    return Response.json(bizRadarErrorPayload(error), { status: bizRadarErrorStatus(error) });
  }
}
