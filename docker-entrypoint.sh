#!/bin/bash
set -e

# Default to UID/GID 1000 (most common user)
PUID=${PUID:-1000}
PGID=${PGID:-1000}

# Print startup info
echo "───────────────────────────────────────"
echo "Scurry - Starting with:"
echo "  User UID: ${PUID}"
echo "  User GID: ${PGID}"
echo "───────────────────────────────────────"

# Modify app user to match PUID/PGID
groupmod -o -g "${PGID}" app 2>/dev/null || true
usermod -o -u "${PUID}" app 2>/dev/null || true

# Fix ownership of critical directories
chown -R app:app /app/secrets /app/config 2>/dev/null || true

# Execute command as app user
exec su-exec app "$@"
