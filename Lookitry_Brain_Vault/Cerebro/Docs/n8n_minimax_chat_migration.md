# n8n Workflow Changes: Anthropic to MiniMax Migration & Supabase Integration

As part of the `implementacion-chat-agente-minimax-admin` feature, the n8n workflows handling WhatsApp/Chat messages must be manually updated. Due to lack of direct MCP access to n8n, please apply these changes manually through the n8n UI at `https://n8n.wilkiedevs.com`.

## 1. LLM Provider Replacement (Anthropic to MiniMax)

1. **Locate the Chat Processing Workflow**: Open the workflow that currently processes incoming messages (e.g., the webhook handler for WhatsApp).
2. **Remove Anthropic Nodes**: Identify all nodes using the Anthropic API (e.g., Claude 3 models).
3. **Add OpenRouter Nodes**: 
   - Add a new "HTTP Request" node or use the official "OpenRouter" integration if available.
   - Configure the connection to use the `OPENROUTER_API_KEY`.
   - Set the Base URL to `https://openrouter.ai/api/v1/chat/completions`.
   - **Model Selection**: Set the model to `minimax/MiniMax-M2.7` (or the exact OpenRouter ID for the MiniMax model).
4. **Update Prompts**: Ensure the prompts are compatible with MiniMax. You may need to adjust system prompts, as different models react differently to specific instructions.

## 2. Database Integration (Google Sheets to Supabase)

1. **Remove Google Sheets Nodes**: Locate any Google Sheets nodes used for logging conversations or leads.
2. **Add Supabase Nodes**:
   - Add Supabase "Insert" or "Update" nodes to replace the Google Sheets functionality.
   - Configure the connection using `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.
3. **Map Data to New Tables**:
   - **`lead_conversations`**: When a new conversation starts, check if a conversation exists for the given `platform_id`. If not, insert a new record.
   - **`lead_messages`**: Insert every incoming (lead) and outgoing (bot) message into this table. Map the WhatsApp sender ID to `platform_id` to find the correct `conversation_id`.
   - Set `sender_type` to `'lead'` for incoming messages, and `'bot'` for AI-generated replies.
   - **`lead_attachments`**: If the webhook receives images/audio, save the URLs to this table linked to the `message_id`.

## 3. Webhook Updates (Optional but Recommended)

If the webhook currently hits n8n directly, consider changing the architecture so the WhatsApp Gateway hits the backend (`POST /api/chat/webhook`) first, which then triggers n8n via a clean, structured payload. This ensures all messages are saved to the database immediately before AI processing begins, improving reliability.