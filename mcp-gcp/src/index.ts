/**
 * GCP MCP Server
 * 
 * Model Context Protocol server for Google Cloud Platform integration.
 * Provides tools for interacting with GCS (Google Cloud Storage) and 
 * Compute Engine (VMs, zones, etc.)
 * 
 * Authentication:
 * - Option 1: Service account key file at ./service-account.json
 * - Option 2: GOOGLE_APPLICATION_CREDENTIALS env var pointing to key file
 * - Option 3: Application Default Credentials (run: gcloud auth application-default login)
 * 
 * Required env vars:
 * - GCP_PROJECT_ID: Your GCP project ID
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerStorageTools } from "./tools/storage.js";
import { registerComputeTools } from "./tools/compute.js";
import { registerGenericTools } from "./tools/generic.js";
import { registerBillingTools } from "./tools/billing.js";
import { registerNotificationTools } from "./tools/notification.js";
import { registerAiTools } from "./tools/ai.js";
import { validateGcpAuth, cleanupClients } from "./services/gcp-client.js";

/**
 * Create and configure the MCP server
 */
function createServer(): McpServer {
  const server = new McpServer({
    name: "gcp-mcp-server",
    version: "1.2.0"
  });

  // Register all tool categories
  registerStorageTools(server);
  registerComputeTools(server);
  registerGenericTools(server);
  registerBillingTools(server);
  registerNotificationTools(server);
  registerAiTools(server);

  return server;
}

/**
 * Main entry point - runs via stdio transport
 */
async function main(): Promise<void> {
  console.error("Starting GCP MCP Server...");
  console.error("Authenticating with Google Cloud Platform...");

  try {
    // Validate GCP authentication on startup
    await validateGcpAuth();
    console.error("GCP authentication successful.");
  } catch (error) {
    console.error("Authentication failed:", error instanceof Error ? error.message : String(error));
    console.error("\nTo fix this:");
    console.error("1. Create a service account and download the key JSON file");
    console.error("2. Either:");
    console.error("   a) Place the JSON file as ./service-account.json in this directory, OR");
    console.error("   b) Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json");
    console.error("   c) Run: gcloud auth application-default login");
    console.error("\nAlso ensure GCP_PROJECT_ID is set to your project ID.");
    process.exit(1);
  }

  const server = createServer();
  const transport = new StdioServerTransport();

  // Handle graceful shutdown
  const shutdown = () => {
    console.error("Shutting down GCP MCP Server...");
    cleanupClients();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  try {
    await server.connect(transport);
    console.error("GCP MCP Server running via stdio");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();
