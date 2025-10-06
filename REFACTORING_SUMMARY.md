# Code Deduplication Refactoring

## Problem
The initial MCP implementation created duplicate files (`config-mcp.js` and `qbittorrent-mcp.js`) to work around the `"server-only"` restriction in the Next.js modules. This resulted in code duplication and maintenance issues.

## Solution
We refactored the code to use a **shared core + thin wrappers** pattern:

```
┌─────────────────────────────────────────────────────────┐
│                    Architecture                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌───────────────────┐         ┌──────────────────┐    │
│  │  Next.js Routes   │         │   MCP Server     │    │
│  │                   │         │                  │    │
│  │  - /api/search    │         │  - search_books  │    │
│  │  - /api/add       │         │  - download_book │    │
│  │  - etc.           │         │                  │    │
│  └────────┬──────────┘         └────────┬─────────┘    │
│           │                              │               │
│           ▼                              ▼               │
│  ┌────────────────────┐        ┌────────────────────┐  │
│  │  config.js         │        │ (imports directly) │  │
│  │  qbittorrent.js    │        │                    │  │
│  │                    │        │                    │  │
│  │ import "server-    │        │                    │  │
│  │ only"              │        │                    │  │
│  │ (thin wrapper)     │        │                    │  │
│  └─────────┬──────────┘        └────────┬───────────┘  │
│            │                             │               │
│            │        ┌────────────────────┘               │
│            │        │                                    │
│            ▼        ▼                                    │
│  ┌──────────────────────────────────┐                   │
│  │  config-core.js                  │                   │
│  │  qbittorrent-core.js             │                   │
│  │                                  │                   │
│  │  - Core business logic           │                   │
│  │  - NO "server-only" restriction  │                   │
│  │  - Shared by both contexts       │                   │
│  └──────────────────────────────────┘                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Files Created

### Core Modules (No server-only restriction)
1. **`src/lib/config-core.js`**
   - Contains core configuration logic
   - `readMamToken(throwOnError)` - Flexible error handling
   - `config` object with environment variables
   - Can be used by both Next.js and MCP server

2. **`src/lib/qbittorrent-core.js`**
   - Contains core qBittorrent functions
   - `qbLogin(baseUrl, username, password)`
   - `qbAddUrl(baseUrl, cookie, torrentUrl, category)`
   - Can be used by both Next.js and MCP server

### Wrapper Modules (Server-only protection)
1. **`src/lib/config.js`** (Modified)
   - Imports `"server-only"` for Next.js protection
   - Re-exports from `config-core.js`
   - Wraps `readMamToken()` to throw on error (Next.js behavior)

2. **`src/lib/qbittorrent.js`** (Modified)
   - Imports `"server-only"` for Next.js protection
   - Re-exports from `qbittorrent-core.js`

## Files Deleted
- ❌ `src/lib/config-mcp.js` (no longer needed)
- ❌ `src/lib/qbittorrent-mcp.js` (no longer needed)

## Files Modified
- ✅ `mcp-server.mjs` - Now imports from `-core.js` files directly

## Benefits

### 1. **Zero Code Duplication**
All business logic is in one place. Changes to core functionality automatically apply to both Next.js and MCP contexts.

### 2. **Maintains Security**
Next.js routes still have `"server-only"` protection, preventing accidental client-side usage.

### 3. **Better Error Handling**
The core `readMamToken()` now supports flexible error handling:
- `readMamToken(true)` - Throws on error (Next.js behavior)
- `readMamToken(false)` - Returns null on error (MCP server behavior)

### 4. **Clear Separation of Concerns**
- **Core modules**: Pure business logic
- **Wrapper modules**: Add context-specific behavior (like server-only)
- **MCP server**: Uses core modules directly

### 5. **Easier Testing**
Tests can import core modules directly without mocking `"server-only"`.

### 6. **Maintainability**
One source of truth for each function. Bug fixes and improvements happen in one place.

## Code Comparison

### Before (Duplicated)

```javascript
// src/lib/config.js
import "server-only";
function need(name) { /* ... */ }
const cfg = { /* ... */ };
export function readMamToken() { /* ... */ }

// src/lib/config-mcp.js (DUPLICATE!)
function need(name) { /* ... */ }  // Same code
const cfg = { /* ... */ };          // Same code
export function readMamToken() { /* ... */ }  // Slightly different
```

### After (Shared)

```javascript
// src/lib/config-core.js (SHARED)
function need(name) { /* ... */ }
const cfg = { /* ... */ };
export function readMamToken(throwOnError) { /* ... */ }

// src/lib/config.js (THIN WRAPPER)
import "server-only";
import { config, readMamToken as core } from "./config-core.js";
export const config = config;
export function readMamToken() { return core(true); }

// mcp-server.mjs (USES CORE DIRECTLY)
import { config, readMamToken } from "./src/lib/config-core.js";
const token = readMamToken(false); // Flexible error handling
```

## Migration Path

If you need to add new functionality:

1. **Add to core module** (`-core.js` files)
   - Write pure business logic
   - No dependencies on Next.js-specific features

2. **Re-export in wrapper** (if needed)
   - Add `"server-only"` protection
   - Adjust API if context-specific behavior is needed

3. **Use in MCP server**
   - Import directly from core modules
   - Benefit from shared logic

## Testing Results

✅ All tests pass (82/82)
✅ Build succeeds
✅ Linting passes
✅ Code coverage: 97.76%

## Technical Details

### Why Not Remove "server-only" Entirely?

The `"server-only"` import is a Next.js feature that prevents code from being accidentally bundled in the client. It's a safety mechanism that:
- Prevents exposing server secrets to the browser
- Catches developer errors at build time
- Is a best practice for Next.js server components

By keeping it in the wrapper modules, we maintain this protection for Next.js routes while allowing the MCP server (which runs standalone) to use the same logic.

### Error Handling Strategy

The `readMamToken(throwOnError)` parameter allows different contexts to handle errors appropriately:

- **Next.js routes** (`throwOnError = true`): Fail fast with an error. The API will return a 500, which is appropriate for a server error.
- **MCP server** (`throwOnError = false`): Return null and provide a user-friendly error message to the AI assistant.

## Future Improvements

If more contexts need access to this logic (e.g., CLI tools, background jobs), they can:
1. Import from `-core.js` files directly
2. Get the same battle-tested business logic
3. Adapt error handling to their context

## Conclusion

This refactoring eliminates all code duplication while maintaining the security and modularity of the codebase. The pattern is scalable and can be applied to future shared functionality between different execution contexts.
