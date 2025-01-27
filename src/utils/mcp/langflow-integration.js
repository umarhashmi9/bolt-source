import MCPClient from './mcp-client';

class LangflowMCPIntegration {
    constructor() {
        this.mcpClient = new MCPClient();
        this.toolHandlers = new Map();
    }

    async initialize() {
        try {
            await this.mcpClient.connect();
            this.registerDefaultToolHandlers();
            return true;
        } catch (error) {
            console.error('Failed to initialize MCP integration:', error);
            return false;
        }
    }

    registerDefaultToolHandlers() {
        // Register handlers for your specific tools
        this.registerToolHandler('puppeteer_screenshot', async (params) => {
            // Implement screenshot handling
            return await this.mcpClient.handleToolCall('puppeteer_screenshot', params);
        });

        this.registerToolHandler('puppeteer_navigate', async (params) => {
            // Implement navigation handling
            return await this.mcpClient.handleToolCall('puppeteer_navigate', params);
        });

        // Add more tool handlers as needed
    }

    registerToolHandler(toolName, handler) {
        this.toolHandlers.set(toolName, handler);
    }

    async handleToolCall(toolName, params) {
        const handler = this.toolHandlers.get(toolName);
        if (handler) {
            return await handler(params);
        }
        throw new Error(`No handler registered for tool: ${toolName}`);
    }

    // Method to expose tools to Langflow
    getLangflowTools() {
        return Array.from(this.toolHandlers.keys()).map(toolName => ({
            name: toolName,
            description: `MCP tool: ${toolName}`,
            parameters: {
                type: 'object',
                properties: {}  // Define tool-specific parameters
            }
        }));
    }

    async cleanup() {
        await this.mcpClient.disconnect();
    }
}

// Export a singleton instance
const mcpIntegration = new LangflowMCPIntegration();
export default mcpIntegration;