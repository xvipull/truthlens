# TruthLens

TruthLens is a Vercel-ready Next.js application for explainable fake-news detection.

## What it does

- Accepts an article headline and body text.
- Returns a likely `Fake` or `Real` verdict with confidence.
- Surfaces lexical evidence so the result is explainable.
- Falls back to a local heuristic when `INFERENCE_API_URL` is not configured.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- Vercel
- FastAPI for optional Python inference hosting

## Architecture

`src/app/api/check` validates requests and proxies to the configured inference service when available. The Python service in `ml/` can host the trained model separately from Vercel.

## Local setup

```bash
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env.local` and set any required values.

## Data and model notes

- `data/sample_news.csv` is a tiny demonstration dataset for local experimentation.
- Replace it with a licensed Fake/Real News dataset before training a real model.

## Limitations

- This is not fact-checking.
- Short or context-free inputs may produce weak results.
- The bundled local heuristic is intended for development and preview only.

## Live demo

TODO: add the production Vercel URL after deployment.
