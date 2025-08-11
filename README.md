# Scurry
A quick little mouse that zips through MAM and slips your torrents straight into qBittorrent.

## Todos
- Update your MAM session ID from the app Ui
- Add some form of basic authentication, like app access key
- Track snatches locally, since they take 20 min from MAM
- Make `srchIn` field configurable
- Support audiobooks - MAM search and qBit categories
- Add Health check route

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