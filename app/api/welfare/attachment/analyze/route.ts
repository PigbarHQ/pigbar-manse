import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

export const runtime = "nodejs";

const ALLOWED_HOST_SUFFIXES = ["bokjiro.go.kr"];
const SUPPORTED_EXTENSIONS = new Set(["hwp", "hwpx", "pdf", "doc", "docx", "xls", "xlsx"]);
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const execFileAsync = promisify(execFile);

type AttachmentSummary = {
  지원대상: string;
  선정기준: string;
  지원내용: string;
  신청방법: string;
  필요서류: string;
  문의처: string;
  주의사항: string;
};

type PdfExtractionResult = {
  text?: string;
  numpages?: number;
};

function emptySummary(): AttachmentSummary {
  return {
    지원대상: "",
    선정기준: "",
    지원내용: "",
    신청방법: "",
    필요서류: "",
    문의처: "",
    주의사항: "",
  };
}

function isPrivateHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "::1" || host === "0.0.0.0") return true;
  if (host.startsWith("127.") || host.startsWith("10.") || host.startsWith("192.168.") || host.startsWith("169.254.")) return true;

  const match = host.match(/^172\.(\d+)\./);
  if (!match) return false;
  const second = Number(match[1]);
  return second >= 16 && second <= 31;
}

function isAllowedHost(hostname: string) {
  const host = hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

function parseAttachmentUrl(value: string | null) {
  if (!value) throw new Error("url is required");

  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only http/https URLs are allowed");
  if (isPrivateHost(url.hostname)) throw new Error("Private or local URLs are not allowed");
  if (!isAllowedHost(url.hostname)) throw new Error("This attachment domain is not allowed");

  return url;
}

function fileNameFromContentDisposition(value: string | null) {
  if (!value) return "";

  const encoded = value.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeURIComponent(encoded.replace(/^"|"$/g, ""));

  return value.match(/filename="?([^";]+)"?/i)?.[1] ?? "";
}

function extensionFromName(fileName: string) {
  return path.extname(fileName).replace(".", "").toLowerCase();
}

async function optionalImport<T>(moduleName: string): Promise<T | null> {
  try {
    const importer = new Function("moduleName", "return import(moduleName)");
    return await importer(moduleName) as T;
  } catch {
    return null;
  }
}

function pdfLog(message: string, details?: Record<string, unknown>) {
  if (details) {
    console.info(`[Welfare PDF Analyzer] ${message}`, details);
    return;
  }
  console.info(`[Welfare PDF Analyzer] ${message}`);
}

function safeTempFileName(fileName: string) {
  const base = path.basename(fileName).replace(/[^\p{L}\p{N}._()-]+/gu, "_") || "attachment";
  return `${Date.now()}_${base}`;
}

function isAllowedPdfContentType(contentType: string) {
  const normalized = contentType.split(";")[0]?.trim().toLowerCase();
  return normalized === "application/pdf" || normalized === "application/octet-stream" || normalized === "binary/octet-stream";
}

function htmlPrefix(buffer: ArrayBuffer) {
  return Buffer.from(buffer).subarray(0, 300).toString("utf8").trimStart().toLowerCase().startsWith("<html");
}

function magicHeader(buffer: ArrayBuffer) {
  return Buffer.from(buffer).subarray(0, 20).toString("latin1");
}

function isPdfMagicBytes(buffer: ArrayBuffer) {
  return magicHeader(buffer).startsWith("%PDF");
}

async function tryPdfParse(buffer: ArrayBuffer) {
  const pdfParse = await optionalImport<{ default?: (input: Buffer) => Promise<PdfExtractionResult> } | ((input: Buffer) => Promise<PdfExtractionResult>)>("pdf-parse");
  const parser = typeof pdfParse === "function" ? pdfParse : pdfParse?.default;
  if (!parser) return { extractedText: "", pageCount: 0, warning: "pdf-parse package is not installed." };
  const result = await parser(Buffer.from(buffer));
  return {
    extractedText: result.text?.trim() ?? "",
    pageCount: result.numpages ?? 0,
    warning: "",
  };
}

