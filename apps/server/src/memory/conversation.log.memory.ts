export type ConversationLog = {
  id: string;
  conversationId: string;
  customerId: string;
  message: string;
  reply: string;
  createdAt: string;
};

const MAX_LOGS = 200;

const logs: ConversationLog[] = [];

export function logTurn(
  conversationId: string,
  customerId: string,
  message: string,
  reply: string,
): ConversationLog {
  const id = `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const entry: ConversationLog = {
    id,
    conversationId,
    customerId,
    message,
    reply,
    createdAt: new Date().toISOString(),
  };

  logs.push(entry);

  if (logs.length > MAX_LOGS) {
    logs.splice(0, logs.length - MAX_LOGS);
  }

  return entry;
}

export function getRecentLogs(limit: number): ConversationLog[] {
  const result = [...logs];
  result.reverse();
  return result.slice(0, limit);
}