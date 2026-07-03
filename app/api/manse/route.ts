import { calculateManse } from "@/src/lib/manse";
import type { ManseInput } from "@/src/lib/manse";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as ManseInput;
    const result = calculateManse(input);

    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown manse calculation error",
      },
      { status: 400 },
    );
  }
}
