export type ToolFunction = (args: any) => Promise<string> | string;

export interface Tool {
  definition: {
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
      };
    };
  };
  handler: ToolFunction;
}

const registry: Map<string, Tool> = new Map();

export function registerTool(tool: Tool) {
  registry.set(tool.definition.function.name, tool);
}

export function getTool(name: string) {
  return registry.get(name);
}

export function getAllToolDefinitions() {
  return Array.from(registry.values()).map(t => t.definition);
}

// Initial Tool: get_current_time
registerTool({
  definition: {
    type: 'function',
    function: {
      name: 'get_current_time',
      description: 'Get the current date and time.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  handler: () => {
    return new Date().toLocaleString('fr-FR', {
      timeZone: 'Europe/Paris',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  },
});
