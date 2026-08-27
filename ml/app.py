from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Literal

import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    title: str = Field(default="", max_length=300)
    text: str = Field(min_length=1, max_length=30000)


class EvidenceItem(BaseModel):
    term: str
    direction: Literal["supports-real", "supports-fake", "neutral"]
    weight: float
    rationale: str


class PredictResponse(BaseModel):
    label: Literal["Likely Real", "Likely Fake"]
    confidence: float
    summary: str
    score: float
    evidence: list[EvidenceItem]
    model: str


app = FastAPI(title="TruthLens Inference API", version="0.1.0")


@lru_cache(maxsize=1)
def load_model():
    artifact = os.getenv("TRUTHLENS_MODEL_PATH")
    if not artifact:
        return None
    path = Path(artifact)
    if not path.exists():
        return None
    return joblib.load(path)


def heuristic_prediction(payload: PredictRequest) -> PredictResponse:
    text = f"{payload.title} {payload.text}".lower()
    fake_terms = {
        "shocking": 0.11,
        "secret": 0.10,
        "breaking": 0.08,
        "miracle": 0.12,
        "you won't believe": 0.14,
    }
    real_terms = {
        "according to": -0.09,
        "report from": -0.08,
        "study": -0.07,
        "official statement": -0.11,
    }
    score = 0.5
    evidence: list[EvidenceItem] = []
    for term, weight in fake_terms.items():
        if term in text:
            score += weight
            evidence.append(
                EvidenceItem(
                    term=term,
                    direction="supports-fake",
                    weight=weight,
                    rationale="Sensational framing weakens trust.",
                )
            )
    for term, weight in real_terms.items():
        if term in text:
            score += weight
            evidence.append(
                EvidenceItem(
                    term=term,
                    direction="supports-real",
                    weight=abs(weight),
                    rationale="Attribution or research language improves traceability.",
                )
            )
    score = max(0.08, min(score, 0.94))
    label = "Likely Fake" if score >= 0.5 else "Likely Real"
    confidence = score if score >= 0.5 else 1 - score
    if not evidence:
        evidence.append(
            EvidenceItem(
                term="neutral language",
                direction="neutral",
                weight=0,
                rationale="No strong lexical cue stood out in the sample.",
            )
        )
    return PredictResponse(
        label=label,
        confidence=confidence,
        summary=(
            "The text leans toward unsupported or sensational language."
            if label == "Likely Fake"
            else "The text contains more grounded or attributable wording."
        ),
        score=score,
        evidence=sorted(evidence, key=lambda item: item.weight, reverse=True)[:6],
        model="truthlens-heuristic",
    )


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest) -> PredictResponse:
    if len(payload.text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Article text is too short.")
    model = load_model()
    if model is None:
        return heuristic_prediction(payload)
    return heuristic_prediction(payload)


@app.get("/health")
def health():
    return {"ok": True}
