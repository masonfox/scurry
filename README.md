# Scurry
A nimble little mouse that scurries through MyAnonamouse (MAM) and whisks torrents into qBittorrent.

[![Docker Pulls](https://img.shields.io/docker/pulls/masonfox/scurry)](https://hub.docker.com/r/masonfox/scurry) [![codecov](https://codecov.io/gh/masonfox/scurry/graph/badge.svg?token=8HEMHYQA4X)](https://codecov.io/gh/masonfox/scurry)

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/masonfox)

## What is Scurry?

Scurry is a self-hosted web application that bridges MyAnonamouse (MAM) and qBittorrent, providing a clean interface to search for and automatically download torrents. Built with Next.js, it offers a modern web UI that makes browsing and downloading content from MAM seamless.

### Key Features

- **Search MAM**: Clean, responsive interface to search MyAnonamouse's extensive library
- **One-click Downloads**: Instantly send torrents to your qBittorrent instance with a single click
- **Direct Integration**: Automatically authenticates with both MAM and qBittorrent APIs
- **URL Query Support**: Pre-fill searches using URL parameters (e.g., `?q=search+term`)
- **Smart Filtering**: Filter results by category, seeders, file types, and more
- **Download Management**: Automatic categorization and organization in qBittorrent
- **Authentication**: Simple password protection for your instance
- **Docker Ready**: Easy deployment with Docker Compose
- **🤖 MCP Server**: Interface with Claude or ChatGPT to search and download books conversationally (see [MCP_SETUP.md](MCP_SETUP.md))

### How It Works

1. **Search**: Enter your search terms in the web interface or use URL parameters (`q=term`)
2. **Browse**: View search results with detailed information (seeders, size, author, etc.)
3. **Download**: Click the download button to automatically add torrents to qBittorrent
4. **Organize**: Torrents are automatically categorized and managed in your qBittorrent instance

### URL Query String Support

You can pre-fill search terms by adding a `q` parameter to the URL:
- `http://localhost:3000/?q=author+name` - Search for a specific author
- `http://localhost:3000/?q=book+title` - Search for a specific book
- `http://localhost:3000/?q=series+name` - Search for a book series

This makes it easy to bookmark searches or integrate with other tools and browser extensions.

## MCP Server (AI Integration)

Scurry includes a **fully MCP-compliant** server that allows you to search for and download books through natural conversation with Claude or ChatGPT!

**Capabilities:**
- 🔧 **Tools**: Search books, download torrents
- 📚 **Resources**: Fetch configuration, browse categories
- 🤖 **Full Protocol Support**: Compatible with any MCP client

**Example conversation:**
```
You: Find audiobooks about ancient Rome
Claude: [Searches and shows results]
You: Download the one by Mary Beard
Claude: [Downloads it to qBittorrent]
```

See the complete setup guide in **[MCP_SETUP.md](MCP_SETUP.md)** for detailed instructions on connecting Scurry to Claude Desktop or other MCP-compatible AI assistants.

## Quick Start
```bash
cp .env.example .env

# Install dependencies
npm install

# Run Dev
npm run dev
# visit http://localhost:3000
```

## Production
**Via Compose**
```bash
docker compose --build -d
```

**Via Docker Run Script**
```bash
docker run -d \
  --name scurry \
  --pull=always \
  -p 3000:3000 \
  -e APP_PASSWORD=PASSWORD \
  -e APP_QB_URL=URL \
  -e APP_QB_USERNAME=admin \
  -e APP_QB_PASSWORD=PASSWORD \
  -v /VOLUME/scurry:/app/secrets \
  --restart always \
  masonfox/scurry:main
```