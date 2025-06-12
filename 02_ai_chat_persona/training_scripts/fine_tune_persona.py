"""Simple bigram fine-tuning on cleaned DM responses.

This module trains a lightweight bigram language model using the
messages stored in ``full_dm_archive_cleaned.json``. It writes a
``training_curves.json`` file containing the loss value for each
epoch and a ``sample_outputs.txt`` file with generated samples.
The implementation uses only the Python standard library so it can
run in restricted environments.
"""

from __future__ import annotations

import json
import math
import random
from collections import Counter, defaultdict
from pathlib import Path
from typing import Iterable, List, Tuple


class BigramModel:
    """A minimal bigram language model with Laplace smoothing."""

    def __init__(self) -> None:
        self.counts: defaultdict[str, Counter[str]] = defaultdict(Counter)
        self.vocab: set[str] = set()

    def update(self, tokens: Iterable[str]) -> None:
        tokens = list(tokens)
        self.vocab.update(tokens)
        for i in range(len(tokens) - 1):
            self.counts[tokens[i]][tokens[i + 1]] += 1

    def _loss(self, texts: Iterable[List[str]]) -> float:
        vocab_size = max(len(self.vocab), 1)
        total_nll = 0.0
        total_tokens = 0
        for tokens in texts:
            for i in range(len(tokens) - 1):
                prev_tok = tokens[i]
                next_tok = tokens[i + 1]
                dist = self.counts[prev_tok]
                total = sum(dist.values()) + vocab_size
                count = dist.get(next_tok, 0) + 1
                prob = count / total
                total_nll += -math.log(prob)
                total_tokens += 1
        return total_nll / total_tokens if total_tokens else 0.0

    def train(self, texts: Iterable[str], epochs: int = 5) -> List[float]:
        tokenized = [t.split() for t in texts]
        losses = []
        for _ in range(epochs):
            for tokens in tokenized:
                self.update(tokens)
            losses.append(self._loss(tokenized))
        return losses

    def generate(self, seed: str = "", length: int = 15) -> str:
        if not self.vocab:
            return seed
        tokens = seed.split() if seed else [random.choice(list(self.vocab))]
        for _ in range(length):
            prev = tokens[-1]
            dist = self.counts[prev]
            if dist:
                words, weights = zip(*dist.items())
                tokens.append(random.choices(words, weights=weights)[0])
            else:
                tokens.append(random.choice(list(self.vocab)))
        return " ".join(tokens)


def load_responses(path: str | Path) -> List[str]:
    with open(path) as f:
        data = json.load(f)
    return [m["response"] for m in data.get("messages", [])]


def run_training(
    data_path: str | Path,
    output_dir: str | Path = "training_outputs",
    epochs: int = 5,
    seed_text: str = "Hey",
) -> Tuple[Path, Path]:
    """Train the bigram model and write curve and sample files."""

    texts = load_responses(data_path)
    model = BigramModel()
    losses = model.train(texts, epochs=epochs)

    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    curves_file = out_dir / "training_curves.json"
    with curves_file.open("w") as f:
        json.dump({"loss": losses}, f, indent=2)

    samples_file = out_dir / "sample_outputs.txt"
    with samples_file.open("w") as f:
        for _ in range(3):
            f.write(model.generate(seed_text) + "\n")

    return curves_file, samples_file


if __name__ == "__main__":
    run_training(Path(__file__).resolve().parent.parent / "full_dm_archive_cleaned.json")
