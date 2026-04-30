#!/usr/bin/env bash
# Fly resolves Dockerfile relative to the deploy working directory.
# Running `fly deploy` from server/ looks for server/Dockerfile — this script
# always deploys from the repository root (where Dockerfile + fly.toml live).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
exec fly deploy "$@"
