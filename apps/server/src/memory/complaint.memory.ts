export type Complaint = {
  id: string;
  customerId: string;
  content: string;
  status: 'open';
  createdAt: string;
};

const complaints = new Map<string, Complaint>();

export function createComplaint(
  customerId: string,
  content: string,
): Complaint {
  const id = `CMP-${Date.now()}`;

  const complaint: Complaint = {
    id,
    customerId,
    content,
    status: 'open',
    createdAt: new Date().toISOString(),
  };

  complaints.set(id, complaint);

  return complaint;
}

export function getComplaint(id: string): Complaint | undefined {
  return complaints.get(id);
}