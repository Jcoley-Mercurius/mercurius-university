#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=load-env.sh
source "${script_dir}/load-env.sh"
require_env DATABASE_URL
require_env SEED_REP_USER_ID
require_command psql

if [[ ! "${SEED_REP_USER_ID}" =~ ^[0-9a-fA-F-]{36}$ ]] || \
   [[ "${SEED_REP_USER_ID}" == "00000000-0000-0000-0000-000000000000" ]]; then
  echo "SEED_REP_USER_ID must be the UUID of an existing Supabase Auth user." >&2
  exit 1
fi

echo "Seeding Mercurius Solutions for Auth user ${SEED_REP_USER_ID}..."
psql "${DATABASE_URL}" -X -v ON_ERROR_STOP=1 \
  -v seed_rep_user_id="${SEED_REP_USER_ID}" \
  -f "${db_package_dir}/seed/quote_lab_seed.sql"
echo "Seed complete."
