# Scurry
A nimble little mouse that scurries through MyAnonamouse (MAM) and whisks torrents into qBittorrent.

[![Docker Pulls](https://img.shields.io/docker/pulls/masonfox/scurry)](https://hub.docker.com/r/masonfox/scurry)

## Features

### 🔍 Manual Search
- Search MyAnonamouse (MAM) directly from the web interface
- View torrent details including seeders, size, and file types
- One-click download to qBittorrent
- VIP torrent identification
- Already snatched torrent detection

### 📚 Hardcover Integration
- **NEW!** Sync your "Want to Read" books from Hardcover.app
- Automatic book matching and downloading every 15 minutes
- Smart string matching with similarity scoring
- Manual search and download for individual books
- Track download attempts and status
- Avoid re-downloading already snatched torrents

### ⚙️ Configuration Management
- Web-based configuration for MAM and Hardcover tokens
- Automatic Hardcover user ID detection
- CouchDB integration for persistent storage
- Real-time status monitoring

### 🤖 Automation
- Cron job runs every 15 minutes to check for new books
- Intelligent retry logic with attempt limits
- Respects API rate limits with delays
- Tracks downloads across MAM and external sources

## Quick Start

### Development
```bash
cp .env.example .env
mkdir -p secrets
echo "PASTE_MAM_TOKEN_HERE" > secrets/mam_api_token

# Install dependencies
npm install

# Run Dev (cron disabled by default for development)
npm run dev

# Run Dev with cron enabled
npm run dev:cron

# For Windows users (if cross-env doesn't work)
npm run dev:win          # cron disabled
npm run dev:cron:win     # cron enabled

# visit http://localhost:3000
```

#### Cron Job Control
The automatic book download cron job can be easily toggled for local development:

- **Default development**: Cron is **disabled** (`npm run dev`)
- **Enable cron in dev**: Use `npm run dev:cron` 
- **Environment variable**: Set `ENABLE_CRON=true` or `ENABLE_CRON=false`
- **Production**: Cron runs by default unless explicitly disabled

This makes local development much easier since you won't have the cron job running every 15 minutes during development.

### Production with Docker
```bash
docker compose up --build -d
```

## Configuration

### Required Environment Variables
```bash
# qBittorrent connection
APP_QB_URL=http://qbittorrent:8080
APP_QB_USERNAME=admin
APP_QB_PASSWORD=adminadmin
APP_QB_CATEGORY=books

# App authentication
APP_PASSWORD=your-secure-password

# CouchDB (automatically configured in Docker)
COUCHDB_URL=http://couchdb:5984
COUCHDB_USER=admin
COUCHDB_PASSWORD=password
```

### Setup Process

1. **Access the app** at `http://localhost:3000` (or your configured port)
2. **Login** with your APP_PASSWORD
3. **Navigate to Config** (⚙️) in the top navigation
4. **Configure MAM Token**: Get your API token from MyAnonamouse account settings
5. **Configure Hardcover Token**: Get your API token from Hardcover.app account settings
6. **Fetch User ID**: Click "Fetch User ID" to automatically get your Hardcover user ID
7. **Navigate to Books** (📚) to sync and manage your want-to-read list

## Usage

### Manual Search
1. Use the **Search** (🔍) page to manually search MAM
2. Click "Download" to add torrents to qBittorrent
3. View torrent details and seeder information

### Hardcover Integration
1. Go to the **Books** (📚) page
2. Click "Sync from Hardcover" to pull your latest want-to-read list
3. Use "Auto Download" to trigger manual processing of all books
4. Individual books can be searched and downloaded manually
5. Track download status and attempts for each book

### Book Processing Logic
- Books are automatically fetched from your Hardcover "Want to Read" list
- String matching finds the best MAM torrents using similarity scoring
- Only downloads torrents with >70% title similarity and at least 1 seeder
- Avoids re-downloading already snatched torrents
- Retries failed downloads up to 3 times with 24-hour delays
- Tracks downloads from both automatic and manual sources

## API Endpoints

### Configuration
- `GET /api/config` - Get configuration status
- `POST /api/config` - Update configuration tokens

### Hardcover Integration
- `GET /api/hardcover/books` - Get synced books with status
- `POST /api/hardcover/books` - Sync books from Hardcover
- `POST /api/hardcover/sync` - Trigger automatic download process
- `GET /api/hardcover/search` - Search MAM for specific book
- `POST /api/hardcover/download` - Download specific book

### Legacy Endpoints
- `GET /api/search` - Search MAM
- `POST /api/add` - Add torrent to qBittorrent
- `GET /api/health` - Health check and initialization

## Database Schema

The app uses CouchDB with three databases:

### scurry_config
Stores configuration values:
- `mam_token` - MAM API token
- `hardcover_token` - Hardcover API token  
- `hardcover_user_id` - Hardcover user ID

### scurry_books
Stores book information:
```json
{
  "_id": "book_12345",
  "hardcoverId": 12345,
  "title": "Book Title",
  "status": "wanted|searching|downloaded|failed",
  "downloadAttempts": 0,
  "lastSearched": "2024-01-01T00:00:00.000Z",
  "mamTorrentId": 67890
}
```

### scurry_downloads
Tracks download events:
```json
{
  "_id": "download_timestamp_random",
  "hardcoverId": 12345,
  "mamTorrentId": 67890,
  "source": "auto|manual|external",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## Development

### Testing
```bash
npm test
```

Tests cover:
- Database operations and CouchDB integration
- Hardcover API integration and GraphQL queries
- Book search and matching algorithms
- Cron job processing logic
- API route functionality

### Architecture
- **Next.js 14** with App Router
- **CouchDB** for persistent storage
- **GraphQL** for Hardcover API integration
- **node-cron** for scheduled tasks
- **Docker Compose** for easy deployment

## Troubleshooting

### Common Issues

1. **"Hardcover API token not configured"**
   - Ensure you've added your Hardcover token in the Config page
   - Verify the token has proper permissions

2. **"Failed to fetch user ID from Hardcover"**
   - Check your Hardcover token permissions
   - Ensure you're logged into the correct Hardcover account

3. **Books not downloading automatically**
   - Check that both MAM and Hardcover tokens are configured
   - Verify qBittorrent connection settings
   - Look for books with status "failed" and retry manually

4. **Database connection errors**
   - Ensure CouchDB container is running
   - Check COUCHDB_URL environment variable

### Logs
Monitor logs with:
```bash
docker compose logs -f web
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Todos
- Load and toggle torrent description
- Make `srchIn` field configurable  
- Support audiobooks - MAM search and qBit categories
- Add retry queue management UI
- Implement book series detection and handling
- Add webhook notifications for downloads