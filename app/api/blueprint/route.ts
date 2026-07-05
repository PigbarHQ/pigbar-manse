import { buildGptBlueprintPublication, createConfiguredBlueprintGptClient } from "@/src/lib/blueprint/gptPipeline";
import type { ManseInput } from "@/src/lib/manse";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as ManseInput;
    const client = createConfiguredBlueprintGptClient();

    if (!client) {
      return Response.json(
        {
          error: "OPENAI_API_KEY가 없어 GPT Writer 파이프라인을 실행할 수 없습니다.",
          code: "OPENAI_API_KEY not found",
        },
        { status: 503 },
      );
    }

    const publication = await buildGptBlueprintPublication({
      manseInput: input,
      client,
      blueprintId: "bp-000001",
      blueprintNo: "No.000001",
      edition: "초판",
    });

    return Response.json({
      manseInput: publication.manse.input,
      book: publication.book,
      appendix: publication.runtime.appendix,
      manuscriptSource: "GPT",
      debugData: {
        appendix: publication.runtime.appendix,
        canonicalManseInput: publication.runtime.canonicalManseInput,
        classicalAnalysis: publication.classicalAnalysis,
        features: publication.runtime.features,
        reasons: publication.runtime.reasons,
        writerInput: publication.runtime.writerInput,
        writerRuntime: publication.runtime.writerRuntime,
      },
    });
  } catch (error) {
    console.error("[Blueprint API]\n/api/blueprint returning 400");
    console.error(error);

    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown blueprint publication error",
      },
      { status: 400 },
    );
  }
}
