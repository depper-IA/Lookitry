/**
 * GCP Generic API Request Tool
 * 
 * Provides a generic tool for making arbitrary REST calls to any Google Cloud API.
 * Uses google-auth-library to obtain access tokens and fetch the requested URL.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GoogleAuth } from "google-auth-library";
import { z } from "zod";
import { CHARACTER_LIMIT } from "../constants.js";

// Schema for the generic API request tool
export const GcpApiRequestInputSchema = z.object({
  url: z.string().describe("Full URL of the Google Cloud API endpoint (e.g., https://cloudbilling.googleapis.com/v1/billingAccounts)"),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("GET").describe("HTTP method to use"),
  body: z.record(z.unknown()).optional().describe("Request body as a JSON object (only for POST, PUT, PATCH methods)"),
  headers: z.record(z.string()).optional().describe("Additional HTTP headers to include"),
  customToken: z.string().optional().describe("Custom OAuth2 access token to use instead of generating one with google-auth-library. Useful for passing pre-generated tokens like 'ya29....' directly.")
});

export type GcpApiRequestInput = z.infer<typeof GcpApiRequestInputSchema>;

/**
 * Register the generic GCP API request tool with the MCP server
 */
export function registerGenericTools(server: McpServer): void {

  // ========================================
  // Tool: gcp_api_request
  // ========================================
  server.registerTool(
    "gcp_api_request",
    {
      title: "Generic GCP API Request",
      description: `Makes an arbitrary REST API call to any Google Cloud Platform API.

This tool provides generic access to ALL Google Cloud APIs by handling authentication
automatically. Use this when you need to access GCP services that don't have a dedicated
tool (e.g., Cloud Billing, Secret Manager, Resource Manager, Pub/Sub, etc.).

Authentication is handled automatically using:
- Service account key file (./service-account.json or GOOGLE_APPLICATION_CREDENTIALS)
- Application Default Credentials (gcloud auth application-default login)

The tool automatically:
1. Obtains an OAuth2 access token using google-auth-library
2. Makes the HTTP request with the Authorization header set
3. Returns the JSON response from the API

Args:
  - url (string): Full URL of the Google Cloud API endpoint.
    Examples:
    - https://cloudbilling.googleapis.com/v1/billingAccounts
    - https://compute.googleapis.com/compute/v1/projects/my-project/instances
    - https://secretmanager.googleapis.com/v1/projects/my-project/secrets
    - https://resourcemanager.googleapis.com/v1/organizations
  - method (string): HTTP method. One of: GET, POST, PUT, PATCH, DELETE. Default: GET.
  - body (object, optional): JSON request body for POST, PUT, PATCH methods.
  - headers (object, optional): Additional HTTP headers to include in the request.

Returns:
  The JSON response from the Google Cloud API, or an error message if the request failed.

Examples:
  - List all billing accounts: url="https://cloudbilling.googleapis.com/v1/billingAccounts"
  - Get project info: url="https://cloudresourcemanager.googleapis.com/v1/projects/my-project"
  - List secrets: url="https://secretmanager.googleapis.com/v1/projects/my-project/secrets"
  - Create a secret: url="https://secretmanager.googleapis.com/v1/projects/my-project/secrets?secretId=my-secret", method="POST", body={"secret": {"replication": {"automatic": {}}}
  - Delete an instance: url="https://compute.googleapis.com/compute/v1/projects/my-project/zones/us-central1-a/instances/my-instance", method="DELETE"

Note:
  This tool can access any GCP API. Use with caution as some operations may be
  destructive or incur costs (e.g., starting/stopping VMs, deleting resources).`,
      inputSchema: GcpApiRequestInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (params: GcpApiRequestInput) => {
      try {
        let accessToken: string;

        // Use custom token if provided, otherwise generate one with google-auth-library
        if (params.customToken) {
          accessToken = params.customToken;
        } else {
          // Create GoogleAuth instance - automatically picks up credentials from:
          // 1. GOOGLE_APPLICATION_CREDENTIALS env var
          // 2. ./service-account.json file
          // 3. Application Default Credentials (gcloud)
          const auth = new GoogleAuth({
            scopes: "https://www.googleapis.com/auth/cloud-platform"
          });

          // Get the access token
          const client = await auth.getClient();
          if (!client) {
            return {
              content: [{
                type: "text",
                text: "Error: Could not get Google Auth client. Ensure credentials are configured."
              }]
            };
          }

          const tokenResponse = await client.getAccessToken();
          if (!tokenResponse) {
            return {
              content: [{
                type: "text",
                text: "Error: Could not obtain access token. Check GCP credentials."
              }]
            };
          }

          const token = typeof tokenResponse === "string" ? tokenResponse : tokenResponse.token;
          if (!token) {
            return {
              content: [{
                type: "text",
                text: "Error: Access token is null. Check GCP credentials."
              }]
            };
          }
          accessToken = token;
        }

        // Build fetch options
        const fetchOptions: RequestInit = {
          method: params.method,
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            ...params.headers
          }
        };

        // Add body for methods that support it
        if (params.body && ["POST", "PUT", "PATCH"].includes(params.method)) {
          fetchOptions.body = JSON.stringify(params.body);
        }

        // Make the request
        const response = await fetch(params.url, fetchOptions);

        // Get response text first (might not be JSON)
        const responseText = await response.text();

        // Try to parse as JSON
        let result: unknown;
        let isJson = true;
        try {
          result = JSON.parse(responseText);
        } catch {
          isJson = false;
          result = responseText;
        }

        // Check for API errors
        if (!response.ok) {
          const errorOutput = {
            error: true,
            status: response.status,
            statusText: response.statusText,
            url: params.url,
            method: params.method,
            response: result
          };
          return {
            content: [{
              type: "text",
              text: JSON.stringify(errorOutput, null, 2)
            }]
          };
        }

        // Format output
        let output: string;
        if (isJson) {
          output = JSON.stringify(result, null, 2);
        } else {
          output = String(result);
        }

        // Check character limit for text responses
        if (output.length > CHARACTER_LIMIT) {
          output = output.substring(0, CHARACTER_LIMIT) + 
            `\n\n_[Output truncated at ${CHARACTER_LIMIT} characters]_`;
        }

        return {
          content: [{ type: "text", text: output }]
        };

      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error making GCP API request: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
}
