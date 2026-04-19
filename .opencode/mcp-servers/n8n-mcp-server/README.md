# lookitry-n8n-mcp-server

MCP server for n8n workflow management - allows creating, editing and monitoring workflows in n8n.wilkiedevs.com

## Tools

| Tool | Description |
|------|-------------|
| `n8n_list_workflows` | List all workflows with pagination and status filter |
| `n8n_get_workflow` | Get a specific workflow by ID with full structure |
| `n8n_create_workflow` | Create a new workflow |
| `n8n_update_workflow` | Update an existing workflow |
| `n8n_delete_workflow` | Delete a workflow permanently |
| `n8n_activate_workflow` | Activate or deactivate a workflow |
| `n8n_test_workflow` | Run a workflow in test mode |
| `n8n_get_workflow_executions` | Get execution history for a workflow |
| `n8n_add_node_to_workflow` | Add a new node to an existing workflow |
| `n8n_get_tags` | List all tags |
| `n8n_create_tag` | Create a new tag |
| `n8n_tag_workflow` | Add a tag to a workflow |
| `n8n_get_workflows_by_tag` | Get all workflows with a specific tag |

## Setup

```bash
npm install
npm run build
```

## Usage

Requires `N8N_API_KEY` environment variable with the n8n API key.

```bash
N8N_API_KEY=your_key node dist/index.js
```

## OpenCode Configuration

Add to `opencode.json`:

```json
{
  "mcp": {
    "n8n": {
      "type": "local",
      "command": ["node", "path/to/dist/index.js"],
      "enabled": true,
      "environment": {
        "N8N_BASE_URL": "https://n8n.wilkiedevs.com",
        "N8N_API_KEY": "your_api_key"
      }
    }
  }
}
```
