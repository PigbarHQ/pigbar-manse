import { calculateManse } from "@/src/lib/manse";
import type { ManseInput } from "@/src/lib/manse";
import { compileBlindInput } from "@/src/lib/blind";
import { compileFutureInput } from "@/src/lib/future";
import { compileDecisionInput } from "@/src/lib/decision";
import { buildTemplateReaderReport } from "@/src/lib/reader";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as ManseInput;
    const result = calculateManse(input);
    const blindCompiler = compileBlindInput(result);
    const targetYear = new Date(result.input.currentDateTime).getFullYear();
    const futureCompiler = compileFutureInput(blindCompiler, {
      currentDate: result.input.currentDateTime,
      targetYear,
      daeun: result.daeun,
    });
    const decisionCompiler = compileDecisionInput({
      blindCompiler,
      futureCompiler,
      targetYear,
    });

    return Response.json({
      ...result,
      blindCompiler,
      futureCompiler,
      decisionCompiler,
      readerReport: buildTemplateReaderReport({
        decisionAnalysis: decisionCompiler,
        targetYear,
      }),
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown manse calculation error",
      },
      { status: 400 },
    );
  }
}
