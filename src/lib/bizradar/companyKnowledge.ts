import { execFile } from "node:child_process";
import { unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { inflateRawSync } from "node:zlib";
import { readOpenAiApiKey, readOpenAiBlueprintModel } from "@/src/lib/blueprint/openaiEnv";
import { EMPTY_COMPANY_PROFILE, parseCompanyListInput, type BizRadarCompanyProfile } from "./company";

export const SUPPORTED_COMPANY_KNOWLEDGE_EXTENSIONS = new Set(["pdf", "docx", "pptx"]);
const MAX_AI_INPUT_LENGTH = 45000;
const OPENAI_TIMEOUT_MS = 60_000;
const execFileAsync = promisify(execFile);

export type CompanyKnowledgeExtractedDocument = {
  fileName: string;
  fileType: string;
  fileSize: number;
  extractedText: string;
  extractedTextLength: number;
  warnings: string[];
};

export type CompanyKnowledgeImportResult = {
  source: "bizradar-company-import";
  fetchedAt: string;
  usesAi: boolean;
  model: string | null;
  documents: CompanyKnowledgeExtractedDocument[];
  combinedTextLength: number;
  draftProfile: BizRadarCompanyProfile;
  warnings: string[];
  raw?: unknown;
};

type ZipEntry = {
  name: string;
  data: Buffer;
};

export async function extractCompanyKnowledgeText(fileName: string, buffer: Buffer): Promise<CompanyKnowledgeExtractedDocument> {
  const fileType = extensionFromName(fileName);
  const warnings: string[] = [];

  if (!SUPPORTED_COMPANY_KNOWLEDGE_EXTENSIONS.has(fileType)) {
    return {
      fileName,
      fileType: fileType || "unknown",
      fileSize: buffer.length,
      extractedText: "",
      extractedTextLength: 0,
      warnings: [`지원하지 않는 파일 형식입니다: ${fileType || "unknown"}`],
    };
  }

  let extractedText = "";
  if (fileType === "docx") extractedText = extractDocxText(buffer);
  if (fileType === "pptx") extractedText = extractPptxText(buffer);
  if (fileType === "pdf") extractedText = await extractPdfText(buffer, fileName);

  if (!extractedText.trim()) {
    warnings.push(`${fileType.toUpperCase()} 텍스트를 추출하지 못했습니다. 이미지 스캔 문서이거나 텍스트 레이어가 없을 수 있습니다.`);
  }

  return {
    fileName,
    fileType,
    fileSize: buffer.length,
    extractedText: normalizeWhitespace(extractedText),
    extractedTextLength: normalizeWhitespace(extractedText).length,
    warnings,
  };
}

export async function generateCompanyProfileFromDocuments(documents: CompanyKnowledgeExtractedDocument[]): Promise<CompanyKnowledgeImportResult> {
  const startedAt = Date.now();
  const combinedText = documents
    .map((document) => [`[${document.fileName}]`, document.extractedText].join("\n"))
    .join("\n\n")
    .slice(0, MAX_AI_INPUT_LENGTH);
  const warnings = documents.flatMap((document) => document.warnings);
  const apiKey = readOpenAiApiKey();
  const model = readOpenAiBlueprintModel();

  if (!combinedText.trim()) {
    warnings.push("추출된 텍스트가 없어 회사 프로필 초안을 만들 수 없습니다.");
    return buildImportResult({ combinedText, documents, draftProfile: EMPTY_COMPANY_PROFILE, model: null, raw: null, usesAi: false, warnings });
  }

  if (!apiKey) {
    warnings.push("OPENAI_API_KEY not found. AI 초안 대신 추출 텍스트 기반 규칙 초안을 생성했습니다.");
    console.warn("[BizRadar Company Knowledge] OPENAI_API_KEY not found; using fallback profile draft", {
      combinedTextLength: combinedText.length,
    });
    return buildImportResult({ combinedText, documents, draftProfile: buildCompanyProfileDraftFromText(combinedText), model: null, raw: null, usesAi: false, warnings });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    console.info("[BizRadar Company Knowledge] OpenAI profile generation started", {
      model,
      combinedTextLength: combinedText.length,
      timeoutMs: OPENAI_TIMEOUT_MS,
    });
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: "너는 공공입찰 회사 프로필 정리 도우미다. 업로드 문서에서 확인되는 사실만 회사 프로필 JSON으로 정리한다. 추정, 과장, 참가 가능성 판단, 영업 문구를 만들지 않는다.",
          },
          {
            role: "user",
            content: [
              "아래 회사소개서/제안서/실적/인증서 텍스트를 읽고 BizRadarCompanyProfile JSON만 반환하라.",
              "필드: companyName, businessRegistrationNumber, industry, region, employeeCount, revenueRange, technologies, certifications, licenses, directProduction, majorPerformances.",
              "모르는 값은 빈 문자열 또는 빈 배열로 둔다.",
              combinedText,
            ].join("\n\n"),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "bizradar_company_profile",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                companyName: { type: "string" },
                businessRegistrationNumber: { type: "string" },
                industry: { type: "string" },
                region: { type: "string" },
                employeeCount: { type: "string" },
                revenueRange: { type: "string" },
                technologies: { type: "array", items: { type: "string" } },
                certifications: { type: "array", items: { type: "string" } },
                licenses: { type: "array", items: { type: "string" } },
                directProduction: { type: "string" },
                majorPerformances: { type: "array", items: { type: "string" } },
              },
              required: [
                "companyName",
                "businessRegistrationNumber",
                "industry",
                "region",
                "employeeCount",
                "revenueRange",
                "technologies",
                "certifications",
                "licenses",
                "directProduction",
                "majorPerformances",
              ],
            },
          },
        },
      }),
    });
    const raw = await response.json();
    if (!response.ok) throw new Error(raw?.error?.message ?? `OpenAI request failed: ${response.status}`);
    const parsed = parseOpenAiProfileResponse(raw);
    console.info("[BizRadar Company Knowledge] OpenAI profile generation completed", {
      model,
      durationMs: Date.now() - startedAt,
    });
    return buildImportResult({ combinedText, documents, draftProfile: normalizeCompanyProfile(parsed), model, raw, usesAi: true, warnings });
  } catch (error) {
    console.warn("[BizRadar Company Knowledge] OpenAI profile generation failed; using fallback profile draft", {
      message: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startedAt,
    });
    warnings.push(`AI 회사 프로필 생성 실패: ${error instanceof Error ? error.message : String(error)}`);
    return buildImportResult({ combinedText, documents, draftProfile: buildCompanyProfileDraftFromText(combinedText), model, raw: null, usesAi: false, warnings });
  } finally {
    clearTimeout(timeout);
  }
}

