import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { getAppInfo, deployApp, runShopifyCommand } from "./shopify-cli.js";
import path from "path";

const server = new Server(
  {
    name: "shopify-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const LinkAppSchema = z.object({
  appPath: z.string().describe("Absolute path to the Shopify app directory"),
});

const DeployAppSchema = z.object({
  appPath: z.string().describe("Absolute path to the Shopify app directory"),
});

const SyncUrlsSchema = z.object({
  appPath: z.string().describe("Absolute path to the Shopify app directory"),
  applicationUrl: z.string().url().optional(),
  redirectUrls: z.array(z.string().url()).optional(),
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "link_app",
        description: "Links local code to a Shopify app and gets app info",
        inputSchema: {
          type: "object",
          properties: {
            appPath: { type: "string", description: "Absolute path to the Shopify app directory" },
          },
          required: ["appPath"],
        },
      },
      {
        name: "deploy_app",
        description: "Deploys app configuration and code to Shopify",
        inputSchema: {
          type: "object",
          properties: {
            appPath: { type: "string", description: "Absolute path to the Shopify app directory" },
          },
          required: ["appPath"],
        },
      },
      {
        name: "sync_app_urls",
        description: "Updates app URLs in the Shopify Partner Dashboard",
        inputSchema: {
          type: "object",
          properties: {
            appPath: { type: "string", description: "Absolute path to the Shopify app directory" },
            applicationUrl: { type: "string", description: "Main application URL" },
            redirectUrls: { type: "array", items: { type: "string" }, description: "List of redirect URLs" },
          },
          required: ["appPath"],
        },
      },
      {
        name: "get_install_url",
        description: "Generates a Shopify app installation URL",
        inputSchema: {
          type: "object",
          properties: {
            appPath: { type: "string", description: "Absolute path to the Shopify app directory" },
            storeDomain: { type: "string", description: "The .myshopify.com domain of the development store" },
          },
          required: ["appPath", "storeDomain"],
        },
      },
      {
        name: "prepare_staging",
        description: "Comprehensive staging: sets URLs and deploys app config",
        inputSchema: {
          type: "object",
          properties: {
            appPath: { type: "string", description: "Absolute path to the Shopify app directory" },
            applicationUrl: { type: "string", description: "Main application URL (e.g. Netlify URL)" },
          },
          required: ["appPath", "applicationUrl"],
        },
      },
    ],
  };
});

const GetInstallUrlSchema = z.object({
  appPath: z.string().describe("Absolute path to the Shopify app directory"),
  storeDomain: z.string().describe("The .myshopify.com domain of the development store"),
});

const PrepareStagingSchema = z.object({
  appPath: z.string().describe("Absolute path to the Shopify app directory"),
  applicationUrl: z.string().url().describe("Main application URL (e.g. Netlify URL)"),
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "link_app": {
        const { appPath } = LinkAppSchema.parse(args);
        const info = await getAppInfo(appPath);
        return {
          content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
        };
      }

      case "deploy_app": {
        const { appPath } = DeployAppSchema.parse(args);
        const result = await deployApp(appPath);
        return {
          content: [{ type: "text", text: `Deployment result:\nSTDOUT: ${result.stdout}\nSTDERR: ${result.stderr}` }],
        };
      }

      case "sync_app_urls": {
        const { appPath, applicationUrl, redirectUrls } = SyncUrlsSchema.parse(args);
        let cmd = "app config push";
        if (applicationUrl) cmd += ` --url ${applicationUrl}`;
        if (redirectUrls && redirectUrls.length > 0) {
          cmd += ` --redirect-urls ${redirectUrls.join(",")}`;
        }
        const result = await runShopifyCommand(cmd, appPath);
        return {
          content: [{ type: "text", text: `Sync result:\nSTDOUT: ${result.stdout}\nSTDERR: ${result.stderr}` }],
        };
      }

      case "get_install_url": {
        const { appPath, storeDomain } = GetInstallUrlSchema.parse(args);
        const info = await getAppInfo(appPath);
        const apiKey = info.app.apiKey;
        // Standard Shopify install URL format
        const installUrl = `https://${storeDomain}/admin/oauth/authorize?client_id=${apiKey}&scope=${info.app.scopes || ""}&redirect_uri=${info.app.redirectUrls?.[0] || ""}`;
        return {
          content: [{ type: "text", text: `Installation URL: ${installUrl}` }],
        };
      }

      case "prepare_staging": {
        const { appPath, applicationUrl } = PrepareStagingSchema.parse(args);
        
        // 1. Sync URLs
        const syncResult = await runShopifyCommand(`app config push --url ${applicationUrl}`, appPath);
        
        // 2. Deploy
        const deployResult = await deployApp(appPath);

        return {
          content: [{ 
            type: "text", 
            text: `Staging Preparation Complete.\n\nSync Result:\n${syncResult.stdout}\n\nDeploy Result:\n${deployResult.stdout}` 
          }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Shopify MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
