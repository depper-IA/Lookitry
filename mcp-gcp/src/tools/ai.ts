/**
 * GCP AI Platform Tools
 * 
 * Tools for interacting with Vertex AI and Generative AI.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getProjectId } from "../services/gcp-client.js";
import { GoogleAuth } from "google-auth-library";
import {
  ListReasoningEnginesInputSchema,
  DeleteReasoningEngineInputSchema,
  ResponseFormat
} from "../schemas/index.js";

/**
 * Register all AI tools with the MCP server
 */
export function registerAiTools(server: McpServer): void {
  
  // ========================================
  // Tool: gcp_ai_list_reasoning_engines
  // ========================================
  server.registerTool(
    "gcp_ai_list_reasoning_engines",
    {
      title: "List Reasoning Engines",
      description: "Lists Vertex AI Reasoning Engines (Agents) in a specific region.",
      inputSchema: ListReasoningEnginesInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params) => {
      try {
        const projectId = getProjectId(params.projectId);
        const auth = new GoogleAuth({
          scopes: "https://www.googleapis.com/auth/cloud-platform"
        });
        const client = await auth.getClient();
        const url = `https://${params.region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${params.region}/reasoningEngines`;
        
        const response = await client.request({ url });
        const result = response.data as any;

        if (params.responseFormat === ResponseFormat.JSON) {
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        }

        const engines = result.reasoningEngines || [];
        let text = `# Vertex AI Reasoning Engines in ${params.region}\n\n`;
        
        if (engines.length === 0) {
          text += "_No reasoning engines found in this region._";
        } else {
          for (const engine of engines) {
            const engineId = engine.name.split('/').pop();
            text += `## ${engine.displayName || "Unnamed Agent"}\n`;
            text += `- **ID**: ${engineId}\n`;
            text += `- **Full Name**: ${engine.name}\n`;
            text += `- **Created**: ${new Date(engine.createTime).toLocaleString()}\n`;
            text += `- **Updated**: ${new Date(engine.updateTime).toLocaleString()}\n\n`;
          }
        }

        return {
          content: [{ type: "text", text: text }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error listing reasoning engines: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // ========================================
  // Tool: gcp_ai_delete_reasoning_engine
  // ========================================
  server.registerTool(
    "gcp_ai_delete_reasoning_engine",
    {
      title: "Delete Reasoning Engine",
      description: "Deletes a Vertex AI Reasoning Engine (Agent) by ID.",
      inputSchema: DeleteReasoningEngineInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (params) => {
      try {
        const projectId = getProjectId(params.projectId);
        const auth = new GoogleAuth({
          scopes: "https://www.googleapis.com/auth/cloud-platform"
        });
        const client = await auth.getClient();
        const url = `https://${params.region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${params.region}/reasoningEngines/${params.engineId}`;
        
        await client.request({ url, method: "DELETE" });

        return {
          content: [{ type: "text", text: `Reasoning Engine ${params.engineId} deleted successfully from ${params.region}.` }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error deleting reasoning engine: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
}