export function buildCompanyProfileDraftFromText(text: string): BizRadarCompanyProfile {
  const normalized = normalizeWhitespace(text);
  return {
    ...EMPTY_COMPANY_PROFILE,
    companyName: findCompanyName(normalized),
    businessRegistrationNumber: normalized.match(/\b\d{3}-\d{2}-\d{5}\b/)?.[0] ?? "",
    industry: findFirstLineAfter(normalized, ["업종", "사업분야", "사업 분야"]) || findKeywordIndustry(normalized),
    region: findRegion(normalized),
    employeeCount: findFirstLineAfter(normalized, ["직원수", "임직원"]) || "",
    revenueRange: findFirstLineAfter(normalized, ["매출", "매출액"]) || "",
    technologies: uniqueList([
      ...collectKeywordMatches(normalized, ["AI", "인공지능", "데이터", "웹", "앱", "플랫폼", "상담", "검색", "자동화", "클라우드", "보안"]),
      ...parseCompanyListInput(findFirstLineAfter(normalized, ["기술", "보유기술", "핵심기술"])),
    ]),
    certifications: uniqueList([
      ...collectKeywordMatches(normalized, ["벤처기업", "기업부설연구소", "ISO", "이노비즈", "메인비즈", "특허", "GS인증"]),
      ...parseCompanyListInput(findFirstLineAfter(normalized, ["인증", "보유 인증"])),
    ]),
    licenses: uniqueList([
      ...collectKeywordMatches(normalized, ["소프트웨어사업자", "정보통신공사업", "산업디자인전문회사", "직접생산확인"]),
      ...parseCompanyListInput(findFirstLineAfter(normalized, ["면허", "등록"])),
    ]),
    directProduction: findDirectProduction(normalized),
    majorPerformances: collectPerformanceLines(normalized),
  };
}

