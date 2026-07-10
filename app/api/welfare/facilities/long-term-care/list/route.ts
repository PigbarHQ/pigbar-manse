import { searchFacilityCandidates, type FacilityType } from "@/src/lib/welfare/facilities";
import { welfareErrorPayload, welfareErrorStatus } from "@/src/lib/welfare/national";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const ctpvNm = url.searchParams.get("ctpvNm")?.trim() || "인천광역시";
    const sggNm = url.searchParams.get("sggNm")?.trim() || "미추홀구";
    const facilityType = (url.searchParams.get("facilityType")?.trim() || "장기요양기관") as FacilityType;
    const facilityName = url.searchParams.get("facilityName")?.trim() || "";

    return Response.json(await searchFacilityCandidates({ ctpvNm, sggNm, facilityType, facilityName }));
  } catch (error) {
    return Response.json(
      welfareErrorPayload(error),
      { status: welfareErrorStatus(error) },
    );
  }
}
