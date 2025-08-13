# Scurry
A nimble little mouse that scurries through MyAnonamouse (MAM) and whisks torrents into qBittorrent.

[![Docker Pulls](https://img.shields.io/docker/pulls/masonfox/scurry)](https://hub.docker.com/r/masonfox/scurry)

## Todos
- Load and toggle torrent description
- Update your MAM session ID from the app UI
- Track snatches locally, since they take 20 min from MAM
- Make `srchIn` field configurable
- Support audiobooks - MAM search and qBit categories

## Quick Start
```bash
cp .env.example .env
mkdir -p secrets
echo "PASTE_MAM_TOKEN_HERE" > secrets/mam_api_token

# Install dependencies
npm install

# Run Dev
npm run dev
# visit http://localhost:3000
```

## Production
```bash
docker compose --build -d
```