#!/usr/bin/env bash
# Create Python virtual environment and install dependencies
set -e
if [ ! -d .venv ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install -r common/requirements.txt
pip install -r 05_crm_subscriber_management/crm/requirements.txt
