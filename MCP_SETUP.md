# MCP Server Setup Guide for Scurry

## What is MCP?

**Model Context Protocol (MCP)** is a protocol developed by Anthropic that allows AI assistants like Claude and ChatGPT to interact with external tools and data sources. Think of it as a bridge that lets AI models call functions in your application.

## What Does This MCP Server Do?

The Scurry MCP server exposes two main capabilities to AI assistants:

1. **`search_books`** - Search MyAnonamouse for books or audiobooks
2. **`download_book`** - Add a book to your qBittorrent instance

This means you can have natural conversations with Claude or ChatGPT like:
- "Search for books by Brandon Sanderson"
- "Find audiobooks about machine learning"
- "Download the first Mistborn book"

## Prerequisites

Before setting up the MCP server, ensure you have:

1. ✅ A working Scurry installation with:
   - MyAnonamouse (MAM) token configured
   - qBittorrent instance accessible
   - All environment variables set
2. ✅ Node.js installed (version 18+)
3. ✅ Claude Desktop app or access to configure MCP servers

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install the `@modelcontextprotocol/sdk` package along with other dependencies.

### 2. Configure Environment Variables

Make sure your environment variables are set (these are the same as your Scurry setup):

```bash
# Required
export APP_QB_URL="http://your-qbittorrent:8080"
export APP_QB_USERNAME="admin"
export APP_QB_PASSWORD="your-password"

# Optional
export APP_QB_CATEGORY="books"
export APP_MAM_USER_AGENT="Scurry/1.0"
```

### 3. Ensure MAM Token is Configured

The MCP server reads your MAM token from `secrets/mam_api_token`. Make sure this file exists and contains a valid token.

## Connecting to Claude Desktop

### Method 1: Using npx (Recommended)

Edit your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**Linux**: `~/.config/Claude/claude_desktop_config.json`

Add this configuration:

