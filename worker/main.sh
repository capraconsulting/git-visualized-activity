#!/bin/bash
set -eu -o pipefail

source lib.sh

if [ -n "${DATA_DIR:-}" ]; then
  echo "Storing data in $DATA_DIR"
  root=$DATA_DIR
else
  root=$PWD
fi

# Fetch parameters if PARAMS_PREFIX is set.
if [ -n "${PARAMS_PREFIX:-}" ]; then
  if [ -z "${CALS_GITHUB_TOKEN:-}" ]; then
    CALS_GITHUB_TOKEN=$(get_param github-token)
    export CALS_GITHUB_TOKEN
  fi
  if [ -z "${BUCKET_NAME:-}" ]; then
    BUCKET_NAME=$(get_param web-bucket-name)
    export BUCKET_NAME
  fi
  if [ -z "${CF_DISTRIBUTION:-}" ]; then
    CF_DISTRIBUTION=$(get_param cf-distribution-id)
    export CF_DISTRIBUTION
  fi
fi

# When running in Docker, we need some extra parameters and setup.
if [ -e /.dockerenv ]; then
  if [ -z "${CALS_GITHUB_TOKEN:-}" ]; then
    echo "Missing CALS_GITHUB_TOKEN environment varible"
    echo "It should be a GitHub Personal Access Token with scope=repo"
  fi

  echo -e "protocol=https\nhost=github.com\nusername=git\npassword=$CALS_GITHUB_TOKEN\n" | git credential approve
fi

fetch_cals_tools
fetch_resources_definition_capra
fetch_resources_definition_liflig
setup_mailmap

process_repos

upload_commits
invalidate_distribution
