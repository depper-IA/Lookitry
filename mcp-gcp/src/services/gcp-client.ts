/**
 * GCP Client Service
 * 
 * Handles authentication and provides initialized GCP SDK clients.
 * Supports:
 * 1. Service account key file (./service-account.json or GOOGLE_APPLICATION_CREDENTIALS)
 * 2. Application Default Credentials (gcloud auth application-default login)
 */

import { Storage } from "@google-cloud/storage";
import { InstancesClient, ZonesClient } from "@google-cloud/compute";
import * as fs from "fs";
import * as path from "path";
import { GCP_AUTH_ERROR, GCP_PROJECT_ERROR } from "../constants.js";

let storageClient: Storage | null = null;
let instancesClient: InstancesClient | null = null;
let zonesClient: ZonesClient | null = null;

/**
 * Get the GCP project ID from environment or parameter
 */
export function getProjectId(projectId?: string): string {
  const project = projectId || process.env.GCP_PROJECT_ID;
  if (!project) {
    throw new Error(GCP_PROJECT_ERROR);
  }
  return project;
}

/**
 * Initialize and return the Storage client
 */
export function getStorageClient(): Storage {
  if (!storageClient) {
    try {
      storageClient = new Storage();
    } catch (error) {
      throw new Error(`${GCP_AUTH_ERROR}\nDetails: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return storageClient;
}

/**
 * Initialize and return the Compute Instances client
 */
export function getInstancesClient(): InstancesClient {
  if (!instancesClient) {
    try {
      instancesClient = new InstancesClient();
    } catch (error) {
      throw new Error(`${GCP_AUTH_ERROR}\nDetails: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return instancesClient;
}

/**
 * Initialize and return the Compute Zones client
 */
export function getZonesClient(): ZonesClient {
  if (!zonesClient) {
    try {
      zonesClient = new ZonesClient();
    } catch (error) {
      throw new Error(`${GCP_AUTH_ERROR}\nDetails: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return zonesClient;
}

/**
 * Check if service account file exists at common locations
 */
export function findServiceAccountFile(): string | null {
  const possiblePaths = [
    "./service-account.json",
    path.join(process.env.HOME || process.env.USERPROFILE || ".", "service-account.json"),
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  ].filter(Boolean) as string[];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

/**
 * Validate GCP authentication by making a simple API call
 */
export async function validateGcpAuth(): Promise<void> {
  try {
    const storage = getStorageClient();
    // Get the authenticated client and make a simple API call to validate
    const [buckets] = await storage.getBuckets();
    // Just verify we can access the API
    if (Array.isArray(buckets)) {
      // Authentication successful
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Could not load the default credentials") || 
        message.includes("No credentials") ||
        message.includes("ENOTFOUND")) {
      throw new Error(GCP_AUTH_ERROR);
    }
    throw error;
  }
}

/**
 * Cleanup clients (call on server shutdown)
 */
export function cleanupClients(): void {
  storageClient = null;
  instancesClient = null;
  zonesClient = null;
}
