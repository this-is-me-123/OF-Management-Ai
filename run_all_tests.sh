#!/bin/bash

echo "🟢 Running Python tests (pytest)..."
if [ -d "./tests" ]; then
    pytest ./tests
else
    echo "No ./tests directory found, skipping Python tests."
fi

echo ""
echo "🟢 Running Node/JS tests (npm test in each module with package.json)..."
for d in ./*/ ; do
    if [ -f "$d/package.json" ]; then
        echo "---- Running npm test in $d ----"
        (cd "$d" && npm install && npm test)
    fi
done

echo ""
echo "✅ All tests executed! Check above for failures or errors."
