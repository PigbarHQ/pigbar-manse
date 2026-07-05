let didLogOpenAiApiKeyStatus = false;

export function maskOpenAiApiKey(apiKey: string) {
  return `${apiKey.slice(0, 12)}...`;
}

export function readOpenAiApiKey() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  return apiKey && apiKey.length > 0 ? apiKey : null;
}

export function readOpenAiBlueprintModel() {
  return process.env.OPENAI_BLUEPRINT_MODEL?.trim() || "gpt-5.5";
}

export function logOpenAiApiKeyStatus({ force = false }: { force?: boolean } = {}) {
  if (didLogOpenAiApiKeyStatus && !force) {
    return readOpenAiApiKey();
  }

  didLogOpenAiApiKeyStatus = true;

  const apiKey = readOpenAiApiKey();

  if (!apiKey) {
    console.warn("OPENAI_API_KEY not found");
    return null;
  }

  console.info(`OPENAI_API_KEY: ${maskOpenAiApiKey(apiKey)}`);
  console.info(`OPENAI_BLUEPRINT_MODEL: ${readOpenAiBlueprintModel()}`);
  return apiKey;
}
