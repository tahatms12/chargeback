#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost}"

echo "Validating route behavior on ${BASE_URL}"

check_code() {
  local path="$1"
  local expected="$2"
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}${path}")
  if [[ "$code" == "$expected" ]]; then
    echo "PASS ${path} -> ${code}"
  else
    echo "FAIL ${path} -> ${code} (expected ${expected})"
    exit 1
  fi
}

check_redirect() {
  local path="$1"
  local expected_location="$2"
  local location
  location=$(curl -s -I "${BASE_URL}${path}" | awk -F': ' '/^location:/I{print $2}' | tr -d '\r' | tail -n1)
  if [[ "$location" == "$expected_location" ]]; then
    echo "PASS ${path} redirect -> ${location}"
  else
    echo "FAIL ${path} redirect -> ${location} (expected ${expected_location})"
    exit 1
  fi
}

check_code "/" "410"
check_redirect "/chargeback" "/chargeback/"
check_redirect "/customsready" "/customsready/"
check_redirect "/poref" "/poref/"

echo "Route validation checks passed."
