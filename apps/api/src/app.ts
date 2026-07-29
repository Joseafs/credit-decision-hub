import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from "fastify";

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

  app.register(healthRoute);
  app.register(customerRoutes, { customerService });
  app.register(proposalRoutes, { proposalService });

  return app;
};
