/**
 * GCP Notification Tools
 * 
 * Tools for sending notifications and alerts.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  NotifyInputSchema,
  ResponseFormat
} from "../schemas/index.js";
import axios from "axios";

/**
 * Register all Notification tools with the MCP server
 */
export function registerNotificationTools(server: McpServer): void {
  
  // ========================================
  // Tool: gcp_notify
  // ========================================
  server.registerTool(
    "gcp_notify",
    {
      title: "Send Notification",
      description: "Sends a notification or alert to the configured channels (e.g., Telegram, Console).",
      inputSchema: NotifyInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (params) => {
      try {
        const { message, type, channel } = params;
        const timestamp = new Date().toISOString();
        const formattedMessage = `[GCP ALERT] [${type.toUpperCase()}]\n${message}`;

        let notificationStatus = "Logged to console";

        if (channel === "telegram") {
          const botToken = process.env.TELEGRAM_BOT_TOKEN;
          const chatId = process.env.TELEGRAM_CHAT_ID || "1049458877";

          if (botToken) {
            try {
              await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                chat_id: chatId,
                text: formattedMessage,
                parse_mode: "Markdown"
              });
              notificationStatus = "Sent via Telegram";
            } catch (tgError) {
              console.error("Telegram notification failed:", tgError);
              notificationStatus = "Failed to send via Telegram, logged to console";
            }
          } else {
            notificationStatus = "Telegram token missing, logged to console";
          }
        }

        console.error(`[${timestamp}] ${formattedMessage}`);

        const result = {
          success: true,
          status: notificationStatus,
          message: message,
          channel: channel,
          timestamp: timestamp
        };

        if (params.responseFormat === ResponseFormat.JSON) {
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          };
        }

        return {
          content: [{ type: "text", text: `Notification handled: ${notificationStatus}\nMessage: ${message}` }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error sending notification: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );
}
