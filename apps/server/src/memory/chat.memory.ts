const conversations = new Map<string, string[]>();

export function getConversation(conversationId: string) {
  return conversations.get(conversationId) ?? [];
}

export function addMessage(
  conversationId: string,
  message: string,
) {
  const history = getConversation(conversationId);

  history.push(message);

  conversations.set(conversationId, history);
}