#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status

# --- Configuration ---
DB_NAME="mydb"
DB_USER="postgres"
DB_PASSWORD="summer2011"
DB_HOST="localhost"
DB_PORT="5432"

# Alternatively, use a connection string (Priority over above vars if set)
# DATABASE_URL="postgres://user:pass@localhost:5432/db_name"

# Directory setup (matching the structure discussed previously)
SRC_DIR="./src"
TEMP_FILE="current_build.sql"

# --- Colors for Output ---
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# --- Functions ---

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

cleanup() {
    rm -f "$TEMP_FILE"
}

# Set up trap to remove temp file on exit
trap cleanup EXIT

# Check for psql
if ! command -v psql &> /dev/null; then
    log_error "psql is not installed. Please install PostgreSQL client tools."
    exit 1
fi

# --- Execution Start ---

log_info "Building SQL schema from $SRC_DIR..."

# 1. Start the Transaction
echo "BEGIN;" > "$TEMP_FILE"

# 2. Optional: Pre-cleaning (Uncomment if you want to wipe the API schema on every reload)
# This is useful in dev to ensure no stale views remain, but requires your permissions logic to be robust.
# echo "DROP SCHEMA IF EXISTS api CASCADE; CREATE SCHEMA api;" >> "$TEMP_FILE"

# 3. Concatenate Files in Order
# Order matters: Libs -> Views -> Functions (RPC) -> Privileges

log_info "  - Loading Libraries (Helpers)..."
find "$SRC_DIR/logic/libs" -name "*.sql" -print0 | sort -z | xargs -0 cat >> "$TEMP_FILE" 2>/dev/null || true

log_info "  - Loading Business Logics (RLS & Grants) to iclass schema..."
# Load roles first if defined in SQL, then policies, then privileges
# find "$SRC_DIR/logic" -maxdepth 1 -name "*.sql" -print0 | sort -z | xargs -0 cat >> "$TEMP_FILE" 2>/dev/null || true
find "$SRC_DIR/logic/triggers" -name "*.sql" -print0 | sort -z | xargs -0 cat >> "$TEMP_FILE" 2>/dev/null || true
find "$SRC_DIR/logic/policies" -name "*.sql" -print0 | sort -z | xargs -0 cat >> "$TEMP_FILE" 2>/dev/null || true

log_info "  - Loading Views (Endpoints) to api schema..."
find "$SRC_DIR/api/views" -name "*.sql" -print0 |     sort -z | xargs -0 cat >> "$TEMP_FILE" 2>/dev/null || true
find "$SRC_DIR/api/policies" -name "*.sql" -print0 |     sort -z | xargs -0 cat >> "$TEMP_FILE" 2>/dev/null || true

log_info "  - Loading RPC (Functions) to api schema..."
find "$SRC_DIR/api/functions" -name "*.sql" -print0 | sort -z | xargs -0 cat >> "$TEMP_FILE" 2>/dev/null || true

# 4. Commit the Transaction
echo "COMMIT;" >> "$TEMP_FILE"

# --- Apply to Database ---

log_info "Applying to database: $DB_NAME at $DB_HOST..."

# Determine connection args
if [ -z "$DATABASE_URL" ]; then
    PG_ARGS="-h $DB_HOST -p $DB_PORT -U $DB_USER -W $DB_PASSWORD -d $DB_NAME"
else
    PG_ARGS="$DATABASE_URL"
fi

# Pipe the temp file into psql
# -v ON_ERROR_STOP=1 ensures psql exits with error code if SQL fails
# -q makes it quiet (remove if you want to see all output)
# -1 runs as a single transaction (redundant with our BEGIN/COMMIT but good practice)

if psql $PG_ARGS -v ON_ERROR_STOP=1 -q -f "$TEMP_FILE"; then
    echo -e "${GREEN}✔ Schema successfully reloaded!${NC}"
else
    echo -e "${RED}✘ Schema reload failed. Transaction rolled back.${NC}"
    exit 1
fi
