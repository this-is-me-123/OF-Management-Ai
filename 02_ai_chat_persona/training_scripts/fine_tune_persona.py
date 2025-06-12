import argparse
import json
from pathlib import Path


def main(data_path: str, out_dir: str) -> None:
    """Simulate a fine-tuning run and log progress."""
    with open(data_path) as f:
        messages = json.load(f).get("messages", [])

    Path(out_dir).mkdir(parents=True, exist_ok=True)
    log_path = Path(out_dir) / "training.log"
    sample_path = Path(out_dir) / "sample_output.txt"

    with open(log_path, "w") as log:
        for epoch in range(1, 4):
            # Dummy decreasing loss curve
            log.write(f"Epoch {epoch}, loss={1/epoch:.2f}\n")

    with open(sample_path, "w") as out:
        if messages:
            out.write(f"Sample response: {messages[0]['response']}")
        else:
            out.write("No messages in dataset")

    print(f"Logs written to {out_dir}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run persona fine-tuning")
    parser.add_argument("--data", required=True, help="Cleaned training JSON")
    parser.add_argument("--out_dir", default="training_logs", help="Where to write logs")
    args = parser.parse_args()
    main(args.data, args.out_dir)
