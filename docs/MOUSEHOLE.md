# Mousehole Integration

Scurry can integrate with [mousehole](https://github.com/t-mart/mousehole) to automatically manage MAM session tokens. This eliminates the need for manual token updates when your IP address changes.

## What is Mousehole?

Mousehole is a background service that automatically updates your seedbox IP address with MyAnonamouse (MAM). It monitors your IP address and autonomous number (AS), and updates MAM whenever they change.

## Benefits of Integration

- **Automatic token rotation**: When your IP changes, mousehole updates MAM and generates a new session token
- **No manual intervention**: Scurry automatically reads the latest token from mousehole's state file
- **Centralized management**: One service (mousehole) manages tokens for all your applications
- **Fallback support**: If mousehole is unavailable, Scurry can still use a static token file

## How It Works

1. Mousehole monitors your IP address and communicates with MAM
2. When an IP change is detected, mousehole updates MAM and receives a new session token
3. Mousehole stores this token in a `state.json` file
4. Scurry reads the token from this file and uses it for MAM API calls
5. If the state file is unavailable, Scurry falls back to reading from `secrets/mam_api_token`

## Setup Instructions

### Enable Mousehole Mode in Scurry

Add these environment variables to your `.env` file:

```bash
MOUSEHOLE_ENABLED=true
MOUSEHOLE_STATE_FILE=/app/secrets/state.json
```

**Environment Variables:**

- `MOUSEHOLE_ENABLED`: Set to `true` to enable mousehole integration (default: `false`)
- `MOUSEHOLE_STATE_FILE`: Path to mousehole's state file (default: `secrets/state.json`)

### Example Docker Compose (Gluetun + qBittorrent)

```yaml
services:
  gluetun: # or your vpn of choice
    image: qmcgaw/gluetun:latest
    ports:
      - "5010:5010" # Mousehole port
      - "3000:3000" # Scurry port
      - "8090:8090" # qBittorrent Web UI port
      - "35598:35598/tcp" # your qBittorrent TCP torrent port
      - "35598:35598/udp" # your qBittorrent UDP torrent port
    environment:
      # ...your vpn configuration
    restart: unless-stopped

  qbittorrent:
    image: lscr.io/linuxserver/qbittorrent:latest
    network_mode: "service:gluetun" # tunnel through VPN container
    environment:
      TZ: Etc/UTC # Set to your timezone for localization
      WEBUI_PORT: 8090
      TORRENTING_PORT: 35598
    restart: unless-stopped

  mousehole:
    image: tmmrtn/mousehole:latest
    network_mode: "service:gluetun" # tunnel through VPN container
    environment:
      TZ: Etc/UTC # Set to your timezone for localization
    volumes:
      - /path/to/mousehole:/srv/mousehole
    restart: unless-stopped

  scurry:
    image: ghcr.io/masonfox/scurry:latest
    network_mode: "service:gluetun" # tunnel through VPN container
    environment:
      APP_PASSWORD: # remove for no auth
      APP_QB_URL: http://gluetun:8090 # gluetun qbittorrent URL
      APP_QB_USERNAME: # qbittorrent user
      APP_QB_PASSWORD: # qbittorrent password
      MOUSEHOLE_ENABLED: true
      MOUSEHOLE_STATE_FILE: /app/secrets/state.json
    volumes:
      - /path/to/mousehole:/app/secrets # scurry will read the state.json
    restart: unless-stopped
```

**Key Points:**

- Both services mount the same Docker volume (`/path/to/mousehole`)
- Mousehole writes to `/srv/mousehole/state.json` (default location)
- Scurry reads from `/app/secrets/state.json`
- The volume persists tokens across container restarts