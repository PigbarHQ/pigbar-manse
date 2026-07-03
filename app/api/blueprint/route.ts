import { buildBlueprintClassicalPublication } from "@/src/lib/blueprint/no000001";
import type { ManseInput } from "@/src/lib/manse";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as ManseInput;
    const publication = buildBlueprintClassicalPublication({
      manseInput: input,
      blueprintId: "bp-000001",
      blueprintNo: "No.000001",
      edition: "초판",
    });

    return Response.json({
      manseInput: publication.manse.input,
      book: publication.classicalBook,
      appendix: publication.runtime.appendix,
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
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown blueprint publication error",
      },
      { status: 400 },
    );
  }
}
