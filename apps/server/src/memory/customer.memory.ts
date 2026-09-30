const customers = new Map<
  string,
  {
    name?: string;
  }
>();

export function getCustomer(customerId: string) {
  let customer = customers.get(customerId);

  if (!customer) {
    customer = {};
    customers.set(customerId, customer);
  }

  return customer;
}

export function updateCustomer(
  customerId: string,
  data: {
    name?: string;
  },
) {
  const customer = customers.get(customerId) ?? {};

  customers.set(customerId, {
    ...customer,
    ...data,
  });
}

export function getAllCustomers() {
  return Array.from(customers.entries())
    .map(([customerId, data]) => ({
      customerId,
      name: data.name,
    }))
    .sort((a, b) => a.customerId.localeCompare(b.customerId));
}