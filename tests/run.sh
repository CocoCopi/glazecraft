#!/bin/sh
# glazecraft test runner: corros suite + browser-runtime smoke test + live round-trip.
set -u
cd "$(dirname "$0")/.."
FAIL=0
echo "== corros suite =="
corros tests/t_glaze.cro || FAIL=1
echo "== browser runtime (node) =="
node --check web/glaze.js || FAIL=1
node tests/glaze_dom_test.js || FAIL=1
echo "== live round-trip =="
pkill -f "src/cli[.]cro" 2>/dev/null
sleep 1
( setsid corros src/cli.cro serve 8899 >/tmp/glazecraft_srv.log 2>&1 & )
sleep 1.5
curl -s http://127.0.0.1:8899/ | grep -q 'data-glaze-id' || { echo "FAIL: page lacks hydration root"; FAIL=1; }
curl -s -X POST -d "id=g1&h=0&value=5" http://127.0.0.1:8899/_glaze/event | grep -q "items: 5" || { echo "FAIL: event round-trip"; FAIL=1; }
pkill -f "src/cli[.]cro" 2>/dev/null
[ "$FAIL" -eq 0 ] && echo "ALL GLAZECRAFT TESTS PASSED"
exit "$FAIL"
