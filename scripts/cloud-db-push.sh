#!/bin/bash
# ==============================================================================
# DesiPay Cloud Database Provisioning & Schema Push Helper
# ==============================================================================
# Usage:
#   ./scripts/cloud-db-push.sh "postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require"
# Or:
#   DATABASE_URL="postgresql://..." ./scripts/cloud-db-push.sh
# ==============================================================================

set -e

DB_URL="${1:-$DATABASE_URL}"

if [ -z "$DB_URL" ]; then
  echo "❌ Error: DATABASE_URL is missing!"
  echo ""
  echo "Usage:"
  echo "  ./scripts/cloud-db-push.sh \"<YOUR_CLOUD_POSTGRES_URL>\""
  echo ""
  echo "Example with Neon:"
  echo "  ./scripts/cloud-db-push.sh \"postgresql://desipay_owner:npg_xyz@ep-fancy-pond.ap-southeast-1.aws.neon.tech/neondb?sslmode=require\""
  exit 1
fi

echo "🚀 Connecting to Cloud PostgreSQL database..."
echo "Target: $(echo "$DB_URL" | sed -E 's/:[^@]+@/:****@/')"

# Push schema directly
DATABASE_URL="$DB_URL" npx prisma db push

echo "✅ Cloud database schema synced successfully!"
echo ""
echo "Tables provisioned in PostgreSQL:"
echo "  - users, customer_profiles, shopkeeper_profiles, b2b_profiles"
echo "  - sessions, transactions, audit_logs"
echo "  - payments, payment_webhook_logs"
echo "  - khata_entries, inventory_logs, notifications"
echo ""
echo "🎉 Ready for production traffic!"
