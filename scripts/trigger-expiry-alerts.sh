#!/bin/sh
set -eu

BASE_URL="${CRON_BASE_URL:-https://example.com}"
SECRET="${CRON_SECRET:-}"

if [ -z "$SECRET" ]; then
  echo "CRON_SECRET is not set"
  exit 1
fi

curl --fail --silent --show-error \
  -H "Authorization: Bearer ${SECRET}" \
  "${BASE_URL%/}/api/cron/expiry-alerts"