```json
{
  "mcpServers": {
    "scurry": {
      "command": "npx",
      "args": [
        "-y",
        "node",
        "/absolute/path/to/your/scurry/mcp-server.mjs"
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

**Important**: Replace `/absolute/path/to/your/scurry` with the actual full path to your Scurry installation.

### Method 2: Using npm script

Alternatively, you can use the built-in npm script:

```json
{
  "mcpServers": {
    "scurry": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "/absolute/path/to/your/scurry",
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

### 4. Restart Claude Desktop

After saving the configuration, restart Claude Desktop completely (quit and reopen).

### 5. Verify Connection

In Claude Desktop, you should see a small 🔨 (hammer) icon indicating tools are available. You can now interact with Scurry!

## Using the MCP Server

### Example Conversations

**Search for books:**
```
You: Search for books by Neal Stephenson
Claude: [Uses search_books tool]
Found 25 results for "Neal Stephenson":

1. **Snow Crash**
   Author: Neal Stephenson
   Size: 2.5 MB
   Seeders: 42 | Leechers: 3
   ...
```

**Download a book:**
```
You: Download Snow Crash
Claude: [Uses download_book tool with the URL from search results]
Successfully added "Snow Crash" to qBittorrent in category "books"
```

**Complex workflows:**
```
You: Find the latest book by N.K. Jemisin and download it
Claude: [Searches, identifies the latest, and downloads it]
```

## Connecting to ChatGPT

ChatGPT with MCP support is still in development. As of now, the primary way to use MCP is through:

1. **Claude Desktop** (recommended)
2. **Custom integrations** using the MCP SDK
3. **OpenAI's official MCP support** (when available)

## Testing the MCP Server Manually

You can test the MCP server directly using stdio:

```bash
# Set environment variables
export APP_QB_URL="http://localhost:8080"
export APP_QB_USERNAME="admin"
export APP_QB_PASSWORD="password"

# Run the server
npm run mcp
```

The server communicates via stdio (standard input/output) and expects MCP protocol messages.

## Troubleshooting

### "MAM token not found"
- Ensure `secrets/mam_api_token` exists and contains a valid token
- Check file permissions

### "qBittorrent login failed"
- Verify `APP_QB_URL` is correct and accessible
- Check username and password
- Ensure qBittorrent web UI is enabled

### "Module not found" errors
- Run `npm install` to install dependencies
- Ensure you're using Node.js 18 or later

### Claude Desktop not showing tools
- Verify the config file path is correct
- Check the JSON syntax in `claude_desktop_config.json`
- Make sure you've completely restarted Claude Desktop
- Check Claude Desktop logs (usually in the same directory as config)

### Environment variables not being loaded
- Add them explicitly to the `env` section in the MCP config
- Don't rely on shell environment variables in the config file

## Architecture

```
┌─────────────────┐
│  Claude/ChatGPT │
│   Desktop App   │
└────────┬────────┘
         │ MCP Protocol (stdio)
         │
┌────────▼────────┐
│   mcp-server.mjs│
│                 │
│  ┌───────────┐  │
│  │search_books│  │──▶ MyAnonamouse API
│  └───────────┘  │
│                 │
│  ┌───────────┐  │
│  │download_   │  │──▶ qBittorrent API
│  │   book    │  │
│  └───────────┘  │
└─────────────────┘
```

## Available Capabilities

### Tools (Actions)

#### `search_books`

Search for books or audiobooks on MyAnonamouse.

**Parameters:**
- `query` (required): Search term (title, author, series, etc.)
- `category` (optional): "books" or "audiobooks" (default: "books")

**Returns:** List of results with title, author, size, seeders, download URL, etc.

#### `download_book`

Add a book to qBittorrent for download.

**Parameters:**
- `title` (required): Book title (for logging)
- `downloadUrl` (required): Download URL from search results
- `category` (optional): qBittorrent category (default: from config)

**Returns:** Success or error message

### Resources (Fetch/Read Data)

Resources allow the AI to read configuration and metadata without performing actions.

#### `scurry://config`

Fetch current Scurry configuration.

**Returns:** JSON with:
- qBittorrent URL and default category
- MAM token status
- Available category IDs

**Example usage in Claude:**
```
You: What's my current Scurry configuration?
Claude: [Reads scurry://config resource]
Your qBittorrent is at http://localhost:8080, default category is "books", 
and your MAM token is configured.
```

#### `scurry://categories`

Fetch available search categories.

**Returns:** JSON array with category details:
- `name`: Category name ("books" or "audiobooks")
- `id`: MAM category ID
- `description`: What the category contains

**Example usage in Claude:**
```
You: What categories can I search?
Claude: [Reads scurry://categories resource]
You can search in "books" (eBooks) or "audiobooks" (audio formats).
```

## Security Considerations

1. **Credentials**: Your MAM token and qBittorrent credentials are stored in the MCP config file. Keep this file secure.
2. **Access Control**: Only install this MCP server on machines you trust, as it provides direct access to download torrents.
3. **Token Expiration**: MAM tokens can expire. If you get authentication errors, update your token.

## Advanced Configuration

### Running as a Service

You can run the MCP server as a system service for always-on availability. Create a systemd service file (Linux):

```ini
[Unit]
Description=Scurry MCP Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/scurry
Environment="APP_QB_URL=http://localhost:8080"
Environment="APP_QB_USERNAME=admin"
Environment="APP_QB_PASSWORD=password"
ExecStart=/usr/bin/node mcp-server.mjs
Restart=always

[Install]
WantedBy=multi-user.target
```

### Using with Claude API

If you're using the Claude API (not Desktop), you'll need to implement the MCP client side yourself using the `@modelcontextprotocol/sdk` package.

## Next Steps

1. Install dependencies: `npm install`
2. Configure Claude Desktop with the MCP server
3. Restart Claude Desktop
4. Start searching and downloading books through conversation!

## Support

For issues specific to:
- **MCP Server**: Check the MCP server logs (stderr output)
- **Scurry**: Refer to the main README.md
- **Claude Desktop**: Visit Anthropic's documentation

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Anthropic MCP Servers](https://github.com/anthropics/anthropic-quickstarts)
- [Scurry GitHub](https://github.com/masonfox/scurry)
