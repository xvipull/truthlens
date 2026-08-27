export type EvidenceItem = {
  term: string;
  direction: "supports-real" | "supports-fake" | "neutral";
  weight: number;
  rationale: string;
};

export type TruthLensAnalysis = {
  label: "Likely Real" | "Likely Fake";
  confidence: number;
  summary: string;
  score: number;
  evidence: EvidenceItem[];
  model: string;
};

type ArticleInput = {
  title: string;
  text: string;
};

const suspiciousPhrases = [
  { term: "shocking", weight: 0.11, rationale: "Sensational framing increases suspicion." },
  { term: "you won't believe", weight: 0.14, rationale: "Clickbait phrasing is a weak credibility signal." },
  { term: "breaking", weight: 0.08, rationale: "Urgent framing often appears in low-context posts." },
  { term: "secret", weight: 0.1, rationale: "Claims of hidden information without sourcing reduce trust." },
  { term: "massive cover-up", weight: 0.17, rationale: "High-drama language is often associated with unsupported claims." },
  { term: "sources say", weight: 0.06, rationale: "Vague attribution does not identify the evidence." },
  { term: "cure all", weight: 0.14, rationale: "Universal claims should be treated cautiously." },
  { term: "miracle", weight: 0.12, rationale: "Extraordinary claims need extra verification." },
];

const groundingPhrases = [
  { term: "according to", weight: -0.09, rationale: "Attribution to a source improves traceability." },
  { term: "data shows", weight: -0.13, rationale: "Evidence-led language often indicates a more grounded claim." },
  { term: "report from", weight: -0.08, rationale: "Named reporting context improves credibility." },
  { term: "study", weight: -0.07, rationale: "Research references often provide checkable context." },
  { term: "official statement", weight: -0.11, rationale: "Explicit sourcing strengthens verification." },
  { term: "verified", weight: -0.12, rationale: "Verification language can indicate factual framing." },
];

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[^a-z0-9\s'\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatPercent(confidence: number) {
  return `${Math.round(confidence * 100)}%`;
}

export function validateArticleInput(input: Partial<ArticleInput>) {
  const errors: string[] = [];
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const text = typeof input.text === "string" ? input.text.trim() : "";

  if (!text) {
    errors.push("Article text is required.");
  }

  if (text.length > 30_000) {
    errors.push("Article text is too long for this demo.");
  }

  if (title.length > 300) {
    errors.push("Headline is too long.");
  }

  return {
    ok: errors.length === 0,
    title,
    text,
    errors,
  };
}

export function analyzeLocally(input: ArticleInput): TruthLensAnalysis {
  const title = normalizeText(input.title);
  const text = normalizeText(input.text);
  const combined = `${title} ${text}`.trim();
  const tokens = new Set(combined.split(" ").filter(Boolean));
  const evidence: EvidenceItem[] = [];

  let score = 0.5;

  for (const phrase of suspiciousPhrases) {
    if (combined.includes(phrase.term)) {
      score += phrase.weight;
      evidence.push({
        term: phrase.term,
        direction: "supports-fake",
        weight: phrase.weight,
        rationale: phrase.rationale,
      });
    }
  }

  for (const phrase of groundingPhrases) {
    if (combined.includes(phrase.term)) {
      score += phrase.weight;
      evidence.push({
        term: phrase.term,
        direction: "supports-real",
        weight: Math.abs(phrase.weight),
        rationale: phrase.rationale,
      });
    }
  }

  const lengthPenalty = Math.max(0, 0.08 - Math.min(text.length / 12_000, 0.08));
  score += text.length < 280 ? 0.08 : 0;
  score += tokens.size < 60 ? 0.04 : 0;
  score += title && text.includes(title) ? -0.03 : 0;
  score += lengthPenalty;

  if (tokens.has("exclusive") || tokens.has("leaked")) {
    score += 0.05;
    evidence.push({
      term: tokens.has("exclusive") ? "exclusive" : "leaked",
      direction: "supports-fake",
      weight: 0.05,
      rationale: "Exclusivity framing can occur in unsupported claims.",
    });
  }

  score = Math.max(0.08, Math.min(score, 0.94));
  const label = score >= 0.5 ? "Likely Fake" : "Likely Real";
  const confidence = score >= 0.5 ? score : 1 - score;

  const orderedEvidence = evidence
    .sort((left, right) => Math.abs(right.weight) - Math.abs(left.weight))
    .slice(0, 6);

  if (!orderedEvidence.length) {
    orderedEvidence.push({
      term: "neutral language",
      direction: "neutral",
      weight: 0,
      rationale: "No strong lexical cue stood out in this sample.",
    });
  }

  return {
    label,
    confidence,
    summary:
      label === "Likely Fake"
        ? "The text contains stronger unsupported-claim cues than grounding cues."
        : "The text contains more grounded language and attribution cues than sensational signals.",
    score,
    evidence: orderedEvidence,
    model: "truthlens-lite-heuristic",
  };
}

export async function analyzeArticle(input: ArticleInput) {
  const configuredUrl = process.env.INFERENCE_API_URL?.trim();
  if (!configuredUrl) {
    return analyzeLocally(input);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(new URL("/predict", configuredUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Inference service returned ${response.status}.`);
    }

    const data = (await response.json()) as TruthLensAnalysis;
    if (!data || typeof data !== "object") {
      throw new Error("Inference service response was malformed.");
    }

    return data;
  } catch (error) {
    console.warn("TruthLens falling back to local heuristic inference.", error);
    return analyzeLocally(input);
  } finally {
    clearTimeout(timeout);
  }
}
