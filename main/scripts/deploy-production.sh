#!/bin/bash

# ============================================================================
# PRODUCTION DEPLOYMENT SCRIPT - Reisbloc POS
# ============================================================================
# This script automates the deployment to production Supabase
# Prerequisites:
#   1. Production Supabase project created
#   2. .env.production configured with real credentials
#   3. Supabase CLI installed and authenticated
#   4. JWT_SECRET generated and secured
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Reisbloc POS - Production Deployment${NC}"
echo -e "${BLUE}============================================${NC}\n"

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ ERROR: .env.production not found${NC}"
    echo "Create .env.production with production credentials first"
    exit 1
fi

# Load production environment
echo -e "${YELLOW}📋 Loading production environment...${NC}"
export $(cat .env.production | grep -v '#' | xargs)

# Validate required variables
REQUIRED_VARS=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY" "SUPABASE_JWT_SECRET" "SUPABASE_SERVICE_ROLE_KEY")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ ERROR: $var not set in .env.production${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Environment variables validated${NC}\n"

# Step 1: Generate JWT_SECRET if needed
if [ "${#SUPABASE_JWT_SECRET}" -lt 32 ]; then
    echo -e "${YELLOW}🔐 Generating new JWT_SECRET...${NC}"
    JWT_SECRET=$(openssl rand -base64 32)
    echo "SUPABASE_JWT_SECRET=$JWT_SECRET" >> .env.production
    echo -e "${GREEN}✅ JWT_SECRET generated and saved to .env.production${NC}\n"
fi

# Step 2: Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}\n"

# Step 3: Build for production
echo -e "${YELLOW}🔨 Building application for production...${NC}"
npm run build
echo -e "${GREEN}✅ Build successful${NC}\n"

# Step 4: Deploy Edge Function
echo -e "${YELLOW}🚀 Deploying Edge Function to production...${NC}"
PROJECT_REF=$(echo $VITE_SUPABASE_URL | sed -E 's#https://([a-z0-9]+)\.supabase\.co#\1#')
npx supabase functions deploy generate-access-token \
  --project-ref "$PROJECT_REF"
echo -e "${GREEN}✅ Edge Function deployed${NC}\n"

# Step 5: Apply production RLS policies
echo -e "${YELLOW}🔒 Applying production RLS policies...${NC}"
echo "Run the following in your Supabase SQL Editor:"
echo ""
echo "psql \"\$SUPABASE_CONNECTION_STRING\" < docs/production-rls-policies.sql"
echo ""
echo -e "${YELLOW}Or manually execute: docs/production-rls-policies.sql${NC}\n"

# Step 6: Verify JWT_SECRET is set in Supabase
echo -e "${YELLOW}📝 IMPORTANT: Set JWT_SECRET in Supabase Edge Function secret...${NC}"
echo ""
echo "Run this command:"
echo "supabase secrets set JWT_SECRET=$SUPABASE_JWT_SECRET --project-id <project-id>"
echo ""
echo -e "${YELLOW}Or in Supabase Dashboard:${NC}"
echo "1. Go to Project Settings > Edge Functions > Secrets"
echo "2. Add new secret: JWT_SECRET = $SUPABASE_JWT_SECRET"
echo ""

# Step 7: Setup production npm script
echo -e "${YELLOW}✅ Production npm script available: npm run build${NC}"
echo "   Use: npm run build && npm run preview"
echo ""

# Step 8: Final checklist
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Production Deployment Checklist${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "
${YELLOW}Pre-deployment:${NC}
  ☐ JWT_SECRET generated and saved (.env.production)
  ☐ Production Supabase project credentials in .env.production
  ☐ Reviewed production RLS policies in docs/production-rls-policies.sql
  ☐ Backup production database created
  ☐ Team notified of deployment

${YELLOW}Deployment:${NC}
  ☐ Build successful (npm run build)
  ☐ Edge Function deployed to production
  ☐ Production RLS policies applied (via SQL Editor)
  ☐ JWT_SECRET secret set in Supabase
  ☐ Database migrations run

${YELLOW}Post-deployment:${NC}
  ☐ Test login flow (PIN authentication)
  ☐ Verify JWT generation from Edge Function
  ☐ Test notifications system
  ☐ Test order creation (Mesero role)
  ☐ Test order marking (Cocina role)
  ☐ Test payment processing (Capitan role)
  ☐ Verify audit logs are being created
  ☐ Monitor for errors in Supabase logs
  ☐ Load testing completed
  ☐ Security review passed

${YELLOW}Security:${NC}
  ☐ JWT_SECRET securely stored (not in version control)
  ☐ RLS policies are restrictive (not permissive)
  ☐ HTTPS enabled on all endpoints
  ☐ CORS configured properly
  ☐ Rate limiting enabled
  ☐ Only ANON_KEY exposed to client

${YELLOW}Monitoring:${NC}
  ☐ Error logging configured
  ☐ Performance monitoring enabled
  ☐ Alerts setup for critical errors
  ☐ Audit trail verified
"

echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Execute RLS policies in Supabase SQL Editor"
echo "2. Set JWT_SECRET in Supabase Edge Function secrets"
echo "3. Test the application in production environment"
echo "4. Monitor audit_logs for any suspicious activity"
echo ""
echo -e "${GREEN}🚀 Ready for production!${NC}\n"
