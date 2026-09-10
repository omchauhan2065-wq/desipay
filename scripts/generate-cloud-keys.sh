#!/bin/bash
# ==============================================================================
# DesiPay Cloud Key Helper
# ==============================================================================
# Encodes existing keys or generates new RSA 4096-bit keys and displays
# Base64 values to paste into GitHub Secrets or Cloud Host environment variables.
# ==============================================================================

set -e

mkdir -p keys

if [ ! -f keys/private.pem ]; then
  echo "🔑 Generating new RSA 4096-bit key pair..."
  openssl genrsa -out keys/private.pem 4096
  openssl rsa -in keys/private.pem -pubout -out keys/public.pem
fi

PRIV_B64=$(base64 < keys/private.pem | tr -d '\n')
PUB_B64=$(base64 < keys/public.pem | tr -d '\n')

echo "=============================================================================="
echo "🔐 DesiPay Base64 JWT Keys for Cloud / GitHub Secrets"
echo "=============================================================================="
echo ""
echo "JWT_PRIVATE_KEY_BASE64:"
echo "$PRIV_B64"
echo ""
echo "JWT_PUBLIC_KEY_BASE64:"
echo "$PUB_B64"
echo ""
echo "=============================================================================="
echo "📋 Paste these into GitHub Settings > Secrets or Render Environment Variables"
echo "=============================================================================="
