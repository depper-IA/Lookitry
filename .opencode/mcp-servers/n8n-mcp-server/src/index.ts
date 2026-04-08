import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios, { AxiosError } from "axios";

const N8N_BASE_URL = process.env.N8N_BASE_URL || "https://n8n.wilkiedevs.com";
const N8N_API_KEY = process.env.N8N_API_KEY;

if (!N8N_API_KEY) {
  console.error("ERROR: N8N_API_KEY environment variable is required");
  process.exit(1);
}

const CHARACTER_LIMIT = 25000;

enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json",
}

enum WorkflowActivation {
  ACTIVATE = "activate",
  DEACTIVATE = "deactivate",
}

const axiosClient = axios.create({
  baseURL: `${N8N_BASE_URL}/api/v1`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "X-N8N-API-KEY": N8N_API_KEY,
  },
});

function handleApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response) {
      switch (error.response.status) {
        case 400:
          return `Error: Bad request - ${JSON.stringify(error.response.data)}`;
        case 401:
          return "Error: Unauthorized - Invalid API key";
        case 403:
          return "Error: Forbidden - No access to this resource";
        case 404:
          return "Error: Workflow not found";
        case 429:
          return "Error: Rate limit exceeded";
        default:
          return `Error: API request failed with status ${error.response.status} - ${JSON.stringify(error.response.data)}`;
      }
    } else if (error.code === "ECONNABORTED") {
      return "Error: Request timed out";
    }
  }
  return `Error: Unexpected error - ${error instanceof Error ? error.message : String(error)}`;
}

async function makeApiRequest<T>(endpoint: string, method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET", data?: unknown): Promise<T> {
  const response = await axiosClient({ url: endpoint, method, data });
  return response.data;
}

const WorkflowIdSchema = z.object({
  workflowId: z.string().describe("The unique ID of the workflow"),
});

const WorkflowNameSchema = z.object({
  name: z.string().min(1).max(255).describe("Name of the workflow"),
});

const WorkflowPinSchema = z.object({
  workflowId: z.string().describe("The unique ID of the workflow"),
  pinData: z.record(z.any()).optional().describe("Pin data for the workflow nodes"),
});

const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(255).describe("Name of the workflow to create"),
  nodes: z.array(z.any()).optional().describe("Array of workflow nodes"),
  connections: z.record(z.any()).optional().describe("Object describing node connections"),
  settings: z.record(z.any()).optional().describe("Workflow settings"),
  active: z.boolean().default(false).describe("Whether to activate the workflow after creation"),
});

const UpdateWorkflowSchema = z.object({
  workflowId: z.string().describe("The unique ID of the workflow to update"),
  name: z.string().min(1).max(255).optional().describe("New name for the workflow"),
  nodes: z.array(z.any()).optional().describe("Updated array of workflow nodes"),
  connections: z.record(z.any()).optional().describe("Updated node connections"),
  settings: z.record(z.any()).optional().describe("Updated workflow settings"),
  active: z.boolean().optional().describe("Whether the workflow is active"),
});

const TestWorkflowSchema = z.object({
  workflowId: z.string().describe("The unique ID of the workflow to test"),
  startNodes: z.array(z.string()).optional().describe("Array of node names to start from"),
  pinData: z.record(z.any()).optional().describe("Pin data for test execution"),
  runData: z.record(z.any()).optional().describe("Data to pass to the workflow"),
});

const WorkflowExecutionSchema = z.object({
  workflowId: z.string().describe("The unique ID of the workflow"),
  limit: z.number().int().min(1).max(100).default(10).describe("Maximum executions to return"),
  skip: z.number().int().min(0).default(0).describe("Number of executions to skip"),
});

const ActivateWorkflowSchema = z.object({
  workflowId: z.string().describe("The unique ID of the workflow to activate/deactivate"),
  action: z.nativeEnum(WorkflowActivation).describe("Action: 'activate' or 'deactivate'"),
});

