"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import type { TruthLensAnalysis } from "@/lib/truthlens";
import { formatPercent } from "@/lib/truthlens";

type ApiResponse =
  | { ok: true; analysis: TruthLensAnalysis }
  | { ok: false; error: { code: string; message: string; details?: string[] } };

const initialForm = {
  title: "",
  text: "",
};

export default function TruthLensAnalyzer() {
  const [form, setForm] = useState(initialForm);
  const [analysis, setAnalysis] = useState<TruthLensAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const hasContent = useMemo(
    () => form.title.trim().length > 0 || form.text.trim().length > 0,
    [form.title, form.text],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setAnalysis(null);

    if (!form.text.trim()) {
      setError("Add article text before checking the claim.");
      return;
    }

    setIsPending(true);
    try {
      const response = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as ApiResponse;
      if (!response.ok || !data.ok) {
        const message =
          !data.ok && data.error?.message
            ? data.error.message
            : "TruthLens could not complete the check.";
        setError(message);
        return;
      }

      setAnalysis(data.analysis);
    } catch {
      setError("Network error. Try again or configure INFERENCE_API_URL.");
    } finally {
      setIsPending(false);
    }
  }

  function resetForm() {
    setForm(initialForm);
    setAnalysis(null);
    setError(null);
  }

  const score = analysis ? Math.round(analysis.confidence * 100) : 0;
  const scoreLabel = analysis ? formatPercent(analysis.confidence) : "0%";

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
      <section className="glass-card relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-600/50 to-transparent" />

        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-emerald-900/5 px-3 py-1 text-sm font-medium text-emerald-950">
              TruthLens
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" />
              Explainable fake news detection
            </div>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Check a claim, inspect the reasoning, and keep the result tied to the
                evidence.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
                Paste a headline and article text, then TruthLens returns a fake/real
                prediction with highlightable cues. The app is designed for Vercel and
                supports a hosted Python inference service through{" "}
                <code className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-sm text-slate-100">
                  INFERENCE_API_URL
                </code>
                .
              </p>
            </div>
          </div>

          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-semibold text-slate-900">
                Article headline
              </label>
              <input
                id="title"
                name="title"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Example: Central bank secretly announces new stimulus plan"
                className="min-h-12 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="text" className="text-sm font-semibold text-slate-900">
                Article body
              </label>
              <textarea
                id="text"
                name="text"
                value={form.text}
                onChange={(event) =>
                  setForm((current) => ({ ...current, text: event.target.value }))
                }
                placeholder="Paste the article text here. TruthLens will look for unsupported claims, sensational phrasing, and evidence-bearing terms."
                className="min-h-72 resize-y rounded-[1.5rem] border border-slate-200 bg-white/90 px-4 py-3 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
              />
            </div>

            {error ? (
              <div
                role="alert"
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              >
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isPending || !hasContent}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isPending ? "Analyzing..." : "Check the claim"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </form>

          <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-white/65 p-4 text-sm leading-6 text-slate-700">
            <p className="font-semibold text-slate-900">Privacy</p>
            <p>
              Text is processed only for the current request. No uploads are persisted by
              the Vercel route handler in this demo.
            </p>
          </div>
        </div>
      </section>

      <aside className="glass-card sticky top-6 grid gap-5 rounded-[2rem] p-6 sm:p-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-900/70">
            Result
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Interpretable verdict
          </h2>
          <p className="text-sm leading-6 text-slate-700">
            TruthLens surfaces a label, confidence, and the most relevant lexical cues so
            the result is auditable rather than opaque.
          </p>
        </div>

        <div className="rounded-[1.5rem] bg-slate-950 px-5 py-5 text-white shadow-lg">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-slate-300">Confidence</p>
              <p className="mt-2 text-4xl font-semibold">{scoreLabel}</p>
            </div>
            <div className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium">
              {analysis?.label ?? "Awaiting analysis"}
            </div>
          </div>
          <div className="mt-5 h-3 rounded-full bg-white/10">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-amber-300 transition-all"
              style={{ width: `${score}%` }}
            />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            {analysis
              ? analysis.summary
              : "Submit an article to see the prediction, evidence, and model notes."}
          </p>
        </div>

        <div className="grid gap-3">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white/75 p-4">
            <p className="text-sm font-semibold text-slate-900">Top indicators</p>
            <div className="mt-3 grid gap-3">
              {(analysis?.evidence ?? [
                { term: "No analysis yet", direction: "neutral", weight: 0, rationale: "Results will appear here." },
              ]).map((item) => (
                <div key={item.term} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-950">{item.term}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {item.direction}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{item.rationale}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/50 p-4 text-sm leading-6 text-slate-700">
            <p className="font-semibold text-slate-900">Scope</p>
            <p className="mt-1">
              This is an explainable classification demo, not fact-checking and not a
              substitute for source verification.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
