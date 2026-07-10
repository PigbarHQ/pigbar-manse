import path from "node:path";

type WelfareApiConfig = {
  source: WelfareSource;
  baseEndpoint: string;
  listPath: string;
  detailPath: string;
};

export class WelfareApiError extends Error {
  status: number;
  retryAfter: string;

  constructor(status: number, retryAfter = "") {
    const message = status === 429
      ? "복지로 API 요청 제한에 걸렸습니다. 잠시 후 다시 조회해주세요."
      : `Bokjiro API failed: ${status}`;
    super(message);
    this.name = "WelfareApiError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export function welfareErrorStatus(error: unknown) {
  return error instanceof WelfareApiError ? error.status : 500;
}

export function welfareErrorPayload(error: unknown) {
  if (error instanceof WelfareApiError) {
    return {
      error: error.message,
      status: error.status,
      retryAfter: error.retryAfter,
    };
  }

  return {
    error: error instanceof Error ? error.message : "Unknown welfare API error",
  };
}

export type LocalWelfareRegion = {
  ctpvNm?: string;
  sggNm?: string;
};

export type WelfareListOptions = {
  lifeArray?: string;
};

const NATIONAL_WELFARE_API: WelfareApiConfig = {
  source: "bokjiro-national",
  baseEndpoint: "https://apis.data.go.kr/B554287/NationalWelfareInformationsV001",
  listPath: "/NationalWelfarelistV001",
  detailPath: "/NationalWelfaredetailedV001",
};

const LOCAL_WELFARE_API: WelfareApiConfig = {
  source: "bokjiro-local",
  baseEndpoint: "https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations",
  listPath: "/LcgvWelfarelist",
  detailPath: "/LcgvWelfaredetailed",
};

export type WelfareSource = "bokjiro-national" | "bokjiro-local";

export type WelfareListItem = {
  source: WelfareSource;
  id: string;
  name: string;
  provider: string;
  region: string;
  ministry: string;
  organization: string;
  summary: string;
  lifeCycle: string;
  theme: string;
  targetGroup: string;
  supportCycle: string;
  provisionType: string;
  onlineApplyYn: string;
  contact: string;
  detailLink: string;
  raw: unknown;
};

export type WelfareFormItem = {
  name: string;
  url: string;
  extension: string;
};

export type WelfareDetailItem = {
  source: WelfareSource;
  id: string;
  name: string;
  provider: string;
  region: string;
  ministry: string;
  summary: string;
  targetDetail: string;
  selectionCriteria: string;
  benefitContent: string;
  applicationMethods: string;
  applicationLinks: string[];
  contacts: string[];
  homepages: string[];
  laws: string[];
  forms: WelfareFormItem[];
  detailLink: string;
  raw: unknown;
};

type XmlNode = {
  name: string;
  text: string;
  children: XmlNode[];
};

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .trim();
}

function cleanTagName(tag: string) {
  return tag
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .trim()
    .split(/\s+/)[0]
    .split(":")
    .pop() ?? "";
}

function nodeToJson(node: XmlNode): unknown {
  if (node.children.length === 0) return decodeXml(node.text);

  const record: Record<string, unknown> = {};
  node.children.forEach((child) => {
    const value = nodeToJson(child);
    const current = record[child.name];

    if (current === undefined) {
      record[child.name] = value;
      return;
    }

    record[child.name] = Array.isArray(current) ? [...current, value] : [current, value];
  });

  const text = decodeXml(node.text);
  if (text) record.text = text;
  return record;
}

export function parseXmlToJson(xml: string) {
  const root: XmlNode = { name: "root", text: "", children: [] };
  const stack = [root];
  const tokens = xml
    .replace(/<\?xml[\s\S]*?\?>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .match(/<!\[CDATA\[[\s\S]*?\]\]>|<[^>]+>|[^<]+/g) ?? [];

  tokens.forEach((token) => {
    const parent = stack[stack.length - 1];

    if (token.startsWith("<![CDATA[")) {
      parent.text += token;
      return;
    }

    if (!token.startsWith("<")) {
      parent.text += token;
      return;
    }

    if (/^<\//.test(token)) {
      if (stack.length > 1) stack.pop();
      return;
    }

    if (/^<!/.test(token)) return;

    const selfClosing = /\/>$/.test(token);
    const name = cleanTagName(token.slice(1, -1));
    if (!name) return;

    const node: XmlNode = { name, text: "", children: [] };
    parent.children.push(node);
    if (!selfClosing) stack.push(node);
  });

  return nodeToJson(root) as Record<string, unknown>;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return value === undefined || value === null || value === "" ? [] : [value];
}

function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(", ");
  const record = asRecord(value);
  if (typeof record.text === "string") return record.text.trim();
  return "";
}

function pick(record: Record<string, unknown>, names: string[]) {
  for (const name of names) {
    const value = text(record[name]);
    if (value) return value;
  }
  return "";
}

function joinNonEmpty(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).join(" ");
}