function buildImportResult({
  combinedText,
  documents,
  draftProfile,
  model,
  raw,
  usesAi,
  warnings,
}: {
  combinedText: string;
  documents: CompanyKnowledgeExtractedDocument[];
  draftProfile: BizRadarCompanyProfile;
  model: string | null;
  raw: unknown;
  usesAi: boolean;
  warnings: string[];
}): CompanyKnowledgeImportResult {
  return {
    source: "bizradar-company-import",
    fetchedAt: new Date().toISOString(),
    usesAi,
    model,
    documents,
    combinedTextLength: combinedText.length,
    draftProfile,
    warnings: uniqueList(warnings),
    raw,
  };
}

function extensionFromName(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function extractDocxText(buffer: Buffer) {
  return readZipEntries(buffer)
    .filter((entry) => /^word\/(document|header\d+|footer\d+)\.xml$/.test(entry.name))
    .map((entry) => xmlToText(entry.data.toString("utf8")))
    .join("\n");
}

function extractPptxText(buffer: Buffer) {
  return readZipEntries(buffer)
    .filter((entry) => /^ppt\/slides\/slide\d+\.xml$/.test(entry.name) || /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => xmlToText(entry.data.toString("utf8")))
    .join("\n");
}

async function extractPdfText(buffer: Buffer, fileName: string) {
  const pdftotext = await extractPdfTextWithPdftotext(buffer, fileName);
  if (pdftotext.trim()) return pdftotext;

  console.warn("[BizRadar Company Knowledge] pdftotext returned empty text; using simple PDF fallback", {
    fileName,
    bufferSize: buffer.length,
  });
  return extractPdfTextSimpleFallback(buffer);
}

async function extractPdfTextWithPdftotext(buffer: Buffer, fileName: string) {
  const tempPath = path.join("/tmp", `${Date.now()}_${safeTempFileName(fileName)}`);
  await writeFile(tempPath, buffer);

  try {
    for (const binary of pdftotextCandidates()) {
      try {
        const startedAt = Date.now();
        const { stdout } = await execFileAsync(binary, ["-layout", "-enc", "UTF-8", tempPath, "-"], {
          maxBuffer: 20 * 1024 * 1024,
          timeout: 30_000,
        });
        const text = normalizeWhitespace(stdout);
        console.info("[BizRadar Company Knowledge] pdftotext completed", {
          fileName,
          binary,
          extractedTextLength: text.length,
          durationMs: Date.now() - startedAt,
        });
        if (text) return text;
      } catch (error) {
        console.warn("[BizRadar Company Knowledge] pdftotext candidate failed", {
          fileName,
          binary,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } finally {
    await unlink(tempPath).catch(() => undefined);
  }

  return "";
}

function pdftotextCandidates() {
  return [
    process.env.PDFTOTEXT_PATH?.trim() ?? "",
    "/Users/thezoooz/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/poppler/bin/pdftotext",
    "/Users/thezoooz/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/pdftotext",
    "/Users/thezoooz/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/bin/pdftotext",
    "pdftotext",
  ].filter(Boolean);
}

function safeTempFileName(fileName: string) {
  return path.basename(fileName).replace(/[^\p{L}\p{N}._()-]+/gu, "_") || "company-knowledge.pdf";
}

function extractPdfTextSimpleFallback(buffer: Buffer) {
  const source = buffer.toString("utf8");
  const textOperators = Array.from(source.matchAll(/\(([^()]|\\.){2,}\)\s*Tj/g))
    .map((match) => decodePdfString(match[0].replace(/\)\s*Tj$/, "").replace(/^\(/, "")))
    .join("\n");
  const fallback = source
    .replace(/[^\p{L}\p{N}\s.,:;()/%+\-·&]/gu, " ")
    .split(/\n|\r/)
    .map((line) => normalizeWhitespace(line))
    .filter((line) => /[가-힣A-Za-z]/.test(line) && line.length >= 6)
    .join("\n");
  return normalizeWhitespace([textOperators, fallback].filter(Boolean).join("\n"));
}

function readZipEntries(buffer: Buffer): ZipEntry[] {
  const entries: ZipEntry[] = [];
  let offset = 0;

  while (offset < buffer.length - 30) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) {
      offset += 1;
      continue;
    }

    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + fileNameLength + extraLength;
    const name = buffer.subarray(nameStart, nameStart + fileNameLength).toString("utf8");
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);

    try {
      const data = compressionMethod === 8 ? inflateRawSync(compressed) : compressed;
      entries.push({ name, data });
    } catch {
      // Ignore broken entries and keep extracting the rest of the document.
    }

    offset = dataStart + compressedSize;
  }

  return entries;
}

function xmlToText(xml: string) {
  return decodeXmlEntities(xml)
    .replace(/<\/(?:w:p|a:p)>/g, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .trim();
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

function decodePdfString(value: string) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\([()\\])/g, "$1");
}

function parseOpenAiProfileResponse(raw: unknown): BizRadarCompanyProfile {
  const candidate = raw as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  const text = candidate.output_text ?? candidate.output?.flatMap((item) => item.content ?? []).map((content) => content.text ?? "").find(Boolean) ?? "";
  if (!text) throw new Error("OpenAI response did not include JSON text.");
  return JSON.parse(text) as BizRadarCompanyProfile;
}

function normalizeCompanyProfile(profile: Partial<BizRadarCompanyProfile>): BizRadarCompanyProfile {
  return {
    ...EMPTY_COMPANY_PROFILE,
    ...profile,
    technologies: Array.isArray(profile.technologies) ? uniqueList(profile.technologies) : [],
    certifications: Array.isArray(profile.certifications) ? uniqueList(profile.certifications) : [],
    licenses: Array.isArray(profile.licenses) ? uniqueList(profile.licenses) : [],
    majorPerformances: Array.isArray(profile.majorPerformances) ? uniqueList(profile.majorPerformances) : [],
  };
}

function normalizeWhitespace(value: string) {
  return value.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function findCompanyName(text: string) {
  return text.match(/(?:회사명|상호|기업명)\s*[:：]?\s*([^\n]{2,40})/)?.[1]?.trim() ?? text.match(/([가-힣A-Za-z0-9]+(?:주식회사|㈜|\(주\)|랩|테크|솔루션|시스템즈))/)?.[1]?.trim() ?? "";
}

function findFirstLineAfter(text: string, labels: string[]) {
  for (const label of labels) {
    const match = text.match(new RegExp(`${label}\\s*[:：]?\\s*([^\\n]{2,80})`));
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function findKeywordIndustry(text: string) {
  if (/소프트웨어|시스템|플랫폼|앱|웹/.test(text)) return "소프트웨어 개발 및 공급";
  if (/건설|공사|시공/.test(text)) return "건설업";
  if (/제조|생산|공장/.test(text)) return "제조업";
  return "";
}

function findRegion(text: string) {
  const match = text.match(/(서울특별시|부산광역시|대구광역시|인천광역시|광주광역시|대전광역시|울산광역시|세종특별자치시|경기도|강원특별자치도|충청북도|충청남도|전북특별자치도|전라남도|경상북도|경상남도|제주특별자치도)(?:\s+[가-힣]+[시군구])?/);
  return match?.[0] ?? "";
}

function findDirectProduction(text: string) {
  const direct = text.match(/([^\n]{0,30}직접생산[^\n]{0,50})/)?.[1]?.trim() ?? "";
  return direct;
}

function collectKeywordMatches(text: string, keywords: string[]) {
  return keywords.filter((keyword) => text.toLowerCase().includes(keyword.toLowerCase()));
}

function collectPerformanceLines(text: string) {
  return uniqueList(
    text
      .split("\n")
      .map((line) => normalizeWhitespace(line))
      .filter((line) => /(실적|구축|납품|운영|수행|용역|프로젝트)/.test(line))
      .filter((line) => line.length >= 6 && line.length <= 120)
      .slice(0, 12),
  );
}

function uniqueList(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}
