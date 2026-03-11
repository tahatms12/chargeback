#!/usr/bin/env bash
set -euo pipefail

BASE_DOMAIN="${1:-uplifttechnologies.pro}"

check_host() {
  local host="$1"
  local target="https://${host}.${BASE_DOMAIN}"
  local status
  status=$(curl -I -s -o /dev/null -w "%{http_code}" "$target")
  if [[ "$status" =~ ^(200|301|302|307|308)$ ]]; then
    echo "OK: ${target} (HTTP ${status})"
  else
    echo "FAIL: ${target} (HTTP ${status})"
    exit 1
  fi
}

check_host "chargeguard"
check_host "customsready"
check_host "poref"
check_host "fixitcsv"
check_host "makerqueue"
check_host "stagewise"

echo "Subdomain route validation completed."
