export type ToolName = "create_order";

export type ToolHandler<A = any, R = any> = (args: A) => R;

const tools = new Map<ToolName, ToolHandler>();

export function registerTool(name: ToolName, handler: ToolHandler): void {
  tools.set(name, handler);
}

export function hasTool(name: string): name is ToolName {
  return tools.has(name as ToolName);
}

export function callTool<R = any>(name: ToolName, args: any): R {
  const handler = tools.get(name);

  if (!handler) {
    throw new Error(`Tool not found: ${name}`);
  }

  return handler(args) as R;
}

export type SafeToolResult<R> =
  | { ok: true; result: R }
  | { ok: false; error: string };

export function safeCallTool<R = any>(
  name: ToolName,
  args: any,
): SafeToolResult<R> {
  try {
    const result = callTool<R>(name, args);

    return { ok: true, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    console.error(`[TOOL ERROR] ${name}:`, err);

    return { ok: false, error: message };
  }
}
