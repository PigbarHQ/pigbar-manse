let didLogOpenAiApiKeyStatus = false;

export function maskOpenAiApiKey(apiKey: string) {
  return `${apiKey.slice(0, 12)}...`;
}

export function maskEnvSecret(value: string) {
  return `${value.slice(0, 12)}...`;
}

export function readOpenAiApiKey() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  return apiKey && apiKey.length > 0 ? apiKey : null;
}

export function readOpenAiBlueprintModel() {
  return process.env.OPENAI_BLUEPRINT_MODEL?.trim() || "gpt-5.5";
}

export function readPublicDataPortalSecretKey() {
  const secretKey = process.env.DATA_GO_KR_SERVICE_KEY?.trim();

  return secretKey && secretKey.length > 0 ? secretKey : null;
}

export function logOpenAiApiKeyStatus({ force = false }: { force?: boolean } = {}) {
  if (didLogOpenAiApiKeyStatus && !force) {
    return readOpenAiApiKey();
  }

  didLogOpenAiApiKeyStatus = true;

  const apiKey = readOpenAiApiKey();

  if (apiKey) {
    console.info(`OPENAI_API_KEY: ${maskOpenAiApiKey(apiKey)}`);
    console.info(`OPENAI_BLUEPRINT_MODEL: ${readOpenAiBlueprintModel()}`);
  } else {
    console.warn("OPENAI_API_KEY not found");
  }

  const publicDataPortalSecretKey = readPublicDataPortalSecretKey();
  if (publicDataPortalSecretKey) {
    console.info(`DATA_GO_KR_SERVICE_KEY: ${maskEnvSecret(publicDataPortalSecretKey)}`);
  } else {
    console.warn("DATA_GO_KR_SERVICE_KEY not found");
  }

  return apiKey;
}