const NodeOperationSchema = z.object({
  workflowId: z.string().describe("The unique ID of the workflow"),
  nodeId: z.string().describe("The unique ID of the node to modify"),
  operation: z.enum(["add", "remove", "update"]).describe("The operation to perform"),
  nodeData: z.record(z.any()).optional().describe("Node data for add/update operations"),
});

const TagSchema = z.object({
  name: z.string().min(1).max(100).describe("Name of the tag"),
});

const TagWorkflowSchema = z.object({
  workflowId: z.string().describe("The unique ID of the workflow"),
  tagId: z.string().describe("The unique ID of the tag"),
});

type WorkflowIdInput = z.infer<typeof WorkflowIdSchema>;
type CreateWorkflowInput = z.infer<typeof CreateWorkflowSchema>;
type UpdateWorkflowInput = z.infer<typeof UpdateWorkflowSchema>;
type TestWorkflowInput = z.infer<typeof TestWorkflowSchema>;
type WorkflowExecutionInput = z.infer<typeof WorkflowExecutionSchema>;
type ActivateWorkflowInput = z.infer<typeof ActivateWorkflowSchema>;
type NodeOperationInput = z.infer<typeof NodeOperationSchema>;

const server = new McpServer({
  name: "lookitry-n8n-mcp-server",
  version: "1.0.0",
});

server.registerTool(
  "n8n_list_workflows",
  {
    title: "List n8n Workflows",
    description: `List all workflows in n8n instance.

Returns a list of all workflows with their basic info (id, name, active status, tags).`,
    inputSchema: z.object({
      limit: z.number().int().min(1).max(100).default(50).describe("Maximum workflows to return"),
      offset: z.number().int().min(0).default(0).describe("Number of workflows to skip"),
      active: z.boolean().optional().describe("Filter by active status"),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ limit, offset, active }) => {
    try {
      const params: Record<string, string> = { limit: String(limit), offset: String(offset) };
      if (active !== undefined) params.active = String(active);
      const data = await makeApiRequest<{ data: Array<{ id: string; name: string; active: boolean; tags: Array<{ id: string; name: string }> }>; count: number }>("workflows", "GET", undefined);
      const workflows = data.data || [];
      let text = `# n8n Workflows\n\nTotal: ${data.count}\n\n`;
      for (const wf of workflows) {
        const status = wf.active ? "🟢 Active" : "⚪ Inactive";
        text += `## ${wf.name} (${wf.id})\n${status}\n`;
        if (wf.tags?.length) text += `Tags: ${wf.tags.map((t) => t.name).join(", ")}\n`;
        text += "\n";
      }
      return { content: [{ type: "text", text }], structuredContent: data };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }] };
    }
  },
);

