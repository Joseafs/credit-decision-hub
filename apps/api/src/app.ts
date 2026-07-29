import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from "fastify";
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

import { customerRepository } from "./modules/customers/customer.repository.js";
import { customerRoutes } from "./modules/customers/customer.routes.js";
import {
  createCustomerService,
  type CustomerService,
} from "./modules/customers/customer.service.js";
import { proposalRepository } from "./modules/proposals/proposal.repository.js";
import { proposalRoutes } from "./modules/proposals/proposal.routes.js";
import {
  createProposalService,
  type ProposalService,
} from "./modules/proposals/proposal.service.js";
import { healthRoute } from "./routes/health/health.route.js";
import { toValidationErrorResponse } from "./shared/http/validation-error.js";
import { registerOpenApi } from "./shared/openapi/openapi.js";

type BuildAppOptions = FastifyServerOptions & {
  customerService?: CustomerService;
  proposalService?: ProposalService;
};

export const buildApp = ({
  customerService = createCustomerService(customerRepository),
  proposalService = createProposalService({
    customerReader: customerRepository,
    repository: proposalRepository,
  }),
  ...fastifyOptions
}: BuildAppOptions = {}): FastifyInstance => {
  const app = Fastify(fastifyOptions);

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler((error, _request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply
        .status(400)
        .send(toValidationErrorResponse(error.validation));
    }

    return reply.send(error);
  });

  registerOpenApi(app);
  app.register(healthRoute);
  app.register(customerRoutes, { customerService });
  app.register(proposalRoutes, { proposalService });

  return app;
};
