# MCP Server Implementation Summary

## What Was Added

This document summarizes the MCP (Model Context Protocol) server integration for Scurry.

## Files Created

### 1. `mcp-server.mjs` (Main MCP Server)
The core MCP server implementation that:
- **Tools**: Exposes `search_books` and `download_book` tools for actions
- **Resources**: Exposes `scurry://config` and `scurry://categories` for fetching data
- Uses the existing Scurry API logic for MAM searches and qBittorrent integration
- Communicates via stdio (standard input/output) using the MCP protocol
- Formats search results in a human-readable format for AI assistants
- Fully MCP-compliant with both tools and resources capabilities

### 2. `src/lib/config-core.js` (Shared Core Module)
Core configuration logic shared between Next.js and MCP server:
- Contains `config` object with environment variables
- `readMamToken(throwOnError)` with flexible error handling
- No `"server-only"` restriction - can be used in any context

### 3. `src/lib/qbittorrent-core.js` (Shared Core Module)
Core qBittorrent functions shared between Next.js and MCP server:
- `qbLogin()` - Authenticate with qBittorrent
- `qbAddUrl()` - Add torrents to qBittorrent
- No `"server-only"` restriction - can be used in any context

### 4. `MCP_SETUP.md`
Comprehensive setup guide covering:
- What MCP is and how it works
- Installation instructions
- Claude Desktop configuration examples
- Usage examples and troubleshooting
- Security considerations

### 5. `claude_desktop_config.example.json`
Example Claude Desktop configuration file for easy setup.

### 6. `.env.example`
Environment variables template for easy configuration.

### 7. `MCP_IMPLEMENTATION_SUMMARY.md` (this file)
Summary of changes for reference.

## Files Modified

### 1. `src/lib/config.js` (Next.js Wrapper)
- Now imports from `config-core.js`
- Maintains `"server-only"` protection for Next.js routes
- Re-exports core functionality with Next.js-appropriate error handling

### 2. `src/lib/qbittorrent.js` (Next.js Wrapper)
- Now imports from `qbittorrent-core.js`
- Maintains `"server-only"` protection for Next.js routes
- Re-exports core functionality

### 3. `package.json`
- Added `@modelcontextprotocol/sdk` dependency (^0.5.0)
- Added `"mcp"` script: `node mcp-server.mjs`

### 4. `README.md`
- Added MCP Server to key features list
- Added new section explaining the MCP integration with example usage
- Links to MCP_SETUP.md for detailed instructions

## How It Works

```
┌──────────────────────┐
│                      │
│   Claude Desktop     │
│   (or other MCP      │
│    client)           │
│                      │
└──────────┬───────────┘
           │
           │ MCP Protocol (stdio)
           │
           │ {
           │   "name": "search_books",
           │   "arguments": {"query": "Brandon Sanderson"}
           │ }
           │
           ▼
┌──────────────────────┐
│                      │
│   mcp-server.mjs     │
│                      │
│  ┌────────────────┐  │
│  │ search_books   │──┼───▶ MyAnonamouse API
│  │                │  │     (via existing utilities)
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │ download_book  │──┼───▶ qBittorrent API
│  │                │  │     (via existing qb module)
│  └────────────────┘  │
│                      │
└──────────────────────┘
```

## Architecture Decisions

### Why use core + wrapper pattern?

We use a **shared core + thin wrappers** architecture:

1. **Core modules** (`-core.js`): Contain all business logic, no `"server-only"` restriction
2. **Wrapper modules** (`.js`): Re-export from core with `"server-only"` protection for Next.js
3. **MCP server**: Imports core modules directly

This approach:
- ✅ Eliminates code duplication
- ✅ Maintains `"server-only"` security for Next.js routes
- ✅ Allows MCP server to use the same battle-tested logic
- ✅ Single source of truth for all business logic

See `REFACTORING_SUMMARY.md` for detailed architecture explanation.

### Why stdio transport?

MCP servers typically use stdio (standard input/output) for communication because:
1. It's simple and reliable
2. Works across different platforms
3. Easy to integrate with desktop applications like Claude
4. No need for network configuration or ports

## Environment Setup

The MCP server uses the same environment variables as the main Scurry app:

```bash
APP_QB_URL          # qBittorrent Web UI URL
APP_QB_USERNAME     # qBittorrent username
APP_QB_PASSWORD     # qBittorrent password
APP_QB_CATEGORY     # Default download category (optional)
```

Plus it reads the MAM token from `secrets/mam_api_token`.

## Testing the Implementation

### Manual Testing

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables:
   ```bash
   export APP_QB_URL="http://localhost:8080"
   export APP_QB_USERNAME="admin"
   export APP_QB_PASSWORD="password"
   ```

3. Test the server:
   ```bash
   npm run mcp
   ```

### Integration Testing with Claude Desktop

1. Configure Claude Desktop (see MCP_SETUP.md)
2. Restart Claude
3. Try a conversation:
   - "Search for books by Isaac Asimov"
   - "Download the Foundation series"

## Future Enhancements

Potential improvements for future versions:

1. **Additional Tools:**
   - `get_download_status` - Check status of downloads in qBittorrent
   - `list_categories` - List available qBittorrent categories
   - `recent_searches` - Show recent search queries

2. **Resources:**
   - Expose book metadata as MCP resources
   - Allow AI to read download history

3. **Prompts:**
   - Pre-configured prompts for common workflows
   - Book recommendation prompts based on MAM data

4. **Error Handling:**
   - More detailed error messages
   - Retry logic for transient failures
   - Rate limiting for MAM API

5. **Testing:**
   - Unit tests for MCP tools
   - Integration tests with mock MCP client
   - E2E tests with actual Claude Desktop

## Security Considerations

### Current Implementation

- MCP server reads credentials from environment variables
- MAM token stored in file system
- No authentication on the MCP server itself (relies on Claude Desktop's security)

### Best Practices

1. **Don't commit secrets:**
   - `.env` is gitignored
   - `secrets/` directory should be gitignored
   - Claude Desktop config contains credentials (keep secure)

2. **File permissions:**
   - Ensure `secrets/mam_api_token` has restricted permissions (600)
   - Keep Claude Desktop config readable only by your user

3. **Network security:**
   - MCP server uses stdio (no network exposure)
   - qBittorrent API should be localhost or secured with firewall rules

## Compatibility

### Tested With
- Node.js 18+
- Claude Desktop (latest version)
- @modelcontextprotocol/sdk ^0.5.0

### Should Work With
- Any MCP-compatible client
- Future ChatGPT MCP integration
- Custom MCP client implementations

## Resources

- [MCP Official Docs](https://modelcontextprotocol.io/)
- [Anthropic MCP GitHub](https://github.com/anthropics/anthropic-quickstarts)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)

## Questions or Issues?

1. Check `MCP_SETUP.md` for troubleshooting
2. Review Claude Desktop logs
3. Test environment variables are set correctly
4. Ensure MAM token is valid and not expired
5. Verify qBittorrent is accessible

## Conclusion

The MCP server integration adds powerful conversational AI capabilities to Scurry while maintaining the existing web application architecture. Users can now search and download books through natural language conversations with Claude or other AI assistants.
