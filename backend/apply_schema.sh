#!/bin/bash
set -e

# --- Configuration ---
DB_NAME="${POSTGRES_DB:-mydb}"
DB_USER="${POSTGRES_USER:-joshua}"
DB_PASSWORD="${POSTGRES_PASSWORD:-summer2011}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
SRC_DIR="./src"
TEMP_FILE="current_build.sql"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

cleanup() {
    rm -f "$TEMP_FILE"
}
trap cleanup EXIT

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

if ! command -v psql &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} psql is not installed."
    exit 1
fi

log_info "Building SQL schema from $SRC_DIR..."

# --- Build SQL File ---
echo "BEGIN;" > "$TEMP_FILE"

# 1. Setup Schemas & Extensions
log_info "  - Loading Setup (Schemas/Extensions)..."
cat "$SRC_DIR/utilities/create_schemas.sql" >> "$TEMP_FILE"

# # 2. auth tables
log_info "  - Loading auth schema..."
cat "$SRC_DIR/auth/jwt.sql" >> "$TEMP_FILE"
cat "$SRC_DIR/auth/oauth.sql" >> "$TEMP_FILE"
cat "$SRC_DIR/auth/reset_tokens.sql" >> "$TEMP_FILE"

# 3. Data Types (Enums/Domains)
log_info "  - Loading Data Types..."
cat "$SRC_DIR/data/enums.sql" >> "$TEMP_FILE"
cat "$SRC_DIR/data/domains.sql" >> "$TEMP_FILE"

# 4. Tables (Sorted by prefix 001, 002...)
log_info "  - Loading Tables..."
find "$SRC_DIR/data/tables" -name "*.sql" -print0 | sort -z | xargs -0 cat >> "$TEMP_FILE"

# 5. Core Logic & Auth Functions
log_info "  - Loading Base Logic..."
cat "$SRC_DIR/logic/core_logic.sql" >> "$TEMP_FILE"
[ -f "$SRC_DIR/logic/core_logic.sql" ] || echo "Warning: logic/core_logic.sql not found"

cat "$SRC_DIR/auth/jwt.sql" >> "$TEMP_FILE"
# Load any other auth files if they exist, but be careful of duplicates or non-schema files
# cat "$SRC_DIR/auth/oauth.sql" >> "$TEMP_FILE" 2>/dev/null || true

# 6. Triggers
log_info "  - Loading Triggers..."
find "$SRC_DIR/logic/triggers" -name "*.sql" -print0 | sort -z | xargs -0 cat >> "$TEMP_FILE" 2>/dev/null || true

# 7. RLS Policies
log_info "  - Loading RLS Policies..."
cat "$SRC_DIR/logic/rls_policies.sql" >> "$TEMP_FILE"

# 8. Indexes
log_info "  - Loading Indexes..."
cat "$SRC_DIR/logic/indexes.sql" >> "$TEMP_FILE"

# 9. Privileges
log_info "  - Loading Privileges..."
find "$SRC_DIR/logic/privileges" -name "*.sql" -print0 | sort -z | xargs -0 cat >> "$TEMP_FILE" 2>/dev/null || true

# 10. API Views (Security Barrier)
log_info "  - Loading API Views..."
cat "$SRC_DIR/api/api_security.sql" >> "$TEMP_FILE"

# 11. API Functions (RPCs)
log_info "  - Loading API Functions..."
find "$SRC_DIR/api/functions" -name "*.sql" -print0 | sort -z | xargs -0 cat >> "$TEMP_FILE" 2>/dev/null || true

echo "COMMIT;" >> "$TEMP_FILE"

# --- Apply ---
log_info "Applying to database: $DB_NAME..."

if [ -z "$DATABASE_URL" ]; then
    export PGPASSWORD="$DB_PASSWORD"
    PG_ARGS="-h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
else
    PG_ARGS="$DATABASE_URL"
fi

if psql $PG_ARGS -v ON_ERROR_STOP=1 -q -f "$TEMP_FILE"; then
    echo -e "${GREEN}✔ Schema successfully reloaded!${NC}"
else
    echo -e "${RED}✘ Schema reload failed.${NC}"
    exit 1
fi
