export type Reservation = {
  id: string;
  customerId: string;
  people: number;
  time: string;
  status: 'pending';
  createdAt: string;
};

const reservations = new Map<string, Reservation>();

export function createReservation(
  customerId: string,
  people: number,
  time: string,
): Reservation {
  const id = `RES-${Date.now()}`;

  const reservation: Reservation = {
    id,
    customerId,
    people,
    time,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  reservations.set(id, reservation);

  return reservation;
}

export function getReservation(id: string): Reservation | undefined {
  return reservations.get(id);
}