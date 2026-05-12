/**
 * GCP MCP Server Constants
 */

export const CHARACTER_LIMIT = 25000;

export const GCP_AUTH_ERROR = `Error: GCP authentication failed. Please ensure you have:
1. A service account key file at ./service-account.json, or
2. Application Default Credentials configured (run: gcloud auth application-default login)
3. The GOOGLE_APPLICATION_CREDENTIALS environment variable pointing to your key file`;

export const GCP_PROJECT_ERROR = "Error: GCP project ID is required. Set the GCP_PROJECT_ID environment variable.";

export const TOOL_DESCRIPTIONS = {
  storage: {
    listBuckets: "Lists all GCS buckets in the specified GCP project",
    listBucketContents: "Lists objects within a specific GCS bucket",
    getBucketMetadata: "Gets metadata for a specific GCS bucket"
  },
  compute: {
    listInstances: "Lists all Compute Engine instances in a zone",
    getInstance: "Gets details for a specific Compute Engine instance",
    listZones: "Lists all available GCP zones"
  }
} as const;