server.registerTool(
  "n8n_get_workflow",
  {
    title: "Get n8n Workflow",
    description: `Get a specific workflow by ID with all its nodes, connections and settings.

Use this to inspect a workflow's full structure before modifying it.`,
    inputSchema: WorkflowIdSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ workflowId }) => {
    try {
      const data = await makeApiRequest<Record<string, unknown>>(`workflows/${workflowId}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }] };
    }
  },
);

server.registerTool(
  "n8n_create_workflow",
  {
    title: "Create n8n Workflow",
    description: `Create a new workflow in n8n.

Can optionally specify initial nodes, connections, and settings.`,
    inputSchema: CreateWorkflowSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  async (params: CreateWorkflowInput) => {
    try {
      const payload: Record<string, unknown> = { name: params.name };
      if (params.nodes) payload.nodes = params.nodes;
      if (params.connections) payload.connections = params.connections;
      if (params.settings) payload.settings = params.settings;
      if (params.active !== undefined) payload.active = params.active;
      const data = await makeApiRequest<{ id: string; name: string; active: boolean }>("workflows", "POST", payload);
      return {
        content: [{ type: "text", text: `✅ Workflow created: ${data.name} (ID: ${data.id})\nActive: ${data.active}` }],
        structuredContent: data,
      };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }] };
    }
  },
);

server.registerTool(
  "n8n_update_workflow",
  {
    title: "Update n8n Workflow",
    description: `Update an existing workflow. Provide the workflow ID and the fields to update.

WARNING: This replaces the entire workflow structure. Include all nodes even if only modifying one.`,
    inputSchema: UpdateWorkflowSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async (params: UpdateWorkflowInput) => {
    try {
      const payload: Record<string, unknown> = {};
      if (params.name !== undefined) payload.name = params.name;
      if (params.nodes !== undefined) payload.nodes = params.nodes;
      if (params.connections !== undefined) payload.connections = params.connections;
      if (params.settings !== undefined) payload.settings = params.settings;
      if (params.active !== undefined) payload.active = params.active;
      const data = await makeApiRequest<{ id: string; name: string; active: boolean }>(`workflows/${params.workflowId}`, "PUT", payload);
      return {
        content: [{ type: "text", text: `✅ Workflow updated: ${data.name} (ID: ${data.id})\nActive: ${data.active}` }],
        structuredContent: data,
      };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }] };
    }
  },
);

server.registerTool(
  "n8n_delete_workflow",
  {
    title: "Delete n8n Workflow",
    description: `Delete a workflow permanently. This action cannot be undone.`,
    inputSchema: WorkflowIdSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
  },
  async ({ workflowId }) => {
    try {
      await makeApiRequest<void>(`workflows/${workflowId}`, "DELETE");
      return { content: [{ type: "text", text: `✅ Workflow ${workflowId} deleted` }] };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }] };
    }
  },
);

server.registerTool(
  "n8n_activate_workflow",
  {
    title: "Activate/Deactivate n8n Workflow",
    description: `Activate or deactivate a workflow. Active workflows run when triggered by webhooks or schedules.`,
    inputSchema: ActivateWorkflowSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ workflowId, action }) => {
    try {
      const isActivation = action === WorkflowActivation.ACTIVATE;
      const data = await makeApiRequest<{ id: string; name: string; active: boolean }>(`workflows/${workflowId}`, "PATCH", { active: isActivation });
      return {
        content: [{ type: "text", text: `✅ Workflow ${data.name} is now ${data.active ? "ACTIVE" : "INACTIVE"}` }],
        structuredContent: data,
      };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }] };
    }
  },
);

server.registerTool(
  "n8n_test_workflow",
  {
    title: "Test n8n Workflow",
    description: `Run a workflow in test mode to verify it works correctly without triggering actual operations.`,
    inputSchema: TestWorkflowSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  async (params: TestWorkflowInput) => {
    try {
      const payload: Record<string, unknown> = {};
      if (params.startNodes) payload.startNodes = params.startNodes;
      if (params.pinData) payload.pinData = params.pinData;
      if (params.runData) payload.runData = params.runData;
      const data = await makeApiRequest<{ id: string; status: string; data: Record<string, unknown> }>(`workflows/${params.workflowId}/test`, "POST", payload);
      return {
        content: [{ type: "text", text: `✅ Test run completed\nStatus: ${data.status}\nExecution ID: ${data.id}` }],
        structuredContent: data,
      };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }] };
    }
  },
);

server.registerTool(
  "n8n_get_workflow_executions",
  {
    title: "Get n8n Workflow Executions",
    description: `Get execution history for a workflow to monitor its runs and status.`,
    inputSchema: WorkflowExecutionSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ workflowId, limit, skip }) => {
    try {
      const data = await makeApiRequest<{ data: Array<{ id: string; status: string; mode: string; startedAt: string; finishedAt?: string; error?: string }> }>(`workflows/${workflowId}/executions?limit=${limit}&skip=${skip}`);
      const executions = data.data || [];
      let text = `# Executions for Workflow ${workflowId}\n\n`;
      for (const exec of executions) {
        const status = exec.status === "success" ? "✅" : "❌";
        text += `${status} ${exec.id} | ${exec.mode} | ${exec.startedAt}${exec.error ? `\nError: ${exec.error}` : ""}\n`;
      }
      return { content: [{ type: "text", text }], structuredContent: data };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }] };
    }
  },
);

