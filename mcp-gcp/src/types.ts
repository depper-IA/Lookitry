/**
 * GCP MCP Server Type Definitions
 */

export interface Bucket {
  name: string;
  id: string;
  projectNumber: string;
  created: string;
  updated: string;
  location: string;
  locationType: string;
  storageClass: string;
  versioning: boolean;
  website?: {
    mainPageSuffix?: string;
    notFoundPage?: string;
  };
  cors?: Array<{
    origin: string[];
    method: string[];
    responseHeader: string[];
    maxAgeSeconds?: number;
  }>;
}

export interface BucketObject {
  name: string;
  id: string;
  bucket: string;
  generation: string;
  metageneration: string;
  contentType: string;
  size: string;
  created: string;
  updated: string;
  storageClass: string;
}

export interface ComputeInstance {
  id: string;
  name: string;
  machineType: string;
  zone: string;
  status: string;
  created: string;
  description: string;
  tags?: string[];
  networkInterfaces?: Array<{
    network: string;
    subnetwork: string;
    networkIP: string;
    accessConfigs?: Array<{
      name: string;
      type: string;
      natIP?: string;
    }>;
  }>;
  disks?: Array<{
    deviceName: string;
    mode: string;
    source: string;
    type: string;
    boot: boolean;
  }>;
}

export interface Zone {
  name: string;
  region: string;
  status: string;
  selfLink: string;
}

export interface PaginatedResponse<T> {
  total: number;
  count: number;
  items: T[];
  hasMore: boolean;
  nextPageToken?: string;
}

// Index signature type for structuredContent
export type StructuredContent = Record<string, unknown>;
