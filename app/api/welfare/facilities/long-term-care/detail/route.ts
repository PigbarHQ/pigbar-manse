import { fetchFacilityDetailBundle } from "@/src/lib/welfare/facilities";
import { evaluationAForLongTermAdminSym, evaluationResultsForFacility } from "@/src/lib/welfare/ltc-evaluation-a";
import { welfareErrorPayload, welfareErrorStatus } from "@/src/lib/welfare/national";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const longTermAdminSym = url.searchParams.get("longTermAdminSym")?.trim();
    const adminPttnCd = url.searchParams.get("adminPttnCd")?.trim();
    const ctpvNm = url.searchParams.get("ctpvNm")?.trim() || "";
    const sggNm = url.searchParams.get("sggNm")?.trim() || "";

    if (!longTermAdminSym || !adminPttnCd) {
      return Response.json(
        { error: "longTermAdminSym and adminPttnCd are required" },
        { status: 400 },
      );
    }

    const result = await fetchFacilityDetailBundle(longTermAdminSym, adminPttnCd, { ctpvNm, sggNm });
    return Response.json({
      ...result,
      evaluationA: evaluationAForLongTermAdminSym(longTermAdminSym),
      evaluationResults: evaluationResultsForFacility({
        longTermAdminSym,
        sourceCode: adminPttnCd,
        regionName: ctpvNm,
      }),
    });
  } catch (error) {
    return Response.json(
      welfareErrorPayload(error),
      { status: welfareErrorStatus(error) },
    );
  }
}
