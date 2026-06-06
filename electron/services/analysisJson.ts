export function parseAnalysisJson<T>(content: string): T {
  const normalized = content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(normalized) as T;
  } catch {
    const start = normalized.indexOf("{");
    const end = normalized.lastIndexOf("}");

    if (start >= 0 && end > start) {
      return JSON.parse(normalized.slice(start, end + 1)) as T;
    }

    throw new Error("LLM analysis did not return a valid JSON object.");
  }
}
