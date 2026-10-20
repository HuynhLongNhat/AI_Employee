export type ConversationLog = {
  id: string;
  businessId: string; // THÊM TRƯỜNG NÀY
  conversationId: string;
  customerId: string;
  message: string;
  reply: string;
  createdAt: string;
};

const MAX_LOGS = 200;

const logs: ConversationLog[] = [];

// Thêm businessId vào tham số đầu tiên
export function logTurn(
  businessId: string,
  conversationId: string,
  customerId: string,
  message: string,
  reply: string,
): ConversationLog {
  const id = `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const entry: ConversationLog = {
    id,
    businessId,
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

// Cần thêm businessId để lọc log của từng Bot
export function getRecentLogs(businessId: string, limit: number): ConversationLog[] {
  const result = logs.filter((l) => l.businessId === businessId);
  result.reverse();
  return result.slice(0, limit);
}