#!/usr/bin/env node

/**
 * MCP Server for Scurry
 * 
 * This server exposes Scurry's book search and download functionality
 * to AI assistants via the Model Context Protocol (MCP).
 * 
 * It provides two main tools:
 * 1. search_books - Search MyAnonamouse for books/audiobooks
 * 2. download_book - Add a book torrent to qBittorrent
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Import core utility functions (shared with Next.js app)
import { readMamToken, config } from "./src/lib/config-core.js";
import { 
  buildPayload, 
  buildMamDownloadUrl, 
  buildMamTorrentUrl, 
  formatNumberWithCommas, 
  parseAuthorInfo 
} from "./src/lib/utilities.js";
import { MAM_BASE, MAM_CATEGORIES } from "./src/lib/constants.js";
import { qbLogin, qbAddUrl } from "./src/lib/qbittorrent-core.js";

// Create MCP server instance
const server = new Server(
  {
    name: "scurry-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

/**
 * Search for books on MyAnonamouse
 */
async function searchBooks(query, category = "books") {
  const categoryId = category === "audiobooks" 
    ? MAM_CATEGORIES.AUDIOBOOKS 
    : MAM_CATEGORIES.BOOKS;

  const token = readMamToken(false); // Don't throw on error, return null instead
  
  if (!token) {
    throw new Error("MAM token not found. Please configure your MAM token first.");
  }

  const res = await fetch(`${MAM_BASE}/tor/js/loadSearchJSONbasic.php`, {
    method: "POST",
    headers: {
      "Accept": "application/json, text/plain, */*",
      "Content-Type": "application/json",
      "Cookie": `mam_id=${token}`,
      "Origin": "https://www.myanonamouse.net",
      "Referer": "https://www.myanonamouse.net/"
    },
    body: JSON.stringify(buildPayload(query, categoryId)),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 403 && text.toLowerCase().includes("you are not signed in")) {
      throw new Error("MAM token has expired or is invalid. Please update your token.");
    }
    throw new Error(`Search failed: ${res.status} ${text.slice(0, 200)}`);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid response from MAM. Token may be expired.");
  }

  if (data.error) {
    return [];
  }

  // Map results to simpler format
  const results = data.data.map(item => ({
    id: item.id ?? null,
    title: item.title ?? "",
    size: item.size ?? "",
    filetypes: item.filetype ?? "",
    addedDate: item.added ?? "",
    vip: Boolean(item.vip == 1),
    snatched: Boolean(item.my_snatched == 1),
    author: parseAuthorInfo(item.author_info),
    seeders: formatNumberWithCommas(item.seeders ?? 0),
    leechers: formatNumberWithCommas(item.leechers ?? 0),
    downloads: formatNumberWithCommas(item.times_completed ?? 0),
    downloadUrl: buildMamDownloadUrl(item.dl ?? ""),
    torrentUrl: buildMamTorrentUrl((item.id ?? ""))
  }));

  return results;
}

/**
 * Download a book by adding it to qBittorrent
 */
async function downloadBook(title, downloadUrl, category) {
  if (!downloadUrl) {
    throw new Error("No download URL provided");
  }

  const qbCategory = category || config.qbCategory;
  
  try {
    const cookie = await qbLogin(config.qbUrl, config.qbUser, config.qbPass);
    await qbAddUrl(config.qbUrl, cookie, downloadUrl, qbCategory);
    return {
      success: true,
      message: `Successfully added "${title}" to qBittorrent in category "${qbCategory}"`
    };
  } catch (err) {
    throw new Error(`Failed to add to qBittorrent: ${err?.message || err}`);
  }
}

// Handle list resources request
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "scurry://config",
        name: "Scurry Configuration",
        description: "Current configuration including available categories and qBittorrent settings",
        mimeType: "application/json",
      },
      {
        uri: "scurry://categories",
        name: "Available Categories",
        description: "List of available search categories (books, audiobooks)",
        mimeType: "application/json",
      },
    ],
  };
});

// Handle read resource request
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  if (uri === "scurry://config") {
    const configData = {
      qbittorrent: {
        url: config.qbUrl,
        defaultCategory: config.qbCategory,
      },
      mam: {
        tokenConfigured: !!readMamToken(false),
      },
      categories: {
        books: MAM_CATEGORIES.BOOKS,
        audiobooks: MAM_CATEGORIES.AUDIOBOOKS,
      },
    };

    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(configData, null, 2),
        },
      ],
    };
  }

  if (uri === "scurry://categories") {
    const categories = [
      {
        name: "books",
        id: MAM_CATEGORIES.BOOKS,
        description: "eBooks in various formats (EPUB, PDF, MOBI, etc.)",
      },
      {
        name: "audiobooks",
        id: MAM_CATEGORIES.AUDIOBOOKS,
        description: "Audiobooks in various formats (MP3, M4B, etc.)",
      },
    ];

    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(categories, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_books",
        description: 
          "Search for books or audiobooks on MyAnonamouse. Returns a list of results with details like title, author, size, seeders, and download URLs. " +
          "Use this when the user wants to find books. Results are limited to top matches.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query (book title, author name, series, etc.)",
            },
            category: {
              type: "string",
              enum: ["books", "audiobooks"],
              description: "Category to search in. Default is 'books'.",
              default: "books"
            },
          },
          required: ["query"],
        },
      },
      {
        name: "download_book",
        description: 
          "Download a book by adding it to qBittorrent. Use this after searching to actually download a book. " +
          "You must provide the downloadUrl from a search result.",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "The title of the book (for logging purposes)",
            },
            downloadUrl: {
              type: "string",
              description: "The download URL from the search results (required)",
            },
            category: {
              type: "string",
              description: "Optional qBittorrent category. Defaults to configured category.",
            },
          },
          required: ["title", "downloadUrl"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "search_books") {
      const { query, category = "books" } = args;
      
      if (!query || typeof query !== "string") {
        throw new Error("Query parameter is required and must be a string");
      }

      const results = await searchBooks(query, category);
      
      // Format results for better readability
      const formattedResults = results.map((r, idx) => 
        `${idx + 1}. **${r.title}**\n` +
        `   Author: ${r.author}\n` +
        `   Size: ${r.size}\n` +
        `   Seeders: ${r.seeders} | Leechers: ${r.leechers}\n` +
        `   File types: ${r.filetypes}\n` +
        `   Download URL: ${r.downloadUrl}\n` +
        `   Already downloaded: ${r.snatched ? "Yes" : "No"}`
      ).join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: results.length > 0 
              ? `Found ${results.length} results for "${query}":\n\n${formattedResults}\n\nTo download any of these, use the download_book tool with the title and downloadUrl.`
              : `No results found for "${query}". Try a different search term or check if you're searching in the right category (books vs audiobooks).`
          }
        ],
      };
    }

    if (name === "download_book") {
      const { title, downloadUrl, category } = args;
      
      if (!title || typeof title !== "string") {
        throw new Error("Title parameter is required and must be a string");
      }
      
      if (!downloadUrl || typeof downloadUrl !== "string") {
        throw new Error("downloadUrl parameter is required and must be a string");
      }

      const result = await downloadBook(title, downloadUrl, category);
      
      return {
        content: [
          {
            type: "text",
            text: result.message
          }
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`
        }
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Scurry MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
