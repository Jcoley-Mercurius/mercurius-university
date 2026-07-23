#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=load-env.sh
source "${script_dir}/load-env.sh"
require_env DATABASE_URL
require_command psql

echo "Applying 0001_quote_lab.sql..."
psql "${DATABASE_URL}" -X -v ON_ERROR_STOP=1 \
  -f "${db_package_dir}/migrations/0001_quote_lab.sql"
echo "Migration complete."
