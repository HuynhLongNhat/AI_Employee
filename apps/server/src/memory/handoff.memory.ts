export type Handoff = {
  id: string;
  customerId: string;
  conversationId: string;
  status: 'requested';
  createdAt: string;
};

const handoffs = new Map<string, Handoff>();

export function createHandoff(
  customerId: string,
  conversationId: string,
): Handoff {
  const id = `HOF-${Date.now()}`;

  const handoff: Handoff = {
    id,
    customerId,
    conversationId,
    status: 'requested',
    createdAt: new Date().toISOString(),
  };

  handoffs.set(id, handoff);

  return handoff;
}

export function getHandoff(id: string): Handoff | undefined {
  return handoffs.get(id);
}