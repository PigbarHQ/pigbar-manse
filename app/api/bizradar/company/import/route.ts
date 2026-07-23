import { extractCompanyKnowledgeText, generateCompanyProfileFromDocuments } from "@/src/lib/bizradar/companyKnowledge";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILES = 8;

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    console.info("[BizRadar Company Import] request received");
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File && value.size > 0)
      .slice(0, MAX_FILES);

    console.info("[BizRadar Company Import] files parsed", {
      count: files.length,
      files: files.map((file) => ({ name: file.name, size: file.size, type: file.type })),
    });

    if (!files.length) {
      return Response.json({ error: "업로드된 파일이 없습니다." }, { status: 400 });
    }

    const documents = await Promise.all(
      files.map(async (file) => {
        const fileStartedAt = Date.now();
        if (file.size > MAX_FILE_SIZE) {
          console.warn("[BizRadar Company Import] file skipped because it is too large", {
            fileName: file.name,
            fileSize: file.size,
          });
          return {
            fileName: file.name,
            fileType: file.name.split(".").pop()?.toLowerCase() ?? "unknown",
            fileSize: file.size,
            extractedText: "",
            extractedTextLength: 0,
            warnings: ["파일 크기가 20MB를 초과해 분석하지 않았습니다."],
          };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        console.info("[BizRadar Company Import] text extraction started", {
          fileName: file.name,
          fileSize: buffer.length,
        });
        const document = await extractCompanyKnowledgeText(file.name, buffer);
        console.info("[BizRadar Company Import] text extraction completed", {
          fileName: document.fileName,
          fileType: document.fileType,
          extractedTextLength: document.extractedTextLength,
          warnings: document.warnings,
          durationMs: Date.now() - fileStartedAt,
        });
        return document;
      }),
    );

    console.info("[BizRadar Company Import] profile generation started", {
      documentCount: documents.length,
      totalExtractedTextLength: documents.reduce((sum, document) => sum + document.extractedTextLength, 0),
    });
    const result = await generateCompanyProfileFromDocuments(documents);
    console.info("[BizRadar Company Import] profile generation completed", {
      usesAi: result.usesAi,
      model: result.model,
      companyName: result.draftProfile.companyName,
      durationMs: Date.now() - startedAt,
    });
    return Response.json({
      ...result,
      documents: result.documents.map((document) => ({
        ...document,
        extractedText: "",
      })),
    });
  } catch (error) {
    console.error("[BizRadar Company Import] failed", {
      message: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startedAt,
    });
    return Response.json(
      {
        error: "회사 자료 분석 중 오류가 발생했습니다.",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