function pdftotextCandidates() {
  return [
    process.env.PDFTOTEXT_PATH?.trim() ?? "",
    "pdftotext",
    "/Users/thezoooz/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/pdftotext",
    "/Users/thezoooz/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/poppler/bin/pdftotext",
    "/Users/thezoooz/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/bin/pdftotext",
  ].filter(Boolean);
}

async function tryPdftotext(filePath: string) {
  const errors: string[] = [];

  for (const binary of pdftotextCandidates()) {
    try {
      const { stdout } = await execFileAsync(binary, ["-layout", "-enc", "UTF-8", filePath, "-"], {
        maxBuffer: 20 * 1024 * 1024,
      });
      const extractedText = stdout.trim();
      if (extractedText) {
        return { extractedText, warning: "", binary };
      }
      errors.push(`${binary}: empty output`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${binary}: ${message}`);
    }
  }

  return { extractedText: "", warning: `pdftotext fallback failed: ${errors.join(" / ")}`, binary: "" };
}

async function extractPdfText(buffer: ArrayBuffer, filePath: string) {
  const parsed = await tryPdfParse(buffer);
  if (parsed.extractedText) {
    return { ...parsed, extractor: "pdf-parse" };
  }

  const fallback = await tryPdftotext(filePath);
  return {
    extractedText: fallback.extractedText,
    pageCount: parsed.pageCount,
    warning: fallback.extractedText ? parsed.warning : [parsed.warning, fallback.warning].filter(Boolean).join(" / "),
    extractor: fallback.extractedText ? `pdftotext:${fallback.binary}` : "none",
  };
}

async function extractDocxText(buffer: ArrayBuffer) {
  const mammoth = await optionalImport<{ extractRawText?: (input: { buffer: Buffer }) => Promise<{ value?: string }> }>("mammoth");
  if (!mammoth?.extractRawText) return "";
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
  return result.value?.trim() ?? "";
}

async function extractXlsxText(buffer: ArrayBuffer) {
  const xlsx = await optionalImport<{
    read?: (data: Buffer, options: { type: "buffer" }) => { SheetNames: string[]; Sheets: Record<string, unknown> };
    utils?: { sheet_to_csv?: (sheet: unknown) => string };
  }>("xlsx");
  if (!xlsx?.read || !xlsx.utils?.sheet_to_csv) return "";
  const workbook = xlsx.read(Buffer.from(buffer), { type: "buffer" });
  return workbook.SheetNames.map((sheetName) => xlsx.utils?.sheet_to_csv?.(workbook.Sheets[sheetName]) ?? "").join("\n").trim();
}

async function extractText(fileType: string, buffer: ArrayBuffer, filePath: string) {
  const warnings: string[] = [];

  if (fileType === "hwp" || fileType === "hwpx") {
    warnings.push("HWP 내용 추출 미지원/변환 실패: 다운로드 성공 여부와 파일 정보만 표시합니다.");
    warnings.push("TODO: HWP/HWPX 추출 유틸을 분리하고 LibreOffice headless, hwp.js, pyhwp 기반 변환을 검토합니다.");
    return { extractedText: "", warnings };
  }

  if (fileType === "pdf") {
    const { extractedText, pageCount, warning, extractor } = await extractPdfText(buffer, filePath);
    const first300 = extractedText.slice(0, 300);
    pdfLog("pdf text extraction completed", {
      extractor,
      pageCount,
      extractedTextLength: extractedText.length,
      first300,
    });
    if (!extractedText) warnings.push(`PDF 텍스트 추출 실패: ${warning || "문서 텍스트 레이어 확인이 필요합니다."}`);
    return { extractedText, warnings, pageCount };
  }

  if (fileType === "docx") {
    const extractedText = await extractDocxText(buffer);
    if (!extractedText) warnings.push("DOCX 텍스트 추출 실패: mammoth 설치 또는 문서 형식 확인이 필요합니다.");
    return { extractedText, warnings };
  }

  if (fileType === "xlsx") {
    const extractedText = await extractXlsxText(buffer);
    if (!extractedText) warnings.push("XLSX 텍스트 추출 실패: xlsx 설치 또는 파일 형식 확인이 필요합니다.");
    return { extractedText, warnings };
  }

  if (fileType === "xls") {
    const extractedText = await extractXlsxText(buffer);
    if (!extractedText) warnings.push("XLS 텍스트 추출 실패: xlsx 설치 또는 파일 형식 확인이 필요합니다.");
    return { extractedText, warnings };
  }

  if (fileType === "doc") {
    warnings.push("DOC 바이너리 문서 추출은 아직 지원하지 않습니다.");
    return { extractedText: "", warnings };
  }

  return { extractedText: "", warnings: [`지원하지 않는 파일 형식입니다: ${fileType}`] };
}

function parseSummaryJson(value: string): AttachmentSummary {
  try {
    const parsed = JSON.parse(value) as Partial<AttachmentSummary>;
    return {
      ...emptySummary(),
      ...parsed,
    };
  } catch {
    return emptySummary();
  }
}

function extractResponseText(payload: unknown) {
  const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  if (typeof record.output_text === "string") return record.output_text;
  const output = Array.isArray(record.output) ? record.output : [];

  return output
    .flatMap((item) => {
      const itemRecord = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return Array.isArray(itemRecord.content) ? itemRecord.content : [];
    })
    .map((content) => {
      const contentRecord = content && typeof content === "object" ? content as Record<string, unknown> : {};
      return typeof contentRecord.text === "string" ? contentRecord.text : "";
    })
    .filter(Boolean)
    .join("\n");
}

async function summarizeWithOpenAi(extractedText: string) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || !extractedText.trim()) return { summary: emptySummary(), warning: apiKey ? "" : "OPENAI_API_KEY가 없어 AI 요약은 실행하지 않았습니다." };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_WELFARE_MODEL?.trim() || process.env.OPENAI_BLUEPRINT_MODEL?.trim() || "gpt-5.5",
      input: [
        {
          role: "system",
          content:
            "너는 복지 행정문서 요약 도우미다. 수급 가능, 대상 확정, 신청 가능 같은 단정 표현을 절대 쓰지 말고 확인 필요, 문의 필요 표현을 사용한다. JSON만 출력한다.",
        },
        {
          role: "user",
          content: `아래 행정문서를 다음 JSON 키로 요약하라: 지원대상, 선정기준, 지원내용, 신청방법, 필요서류, 문의처, 주의사항.\n\n${extractedText.slice(0, 12000)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    return { summary: emptySummary(), warning: `AI 요약 실패: ${response.status}` };
  }

  const payload = await response.json();
  return { summary: parseSummaryJson(extractResponseText(payload)), warning: "" };
}

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const attachmentUrl = parseAttachmentUrl(requestUrl.searchParams.get("url"));
    const requestedFileName = requestUrl.searchParams.get("fileName")?.trim() ?? "";
    const response = await fetch(attachmentUrl, { cache: "no-store" });
    const contentType = response.headers.get("content-type") ?? "";
    const contentLengthHeader = response.headers.get("content-length") ?? "";
    const finalUrl = response.url || attachmentUrl.toString();

    pdfLog("download response", {
      httpStatus: response.status,
      contentType,
      contentLength: contentLengthHeader,
      finalUrl,
    });

    if (!response.ok) {
      pdfLog("final report", { status: "다운로드 실패", httpStatus: response.status, finalUrl });
      return Response.json({ error: `다운로드 실패: ${response.status}` }, { status: 502 });
    }

    const fileName = requestedFileName || fileNameFromContentDisposition(response.headers.get("content-disposition")) || "attachment";
    const fileType = extensionFromName(fileName);

    if (!SUPPORTED_EXTENSIONS.has(fileType)) {
      pdfLog("final report", { status: "다운로드 실패", reason: `Unsupported file type: ${fileType || "unknown"}`, fileName });
      return Response.json({ error: `Unsupported file type: ${fileType || "unknown"}` }, { status: 415 });
    }

    const contentLength = Number(contentLengthHeader || "0");
    if (contentLength > MAX_FILE_SIZE) {
      pdfLog("final report", { status: "다운로드 실패", reason: "File size exceeds 20MB limit", contentLength });
      return Response.json({ error: "File size exceeds 20MB limit" }, { status: 413 });
    }

    const buffer = await response.arrayBuffer();
    const tempPath = path.join("/tmp", safeTempFileName(fileName));
    await writeFile(tempPath, Buffer.from(buffer));
    const isPdfByExtension = fileType === "pdf";
    const header = magicHeader(buffer);
    const isPdfByMagicBytes = isPdfMagicBytes(buffer);
    pdfLog("downloaded file saved", {
      fileName,
      fileType,
      contentType,
      tempPath,
      bufferSize: buffer.byteLength,
      magicHeaderFirst20Chars: header,
      isPdfByExtension,
      isPdfByMagicBytes,
    });

    if (buffer.byteLength > MAX_FILE_SIZE) {
      pdfLog("final report", { status: "다운로드 실패", reason: "File size exceeds 20MB limit", bufferSize: buffer.byteLength, tempPath });
      return Response.json({ error: "File size exceeds 20MB limit" }, { status: 413 });
    }

    if (fileType === "pdf") {
      if (!isAllowedPdfContentType(contentType)) {
        pdfLog("pdf content-type warning", {
          contentType: contentType || "missing",
          allowedContentTypes: ["application/pdf", "application/octet-stream", "application/octet-stream;charset=utf-8", "binary/octet-stream"],
        });
      }

      if (!isPdfByMagicBytes) {
        const htmlReceived = htmlPrefix(buffer);
        pdfLog("final report", {
          status: htmlReceived ? "HTML 수신" : "다운로드 실패",
          reason: "PDF 확장자이나 실제 파일 헤더가 PDF가 아닙니다. 다운로드 응답이 HTML 또는 오류페이지일 수 있습니다.",
          fileName,
          contentType,
          magicHeaderFirst20Chars: header,
          tempPath,
          bufferSize: buffer.byteLength,
          isPdfByExtension,
          isPdfByMagicBytes,
        });
        return Response.json(
          {
            error: "PDF 확장자이나 실제 파일 헤더가 PDF가 아닙니다. 다운로드 응답이 HTML 또는 오류페이지일 수 있습니다.",
            fileName,
            fileType,
            contentType,
            magicHeaderFirst20Chars: header,
            fileSize: buffer.byteLength,
          },
          { status: 415 },
        );
      }
    }

    const extraction = await extractText(fileType, buffer, tempPath);
    const summaryResult = await summarizeWithOpenAi(extraction.extractedText);
    const warnings = [...extraction.warnings];
    if (summaryResult.warning) warnings.push(summaryResult.warning);

    if (fileType === "pdf") {
      pdfLog("final report", {
        status: extraction.extractedText ? "PDF 분석 성공" : "다운로드 성공",
        pageCount: extraction.pageCount ?? 0,
        extractedTextLength: extraction.extractedText.length,
        bufferSize: buffer.byteLength,
        tempPath,
      });
    }

    return Response.json({
      fileName,
      fileType,
      contentType,
      finalUrl,
      tempPath,
      fileSize: buffer.byteLength,
      extractedText: extraction.extractedText,
      extractedTextPreview: extraction.extractedText.slice(0, 2000),
      extractedTextLength: extraction.extractedText.length,
      summary: summaryResult.summary,
      warnings,
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown attachment analysis error",
      },
      { status: 400 },
    );
  }
}
