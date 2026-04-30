/**
 * GCP Compute Engine Tools
 * 
 * Tools for interacting with Google Cloud Compute Engine.
 * These tools allow listing and getting details about VM instances and zones.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getInstancesClient, getZonesClient, getProjectId } from "../services/gcp-client.js";
import {
  ListInstancesInputSchema,
  GetInstanceInputSchema,
  ListZonesInputSchema,
  ResponseFormat
} from "../schemas/index.js";
import type { ComputeInstance, Zone } from "../types.js";
import { CHARACTER_LIMIT } from "../constants.js";

// GCP Compute instance type (from @google-cloud/compute)
interface ComputeInstanceResponse {
  id?: string | number;
  name?: string;
  machineType?: string;
  status?: string;
  creationTimestamp?: string;
  description?: string;
  tags?: { items?: string[] };
  networkInterfaces?: Array<{
    network?: string;
    subnetwork?: string;
    networkIP?: string;
    accessConfigs?: Array<{
      name?: string;
      type?: string;
      natIP?: string;
    }>;
  }>;
  disks?: Array<{
    deviceName?: string;
    mode?: string;
    source?: string;
    type?: string;
    boot?: boolean;
  }>;
}

interface ZoneResponse {
  name?: string;
  region?: string;
  status?: string;
  selfLink?: string;
}

/**
 * Register all Compute Engine tools with the MCP server
 */
