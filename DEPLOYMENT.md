# Deployment

## Local development

1. Install dependencies with `npm install`.
2. Run the app with `npm run dev`.
3. Open `http://localhost:3000`.

## Environment variables

- `INFERENCE_API_URL`: optional Python inference service URL. If omitted, TruthLens uses a local heuristic fallback.
- `TRUTHLENS_MODEL_PATH`: optional path to a serialized model artifact for the Python service.

## Vercel deployment

1. Push the repository to GitHub.
2. Import the repository in Vercel.
3. Keep the detected Next.js defaults.
4. Add `INFERENCE_API_URL` only if the hosted Python API is available.
5. Deploy and verify the production URL.

## Python inference service

The `ml/` folder contains a FastAPI service skeleton and a training script for a TF-IDF + Logistic Regression baseline.
Host it separately from Vercel if you want the predictive path to use a trained model instead of the built-in fallback.

## Notes

- Uploads are handled per request and are not persisted by the Next.js route.
- The demo is an explainable classifier, not a fact-checking system.
