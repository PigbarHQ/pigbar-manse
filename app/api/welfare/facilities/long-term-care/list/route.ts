import { searchFacilityCandidates, type FacilityType } from "@/src/lib/welfare/facilities";
import { enrichFacilityCandidatesWithEvaluationA } from "@/src/lib/welfare/ltc-evaluation-a";
import { welfareErrorPayload, welfareErrorStatus } from "@/src/lib/welfare/national";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const ctpvNm = url.searchParams.get("ctpvNm")?.trim() || "인천광역시";
    const sggNm = url.searchParams.get("sggNm")?.trim() || "미추홀구";
    const facilityType = (url.searchParams.get("facilityType")?.trim() || "장기요양기관") as FacilityType;
    const facilityName = url.searchParams.get("facilityName")?.trim() || "";
    const includeAcceptanceDetails = url.searchParams.get("includeAcceptanceDetails") !== "false";

    if (facilityType === "전체" && !facilityName) {
      return Response.json(
        { error: "전체 검색은 기관명 일부가 필요합니다." },
        { status: 400 },
      );
    }

    const result = await searchFacilityCandidates({ ctpvNm, sggNm, facilityType, facilityName, includeAcceptanceDetails });
    return Response.json(enrichFacilityCandidatesWithEvaluationA(result, { regionName: ctpvNm }));
  } catch (error) {
    return Response.json(
      welfareErrorPayload(error),
      { status: welfareErrorStatus(error) },
    );
  }
}
