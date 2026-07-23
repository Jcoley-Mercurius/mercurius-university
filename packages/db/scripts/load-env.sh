#!/usr/bin/env bash

db_script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
db_package_dir="$(cd "${db_script_dir}/.." && pwd)"
repo_root="$(cd "${db_package_dir}/../.." && pwd)"

if [[ -n "${ENV_FILE:-}" ]]; then
  db_env_file="${ENV_FILE}"
elif [[ -f "${db_package_dir}/.env" ]]; then
  db_env_file="${db_package_dir}/.env"
elif [[ -f "${repo_root}/.env" ]]; then
  db_env_file="${repo_root}/.env"
else
  echo "No environment file found. Copy packages/db/.env.example to packages/db/.env." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${db_env_file}"
set +a

require_env() {
  local variable_name="$1"
  if [[ -z "${!variable_name:-}" ]] || [[ "${!variable_name}" == *"YOUR_"* ]]; then
    echo "${variable_name} is missing or still contains a placeholder in ${db_env_file}." >&2
    return 1
  fi
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command '$1' was not found on PATH." >&2
    return 1
  fi
}
