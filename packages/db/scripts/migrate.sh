#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=load-env.sh
source "${script_dir}/load-env.sh"
require_env DATABASE_URL
require_command psql

migration_name="${1:-0001_quote_lab.sql}"
if [[ "${migration_name}" != "$(basename "${migration_name}")" ]] || [[ ! -f "${db_package_dir}/migrations/${migration_name}" ]]; then
  echo "Unknown migration: ${migration_name}" >&2
  exit 1
fi

echo "Applying ${migration_name}..."
psql "${DATABASE_URL}" -X -v ON_ERROR_STOP=1 \
  -f "${db_package_dir}/migrations/${migration_name}"
echo "Migration complete."
