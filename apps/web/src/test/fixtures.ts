import type { Customer } from "@credit-decision-hub/contracts";

export const customerFixture: Customer = {
  id: "650000000000000000000001",
  name: "Marina Costa",
  document: "FAKE-000001",
  email: "marina.costa@example.test",
  phone: "+55 11 90000-0000",
  monthlyIncome: 8_500,
  occupation: "Analista de sistemas",
  createdAt: "2026-07-29T12:00:00.000Z",
};
