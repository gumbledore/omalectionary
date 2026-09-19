#!/bin/bash
# Pass/fail harness for the Omalectionary plugin's full test suite.
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
echo "lectionary"
if command -v node >/dev/null; then
  if node "$here/lectionary.test.js"; then ok "lectionary.test.js"; else bad "lectionary.test.js"; fi
else
  bad "node not found"
fi

echo
echo "text"
if command -v node >/dev/null; then
  if node "$here/text.test.js"; then ok "text.test.js"; else bad "text.test.js"; fi
else
  bad "node not found"
fi

echo
echo "browse"
if command -v node >/dev/null; then
  if node "$here/browse.test.js"; then ok "browse.test.js"; else bad "browse.test.js"; fi
else
  bad "node not found"
fi

echo
echo "open-logos"
OMALECTIONARY="$here/../bin/omalectionary"
check() { if eval "$2"; then ok "$1"; else bad "$1"; fi; }
check "non ref.ly URL refused" '! "$OMALECTIONARY" open-logos "https://evil.example/x" >/dev/null 2>&1'
logos_tmp=$(mktemp -d)
logos_stub="$logos_tmp/stub"; mkdir -p "$logos_stub"
printf '#!/bin/bash\necho "$1" >"%s/called"\n' "$logos_tmp" >"$logos_stub/xdg-open"
chmod +x "$logos_stub/xdg-open"
check "valid ref.ly URL accepted" 'PATH="$logos_stub:$PATH" "$OMALECTIONARY" open-logos "https://ref.ly/Jn3.16" >/dev/null 2>&1'
rm -rf "$logos_tmp"

echo
echo "$pass passed, $fail failed"
((fail == 0))
