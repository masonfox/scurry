# MCP Server Quick Start (5 Minutes)

Get your Scurry MCP server running with Claude Desktop in 5 minutes!

## Prerequisites Checklist

- [ ] Scurry is already working (can search and download via web UI)
- [ ] Claude Desktop app installed
- [ ] Node.js 18+ installed

## 3 Steps to Setup

### Step 1: Install Dependencies (30 seconds)

```bash
cd /path/to/scurry
npm install
```

### Step 2: Configure Claude Desktop (2 minutes)

**Find your Claude config file:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Edit the file** and add this (replace the paths and credentials):

```json
{
  "mcpServers": {
    "scurry": {
      "command": "node",
      "args": [
        "/FULL/PATH/TO/YOUR/scurry/mcp-server.mjs"
      ],
      "env": {
        "APP_QB_URL": "http://your-qbittorrent:8080",
        "APP_QB_USERNAME": "admin",
        "APP_QB_PASSWORD": "your-password",
        "APP_QB_CATEGORY": "books"
      }
    }
  }
}
```

**Important**: Use the FULL absolute path (e.g., `/Users/john/projects/scurry/mcp-server.mjs`)

### Step 3: Restart Claude Desktop (30 seconds)

1. Completely quit Claude Desktop
2. Reopen it
3. Look for the 🔨 (hammer) icon - this means tools are loaded!

## Test It!

Try these conversations in Claude:

```
You: Search for books by Brandon Sanderson
```

Claude will use the search_books tool and show you results!

```
You: Download the first Mistborn book
```

Claude will use the download_book tool with the URL from the search results.

## Troubleshooting

### No hammer icon?
- Check the config file path is correct
- Verify JSON syntax (use a JSON validator)
- Look at Claude Desktop logs (in same folder as config)

### "MAM token not found" error?
- Ensure `secrets/mam_api_token` exists in your Scurry directory
- Check it contains a valid token

### "qBittorrent login failed"?
- Verify `APP_QB_URL` in the config is correct
- Check username/password
- Ensure qBittorrent web UI is enabled

## Done!

You can now search and download books through natural conversation with Claude!

For more details, see [MCP_SETUP.md](MCP_SETUP.md)