export function registerComputeTools(server: McpServer): void {
  
  // ========================================
  // Tool: gcp_compute_list_instances
  // ========================================
  server.registerTool(
    "gcp_compute_list_instances",
    {
      title: "List Compute Engine Instances",
      description: `Lists all Compute Engine virtual machine instances in a specified zone.

This tool retrieves VM instances from a GCP project and zone, with optional filtering.

Args:
  - projectId (string, optional): GCP project ID. Defaults to GCP_PROJECT_ID env var.
  - zone (string): Zone name (e.g., us-central1-a, europe-west1-b). Use gcp_compute_list_zones to find available zones.
  - filter (string, optional): Filter expression (e.g., 'status=RUNNING', 'name:my-instance').
  - maxResults (number, optional): Maximum instances to return (1-500). Default: 100.
  - pageToken (string, optional): Token for pagination (from previous response).
  - response_format ('markdown' | 'json'): Output format. Default: 'markdown'.

Returns:
  For markdown format: A formatted list of VM instances with names, types, zones, and statuses.
  For JSON format: Structured data with schema:
  {
    "total": number,
    "zone": string,
    "instances": [
      {
        "id": string,
        "name": string,
        "machineType": string,
        "zone": string,
        "status": string,
        "created": string
      }
    ],
    "nextPageToken": string | null,
    "hasMore": boolean
  }

Examples:
  - Use when: "List all VMs in us-central1-a" -> params with zone="us-central1-a"
  - Use when: "List running instances only" -> params with zone="us-central1-a", filter="status=RUNNING"
  - Don't use when: You need details about a specific instance (use gcp_compute_get_instance instead)`,
      inputSchema: ListInstancesInputSchema,
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
        const instancesClient = getInstancesClient();
        
        const request: {
          project: string;
          zone: string;
          filter?: string;
          maxResults?: number;
          pageToken?: string;
        } = {
          project: projectId,
          zone: params.zone,
          maxResults: params.maxResults
        };
        
        if (params.filter) request.filter = params.filter;
        if (params.pageToken) request.pageToken = params.pageToken;

        const response = await instancesClient.list(request as Parameters<typeof instancesClient.list>[0]);
        const instances = response[0] || [];

        const instanceList: ComputeInstance[] = instances.map((instance: ComputeInstanceResponse) => {
          const networkInterfaces = (instance.networkInterfaces || []).map((ni) => ({
            network: ni.network?.split("/").pop() || "",
            subnetwork: ni.subnetwork?.split("/").pop() || "",
            networkIP: ni.networkIP || "",
            accessConfigs: (ni.accessConfigs || []).map((ac) => ({
              name: ac.name || "",
              type: ac.type || "",
              natIP: ac.natIP
            }))
          }));
          
          const disks = (instance.disks || []).map((disk) => ({
            deviceName: disk.deviceName || "",
            mode: disk.mode || "",
            source: disk.source?.split("/").pop() || "",
            type: disk.type || "",
            boot: disk.boot || false
          }));
          
          return {
            id: String(instance.id || ""),
            name: instance.name || "",
            machineType: instance.machineType || "",
            zone: params.zone,
            status: instance.status || "",
            created: instance.creationTimestamp || "",
            description: instance.description || "",
            tags: instance.tags?.items,
            networkInterfaces,
            disks
          };
        });

        const nextPageToken = response[2]?.nextPageToken as string | undefined;
        const output = {
          total: instanceList.length,
          count: instanceList.length,
          zone: params.zone,
          instances: instanceList,
          hasMore: !!nextPageToken,
          nextPageToken: nextPageToken || null
        };

        if (params.responseFormat === ResponseFormat.JSON) {
          return {
            content: [{ type: "text", text: JSON.stringify(output, null, 2) }]
          };
        }

        // Markdown format
        let textContent = `# Compute Engine Instances in ${params.zone}\n\n`;
        textContent += `Found ${instanceList.length} instance(s)\n\n`;

        if (instanceList.length === 0) {
          textContent += "_No instances found in this zone._";
        } else {
          for (const instance of instanceList) {
            const machineShort = instance.machineType.split("/").pop() || instance.machineType;
            
            textContent += `## ${instance.name}\n`;
            textContent += `- **ID**: ${instance.id}\n`;
            textContent += `- **Machine Type**: ${machineShort}\n`;
            textContent += `- **Status**: ${formatInstanceStatus(instance.status)}\n`;
            textContent += `- **Created**: ${new Date(instance.created).toLocaleString()}\n`;
            
            if (instance.networkInterfaces && instance.networkInterfaces.length > 0) {
              const primaryNic = instance.networkInterfaces[0];
              textContent += `- **Internal IP**: ${primaryNic.networkIP}\n`;
              if (primaryNic.accessConfigs && primaryNic.accessConfigs.length > 0) {
                const extIP = primaryNic.accessConfigs[0].natIP;
                if (extIP) {
                  textContent += `- **External IP**: ${extIP}\n`;
                }
              }
            }
            
            if (instance.tags && instance.tags.length > 0) {
              textContent += `- **Tags**: ${instance.tags.join(", ")}\n`;
            }
            
            textContent += `\n`;
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
            text: `Error listing instances: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // ========================================
  // Tool: gcp_compute_get_instance
  // ========================================
  server.registerTool(
    "gcp_compute_get_instance",
    {
      title: "Get Compute Engine Instance Details",
      description: `Gets detailed information about a specific Compute Engine virtual machine instance.

This tool retrieves comprehensive details about a VM including network interfaces, disks, and metadata.

Args:
  - projectId (string, optional): GCP project ID. Defaults to GCP_PROJECT_ID env var.
  - zone (string): Zone where the instance is located (e.g., us-central1-a).
  - instanceName (string): Name of the Compute Engine instance.
  - response_format ('markdown' | 'json'): Output format. Default: 'markdown'.

Returns:
  For markdown format: Detailed instance information in human-readable format.
  For JSON format: Complete structured data with all instance fields.

Examples:
  - Use when: "Get details about my-web-server" -> params with zone="us-central1-a", instanceName="my-web-server"
  - Don't use when: You need to list all instances in a zone (use gcp_compute_list_instances instead)`,
      inputSchema: GetInstanceInputSchema,
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
        const instancesClient = getInstancesClient();
        
        const request = {
          project: projectId,
          zone: params.zone,
          instance: params.instanceName
        };

        const [instance] = await instancesClient.get(request);
        const instanceData = instance as ComputeInstanceResponse;

        const networkInterfaces = (instanceData.networkInterfaces || []).map((ni) => ({
          network: ni.network?.split("/").pop() || "",
          subnetwork: ni.subnetwork?.split("/").pop() || "",
          networkIP: ni.networkIP || "",
          accessConfigs: (ni.accessConfigs || []).map((ac) => ({
            name: ac.name || "",
            type: ac.type || "",
            natIP: ac.natIP
          }))
        }));

        const disks = (instanceData.disks || []).map((disk) => ({
          deviceName: disk.deviceName || "",
          mode: disk.mode || "",
          source: disk.source?.split("/").pop() || "",
          type: disk.type || "",
          boot: disk.boot || false
        }));

        const output: ComputeInstance = {
          id: String(instanceData.id || ""),
          name: instanceData.name || "",
          machineType: instanceData.machineType || "",
          zone: params.zone,
          status: instanceData.status || "",
          created: instanceData.creationTimestamp || "",
          description: instanceData.description || "",
          tags: instanceData.tags?.items,
          networkInterfaces,
          disks
        };

        if (params.responseFormat === ResponseFormat.JSON) {
          return {
            content: [{ type: "text", text: JSON.stringify(output, null, 2) }]
          };
        }

        // Markdown format
        let textContent = `# Compute Engine Instance: ${output.name}\n\n`;
        textContent += `## Basic Information\n`;
        textContent += `- **Instance ID**: ${output.id}\n`;
        textContent += `- **Machine Type**: ${output.machineType.split("/").pop()}\n`;
        textContent += `- **Status**: ${formatInstanceStatus(output.status)}\n`;
        textContent += `- **Zone**: ${output.zone}\n`;
        textContent += `- **Created**: ${new Date(output.created).toLocaleString()}\n`;
        textContent += `- **Description**: ${output.description || "N/A"}\n\n`;

        if (output.networkInterfaces && output.networkInterfaces.length > 0) {
          textContent += `## Network Interfaces\n`;
          for (let i = 0; i < output.networkInterfaces.length; i++) {
            const ni = output.networkInterfaces[i];
            textContent += `### Interface ${i + 1}\n`;
            textContent += `- **Network**: ${ni.network}\n`;
            textContent += `- **Subnetwork**: ${ni.subnetwork}\n`;
            textContent += `- **Internal IP**: ${ni.networkIP}\n`;
            
            if (ni.accessConfigs && ni.accessConfigs.length > 0) {
              for (const ac of ni.accessConfigs) {
                textContent += `- **External IP**: ${ac.natIP || "Ephemeral"}\n`;
              }
            }
          }
          textContent += `\n`;
        }

        if (output.disks && output.disks.length > 0) {
          textContent += `## Disks\n`;
          for (const disk of output.disks) {
            textContent += `- **${disk.deviceName}** (${disk.type})\n`;
            textContent += `  - Mode: ${disk.mode}\n`;
            textContent += `  - Source: ${disk.source}\n`;
            textContent += `  - Boot: ${disk.boot ? "Yes" : "No"}\n`;
          }
          textContent += `\n`;
        }

        if (output.tags && output.tags.length > 0) {
          textContent += `## Tags\n`;
          textContent += output.tags.map(tag => `- ${tag}`).join("\n");
          textContent += `\n`;
        }

        return {
          content: [{ type: "text", text: textContent }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error getting instance: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // ========================================
  // Tool: gcp_compute_list_zones
  // ========================================
  server.registerTool(
    "gcp_compute_list_zones",
    {
      title: "List Compute Engine Zones",
      description: `Lists all available Compute Engine zones in a GCP project.

This tool retrieves all zones, optionally filtered by region.

Args:
  - projectId (string, optional): GCP project ID. Defaults to GCP_PROJECT_ID env var.
  - region (string, optional): Filter zones by region (e.g., 'us-central1', 'europe-west1').
  - response_format ('markdown' | 'json'): Output format. Default: 'markdown'.

Returns:
  For markdown format: A list of zones with their regions and status.
  For JSON format: Structured data with all zone information.

Examples:
  - Use when: "What zones are available in GCP?" -> params with no filters
  - Use when: "Show me zones in us-central1" -> params with region="us-central1"
  - Don't use when: You need instance details (use gcp_compute_list_instances instead)`,
      inputSchema: ListZonesInputSchema,
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
        const zonesClient = getZonesClient();
        
        const request: {
          project: string;
          filter?: string;
        } = {
          project: projectId
        };
        
        if (params.region) request.filter = `region:${params.region}`;

        const response = await zonesClient.list(request as Parameters<typeof zonesClient.list>[0]);
        const zones = response[0] || [];

        const zoneList: Zone[] = zones.map((zone: ZoneResponse) => ({
          name: zone.name || "",
          region: zone.region?.split("/").pop() || "",
          status: zone.status || "",
          selfLink: zone.selfLink || ""
        }));

        // Group by region
        const byRegion: Record<string, Zone[]> = {};
        for (const zone of zoneList) {
          if (!byRegion[zone.region]) {
            byRegion[zone.region] = [];
          }
          byRegion[zone.region].push(zone);
        }

        const output = {
          total: zoneList.length,
          projectId,
          zones: zoneList
        };

        if (params.responseFormat === ResponseFormat.JSON) {
          return {
            content: [{ type: "text", text: JSON.stringify(output, null, 2) }]
          };
        }

        // Markdown format
        let textContent = `# Compute Engine Zones\n\n`;
        textContent += `Found ${zoneList.length} zone(s)`;
        if (params.region) {
          textContent += ` in region: ${params.region}`;
        }
        textContent += `\n\n`;

        if (zoneList.length === 0) {
          textContent += "_No zones found._";
        } else {
          const sortedRegions = Object.keys(byRegion).sort();
          for (const region of sortedRegions) {
            textContent += `## ${region}\n`;
            for (const zone of byRegion[region]) {
              const statusIcon = zone.status === "UP" ? "✅" : "❌";
              textContent += `${statusIcon} ${zone.name} (${zone.status})\n`;
            }
            textContent += `\n`;
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
            text: `Error listing zones: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
}

/**
 * Format instance status with emoji indicator
 */
function formatInstanceStatus(status: string): string {
  const statusLower = status?.toLowerCase() || "";
  
  if (statusLower === "running") {
    return "🟢 Running";
  } else if (statusLower === "stopped" || statusLower === "terminated") {
    return "⚫ Stopped";
  } else if (statusLower === "staging") {
    return "🟡 Staging";
  } else if (statusLower === "provisioning") {
    return "🔵 Provisioning";
  } else if (statusLower === "suspending") {
    return "🟠 Suspending";
  } else if (statusLower === "suspended") {
    return "🟤 Suspended";
  }
  
  return status || "Unknown";
}
