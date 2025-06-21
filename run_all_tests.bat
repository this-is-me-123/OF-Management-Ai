@echo off
echo Running Python tests (pytest)...
if exist tests (
    pytest tests
) else (
    echo No tests directory found, skipping Python tests.
)
echo.
echo Running Node/JS tests (npm test in each module with package.json)...
for /d %%d in (*) do (
    if exist "%%d\package.json" (
        echo ---- Running npm test in %%d ----
        cd "%%d"
        call npm install
        call npm test
        cd ..
    )
)
echo.
echo All tests executed! Check above for failures or errors.
pause
