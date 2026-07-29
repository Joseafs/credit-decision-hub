import {
  createCustomerSchema,
  customerIdParamsSchema,
  listCustomersQuerySchema,
} from "@credit-decision-hub/contracts";
import type { FastifyPluginAsync } from "fastify";

import { toValidationErrorResponse } from "../../shared/http/validation-error.js";
import {
  CustomerConflictError,
  CustomerNotFoundError,
} from "./customer.errors.js";
import type { CustomerService } from "./customer.service.js";

type CustomerRoutesOptions = {
  customerService: CustomerService;
};

export const customerRoutes: FastifyPluginAsync<CustomerRoutesOptions> = async (
  app,
  { customerService },
) => {
  app.post("/customers", async (request, reply) => {
    const input = createCustomerSchema.safeParse(request.body);

    if (!input.success) {
      return reply.status(400).send(toValidationErrorResponse(input.error));
    }

    try {
      const customer = await customerService.create(input.data);

      return reply.status(201).send(customer);
    } catch (error) {
      if (error instanceof CustomerConflictError) {
        return reply.status(409).send({ message: error.message });
      }

      throw error;
    }
  });

  app.get("/customers", async (request, reply) => {
    const query = listCustomersQuerySchema.safeParse(request.query);

    if (!query.success) {
      return reply.status(400).send(toValidationErrorResponse(query.error));
    }

    return reply.status(200).send(await customerService.list(query.data));
  });

  app.get("/customers/:id", async (request, reply) => {
    const params = customerIdParamsSchema.safeParse(request.params);

    if (!params.success) {
      return reply.status(400).send(toValidationErrorResponse(params.error));
    }

    try {
      const customer = await customerService.getById(params.data.id);

      return reply.status(200).send(customer);
    } catch (error) {
      if (error instanceof CustomerNotFoundError) {
        return reply.status(404).send({ message: error.message });
      }

      throw error;
    }
  });
};
