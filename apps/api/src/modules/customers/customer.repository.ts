import {
  customerSchema,
  type CreateCustomerInput,
  type Customer,
  type ListCustomersQuery,
} from "@credit-decision-hub/contracts";
import type { HydratedDocument } from "mongoose";

import { CustomerConflictError } from "./customer.errors.js";
import { CustomerModel, type CustomerPersistence } from "./customer.model.js";

type CustomerPage = {
  data: Customer[];
  total: number;
};

type CustomerIdentity = Pick<CreateCustomerInput, "document" | "email">;

export type CustomerRepository = {
  create(input: CreateCustomerInput): Promise<Customer>;
  existsByDocumentOrEmail(identity: CustomerIdentity): Promise<boolean>;
  findById(id: string): Promise<Customer | null>;
  findPage(query: ListCustomersQuery): Promise<CustomerPage>;
};

const toCustomer = (
  document: HydratedDocument<CustomerPersistence>,
): Customer =>
  customerSchema.parse({
    id: document._id.toString(),
    name: document.name,
    document: document.document,
    email: document.email,
    phone: document.phone,
    monthlyIncome: document.monthlyIncome,
    occupation: document.occupation,
    createdAt: document.createdAt.toISOString(),
  });

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === 11_000;

export const customerRepository: CustomerRepository = {
  async create(input) {
    try {
      const customer = await CustomerModel.create(input);

      return toCustomer(customer);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new CustomerConflictError();
      }

      throw error;
    }
  },

  async existsByDocumentOrEmail({ document, email }) {
    const customer = await CustomerModel.exists({
      $or: [{ document }, { email }],
    });

    return customer !== null;
  },

  async findById(id) {
    const customer = await CustomerModel.findById(id).exec();

    return customer ? toCustomer(customer) : null;
  },

  async findPage({ page, limit }) {
    const skip = (page - 1) * limit;
    const [customers, total] = await Promise.all([
      CustomerModel.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      CustomerModel.countDocuments().exec(),
    ]);

    return {
      data: customers.map(toCustomer),
      total,
    };
  },
};
