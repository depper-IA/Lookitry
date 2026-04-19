import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://vkdooutklowctuudjnkl.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error("ERROR: SUPABASE_SERVICE_KEY environment variable is required");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

const server = new McpServer({
  name: "lookitry-supabase-mcp",
  version: "1.0.0",
});

server.registerTool(
  "supabase_list_tables",
  {
    title: "List Tables",
    description: "List all tables in the public schema",
    inputSchema: z.object({})
  },
  async () => {
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public");
    
    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    }
    
    const tables = (data || []).map((t: any) => t.table_name).join(", ");
    return { 
      content: [{ type: "text", text: `Tables: ${tables}` }],
      structuredContent: { tables: data }
    };
  }
);

server.registerTool(
  "supabase_query",
  {
    title: "Query Table",
    description: "Execute a SELECT query on a table with optional filters",
    inputSchema: z.object({
      table: z.string().describe("Table name"),
      columns: z.string().optional().describe("Comma-separated columns (default: *)").default("*"),
      filters: z.string().optional().describe("WHERE clause conditions (e.g., 'id=1,name=test')"),
      order: z.string().optional().describe("ORDER BY clause (e.g., 'created_at desc')"),
      limit: z.number().optional().describe("LIMIT value").default(10),
      offset: z.number().optional().describe("OFFSET value")
    })
  },
  async ({ table, columns = "*", filters, order, limit = 10, offset }) => {
    let query = supabase.from(table).select(columns);
    
    if (filters) {
      const filterParts = filters.split(",").map(f => f.trim());
      for (const part of filterParts) {
        const [key, value] = part.split("=").map(s => s.trim());
        if (key && value) {
          query = query.eq(key, value);
        }
      }
    }
    
    if (order) query = query.order(order.split(" ")[0] as any, { ascending: !order.includes("desc") });
    if (limit) query = query.limit(limit);
    if (offset !== undefined) query = query.range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    
    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    }
    
    return { 
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { rows: data, count: data?.length }
    };
  }
);

server.registerTool(
  "supabase_insert",
  {
    title: "Insert Row",
    description: "Insert a row into a table",
    inputSchema: z.object({
      table: z.string().describe("Table name"),
      data: z.string().describe("JSON object with column:value pairs")
    })
  },
  async ({ table, data }) => {
    const parsed = JSON.parse(data);
    const { data: result, error } = await supabase.from(table).insert(parsed).select().single();
    
    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    }
    
    return { 
      content: [{ type: "text", text: `Inserted: ${JSON.stringify(result)}` }],
      structuredContent: { inserted: result }
    };
  }
);

server.registerTool(
  "supabase_update",
  {
    title: "Update Row",
    description: "Update rows in a table",
    inputSchema: z.object({
      table: z.string().describe("Table name"),
      data: z.string().describe("JSON object with column:value pairs to update"),
      filters: z.string().optional().describe("WHERE clause conditions")
    })
  },
  async ({ table, data, filters }) => {
    const parsed = JSON.parse(data);
    let query = supabase.from(table).update(parsed);
    
    if (filters) {
      const filterParts = filters.split(",").map(f => f.trim());
      for (const part of filterParts) {
        const [key, value] = part.split("=").map(s => s.trim());
        if (key && value) {
          query = query.eq(key, value);
        }
      }
    }
    
    const { data: result, error } = await query.select();
    
    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    }
    
    return { 
      content: [{ type: "text", text: `Updated ${result?.length} row(s)` }],
      structuredContent: { updated: result }
    };
  }
);

server.registerTool(
  "supabase_delete",
  {
    title: "Delete Row",
    description: "Delete rows from a table",
    inputSchema: z.object({
      table: z.string().describe("Table name"),
      filters: z.string().describe("WHERE clause conditions")
    })
  },
  async ({ table, filters }) => {
    let query = supabase.from(table).delete();
    
    if (filters) {
      const filterParts = filters.split(",").map(f => f.trim());
      for (const part of filterParts) {
        const [key, value] = part.split("=").map(s => s.trim());
        if (key && value) {
          query = query.eq(key, value);
        }
      }
    }
    
    const { data, error } = await query.select();
    
    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    }
    
    return { 
      content: [{ type: "text", text: `Deleted ${data?.length} row(s)` }],
      structuredContent: { deleted: data }
    };
  }
);

server.registerTool(
  "supabase_table_info",
  {
    title: "Get Table Info",
    description: "Get column information for a table",
    inputSchema: z.object({
      table: z.string().describe("Table name")
    })
  },
  async ({ table }) => {
    const { data, error } = await supabase
      .from("information_schema.columns")
      .select("*")
      .eq("table_schema", "public")
      .eq("table_name", table);
    
    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    }
    
    const cols = (data || []).map((c: any) => `${c.column_name} (${c.data_type})`).join(", ");
    return { 
      content: [{ type: "text", text: `Columns: ${cols}` }],
      structuredContent: { columns: data }
    };
  }
);

server.registerTool(
  "supabase_health",
  {
    title: "Health Check",
    description: "Check Supabase connection health",
    inputSchema: z.object({})
  },
  async () => {
    const { data, error } = await supabase.from("brands").select("id").limit(1);
    
    if (error) {
      return { content: [{ type: "text", text: `Unhealthy: ${error.message}` }] };
    }
    
    return { content: [{ type: "text", text: "Healthy: Connected to Supabase" }] };
  }
);

async function runStdio() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Supabase MCP server running via stdio");
}

runStdio().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
