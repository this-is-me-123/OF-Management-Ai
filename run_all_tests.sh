#!/usr/bin/env bash
set -e
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
fi
pytest -q
npm test --silent
