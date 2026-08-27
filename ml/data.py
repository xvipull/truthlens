from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class NewsRecord:
    title: str
    text: str
    label: str


def normalize(value: str | None) -> str:
    if not value:
        return ""
    return " ".join(value.strip().lower().split())


def load_news_csv(path: str | Path) -> list[NewsRecord]:
    source = Path(path)
    records: list[NewsRecord] = []
    with source.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            title = normalize(row.get("title"))
            text = normalize(row.get("text"))
            label = normalize(row.get("label"))
            if not title or not text or label not in {"fake", "real"}:
                continue
            records.append(NewsRecord(title=title, text=text, label=label))
    return records


def iter_text(records: Iterable[NewsRecord]) -> list[str]:
    return [f"{record.title} {record.text}".strip() for record in records]
