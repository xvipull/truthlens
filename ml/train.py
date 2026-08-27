from __future__ import annotations

import argparse
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from data import iter_text, load_news_csv


def build_pipeline() -> Pipeline:
    return Pipeline(
        [
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), stop_words="english", max_features=5000)),
            ("clf", LogisticRegression(max_iter=1000, class_weight="balanced")),
        ]
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Train a baseline fake-news classifier.")
    parser.add_argument("--data", default="../data/sample_news.csv", help="Path to CSV data")
    parser.add_argument("--output", default="./artifacts/truthlens-model.joblib", help="Output joblib path")
    args = parser.parse_args()

    records = load_news_csv(args.data)
    if len(records) < 4:
        raise SystemExit("Need at least 4 labeled rows to train the baseline model.")

    features = iter_text(records)
    targets = [record.label for record in records]

    x_train, x_test, y_train, y_test = train_test_split(
        features,
        targets,
        test_size=0.25,
        random_state=42,
        stratify=targets if len(set(targets)) > 1 else None,
    )

    pipeline = build_pipeline()
    pipeline.fit(x_train, y_train)
    predictions = pipeline.predict(x_test)

    print(f"accuracy: {accuracy_score(y_test, predictions):.3f}")
    print(f"precision: {precision_score(y_test, predictions, pos_label='fake'):.3f}")
    print(f"recall: {recall_score(y_test, predictions, pos_label='fake'):.3f}")
    print(f"f1: {f1_score(y_test, predictions, pos_label='fake'):.3f}")

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, output)
    print(f"saved model to {output}")


if __name__ == "__main__":
    main()
