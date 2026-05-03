/**
 * GCP Billing Tools
 * 
 * Tools for interacting with Google Cloud Billing API.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getProjectId } from "../services/gcp-client.js";
import { GoogleAuth } from "google-auth-library";
import {
  GetBillingInfoInputSchema,
  ListBillingAccountsInputSchema,
  ResponseFormat
} from "../schemas/index.js";

/**
 * Register all Billing tools with the MCP server
 */
export function registerBillingTools(server: McpServer): void {
  
  // ========================================
  // Tool: gcp_billing_get_info
  // ========================================
  server.registerTool(
    "gcp_billing_get_info",
    {
      title: "Get Project Billing Info",
      description: "Gets billing information for a GCP project, including whether billing is enabled and the associated billing account.",
      inputSchema: GetBillingInfoInputSchema,
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
        const url = `https://cloudbilling.googleapis.com/v1/projects/${projectId}/billingInfo`;
        
        const response = await client.request({ url });
        const result = response.data as any;

        if (params.responseFormat === ResponseFormat.JSON) {
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        }

        let text = `# Billing Info for Project: ${projectId}\n\n`;
        text += `- **Billing Enabled**: ${result.billingEnabled ? "Yes" : "No"}\n`;
        text += `- **Billing Account**: ${result.billingAccountName || "None"}\n`;

        return {
          content: [{ type: "text", text: text }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error getting billing info: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // ========================================
  // Tool: gcp_billing_list_accounts
  // ========================================
  server.registerTool(
    "gcp_billing_list_accounts",
    {
      title: "List Billing Accounts",
      description: "Lists all billing accounts that the user has access to.",
      inputSchema: ListBillingAccountsInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params) => {
      try {
        const auth = new GoogleAuth({
          scopes: "https://www.googleapis.com/auth/cloud-platform"
        });
        const client = await auth.getClient();
        const url = "https://cloudbilling.googleapis.com/v1/billingAccounts";
        
        const response = await client.request({ url });
        const result = response.data;

        if (params.responseFormat === ResponseFormat.JSON) {
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        }

        const accounts = (result as any).billingAccounts || [];
        let text = "# GCP Billing Accounts\n\n";
        
        if (accounts.length === 0) {
          text += "_No billing accounts found._";
        } else {
          for (const account of accounts) {
            text += `## ${account.displayName}\n`;
            text += `- **ID**: ${account.name}\n`;
            text += `- **Open**: ${account.open ? "Yes" : "No"}\n\n`;
          }
        }

        return {
          content: [{ type: "text", text: text }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error listing billing accounts: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
}
