# MCP Tools Integration for Langflow

This integration enables the use of MCP (Machine Control Protocol) tools within Langflow, providing additional capabilities through SSE (Server-Sent Events) connections.

## Setup

1. **Installation**
   ```bash
   npm install
   ```

2. **Initialize MCP Integration**
   ```javascript
   import mcpIntegration from './utils/mcp/langflow-integration';
   
   // Initialize the integration
   await mcpIntegration.initialize();
   ```

## Features

- SSE-based tool communication
- Automatic error handling and recovery
- Comprehensive logging system
- Tool call management
- Langflow integration utilities

## Components

### 1. TroubleshootingUtility
Handles error logging, analysis, and recovery:
```javascript
const troubleshooter = new TroubleshootingUtility();
await troubleshooter.logAction('event', details);
```

### 2. MCPClient
Manages SSE connections and tool calls:
```javascript
const client = new MCPClient();
await client.connect();
```

### 3. LangflowIntegration
Connects MCP tools with Langflow:
```javascript
const tools = mcpIntegration.getLangflowTools();
```

## Usage Examples

1. **Register a New Tool**
   ```javascript
   mcpIntegration.registerToolHandler('custom_tool', async (params) => {
     // Tool implementation
     return result;
   });
   ```

2. **Handle Tool Calls**
   ```javascript
   const result = await mcpIntegration.handleToolCall('tool_name', params);
   ```

3. **Error Handling**
   ```javascript
   try {
     await mcpIntegration.handleToolCall('tool_name', params);
   } catch (error) {
     // Error will be automatically logged
     console.error('Tool call failed:', error);
   }
   ```

## Logging

Logs are stored in:
- Error logs: `./logs/troubleshooting_logs/`
- Screenshots: `./logs/screenshots/`

## Error Recovery

The system automatically attempts to recover from common errors:
1. Connection errors - Automatic reconnection
2. Timeout errors - Retry with backoff
3. Tool execution errors - Error logging and reporting

## Best Practices

1. Always initialize the integration before use
2. Register tool handlers during setup
3. Monitor logs for issues
4. Clean up resources when done

## Maintenance

1. Regular log analysis:
   ```javascript
   const analysis = await troubleshooter.analyzeErrors('24h');
   ```

2. Clean up:
   ```javascript
   await mcpIntegration.cleanup();
   ```

## Contributing

1. Create a feature branch
2. Add tests for new functionality
3. Update documentation
4. Submit a pull request

## Troubleshooting

Common issues and solutions:

1. Connection Failed
   - Check if Langflow is running
   - Verify port settings
   - Check network connectivity

2. Tool Execution Failed
   - Check tool parameters
   - Verify tool handler registration
   - Check logs for details

## Support

For issues and feature requests, please create an issue in the repository.