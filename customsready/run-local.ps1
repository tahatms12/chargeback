# run-local.ps1
# One-click local dev runner for CustomsReady Lite
# Uses SQLite (no PostgreSQL or Redis required)
# Runs shopify app dev which creates an HTTPS tunnel automatically

Write-Host "CustomsReady Lite - Local Dev Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Step 1: Copy .env.local to .env (backup existing first)
if (Test-Path ".env") {
    Copy-Item ".env" ".env.backup" -Force
    Write-Host "  Backed up existing .env to .env.backup" -ForegroundColor Yellow
}
Copy-Item ".env.local" ".env" -Force
Write-Host "  Using .env.local (SQLite mode)" -ForegroundColor Green

# Step 2: Set DATABASE_URL for prisma commands
$env:DATABASE_URL = "file:./prisma/dev.sqlite"

# Step 3: Generate Prisma client from the dev schema (SQLite)
Write-Host "`nStep 1/3: Generating Prisma client (SQLite)..." -ForegroundColor Cyan
npx prisma generate --schema=prisma/schema.dev.prisma

# Step 4: Push schema to SQLite database (creates tables)
Write-Host "`nStep 2/3: Setting up SQLite database..." -ForegroundColor Cyan
npx prisma db push --schema=prisma/schema.dev.prisma --skip-generate

# Step 5: Start the dev server
Write-Host "`nStep 3/3: Starting Shopify app dev server..." -ForegroundColor Cyan
Write-Host "  The browser will open to authorize the app with your dev store." -ForegroundColor White
Write-Host "  Press Ctrl+C to stop." -ForegroundColor White
Write-Host ""

# Use the Lite app TOML (client_id b401118ff3d466cd8ac36857e7ac845f)
npx shopify app dev --config=shopify.app.ai.toml
