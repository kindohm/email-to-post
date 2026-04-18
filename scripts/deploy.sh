#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/apps/email-to-post"
SERVICE_NAME="email-to-post"
NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

cd "$APP_DIR"

git pull

if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
else
  echo "nvm not found at $NVM_DIR/nvm.sh" >&2
  exit 1
fi

nvm use
npm ci
npm run build

sudo systemctl restart "$SERVICE_NAME"
