import {
  apiErrorResponseSchema,
  createCustomerSchema,
  customerIdParamsSchema,
  customerListResponseSchema,
  customerSchema,
  listCustomersQuerySchema,
} from "@credit-decision-hub/contracts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import {
  customerConflictExample,
  customerExample,
  customerInputExample,
  customerListExample,
} from "../../shared/openapi/examples.js";
import {
  documentedCustomerNotFoundSchema,
  documentedValidationErrorSchema,
} from "../../shared/openapi/http-error.schemas.js";
import {
  CustomerConflictError,
  CustomerNotFoundError,
} from "./customer.errors.js";
import type { CustomerService } from "./customer.service.js";

type CustomerRoutesOptions = {
  customerService: CustomerService;
  protectedRoutes?: boolean;
};

const documentedCreateCustomerSchema = createCustomerSchema.meta({
  description: "Dados do cliente fictício",
  examples: [customerInputExample],
});
const documentedCustomerSchema = customerSchema.meta({
  description: "Cliente cadastrado",
  examples: [customerExample],
});
const documentedCustomerListSchema = customerListResponseSchema.meta({
  description: "Página de clientes",
  examples: [customerListExample],
});
const documentedCustomerConflictSchema = apiErrorResponseSchema.meta({
  description: "Documento ou e-mail já cadastrado",
  examples: [customerConflictExample],
});

export const customerRoutes: FastifyPluginAsyncZod<
  CustomerRoutesOptions
> = async (app, { customerService, protectedRoutes = false }) => {
  app.post(
    "/customers",
    {
      ...(protectedRoutes ? { onRequest: app.authenticate } : {}),
      schema: {
        tags: ["Clientes"],
        summary: "Cadastrar cliente",
        description: "Cria um cliente usando somente dados fictícios.",
        operationId: "createCustomer",
        body: documentedCreateCustomerSchema,
        response: {
          201: documentedCustomerSchema,
          400: documentedValidationErrorSchema,
          409: documentedCustomerConflictSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const customer = await customerService.create(request.body);

        return reply.status(201).send(customer);
      } catch (error) {
        if (error instanceof CustomerConflictError) {
          return reply.status(409).send({ message: error.message });
        }

        throw error;
      }
    },
  );

  app.get(
    "/customers",
    {
      ...(protectedRoutes ? { onRequest: app.authenticate } : {}),
      schema: {
        tags: ["Clientes"],
        summary: "Listar clientes",
        description:
          "Retorna clientes ordenados do mais recente ao mais antigo.",
        operationId: "listCustomers",
        querystring: listCustomersQuerySchema.meta({
          examples: [{ page: 1, limit: 20 }],
        }),
        response: {
          200: documentedCustomerListSchema,
          400: documentedValidationErrorSchema,
        },
      },
    },
    async (request, reply) =>
      reply.status(200).send(await customerService.list(request.query)),
  );

  app.get(
    "/customers/:id",
    {
      ...(protectedRoutes ? { onRequest: app.authenticate } : {}),
      schema: {
        tags: ["Clientes"],
        summary: "Consultar cliente",
        description: "Retorna um cliente pelo identificador.",
        operationId: "getCustomerById",
        params: customerIdParamsSchema.meta({
          examples: [{ id: customerExample.id }],
        }),
        response: {
          200: documentedCustomerSchema,
          400: documentedValidationErrorSchema,
          404: documentedCustomerNotFoundSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const customer = await customerService.getById(request.params.id);

        return reply.status(200).send(customer);
      } catch (error) {
        if (error instanceof CustomerNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }

        throw error;
      }
    },
  );
};
