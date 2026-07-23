import { bizRadarErrorPayload, bizRadarErrorStatus, fetchTenderOpportunities, type TenderBusinessType } from "@/src/lib/bizradar";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const businessType = (url.searchParams.get("businessType") || "service") as TenderBusinessType;

    return Response.json(await fetchTenderOpportunities({
      businessType,
      keyword: url.searchParams.get("keyword") || undefined,
      noticeStartDate: url.searchParams.get("noticeStartDate") || undefined,
      noticeEndDate: url.searchParams.get("noticeEndDate") || undefined,
      demandAgencyName: url.searchParams.get("demandAgencyName") || undefined,
      bidNoticeNo: url.searchParams.get("bidNoticeNo") || undefined,
      regionRestriction: normalizeRestrictionFilter(url.searchParams.get("regionRestriction")),
      licenseRestriction: normalizeRestrictionFilter(url.searchParams.get("licenseRestriction")),
      pageNo: Number(url.searchParams.get("pageNo") || 1),
      numOfRows: Number(url.searchParams.get("numOfRows") || 20),
    }));
  } catch (error) {
    return Response.json(bizRadarErrorPayload(error), { status: bizRadarErrorStatus(error) });
  }
}

function normalizeRestrictionFilter(value: string | null) {
  if (value === "yes" || value === "no") return value;
  return "all";
}
