import TroubleshootingUtility from './troubleshooting';

class MCPClient {
    constructor() {
        this.troubleshooter = new TroubleshootingUtility();
        this.eventSource = null;
        this.baseUrl = 'http://127.0.0.1:7862'; // Using your specific port
        this.connected = false;
    }

    async connect() {
        try {
            if (this.eventSource) {
                this.eventSource.close();
            }

            this.eventSource = new EventSource(`${this.baseUrl}/api/v1/mcp/sse`);
            await this.setupEventListeners();
            await this.troubleshooter.logAction('MCP Connection', 'Established SSE connection');
        } catch (error) {
            await this.troubleshooter.logError('MCP Connection Failed', error);
            throw error;
        }
    }

    async setupEventListeners() {
        this.eventSource.onopen = async () => {
            this.connected = true;
            await this.troubleshooter.logAction('SSE Connection', 'Connection opened');
        };

        this.eventSource.onerror = async (error) => {
            this.connected = false;
            await this.troubleshooter.logError('SSE Connection Error', error);
            await this.troubleshooter.attemptRecovery({
                type: 'ConnectionError',
                error
            });
        };

        this.eventSource.addEventListener('tool_call', async (event) => {
            try {
                const data = JSON.parse(event.data);
                await this.troubleshooter.logAction('Tool Call Received', data);
                // Handle tool execution here
            } catch (error) {
                await this.troubleshooter.logError('Tool Call Processing Error', error);
            }
        });
    }

    async disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.connected = false;
            await this.troubleshooter.logAction('MCP Connection', 'Disconnected');
        }
    }

    isConnected() {
        return this.connected;
    }

    // Method to handle tool calls
    async handleToolCall(toolName, params) {
        try {
            await this.troubleshooter.logAction('Tool Call', { toolName, params });
            // Implement tool call handling logic here
            return { success: true, result: 'Tool call handled' };
        } catch (error) {
            await this.troubleshooter.logError('Tool Call Failed', error);
            throw error;
        }
    }
}

export default MCPClient;