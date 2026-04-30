/**
 * Zod Schemas for GCP MCP Server
 */

import { z } from "zod";

// Response format enum
export enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json"
}

// Storage Schemas
export const ListBucketsInputSchema = z.object({
  projectId: z.string().optional().describe("GCP project ID (defaults to env GCP_PROJECT_ID)"),
  prefix: z.string().optional().describe("Filter buckets by name prefix"),
  responseFormat: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("Output format")
});

export const ListBucketContentsInputSchema = z.object({
  bucket: z.string().describe("Name of the GCS bucket"),
  prefix: z.string().optional().describe("Filter objects by prefix"),
  delimiter: z.string().optional().describe("Delimiter to group objects"),
  maxResults: z.number().int().min(1).max(1000).default(100).describe("Maximum results"),
  pageToken: z.string().optional().describe("Page token for pagination"),
  responseFormat: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("Output format")
});

export const GetBucketMetadataInputSchema = z.object({
  bucket: z.string().describe("Name of the GCS bucket"),
  responseFormat: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("Output format")
});

// Compute Schemas
export const ListInstancesInputSchema = z.object({
  projectId: z.string().optional().describe("GCP project ID (defaults to env GCP_PROJECT_ID)"),
  zone: z.string().describe("Zone name (e.g., us-central1-a)"),
  filter: z.string().optional().describe("Filter expression (e.g., 'status=RUNNING')"),
  maxResults: z.number().int().min(1).max(500).default(100).describe("Maximum results"),
  pageToken: z.string().optional().describe("Page token for pagination"),
  responseFormat: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("Output format")
});

export const GetInstanceInputSchema = z.object({
  projectId: z.string().optional().describe("GCP project ID (defaults to env GCP_PROJECT_ID)"),
  zone: z.string().describe("Zone name (e.g., us-central1-a)"),
  instanceName: z.string().describe("Name of the Compute Engine instance"),
  responseFormat: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("Output format")
});

export const ListZonesInputSchema = z.object({
  projectId: z.string().optional().describe("GCP project ID (defaults to env GCP_PROJECT_ID)"),
  region: z.string().optional().describe("Filter zones by region"),
  responseFormat: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("Output format")
});

export type ListBucketsInput = z.infer<typeof ListBucketsInputSchema>;
export type ListBucketContentsInput = z.infer<typeof ListBucketContentsInputSchema>;
export type GetBucketMetadataInput = z.infer<typeof GetBucketMetadataInputSchema>;
export type ListInstancesInput = z.infer<typeof ListInstancesInputSchema>;
export type GetInstanceInput = z.infer<typeof GetInstanceInputSchema>;
export type ListZonesInput = z.infer<typeof ListZonesInputSchema>;
