#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=load-env.sh
source "${script_dir}/load-env.sh"

for variable_name in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY \
  SUPABASE_SERVICE_ROLE_KEY DATABASE_URL; do
  require_env "${variable_name}"
done
require_command curl
require_command psql

echo "Environment variables loaded from ${db_env_file}."

http_status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' \
  --header "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  "${NEXT_PUBLIC_SUPABASE_URL%/}/rest/v1/quotes?select=id&limit=1")"
if [[ "${http_status}" -lt 200 || "${http_status}" -ge 400 ]]; then
  echo "Supabase REST check failed with HTTP ${http_status}." >&2
  exit 1
fi
echo "Supabase REST endpoint accepted the configured anon key (HTTP ${http_status})."

table_count="$(psql "${DATABASE_URL}" -X -v ON_ERROR_STOP=1 -Atc \
  "select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('quotes','quote_lines','quote_calculation_snapshots','vendors','practice_scenarios');")"
if [[ "${table_count}" != "5" ]]; then
  echo "Postgres connected, but only ${table_count}/5 quote-related tables were found." >&2
  exit 1
fi
echo "Postgres connected and all 5 quote-related tables exist."
