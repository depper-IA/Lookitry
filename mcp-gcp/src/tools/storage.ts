/**
 * GCP Storage Tools
 * 
 * Tools for interacting with Google Cloud Storage (GCS).
 * These tools allow listing buckets, viewing bucket contents, and getting bucket metadata.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getStorageClient, getProjectId } from "../services/gcp-client.js";
import {
  ListBucketsInputSchema,
  CreateBucketInputSchema,
  ListBucketContentsInputSchema,
  GetBucketMetadataInputSchema,
  ResponseFormat
} from "../schemas/index.js";
import type { Bucket, BucketObject } from "../types.js";
import { CHARACTER_LIMIT } from "../constants.js";

/**
 * Register all GCS tools with the MCP server
 */
export function registerStorageTools(server: McpServer): void {
  
  // ========================================
  // Tool: gcp_storage_create_bucket
  // ========================================
  server.registerTool(
    "gcp_storage_create_bucket",
    {
      title: "Create GCS Bucket",
      description: `Creates a new Google Cloud Storage bucket in a GCP project.
      
Args:
  - bucketName (string): Name of the bucket to create.
  - location (string, optional): Location (e.g., US, EU). Default: US.
  - storageClass (string, optional): Storage class. Default: STANDARD.
  - projectId (string, optional): GCP project ID.`,
      inputSchema: CreateBucketInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (params) => {
      try {
        const projectId = getProjectId(params.projectId);
        const storage = getStorageClient();
        
        const [bucket] = await storage.createBucket(params.bucketName, {
          location: params.location,
          storageClass: params.storageClass,
          project: projectId
        });

        const output = {
          success: true,
          name: bucket.name,
          location: bucket.metadata.location,
          storageClass: bucket.metadata.storageClass
        };

        if (params.responseFormat === ResponseFormat.JSON) {
          return {
            content: [{ type: "text", text: JSON.stringify(output, null, 2) }]
          };
        }

        return {
          content: [{ type: "text", text: `Bucket ${bucket.name} created successfully in ${bucket.metadata.location} with class ${bucket.metadata.storageClass}.` }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error creating bucket: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // ========================================
  // Tool: gcp_storage_list_buckets
  // ========================================
  server.registerTool(
    "gcp_storage_list_buckets",
    {
      title: "List GCS Buckets",
      description: `Lists all Google Cloud Storage buckets in a GCP project.

This tool retrieves all buckets associated with a project, optionally filtered by prefix.

Args:
  - projectId (string, optional): GCP project ID. Defaults to GCP_PROJECT_ID env var.
  - prefix (string, optional): Filter buckets by name prefix.
  - response_format ('markdown' | 'json'): Output format. 'markdown' for human-readable, 'json' for machine-readable. Default: 'markdown'.

Returns:
  For markdown format: A formatted list of buckets with names, locations, and creation dates.
  For JSON format: Structured data with schema:
  {
    "total": number,
    "buckets": [
      {
        "name": string,
        "id": string,
        "location": string,
        "storageClass": string,
        "created": string,
        "updated": string
      }
    ]
  }

Examples:
  - Use when: "List all buckets in my GCP project" -> params with projectId="my-project"
  - Use when: "Find buckets starting with 'data-'" -> params with prefix="data-"
  - Don't use when: You need to list objects inside a bucket (use gcp_storage_list_bucket_contents instead)`,
      inputSchema: ListBucketsInputSchema,
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
        const storage = getStorageClient();
        
        const [buckets] = await storage.getBuckets({
          project: projectId,
          prefix: params.prefix
        });

        const bucketList: Bucket[] = buckets.map((bucket) => {
          const metadata = bucket.metadata;
          return {
            name: bucket.name || "",
            id: metadata?.id || bucket.name || "",
            projectNumber: String(metadata?.projectNumber || ""),
            created: metadata?.timeCreated || "",
            updated: metadata?.updated || "",
            location: metadata?.location || "",
            locationType: metadata?.locationType || "",
            storageClass: metadata?.storageClass || "",
            versioning: metadata?.versioning?.enabled || false,
            website: metadata?.website as Bucket["website"],
            cors: metadata?.cors as Bucket["cors"]
          };
        });

        const output = {
          total: bucketList.length,
          projectId,
          buckets: bucketList.map(b => ({
            name: b.name,
            id: b.id,
            location: b.location,
            storageClass: b.storageClass,
            created: b.created,
            updated: b.updated
          }))
        };

        if (params.responseFormat === ResponseFormat.JSON) {
          return {
            content: [{ type: "text", text: JSON.stringify(output, null, 2) }]
          };
        }

        // Markdown format
        let textContent = `# GCS Buckets in Project: ${projectId}\n\n`;
        textContent += `Found ${bucketList.length} bucket(s)\n\n`;

        if (bucketList.length === 0) {
          textContent += "_No buckets found._";
        } else {
          for (const bucket of bucketList) {
            textContent += `## ${bucket.name}\n`;
            textContent += `- **ID**: ${bucket.id}\n`;
            textContent += `- **Location**: ${bucket.location} (${bucket.locationType})\n`;
            textContent += `- **Storage Class**: ${bucket.storageClass}\n`;
            textContent += `- **Created**: ${new Date(bucket.created).toLocaleString()}\n`;
            textContent += `- **Updated**: ${new Date(bucket.updated).toLocaleString()}\n\n`;
          }
        }

        // Check character limit
        if (textContent.length > CHARACTER_LIMIT) {
          textContent = textContent.substring(0, CHARACTER_LIMIT) + 
            `\n\n_[Output truncated at ${CHARACTER_LIMIT} characters]_`;
        }

        return {
          content: [{ type: "text", text: textContent }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error listing buckets: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // ========================================
  // Tool: gcp_storage_list_bucket_contents
  // ========================================
  server.registerTool(
    "gcp_storage_list_bucket_contents",
    {
      title: "List GCS Bucket Contents",
      description: `Lists objects within a specific Google Cloud Storage bucket.

This tool retrieves all objects (files) in a bucket, with optional prefix filtering and pagination.

Args:
  - bucket (string): Name of the GCS bucket to list.
  - prefix (string, optional): Filter objects by name prefix.
  - delimiter (string, optional): Delimiter to group objects (e.g., '/' for directory-style listing).
  - maxResults (number, optional): Maximum objects to return (1-1000). Default: 100.
  - pageToken (string, optional): Token for pagination (from previous response).
  - response_format ('markdown' | 'json'): Output format. Default: 'markdown'.

Returns:
  For markdown format: A formatted list of objects with names, sizes, and dates.
  For JSON format: Structured data with schema:
  {
    "bucket": string,
    "total": number,
    "items": [
      {
        "name": string,
        "id": string,
        "size": string,
        "contentType": string,
        "created": string,
        "updated": string,
        "storageClass": string
      }
    ],
    "nextPageToken": string | null,
    "hasMore": boolean
  }

Examples:
  - Use when: "List all files in my bucket" -> params with bucket="my-bucket"
  - Use when: "List images in a folder" -> params with bucket="my-bucket", prefix="images/"
  - Don't use when: You need bucket metadata (use gcp_storage_get_bucket_metadata instead)`,
      inputSchema: ListBucketContentsInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params) => {
      try {
        const storage = getStorageClient();
        const bucket = storage.bucket(params.bucket);
        
        const options: {
          prefix?: string;
          delimiter?: string;
          maxResults?: number;
          pageToken?: string;
        } = {
          maxResults: params.maxResults
        };
        
        if (params.prefix) options.prefix = params.prefix;
        if (params.delimiter) options.delimiter = params.delimiter;
        if (params.pageToken) options.pageToken = params.pageToken;

        const [files, nextQuery] = await bucket.getFiles(options);

        const objects: BucketObject[] = files.map((file) => {
          const metadata = file.metadata;
          return {
            name: file.name || "",
            id: metadata?.id || file.name || "",
            bucket: params.bucket,
            generation: String(metadata?.generation || ""),
            metageneration: String(metadata?.metageneration || ""),
            contentType: metadata?.contentType || "",
            size: String(metadata?.size || "0"),
            created: metadata?.timeCreated || "",
            updated: metadata?.updated || "",
            storageClass: metadata?.storageClass || ""
          };
        });

        const output = {
          bucket: params.bucket,
          total: objects.length,
          count: objects.length,
          items: objects,
          hasMore: !!nextQuery?.pageToken,
          nextPageToken: nextQuery?.pageToken || null
        };

        if (params.responseFormat === ResponseFormat.JSON) {
          return {
            content: [{ type: "text", text: JSON.stringify(output, null, 2) }]
          };
        }

        // Markdown format
        let textContent = `# Contents of Bucket: ${params.bucket}\n\n`;
        textContent += `Found ${objects.length} object(s)`;
        if (output.hasMore) {
          textContent += ` (more available, use pageToken for pagination)`;
        }
        textContent += `\n\n`;

        if (objects.length === 0) {
          textContent += "_No objects found in this bucket._";
        } else {
          for (const obj of objects) {
            const sizeKB = Math.round(parseInt(obj.size) / 1024);
            const sizeDisplay = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
            
            textContent += `## ${obj.name}\n`;
            textContent += `- **Size**: ${sizeDisplay}\n`;
            textContent += `- **Type**: ${obj.contentType || "unknown"}\n`;
            textContent += `- **Updated**: ${new Date(obj.updated).toLocaleString()}\n`;
            textContent += `- **Storage**: ${obj.storageClass}\n\n`;
          }
        }

        if (output.hasMore && output.nextPageToken) {
          textContent += `---\n**Pagination**: Use pageToken="${output.nextPageToken}" to get more results.`;
        }

        // Check character limit
        if (textContent.length > CHARACTER_LIMIT) {
          textContent = textContent.substring(0, CHARACTER_LIMIT) + 
            `\n\n_[Output truncated at ${CHARACTER_LIMIT} characters]_`;
        }

        return {
          content: [{ type: "text", text: textContent }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error listing bucket contents: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // ========================================
  // Tool: gcp_storage_get_bucket_metadata
  // ========================================
  server.registerTool(
    "gcp_storage_get_bucket_metadata",
    {
      title: "Get GCS Bucket Metadata",
      description: `Gets detailed metadata for a specific Google Cloud Storage bucket.

This tool retrieves comprehensive metadata including versioning, website configuration, CORS, and lifecycle policies.

Args:
  - bucket (string): Name of the GCS bucket.
  - response_format ('markdown' | 'json'): Output format. Default: 'markdown'.

Returns:
  For markdown format: Detailed bucket metadata in human-readable format.
  For JSON format: Structured data with all bucket metadata fields.

Examples:
  - Use when: "Get details about a specific bucket" -> params with bucket="my-bucket"
  - Don't use when: You need to list objects in the bucket (use gcp_storage_list_bucket_contents instead)`,
      inputSchema: GetBucketMetadataInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params) => {
      try {
        const storage = getStorageClient();
        const [metadata] = await storage.bucket(params.bucket).getMetadata();

        const output = {
          name: params.bucket,
          id: metadata.id as string,
          projectNumber: String(metadata.projectNumber || ""),
          location: metadata.location as string,
          locationType: metadata.locationType as string,
          storageClass: metadata.storageClass as string,
          created: metadata.timeCreated as string,
          updated: metadata.updated as string,
          versioning: metadata.versioning as { enabled: boolean } | null,
          website: metadata.website as { mainPageSuffix?: string; notFoundPage?: string } | null,
          cors: metadata.cors as Array<{
            origin: string[];
            method: string[];
            responseHeader: string[];
            maxAgeSeconds?: number;
          }> | null,
          lifecycle: metadata.lifecycle as Record<string, unknown> | null,
          labels: metadata.labels as Record<string, string> | null,
          encryption: metadata.encryption as Record<string, unknown> | null,
          retentionPolicy: metadata.retentionPolicy as { isLocked?: boolean; retentionPeriod?: number } | null
        };

        if (params.responseFormat === ResponseFormat.JSON) {
          return {
            content: [{ type: "text", text: JSON.stringify(output, null, 2) }]
          };
        }

        // Markdown format
        let textContent = `# GCS Bucket Metadata: ${params.bucket}\n\n`;
        textContent += `## Basic Information\n`;
        textContent += `- **Bucket ID**: ${output.id}\n`;
        textContent += `- **Project Number**: ${output.projectNumber}\n`;
        textContent += `- **Location**: ${output.location} (${output.locationType})\n`;
        textContent += `- **Storage Class**: ${output.storageClass}\n`;
        textContent += `- **Created**: ${new Date(output.created).toLocaleString()}\n`;
        textContent += `- **Updated**: ${new Date(output.updated).toLocaleString()}\n\n`;

        if (output.versioning?.enabled) {
          textContent += `## Versioning\n`;
          textContent += `- **Enabled**: Yes\n\n`;
        }

        if (output.website) {
          textContent += `## Website Configuration\n`;
          if (output.website.mainPageSuffix) {
            textContent += `- **Main Page**: ${output.website.mainPageSuffix}\n`;
          }
          if (output.website.notFoundPage) {
            textContent += `- **404 Page**: ${output.website.notFoundPage}\n`;
          }
          textContent += `\n`;
        }

        if (output.cors && output.cors.length > 0) {
          textContent += `## CORS Configuration\n`;
          for (const cors of output.cors) {
            textContent += `- **Origins**: ${cors.origin?.join(", ") || "N/A"}\n`;
            textContent += `- **Methods**: ${cors.method?.join(", ") || "N/A"}\n`;
            textContent += `- **Headers**: ${cors.responseHeader?.join(", ") || "N/A"}\n`;
          }
          textContent += `\n`;
        }

        if (output.labels && Object.keys(output.labels).length > 0) {
          textContent += `## Labels\n`;
          for (const [key, value] of Object.entries(output.labels)) {
            textContent += `- **${key}**: ${value}\n`;
          }
          textContent += `\n`;
        }

        if (output.retentionPolicy) {
          textContent += `## Retention Policy\n`;
          textContent += `- **Effective**: ${output.retentionPolicy.isLocked ? "Locked" : "Unlocked"}\n`;
          if (output.retentionPolicy.retentionPeriod) {
            textContent += `- **Period**: ${output.retentionPolicy.retentionPeriod} seconds\n`;
          }
          textContent += `\n`;
        }

        return {
          content: [{ type: "text", text: textContent }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error getting bucket metadata: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
}