server.registerTool(
  "n8n_add_node_to_workflow",
  {
    title: "Add Node to n8n Workflow",
    description: `Add a new node to an existing workflow. Requires node configuration data.`,
    inputSchema: z.object({
      workflowId: z.string().describe("The unique ID of the workflow"),
      nodeData: z.record(z.any()).describe("Complete node configuration object"),
      position: z.object({ x: z.number(), y: z.number() }).optional().describe("Position on canvas"),
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  async ({ workflowId, nodeData, position }) => {
    try {
      const wf = await makeApiRequest<{ nodes: Array<Record<string, unknown>> }>(`workflows/${workflowId}`);
      const nodes = wf.nodes || [];
      const newNode = { ...nodeData, id: `node_${Date.now()}`, position: position || { x: 0, y: 0 } };
      nodes.push(newNode);
      await makeApiRequest(`workflows/${workflowId}`, "PUT", { nodes });
      return { content: [{ type: "text", text: `✅ Node added to workflow ${workflowId}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }] };
    }
  },
);

server.registerTool(
  "n8n_get_tags",
  {
    title: "List n8n Tags",
    description: `Get all tags used to organize workflows in n8n.`,
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async () => {
    try {
      const data = await makeApiRequest<{ data: Array<{ id: string; name: string; usageCount?: number }> }>("tags");
      let text = "# n8n Tags\n\n";
      for (const tag of data.data || []) {
        text += `- ${tag.name} (${tag.id})`;
        if (tag.usageCount) text += ` | Used in ${tag.usageCount} workflows`;
        text += "\n";
      }
      return { content: [{ type: "text", text }], structuredContent: data };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }] };
    }
  },
);

server.registerTool(
  "n8n_create_tag",
  {
    title: "Create n8n Tag",
    description: `Create a new tag to organize workflows.`,
    inputSchema: TagSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ name }) => {
    try {
      const data = await makeApiRequest<{ id: string; name: string }>("tags", "POST", { name });
      return { content: [{ type: "text", text: `✅ Tag created: ${name} (ID: ${data.id})` }], structuredContent: data };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }] };
    }
  },
);

server.registerTool(
  "n8n_tag_workflow",
  {
    title: "Tag n8n Workflow",
    description: `Add a tag to a workflow for organization.`,
    inputSchema: TagWorkflowSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ workflowId, tagId }) => {
    try {
      await makeApiRequest(`workflows/${workflowId}/tags`, "POST", { tagId });
      return { content: [{ type: "text", text: `✅ Tag ${tagId} added to workflow ${workflowId}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }] };
    }
  },
);

server.registerTool(
  "n8n_get_workflows_by_tag",
  {
    title: "Get n8n Workflows by Tag",
    description: `Get all workflows that have a specific tag.`,
    inputSchema: z.object({
      tagId: z.string().describe("The tag ID to filter by"),
      limit: z.number().int().min(1).max(100).default(50).describe("Maximum workflows to return"),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async ({ tagId, limit }) => {
    try {
      const data = await makeApiRequest<{ data: Array<{ id: string; name: string; active: boolean; tags: Array<{ id: string; name: string }> }> }>(`tags/${tagId}/workflows?limit=${limit}`);
      let text = `# Workflows with Tag ${tagId}\n\n`;
      for (const wf of data.data || []) {
        text += `- ${wf.name} (${wf.id}) ${wf.active ? "ACTIVE" : "INACTIVE"}\n`;
      }
      return { content: [{ type: "text", text }], structuredContent: data };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }] };
    }
  },
);

async function runStdio() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("n8n MCP server running via stdio");
}

runStdio().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