function collectValues(value: unknown, names: string[], results: string[] = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectValues(item, names, results));
    return Array.from(new Set(results.filter(Boolean)));
  }

  const record = asRecord(value);
  Object.entries(record).forEach(([key, item]) => {
    if (names.includes(key)) {
      const itemText = text(item);
      if (itemText) results.push(itemText);
    }
    if (typeof item === "object" && item !== null) collectValues(item, names, results);
  });

  return Array.from(new Set(results.filter(Boolean)));
}

function collectRecords(value: unknown, names: string[], results: Record<string, unknown>[] = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectRecords(item, names, results));
    return results;
  }

  const record = asRecord(value);
  Object.entries(record).forEach(([key, item]) => {
    if (names.includes(key)) {
      asArray(item).forEach((candidate) => {
        const candidateRecord = asRecord(candidate);
        if (Object.keys(candidateRecord).length > 0) results.push(candidateRecord);
      });
    }
    if (typeof item === "object" && item !== null) collectRecords(item, names, results);
  });

  return results;
}

type WelfareCacheEntry = {
  expiresAt: number;
  value: Record<string, unknown>;
};

const WELFARE_CACHE_TTL_MS = 1000 * 60 * 5;
const welfareResponseCache = new Map<string, WelfareCacheEntry>();

function collectDetailRows(value: unknown, names: string[]) {
  return collectRecords(value, names)
    .map((record) => {
      const name = pick(record, ["servSeDetailNm", "wlfareInfoReldNm", "name", "title"]);
      const link = pick(record, ["servSeDetailLink", "wlfareInfoReldCn", "link", "url", "content"]);
      if (name && link) return `${name}: ${link}`;
      return name || link;
    })
    .filter(Boolean);
}

function extensionFromFileName(fileName: string) {
  return path.extname(fileName).replace(".", "").toLowerCase();
}

function collectFormItems(raw: Record<string, unknown>) {
  const formRows = collectRecords(raw, ["basfrmList", "formList"]);
  if (formRows.length > 0) {
    return formRows
      .map((record) => {
        const name = pick(record, ["wlfareInfoReldNm", "servSeDetailNm", "basfrmNm", "formNm", "name", "title"]);
        const url = pick(record, ["wlfareInfoReldCn", "servSeDetailLink", "link", "url", "content"]);
        return {
          name: name || url,
          url,
          extension: extensionFromFileName(name),
        };
      })
      .filter((item) => item.name || item.url);
  }

  return collectValues(raw, ["basfrmNm", "formNm", "form"]).map((value) => ({
    name: value,
    url: "",
    extension: extensionFromFileName(value),
  }));
}

function normalizeListItem(raw: Record<string, unknown>, source: WelfareSource): WelfareListItem {
  const ministry = pick(raw, ["jurMnofNm", "jurMnof", "jurOrgNm", "ctpvNm", "sggNm", "ministry"]);
  const organization = pick(raw, ["jurOrgNm", "jurOrg", "bizOrgNm", "orgNm", "organization"]);
  const region = source === "bokjiro-local" ? joinNonEmpty([pick(raw, ["ctpvNm", "sidoNm", "jurOrgNm"]), pick(raw, ["sggNm", "sigunguNm"])]) : "전국";

  return {
    source,
    id: pick(raw, ["servId", "servID", "wlfareInfoId", "id"]),
    name: pick(raw, ["servNm", "serviceNm", "wlfareInfoNm", "name"]),
    provider: organization || ministry || region,
    region,
    ministry,
    organization,
    summary: pick(raw, ["wlfareInfoOutlCn", "servDgst", "servSumry", "summary"]),
    lifeCycle: pick(raw, ["lifeArray", "lifeCycle", "lifeNm"]),
    theme: pick(raw, ["intrsThemaArray", "theme", "themeNm"]),
    targetGroup: pick(raw, ["trgterIndvdlArray", "targetGroup", "targetNm"]),
    supportCycle: pick(raw, ["sprtCycNm", "supportCycle"]),
    provisionType: pick(raw, ["srvPvsnNm", "provisionType"]),
    onlineApplyYn: pick(raw, ["onapPsbltYn", "onlineApplyYn"]),
    contact: pick(raw, ["inqNum", "inqplCtadr", "rprsCtadr", "contact"]),
    detailLink: pick(raw, ["servDtlLink", "detailLink", "hmpgNm", "homepage", "url"]),
    raw,
  };
}

