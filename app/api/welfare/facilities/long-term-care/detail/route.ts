import { fetchFacilityDetailBundle } from "@/src/lib/welfare/facilities";
import { welfareErrorPayload, welfareErrorStatus } from "@/src/lib/welfare/national";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const longTermAdminSym = url.searchParams.get("longTermAdminSym")?.trim();
    const adminPttnCd = url.searchParams.get("adminPttnCd")?.trim();

    if (!longTermAdminSym || !adminPttnCd) {
      return Response.json(
        { error: "longTermAdminSym and adminPttnCd are required" },
        { status: 400 },
      );
    }

    return Response.json(await fetchFacilityDetailBundle(longTermAdminSym, adminPttnCd));
  } catch (error) {
    return Response.json(
      welfareErrorPayload(error),
      { status: welfareErrorStatus(error) },
    );
  }
}
