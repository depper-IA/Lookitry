# GCP MCP Server

Model Context Protocol server for Google Cloud Platform integration. Provides tools for interacting with Google Cloud Storage (GCS) and Compute Engine.

## Features

- **Google Cloud Storage (GCS)**:
  - List buckets
  - List bucket contents (objects)
  - Get bucket metadata

- **Compute Engine**:
  - List VM instances
  - Get instance details
  - List available zones

## Prerequisites

- Node.js >= 18
- A GCP project with appropriate API access
- GCP authentication configured (see below)

## Installation

```bash
pnpm install
npm run build
```

## Authentication

The server supports three authentication methods:

### Option 1: Service Account Key File (Recommended)

1. Create a service account in GCP Console or via CLI:
   ```bash
   gcloud iam service-accounts create my-mcp-account --display-name="MCP Server"
   ```

2. Grant necessary roles:
   ```bash
   # For GCS access
   gcloud projects add-iam-policy-binding PROJECT_ID \
     --member="serviceAccount:my-mcp-account@PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/storage.objectViewer"
   
   # For Compute Engine access
   gcloud projects add-iam-policy-binding PROJECT_ID \
     --member="serviceAccount:my-mcp-account@PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/compute.viewer"
   ```

3. Download the key JSON file:
   ```bash
   gcloud iam service-accounts keys create service-account.json \
     --iam-account=my-mcp-account@PROJECT_ID.iam.gserviceaccount.com
   ```

4. Place `service-account.json` in the project root directory

### Option 2: Environment Variable

Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to your key file:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### Option 3: Application Default Credentials

If running on a machine with Google Cloud SDK installed:

```bash
gcloud auth application-default login
```

## Configuration

Set your GCP project ID:

```bash
export GCP_PROJECT_ID=your-project-id
```

## Usage

### Running the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### Available Tools

#### GCS Tools

| Tool | Description |
|------|-------------|
| `gcp_storage_list_buckets` | List all buckets in a project |
| `gcp_storage_list_bucket_contents` | List objects in a bucket |
| `gcp_storage_get_bucket_metadata` | Get detailed metadata for a bucket |

#### Compute Engine Tools

| Tool | Description |
|------|-------------|
| `gcp_compute_list_instances` | List VM instances in a zone |
| `gcp_compute_get_instance` | Get details of a specific instance |
| `gcp_compute_list_zones` | List available zones |

## Adding More GCP Tools

To add new tools (e.g., for BigQuery, Pub/Sub, Cloud SQL):

### 1. Create a new tools file

Create `src/tools/{service}.ts`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getProjectId } from "../services/gcp-client.js";

// Import the appropriate GCP SDK client
// import { BigQuery } from "@google-cloud/bigquery";

export function register{Service}Tools(server: McpServer): void {
  
  server.registerTool(
    "gcp_{service}_{action}",
    {
      title: "GCP {Service} {Action}",
      description: "Description of what the tool does...",
      inputSchema: z.object({
        // Define your input schema
        projectId: z.string().optional(),
        responseFormat: z.enum(["markdown", "json"]).default("markdown")
      }),
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
        
        // Your implementation here
        
        return {
          content: [{ type: "text", text: "result" }],
          structuredContent: { /* structured data */ }
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
}
```

### 2. Register the tools in index.ts

```typescript
import { register{Service}Tools } from "./tools/{service}.js";

// In createServer():
register{Service}Tools(server);
```

### 3. Add the SDK dependency

```bash
pnpm install @google-cloud/{service}
```

## GCP SDK Reference

| Service | Package | Documentation |
|---------|---------|---------------|
| Cloud Storage | `@google-cloud/storage` | [Link](https://cloud.google.com/nodejs/docs/reference/storage/latest) |
| Compute Engine | `@google-cloud/compute` | [Link](https://cloud.google.com/nodejs/docs/reference/compute/latest) |
| BigQuery | `@google-cloud/bigquery` | [Link](https://cloud.google.com/nodejs/docs/reference/bigquery/latest) |
| Pub/Sub | `@google-cloud/pubsub` | [Link](https://cloud.google.com/nodejs/docs/reference/pubsub/latest) |
| Cloud SQL | `@google-cloud/sql` | [Link](https://cloud.google.com/nodejs/docs/reference/sql/latest) |
| Kubernetes Engine | `@google-cloud/container` | [Link](https://cloud.google.com/nodejs/docs/reference/container/latest) |
| Cloud Functions | `@google-cloud/functions` | [Link](https://cloud.google.com/nodejs/docs/reference/functions/latest) |
| Cloud Run | `@google-cloud/run` | [Link](https://cloud.google.com/nodejs/docs/reference/run/latest) |

## Project Structure

```
mcp-gcp/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts           # Main entry point
    ├── constants.ts       # Shared constants
    ├── types.ts           # TypeScript interfaces
    ├── schemas/
    │   └── index.ts       # Zod validation schemas
    ├── services/
    │   └── gcp-client.ts # GCP client initialization
    └── tools/
        ├── storage.ts     # GCS tools
        └── compute.ts    # Compute Engine tools
```

## MCP SDK Resources

- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Protocol Specification](https://modelcontextprotocol.io)

## License

MIT