function normalizeDetailItem(raw: Record<string, unknown>, source: WelfareSource): WelfareDetailItem {
  const applicationRows = collectDetailRows(raw, ["applmetList", "aplyMtdList", "applicationMethods"]);
  const contactRows = collectDetailRows(raw, ["inqplCtadrList", "contactList"]);
  const homepageRows = collectDetailRows(raw, ["inqplHmpgReldList", "homepageList", "hmpgList"]);
  const lawRows = collectDetailRows(raw, ["baslawList", "lawList"]);
  const ministry = pick(raw, ["jurMnofNm", "jurMnof", "jurOrgNm", "ctpvNm", "sggNm", "ministry"]);
  const organization = pick(raw, ["jurOrgNm", "jurOrg", "bizOrgNm", "orgNm", "organization"]);
  const region = source === "bokjiro-local" ? joinNonEmpty([pick(raw, ["ctpvNm", "sidoNm", "jurOrgNm"]), pick(raw, ["sggNm", "sigunguNm"])]) : "전국";
  const homepages = homepageRows.length > 0 ? homepageRows : collectValues(raw, ["hmpgNm", "hmpgUrl", "servDtlLink", "url"]);

  return {
    source,
    id: pick(raw, ["servId", "servID", "wlfareInfoId", "id"]),
    name: pick(raw, ["servNm", "serviceNm", "wlfareInfoNm", "name"]),
    provider: organization || ministry || region,
    region,
    ministry,
    summary: pick(raw, ["wlfareInfoOutlCn", "servDgst", "servSumry", "summary"]),
    targetDetail: pick(raw, ["sprtTrgtCn", "tgtrDtlCn", "trgterDtlCn", "targetDetail"]),
    selectionCriteria: pick(raw, ["slctCritCn", "selectionCriteria"]),
    benefitContent: pick(raw, ["alwServCn", "benefitContent", "sprtCn"]),
    applicationMethods: applicationRows.join("\n") || pick(raw, ["aplyMtdCn", "applicationMethods"]),
    applicationLinks: applicationRows,
    contacts: contactRows.length > 0 ? contactRows : collectValues(raw, ["inqplCtadr", "inqNum", "rprsCtadr", "telNo"]),
    homepages,
    laws: lawRows.length > 0 ? lawRows : collectValues(raw, ["baslawNm", "lawNm", "baslaw"]),
    forms: collectFormItems(raw),
    detailLink: pick(raw, ["servDtlLink", "detailLink", "hmpgNm", "hmpgUrl", "url"]) || homepages[0] || "",
    raw,
  };
}

async function fetchWelfare(config: WelfareApiConfig, path: string, params: Record<string, string>) {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY?.trim();
  if (!serviceKey) {
    throw new Error("DATA_GO_KR_SERVICE_KEY not found");
  }

  const url = new URL(`${config.baseEndpoint}${path}`);
  Object.entries({ serviceKey, ...params }).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const cacheKey = `${config.source}:${path}:${JSON.stringify(params)}`;
  const cached = welfareResponseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const response = await fetch(url, { cache: "no-store" });
  const xml = await response.text();
  const raw = parseXmlToJson(xml);

  if (!response.ok) {
    throw new WelfareApiError(response.status, response.headers.get("retry-after") ?? "");
  }

  welfareResponseCache.set(cacheKey, {
    expiresAt: Date.now() + WELFARE_CACHE_TTL_MS,
    value: raw,
  });

  return raw;
}

async function fetchWelfareList(config: WelfareApiConfig, searchWrd: string, options: WelfareListOptions = {}, extraParams: Record<string, string> = {}) {
  const optionParams = Object.fromEntries(
    Object.entries({
      lifeArray: options.lifeArray,
    }).filter(([, value]) => value?.trim()),
  ) as Record<string, string>;
  const raw = await fetchWelfare(config, config.listPath, {
    callTp: "L",
    pageNo: "1",
    numOfRows: "20",
    srchKeyCode: "003",
    searchWrd,
    orderBy: "popular",
    ...optionParams,
    ...extraParams,
  });
  const records = collectRecords(raw, ["servList", "wantedList", "lcgvList", "item", "items"]).filter((item) =>
    pick(item, ["servId", "servID", "wlfareInfoId", "servNm", "wlfareInfoNm"]),
  );

  return {
    source: config.source,
    fetchedAt: new Date().toISOString(),
    items: records.map((record) => normalizeListItem(record, config.source)),
    raw,
  };
}

async function fetchWelfareDetail(config: WelfareApiConfig, servId: string) {
  const raw = await fetchWelfare(config, config.detailPath, {
    callTp: "D",
    servId,
  });
  const [record] = collectRecords(raw, ["wantedDtl", "servDtl", "lcgvDtl", "servList", "item", "items"]).filter((item) =>
    pick(item, ["servId", "servID", "wlfareInfoId", "servNm", "wlfareInfoNm"]),
  ) ?? [];
  const item = normalizeDetailItem(record ?? asRecord(raw), config.source);

  return {
    source: config.source,
    fetchedAt: new Date().toISOString(),
    item,
    raw,
  };
}

export async function fetchNationalWelfareList(searchWrd: string, options: WelfareListOptions = {}) {
  return fetchWelfareList(NATIONAL_WELFARE_API, searchWrd, options);
}

export async function fetchNationalWelfareDetail(servId: string) {
  return fetchWelfareDetail(NATIONAL_WELFARE_API, servId);
}

export async function fetchLocalWelfareList(searchWrd: string, region: LocalWelfareRegion = {}, options: WelfareListOptions = {}) {
  const regionParams = Object.fromEntries(
    Object.entries({
      ctpvNm: region.ctpvNm,
      sggNm: region.sggNm,
    }).filter(([, value]) => value?.trim()),
  ) as Record<string, string>;

  return fetchWelfareList(LOCAL_WELFARE_API, searchWrd, options, regionParams);
}

export async function fetchLocalWelfareDetail(servId: string) {
  return fetchWelfareDetail(LOCAL_WELFARE_API, servId);
}
