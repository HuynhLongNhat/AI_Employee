export type AutomationLog = {
  id: string;
  name: string;
  triggeredBy: string;
  result: string;
  createdAt: string;
};

const MAX_LOGS = 100;

const logs: AutomationLog[] = [];

export function logAutomation(
  name: string,
  triggeredBy: string,
  result: string,
): AutomationLog {
  const id = `AUTO-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const entry: AutomationLog = {
    id,
    name,
    triggeredBy,
    result,
    createdAt: new Date().toISOString(),
  };

  logs.push(entry);

  if (logs.length > MAX_LOGS) {
    logs.splice(0, logs.length - MAX_LOGS);
  }

  return entry;
}

export function getRecentAutomationLogs(
  limit: number,
): AutomationLog[] {
  const result = [...logs];
  result.reverse();
  return result.slice(0, limit);
}