"""Simple bigram fine-tuning for the DM persona dataset."""

import argparse
import json
import math
import os
import random
from pathlib import Path


class BigramModel:
    """Character-level bigram model with add-one smoothing."""

    def __init__(self):
        self.counts = {}
        self.totals = {}
        self.vocab = set()

    def train(self, texts):
        for text in texts:
            prev = "<s>"
            for ch in text:
                self.vocab.add(ch)
                self.counts.setdefault(prev, {})
                self.counts[prev][ch] = self.counts[prev].get(ch, 0) + 1
                self.totals[prev] = self.totals.get(prev, 0) + 1
                prev = ch
            # end token
            self.counts.setdefault(prev, {})
            self.counts[prev]["</s>"] = self.counts[prev].get("</s>", 0) + 1
            self.totals[prev] = self.totals.get(prev, 0) + 1

    def _prob(self, prev, ch):
        vocab_size = len(self.vocab) + 1  # include end token
        return (self.counts.get(prev, {}).get(ch, 0) + 1) / (
            self.totals.get(prev, 0) + vocab_size
        )

    def loss(self, texts):
        nll = 0.0
        count = 0
        for text in texts:
            prev = "<s>"
            for ch in text:
                prob = self._prob(prev, ch)
                nll -= math.log(prob)
                count += 1
                prev = ch
            prob = self._prob(prev, "</s>")
            nll -= math.log(prob)
            count += 1
        return nll / count if count else 0.0

    def generate(self, prompt="", max_len=50):
        prev = prompt[-1] if prompt else "<s>"
        out = []
        for _ in range(max_len):
            choices = self.counts.get(prev)
            if not choices:
                break
            items = list(choices.items())
            total = sum(c for _, c in items)
            r = random.randint(1, total)
            acc = 0
            next_ch = None
            for ch, c in items:
                acc += c
                if r <= acc:
                    next_ch = ch
                    break
            if next_ch == "</s>" or next_ch is None:
                break
            out.append(next_ch)
            prev = next_ch
        return "".join(out)


def load_texts(path):
    if path.endswith(".jsonl"):
        with open(path) as f:
            return [json.loads(line)["completion"].strip() for line in f if line.strip()]
    else:
        data = json.load(open(path))
        msgs = data.get("messages", [])
        return [m.get("response", "") for m in msgs]


def main():
    parser = argparse.ArgumentParser(description="Train a simple bigram model")
    parser.add_argument("--data", default="cleaned_dms.jsonl", help="Training dataset")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--out_dir", default="training_outputs")
    args = parser.parse_args()

    texts = load_texts(args.data)
    if not texts:
        raise SystemExit(f"No training data found at {args.data}")

    model = BigramModel()
    losses = []
    for epoch in range(1, args.epochs + 1):
        random.shuffle(texts)
        model.train(texts)
        loss = model.loss(texts)
        losses.append({"epoch": epoch, "loss": loss})
        print(f"Epoch {epoch} loss: {loss:.4f}")

    out_dir = Path(args.out_dir)
    out_dir.mkdir(exist_ok=True)
    with open(out_dir / "training_curves.json", "w") as f:
        json.dump(losses, f, indent=2)

    samples = [model.generate() for _ in range(3)]
    with open(out_dir / "sample_outputs.txt", "w") as f:
        for s in samples:
            f.write(s + "\n")


if __name__ == "__main__":
    main()
