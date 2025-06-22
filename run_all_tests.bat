@echo off
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
)
pytest -q
npm test --silent

