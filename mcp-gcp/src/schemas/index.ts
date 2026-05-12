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

export const CreateBucketInputSchema = z.object({
  bucketName: z.string().describe("Name of the GCS bucket to create"),
  location: z.string().default("US").describe("Location of the bucket (e.g., US, EU, us-central1)"),
  storageClass: z.string().default("STANDARD").describe("Storage class (STANDARD, NEARLINE, COLDLINE, ARCHIVE)"),
  projectId: z.string().optional().describe("GCP project ID (defaults to env GCP_PROJECT_ID)"),
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

// Billing Schemas
export const GetBillingInfoInputSchema = z.object({
  projectId: z.string().optional().describe("GCP project ID (defaults to env GCP_PROJECT_ID)"),
  responseFormat: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("Output format")
});

export const ListBillingAccountsInputSchema = z.object({
  responseFormat: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("Output format")
});

// Vertex AI Schemas
export const ListReasoningEnginesInputSchema = z.object({
  projectId: z.string().optional().describe("GCP project ID"),
  region: z.string().default("us-central1").describe("GCP region"),
  responseFormat: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("Output format")
});

export const DeleteReasoningEngineInputSchema = z.object({
  engineId: z.string().describe("ID of the reasoning engine to delete"),
  region: z.string().default("us-central1").describe("GCP region"),
  projectId: z.string().optional().describe("GCP project ID"),
  responseFormat: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("Output format")
});

// Notification Schemas
export const NotifyInputSchema = z.object({
  message: z.string().describe("The message to send"),
  type: z.enum(["info", "warning", "error", "budget_alert"]).default("info").describe("Notification type"),
  channel: z.enum(["telegram", "console"]).default("telegram").describe("Notification channel"),
  responseFormat: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("Output format")
});

export type ListBucketsInput = z.infer<typeof ListBucketsInputSchema>;
export type CreateBucketInput = z.infer<typeof CreateBucketInputSchema>;
export type ListBucketContentsInput = z.infer<typeof ListBucketContentsInputSchema>;
export type GetBucketMetadataInput = z.infer<typeof GetBucketMetadataInputSchema>;
export type ListInstancesInput = z.infer<typeof ListInstancesInputSchema>;
export type GetInstanceInput = z.infer<typeof GetInstanceInputSchema>;
export type ListZonesInput = z.infer<typeof ListZonesInputSchema>;
export type GetBillingInfoInput = z.infer<typeof GetBillingInfoInputSchema>;
export type ListBillingAccountsInput = z.infer<typeof ListBillingAccountsInputSchema>;
export type NotifyInput = z.infer<typeof NotifyInputSchema>;
