export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  const { logOpenAiApiKeyStatus } = await import("./src/lib/blueprint/openaiEnv");

  logOpenAiApiKeyStatus();
}
