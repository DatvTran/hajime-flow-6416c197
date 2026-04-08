#!/bin/bash
# Hajime Fly.io Deployment Script
# Run after: flyctl auth login

set -e

export FLYCTL_INSTALL="/root/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"

echo "🚀 Hajime Fly.io Deployment"
echo "============================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check authentication
if ! flyctl auth whoami > /dev/null 2>&1; then
    echo -e "${RED}Error: Not authenticated with Fly.io${NC}"
    echo "Run: flyctl auth login"
    exit 1
fi

echo -e "${GREEN}✓ Authenticated with Fly.io${NC}"
echo ""

# Step 1: Create PostgreSQL database if not exists
echo "📦 Step 1: PostgreSQL Database"
if ! flyctl status --app hajime-db > /dev/null 2>&1; then
    echo "Creating PostgreSQL database..."
    flyctl postgres create \
        --name hajime-db \
        --region nrt \
        --initial-cluster-size 1 \
        --vm-size shared-cpu-1x \
        --volume-size 1
    echo -e "${GREEN}✓ Database created${NC}"
else
    echo -e "${GREEN}✓ Database already exists${NC}"
fi

# Attach database to app
echo "Attaching database to app..."
flyctl postgres attach hajime-db --app hajime-app || true
echo -e "${GREEN}✓ Database attached${NC}"
echo ""

# Step 2: Set secrets
echo "🔐 Step 2: Setting Secrets"
echo "You'll need to provide:"
echo "  - STRIPE_SECRET_KEY (from your Stripe dashboard)"
echo "  - Access token secrets (generate with: openssl rand -base64 64)"
echo ""

read -p "Enter STRIPE_SECRET_KEY (or press Enter to skip): " STRIPE_KEY
read -p "Enter ACCESS_TOKEN_SECRET (or press Enter to auto-generate): " ACCESS_SECRET
read -p "Enter REFRESH_TOKEN_SECRET (or press Enter to auto-generate): " REFRESH_SECRET
read -p "Enter SESSION_SECRET (or press Enter to auto-generate): " SESSION_SECRET

# Generate secrets if not provided
if [ -z "$ACCESS_SECRET" ]; then
    ACCESS_SECRET=$(openssl rand -base64 64 2>/dev/null || head -c 64 /dev/urandom | base64)
    echo "Generated ACCESS_TOKEN_SECRET"
fi
if [ -z "$REFRESH_SECRET" ]; then
    REFRESH_SECRET=$(openssl rand -base64 64 2>/dev/null || head -c 64 /dev/urandom | base64)
    echo "Generated REFRESH_TOKEN_SECRET"
fi
if [ -z "$SESSION_SECRET" ]; then
    SESSION_SECRET=$(openssl rand -base64 64 2>/dev/null || head -c 64 /dev/urandom | base64)
    echo "Generated SESSION_SECRET"
fi

echo "Setting secrets on Fly.io..."
flyctl secrets set --app hajime-app \
    NODE_ENV=production \
    FEATURE_FLAG_AUTH_ENABLED=true \
    FEATURE_FLAG_CSV_ENABLED=true \
    FEATURE_FLAG_DB_MIGRATION_STAGE=0 \
    ACCESS_TOKEN_SECRET="$ACCESS_SECRET" \
    REFRESH_TOKEN_SECRET="$REFRESH_SECRET" \
    SESSION_SECRET="$SESSION_SECRET"

if [ -n "$STRIPE_KEY" ]; then
    flyctl secrets set --app hajime-app STRIPE_SECRET_KEY="$STRIPE_KEY"
fi

echo -e "${GREEN}✓ Secrets set${NC}"
echo ""

# Step 3: Deploy
echo "🚀 Step 3: Deploying Application"
flyctl deploy --app hajime-app --build-arg VITE_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder

echo -e "${GREEN}✓ Deployment complete${NC}"
echo ""

# Step 4: Run migrations
echo "🗄️  Step 4: Running Database Migrations"
echo "Connecting to database..."

# Get database connection string
DB_URL=$(flyctl postgres connect --app hajime-db --command "echo done" 2>&1 | grep -o 'postgres://[^ ]*' || echo "")

if [ -n "$DB_URL" ]; then
    echo "Running migrations..."
    flyctl ssh console --app hajime-app --command "cd /app/server && npx knex migrate:latest"
    echo -e "${GREEN}✓ Migrations complete${NC}"
else
    echo -e "${YELLOW}⚠ Could not auto-detect database URL${NC}"
    echo "Please run migrations manually:"
    echo "  flyctl ssh console --app hajime-app"
    echo "  cd /app/server && npx knex migrate:latest"
fi

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "Your app is available at:"
echo "  https://hajime-app.fly.dev"
echo ""
echo "Next steps:"
echo "  1. Seed the database: flyctl ssh console --app hajime-app"
echo "                      cd /app/server && npx knex seed:run"
echo "  2. Check logs: flyctl logs --app hajime-app"
echo "  3. Monitor status: flyctl status --app hajime-app"
