#!/usr/bin/env bash
# Run on EC2 from ~/WeldDoc after nginx is healthy with http-only.conf.
set -euo pipefail

EMAIL="${1:?Usage: $0 your@email.com [domain]}"
DOMAIN="${2:-welddoc.in}"

mkdir -p certbot/www certbot/conf

docker run --rm \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  certbot/certbot:latest \
  certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  -d "www.$DOMAIN"
