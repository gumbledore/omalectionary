#!/bin/bash
# Pass/fail harness for the Omalectionary calendar module.
set -uo pipefail

here=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)

pass=0 fail=0
ok()  { pass=$((pass + 1)); echo "  ok   $1"; }
bad() { fail=$((fail + 1)); echo "  FAIL $1"; }

echo "calendar"
if command -v node >/dev/null; then
  if node "$here/calendar.test.js"; then ok "calendar.test.js"; else bad "calendar.test.js"; fi
else
  bad "node not found"
fi

echo
echo "$pass passed, $fail failed"
((fail == 0))
