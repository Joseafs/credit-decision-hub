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
import { healthRoute } from "./routes/health/health.route.js";

type BuildAppOptions = FastifyServerOptions & {
  customerService?: CustomerService;
};

export const buildApp = ({
  customerService = createCustomerService(customerRepository),
  ...fastifyOptions
}: BuildAppOptions = {}): FastifyInstance => {
  const app = Fastify(fastifyOptions);

  app.register(healthRoute);
  app.register(customerRoutes, { customerService });

  return app;
};
